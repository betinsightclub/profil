\set ON_ERROR_STOP on
-- Run only after bootstrap and database-bridge-review.sql, in the disposable lab DB.
DO $$
DECLARE
 a uuid; b uuid; c uuid; d uuid; now_at timestamptz:=now(); r text; passed int:=0;
BEGIN
 IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'Wrong database'; END IF;
 INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key)
 VALUES('demo-a','a@example.invalid','starter','{}',50,49,'TRON','USDT','synthetic-token',1,'synthetic-a','unique-address',49000000,6,1,1,now_at,now_at-interval '10 minutes',now_at+interval '5 minutes','a') RETURNING id INTO a;
 INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key)
 VALUES('demo-b','b@example.invalid','starter','{}',50,49,'TRON','USDT','synthetic-token',1,'synthetic-b','unique-address',49000000,6,1,1,now_at,now_at-interval '10 minutes',now_at+interval '5 minutes','b') RETURNING id INTO b;
 INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key)
 VALUES('demo-c','c@example.invalid','starter','{}',50,49,'TRON','USDT','synthetic-token',1,'synthetic-c','unique-address',49000000,6,1,1,now_at,now_at-interval '30 minutes',now_at-interval '15 minutes','c') RETURNING id INTO c;
 r:=betinsight_pay_private.record_verified_transfer(a,'TRON',repeat('a',64),'0','synthetic-token','synthetic-a',null,48000000,now_at,'{}',48000000,'test-rate');
 IF r<>'MANUAL_REVIEW' THEN RAISE EXCEPTION 'partial transfer not reviewed'; END IF; passed:=passed+1;
 r:=betinsight_pay_private.record_verified_transfer(a,'TRON',repeat('b',64),'0','synthetic-token','synthetic-a',null,1000000,now_at,'{}',1000000,'test-rate');
 IF r<>'MANUAL_REVIEW' OR (SELECT sum(amount_raw) FROM betinsight_pay_private.verified_events WHERE order_id=a)<>49000000 THEN RAISE EXCEPTION 'partial total or review state'; END IF; passed:=passed+1;
 r:=betinsight_pay_private.record_verified_transfer(a,'TRON',repeat('b',64),'0','synthetic-token','synthetic-a',null,1000000,now_at,'{}',1000000,'test-rate');
 IF r<>'ALREADY_RECORDED' OR (SELECT count(*) FROM betinsight_pay_private.verified_events WHERE order_id=a)<>2 THEN RAISE EXCEPTION 'duplicate event'; END IF; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.record_verified_transfer(a,'TRON',repeat('b',64),'0','synthetic-token','synthetic-a',null,2000000,now_at,'{}',2000000,'test-rate');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'EVENT_ALREADY_ASSIGNED_OR_CONFLICTING' THEN RAISE; END IF; END; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.record_verified_transfer(b,'TRON',repeat('a',64),'0','synthetic-token','synthetic-b',null,48000000,now_at,'{}',48000000,'test-rate');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'EVENT_ALREADY_ASSIGNED_OR_CONFLICTING' THEN RAISE; END IF; END; passed:=passed+1;
 r:=betinsight_pay_private.record_verified_transfer(b,'TRON',repeat('c',64),'0','synthetic-token','synthetic-b',null,49000000,now_at,'{}',49000000,'test-rate');
 IF r<>'VERIFIED_CANDIDATE' THEN RAISE EXCEPTION 'exact transfer'; END IF; passed:=passed+1;
 r:=betinsight_pay_private.record_verified_transfer(c,'TRON',repeat('d',64),'0','synthetic-token','synthetic-c',null,49000000,now_at,'{}',49000000,'test-rate');
 IF r<>'MANUAL_REVIEW' THEN RAISE EXCEPTION 'late not reviewed'; END IF; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.record_verified_transfer(c,'TRON',repeat('e',64),'0','fake-token','synthetic-c',null,49000000,now_at,'{}',49000000,'test-rate');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'EVENT_ORDER_MISMATCH' THEN RAISE; END IF; END; passed:=passed+1;
 IF has_schema_privilege('anon','betinsight_pay_private','USAGE') OR has_schema_privilege('authenticated','betinsight_pay_private','USAGE') OR has_schema_privilege('service_role','betinsight_pay_private','USAGE') THEN RAISE EXCEPTION 'client schema exposure'; END IF; passed:=passed+1;
 IF has_table_privilege('anon','betinsight_pay_private.orders','SELECT') OR has_table_privilege('authenticated','betinsight_pay_private.orders','UPDATE') OR has_table_privilege('service_role','betinsight_pay_private.verified_events','INSERT') THEN RAISE EXCEPTION 'table exposure'; END IF; passed:=passed+1;
 IF has_function_privilege('anon','betinsight_pay_private.record_verified_transfer(uuid,text,text,text,text,text,bigint,numeric,timestamptz,jsonb,numeric,text)','EXECUTE') OR has_function_privilege('authenticated','betinsight_pay_private.record_verified_transfer(uuid,text,text,text,text,text,bigint,numeric,timestamptz,jsonb,numeric,text)','EXECUTE') OR has_function_privilege('service_role','betinsight_pay_private.record_verified_transfer(uuid,text,text,text,text,text,bigint,numeric,timestamptz,jsonb,numeric,text)','EXECUTE') THEN RAISE EXCEPTION 'function exposure'; END IF; passed:=passed+1;
 IF (SELECT count(*) FROM public.betinsight_payment_intents)<>0 THEN RAISE EXCEPTION 'unexpected posting'; END IF; passed:=passed+1;
 RAISE NOTICE 'PAY-LAB: % database checks passed (bridge only; not production ledger)',passed;
END $$;
