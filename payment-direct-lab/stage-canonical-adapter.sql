\set ON_ERROR_STOP on
-- ISOLATED COPY OF REAL SCHEMA ONLY. Never execute on production.
-- Generate derived routines from the existing canonical definitions, preserving original public functions.
-- No data, credentials or wallet addresses included. No deployment, no grant to API roles.
BEGIN;
DO $$ BEGIN
 IF current_database()<>'betinsight_pay_stage' THEN RAISE EXCEPTION 'ISOLATED_STAGE_DATABASE_REQUIRED'; END IF;
 IF to_regprocedure('betinsight_pay_private.canonical_finance_input(uuid)') IS NULL THEN RAISE EXCEPTION 'STAGE_ORDER_SCHEMA_REQUIRED'; END IF;
END $$;
CREATE FUNCTION betinsight_pay_private.stage_replace_exact(p_source text,p_old text,p_new text,p_count integer)
 RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF (length(p_source)-length(replace(p_source,p_old,'')))/length(p_old)<>p_count THEN RAISE EXCEPTION 'CANONICAL_DEFINITION_CHANGED: %',left(p_old,100); END IF;
 RETURN replace(p_source,p_old,p_new);
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.stage_replace_exact(text,text,text,integer) FROM PUBLIC,anon,authenticated,service_role;
DO $$
DECLARE f text:=pg_get_functiondef('public.betinsight_finalize_payment_finance(uuid)'::regprocedure);
 p text:=pg_get_functiondef('public.betinsight_post_completed_payment(uuid)'::regprocedure);
BEGIN
 f:=betinsight_pay_private.stage_replace_exact(f,$patch$public.betinsight_finalize_payment_finance(p_intent_id uuid)$patch$,$patch$betinsight_pay_private.stage_finalize_direct(p_intent_id uuid, p_direct jsonb)$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$public.betinsight_post_completed_payment(p_intent_id uuid)$patch$,$patch$betinsight_pay_private.stage_post_direct(p_intent_id uuid, p_direct jsonb)$patch$,1);
 f:=betinsight_pay_private.stage_replace_exact(f,$patch$ SECURITY DEFINER$patch$,$patch$ SECURITY INVOKER$patch$,1);
 f:=betinsight_pay_private.stage_replace_exact(f,$patch$ SET search_path TO 'public'$patch$,$patch$ SET search_path TO ''$patch$,1);
 f:=betinsight_pay_private.stage_replace_exact(f,$patch$  if i.status<>'COMPLETED' then return jsonb_build_object('ok',false,'skipped',true,'reason','NOT_COMPLETED'); end if;$patch$,$patch$  if i.status<>'COMPLETED' or i.provider<>'betinsight_pay' or i.plisio_txn_id is not null
     or p_direct->>'provider' is distinct from 'betinsight_pay'
     or i.raw_invoice_response is distinct from p_direct then raise exception 'DIRECT_INTENT_MISMATCH'; end if;$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$ SECURITY DEFINER$patch$,$patch$ SECURITY INVOKER$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$ SET search_path TO 'public', 'pg_temp'$patch$,$patch$ SET search_path TO ''$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$  if i.status<>'COMPLETED' then return jsonb_build_object('ok',false,'skipped',true,'reason','NOT_COMPLETED'); end if;$patch$,$patch$  if i.status<>'COMPLETED' or i.provider<>'betinsight_pay' or i.plisio_txn_id is not null
     or p_direct->>'provider' is distinct from 'betinsight_pay'
     or i.raw_invoice_response is distinct from p_direct then raise exception 'DIRECT_INTENT_MISMATCH'; end if;$patch$,1);
 f:=betinsight_pay_private.stage_replace_exact(f,$patch$  raw:=coalesce(i.raw_invoice_response,'{}'::jsonb);
  txn:=coalesce(nullif(raw->>'txn_id',''),i.plisio_txn_id);
  psys:=coalesce(nullif(raw->>'psys_cid',''),nullif(raw->>'currency',''));
  curr:=coalesce(nullif(raw->>'currency',''),psys);
  pay_currency:=case
    when psys in ('USDT_TRX','USDT_TON','USDT') then 'USDT'
    when psys in ('USDC_BSC','USDС_BSC') then 'USDC'
    else coalesce(curr,psys) end;
  pay_network:=case
    when psys='USDT_TRX' then 'TRC-20' when psys='USDT_TON' then 'TON'
    when psys='USDT' then 'ERC-20' when psys in ('USDC_BSC','USDС_BSC') then 'BEP-20'
    when psys='BNB' then 'BNB Chain' when psys='BTC' then 'Bitcoin'
    when psys='ETH' then 'Ethereum' when psys='SOL' then 'Solana'
    when psys='TON' then 'TON' when psys='TRX' then 'TRON'
    else coalesce(psys,curr) end;

  gross_crypto:=coalesce(public.betinsight_payment_num(raw,'invoice_total_sum'),public.betinsight_payment_num(raw,'amount'));
  fee_crypto:=public.betinsight_payment_num(raw,'invoice_commission');
  net_crypto:=coalesce(public.betinsight_payment_num(raw,'invoice_sum'),public.betinsight_payment_num(raw,'amount'));
  source_rate:=public.betinsight_payment_num(raw,'source_rate');
  if source_rate is not null and source_rate>0 then eur_rate:=1/source_rate; end if;

  if fee_crypto is not null and eur_rate is not null then fee_eur:=round(fee_crypto*eur_rate,6);
  elsif gross_crypto is not null and net_crypto is not null and eur_rate is not null then fee_eur:=round((gross_crypto-net_crypto)*eur_rate,6); end if;

  if net_crypto is not null and eur_rate is not null then net_eur:=round(net_crypto*eur_rate,6);
  else net_eur:=round(p.price_eur-coalesce(fee_eur,0),6); end if;

$patch$,$patch$  -- Provider-neutral, independently valued direct receipt. No legacy catalog fallback.
  raw:=p_direct;
  txn:=p_direct->>'provider_reference';
  pay_currency:=p_direct->>'payment_currency';
  pay_network:=p_direct->>'network';
  gross_crypto:=(p_direct->>'gross_crypto')::numeric;
  fee_crypto:=0;
  net_crypto:=gross_crypto;
  net_eur:=(p_direct->>'received_eur')::numeric;
  fee_eur:=0;
  eur_rate:=(p_direct->>'effective_eur_per_coin')::numeric;
  if txn is null or pay_currency is null or pay_network is null or gross_crypto is null or gross_crypto<=0 or net_eur is null or net_eur<=0 or eur_rate is null or eur_rate<=0 then raise exception 'DIRECT_VALUATION_REQUIRED'; end if;
  if p.ref_per_unit_l1 is distinct from 0.05::numeric or p.ref_per_unit_l2 is distinct from 0.03::numeric or p.ref_per_unit_l3 is distinct from 0.02::numeric or p.ref_l1_pct is distinct from 5::numeric or p.ref_l2_pct is distinct from 3::numeric or p.ref_l3_pct is distinct from 2::numeric then raise exception 'REFERRAL_RULE_CHANGED'; end if;
  p.price_eur:=i.amount_eur;
  p.units:=i.units;
  p.ref_expected_units_l1:=i.units*p.ref_per_unit_l1;
  p.ref_expected_units_l2:=i.units*p.ref_per_unit_l2;
  p.ref_expected_units_l3:=i.units*p.ref_per_unit_l3;

$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$  perform public.betinsight_finalize_payment_finance(i.id);$patch$,$patch$  perform betinsight_pay_private.stage_finalize_direct(i.id,p_direct);$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$case when coalesce(i.raw_invoice_response->>'manual_accept','false')='true' then 'MANUAL_ACCEPTED_PROVIDER_PAYMENT' else 'PLISIO_PURCHASE' end$patch$,$patch$p_direct->>'source_tag'$patch$,2);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$i.plisio_txn_id,'completed'$patch$,$patch$p_direct->>'provider_reference','completed'$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$pu.purchase_id,owner,i.plisio_txn_id,$patch$,$patch$pu.purchase_id,owner,p_direct->>'provider_reference',$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$'provider_txn_id',i.plisio_txn_id,$patch$,$patch$'provider_txn_id',p_direct->>'provider_reference',$patch$,1);
 p:=betinsight_pay_private.stage_replace_exact(p,$patch$  select * into n from public.betinsight_user_network
   where (i.user_id is not null and user_id=i.user_id) or lower(email)=lower(i.email)
   order by case when i.user_id is not null and user_id=i.user_id then 0 else 1 end limit 1;$patch$,$patch$  select * into n from public.betinsight_user_network
   where user_id=i.user_id and lower(email)=lower(i.email) for share;$patch$,1);
 f:=betinsight_pay_private.stage_replace_exact(f,$patch$  select * into n from public.betinsight_user_network
  where (i.user_id is not null and user_id=i.user_id) or lower(email)=lower(i.email)
  order by case when i.user_id is not null and user_id=i.user_id then 0 else 1 end limit 1;$patch$,$patch$  select * into n from public.betinsight_user_network
  where user_id=i.user_id and lower(email)=lower(i.email) for share;$patch$,1);
 EXECUTE f; EXECUTE p;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.stage_finalize_direct(uuid,jsonb),betinsight_pay_private.stage_post_direct(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE betinsight_pay_private.stage_canonical_inputs(
 intent_id uuid PRIMARY KEY, order_id uuid NOT NULL UNIQUE REFERENCES betinsight_pay_private.orders(id), payload jsonb NOT NULL
);
ALTER TABLE betinsight_pay_private.stage_canonical_inputs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.stage_canonical_inputs FROM PUBLIC,anon,authenticated,service_role;
-- Dispatch using a locked private input. No provider spoofing, no Plisio transaction ID.
-- Preserve the original Plisio dispatch for the isolated copy.
CREATE OR REPLACE FUNCTION public.betinsight_on_payment_completed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v jsonb; posted jsonb;
BEGIN
 IF new.status='COMPLETED' AND (tg_op='INSERT' OR old.status IS DISTINCT FROM 'COMPLETED' OR old.raw_invoice_response IS DISTINCT FROM new.raw_invoice_response) THEN
  IF new.provider='betinsight_pay' THEN
   SELECT payload INTO v FROM betinsight_pay_private.stage_canonical_inputs WHERE intent_id=new.id FOR SHARE;
   IF NOT FOUND OR v IS DISTINCT FROM new.raw_invoice_response THEN RAISE EXCEPTION 'UNVERIFIED_DIRECT_INTENT'; END IF;
   posted:=betinsight_pay_private.stage_post_direct(new.id,v);
   IF posted->'ok' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'DIRECT_POST_FAILED'; END IF;
  ELSIF new.provider='plisio' THEN PERFORM public.betinsight_post_completed_payment(new.id);
  ELSE RAISE EXCEPTION 'UNSUPPORTED_PROVIDER'; END IF;
 END IF;
 RETURN new;
END $$;
-- Guard the legacy callable functions from accidentally reinterpreting direct intents.
-- Applied only to the isolated schema clone. Preserve all original function privileges.
DO $$
DECLARE f text; p text; old text:='  if not found then raise exception ''INTENT_NOT_FOUND''; end if;';
 replacement text:=old||E'\n  if i.provider is distinct from ''plisio'' then raise exception ''LEGACY_PROVIDER_REQUIRED''; end if;';
BEGIN
 f:=pg_get_functiondef('public.betinsight_finalize_payment_finance(uuid)'::regprocedure);
 p:=pg_get_functiondef('public.betinsight_post_completed_payment(uuid)'::regprocedure);
 EXECUTE betinsight_pay_private.stage_replace_exact(f,old,replacement,1);
 EXECUTE betinsight_pay_private.stage_replace_exact(p,old,replacement,1);
END $$;
CREATE FUNCTION betinsight_pay_private.stage_settle_exact(p_order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; v jsonb; i uuid; public_ref text; n bigint; u numeric;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
 IF o.status='SETTLED' THEN
  IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.stage_canonical_inputs x JOIN public.betinsight_unit_ledger l ON l.intent_id=x.intent_id WHERE x.order_id=p_order AND x.intent_id=o.canonical_intent_id AND l.movement_type='PURCHASE_CREDIT') THEN RAISE EXCEPTION 'INCONSISTENT_SETTLEMENT'; END IF;
  RETURN o.canonical_intent_id;
 END IF;
 -- Shared wallet exact amount is insufficient attribution; this routine will not accept it.
 IF o.allocation_kind NOT IN('unique-address','xrpl-tag') THEN RAISE EXCEPTION 'MANUAL_ATTRIBUTION_REQUIRED'; END IF;
 v:=betinsight_pay_private.canonical_finance_input(p_order);
 i:=gen_random_uuid();public_ref:='BI-PAY-DIRECT-'||p_order::text;
 INSERT INTO betinsight_pay_private.stage_canonical_inputs VALUES(i,p_order,v);
 INSERT INTO public.betinsight_payment_intents(id,public_id,idempotency_key,user_id,email,package_code,units,amount_eur,provider,order_number,status,provider_currency,provider_amount,invoice_total_sum,raw_invoice_response,paid_at,expires_at)
 VALUES(i,public_ref,'direct-payment:'||p_order::text,o.member_id,o.email,o.package_code,o.units,o.price_eur,'betinsight_pay',public_ref,'COMPLETED',o.asset,(v->>'gross_crypto')::numeric,(v->>'gross_crypto')::numeric,v,(v->>'payment_at')::timestamptz,o.expires_at);
 SELECT count(*),sum(units_delta) INTO n,u FROM public.betinsight_unit_ledger WHERE intent_id=i AND movement_type='PURCHASE_CREDIT';
 IF n<>1 OR u IS DISTINCT FROM o.units THEN RAISE EXCEPTION 'CANONICAL_LEDGER_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.betinsight_payment_finance f WHERE f.intent_id=i AND f.units=o.units AND f.net_after_provider_eur=(v->>'received_eur')::numeric AND f.provider_txn_id=v->>'provider_reference') THEN RAISE EXCEPTION 'CANONICAL_FINANCE_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.betinsight_unit_purchases p WHERE p.intent_id=i AND p.units_purchased=o.units AND p.source_tag='DIRECT_CRYPTO_PURCHASE') THEN RAISE EXCEPTION 'CANONICAL_PURCHASE_MISMATCH'; END IF;
 INSERT INTO betinsight_pay_private.settlement_requests(order_id,order_revision,settlement_key,actual_eur_micro,credited_units,approval_mode,finance_snapshot)
 VALUES(p_order,o.revision,v->>'provider_reference',(v->>'received_eur_micro')::numeric,o.units,'EXACT_AUTO',v);
 UPDATE betinsight_pay_private.orders SET status='SETTLED',canonical_intent_id=i,next_check_at=NULL WHERE id=p_order;
 RETURN i;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.stage_settle_exact(uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Still required: schema-only stage clone and execute full posting + rollback + downstream parity,
-- master verified manual association path for shared wallets, worker and real end-to-end receipt.
