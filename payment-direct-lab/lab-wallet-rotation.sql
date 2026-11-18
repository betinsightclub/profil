\set ON_ERROR_STOP on
-- Isolated lab, synthetic proof and notification evidence only.
DO $$ BEGIN IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF; END $$;
BEGIN;
CREATE TABLE betinsight_pay_private.lab_verified_wallet_sets(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),network text NOT NULL,version integer NOT NULL,
 proof_reference text NOT NULL CHECK(length(proof_reference)>0),
 verified_at timestamptz NOT NULL,revoked boolean NOT NULL DEFAULT false,
 UNIQUE(network,version), FOREIGN KEY(network,version) REFERENCES betinsight_pay_private.lab_wallet_versions(network,version)
);
CREATE TABLE betinsight_pay_private.lab_rotation_requests(
 id uuid PRIMARY KEY,network text NOT NULL,old_version integer NOT NULL,new_version integer NOT NULL,
 wallet_set uuid NOT NULL UNIQUE REFERENCES betinsight_pay_private.lab_verified_wallet_sets(id),
 proposed_challenge uuid NOT NULL UNIQUE, proposed_at timestamptz NOT NULL,
 not_before timestamptz NOT NULL,expires_at timestamptz NOT NULL,
 notification_reference text, notified_at timestamptz,
 activated_challenge uuid UNIQUE,activated_at timestamptz,
 CHECK(new_version>old_version), CHECK(not_before=proposed_at+interval '24 hours'),
 CHECK(expires_at=proposed_at+interval '7 days')
);
CREATE UNIQUE INDEX lab_one_pending_rotation ON betinsight_pay_private.lab_rotation_requests(network) WHERE activated_at IS NULL;
CREATE TABLE betinsight_pay_private.lab_rotation_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,request_id uuid NOT NULL,
 network text NOT NULL,event text NOT NULL,session_id uuid NOT NULL,occurred_at timestamptz NOT NULL
);
ALTER TABLE betinsight_pay_private.lab_verified_wallet_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE betinsight_pay_private.lab_rotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE betinsight_pay_private.lab_rotation_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.lab_verified_wallet_sets,betinsight_pay_private.lab_rotation_requests,betinsight_pay_private.lab_rotation_audit FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION betinsight_pay_private.lab_propose_rotation(p_session uuid,p_grant uuid,p_request uuid,p_network text,p_old integer,p_set uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v betinsight_pay_private.lab_wallet_versions%ROWTYPE; w betinsight_pay_private.lab_verified_wallet_sets%ROWTYPE; ch uuid; t timestamptz;
BEGIN
 IF p_network IS NULL OR p_network NOT IN ('BSC','ETHEREUM','POLYGON','TRON','SOLANA','BITCOIN','BITCOINCASH','LITECOIN','XRPL') OR p_request IS NULL THEN RAISE EXCEPTION 'NETWORK_UNAVAILABLE'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('pay-rotation:'||p_network,0));
 SELECT * INTO v FROM betinsight_pay_private.lab_wallet_versions WHERE network=p_network AND active FOR UPDATE;
 IF NOT FOUND OR v.version IS DISTINCT FROM p_old OR v.frozen THEN RAISE EXCEPTION 'STALE_OR_FROZEN_WALLET'; END IF;
 SELECT * INTO w FROM betinsight_pay_private.lab_verified_wallet_sets WHERE id=p_set FOR UPDATE;
 IF NOT FOUND OR w.network IS DISTINCT FROM p_network OR w.revoked OR w.version<=p_old THEN RAISE EXCEPTION 'WALLET_PROOF_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_allocations WHERE network=p_network AND wallet_version=w.version AND enabled AND assigned_order IS NULL) THEN RAISE EXCEPTION 'EMPTY_WALLET_POOL'; END IF;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.lab_rotation_requests WHERE network=p_network AND activated_at IS NULL) THEN RAISE EXCEPTION 'PENDING_ROTATION_EXISTS'; END IF;
 ch:=betinsight_pay_private.lab_consume_stepup(p_session,p_grant,'WALLET_PROPOSE',jsonb_build_object('request',p_request,'network',p_network,'old_version',p_old,'wallet_set',p_set,'new_version',w.version));
 t:=clock_timestamp();
 INSERT INTO betinsight_pay_private.lab_rotation_requests(id,network,old_version,new_version,wallet_set,proposed_challenge,proposed_at,not_before,expires_at)
 VALUES(p_request,p_network,p_old,w.version,p_set,ch,t,t+interval '24 hours',t+interval '7 days');
 INSERT INTO betinsight_pay_private.lab_rotation_audit(request_id,network,event,session_id,occurred_at) VALUES(p_request,p_network,'PROPOSED',p_session,t);
 RETURN p_request;
END $$;
CREATE FUNCTION betinsight_pay_private.lab_activate_rotation(p_session uuid,p_grant uuid,p_request uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r betinsight_pay_private.lab_rotation_requests%ROWTYPE; v betinsight_pay_private.lab_wallet_versions%ROWTYPE; w betinsight_pay_private.lab_verified_wallet_sets%ROWTYPE; ch uuid; t timestamptz; net text;
BEGIN
 SELECT network INTO net FROM betinsight_pay_private.lab_rotation_requests WHERE id=p_request;
 IF NOT FOUND THEN RAISE EXCEPTION 'ROTATION_NOT_FOUND'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('pay-rotation:'||net,0));
 SELECT * INTO r FROM betinsight_pay_private.lab_rotation_requests WHERE id=p_request FOR UPDATE;
 SELECT * INTO v FROM betinsight_pay_private.lab_wallet_versions WHERE network=net AND active FOR UPDATE;
 IF NOT FOUND OR v.version<>r.old_version OR v.frozen THEN RAISE EXCEPTION 'STALE_OR_FROZEN_WALLET'; END IF;
 SELECT * INTO w FROM betinsight_pay_private.lab_verified_wallet_sets WHERE id=r.wallet_set FOR UPDATE;
 IF NOT FOUND OR w.revoked OR w.network<>net OR w.version<>r.new_version THEN RAISE EXCEPTION 'WALLET_PROOF_REQUIRED'; END IF;
 t:=clock_timestamp();
 IF r.activated_at IS NOT NULL OR t<r.not_before OR t>=r.expires_at THEN RAISE EXCEPTION 'ROTATION_TIME_BLOCKED'; END IF;
 IF r.notification_reference IS NULL OR length(r.notification_reference)=0 OR r.notified_at IS NULL OR r.notified_at<r.proposed_at OR r.notified_at>t THEN RAISE EXCEPTION 'NOTIFICATION_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_allocations WHERE network=net AND wallet_version=r.new_version AND enabled AND assigned_order IS NULL) THEN RAISE EXCEPTION 'EMPTY_WALLET_POOL'; END IF;
 ch:=betinsight_pay_private.lab_consume_stepup(p_session,p_grant,'WALLET_ACTIVATE',jsonb_build_object('request',r.id,'network',net,'old_version',r.old_version,'wallet_set',r.wallet_set,'new_version',r.new_version),r.not_before);
 IF ch=r.proposed_challenge THEN RAISE EXCEPTION 'SECOND_CHALLENGE_REQUIRED'; END IF;
 t:=clock_timestamp();
 IF t>=r.expires_at THEN RAISE EXCEPTION 'ROTATION_TIME_BLOCKED'; END IF;
 UPDATE betinsight_pay_private.lab_wallet_versions SET active=false WHERE network=net AND version=r.old_version;
 UPDATE betinsight_pay_private.lab_wallet_versions SET active=true,frozen=false WHERE network=net AND version=r.new_version AND NOT active;
 IF NOT FOUND THEN RAISE EXCEPTION 'NEW_VERSION_UNAVAILABLE'; END IF;
 UPDATE betinsight_pay_private.lab_rotation_requests SET activated_challenge=ch,activated_at=t WHERE id=r.id;
 INSERT INTO betinsight_pay_private.lab_rotation_audit(request_id,network,event,session_id,occurred_at) VALUES(r.id,net,'ACTIVATED',p_session,t);
 RETURN r.new_version;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.lab_propose_rotation(uuid,uuid,uuid,text,integer,uuid),betinsight_pay_private.lab_activate_rotation(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
DO $$
DECLARE s uuid:=gen_random_uuid(); w uuid; req uuid:=gen_random_uuid(); g uuid; g2 uuid; o uuid; o2 uuid; t timestamptz:=clock_timestamp(); b jsonb; pass int:=0;
BEGIN
 INSERT INTO betinsight_pay_private.lab_master_sessions VALUES(s,'fixture-rotation-master','MASTER',true,t+interval '1 hour');
 INSERT INTO betinsight_pay_private.lab_wallet_versions(network,version,active,frozen) VALUES('POLYGON',1,true,false),('POLYGON',2,false,true);
 INSERT INTO betinsight_pay_private.lab_allocations(network,wallet_version,recipient,ownership_reference,enabled) VALUES('POLYGON',1,'rotation-fixture-old','test-old-proof',true),('POLYGON',2,'rotation-fixture-new','test-new-proof',true);
 INSERT INTO betinsight_pay_private.lab_verified_wallet_sets(network,version,proof_reference,verified_at) VALUES('POLYGON',2,'fixture-proof-not-real',t) RETURNING id INTO w;
 b:=jsonb_build_object('request',req,'network','POLYGON','old_version',1,'wallet_set',w,'new_version',2);
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at) VALUES(gen_random_uuid(),s,'fixture-rotation-master','WALLET_PROPOSE',b,t,t+interval '5 minutes') RETURNING grant_id INTO g;
 o:=betinsight_pay_private.lab_reserve_order('rotation-member','r@example.invalid','starter','{}',50,49,'POLYGON','POL','fixture-native',100,18,1,1,t,t+interval '15 minutes','rot-1');
 IF betinsight_pay_private.lab_propose_rotation(s,g,req,'POLYGON',1,w)<>req THEN RAISE EXCEPTION 'proposal failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_wallet_versions WHERE network='POLYGON' AND version=1 AND active) THEN RAISE EXCEPTION 'early change'; END IF; pass:=pass+1;
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at) VALUES(gen_random_uuid(),s,'fixture-rotation-master','WALLET_ACTIVATE',b,t,t+interval '5 minutes') RETURNING grant_id INTO g2;
 BEGIN PERFORM betinsight_pay_private.lab_activate_rotation(s,g2,req); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'ROTATION_TIME_BLOCKED' THEN RAISE; END IF; END; pass:=pass+1;
 -- The test alone ages the synthetic request; real time is never bypassed in the activation function.
 UPDATE betinsight_pay_private.lab_rotation_requests SET proposed_at=t-interval '25 hours',not_before=t-interval '1 hour',expires_at=t+interval '143 hours' WHERE id=req;
 BEGIN PERFORM betinsight_pay_private.lab_activate_rotation(s,g2,req); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'NOTIFICATION_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 UPDATE betinsight_pay_private.lab_rotation_requests SET notification_reference='synthetic-delivery',notified_at=t-interval '24 hours' WHERE id=req;
 UPDATE betinsight_pay_private.lab_verified_wallet_sets SET revoked=true WHERE id=w;
 BEGIN PERFORM betinsight_pay_private.lab_activate_rotation(s,g2,req); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'WALLET_PROOF_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 UPDATE betinsight_pay_private.lab_verified_wallet_sets SET revoked=false WHERE id=w;
 IF betinsight_pay_private.lab_activate_rotation(s,g2,req)<>2 THEN RAISE EXCEPTION 'activation failed'; END IF; pass:=pass+1;
 o2:=betinsight_pay_private.lab_reserve_order('rotation-member','r@example.invalid','starter','{}',50,49,'POLYGON','POL','fixture-native',100,18,1,1,t,t+interval '15 minutes','rot-2');
 IF (SELECT wallet_version FROM betinsight_pay_private.orders WHERE id=o)<>1 OR (SELECT wallet_version FROM betinsight_pay_private.orders WHERE id=o2)<>2 THEN RAISE EXCEPTION 'order wallet history changed'; END IF; pass:=pass+1;
 IF (SELECT count(*) FROM betinsight_pay_private.lab_rotation_audit WHERE request_id=req)<>2 OR EXISTS(SELECT 1 FROM betinsight_pay_private.lab_stepup_grants WHERE grant_id IN(g,g2) AND consumed_at IS NULL) THEN RAISE EXCEPTION 'audit or grants'; END IF; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_activate_rotation(s,g2,req); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_FROZEN_WALLET' THEN RAISE; END IF; END; pass:=pass+1;
 IF has_function_privilege('anon','betinsight_pay_private.lab_activate_rotation(uuid,uuid,uuid)','EXECUTE') OR has_table_privilege('service_role','betinsight_pay_private.lab_rotation_requests','UPDATE') THEN RAISE EXCEPTION 'privilege leak'; END IF; pass:=pass+1;
 RAISE NOTICE 'PAY-LAB WALLET ROTATION: % checks passed (synthetic ownership and notification evidence)',pass;
END $$;
