\set ON_ERROR_STOP on
-- INTEGRATED DISPOSABLE LAB. Inputs represent already independently verified receipts.
-- No RPC, customer credentials, real addresses, canonical production accounting or money movement.
DO $$ BEGIN IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF; END $$;
BEGIN;
CREATE FUNCTION betinsight_pay_private.lab_apply_verified_scan(p_order uuid,p_lease uuid,p_revision bigint,p_events jsonb)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; e jsonb; st text; t timestamptz;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 t:=clock_timestamp();
 IF NOT FOUND OR p_lease IS NULL OR p_lease IS DISTINCT FROM o.scan_lease_token OR o.scan_lease_until IS NULL OR o.scan_lease_until<=t
 OR p_revision IS NULL OR p_revision IS DISTINCT FROM o.scan_lease_revision OR p_revision IS DISTINCT FROM o.revision
 OR o.status NOT IN ('UNPAID','PAYMENT_SEEN') THEN RAISE EXCEPTION 'STALE_OR_INVALID_LEASE'; END IF;
 IF p_events IS NULL OR jsonb_typeof(p_events)<>'array' THEN RAISE EXCEPTION 'INVALID_RECEIPT_BATCH'; END IF;
 IF jsonb_array_length(p_events) NOT BETWEEN 1 AND 32 THEN RAISE EXCEPTION 'INVALID_RECEIPT_BATCH'; END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(p_events) LOOP
  IF jsonb_typeof(e)<>'object' OR e->'finality_verified' IS DISTINCT FROM 'true'::jsonb OR e->'assignment_verified' IS DISTINCT FROM 'true'::jsonb OR e->'valuation_verified' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'UNVERIFIED_RECEIPT'; END IF;
  -- The trusted adapter, not the browser, must produce canonical transaction and event keys.
  PERFORM betinsight_pay_private.record_verified_transfer(p_order,e->>'network',e->>'txid',e->>'event_index',e->>'asset_identity',e->>'recipient',(e->>'tag')::bigint,(e->>'raw')::numeric,(e->>'payment_at')::timestamptz,e->'evidence',(e->>'eur_micro')::numeric,e->>'valuation_reference');
 END LOOP;
 SELECT status INTO st FROM betinsight_pay_private.orders WHERE id=p_order;
 IF st='VERIFIED_CANDIDATE' THEN
  st:=pay_posting_lab.settle(p_order);
 ELSIF st<>'MANUAL_REVIEW' THEN
  RAISE EXCEPTION 'UNEXPECTED_RECEIPT_STATE';
 END IF;
 UPDATE betinsight_pay_private.orders SET scan_lease_token=NULL,scan_lease_until=NULL,scan_lease_revision=NULL,last_scan_at=clock_timestamp(),last_scan_error=NULL,next_check_at=NULL WHERE id=p_order;
 RETURN st;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.lab_apply_verified_scan(uuid,uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
DO $$
DECLARE a record; o uuid; row_o betinsight_pay_private.orders%ROWTYPE; token uuid; batch jsonb; evt jsonb; tx text; v int; seq int:=0; passed int:=0; t timestamptz; status text; bad uuid; btoken uuid; brev bigint; under jsonb; admin uuid:=gen_random_uuid(); grantid uuid; ref text; bound jsonb; rev bigint; gross numeric;
BEGIN
 -- Disable due flags from preceding test fixtures only; never used on a live database.
 UPDATE betinsight_pay_private.orders SET next_check_at=NULL;
 INSERT INTO pay_posting_lab.members VALUES('integrated-fixture','integrated@example.invalid','INTEGRATED-OWNER','S1','S2','S3');
 FOR a IN SELECT * FROM (VALUES
 ('ETHEREUM','ETH',18),('ETHEREUM','USDT',6),('ETHEREUM','USDC',6),
 ('BSC','BNB',18),('BSC','USDT',18),('BSC','USDC',18),
 ('POLYGON','POL',18),('POLYGON','USDT',6),('POLYGON','USDC',6),
 ('TRON','TRX',6),('TRON','USDT',6),
 ('SOLANA','SOL',9),('SOLANA','USDT',6),('SOLANA','USDC',6),
 ('BITCOIN','BTC',8),('LITECOIN','LTC',8),('BITCOINCASH','BCH',8),('XRPL','XRP',6)
 ) AS x(network,asset,decimals)
 LOOP
  seq:=seq+1;
  SELECT version INTO v FROM betinsight_pay_private.lab_wallet_versions WHERE network=a.network AND active FOR UPDATE;
  IF NOT FOUND THEN v:=1; INSERT INTO betinsight_pay_private.lab_wallet_versions VALUES(a.network,v,true,false);
  ELSE UPDATE betinsight_pay_private.lab_wallet_versions SET frozen=false WHERE network=a.network AND version=v; END IF;
  INSERT INTO betinsight_pay_private.lab_allocations(network,wallet_version,recipient,tag,ownership_reference,enabled)
  VALUES(a.network,v,'integration-fixture-'||seq,CASE WHEN a.network='XRPL' THEN 90210 ELSE NULL END,'synthetic-proof',true);
  t:=clock_timestamp();
  o:=betinsight_pay_private.lab_reserve_order('integrated-fixture','integrated@example.invalid','starter','{}',50,49,a.network,a.asset,'fixture:'||a.network||':'||a.asset,49*power(10::numeric,a.decimals),a.decimals,1,1,t,t+interval '15 minutes','integration-'||seq);
  SELECT * INTO row_o FROM betinsight_pay_private.orders WHERE id=o;
  SELECT lease_token INTO token FROM betinsight_pay_private.claim_due_scans(1) WHERE order_id=o;
  IF NOT FOUND THEN RAISE EXCEPTION 'claim failed % %',a.network,a.asset; END IF;
  SELECT * INTO row_o FROM betinsight_pay_private.orders WHERE id=o;
  tx:=lpad(to_hex(seq+200),64,'0');
  IF a.network IN('ETHEREUM','BSC','POLYGON') THEN tx:='0x'||tx;
  ELSIF a.network='XRPL' THEN tx:=upper(tx);
  ELSIF a.network='SOLANA' THEN tx:=repeat('A',63)||substr('123456789ABCDEFGHJKLMNPQRSTUVWXYZ',seq,1); END IF;
  evt:=jsonb_build_object('network',a.network,'txid',tx,'event_index','0','asset_identity',row_o.asset_identity,'recipient',row_o.canonical_recipient,'tag',row_o.destination_tag,
   'raw',row_o.quote_raw,'payment_at',row_o.created_at,'evidence',jsonb_build_object('fixture',true),'eur_micro',49000000,'valuation_reference','synthetic-fixed-eur',
   'finality_verified',true,'assignment_verified',true,'valuation_verified',true);
  batch:=jsonb_build_array(evt);
  status:=betinsight_pay_private.lab_apply_verified_scan(o,token,row_o.revision,batch);
  IF status<>'SETTLED' OR NOT EXISTS(SELECT 1 FROM pay_posting_lab.purchases WHERE order_id=o AND units=50 AND actual_eur=49)
   OR NOT EXISTS(SELECT 1 FROM pay_posting_lab.lots WHERE order_id=o AND units_remaining=50)
   OR NOT EXISTS(SELECT 1 FROM pay_posting_lab.ledger WHERE order_id=o AND units_delta=50)
   OR (SELECT count(*) FROM pay_posting_lab.consumed_events WHERE order_id=o)<>1
   OR (SELECT count(*) FROM pay_posting_lab.referrals WHERE order_id=o)<>3
   OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.orders WHERE id=o AND status='SETTLED' AND scan_lease_token IS NULL AND canonical_intent_id IS NOT NULL)
  THEN RAISE EXCEPTION 'integrated settlement failed % %',a.network,a.asset; END IF;
  passed:=passed+1;
  RAISE NOTICE 'INTEGRATED % % -> 50 purchase units / EUR49 -> finance + ledger',a.network,a.asset;
 END LOOP;
 IF (SELECT purchased FROM pay_posting_lab.accounts WHERE owner_ref='INTEGRATED-OWNER')<>900 THEN RAISE EXCEPTION 'integrated total mismatch'; END IF; passed:=passed+1;
 BEGIN PERFORM betinsight_pay_private.lab_apply_verified_scan(o,token,row_o.revision,batch); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_INVALID_LEASE' THEN RAISE; END IF; END; passed:=passed+1;
 -- Underpaid order, mismatched event, and atomic scan/posting failure. Trusted evidence fixtures only.
 t:=clock_timestamp();
 SELECT version INTO v FROM betinsight_pay_private.lab_wallet_versions WHERE network='BSC' AND active;
 INSERT INTO betinsight_pay_private.lab_allocations(network,wallet_version,recipient,ownership_reference,enabled) VALUES('BSC',v,'integration-underpay','synthetic-proof',true);
 bad:=betinsight_pay_private.lab_reserve_order('integrated-fixture','integrated@example.invalid','starter','{}',50,49,'BSC','USDT','fixture:BSC:USDT',49000000,6,1,1,t,t+interval '15 minutes','integration-underpay');
 SELECT lease_token,order_revision INTO btoken,brev FROM betinsight_pay_private.claim_due_scans(1) WHERE order_id=bad;
 SELECT * INTO row_o FROM betinsight_pay_private.orders WHERE id=bad;
 under:=jsonb_build_object('network','BSC','txid','0x'||repeat('e',64),'event_index','0','asset_identity',row_o.asset_identity,'recipient',row_o.canonical_recipient,'tag',NULL,'raw',48000000,'payment_at',row_o.created_at,'evidence','{"fixture":true}'::jsonb,'eur_micro',48000000,'valuation_reference','synthetic','finality_verified',true,'assignment_verified',true,'valuation_verified',true);
 BEGIN PERFORM betinsight_pay_private.lab_apply_verified_scan(bad,gen_random_uuid(),brev,jsonb_build_array(under)); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_INVALID_LEASE' THEN RAISE; END IF; END; passed:=passed+1;
 BEGIN PERFORM betinsight_pay_private.lab_apply_verified_scan(bad,btoken,brev,jsonb_build_array(under||'{"finality_verified":false}'::jsonb)); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'UNVERIFIED_RECEIPT' THEN RAISE; END IF; END; passed:=passed+1;
 BEGIN PERFORM betinsight_pay_private.lab_apply_verified_scan(bad,btoken,brev,jsonb_build_array(under,under||'{"recipient":"wrong"}'::jsonb)); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'EVENT_ORDER_MISMATCH' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.verified_events WHERE order_id=bad) THEN RAISE EXCEPTION 'batch rollback failed'; END IF; passed:=passed+1;
 status:=betinsight_pay_private.lab_apply_verified_scan(bad,btoken,brev,jsonb_build_array(under));
 IF status<>'MANUAL_REVIEW' OR EXISTS(SELECT 1 FROM pay_posting_lab.purchases WHERE order_id=bad) THEN RAISE EXCEPTION 'underpayment credited'; END IF; passed:=passed+1;
 -- The existing master grant and manual approval are consumed in the same transaction.
 SELECT revision INTO rev FROM betinsight_pay_private.orders WHERE id=bad;
 bound:=jsonb_build_object('order',bad,'revision',rev,'units',49,'events',pay_posting_lab.snapshot(bad));
 t:=clock_timestamp(); ref:='integrated-manual-approval';
 INSERT INTO betinsight_pay_private.lab_master_sessions VALUES(admin,'integrated-master','MASTER',true,t+interval '1 hour');
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at) VALUES(gen_random_uuid(),admin,'integrated-master','MANUAL_SETTLEMENT',bound,t,t+interval '5 minutes') RETURNING grant_id INTO grantid;
 PERFORM betinsight_pay_private.lab_consume_stepup(admin,grantid,'MANUAL_SETTLEMENT',bound);
 INSERT INTO pay_posting_lab.approvals(ref,order_id,revision,event_snapshot,units,reason,expires_at) VALUES(ref,bad,rev,pay_posting_lab.snapshot(bad),49,'fixture authorized reduced units',t+interval '5 minutes');
 status:=pay_posting_lab.settle(bad,ref);
 IF status<>'SETTLED' OR NOT EXISTS(SELECT 1 FROM pay_posting_lab.purchases WHERE order_id=bad AND units=49 AND actual_eur=48)
 OR (SELECT purchased FROM pay_posting_lab.accounts WHERE owner_ref='INTEGRATED-OWNER')<>949 THEN RAISE EXCEPTION 'manual integrated settlement'; END IF; passed:=passed+1;
 IF has_function_privilege('anon','betinsight_pay_private.lab_apply_verified_scan(uuid,uuid,bigint,jsonb)','EXECUTE') OR has_function_privilege('service_role','betinsight_pay_private.lab_apply_verified_scan(uuid,uuid,bigint,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'privilege leak'; END IF; passed:=passed+1;
 RAISE NOTICE 'PAY-LAB INTEGRATED: % checks passed; 18 routes, test receipts, synthetic accounting only',passed;
END $$;
