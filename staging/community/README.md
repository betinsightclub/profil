# Trainer Feed Billing / Moderation – STAGING 2026-09-27

**Status:** prepared on branch `feature/trainer-feed-billing-20260927`. Do not merge/deploy until the dedicated fractional Unit charging workflow has been wired and tested.

## Product rules

- A member can always post on **their own trainer profile for free**.
- A member can choose **Trainer Feed + all trainer profiles**. The post is stored once with `distribution_scope=GLOBAL`; it is not duplicated per profile.
- Global distribution costs:
  - **Basis:** 0.50 Units per global post. No monthly cap was specified, so none is invented.
  - **Premium:** 0.25 Units per global post, maximum 10 per calendar month.
  - **Premium Plus:** 0.10 Units per global post, maximum 20 per calendar month.
- Month boundaries use Europe/Berlin to match the rest of the BetInsight monthly logic.
- Membership privileges are based on **effective paid status**, not only on an old Premium label:
  - active paid period -> keep Premium/Premium Plus;
  - grace period -> keep the tier, status KULANZ;
  - expired/unpaid/unconfirmed -> effective tier BASIS.
- Backoffice shows raw/effective membership, payment confirmation, expiry, available Units, global-post usage and global-feed Unit charges.
- Regular posts, comments, stickers/emotions, reactions and normal images do **not** require routine manual approval.
- An external link creates `PENDING_REVIEW`. Only after admin approval may a global link post be charged/published.
- Illegal/high-risk hard-filter matches are rejected automatically; they are not routed into the routine approval queue.
- User reports are always visible in the moderation backoffice, together with the reported target content.

## Required Unit service before go-live

The staged Edge Functions expect a server-to-server Unit service via environment variables:
- `COMMUNITY_UNIT_WEBHOOK`
- `COMMUNITY_UNIT_SECRET`

The Unit service must support an idempotent **charge** operation with:
- `owner_ref`
- `units` (fractional values 0.50 / 0.25 / 0.10)
- `request_id` (format `COMMUNITY_POST:<uuid>`)
- `reason=community_global_post`
- tier/month metadata

The service must:
1. verify the secret;
2. reject duplicate `request_id` charges idempotently;
3. verify the actual current Unit balance;
4. deduct through the existing BetInsight Unit/FIFO accounting without corrupting purchase batches, gift/referral balances or UNIT_AUDIT;
5. return a transaction/reference id and balance before/after.

**Do not reuse the tip-unlock endpoint with a fake tip id.** Global-feed charges need a dedicated accounting path.

## Deployment order

1. Complete and test the inactive Make Unit-charge workflow.
2. Apply `20260927_trainer_feed_billing.sql`.
3. Deploy staged `community-api.index.ts` and `community-admin.index.ts`.
4. Smoke-test Basis / Premium / Premium Plus, expiry downgrade, monthly limits, link approval, reports and insufficient Units.
5. Merge this branch to `main` only after the above tests pass.
