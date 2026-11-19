-- BetInsight Pay: REVIEW DRAFT, never execute against production before staging approval.
-- Existing public package/member data stays authoritative; existing ledger remains untouched.
-- This is not a Supabase migration and grants no browser/API access.
BEGIN;
CREATE SCHEMA betinsight_pay_private;
REVOKE ALL ON SCHEMA betinsight_pay_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE betinsight_pay_private.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 member_id text NOT NULL CHECK (length(member_id)>0),
 email text NOT NULL CHECK (length(email)>0 AND email=lower(btrim(email))),
 package_code text NOT NULL REFERENCES public.betinsight_payment_packages(code),
 package_snapshot jsonb NOT NULL CHECK (jsonb_typeof(package_snapshot)='object'),
 units numeric NOT NULL CHECK(units>0),
 price_eur numeric(18,2) NOT NULL CHECK(price_eur>0),
 network text NOT NULL CHECK(network IN ('BSC','ETHEREUM','TRON','POLYGON','SOLANA','BITCOIN','BITCOINCASH','LITECOIN','DOGECOIN','XRPL')),
 asset text NOT NULL,
 asset_identity text NOT NULL CHECK(length(asset_identity)>0),
 wallet_version integer NOT NULL CHECK(wallet_version>0),
 canonical_recipient text NOT NULL CHECK(length(canonical_recipient)>0),
 destination_tag bigint,
 allocation_kind text NOT NULL CHECK(allocation_kind IN ('unique-address','xrpl-tag')),
 quote_raw numeric(78,0) NOT NULL CHECK(quote_raw>0),
 quote_decimals integer NOT NULL CHECK(quote_decimals BETWEEN 0 AND 18),
 rate_eur numeric NOT NULL CHECK(rate_eur>0),
 rate_usd numeric NOT NULL CHECK(rate_usd>0),
 rate_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL CHECK(expires_at>created_at),
 next_check_at timestamptz,
 empty_checks integer NOT NULL DEFAULT 0 CHECK(empty_checks>=0),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 status text NOT NULL DEFAULT 'UNPAID' CHECK(status IN ('UNPAID','PAYMENT_SEEN','VERIFIED_CANDIDATE','MANUAL_REVIEW','STOPPED','SETTLED')),
 idempotency_key text NOT NULL CHECK(length(idempotency_key)>0),
 canonical_intent_id uuid UNIQUE REFERENCES public.betinsight_payment_intents(id),
 UNIQUE(member_id,idempotency_key),
 CHECK((network='XRPL' AND allocation_kind='xrpl-tag' AND destination_tag IS NOT NULL AND destination_tag BETWEEN 1 AND 4294967295)
 OR (network<>'XRPL' AND allocation_kind='unique-address' AND destination_tag IS NULL)),
 CHECK((network,asset) IN (('BSC','BNB'),('BSC','USDT'),('BSC','USDC'),('ETHEREUM','ETH'),('ETHEREUM','USDT'),('ETHEREUM','USDC'),('TRON','TRX'),('TRON','USDT'),('POLYGON','POL'),('POLYGON','USDT'),('POLYGON','USDC'),('SOLANA','SOL'),('SOLANA','USDT'),('SOLANA','USDC'),('BITCOIN','BTC'),('BITCOINCASH','BCH'),('LITECOIN','LTC'),('DOGECOIN','DOGE'),('XRPL','XRP')))
);
-- Canonical recipient means normalized script/address/account key derived by a trusted backend, not display formatting.
CREATE UNIQUE INDEX pay_unique_recipient ON betinsight_pay_private.orders(network,canonical_recipient) WHERE allocation_kind='unique-address';
CREATE UNIQUE INDEX pay_unique_xrp_tag ON betinsight_pay_private.orders(network,canonical_recipient,destination_tag) WHERE allocation_kind='xrpl-tag';
CREATE INDEX pay_due ON betinsight_pay_private.orders(next_check_at) WHERE status IN ('UNPAID','PAYMENT_SEEN');

CREATE TABLE betinsight_pay_private.verified_events (
 network text NOT NULL,
 txid text NOT NULL CHECK(length(txid)>0),
 event_index text NOT NULL CHECK(length(event_index)>0),
 order_id uuid NOT NULL REFERENCES betinsight_pay_private.orders(id),
 asset_identity text NOT NULL,
 canonical_recipient text NOT NULL,
 destination_tag bigint,
 amount_raw numeric(78,0) NOT NULL CHECK(amount_raw>0),
 valued_eur_micro numeric(30,0) NOT NULL CHECK(valued_eur_micro>0),
 valuation_reference text NOT NULL CHECK(length(valuation_reference)>0),
 observed_payment_at timestamptz NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now(),
 evidence jsonb NOT NULL CHECK(jsonb_typeof(evidence)='object'),
 PRIMARY KEY(network,txid,event_index)
);
-- Restrict direct uses to a future dedicated backend role, not shared client roles.
ALTER TABLE betinsight_pay_private.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE betinsight_pay_private.verified_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA betinsight_pay_private FROM PUBLIC, anon, authenticated, service_role;

CREATE INDEX pay_events_by_order ON betinsight_pay_private.verified_events(order_id);
-- Only trusted server finality/valuation adapters may call this helper after independent verification.
-- Store partial, excess and late incoming funds without crediting them. Canonical keys never come from the browser.
CREATE FUNCTION betinsight_pay_private.record_verified_transfer(
 p_order uuid,p_network text,p_txid text,p_event_index text,p_asset_identity text,
 p_recipient text,p_tag bigint,p_raw numeric,p_payment_at timestamptz,p_evidence jsonb,
 p_eur_micro numeric,p_valuation_reference text
) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE;
 existing betinsight_pay_private.verified_events%ROWTYPE;
 total_raw numeric; late_seen boolean; new_status text;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
 IF p_network IS DISTINCT FROM o.network OR p_asset_identity IS DISTINCT FROM o.asset_identity
 OR p_recipient IS DISTINCT FROM o.canonical_recipient OR p_tag IS DISTINCT FROM o.destination_tag
 OR p_raw IS NULL OR p_raw<=0 OR p_raw<>trunc(p_raw)
 OR p_payment_at IS NULL OR p_payment_at<o.created_at OR p_payment_at>clock_timestamp()
 OR p_txid IS NULL OR length(p_txid)=0 OR p_event_index IS NULL OR length(p_event_index)=0
 OR p_eur_micro IS NULL OR p_eur_micro<=0 OR p_eur_micro<>trunc(p_eur_micro)
 OR p_valuation_reference IS NULL OR length(p_valuation_reference)=0
 OR p_evidence IS NULL OR jsonb_typeof(p_evidence)<>'object'
 THEN RAISE EXCEPTION 'EVENT_ORDER_MISMATCH'; END IF;
 IF (p_network IN ('BSC','ETHEREUM','POLYGON') AND p_txid !~ '^0x[0-9a-f]{64}$')
 OR (p_network IN ('TRON','BITCOIN','BITCOINCASH','LITECOIN','DOGECOIN') AND p_txid !~ '^[0-9a-f]{64}$')
 OR (p_network='XRPL' AND p_txid !~ '^[0-9A-F]{64}$')
 OR (p_network='SOLANA' AND p_txid !~ '^[1-9A-HJ-NP-Za-km-z]{64,88}$')
 THEN RAISE EXCEPTION 'NONCANONICAL_TXID'; END IF;
 SELECT * INTO existing FROM betinsight_pay_private.verified_events
 WHERE network=p_network AND txid=p_txid AND event_index=p_event_index;
 IF FOUND THEN
 IF existing.order_id=p_order AND existing.amount_raw=p_raw AND existing.valued_eur_micro=p_eur_micro
 AND existing.asset_identity=p_asset_identity AND existing.canonical_recipient=p_recipient
 AND existing.destination_tag IS NOT DISTINCT FROM p_tag
 THEN RETURN 'ALREADY_RECORDED'; END IF;
 RAISE EXCEPTION 'EVENT_ALREADY_ASSIGNED_OR_CONFLICTING';
 END IF;
 -- New funds for already settled orders must enter a separate reconciliation inbox; do not mutate closed settlement.
 IF o.status='SETTLED' THEN RAISE EXCEPTION 'CLOSED_ORDER_NEW_FUNDS_RECONCILIATION_REQUIRED'; END IF;
 INSERT INTO betinsight_pay_private.verified_events(network,txid,event_index,order_id,asset_identity,canonical_recipient,destination_tag,amount_raw,observed_payment_at,evidence,valued_eur_micro,valuation_reference)
 VALUES(p_network,p_txid,p_event_index,p_order,p_asset_identity,p_recipient,p_tag,p_raw,p_payment_at,p_evidence,p_eur_micro,p_valuation_reference);
 SELECT sum(amount_raw),bool_or(observed_payment_at>o.expires_at) INTO total_raw,late_seen FROM betinsight_pay_private.verified_events WHERE order_id=p_order;
 -- Preserve a review decision once an exception has been found; never silently clear it.
 new_status:=CASE WHEN o.status IN ('MANUAL_REVIEW','STOPPED') OR late_seen OR total_raw<>o.quote_raw THEN 'MANUAL_REVIEW' ELSE 'VERIFIED_CANDIDATE' END;
 UPDATE betinsight_pay_private.orders SET status=new_status,revision=revision+1 WHERE id=p_order;
 RETURN new_status;
END;
$$;
REVOKE ALL ON FUNCTION betinsight_pay_private.record_verified_transfer(uuid,text,text,text,text,text,bigint,numeric,timestamptz,jsonb,numeric,text) FROM PUBLIC,anon,authenticated,service_role;

-- One immutable settlement request per order revision. This is a staging record, not an actual purchase.
CREATE TABLE betinsight_pay_private.settlement_requests(
 order_id uuid PRIMARY KEY REFERENCES betinsight_pay_private.orders(id),
 order_revision bigint NOT NULL CHECK(order_revision>0),
 settlement_key text NOT NULL UNIQUE,
 actual_eur_micro numeric(30,0) NOT NULL CHECK(actual_eur_micro>0),
 credited_units numeric NOT NULL CHECK(credited_units>0 AND credited_units=trunc(credited_units)),
 approval_mode text NOT NULL CHECK(approval_mode IN ('EXACT_AUTO','MASTER_MANUAL')),
 approval_reference text,
 finance_snapshot jsonb NOT NULL CHECK(jsonb_typeof(finance_snapshot)='object'),
 prepared_at timestamptz NOT NULL DEFAULT now(),
 CHECK(approval_mode<>'MASTER_MANUAL' OR approval_reference IS NOT NULL)
);
ALTER TABLE betinsight_pay_private.settlement_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.settlement_requests FROM PUBLIC,anon,authenticated,service_role;
-- Backend integration must lock the order, verify revision/approval and recheck event assignments in the same transaction
-- as canonical purchase/lot/account/ledger/finance/referral writes; never credit from this staging record alone.
-- No grants, no production scheduler or actual units credits. Tolerance, late-fund inbox, event index normalization,
-- trusted valuation, partial-payment scheduling, MFA challenge consumption and canonical posting adapter remain stage gates.
COMMIT;
