\set ON_ERROR_STOP on
-- Isolated DB model. All wallet ownership, verified member and quote inputs below are synthetic.
DO $$ BEGIN IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF; END $$;
BEGIN;
CREATE TABLE betinsight_pay_private.lab_wallet_versions(
 network text NOT NULL, version integer NOT NULL CHECK(version>0),
 active boolean NOT NULL DEFAULT false, frozen boolean NOT NULL DEFAULT true,
 PRIMARY KEY(network,version)
);
CREATE UNIQUE INDEX lab_one_active_version ON betinsight_pay_private.lab_wallet_versions(network) WHERE active;
CREATE TABLE betinsight_pay_private.lab_allocations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 network text NOT NULL, wallet_version integer NOT NULL,
 recipient text NOT NULL CHECK(length(recipient)>0),
 tag bigint, ownership_reference text NOT NULL CHECK(length(ownership_reference)>0),
 enabled boolean NOT NULL DEFAULT false,
 assigned_order uuid UNIQUE REFERENCES betinsight_pay_private.orders(id),
 FOREIGN KEY(network,wallet_version) REFERENCES betinsight_pay_private.lab_wallet_versions(network,version),
 UNIQUE NULLS NOT DISTINCT(network,recipient,tag),
 CHECK((network='XRPL' AND tag IS NOT NULL AND tag BETWEEN 1 AND 4294967295) OR (network<>'XRPL' AND tag IS NULL))
);
ALTER TABLE betinsight_pay_private.lab_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE betinsight_pay_private.lab_wallet_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.lab_allocations,betinsight_pay_private.lab_wallet_versions FROM PUBLIC,anon,authenticated,service_role;
-- Trusted backend only. Member/quote authentication and wallet ownership proof are NOT implemented in this model.
CREATE FUNCTION betinsight_pay_private.lab_reserve_order(
 p_member text,p_email text,p_package text,p_snapshot jsonb,p_units numeric,p_price numeric,
 p_network text,p_asset text,p_identity text,p_raw numeric,p_decimals integer,p_eur numeric,p_usd numeric,
 p_rate_at timestamptz,p_expires timestamptz,p_key text
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; a betinsight_pay_private.lab_allocations%ROWTYPE;
 v integer; result_id uuid; t timestamptz:=clock_timestamp();
BEGIN
 IF p_member IS NULL OR length(btrim(p_member))=0 OR p_key IS NULL OR length(btrim(p_key))=0
 OR p_email IS NULL OR p_email<>lower(btrim(p_email)) OR length(p_email)=0 THEN RAISE EXCEPTION 'BAD_MEMBER_OR_KEY'; END IF;
 -- Serialize identical retry keys even when there is not yet an order row.
 PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array(p_member,p_key)::text,0));
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE member_id=p_member AND idempotency_key=p_key;
 IF FOUND THEN
 IF o.email IS DISTINCT FROM p_email OR o.package_code IS DISTINCT FROM p_package OR o.network IS DISTINCT FROM p_network OR o.asset IS DISTINCT FROM p_asset THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
 RETURN o.id;
 END IF;
 IF p_network='DOGECOIN' THEN RAISE EXCEPTION 'NETWORK_DEFERRED'; END IF;
 IF p_rate_at IS NULL OR p_rate_at>t OR p_rate_at<t-interval '3 minutes'
 OR p_expires IS NULL OR p_expires<=t OR p_raw IS NULL OR p_raw<=0 OR p_raw<>trunc(p_raw)
 OR p_units IS NULL OR p_units<=0 OR p_units<>trunc(p_units) THEN RAISE EXCEPTION 'INVALID_QUOTE'; END IF;
 -- Lock active version before selection; rotation must use the same lock discipline.
 SELECT version INTO v FROM betinsight_pay_private.lab_wallet_versions
 WHERE network=p_network AND active AND NOT frozen FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'NETWORK_UNAVAILABLE'; END IF;
 SELECT * INTO a FROM betinsight_pay_private.lab_allocations
 WHERE network=p_network AND wallet_version=v AND enabled AND assigned_order IS NULL
 ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RAISE EXCEPTION 'NO_AVAILABLE_ALLOCATION'; END IF;
 INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,destination_tag,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key,next_check_at)
 VALUES(p_member,p_email,p_package,p_snapshot,p_units,p_price,p_network,p_asset,p_identity,v,a.recipient,a.tag,CASE WHEN p_network='XRPL' THEN 'xrpl-tag' ELSE 'unique-address' END,p_raw,p_decimals,p_eur,p_usd,p_rate_at,t,p_expires,p_key,t)
 RETURNING id INTO result_id;
 UPDATE betinsight_pay_private.lab_allocations SET assigned_order=result_id WHERE id=a.id;
 RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.lab_reserve_order(text,text,text,jsonb,numeric,numeric,text,text,text,numeric,integer,numeric,numeric,timestamptz,timestamptz,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
DO $$
DECLARE a uuid; b uuid; c uuid; d uuid; r uuid; t timestamptz:=clock_timestamp(); passed int:=0;
BEGIN
 INSERT INTO betinsight_pay_private.lab_wallet_versions VALUES ('BSC',1,true,false),('BSC',2,false,false),('XRPL',1,true,false);
 INSERT INTO betinsight_pay_private.lab_allocations(network,wallet_version,recipient,tag,ownership_reference,enabled) VALUES
 ('BSC',1,'fixture-pool-a',NULL,'fake-proof',true),('BSC',1,'fixture-pool-b',NULL,'fake-proof',true),
 ('BSC',2,'fixture-pool-c',NULL,'fake-proof',true),('XRPL',1,'fixture-xrp',101,'fake-proof',true),
 ('XRPL',1,'fixture-xrp',102,'fake-proof',true);
 a:=betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDT','fixture-token',100,18,1,1,t,t+interval '15 minutes','k1');
 IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.orders o JOIN betinsight_pay_private.lab_allocations p ON p.assigned_order=o.id WHERE o.id=a AND o.canonical_recipient=p.recipient AND o.wallet_version=1 AND o.next_check_at IS NOT NULL) THEN RAISE EXCEPTION 'allocation missing'; END IF; passed:=passed+1;
 r:=betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDT','fixture-token',100,18,1,1,t,t+interval '15 minutes','k1');
 IF r IS DISTINCT FROM a OR (SELECT count(*) FROM betinsight_pay_private.lab_allocations WHERE assigned_order IS NOT NULL)<>1 THEN RAISE EXCEPTION 'retry allocated twice'; END IF; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDC','fixture-token',100,18,1,1,t,t+interval '15 minutes','k1');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'IDEMPOTENCY_CONFLICT' THEN RAISE; END IF; END; passed:=passed+1;
 b:=betinsight_pay_private.lab_reserve_order('lab-m2','b@example.invalid','starter','{}',50,49,'BSC','USDC','fixture-token-b',100,18,1,1,t,t+interval '15 minutes','k1');
 IF a=b OR (SELECT count(DISTINCT canonical_recipient) FROM betinsight_pay_private.orders WHERE id IN(a,b))<>2 THEN RAISE EXCEPTION 'cross-member reuse'; END IF; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDT','fixture-token',100,18,1,1,t,t+interval '15 minutes','k2');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'NO_AVAILABLE_ALLOCATION' THEN RAISE; END IF; END; passed:=passed+1;
 UPDATE betinsight_pay_private.orders SET status='STOPPED' WHERE id=a;
 BEGIN
 PERFORM betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDT','fixture-token',100,18,1,1,t,t+interval '15 minutes','k2');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'NO_AVAILABLE_ALLOCATION' THEN RAISE; END IF; END; passed:=passed+1;
 UPDATE betinsight_pay_private.lab_wallet_versions SET active=false WHERE network='BSC' AND version=1;
 UPDATE betinsight_pay_private.lab_wallet_versions SET active=true WHERE network='BSC' AND version=2;
 c:=betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDT','fixture-token',100,18,1,1,t,t+interval '15 minutes','k2');
 IF (SELECT wallet_version FROM betinsight_pay_private.orders WHERE id=c)<>2 OR (SELECT wallet_version FROM betinsight_pay_private.orders WHERE id=a)<>1 THEN RAISE EXCEPTION 'rotation changed old order'; END IF; passed:=passed+1;
 UPDATE betinsight_pay_private.lab_wallet_versions SET frozen=true WHERE network='BSC' AND version=2;
 BEGIN
 PERFORM betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'BSC','USDT','fixture-token',100,18,1,1,t,t+interval '15 minutes','k3');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'NETWORK_UNAVAILABLE' THEN RAISE; END IF; END; passed:=passed+1;
 c:=betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'XRPL','XRP','fixture-native',100,6,1,1,t,t+interval '15 minutes','x1');
 d:=betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'XRPL','XRP','fixture-native',100,6,1,1,t,t+interval '15 minutes','x2');
 IF (SELECT count(DISTINCT destination_tag) FROM betinsight_pay_private.orders WHERE id IN(c,d))<>2 OR (SELECT count(DISTINCT canonical_recipient) FROM betinsight_pay_private.orders WHERE id IN(c,d))<>1 THEN RAISE EXCEPTION 'XRP tag allocation'; END IF; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.lab_reserve_order('lab-m1','a@example.invalid','starter','{}',50,49,'DOGECOIN','DOGE','fixture-native',100,8,1,1,t,t+interval '15 minutes','doge');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'NETWORK_DEFERRED' THEN RAISE; END IF; END; passed:=passed+1;
 IF has_function_privilege('anon','betinsight_pay_private.lab_reserve_order(text,text,text,jsonb,numeric,numeric,text,text,text,numeric,integer,numeric,numeric,timestamptz,timestamptz,text)','EXECUTE') OR has_table_privilege('service_role','betinsight_pay_private.lab_allocations','INSERT') THEN RAISE EXCEPTION 'privilege leak'; END IF; passed:=passed+1;
 RAISE NOTICE 'PAY-LAB ALLOCATION: % checks passed (synthetic wallet pool only)',passed;
END $$;
