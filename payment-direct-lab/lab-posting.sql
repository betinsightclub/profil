\set ON_ERROR_STOP on
-- DISPOSABLE LAB ONLY. Models canonical BetInsight effects, does not replace production tables or triggers.
DO $$ BEGIN
 IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF;
END $$;
BEGIN;
CREATE SCHEMA pay_posting_lab;
REVOKE ALL ON SCHEMA pay_posting_lab FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE pay_posting_lab.members(
 member_id text PRIMARY KEY, email text NOT NULL UNIQUE, owner_ref text NOT NULL UNIQUE,
 sponsor1 text,sponsor2 text,sponsor3 text
);
CREATE TABLE pay_posting_lab.accounts(
 owner_ref text PRIMARY KEY REFERENCES pay_posting_lab.members(owner_ref),
 gift numeric NOT NULL DEFAULT 0, purchased numeric NOT NULL DEFAULT 0, referral numeric NOT NULL DEFAULT 0,
 CHECK(gift>=0 AND purchased>=0 AND referral>=0)
);
CREATE TABLE pay_posting_lab.approvals(
 ref text PRIMARY KEY, order_id uuid NOT NULL REFERENCES betinsight_pay_private.orders(id),
 revision bigint NOT NULL, event_snapshot jsonb NOT NULL, units numeric NOT NULL CHECK(units>0 AND units=trunc(units)),
 reason text NOT NULL CHECK(length(btrim(reason))>0), expires_at timestamptz NOT NULL, used_at timestamptz
);
-- A lab approval is a fixture, NOT a real authenticated master challenge.
CREATE TABLE pay_posting_lab.purchases(
 order_id uuid PRIMARY KEY REFERENCES betinsight_pay_private.orders(id), intent_id uuid NOT NULL UNIQUE REFERENCES public.betinsight_payment_intents(id),
 owner_ref text NOT NULL REFERENCES pay_posting_lab.members(owner_ref),
 purchase_key text NOT NULL UNIQUE, units numeric NOT NULL CHECK(units>0),
 actual_eur numeric NOT NULL CHECK(actual_eur>0), invoice_eur numeric NOT NULL,
 ordered_units numeric NOT NULL, source_tag text NOT NULL
);
CREATE TABLE pay_posting_lab.finance(
 order_id uuid PRIMARY KEY REFERENCES pay_posting_lab.purchases(order_id),
 actual_eur numeric NOT NULL, operating_eur numeric NOT NULL, affiliate_eur numeric NOT NULL,
 distributable_eur numeric NOT NULL, immediate_eur numeric NOT NULL, usage_eur numeric NOT NULL,
 admin1_eur numeric NOT NULL, admin2_gross_eur numeric NOT NULL, admin2_tax_eur numeric NOT NULL,
 admin2_net_eur numeric NOT NULL, admin3_eur numeric NOT NULL, special_eur numeric NOT NULL,
 CHECK(actual_eur=operating_eur+affiliate_eur+distributable_eur),
 CHECK(distributable_eur=immediate_eur+usage_eur),
 CHECK(immediate_eur=admin1_eur+admin2_gross_eur+admin3_eur+special_eur),
 CHECK(admin2_gross_eur=admin2_tax_eur+admin2_net_eur)
);
CREATE TABLE pay_posting_lab.lots(
 order_id uuid PRIMARY KEY REFERENCES pay_posting_lab.purchases(order_id), units_initial numeric NOT NULL,
 units_used numeric NOT NULL DEFAULT 0, units_remaining numeric NOT NULL,
 net_per_unit_eur numeric NOT NULL, usage_per_unit_eur numeric NOT NULL,
 CHECK(units_initial=units_used+units_remaining AND units_remaining>=0 AND units_used>=0)
);
CREATE TABLE pay_posting_lab.ledger(
 event_key text PRIMARY KEY, order_id uuid UNIQUE NOT NULL REFERENCES pay_posting_lab.purchases(order_id),
 owner_ref text NOT NULL, units_delta numeric NOT NULL CHECK(units_delta>0), movement_type text NOT NULL,
 source_tag text NOT NULL, metadata jsonb NOT NULL
);
CREATE TABLE pay_posting_lab.referrals(
 order_id uuid NOT NULL REFERENCES pay_posting_lab.purchases(order_id), level integer NOT NULL CHECK(level BETWEEN 1 AND 3),
 sponsor text, rate numeric NOT NULL, expected_units numeric NOT NULL, released_units numeric NOT NULL DEFAULT 0,
 reserved_eur numeric NOT NULL, company_eur numeric NOT NULL, PRIMARY KEY(order_id,level)
);
CREATE TABLE pay_posting_lab.consumed_events(
 network text NOT NULL, txid text NOT NULL, event_index text NOT NULL, order_id uuid NOT NULL REFERENCES pay_posting_lab.purchases(order_id),
 PRIMARY KEY(network,txid,event_index),
 FOREIGN KEY(network,txid,event_index) REFERENCES betinsight_pay_private.verified_events(network,txid,event_index)
);
CREATE FUNCTION pay_posting_lab.snapshot(p_order uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_array(network,txid,event_index,amount_raw,valued_eur_micro,valuation_reference) ORDER BY network,txid,event_index),'[]'::jsonb)
 FROM betinsight_pay_private.verified_events WHERE order_id=p_order
$$;
CREATE FUNCTION pay_posting_lab.settle(p_order uuid,p_approval text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o betinsight_pay_private.orders%ROWTYPE; m pay_posting_lab.members%ROWTYPE;
 a pay_posting_lab.approvals%ROWTYPE; i uuid; k text; u numeric; gross numeric; raw_total numeric;
 late boolean; op numeric; aff numeric; dist numeric; imm numeric; usepool numeric;
 adm1 numeric; adm2 numeric; tax2 numeric; adm3 numeric; reserve numeric; s text; pct numeric; lev integer;
 source text; n int;
BEGIN
 IF current_database()<>'betinsight_pay_lab' THEN RAISE EXCEPTION 'LAB_DATABASE_REQUIRED'; END IF;
 SELECT * INTO o FROM betinsight_pay_private.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
 IF o.status='SETTLED' THEN
  IF NOT EXISTS(SELECT 1 FROM pay_posting_lab.purchases WHERE order_id=p_order AND intent_id=o.canonical_intent_id) THEN RAISE EXCEPTION 'INCONSISTENT_SETTLED'; END IF;
  RETURN 'ALREADY_SETTLED';
 END IF;
 IF o.status NOT IN ('VERIFIED_CANDIDATE','MANUAL_REVIEW') THEN RAISE EXCEPTION 'NOT_READY'; END IF;
 SELECT * INTO m FROM pay_posting_lab.members WHERE member_id=o.member_id AND email=o.email FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MEMBER_MISMATCH'; END IF;
 SELECT sum(amount_raw),sum(valued_eur_micro)/1000000,bool_or(observed_payment_at>o.expires_at),count(*)
 INTO raw_total,gross,late,n FROM betinsight_pay_private.verified_events
 WHERE order_id=p_order;
 IF n=0 OR gross<=0 THEN RAISE EXCEPTION 'NO_FUNDS'; END IF;
 IF EXISTS(SELECT 1 FROM betinsight_pay_private.verified_events e WHERE order_id=p_order AND
 (e.network IS DISTINCT FROM o.network OR e.asset_identity IS DISTINCT FROM o.asset_identity OR e.canonical_recipient IS DISTINCT FROM o.canonical_recipient OR e.destination_tag IS DISTINCT FROM o.destination_tag)) THEN RAISE EXCEPTION 'EVENT_MISMATCH'; END IF;
 IF p_approval IS NULL THEN
  IF o.status<>'VERIFIED_CANDIDATE' OR raw_total<>o.quote_raw OR late THEN RAISE EXCEPTION 'MANUAL_REQUIRED'; END IF;
  u:=o.units; source:='DIRECT_CRYPTO_PURCHASE';
 ELSE
  SELECT * INTO a FROM pay_posting_lab.approvals WHERE ref=p_approval FOR UPDATE;
  IF NOT FOUND OR a.order_id<>p_order OR a.revision<>o.revision OR a.used_at IS NOT NULL OR a.expires_at<=now()
   OR a.event_snapshot IS DISTINCT FROM pay_posting_lab.snapshot(p_order) THEN RAISE EXCEPTION 'APPROVAL_INVALID'; END IF;
  u:=a.units; source:='DIRECT_CRYPTO_MANUAL_ACCEPTANCE';
 END IF;
 IF u<=0 OR u<>trunc(u) OR u>1000000 THEN RAISE EXCEPTION 'BAD_UNITS'; END IF;
 op:=round(gross*0.025,6); aff:=round(gross*0.10,6); dist:=gross-op-aff;
 imm:=round(dist*0.40,6); usepool:=dist-imm;
 adm1:=round(imm*0.40,6); adm2:=round(imm*0.30,6); tax2:=round(adm2*0.25,6);
 -- Current effective ADM-003 cutoff is fixed as a lab fixture; production must read authoritative rule.
 adm3:=0; reserve:=imm-adm1-adm2;
 k:='direct-payment:'||p_order::text;
 INSERT INTO public.betinsight_payment_intents DEFAULT VALUES RETURNING id INTO i;
 INSERT INTO pay_posting_lab.purchases VALUES(p_order,i,m.owner_ref,k,u,gross,o.price_eur,o.units,source);
 INSERT INTO pay_posting_lab.finance VALUES(p_order,gross,op,aff,dist,imm,usepool,adm1,adm2,tax2,adm2-tax2,adm3,reserve);
 INSERT INTO pay_posting_lab.lots VALUES(p_order,u,0,u,round(dist/u,10),round(usepool/u,10));
 INSERT INTO pay_posting_lab.ledger VALUES(k,p_order,m.owner_ref,u,'PURCHASE_CREDIT',source,
 jsonb_build_object('received_eur',gross,'invoice_eur',o.price_eur,'ordered_units',o.units,'credited_units',u));
 INSERT INTO pay_posting_lab.accounts(owner_ref,purchased) VALUES(m.owner_ref,u)
 ON CONFLICT(owner_ref) DO UPDATE SET purchased=pay_posting_lab.accounts.purchased+excluded.purchased;
 FOR lev IN 1..3 LOOP
  s:=CASE lev WHEN 1 THEN m.sponsor1 WHEN 2 THEN m.sponsor2 ELSE m.sponsor3 END;
  pct:=CASE lev WHEN 1 THEN 0.05 WHEN 2 THEN 0.03 ELSE 0.02 END;
  INSERT INTO pay_posting_lab.referrals VALUES(p_order,lev,s,pct,CASE WHEN s IS NULL THEN 0 ELSE u*pct END,0,
   CASE WHEN s IS NULL THEN 0 ELSE round(gross*pct,6) END,CASE WHEN s IS NULL THEN round(gross*pct,6) ELSE 0 END);
 END LOOP;
 IF (SELECT sum(reserved_eur+company_eur) FROM pay_posting_lab.referrals WHERE order_id=p_order)<>aff THEN RAISE EXCEPTION 'REFERRAL_ROUNDING'; END IF;
 INSERT INTO pay_posting_lab.consumed_events SELECT network,txid,event_index,order_id FROM betinsight_pay_private.verified_events WHERE order_id=p_order;
 IF p_approval IS NOT NULL THEN UPDATE pay_posting_lab.approvals SET used_at=now() WHERE ref=p_approval; END IF;
 INSERT INTO betinsight_pay_private.settlement_requests(order_id,order_revision,settlement_key,actual_eur_micro,credited_units,approval_mode,approval_reference,finance_snapshot)
 VALUES(p_order,o.revision,k,gross*1000000,u,CASE WHEN p_approval IS NULL THEN 'EXACT_AUTO' ELSE 'MASTER_MANUAL' END,p_approval,
 (SELECT to_jsonb(f) FROM pay_posting_lab.finance f WHERE order_id=p_order));
 UPDATE betinsight_pay_private.orders SET status='SETTLED',canonical_intent_id=i,next_check_at=NULL WHERE id=p_order;
 RETURN 'SETTLED';
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA pay_posting_lab FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pay_posting_lab FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
