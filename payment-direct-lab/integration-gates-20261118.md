# BetInsight Pay — integration gates, 2026-11-18

Status: development only. No production migrations, deposits, service credentials or real wallet data have been written by this review.

## Confirmed lab results
- 79 disposable PostgreSQL checks (bridge, settlement model, scan scheduling, allocation, master grants, assertion persistence, rotation).
- 13 signed P-256 assertion checks using SimpleWebAuthn.
- 9 network connectivity and 9 token contract metadata checks.
- 8 of 9 network discovery diagnostics passed; BCH public sample found but complete discovery unproven. TRON live discovery covered TRX, not TRC20 USDT.
- These are component checks, not end-to-end authorization.

## Canonical finance integration (read-only live definition review)
Existing public.betinsight_post_completed_payment(uuid) locks the payment intent, deduplicates using payment-completed:<public_id>, calls public.betinsight_finalize_payment_finance(uuid), resolves the current sponsor chain, creates the canonical purchase and lot and posts the ledger.
Existing public.betinsight_on_payment_completed() invokes that function when status first becomes COMPLETED or the completed intent's raw response changes.

Blocking differences:
1. payment_intents.provider defaults to plisio; explicitly use a new provider identity, proposed betinsight_pay. Never forge Plisio callback evidence or call the Plisio API.
2. The current finance function interprets raw_invoice_response as Plisio and maps provider-specific currency routes. It also falls back to the catalog price if valuation is absent. For direct payments require independently verified network, event keys, actual received amount, EUR valuation, source and timestamp. Fail closed if missing.
3. Finance and user_credit_effects currently use catalog package price and units, while purchases use intent units. A manually approved 48 EUR/49 units case must use approved quantity and actual valuation consistently, including the per-unit referral rules; do not mutate the shared catalog to achieve this.
4. Current source tag defaults to PLISIO_PURCHASE and the lot uses plisio_txn_id. Add honest direct-provider provenance and a stable unique receipt reference with compatibility for old rows.
5. Existing auto-post trigger needs a provider-aware dispatch guard *before* a direct intent can be marked COMPLETED. All credit, purchase, lot, ledger, finance, referral and event consumption occur in one atomic transaction. Do not invoke old posting unchanged.
6. Preserve existing referral rules and partner cutoff behavior, FIFO, guarantee, accounting/history and idempotency. Exercise genuine schema/trigger parity in a disposable staging database, including old historical provider payment regression. No live test purchases as a substitute.
7. Audit readers, existing payment status polling, settlement and payout paths so no direct payment is sent to Plisio or added to an automatic payout queue that assumes Plisio custody.

## Receive wallet setup
Existing individual public addresses are not sufficient to derive additional addresses. Do not include actual addresses or extended public keys in the public repository. Never request or store seed phrases, private keys or xprv.
- EVM / TRON: wallet-supported address-pool import or appropriate account-level public derivation, with ownership proof, canonical network/address and derivation path verification. EVM networks may derive the same address; network and asset remain pinned to order.
- BTC / LTC / BCH: wallet-supported watch-only account/descriptor export or unique address pool; validate script template, network and derivation path, recovery and address use. No reallocation after expiry.
- Solana: standard hardened Ed25519 derivation does not allow deriving child wallets from an ordinary public address. Use wallet-controlled verified address pools plus verified associated token accounts.
- XRP: existing activated wallet with uniquely allocated destination tags after ownership proof and verified tag requirements. No public private-key material.
- DOGE, EUR SEPA, USD transfer: coming soon, disabled.
- Wallet application and supported public-only export/signing capabilities must be established before selecting concrete onboarding. A successful sign-message proof must be bound to wallet/network, version, request, admin and expiry; no payment or token approval is necessary.

## Gates still open
Registered owner passkeys and recovery, real wallet ownership control, signed proof and notifications, integrated live workers including durable cursor/late-fund handling, BCH complete discovery, TRC20 search test, canonical finance parity, browser/API authentication, actual end-to-end payment in staging, explicit launch approval. No production activation from this document.
