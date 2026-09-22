# Digital Heroes

A subscription platform combining golf performance tracking, monthly prize draws and charitable giving.

**Live site:** https://digital-heroes-platform-six.vercel.app
**Source code:** https://github.com/srastisachan-31/digital-heroes-platform

## Tech stack

- Next.js (App Router, JavaScript) + Tailwind CSS
- Supabase (PostgreSQL, Auth, Row Level Security, Storage)
- Stripe Checkout (test mode) for subscriptions
- Deployed on Vercel

## Features

- Signup/login with charity selection (minimum 10% contribution)
- Subscription (monthly $10 / yearly $100) via Stripe Checkout, with cancel and lapsed states
- Score entry: latest 5 Stableford scores (1-45), one per date, oldest auto-replaced
- Draw engine: random and algorithmic (weighted by score frequency), prize pool auto-calculated from active subscribers, jackpot rollover
- Admin panel: draw simulation before publish, charity management, winner verification and payouts, user/subscription/score management, revenue and charity reports
- Public charity directory with featured spotlight
- Winner proof upload (Supabase Storage) with admin approval workflow
- Route protection via proxy + server-side checks + database RLS (defence in depth)

## Assumptions (PRD ambiguities)

1. Email confirmation is disabled for evaluation so reviewers can log in immediately.
2. Prize pool = 50% of each active subscriber's monthly-equivalent fee (yearly fee / 12).
3. Pool split: 40% (5-match jackpot, rolls over if unclaimed), 35% (4-match), 25% (3-match). Only the jackpot rolls over.
4. Draw participants = active subscribers with at least one score. A match = how many drawn numbers appear in the user's distinct scores.
5. Algorithmic draw favours numbers held by more players.
6. Multiple winners in a tier split the prize equally (rounded down to the cent).
7. A new score older than all 5 stored scores is rejected instead of silently replacing the oldest.
8. Subscription status is derived from stored status + period end date (active/cancelled/lapsed/inactive). Cancelling keeps access until the paid period ends.
9. Payment is verified server-side against the Stripe Checkout session (not just the redirect). Stripe webhooks for automatic renewal sync are a natural next step.
10. Charity contribution totals on the admin overview are an estimate (active subscribers x their chosen %); a dedicated ledger table would be the production-grade approach.

## Environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=

## Test credentials

**Subscriber:** sachansrasti99@gmail.com / Test@1234
**Admin:** sachansrasti99+admin@gmail.com / Admin@1234

## Possible improvements

- Stripe webhooks for automatic subscription renewal/cancellation sync
- A donations ledger table for exact (not estimated) charity contribution history
- RLS-level enforcement of subscription status on the scores table (currently enforced in the UI)