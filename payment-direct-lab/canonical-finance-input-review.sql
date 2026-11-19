-- REVIEW ONLY. Not a production migration. No writes to public accounting tables.
-- Purpose: supply provider-neutral, order-bound data for canonical finance integration.
-- Expects database-bridge-review.sql. This rejects unapproved deviations; no implicit catalog fallback.
BEGIN;
CREATE FUNCTION betinsight_pay_private.canonical_finance_input(p_order uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE;
 n bigint; raw_total numeric; eur_micro numeric; seen_late boolean; last_received timestamptz;
 event_refs jsonb; crypto numeric; received_eur numeric; data jsonb;
BEGIN
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
 IF o.status<>'VERIFIED_CANDIDATE' OR o.canonical_intent_id IS NOT NULL THEN RAISE EXCEPTION 'NOT_EXACT_AUTO_READY'; END IF;
 -- Lock event rows as well; the insert adapter must always lock the order first.
 PERFORM 1 FROM betinsight_pay_private.verified_events WHERE order_id=o.id ORDER BY network,txid,event_index FOR UPDATE;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.verified_events e WHERE e.order_id=o.id AND
  (e.network<>o.network OR e.asset_identity<>o.asset_identity OR e.canonical_recipient<>o.canonical_recipient
   OR e.destination_tag IS DISTINCT FROM o.destination_tag OR e.observed_payment_at<o.created_at))
 THEN RAISE EXCEPTION 'EVENT_MISMATCH'; END IF;
 SELECT count(*),sum(amount_raw),sum(valued_eur_micro),bool_or(observed_payment_at>o.expires_at),max(observed_payment_at),
  jsonb_agg(jsonb_build_object('network',network,'txid',txid,'event_index',event_index,'raw',amount_raw::text,
   'eur_micro',valued_eur_micro::text,'valuation_reference',valuation_reference,'paid_at',observed_payment_at) ORDER BY network,txid,event_index)
 INTO n,raw_total,eur_micro,seen_late,last_received,event_refs
 FROM betinsight_pay_private.verified_events WHERE order_id=o.id;
 IF n=0 OR raw_total IS DISTINCT FROM o.quote_raw OR eur_micro IS NULL OR eur_micro<=0 OR seen_late IS DISTINCT FROM false THEN RAISE EXCEPTION 'MANUAL_REVIEW_REQUIRED'; END IF;
 IF o.units<>trunc(o.units) OR o.units<=0 THEN RAISE EXCEPTION 'INVALID_UNITS'; END IF;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.settlement_requests WHERE order_id=o.id) THEN RAISE EXCEPTION 'EXISTING_SETTLEMENT'; END IF;
 crypto:=raw_total / power(10::numeric,o.quote_decimals);
 received_eur:=eur_micro/1000000;
 data:=jsonb_build_object(
  'provider','betinsight_pay','provider_reference','direct-payment:'||o.id::text,
  'order_id',o.id,'order_revision',o.revision,'member_id',o.member_id,'email',o.email,
  'package_code',o.package_code,'package_snapshot',o.package_snapshot,'ordered_units',o.units,'credited_units',o.units,
  'invoice_eur',o.price_eur,'received_eur_micro',eur_micro::text,'received_eur',received_eur,
  'provider_fee_eur',0,'provider_fee_crypto',0,'gross_crypto',crypto,'net_crypto',crypto,
  'effective_eur_per_coin',received_eur/crypto,'network',o.network,'payment_currency',o.asset,
  'asset_identity',o.asset_identity,'wallet_version',o.wallet_version,'payment_at',last_received,
  'event_refs',event_refs,'source_tag','DIRECT_CRYPTO_PURCHASE',
  'approval_mode','EXACT_AUTO','authorizes_production_posting',false);
 RETURN data;
END $$;
REVOKE ALL ON FUNCTION betinsight_pay_private.canonical_finance_input(uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Open integration tasks: canonical membership recheck, provider-aware intent creation/dispatch,
-- atomic canonical posting, privilege boundary, verified event writer, real chain verification,
-- independent valuation policy, reconciliation inbox, approved deviation path, downstream parity.
