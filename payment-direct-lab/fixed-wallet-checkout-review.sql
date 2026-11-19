-- REVIEW / STAGING ONLY. Extends the existing private order model for fixed receiving wallets.
-- Never install in production until the real finance adapter, member authentication, and
-- master approval path have passed end-to-end tests. No real addresses in this file.
BEGIN;
-- Replace only the two allocation check constraints from database-bridge-review.sql.
DO $$
DECLARE c record; n integer:=0;
BEGIN
 FOR c IN SELECT conname,pg_get_constraintdef(oid) AS def FROM pg_constraint
 WHERE conrelid='betinsight_pay_private.orders'::regclass AND contype='c'
 LOOP
  IF c.def LIKE '%allocation_kind%' THEN
   EXECUTE format('ALTER TABLE betinsight_pay_private.orders DROP CONSTRAINT %I',c.conname);
   n:=n+1;
  END IF;
 END LOOP;
 IF n<>2 THEN RAISE EXCEPTION 'ORDER_SCHEMA_CHANGED'; END IF;
END $$;
ALTER TABLE betinsight_pay_private.orders ADD CONSTRAINT pay_fixed_allocation_kind
 CHECK ((network='XRPL' AND allocation_kind='xrpl-tag' AND destination_tag BETWEEN 1 AND 4294967295 AND destination_tag IS NOT NULL)
 OR (network<>'XRPL' AND allocation_kind IN('unique-address','shared-address') AND destination_tag IS NULL));
-- Lifetime non-reuse. Never recycle amounts after expiry: a late payer may still use them.
CREATE UNIQUE INDEX pay_shared_amount_once ON betinsight_pay_private.orders
 (network,canonical_recipient,asset_identity,quote_raw) WHERE allocation_kind='shared-address';
CREATE TABLE betinsight_pay_private.fixed_wallet_versions (
 network text NOT NULL CHECK(network IN('ETHEREUM','BSC','POLYGON','TRON','SOLANA','BITCOIN','LITECOIN','BITCOINCASH','XRPL')),
 version integer NOT NULL CHECK(version>0),
 recipient text NOT NULL CHECK(length(recipient)>0),
 active boolean NOT NULL DEFAULT false,
 owner_confirmation_reference text NOT NULL CHECK(length(owner_confirmation_reference)>0),
 frozen boolean NOT NULL DEFAULT true,
 PRIMARY KEY(network,version)
);
CREATE UNIQUE INDEX pay_fixed_one_active ON betinsight_pay_private.fixed_wallet_versions(network) WHERE active;
ALTER TABLE betinsight_pay_private.fixed_wallet_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.fixed_wallet_versions FROM PUBLIC,anon,authenticated,service_role;
-- p_base_raw / p_increment_raw / p_max_offset are derived by the trusted quote adapter.
-- The adapter must enforce displayed precision and maximum EUR markup, and bind the exact mainnet asset.
-- Fixed address reservations use a bounded search, serialized per recipient + asset.
CREATE FUNCTION betinsight_pay_private.reserve_fixed_order(
 p_member text,p_email text,p_package text,p_snapshot jsonb,p_units numeric,p_price numeric,
 p_network text,p_asset text,p_identity text,p_base_raw numeric,p_decimals integer,
 p_eur numeric,p_usd numeric,p_rate_at timestamptz,p_expires timestamptz,p_key text,
 p_increment_raw numeric,p_max_offset integer
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE w betinsight_pay_private.fixed_wallet_versions%ROWTYPE;
 o betinsight_pay_private.orders%ROWTYPE; raw numeric; tag bigint; result_id uuid; t timestamptz;
BEGIN
 IF p_member IS NULL OR length(btrim(p_member))=0 OR p_email IS NULL OR p_email<>lower(btrim(p_email)) OR length(p_email)=0
 OR p_key IS NULL OR length(btrim(p_key))=0 THEN RAISE EXCEPTION 'MEMBER_BINDING_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array(p_member,p_key)::text,0));
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE member_id=p_member AND idempotency_key=p_key;
 IF FOUND THEN
  IF o.email IS DISTINCT FROM p_email OR o.package_code IS DISTINCT FROM p_package OR o.network IS DISTINCT FROM p_network
   OR o.asset IS DISTINCT FROM p_asset THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
  RETURN o.id;
 END IF;
 t:=clock_timestamp();
 IF p_rate_at IS NULL OR p_rate_at>t OR p_rate_at<t-interval '3 minutes' OR p_expires IS NULL OR p_expires<=t
 OR p_base_raw IS NULL OR p_base_raw<=0 OR p_base_raw<>trunc(p_base_raw)
 OR p_decimals IS NULL OR p_decimals NOT BETWEEN 0 AND 18
 OR p_eur IS NULL OR p_eur<=0 OR p_usd IS NULL OR p_usd<=0
 OR p_units IS NULL OR p_units<=0 OR p_units<>trunc(p_units)
 OR p_price IS NULL OR p_price<=0 OR p_identity IS NULL OR length(p_identity)=0
 THEN RAISE EXCEPTION 'INVALID_QUOTE'; END IF;
 SELECT * INTO w FROM betinsight_pay_private.fixed_wallet_versions WHERE network=p_network AND active AND NOT frozen FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'NETWORK_UNAVAILABLE'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array('fixed-wallet',w.network,w.recipient,CASE WHEN p_network='XRPL' THEN 'tag' ELSE p_identity END)::text,0));
 IF p_network='XRPL' THEN
  raw:=p_base_raw;
  SELECT coalesce(max(destination_tag),0)+1 INTO tag FROM betinsight_pay_private.orders
  WHERE network=p_network AND canonical_recipient=w.recipient;
  IF tag>4294967295 THEN RAISE EXCEPTION 'TAG_EXHAUSTED'; END IF;
 ELSE
  IF p_increment_raw IS NULL OR p_increment_raw<=0 OR p_increment_raw<>trunc(p_increment_raw)
  OR p_max_offset IS NULL OR p_max_offset NOT BETWEEN 0 AND 999 THEN RAISE EXCEPTION 'INVALID_AMOUNT_RANGE'; END IF;
  -- Clamp the search to an extra EUR 0.05 even if adapter requests a larger range.
  p_max_offset:=least(p_max_offset,floor(0.05*power(10::numeric,p_decimals)/(p_increment_raw*p_eur))::numeric)::integer;
  SELECT p_base_raw+s.i*p_increment_raw INTO raw FROM generate_series(0,p_max_offset) AS s(i)
  WHERE NOT EXISTS(SELECT 1 FROM betinsight_pay_private.orders prev WHERE prev.network=p_network AND prev.canonical_recipient=w.recipient AND prev.asset_identity=p_identity AND prev.quote_raw=p_base_raw+s.i*p_increment_raw)
  ORDER BY s.i LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'AMOUNT_RANGE_EXHAUSTED'; END IF;
 END IF;
 INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,destination_tag,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key,next_check_at)
 VALUES(p_member,p_email,p_package,p_snapshot,p_units,p_price,p_network,p_asset,p_identity,w.version,w.recipient,tag,CASE WHEN p_network='XRPL' THEN 'xrpl-tag' ELSE 'shared-address' END,raw,p_decimals,p_eur,p_usd,p_rate_at,t,p_expires,p_key,t)
 RETURNING id INTO result_id;
 RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.reserve_fixed_order(text,text,text,jsonb,numeric,numeric,text,text,text,numeric,integer,numeric,numeric,timestamptz,timestamptz,text,numeric,integer) FROM PUBLIC,anon,authenticated,service_role;
-- Crucial: a matching shared amount alone NEVER gives permission for automatic posting.
-- Existing exact-auto settlement refuses MANUAL_REVIEW; existing authenticated manual path
-- must independently verify payer/order attribution before accepting the receipt.
CREATE FUNCTION betinsight_pay_private.fixed_amount_review_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.allocation_kind='shared-address' AND NEW.status='VERIFIED_CANDIDATE' THEN
  NEW.status:='MANUAL_REVIEW';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER pay_fixed_amount_review_guard BEFORE INSERT OR UPDATE OF status ON betinsight_pay_private.orders
 FOR EACH ROW EXECUTE FUNCTION betinsight_pay_private.fixed_amount_review_guard();
REVOKE ALL ON FUNCTION betinsight_pay_private.fixed_amount_review_guard() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Do NOT adapt unique-address verifiers by falsely labelling shared wallets unique.
-- Observe transfers once per receiver/network, retain unmatched events in unassigned inbox.
-- Verify actual chain receipt independently; do not accept customer-provided tx hashes as attribution.
-- XRP can auto-post with valid unique destination tag, after canonical live settlement is ready.
-- Shared-address orders need independent authenticated attribution or manual reconciliation,
-- including late, split, incorrect, duplicate, or ambiguous transfers.
