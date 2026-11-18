\set ON_ERROR_STOP on
-- ISOLATED DISPOSABLE PostgreSQL 17 database only. No production credentials or data.
DO $$ BEGIN
 IF current_database() <> 'betinsight_pay_lab' OR to_regclass('public.betinsight_payment_intents') IS NOT NULL OR to_regnamespace('betinsight_pay_private') IS NOT NULL THEN
 RAISE EXCEPTION 'Refusing to initialize: database must be a fresh betinsight_pay_lab';
 END IF;
END $$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE TABLE public.betinsight_payment_packages(code text PRIMARY KEY);
CREATE TABLE public.betinsight_payment_intents(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
INSERT INTO public.betinsight_payment_packages VALUES ('starter');
