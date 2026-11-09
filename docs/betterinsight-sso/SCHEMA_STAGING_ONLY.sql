-- STAGING ONLY. NOT APPLIED TO PRODUCTION.
-- Encrypted code is never persisted; only SHA-256 code hashes are stored.
-- Requires reviewed server-side Supabase Edge Functions and explicit shared secret.
BEGIN;
CREATE TABLE IF NOT EXISTS public.betinsight_betterinsight_sso_codes (
  code_hash text PRIMARY KEY CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  user_id text NOT NULL CHECK (length(user_id) BETWEEN 1 AND 64),
  audience text NOT NULL DEFAULT 'betterinsight' CHECK (audience = 'betterinsight'),
  redirect_uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS betinsight_betterinsight_sso_expiry_idx
  ON public.betinsight_betterinsight_sso_codes (expires_at);
ALTER TABLE public.betinsight_betterinsight_sso_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.betinsight_betterinsight_sso_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.betinsight_betterinsight_sso_codes TO service_role;

-- Only the server-side service role can redeem a code, atomically and once.
CREATE OR REPLACE FUNCTION public.betinsight_betterinsight_sso_redeem_v1(
  p_code_hash text,
  p_redirect_uri text
) RETURNS TABLE(user_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.betinsight_betterinsight_sso_codes
     SET consumed_at = clock_timestamp()
   WHERE code_hash = p_code_hash
     AND audience = 'betterinsight'
     AND redirect_uri = p_redirect_uri
     AND consumed_at IS NULL
     AND expires_at > clock_timestamp()
  RETURNING user_id;
$$;
REVOKE ALL ON FUNCTION public.betinsight_betterinsight_sso_redeem_v1(text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.betinsight_betterinsight_sso_redeem_v1(text,text)
  TO service_role;
COMMIT;
