# Rescore

Food hygiene re-rating pack builder for UK food businesses rated 0, 1 or 2.
Upload the inspection report, get the action plan, the documented food safety
management system, the evidence pack, the right to reply, the re-visit request
and the platform evidence pack.

The full specification is in [SPEC-RESCORE.md](SPEC-RESCORE.md). This README
covers what is built and how to run it.

## Layout

```
apps/rescore-web          Next.js 15 site: the report reader and the 70 landing pages
apps/rescore-mobile       Expo app: the same flow with camera capture in the kitchen
packages/rescore-content  Scoring, items, FSMS templates, councils, platforms, prompts
packages/rescore-fsa      FSA API client, the low-rating watcher, the scoring validator
workflows                 The n8n watcher workflow, kept as the manual override
```

## Running it

```bash
npm install
npm test                                  # every workspace
npm run build --workspace @rescore/web    # the site
npm run dev --workspace @rescore/web      # local, on http://localhost:3000
```

Copy `.env.example` to `apps/rescore-web/.env.local`. The site builds and every
page renders without any keys; the free report reader returns a clear message
until `ANTHROPIC_API_KEY` is set.

## The scoring model

`packages/rescore-content/src/scoring/thresholds.json` holds the FHRS thresholds
as data, not code, so they can be updated without a release.

The values were read from the FSA's published
[Food Hygiene Rating Scheme Brand Standard](https://assets.publishing.service.gov.uk/media/69cad1c12c5db1b1db67e9d5/Food_Hygiene_Rating_Scheme_Brand_Standard.pdf)
on 12 September 2026, not from memory:

- Table 3 gives the total-to-rating mapping and the additional scoring factor,
  which drops the rating until no single area exceeds the factor for that band.
- The prescribed data values confirm that hygiene and structure are scored 0, 5,
  10, 15, 20 or 25, and that management of food safety is scored 0, 5, 10, 20 or
  30, with no 15 and no 25.
- Table 4's three worked examples are unit tests, along with all 180 permitted
  score combinations.

The model is also checked against reality. `packages/rescore-fsa` carries a
validator that reads real published ratings from the FSA and compares them with
what the model calculates:

```bash
npm run build --workspace @rescore/fsa
node packages/rescore-fsa/dist/validate-scoring.js --authority 112 --authority 10
```

At the last run that checked 3,888 published ratings across Newham and
Chelmsford with zero mismatches. Run it after any change to `thresholds.json`.

## Councils

`councils.json` is seeded from the live FSA Authorities endpoint:

```bash
npm run seed:councils
```

That writes 331 FHRS authorities (England, Wales and Northern Ireland; Scotland
runs the pass/fail FHIS scheme, which is Phase 2) and marks 59 of them as launch
councils: the 33 London authorities plus the 26 largest elsewhere by
establishment count.

Re-visit fees are a known gap. The FSA does not publish them, only 10 of the 331
authorities publish a scheme URL, and none of the launch 59 do, so the
enrichment script cannot discover most council fee pages on its own. A council
with no facts falls back to "check with [council]" plus the Brand Standard's own
rules, which is the behaviour spec 3.4 asks for. Hand-checked facts go in
`src/councils/overrides.json`, each with the page they were read from and the
date. Never put a guessed fee there.

## The watcher

```bash
node packages/rescore-fsa/dist/cli.js --authority 112
node packages/rescore-fsa/dist/cli.js --all --slack "$SLACK_LEADS_WEBHOOK"
```

For every FHRS authority it fetches the establishments rated 0, 1 and 2, upserts
them keyed on FHRS ID, and treats a business as a new lead when its rating date
changes, so a re-inspection makes it new again but a routine re-scan does not.
Outreach status survives a re-scan. In production this runs as a Netlify
scheduled function; `workflows/rescore-fsa-watcher-n8n.json` is the manual
override.

## Rules the code holds to

These are from the spec and are enforced by tests, not just by convention:

- Nothing is generated from a fact the operator has not confirmed. An
  unconfirmed slot in the food safety pack renders as a `[CONFIRM]` marker, and
  the template's own example is never substituted for an answer.
- No allergen is ever suggested and no dish is ever marked free of one. A blank
  cell prints "confirm with the person who prepares this dish".
- No item enters a case that was not in the operator's own report.
- No copy promises a rating.
- A platform's minimum rating is only stated where it was read from that
  platform's own policy page, with the date. Deliveroo's minimum of 2 is
  sourced. Uber Eats and Just Eat are not, so those pages say so.
- Hyphens only. No em dashes or en dashes anywhere, including generated
  documents and commit messages.

## The mobile app

```bash
npm run start --workspace @rescore/mobile     # Expo dev server
npm run export --workspace @rescore/mobile    # bundles both platforms
```

Expo SDK 57 with expo-router. Screens per spec 12: start (read my report), the
score panel, the paywall, intake, the plan as a checklist with the camera on
every item, the confirm prompts, the readiness check and cases. It shares
`@rescore/content` with the web app, so the scoring model, the item taxonomy and
the `[CONFIRM]` discipline are the same code on both.

Evidence photos are stamped with the time they were taken, so a photo carries a
date without the operator adding one. Cases are held in AsyncStorage until the
case API is built.

Both platform bundles are verified: iOS 1,130 modules, Android 1,265.

### Testers

`ojotaiwo@aol.com` is to be added as an internal tester once there is a build:
App Store Connect, TestFlight, Internal Testing, the Team (Expo) group.

Internal testers must first exist as Users in App Store Connect with a role
that can see builds, so the invite is two steps: add the Apple ID under Users
and Access, then add them to the Internal Testing group. Internal testing takes
up to 100 testers and needs no Beta App Review, so the invite reaches them as
soon as the build finishes processing.

Nothing can be invited yet. There is no Apple Developer account connected, no
App Store Connect app record and no build, so the group does not exist.

### What is left before a store build

These need accounts and credentials that are not in the repo:

1. An Expo account and `eas init`, which fills `extra.eas.projectId` in
   `app.json`.
2. An Apple Developer account. Fill `appleId`, `ascAppId` and `appleTeamId` in
   `eas.json`, then `eas build --platform ios --profile production` and
   `eas submit --platform ios`.
3. A Google Play developer account and a service account key at
   `apps/rescore-mobile/play-service-account.json`, which is gitignored, then
   `eas build --platform android --profile production` and `eas submit
   --platform android` to the internal track.
4. RevenueCat. The paywall records the purchase locally today so the flow can be
   walked end to end; the `TODO` in `app/paywall.tsx` is where the real purchase
   of `pack_r01`, `pack_r2` or `pack_r34` goes. It never claims a payment was
   taken.
5. App icons and a splash screen. `assets/` is empty, so the build uses Expo
   defaults.

## Hosting

The web app is on Netlify at https://rescore-nodd.netlify.app, publicly
readable. `netlify.toml` sets the base to the web package so the Next.js runtime
finds the app inside the workspaces monorepo.

Two things to know when deploying:

- Deploy from a clean checkout. Uploading a working directory that contains
  `node_modules` or `.next` fails the build.
- `NEXT_PUBLIC_SITE_URL` is unset on the deploy, so the sitemap and robots point
  at https://rescore.app. That is right once the domain is connected and wrong
  until then; set the variable in Netlify if you want the interim URL in the
  sitemap.
- `ANTHROPIC_API_KEY` is not set, so the free report reader returns a message
  rather than reading anything. That is the one variable the live site needs.

## Attribution

Pages showing FSA-derived data carry: "Contains public sector information
licensed under the Open Government Licence v3.0. Ratings data from the Food
Standards Agency."
