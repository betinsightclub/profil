\set ON_ERROR_STOP on
-- Isolated lab: atomic persistence AFTER trusted cryptographic verification.
-- Never expose this function to browsers or ordinary Supabase roles. Not a WebAuthn verifier.
DO $$ BEGIN IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF; END $$;
BEGIN;
CREATE TABLE betinsight_pay_private.lab_passkey_credentials(
 credential_id text PRIMARY KEY,admin_id text NOT NULL,
 public_key bytea NOT NULL CHECK(octet_length(public_key)>0),
 active boolean NOT NULL DEFAULT true,
 sign_count bigint NOT NULL CHECK(sign_count BETWEEN 0 AND 4294967295),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0)
);
CREATE TABLE betinsight_pay_private.lab_passkey_challenges(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challenge text UNIQUE NOT NULL CHECK(challenge ~ '^[A-Za-z0-9_-]{43,128}$'),
 session_id uuid NOT NULL REFERENCES betinsight_pay_private.lab_master_sessions(session_id),
 credential_id text NOT NULL REFERENCES betinsight_pay_private.lab_passkey_credentials(credential_id),
 purpose text NOT NULL CHECK(purpose IN ('WALLET_PROPOSE','WALLET_ACTIVATE','WALLET_FREEZE','MANUAL_SETTLEMENT')),
 binding jsonb NOT NULL CHECK(jsonb_typeof(binding)='object'),
 issued_at timestamptz NOT NULL, expires_at timestamptz NOT NULL CHECK(expires_at>issued_at AND expires_at<=issued_at+interval '2 minutes'),
 used_at timestamptz
);
ALTER TABLE betinsight_pay_private.lab_passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE betinsight_pay_private.lab_passkey_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.lab_passkey_credentials,betinsight_pay_private.lab_passkey_challenges FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION betinsight_pay_private.lab_commit_verified_assertion(
 p_session uuid,p_challenge uuid,p_credential text,p_credential_revision bigint,p_old_counter bigint,p_new_counter bigint,
 p_value text,p_purpose text,p_binding jsonb,p_verified_at timestamptz
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s betinsight_pay_private.lab_master_sessions%ROWTYPE; c betinsight_pay_private.lab_passkey_credentials%ROWTYPE;
 q betinsight_pay_private.lab_passkey_challenges%ROWTYPE; t timestamptz; grantid uuid;
BEGIN
 SELECT * INTO s FROM betinsight_pay_private.lab_master_sessions WHERE session_id=p_session FOR SHARE;
 IF NOT FOUND OR s.active IS DISTINCT FROM true OR s.role IS DISTINCT FROM 'MASTER' OR s.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'MASTER_SESSION_REQUIRED'; END IF;
 SELECT * INTO c FROM betinsight_pay_private.lab_passkey_credentials WHERE credential_id=p_credential FOR UPDATE;
 IF NOT FOUND OR c.active IS DISTINCT FROM true OR c.admin_id IS DISTINCT FROM s.admin_id OR c.revision IS DISTINCT FROM p_credential_revision OR c.sign_count IS DISTINCT FROM p_old_counter
 OR p_new_counter IS NULL OR p_new_counter NOT BETWEEN 0 AND 4294967295 OR NOT ((c.sign_count=0 AND p_new_counter=0) OR p_new_counter>c.sign_count)
 THEN RAISE EXCEPTION 'STALE_OR_REVOKED_CREDENTIAL'; END IF;
 SELECT * INTO q FROM betinsight_pay_private.lab_passkey_challenges WHERE id=p_challenge FOR UPDATE;
 t:=clock_timestamp();
 IF NOT FOUND OR s.expires_at<=t OR q.used_at IS NOT NULL OR q.session_id IS DISTINCT FROM s.session_id
 OR q.credential_id IS DISTINCT FROM c.credential_id OR q.challenge IS DISTINCT FROM p_value OR q.purpose IS DISTINCT FROM p_purpose OR q.binding IS DISTINCT FROM p_binding
 OR q.issued_at>t OR q.expires_at<=t OR p_verified_at IS NULL OR p_verified_at<q.issued_at OR p_verified_at>t OR p_verified_at< t-interval '15 seconds'
 THEN RAISE EXCEPTION 'INVALID_OR_USED_CHALLENGE'; END IF;
 UPDATE betinsight_pay_private.lab_passkey_credentials SET sign_count=p_new_counter,revision=revision+1 WHERE credential_id=c.credential_id;
 UPDATE betinsight_pay_private.lab_passkey_challenges SET used_at=t WHERE id=q.id;
 INSERT INTO betinsight_pay_private.lab_stepup_grants(challenge_id,session_id,admin_id,purpose,binding,verified_at,expires_at)
 VALUES(q.id,s.session_id,s.admin_id,q.purpose,q.binding,p_verified_at,p_verified_at+interval '5 minutes') RETURNING grant_id INTO grantid;
 RETURN grantid;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.lab_commit_verified_assertion(uuid,uuid,text,bigint,bigint,bigint,text,text,jsonb,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
DO $$
DECLARE s uuid:=gen_random_uuid(); q uuid; q2 uuid; g uuid; t timestamptz:=clock_timestamp(); b jsonb:='{"network":"BSC","version":1,"request":"fixture"}'; a text:=repeat('A',43); z text:=repeat('Z',43); pass int:=0;
BEGIN
 INSERT INTO betinsight_pay_private.lab_master_sessions VALUES(s,'fixture-crypto-bridge','MASTER',true,t+interval '1 hour');
 INSERT INTO betinsight_pay_private.lab_passkey_credentials(credential_id,admin_id,public_key,sign_count) VALUES('fixture-c','fixture-crypto-bridge',decode('0102','hex'),0);
 INSERT INTO betinsight_pay_private.lab_passkey_challenges(challenge,session_id,credential_id,purpose,binding,issued_at,expires_at) VALUES(a,s,'fixture-c','WALLET_PROPOSE',b,t,t+interval '2 minutes') RETURNING id INTO q;
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q,'fixture-c',1,0,1,z,'WALLET_PROPOSE',b,t); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'INVALID_OR_USED_CHALLENGE' THEN RAISE; END IF; END; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q,'fixture-c',1,0,1,a,'WALLET_PROPOSE',b||'{"version":2}',t); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'INVALID_OR_USED_CHALLENGE' THEN RAISE; END IF; END; pass:=pass+1;
 g:=betinsight_pay_private.lab_commit_verified_assertion(s,q,'fixture-c',1,0,1,a,'WALLET_PROPOSE',b,t);
 IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_stepup_grants WHERE grant_id=g AND challenge_id=q AND binding=b) OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_passkey_credentials WHERE credential_id='fixture-c' AND sign_count=1 AND revision=2) OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_passkey_challenges WHERE id=q AND used_at IS NOT NULL) THEN RAISE EXCEPTION 'incomplete atomic commit'; END IF; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q,'fixture-c',2,1,2,a,'WALLET_PROPOSE',b,t); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'INVALID_OR_USED_CHALLENGE' THEN RAISE; END IF; END; pass:=pass+1;
 INSERT INTO betinsight_pay_private.lab_passkey_challenges(challenge,session_id,credential_id,purpose,binding,issued_at,expires_at) VALUES(z,s,'fixture-c','WALLET_ACTIVATE',b,t,t+interval '2 minutes') RETURNING id INTO q2;
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q2,'fixture-c',1,0,2,z,'WALLET_ACTIVATE',b,t); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_REVOKED_CREDENTIAL' THEN RAISE; END IF; END; pass:=pass+1;
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q2,'fixture-c',2,1,1,z,'WALLET_ACTIVATE',b,t); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_REVOKED_CREDENTIAL' THEN RAISE; END IF; END; pass:=pass+1;
 UPDATE betinsight_pay_private.lab_passkey_credentials SET active=false WHERE credential_id='fixture-c';
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q2,'fixture-c',2,1,2,z,'WALLET_ACTIVATE',b,t); RAISE EXCEPTION 'unexpected success'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'STALE_OR_REVOKED_CREDENTIAL' THEN RAISE; END IF; END; pass:=pass+1;
 UPDATE betinsight_pay_private.lab_passkey_credentials SET active=true WHERE credential_id='fixture-c';
 BEGIN PERFORM betinsight_pay_private.lab_commit_verified_assertion(s,q2,'fixture-c',2,1,2,z,'WALLET_ACTIVATE',b,t); RAISE EXCEPTION 'fixture rollback'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'fixture rollback' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.lab_stepup_grants WHERE challenge_id=q2) OR NOT EXISTS(SELECT 1 FROM betinsight_pay_private.lab_passkey_credentials WHERE credential_id='fixture-c' AND revision=2 AND sign_count=1) OR EXISTS(SELECT 1 FROM betinsight_pay_private.lab_passkey_challenges WHERE id=q2 AND used_at IS NOT NULL) THEN RAISE EXCEPTION 'rollback failed'; END IF; pass:=pass+1;
 IF betinsight_pay_private.lab_consume_stepup(s,g,'WALLET_PROPOSE',b) IS DISTINCT FROM q THEN RAISE EXCEPTION 'grant consumption failed'; END IF; pass:=pass+1;
 IF has_function_privilege('anon','betinsight_pay_private.lab_commit_verified_assertion(uuid,uuid,text,bigint,bigint,bigint,text,text,jsonb,timestamptz)','EXECUTE') OR has_table_privilege('service_role','betinsight_pay_private.lab_passkey_credentials','UPDATE') THEN RAISE EXCEPTION 'privilege leak'; END IF; pass:=pass+1;
 RAISE NOTICE 'PAY-LAB PASSKEY PERSISTENCE: % checks passed (trusted verification result fixtures)',pass;
END $$;
