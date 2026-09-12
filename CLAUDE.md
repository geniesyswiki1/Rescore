# Rescore

Food hygiene re-rating pack builder for UK food businesses rated 0, 1 or 2.
The full specification is in SPEC-RESCORE.md and governs this repo.

## Standing decisions

These hold across this repo and any other app built for this owner. They
override anything in SPEC-RESCORE.md that contradicts them, because the spec
predates them.

### Payments: Stripe Managed Payments, never Lemon Squeezy

All web and server-side payments go through **Stripe Managed Payments**, Stripe's
merchant of record product. Lemon Squeezy is not used anywhere, in any product.
Where an older spec or document still says Lemon Squeezy, treat it as stale and
say so rather than implementing it.

Stripe is the merchant of record under Managed Payments, so it is the seller on
the receipt and it assesses and remits indirect tax (VAT, sales tax, GST). That
is the same reason Lemon Squeezy was originally chosen, so the swap is
like-for-like in what it removes from the operator.

Cost, as published on 12 September 2026:

- Managed Payments adds **3.5%** per successful transaction, charged on the full
  amount including any indirect tax.
- Standard Stripe processing applies on top: **1.5% + 20p** for a standard UK
  card, 2.8% + 20p for a premium UK card, 2.5% + 20p for an EEA card, 3.15% + 20p
  international, plus 2% where currency conversion is needed.
- So a GBP 149 pack paid by a standard UK card costs about GBP 7.65 and nets
  about GBP 141.

Environment variables are `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and one `STRIPE_PRICE_*` per product.

**Mobile is the exception, and it is not a choice.** Apple and Google require
their own in-app purchase for digital goods, so the iOS and Android apps keep
consumable IAP through RevenueCat. Stripe cannot replace that inside the app.
Do not "fix" the mobile paywall by pointing it at Stripe.

## House rules that the tests enforce

- Nothing is generated from a fact the operator has not confirmed. An
  unconfirmed slot in the food safety pack renders as a `[CONFIRM]` marker.
- No allergen is ever suggested and no dish is ever marked free of one.
- No item enters a case that was not in the operator's own report.
- No copy promises a rating.
- A platform's minimum rating is only stated where it was read from that
  platform's own policy page, with the date.
- Hyphens only. Never an em dash or an en dash, anywhere, including generated
  documents and commit messages.

## Gotchas worth not rediscovering

- `packages/rescore-content/dist` is gitignored, so any build server has to
  compile it. Netlify gets it via the web app's `prebuild`; EAS gets it via
  `eas-build-post-install`.
- Deploy to Netlify from a clean checkout. Uploading a working directory that
  contains `node_modules` or `.next` fails the build.
- The reader reads `RESCORE_ANTHROPIC_API_KEY`, not `ANTHROPIC_API_KEY`, because
  Netlify injects one of its own that shadows it.
- Apple caps iOS Distribution certificates at two and the team holds both. Reuse
  `464FB575H5`. Never revoke one to make room.
