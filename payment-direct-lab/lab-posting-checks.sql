\set ON_ERROR_STOP on
DO $$
DECLARE a uuid; b uuid; c uuid; n timestamptz:=now(); r text; passed integer:=0; rev bigint; retry_balance numeric;
BEGIN
 IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF;
 INSERT INTO pay_posting_lab.members VALUES ('lab-buyer','buyer@example.invalid','LAB-OWNER','LAB-S1','LAB-S2','LAB-S3');
 INSERT INTO pay_posting_lab.accounts VALUES('LAB-OWNER',10,7,3);
 FOR j IN 1..3 LOOP
  INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key)
  VALUES('lab-buyer','buyer@example.invalid','starter','{}',50,49,'TRON','USDT','synthetic-token',1,'posting-'||j,'unique-address',49000000,6,1,1,n,n-interval '10 minutes',n+interval '5 minutes','posting-'||j)
  RETURNING id INTO c;
  IF j=1 THEN a:=c; ELSIF j=2 THEN b:=c; END IF;
  PERFORM betinsight_pay_private.record_verified_transfer(c,'TRON',repeat(CASE j WHEN 1 THEN '1' WHEN 2 THEN '2' ELSE '3' END,64),'0','synthetic-token','posting-'||j,null,CASE WHEN j=1 THEN 48000000 ELSE 49000000 END,n,'{}',CASE WHEN j=1 THEN 48000000 ELSE 49000000 END,'fixture');
 END LOOP;
 BEGIN
  PERFORM pay_posting_lab.settle(a);
  RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'MANUAL_REQUIRED' THEN RAISE; END IF; END; passed:=passed+1;
 SELECT revision INTO rev FROM betinsight_pay_private.orders WHERE id=a;
 INSERT INTO pay_posting_lab.approvals(ref,order_id,revision,event_snapshot,units,reason,expires_at)
 VALUES('lab-approval',a,rev,pay_posting_lab.snapshot(a),49,'Test: 48 EUR -> 49 Units',n+interval '5 minutes'),
 ('stale-approval',a,rev-1,pay_posting_lab.snapshot(a),49,'stale',n+interval '5 minutes');
 BEGIN
  PERFORM pay_posting_lab.settle(a,'stale-approval');
  RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'APPROVAL_INVALID' THEN RAISE; END IF; END; passed:=passed+1;
 r:=pay_posting_lab.settle(a,'lab-approval');
 IF r<>'SETTLED' THEN RAISE EXCEPTION 'manual posting'; END IF; passed:=passed+1;
 IF NOT EXISTS(SELECT 1 FROM pay_posting_lab.purchases WHERE order_id=a AND units=49 AND ordered_units=50 AND actual_eur=48 AND invoice_eur=49) THEN RAISE EXCEPTION 'purchase mismatch'; END IF; passed:=passed+1;
 IF NOT EXISTS(SELECT 1 FROM pay_posting_lab.accounts WHERE owner_ref='LAB-OWNER' AND purchased=56 AND gift=10 AND referral=3) THEN RAISE EXCEPTION 'wallet mismatch'; END IF; passed:=passed+1;
 IF NOT EXISTS(SELECT 1 FROM pay_posting_lab.lots WHERE order_id=a AND units_initial=49 AND units_remaining=49 AND units_used=0) THEN RAISE EXCEPTION 'lot mismatch'; END IF; passed:=passed+1;
 IF NOT EXISTS(SELECT 1 FROM pay_posting_lab.ledger WHERE order_id=a AND units_delta=49 AND movement_type='PURCHASE_CREDIT' AND source_tag='DIRECT_CRYPTO_MANUAL_ACCEPTANCE' AND (metadata->>'received_eur')::numeric=48) THEN RAISE EXCEPTION 'ledger mismatch'; END IF; passed:=passed+1;
 IF NOT EXISTS(SELECT 1 FROM pay_posting_lab.finance WHERE order_id=a AND actual_eur=48 AND operating_eur=1.2 AND affiliate_eur=4.8 AND distributable_eur=42 AND immediate_eur=16.8 AND usage_eur=25.2 AND admin3_eur=0 AND special_eur=5.04) THEN RAISE EXCEPTION 'finance mismatch'; END IF; passed:=passed+1;
 IF (SELECT array_agg(expected_units ORDER BY level) FROM pay_posting_lab.referrals WHERE order_id=a)<>ARRAY[2.45,1.47,0.98]::numeric[] OR (SELECT sum(released_units) FROM pay_posting_lab.referrals WHERE order_id=a)<>0 THEN RAISE EXCEPTION 'referral mismatch'; END IF; passed:=passed+1;
 IF (SELECT count(*) FROM pay_posting_lab.consumed_events WHERE order_id=a)<>1 OR (SELECT used_at FROM pay_posting_lab.approvals WHERE ref='lab-approval') IS NULL THEN RAISE EXCEPTION 'consumption mismatch'; END IF; passed:=passed+1;
 r:=pay_posting_lab.settle(a,'lab-approval');
 IF r<>'ALREADY_SETTLED' OR (SELECT purchased FROM pay_posting_lab.accounts WHERE owner_ref='LAB-OWNER')<>56 OR (SELECT count(*) FROM pay_posting_lab.ledger WHERE order_id=a)<>1 THEN RAISE EXCEPTION 'duplicate credit'; END IF; passed:=passed+1;
 r:=pay_posting_lab.settle(b);
 IF r<>'SETTLED' OR (SELECT purchased FROM pay_posting_lab.accounts WHERE owner_ref='LAB-OWNER')<>106 THEN RAISE EXCEPTION 'automatic posting mismatch'; END IF; passed:=passed+1;
 -- Cause failure at the last order update, after every financial row was written. Subtransaction must roll back ALL effects.
 ALTER TABLE betinsight_pay_private.orders ADD CONSTRAINT lab_forced_failure CHECK (canonical_intent_id IS NULL OR canonical_recipient<>'posting-3');
 BEGIN
  PERFORM pay_posting_lab.settle(c);
  RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN check_violation THEN NULL; END;
 IF (SELECT purchased FROM pay_posting_lab.accounts WHERE owner_ref='LAB-OWNER')<>106
 OR EXISTS(SELECT 1 FROM pay_posting_lab.purchases WHERE order_id=c)
 OR EXISTS(SELECT 1 FROM pay_posting_lab.finance WHERE order_id=c)
 OR EXISTS(SELECT 1 FROM pay_posting_lab.lots WHERE order_id=c)
 OR EXISTS(SELECT 1 FROM pay_posting_lab.ledger WHERE order_id=c)
 OR EXISTS(SELECT 1 FROM pay_posting_lab.referrals WHERE order_id=c)
 OR EXISTS(SELECT 1 FROM pay_posting_lab.consumed_events WHERE order_id=c)
 OR EXISTS(SELECT 1 FROM betinsight_pay_private.settlement_requests WHERE order_id=c)
 OR (SELECT status FROM betinsight_pay_private.orders WHERE id=c)<>'VERIFIED_CANDIDATE'
 OR (SELECT count(*) FROM public.betinsight_payment_intents)<>2
 THEN RAISE EXCEPTION 'rollback failure'; END IF; passed:=passed+1;
 ALTER TABLE betinsight_pay_private.orders DROP CONSTRAINT lab_forced_failure;
 -- Execute the writing function first, then read the changed account in a separate statement.
 r:=pay_posting_lab.settle(c);
 SELECT purchased INTO retry_balance FROM pay_posting_lab.accounts WHERE owner_ref='LAB-OWNER';
 IF r IS DISTINCT FROM 'SETTLED' OR retry_balance IS DISTINCT FROM 156::numeric THEN
  RAISE EXCEPTION 'retry failure: status=%, purchased=%, expected SETTLED/156',r,retry_balance;
 END IF;
 IF (SELECT count(*) FROM pay_posting_lab.ledger WHERE order_id=c)<>1
 OR (SELECT count(*) FROM pay_posting_lab.consumed_events WHERE order_id=c)<>1
 OR (SELECT count(*) FROM public.betinsight_payment_intents)<>3
 OR (SELECT status FROM betinsight_pay_private.orders WHERE id=c) IS DISTINCT FROM 'SETTLED'
 THEN RAISE EXCEPTION 'retry posting consistency failure'; END IF; passed:=passed+1;
 IF has_schema_privilege('anon','pay_posting_lab','USAGE') OR has_function_privilege('authenticated','pay_posting_lab.settle(uuid,text)','EXECUTE') OR has_function_privilege('service_role','pay_posting_lab.settle(uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'privilege leak'; END IF; passed:=passed+1;
 RAISE NOTICE 'PAY-LAB POSTING: % checks passed (isolated model; no production finance)',passed;
END $$;
