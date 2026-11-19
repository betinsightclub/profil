\set ON_ERROR_STOP on
-- Isolated production-schema clone only. No real admin authorization or live deployment.
-- Requires stage-canonical-adapter.sql and fixed-wallet-checkout-review.sql.
BEGIN;
DO $$ BEGIN
 IF current_database()<>'betinsight_pay_stage' THEN RAISE EXCEPTION 'ISOLATED_STAGE_REQUIRED'; END IF;
END $$;
CREATE TABLE betinsight_pay_private.stage_manual_grants(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 challenge_id uuid NOT NULL UNIQUE,
 master_reference text NOT NULL CHECK(length(btrim(master_reference))>0),
 session_reference text NOT NULL CHECK(length(btrim(session_reference))>0),
 binding jsonb NOT NULL,
 verified_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL CHECK(expires_at>verified_at AND expires_at<=verified_at+interval '5 minutes'),
 used_at timestamptz
);
ALTER TABLE betinsight_pay_private.stage_manual_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON betinsight_pay_private.stage_manual_grants FROM PUBLIC,anon,authenticated,service_role;
-- Creates THE SAME locked payload to be shown and authorized by the master.
-- Caller supplies a decision only; amount and transferred asset come from verified events.
CREATE FUNCTION betinsight_pay_private.stage_manual_payload(p_order uuid,p_units numeric,p_reason text,p_attribution text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; n bigint; raw_total numeric; eur_micro numeric;
 received_at timestamptz; events jsonb; crypto numeric; received_eur numeric;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.status<>'MANUAL_REVIEW' OR o.canonical_intent_id IS NOT NULL THEN RAISE EXCEPTION 'MANUAL_ORDER_NOT_READY'; END IF;
 IF p_units IS NULL OR p_units<=0 OR p_units<>trunc(p_units) OR p_units>1000000 OR p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 1000 OR p_attribution IS NULL OR length(btrim(p_attribution)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'MANUAL_DECISION_INVALID'; END IF;
 PERFORM 1 FROM betinsight_pay_private.verified_events WHERE order_id=o.id ORDER BY network,txid,event_index FOR UPDATE;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.verified_events e WHERE e.order_id=o.id AND
  (e.network<>o.network OR e.asset_identity<>o.asset_identity OR e.canonical_recipient<>o.canonical_recipient OR e.destination_tag IS DISTINCT FROM o.destination_tag OR e.observed_payment_at<o.created_at OR e.observed_payment_at>clock_timestamp())) THEN RAISE EXCEPTION 'EVENT_MISMATCH'; END IF;
 SELECT count(*),sum(amount_raw),sum(valued_eur_micro),max(observed_payment_at),
 jsonb_agg(jsonb_build_object('network',network,'txid',txid,'event_index',event_index,'raw',amount_raw::text,'eur_micro',valued_eur_micro::text,'valuation_reference',valuation_reference,'paid_at',observed_payment_at) ORDER BY network,txid,event_index)
 INTO n,raw_total,eur_micro,received_at,events FROM betinsight_pay_private.verified_events WHERE order_id=o.id;
 IF n=0 OR raw_total IS NULL OR raw_total<=0 OR eur_micro IS NULL OR eur_micro<=0 THEN RAISE EXCEPTION 'NO_VERIFIED_FUNDS'; END IF;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.settlement_requests WHERE order_id=o.id) THEN RAISE EXCEPTION 'EXISTING_SETTLEMENT'; END IF;
 crypto:=raw_total/power(10::numeric,o.quote_decimals);received_eur:=eur_micro/1000000;
 RETURN jsonb_build_object('provider','betinsight_pay','provider_reference','direct-payment:'||o.id::text,'order_id',o.id,'order_revision',o.revision,'member_id',o.member_id,'email',o.email,'package_code',o.package_code,'package_snapshot',o.package_snapshot,'ordered_units',o.units,'credited_units',p_units,'invoice_eur',o.price_eur,'received_eur_micro',eur_micro::text,'received_eur',received_eur,'provider_fee_eur',0,'provider_fee_crypto',0,'gross_crypto',crypto,'net_crypto',crypto,'effective_eur_per_coin',received_eur/crypto,'network',o.network,'payment_currency',o.asset,'asset_identity',o.asset_identity,'wallet_version',o.wallet_version,'payment_at',received_at,'event_refs',events,'source_tag','DIRECT_CRYPTO_MANUAL_ACCEPTANCE','approval_mode','MASTER_MANUAL','reason',btrim(p_reason),'attribution_reference',btrim(p_attribution),'authorizes_production_posting',false);
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.stage_manual_payload(uuid,numeric,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Grant rows are fixture-only in stage. A production adapter must verify the real current master
-- session and independent attribution (not a customer-supplied txid or amount), then create the bound grant.
CREATE FUNCTION betinsight_pay_private.stage_settle_manual(p_order uuid,p_units numeric,p_reason text,p_attribution text,p_grant uuid,p_session text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; g betinsight_pay_private.stage_manual_grants%ROWTYPE;
 v jsonb;i uuid;public_ref text;n bigint;u numeric;t timestamptz;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
 IF o.status='SETTLED' THEN
  IF NOT EXISTS(SELECT 1 FROM betinsight_pay_private.settlement_requests s JOIN betinsight_pay_private.stage_manual_grants m ON m.id=p_grant JOIN public.betinsight_unit_ledger l ON l.intent_id=o.canonical_intent_id AND l.movement_type='PURCHASE_CREDIT' WHERE s.order_id=p_order AND s.approval_mode='MASTER_MANUAL' AND s.approval_reference=m.id::text AND m.session_reference=p_session AND m.used_at IS NOT NULL AND s.credited_units=p_units AND m.binding->>'reason'=btrim(p_reason) AND m.binding->>'attribution_reference'=btrim(p_attribution)) THEN RAISE EXCEPTION 'SETTLED_CONFLICT'; END IF;
  RETURN o.canonical_intent_id;
 END IF;
 v:=betinsight_pay_private.stage_manual_payload(p_order,p_units,p_reason,p_attribution);
 SELECT * INTO g FROM betinsight_pay_private.stage_manual_grants WHERE id=p_grant FOR UPDATE;
 t:=clock_timestamp();
 IF NOT FOUND OR g.used_at IS NOT NULL OR g.verified_at>t OR g.expires_at<=t OR g.binding IS DISTINCT FROM v OR g.session_reference IS DISTINCT FROM p_session THEN RAISE EXCEPTION 'FRESH_BOUND_MASTER_GRANT_REQUIRED'; END IF;
 v:=v||jsonb_build_object('approval_reference',g.id,'master_reference',g.master_reference,'approved_at',t);
 i:=gen_random_uuid();public_ref:='BI-PAY-DIRECT-'||p_order::text;
 INSERT INTO betinsight_pay_private.stage_canonical_inputs VALUES(i,p_order,v);
 -- Uses the same provider dispatcher and canonical finance/purchase logic as exact orders.
 INSERT INTO public.betinsight_payment_intents(id,public_id,idempotency_key,user_id,email,package_code,units,amount_eur,provider,order_number,status,provider_currency,provider_amount,invoice_total_sum,raw_invoice_response,paid_at,expires_at)
 VALUES(i,public_ref,'direct-payment:'||p_order::text,o.member_id,o.email,o.package_code,p_units,o.price_eur,'betinsight_pay',public_ref,'COMPLETED',o.asset,(v->>'gross_crypto')::numeric,(v->>'gross_crypto')::numeric,v,(v->>'payment_at')::timestamptz,o.expires_at);
 SELECT count(*),sum(units_delta) INTO n,u FROM public.betinsight_unit_ledger WHERE intent_id=i AND movement_type='PURCHASE_CREDIT';
 IF n<>1 OR u IS DISTINCT FROM p_units THEN RAISE EXCEPTION 'CANONICAL_LEDGER_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.betinsight_payment_finance f WHERE f.intent_id=i AND f.units=p_units AND f.net_after_provider_eur=(v->>'received_eur')::numeric AND f.provider_txn_id=v->>'provider_reference') THEN RAISE EXCEPTION 'CANONICAL_FINANCE_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.betinsight_unit_purchases p WHERE p.intent_id=i AND p.units_purchased=p_units AND p.source_tag='DIRECT_CRYPTO_MANUAL_ACCEPTANCE') THEN RAISE EXCEPTION 'CANONICAL_PURCHASE_MISMATCH'; END IF;
 INSERT INTO betinsight_pay_private.settlement_requests(order_id,order_revision,settlement_key,actual_eur_micro,credited_units,approval_mode,approval_reference,finance_snapshot)
 VALUES(p_order,o.revision,v->>'provider_reference',(v->>'received_eur_micro')::numeric,p_units,'MASTER_MANUAL',g.id::text,v);
 UPDATE betinsight_pay_private.stage_manual_grants SET used_at=t WHERE id=g.id;
 UPDATE betinsight_pay_private.orders SET status='SETTLED',canonical_intent_id=i,next_check_at=NULL,scan_lease_token=NULL,scan_lease_until=NULL,scan_lease_revision=NULL WHERE id=p_order;
 RETURN i;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.stage_settle_manual(uuid,numeric,text,text,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Remaining gates: real master auth/step-up and attribution adapter, real schema stage execution,
-- real payment evidence, canonical downstream finance parity, no production deployment.
