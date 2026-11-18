\set ON_ERROR_STOP on
-- Disposable database lab only. No scheduler, network calls, payment recognition or credits.
DO $$ BEGIN
 IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF;
END $$;
BEGIN;
ALTER TABLE betinsight_pay_private.orders
 ADD COLUMN scan_lease_token uuid,
 ADD COLUMN scan_lease_until timestamptz,
 ADD COLUMN scan_lease_revision bigint,
 ADD COLUMN last_scan_at timestamptz,
 ADD COLUMN last_scan_error text,
 ADD CONSTRAINT scan_lease_consistent CHECK (
 (scan_lease_token IS NULL AND scan_lease_until IS NULL AND scan_lease_revision IS NULL)
 OR (scan_lease_token IS NOT NULL AND scan_lease_until IS NOT NULL AND scan_lease_revision IS NOT NULL));
CREATE FUNCTION betinsight_pay_private.claim_due_scans(p_limit integer DEFAULT 5)
RETURNS TABLE(order_id uuid, lease_token uuid, lease_until timestamptz, order_revision bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'BAD_LIMIT'; END IF;
 RETURN QUERY
 WITH due AS (
 SELECT o.id FROM betinsight_pay_private.orders o
 WHERE o.network<>'DOGECOIN' AND o.status IN ('UNPAID','PAYMENT_SEEN')
 AND o.next_check_at<=clock_timestamp()
 AND (o.scan_lease_until IS NULL OR o.scan_lease_until<=clock_timestamp())
 ORDER BY o.next_check_at,o.id LIMIT p_limit FOR UPDATE SKIP LOCKED
 )
 UPDATE betinsight_pay_private.orders o
 SET scan_lease_token=gen_random_uuid(),scan_lease_until=clock_timestamp()+interval '2 minutes',scan_lease_revision=o.revision
 FROM due WHERE o.id=due.id
 RETURNING o.id,o.scan_lease_token,o.scan_lease_until,o.scan_lease_revision;
END $$;
-- Only observation outcomes, never proof of payment; verified events remain the independent bridge.
CREATE FUNCTION betinsight_pay_private.finish_scan(p_order uuid,p_token uuid,p_revision bigint,p_result text,p_error text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; t timestamptz; n integer; mins integer;
 new_state text; next_at timestamptz; err text;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
 t:=clock_timestamp();
 IF p_token IS NULL OR p_token IS DISTINCT FROM o.scan_lease_token OR o.scan_lease_until IS NULL OR o.scan_lease_until<=t
 OR p_revision IS NULL OR p_revision IS DISTINCT FROM o.scan_lease_revision OR p_revision IS DISTINCT FROM o.revision
 OR o.status NOT IN ('UNPAID','PAYMENT_SEEN') THEN RAISE EXCEPTION 'STALE_OR_INVALID_LEASE'; END IF;
 IF p_result IS NULL OR p_result NOT IN ('EMPTY','SEEN','RETRY') THEN RAISE EXCEPTION 'INVALID_SCAN_RESULT'; END IF;
 IF p_result='RETRY' AND (p_error IS NULL OR length(btrim(p_error))=0 OR length(p_error)>120) THEN RAISE EXCEPTION 'ERROR_CODE_REQUIRED'; END IF;
 mins:=CASE o.network WHEN 'BITCOINCASH' THEN 20 WHEN 'BITCOIN' THEN 10 WHEN 'LITECOIN' THEN 5 ELSE 3 END;
 n:=o.empty_checks;
 new_state:=CASE WHEN p_result='SEEN' OR o.status='PAYMENT_SEEN' THEN 'PAYMENT_SEEN' ELSE 'UNPAID' END;
 IF new_state='UNPAID' AND p_result='EMPTY' THEN n:=least(n,1000000)+1; END IF;
 err:=CASE WHEN p_result='RETRY' THEN p_error ELSE NULL END;
 IF new_state='PAYMENT_SEEN' THEN
 next_at:=t+make_interval(mins=>mins);
 ELSIF t>=o.created_at+interval '7 days' THEN
 new_state:=CASE WHEN p_result='RETRY' THEN 'MANUAL_REVIEW' ELSE 'STOPPED' END; next_at:=NULL;
 ELSIF t>=o.created_at+interval '1 day' THEN
 next_at:=least(t+interval '1 day',o.created_at+interval '7 days');
 ELSE
 IF p_result='EMPTY' THEN mins:=least(1440,mins*power(2,least(12,greatest(0,n-9)))::integer); END IF;
 next_at:=least(t+make_interval(mins=>mins),o.created_at+interval '1 day');
 END IF;
 UPDATE betinsight_pay_private.orders SET status=new_state,next_check_at=next_at,empty_checks=n,last_scan_at=t,last_scan_error=err,
 scan_lease_token=NULL,scan_lease_until=NULL,scan_lease_revision=NULL,revision=revision+1 WHERE id=p_order;
 RETURN new_state;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.claim_due_scans(integer) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION betinsight_pay_private.finish_scan(uuid,uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
DO $$
DECLARE a uuid; b uuid; c uuid; d uuid; t timestamptz:=clock_timestamp(); x record; y record; s text; passed int:=0;
BEGIN
 FOR j IN 1..4 LOOP
 INSERT INTO betinsight_pay_private.orders(member_id,email,package_code,package_snapshot,units,price_eur,network,asset,asset_identity,wallet_version,canonical_recipient,allocation_kind,quote_raw,quote_decimals,rate_eur,rate_usd,rate_at,created_at,expires_at,idempotency_key,next_check_at)
 VALUES('scan-fixture','scan@example.invalid','starter','{}',50,49,CASE WHEN j=4 THEN 'DOGECOIN' ELSE 'BITCOIN' END,CASE WHEN j=4 THEN 'DOGE' ELSE 'BTC' END,'synthetic',1,'scan-'||j,'unique-address',100,8,1,1,t,t-interval '10 minutes',t+interval '50 minutes','scan-'||j,CASE WHEN j IN (1,4) THEN t-interval '1 second' ELSE t+interval '1 hour' END)
 RETURNING id INTO d;
 IF j=1 THEN a:=d; ELSIF j=2 THEN b:=d; ELSIF j=3 THEN c:=d; END IF;
 END LOOP;
 SELECT * INTO x FROM betinsight_pay_private.claim_due_scans(5);
 IF NOT FOUND OR x.order_id IS DISTINCT FROM a THEN RAISE EXCEPTION 'claim failed'; END IF; passed:=passed+1;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.claim_due_scans(5)) THEN RAISE EXCEPTION 'duplicate claim or DOGE enabled'; END IF; passed:=passed+1;
 s:=betinsight_pay_private.finish_scan(a,x.lease_token,x.order_revision,'RETRY','HTTP_429');
 IF s<>'UNPAID' OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.orders WHERE id=a AND empty_checks=0 AND last_scan_error='HTTP_429' AND scan_lease_token IS NULL AND next_check_at>clock_timestamp()) THEN RAISE EXCEPTION 'retry counted empty'; END IF; passed:=passed+1;
 UPDATE betinsight_pay_private.orders SET next_check_at=t-interval '1 second',empty_checks=9 WHERE id=a;
 SELECT * INTO x FROM betinsight_pay_private.claim_due_scans(1);
 s:=betinsight_pay_private.finish_scan(a,x.lease_token,x.order_revision,'EMPTY');
 IF s<>'UNPAID' OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.orders WHERE id=a AND empty_checks=10 AND next_check_at=last_scan_at+interval '20 minutes') THEN RAISE EXCEPTION 'backoff failed'; END IF; passed:=passed+1;
 UPDATE betinsight_pay_private.orders SET next_check_at=t-interval '1 second' WHERE id=a;
 SELECT * INTO x FROM betinsight_pay_private.claim_due_scans(1);
 UPDATE betinsight_pay_private.orders SET scan_lease_until=t-interval '1 second' WHERE id=a;
 SELECT * INTO y FROM betinsight_pay_private.claim_due_scans(1);
 IF y.lease_token IS NULL OR y.lease_token=x.lease_token THEN RAISE EXCEPTION 'expired claim not replaced'; END IF; passed:=passed+1;
 BEGIN
 PERFORM betinsight_pay_private.finish_scan(a,x.lease_token,x.order_revision,'EMPTY');
 RAISE EXCEPTION 'unexpected success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_INVALID_LEASE' THEN RAISE; END IF; END; passed:=passed+1;
 s:=betinsight_pay_private.finish_scan(a,y.lease_token,y.order_revision,'SEEN');
 IF s<>'PAYMENT_SEEN' OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.orders WHERE id=a AND empty_checks=10 AND next_check_at=last_scan_at+interval '10 minutes') THEN RAISE EXCEPTION 'seen cadence'; END IF; passed:=passed+1;
 UPDATE betinsight_pay_private.orders SET next_check_at=t-interval '1 second' WHERE id=a;
 SELECT * INTO x FROM betinsight_pay_private.claim_due_scans(1);
 s:=betinsight_pay_private.finish_scan(a,x.lease_token,x.order_revision,'EMPTY');
 IF s<>'PAYMENT_SEEN' OR (SELECT empty_checks FROM betinsight_pay_private.orders WHERE id=a)<>10 THEN RAISE EXCEPTION 'seen regressed'; END IF; passed:=passed+1;
 UPDATE betinsight_pay_private.orders SET created_at=t-interval '8 days',next_check_at=t-interval '1 second' WHERE id=b;
 SELECT * INTO x FROM betinsight_pay_private.claim_due_scans(1);
 s:=betinsight_pay_private.finish_scan(b,x.lease_token,x.order_revision,'RETRY','RPC_TIMEOUT');
 IF s<>'MANUAL_REVIEW' OR (SELECT next_check_at FROM betinsight_pay_private.orders WHERE id=b) IS NOT NULL THEN RAISE EXCEPTION 'timeout lost'; END IF; passed:=passed+1;
 UPDATE betinsight_pay_private.orders SET created_at=t-interval '8 days',next_check_at=t-interval '1 second' WHERE id=c;
 SELECT * INTO x FROM betinsight_pay_private.claim_due_scans(1);
 s:=betinsight_pay_private.finish_scan(c,x.lease_token,x.order_revision,'EMPTY');
 IF s<>'STOPPED' THEN RAISE EXCEPTION 'horizon failed'; END IF; passed:=passed+1;
 IF has_function_privilege('anon','betinsight_pay_private.claim_due_scans(integer)','EXECUTE') OR has_function_privilege('authenticated','betinsight_pay_private.finish_scan(uuid,uuid,bigint,text,text)','EXECUTE') OR has_function_privilege('service_role','betinsight_pay_private.finish_scan(uuid,uuid,bigint,text,text)','EXECUTE') THEN RAISE EXCEPTION 'privilege leak'; END IF; passed:=passed+1;
 RAISE NOTICE 'PAY-LAB SCANS: % checks passed (lease and schedule model only)',passed;
END $$;
