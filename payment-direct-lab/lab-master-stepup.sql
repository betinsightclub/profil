\set ON_ERROR_STOP on
-- Isolated lab of authorization grants AFTER cryptographic WebAuthn verification.
-- The test inserts synthetic verified assertions. Not a WebAuthn verifier or production auth endpoint.
DO $$ BEGIN IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF; END $$;
BEGIN;
CREATE TABLE betinsight_pay_private.lab_master_sessions(
 session_id uuid PRIMARY KEY, admin_id text NOT NULL, role text NOT NULL,
 active boolean NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE betinsight_pay_private.lab_stepup_grants(
 grant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 challenge_id uuid UNIQUE NOT NULL,
 session_id uuid NOT NULL REFERENCES betinsight_pay_private.lab_master_sessions(session_id),
 admin_id text NOT NULL,
 purpose text NOT NULL CHECK(purpose IN ('WALLET_PROPOSE','WALLET_ACTIVATE','WALLET_FREEZE','MANUAL_SETTLEMENT')),
 binding jsonb NOT NULL CHECK(jsonb_typeof(binding)='object'),
 verified_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL CHECK(expires_at>verified_at AND expires_at<=verified_at+interval '5 minutes'),
 consumed_at timestamptz
);
ALTER TABLE betinsight_pay_private.lab_master_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE betinsight_pay_private.lab_stepup_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.lab_master_sessions,betinsight_pay_private.lab_stepup_grants FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION betinsight_pay_private.lab_consume_stepup(
 p_session uuid,p_grant uuid,p_purpose text,p_binding jsonb,p_not_before timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s betinsight_pay_private.lab_master_sessions%ROWTYPE; g betinsight_pay_private.lab_stepup_grants%ROWTYPE; t timestamptz;
BEGIN
 -- The future real adapter must lock and recheck the existing active master account and session here.
 SELECT * INTO s FROM betinsight_pay_private.lab_master_sessions WHERE session_id=p_session FOR SHARE;
 t:=clock_timestamp();
 IF NOT FOUND OR s.active IS DISTINCT FROM true OR s.role IS DISTINCT FROM 'MASTER' OR s.expires_at<=t THEN RAISE EXCEPTION 'MASTER_SESSION_REQUIRED'; END IF;
 SELECT * INTO g FROM betinsight_pay_private.lab_stepup_grants WHERE grant_id=p_grant FOR UPDATE;
 t:=clock_timestamp();
 IF NOT FOUND OR s.expires_at<=t OR g.session_id IS DISTINCT FROM s.session_id OR g.admin_id IS DISTINCT FROM s.admin_id
 OR g.purpose IS DISTINCT FROM p_purpose OR g.binding IS DISTINCT FROM p_binding
 OR g.consumed_at IS NOT NULL OR g.verified_at>t OR g.expires_at<=t
 OR (p_not_before IS NOT NULL AND g.verified_at<p_not_before)
 THEN RAISE EXCEPTION 'FRESH_BOUND_GRANT_REQUIRED'; END IF;
 UPDATE betinsight_pay_private.lab_stepup_grants SET consumed_at=t WHERE grant_id=g.grant_id;
 RETURN g.challenge_id;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.lab_consume_stepup(uuid,uuid,text,jsonb,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
DO $$
DECLARE m uuid:=gen_random_uuid(); m2 uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); g uuid; g2 uuid; g3 uuid; ch uuid:=gen_random_uuid();
 t timestamptz:=clock_timestamp(); b jsonb:='{"network":"BSC","version":1,"recipient":"fixture-only","request":"test-1"}';
 pass integer:=0; r uuid;
BEGIN
 INSERT INTO betinsight_pay_private.lab_master_sessions VALUES (m,'fixture-master','MASTER',true,t+interval '1 hour'),(m2,'fixture-master','MASTER',true,t+interval '1 hour'),(a,'fixture-admin','ADMIN',true,t+interval '1 hour');
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at)
 VALUES(ch,m,'fixture-master','WALLET_PROPOSE',b,t,t+interval '5 minutes') RETURNING grant_id INTO g;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(a,g,'WALLET_PROPOSE',b);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'MASTER_SESSION_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m2,g,'WALLET_PROPOSE',b);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FRESH_BOUND_GRANT_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m,g,'WALLET_ACTIVATE',b);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FRESH_BOUND_GRANT_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m,g,'WALLET_PROPOSE',b||'{"recipient":"changed"}'::jsonb);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FRESH_BOUND_GRANT_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m,g,'WALLET_PROPOSE',b,t+interval '24 hours');
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FRESH_BOUND_GRANT_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 r:=betinsight_pay_private.lab_consume_stepup(m,g,'WALLET_PROPOSE',b);
 IF r IS DISTINCT FROM ch THEN RAISE EXCEPTION 'grant failed'; END IF; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m,g,'WALLET_PROPOSE',b);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FRESH_BOUND_GRANT_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at)
 VALUES(gen_random_uuid(),m,'fixture-master','WALLET_ACTIVATE',b,t-interval '10 minutes',t-interval '5 minutes') RETURNING grant_id INTO g2;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m,g2,'WALLET_ACTIVATE',b);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'FRESH_BOUND_GRANT_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at)
 VALUES(gen_random_uuid(),m,'fixture-master','WALLET_ACTIVATE',b,t,t+interval '5 minutes') RETURNING grant_id INTO g3;
 UPDATE betinsight_pay_private.lab_master_sessions SET active=false WHERE session_id=m;
 BEGIN PERFORM betinsight_pay_private.lab_consume_stepup(m,g3,'WALLET_ACTIVATE',b);
 RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'MASTER_SESSION_REQUIRED' THEN RAISE; END IF; END; pass:=pass+1;
 UPDATE betinsight_pay_private.lab_master_sessions SET active=true WHERE session_id=m;
 BEGIN
 PERFORM betinsight_pay_private.lab_consume_stepup(m,g3,'WALLET_ACTIVATE',b);
 RAISE EXCEPTION 'SIMULATED_ACTION_FAILURE';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'SIMULATED_ACTION_FAILURE' THEN RAISE; END IF; END;
 IF (SELECT consumed_at FROM betinsight_pay_private.lab_stepup_grants WHERE grant_id=g3) IS NOT NULL THEN RAISE EXCEPTION 'grant consumption did not roll back'; END IF; pass:=pass+1;
 IF has_function_privilege('anon','betinsight_pay_private.lab_consume_stepup(uuid,uuid,text,jsonb,timestamptz)','EXECUTE') OR has_table_privilege('service_role','betinsight_pay_private.lab_stepup_grants','INSERT') OR has_table_privilege('authenticated','betinsight_pay_private.lab_stepup_grants','UPDATE') THEN RAISE EXCEPTION 'privilege leak'; END IF; pass:=pass+1;
 RAISE NOTICE 'PAY-LAB STEPUP: % checks passed (synthetic assertions; not WebAuthn verification)',pass;
END $$;
