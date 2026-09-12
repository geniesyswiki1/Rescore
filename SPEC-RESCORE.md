# Rescore: Full Build and Launch Spec

Food hygiene re-rating pack builder for UK food businesses rated 0, 1 or 2. Upload the inspection report, get the action plan, the documented food safety management system, the evidence pack, the right to reply, the re-visit request and the platform evidence pack. One price per rating. Third vertical on the shared engine.

Version 1.0, 12 September 2026. Owner: Taiwo Ojo. Companion to the Reinstate and Approvable specs; where this document says "as Reinstate" or "as Approvable", those specs govern.

---

## 0. How to use this document with Claude Code

Rescore lives in the same monorepo. Paste this as SPEC-RESCORE.md and open Claude Code with:

> Read SPEC.md (Reinstate), SPEC-APPROVABLE.md and SPEC-RESCORE.md end to end. The engine in /packages/engine already exists; do not modify its public interface. Build Rescore exactly as specified, in the build order in section 11, then the mobile order in section 12. Do not invent features. Rescore generates documents only from facts the business operator has confirmed; it never infers an allergen, a temperature, a cleaning frequency or a training record. Where the spec is silent, choose the simplest option that keeps that line. After each phase, run the checks listed and stop to report. Never commit secrets.

Definition of done for today, web: a takeaway owner with a rating of 1 uploads the officer's inspection report and letter, sees every non-compliance sorted into the three scored areas with the points it costs them, pays GBP 149 through Lemon Squeezy, works through the action plan, confirms the facts for their food safety management system, uploads dated photos of each fix, receives the readiness check, the right-to-reply text, the completed re-visit request and the platform evidence pack at a case link that also arrives by email. Live on Netlify with the 70 landing pages in the sitemap and the FSA watcher posting new low ratings to Slack.

Definition of done for today, mobile: the same flow in the Expo app with camera capture of the report and of each fix, on TestFlight internal testing and Play internal testing, store listings submitted.

---

## 1. Product summary

**What it is:** a self-help tool that turns a low Food Hygiene Rating Scheme inspection into a re-rating pack. It reads the officer's report and letter, classifies every non-compliance into the three scored areas (hygiene, structure, confidence in management), builds an item-by-item action plan with the evidence each item needs, generates the documented food safety management system that the confidence-in-management score depends on from the operator's confirmed facts, collects dated photographic evidence against each item, runs a readiness check against the officer's own list before the operator pays the council for a re-visit, and produces the right-to-reply text, the re-visit request and an evidence pack for the delivery platforms.

**Who it is for:** independent takeaways, restaurants, cafes and small food retailers in England, Wales and Northern Ireland rated 0, 1 or 2, most of them family-run and many of them dependent on Deliveroo, Uber Eats and Just Eat for a large share of turnover. The buyer is the owner, often the same person cooking.

**Why we win:** the incumbents are consultancies selling mentoring packages at several hundred pounds, council officers at roughly GBP 80 an hour, and the FSA's free booklet. Nobody has productised the report-to-pack step, nobody ties it to the delivery listing, and nobody is working the FSA's open data to find the businesses on the day their rating is published.

**What it is not:** not an inspection, not a guarantee of a higher rating, not a substitute for actually cleaning, repairing and training. Every page says that documents do not clean a kitchen. Food safety consultancy is not a regulated profession in the UK, so the risk is liability rather than regulation; the design handles it by generating only from confirmed facts.

**Business model:** one-time payment per case (GBP 99 for a rating of 2, GBP 149 for 0 or 1, GBP 49 for a rating of 3 or 4 wanting a 5), through Lemon Squeezy on web and in-app purchase on mobile, with free re-runs until the re-visit. No subscription in v1.

---

## 2. Brand

### 2.1 Name and domain

Name: **Rescore**. The outcome, as a verb. Two syllables, spellable by phone, works in the trade's own vocabulary ("scores on the doors").

Domain preference order: rescore.app, getrescore.co.uk, rescore.co.uk, rescorehygiene.com. One consultancy markets a "ReRate" service, so check "Rescore" on the UK IPO register in classes 42 and 45 before registering, and never use "ReRate".

Handles: @rescoreapp on TikTok, Instagram, YouTube, Facebook and X.

### 2.2 Positioning

One line, used everywhere: **"Rated 0, 1 or 2? Here is exactly what to fix, prove and send back."**

Supporting line: "Upload your inspection report. Get the action plan, the paperwork the officer wants to see, and the evidence pack that keeps you on Deliveroo, Uber Eats and Just Eat. Built from your kitchen, not a template."

We are the experienced manager who has been through a bad inspection and knows what the officer is really scoring. Not a consultant, not a council, not a guarantee.

### 2.3 Voice

- Plain, short, practical. Many owners have English as a second language and are reading on a phone in a kitchen. One instruction per sentence.
- Sentence case everywhere. No exclamation marks, no fear language ("you could be shut down").
- Never "guaranteed 5", "get your 5 back", "beat the inspector". Say "addresses the item", "what the officer will look for", "the points this costs you".
- Use the scheme's exact vocabulary: "hygienic food handling", "cleanliness and condition of facilities and building", "management of food safety", "confidence in management", "re-visit", "right to reply", "Safer food, better business".
- Every action item is a verb, a place, a thing and an evidence type: "Fit a lid to the flour bin under the prep table. Photo of the bin with lid on."
- Never state a fact about the business the operator has not confirmed. Never state that a hazard is controlled unless the operator has confirmed the control and dated it.
- Hyphens only. Never em dashes or en dashes anywhere, including generated documents and commit messages.

### 2.4 Visual identity

The subject is a clean kitchen and a scored checklist. The rating sticker itself belongs to the FSA and is never imitated: no green circles, no 0 to 5 dial, no "scores on the doors" lettering.

**Palette (exactly these six):**

| Token | Hex | Use |
| :-- | :-- | :-- |
| --tile | #F4F6F5 | page background, the off-white of a wipe-clean wall tile |
| --ink | #171A19 | all text |
| --rule | #CFD6D2 | borders, dividers, the empty bar |
| --muted | #66706B | secondary text, helper copy |
| --done | #0F7B4B | the one accent: buttons, links, completed items, the filled bar |
| --open | #C25A16 | outstanding items and failed checks only. Never on buttons |

No gradients, no shadows, no photographs in the interface (the operator's own evidence photos are content, not decoration), no icons except the tick and the open-circle glyph on action items.

**Type:** two families, clearly distinct.

- **Archivo** (Google Fonts), weights 500 and 700, for headlines, the three area labels and the rendered documents' headings. Utilitarian, signage-like, reads on a phone at arm's length.
- **Public Sans**, weight 500, for everything else. Shared with the other two products so components carry over.

Scale: display 700 at 44/30 px, H2 700 at 28/22 px, body 500 at 17 px and 1.55 line height, UI 500 at 15 px, small 14 px in --muted.

**Logo:** the word "rescore" in Archivo 700, lowercase, --ink, followed by three short horizontal bars stacked vertically (the three scored areas), each 14 x 3 px, outlined in --rule. On the home page only, the bars fill in --done from top to bottom over 900 ms after load, once, respecting prefers-reduced-motion. Everywhere else the bars are static. Favicon: the three bars, filled.

**Layout:** as Reinstate. Two-column desktop, action plan or document on the left (7 columns), the three-bar score panel sticky on the right (5 columns) showing current points per area, the points target for each rating, and how many items remain. Single column on mobile with the score panel as a collapsible bottom bar. Max width 1080 px. Radius 6 px on inputs and buttons only.

**The one memorable moment:** the hero. Upload or paste the inspection report and, as it is read, the three bars appear with the points the officer gave, the rating those points produce, and one sentence per area in Archivo: "Management of food safety: 20 points. You need this at 10 or below for a 3, 5 or below for a 5. That is your paperwork, not your kitchen." Nothing else on the site animates.

**Imagery:** typographic only for marketing. Store and social assets are the three bars going from --open to --done, or an anonymised report line with its points highlighted.

### 2.5 Things the brand never does

- Never imitates the FHRS sticker, uses the FSA logo, or implies council or FSA endorsement.
- Never promises a rating.
- Never shows a real business name in marketing, even a success, without written consent.
- Never uses "AI" in a headline.
- Never sells to a business whose report records a hygiene emergency prohibition or a food that is unsafe to sell without first showing the hard stop in 3.7.

---

## 3. Product specification

### 3.1 Scope (v1)

- Scheme: FHRS (England, Wales, Northern Ireland). Scotland's FHIS pass/fail scheme is Phase 2.
- Business types: takeaways, restaurants and cafes, pubs serving food, small retailers and mobile caterers. Manufacturers, care homes and schools are out of scope in v1 (different risk profiles; the tool says so and declines).
- Ratings: 0, 1 and 2 as the core; 3 and 4 as a cheaper "get to 5" pack.

### 3.2 The scoring model (/packages/rescore-content/scoring)

The engine encodes the FHRS Brand Standard: three areas scored in points where lower is better, hygiene and structure from 0 to 25, confidence in management from 0 to 30, and the rating determined by the total and by the worst single area. Claude Code verifies the current thresholds against the published Brand Standard in Phase 1 and stores them as data, not code, so they can be updated without a release. The score panel uses this model to show, for any target rating, the points that must come off each area.

Confidence in management is the area the product can move most reliably, because it is scored on the presence and use of a documented food safety management system, staff training and the officer's assessment of whether standards will be maintained. That is documents and records, which is what Rescore produces.

### 3.3 The flow

1. **Read the report (free).** Upload the inspection report and the officer's letter of required works (PDF, photos or paste). /api/classify returns: the rating and the three area scores if present, every non-compliance item as a list with its area, the legal basis the officer cited where one appears (Regulation 852/2004 Annex II chapters, Food Safety and Hygiene (England) Regulations 2013), whether any item indicates a prohibition, closure or an unsafe food, and the rating the current points produce. This is the hero and the lead magnet.
2. **Start a case (payment).** "Build my re-rating pack, GBP 149" opens Lemon Squeezy. Case created, magic link emailed, token stored locally.
3. **Intake.** Sections: the business (type, size, hours, staff count, languages spoken in the kitchen), the kitchen (layout, equipment list from a guided checklist, hot and cold holding equipment, hand-wash basins, pest control contract), the people (who is in charge of food safety, who has which training), the current paperwork (what exists: diary, cleaning schedule, temperature records, allergen information, supplier list), and the delivery platforms the business is on. Each question shows "why the officer asks" in --muted.
4. **Action plan.** Every non-compliance from the report becomes an item: what to do, where, the evidence to capture (photo, receipt, record, certificate), the area it moves and the points at stake. Items are grouped by area and ordered by points. The operator marks each done, uploads its evidence, and dates it. Items the tool cannot resolve from documents (a structural repair, a pest infestation, a new hand-wash basin) say plainly that the work has to be done and the photo has to show it.
5. **Food safety management system.** From the intake and the confirmed equipment list, the tool generates the documented system the officer expects, in the structure of the FSA's own Safer Food Better Business pack: safe methods for the hazards this kitchen actually has, an opening and closing checks sheet, a cleaning schedule per area and item with frequency the operator sets, temperature record sheets for each piece of hot and cold holding equipment named, a 4-weekly review sheet, a supplier list, a staff training record with what each named person has completed, a pest control log, and an allergen matrix populated only for dishes whose ingredients the operator has confirmed line by line (dishes not confirmed are left blank and flagged). Every sheet carries the business name and the date generated and is exported as a printable DOCX and PDF pack.
6. **Readiness check.** /api/review runs the officer's list against the evidence and documents: each item passes, is outstanding, or has evidence that does not show what it claims (a photo of a clean surface for a "repair the floor" item; a training certificate with no name; a temperature sheet with no entries). A genericity check on the food safety system flags any safe method that does not reference this kitchen's named equipment or dishes. "Ready to request a re-visit" appears only when every item from the report is passed.
7. **Documents to send.** The right-to-reply text (factual, no criticism of the officer), the completed re-visit request with the council's own fee and form details pulled from /content/councils, and the platform evidence pack: a two-page summary of what was found, what was done, dated photos, and the re-visit request receipt, formatted for a Deliveroo, Uber Eats or Just Eat partner manager.
8. **After the re-visit.** Outcome control: new rating, waiting, or the officer found further items (paste the new letter; the action plan updates). Re-runs free until an outcome is recorded.

### 3.4 Councils content (/content/councils)

One entry per local authority in England, Wales and Northern Ireland (roughly 350), seeded programmatically from the FSA Authorities endpoint and enriched by a scripted fetch of each council's food hygiene page: re-visit fee, whether re-visits are free, the request route (form URL, email or post), stated wait, right-to-reply route. Where a fetch fails, the entry shows "check with [council]" and the FSA's general guidance. This table drives the re-visit request document and the council landing pages in 8.1. Refresh quarterly.

### 3.5 Delivery platform pack

A section in /packages/rescore-content/platforms records each platform's stated minimum rating and what it says about existing partners who fall below it, sourced from the platform's own partner policy pages, with the date checked. The evidence pack cover letter is addressed to the platform's partner support with the case facts. The product never claims to know how a platform will decide.

### 3.6 Accounts, cases, retention

As Reinstate: no password, case token plus magic link. A case can be shared with a manager or a second family member. Uploads and documents deleted 12 months after the outcome (longer than the other products, because the food safety pack is a live document the operator keeps using), with an export-everything button.

### 3.7 Hard stops

The tool pauses and explains why, then offers the FSA's and the council's own guidance and a referral to an environmental health consultant, when the report records:

- A hygiene emergency prohibition notice or voluntary closure.
- Food identified as unsafe or a detained or seized batch.
- A pest infestation described as active or widespread.
- Structural failure of water supply, drainage or hand-washing.

Copy: "Some of this needs to be fixed before any paperwork matters, and some of it may need a specialist. Here is what the report says must happen first, and where to get help. Come back when it is done; your case will be waiting."

### 3.8 Legal and liability surface

- Every generated document carries a user-only footer: "Rescore helps you prepare your own food safety records and re-rating request. It is not an inspection, it is not a guarantee of a rating, and the records are only true if your kitchen matches them."
- Terms: sale of a pack and re-runs until the outcome; refund in full if no pack within 24 hours or the report was misread before the plan was built.
- Privacy: as Reinstate, with 12-month retention.
- Professional indemnity insurance for Alluvium's entity covering software that produces food safety documentation; get a quote in week one. Budget in the low hundreds annually.
- Allergens: the matrix is only ever filled from ingredients the operator confirmed per dish. The tool never suggests an allergen, never marks a dish free of an allergen, and prints "confirm with the person who prepares this dish" on any blank cell.

---

## 4. Technical architecture

### 4.1 Stack

Identical to the other two products: Next.js 15 on Netlify, Anthropic API (Sonnet for classify, extract and review; Opus for drafting the safe methods and letters), Supabase Postgres and private Storage in London, Lemon Squeezy and RevenueCat, Resend, Upstash, Plausible and PostHog, Sentry, n8n. New: the FSA API client and the council enrichment script.

### 4.2 Repo structure

```
/apps/rescore-web
  /app
    /page.tsx                        report-upload hero, three bars, how it works
    /rating/[0|1|2|3|4]/page.tsx     5 pages: what your rating means and what moves it
    /fix/[area]/page.tsx             3 pages: hygiene, structure, confidence-in-management
    /platform/[deliveroo|uber-eats|just-eat]/page.tsx   3 pages
    /council/[slug]/page.tsx         re-visit fee and route per council (launch with 60, grow to all)
    /case/[token]/page.tsx
    /pricing, /privacy, /terms, /help
    /api/classify, /api/case/*, /api/extract, /api/plan, /api/fsms,
    /api/review, /api/export/*, /api/outcome, /api/webhooks/*, /api/magic-link
    /sitemap.ts, /robots.ts
/apps/rescore-mobile
/packages/rescore-content
  /scoring     thresholds.json (Brand Standard), points explanations
  /items       non-compliance taxonomy with area, typical evidence, typical fix
  /fsms        safe-method templates as structured slots keyed to hazards and equipment
  /councils    councils.json plus the enrichment script
  /platforms   platform policies with date checked
  /landing.ts  page content
/packages/rescore-fsa
  /client      FSA API client (Establishments, Authorities, BusinessTypes)
  /watcher     the daily low-rating poller (mirrors the n8n workflow; runs in Netlify scheduled functions in production so it is versioned)
```

Everything else is /packages/engine and /packages/shared as already built.

### 4.3 Environment variables

As Reinstate section 4.3 with a separate Netlify site and values. New Lemon Squeezy variants: LEMONSQUEEZY_VARIANT_R2, _R01, _R34. New: SLACK_LEADS_WEBHOOK (for the watcher), STANNP_API_KEY (postal outreach, section 8.3), EHC_REFERRAL_URL (the consultant referral in 3.7).

### 4.4 Data model

As Reinstate, with: cases.rating_before, cases.scores_before (json), cases.target_rating, cases.council_id, cases.platforms[]; items(id, case_id, area, text, legal_basis, points_estimate, status open|done|rejected, done_at); evidence.item_id; fsms_facts(case_id, key, value, confirmed_at); leads(fhrsid pk, name, type, address, postcode, authority_id, rating, rating_date, scores json, first_seen, status new|posted|visited|converted|declined, case_id); outcomes.rating_after.

### 4.5 Prompt architecture

The engine's calls with Rescore's slots:

1. **Classify** (Sonnet): the report and letter in; the rating and scores, the item list with area and legal basis, hard-stop flags, and the produced rating out. Reports vary by council (some are a tick-box form, some a narrative letter), so the prompt carries examples of both and a rule to preserve the officer's wording for each item verbatim in original_text.
2. **Extract** (per evidence file): what the photo or document shows, in plain terms, plus a date if visible (receipts, certificates, a dated sheet) and flags: "cannot see the item", "no date", "certificate has no name", "sheet has no entries".
3. **Plan** (Sonnet): items in; for each, the action, the location, the evidence type, and which area it moves. Uses the items taxonomy for consistency. Never invents an item that is not in the report.
4. **FSMS draft** (Opus): confirmed facts in; the safe methods and sheets out, in the SFBB structure, with [CONFIRM: ...] markers wherever a fact is missing (a fridge with no stated temperature range, a dish with unconfirmed ingredients). Banned: any sentence that asserts a control is in place without a confirmed fact behind it.
5. **Review** (Sonnet, temperature 0): the items, the evidence findings and the FSMS in; the readiness report out, with the genericity check on safe methods and the evidence-mismatch check on items.

Cost per case: GBP 0.60 to GBP 1.50 (many photos). Log tokens per call.

### 4.6 The FSA watcher and lead pipeline (/packages/rescore-fsa)

- Daily scheduled function: for every authority in Authorities/basic (throttled to a few requests a second), fetch Establishments?localAuthorityId=X&ratingKey=0|1|2&schemeTypeKey=FHRS&pageSize=5000, upsert into leads keyed on FHRS ID, and mark rows whose rating_date is new as status = new.
- Also fetch ratings 3 and 4 for the launch councils only (the cheaper "get to 5" market), weekly.
- New leads post to #rescore-leads in Slack (the n8n workflow already written does this; in production the scheduled function does it and n8n is the manual override) and flow into the outreach queue in 8.3.
- FSA terms: attribution line on every page that shows FSA-derived data ("Contains public sector information licensed under the Open Government Licence v3.0. Ratings data from the Food Standards Agency."). Data is refreshed at least weekly so it is never stale by more than the FSA's own publication lag.

### 4.7 Privacy, retention, SEO

As Reinstate, with 12-month retention and the FSA attribution. HowTo schema on the home page, FAQPage on rating and council pages, LocalBusiness never (we are not the business).

---

## 5. Copy

### 5.1 Home page

**Hero headline:** Rated 0, 1 or 2? Here is exactly what to fix, prove and send back.

**Hero sub:** Upload your inspection report. See what each area cost you in points, what the officer wants to see next time, and get the paperwork and evidence pack built from your kitchen. Free to read. Paid when you build.

**Upload box:** Upload the inspection report and the officer's letter / PDF or photos / Nothing is stored until you start a case.

**After reading (dynamic):** the three bars, then "Rating [1]. Management of food safety is costing you 20 points; that is paperwork and training, and it is where Rescore does the most. Build my re-rating pack, GBP 149."

**Section: What the officer scores** (three columns, Archivo labels):

- Hygienic food handling. Cooking, cooling, reheating, storage, cross-contamination, hand washing in practice.
- Cleanliness and condition of facilities. Structure, cleaning, pests, ventilation, lighting, hand-wash basins.
- Management of food safety. A documented system, records that are actually filled in, staff who can explain it.

**Section: What you get** (numbered, because it is a sequence):

1. An action plan, item by item from your report, with the evidence each one needs.
2. Your food safety management system, written for your kitchen and equipment, not a blank template.
3. A readiness check against the officer's list before you pay the council for a re-visit.
4. Your right to reply, your re-visit request with your council's fee and form, and an evidence pack for Deliveroo, Uber Eats and Just Eat.

**Section: What this is and isn't.** One paragraph: Rescore builds the paperwork and the evidence. It does not clean, repair or train, and it cannot promise a rating. What it can do is make sure that when the officer comes back, everything they asked for is done, recorded and provable.

**FAQ:**

- Is reading my report really free? Yes. Upload it and see the items and the points. You pay only to build the pack.
- How long until the re-visit? Your council sets that. Many say 6 weeks to 3 months from payment. The pack is ready the same day, and the sooner you request, the sooner they come.
- What does the council charge? It depends on the council. Your case shows the fee and the form for yours.
- Will this keep me on Deliveroo? Platforms set their own rules and we cannot speak for them. The evidence pack gives your partner manager what they need to see improvement. Fixing the rating is what keeps you listed.
- Do you fill in the allergen matrix for me? Only from ingredients you confirm dish by dish. We never guess an allergen.
- What happens to my documents? Used only for your case, kept for 12 months so you can keep using your food safety pack, then deleted. Export everything any time.

### 5.2 Landing page templates

- /rating/[n]: "Food hygiene rating [1]: what it means and what moves it". The upload hero, the points model for that rating in plain words, the commonest items behind it, the route to a re-visit, price.
- /fix/[area]: "Confidence in management: why it costs the most points and how to fix it". Explainer plus hero.
- /platform/[name]: "[Deliveroo] and your food hygiene rating: what their policy says and what to send them". The platform's stated position with the date checked, then the evidence pack.
- /council/[slug]: "Food hygiene re-visit in [Newham]: the fee, the form and the wait". The council's data from 3.4, FSA attribution, the hero.

### 5.3 Microcopy

- Upload: "Read my report"
- Pay: "Build my re-rating pack, GBP 149"
- Item states: "Open" (--open), "Done, needs evidence", "Evidenced" (--done), "Evidence doesn't show it"
- Score panel: "Management of food safety: 20 to 10 needed for a 3"
- FSMS confirm prompts: "Fridge 1 (under prep table): what temperature does it run at?" / "Chicken curry: list every ingredient"
- Readiness: "4 items still open" / "Ready to request a re-visit"
- Outcome: "New rating" / "Waiting for the visit" / "Officer found more items, upload the letter"

---

## 6. Pricing

| Product | Price | Includes |
| :-- | :-- | :-- |
| Rating 0 or 1 pack | GBP 149 | report read, action plan, full food safety management system, evidence capture, readiness check, right to reply, re-visit request, platform evidence pack, free re-runs until the outcome |
| Rating 2 pack | GBP 99 | same |
| Rating 3 or 4, "get to 5" | GBP 49 | same, lighter action plan |
| Second premises | GBP 79 | any rating, from an existing case |
| Environmental health consultant referral | set by consultant | Rescore's fee disclosed |

Rules as the other products: one-time, no subscription, local currency off (UK only), mobile tiers at GBP 148.99 / 98.99 / 48.99. Refund in full if no pack in 24 hours or the report was misread before the plan was built. No coupons except ALPHA (100% off, 40 uses) and POST (20% off, printed only on the outreach letter so its conversion can be measured).

Unit economics: model cost GBP 0.60 to GBP 1.50, Lemon Squeezy 5% plus 50p, postal outreach about GBP 1 per letter. The GBP 149 pack nets roughly GBP 140. Break-even on the build (content package on the shared engine) is about 15 packs.

Phase 2 decision, not v1: a monthly digital diary (daily checks on the phone, records the officer can be shown) at GBP 9 to GBP 15 a month. The pack creates the demand for it; whether to add a subscription at all is a decision for the 90-day review.

---

## 7. Brand assets and connectors

As Reinstate section 7. Logo and favicon from 2.4. OG images typographic at build time (the three bars with the page's rating or council name). Store screenshots framed in Figma. Higgsfield generate_video for a 20-second store preview and a 45-second vertical Short from a typographic storyboard: the report uploads, the three bars appear in --open, items tick to --done, the bars turn green, the re-visit request prints. Assets to Google Drive Rescore / Assets.

---

## 8. Distribution and marketing

### 8.1 The landing pages (built in)

Launch with 70: 5 rating pages, 3 fix pages, 3 platform pages, and 59 council pages covering the 32 London boroughs, the City of London, and the 26 next-largest councils by establishment count from the FSA Authorities endpoint. Grow the council pages to all of England, Wales and Northern Ireland once the enrichment script has data for each.

Target phrasing: "food hygiene rating 1 what to do", "how to improve food hygiene rating from 2", "food hygiene re-rating request [council]", "right to reply food hygiene rating", "deliveroo minimum food hygiene rating", "safer food better business pack takeaway".

### 8.2 The FSA watcher (the channel nobody else has)

The daily watcher in 4.6 produces, per council, a list of every business whose 0, 1 or 2 was just published. That list is the marketing plan. Each new lead gets the outreach in 8.3 within 48 hours of publication, which is still weeks before the platforms act.

### 8.3 Outreach (delegable to a VA, measured by code)

1. **Postal letter, same week.** One A4 letter through a print-and-post API (Stannp or equivalent UK service) to the premises address from the FSA record. Plain, respectful, in the voice of 2.3: what their published rating is, what the three areas scored, what a re-visit costs at their council, a QR code to the free report reader, and the POST code. No envelope teaser, no urgency. Cost about GBP 1 each. First run: the full backlog for the 59 launch councils (a few thousand letters); then new leads daily.
2. **Walk-in cards for the top boroughs.** A VA or a paid runner drops an A6 card at the 0 and 1 rated premises in Newham, Hackney, Southwark, Tower Hamlets, Brent and Ealing in week one. Owners of family takeaways respond to a person at the counter far better than to a letter.
3. **WhatsApp.** Many premises list a WhatsApp number on their own site, Google listing or shopfront. The runner records it on the card visit; the VA sends the one-screen explainer image. Never scrape numbers.
4. **Multilingual.** The letter and card ship in English with one line each in Turkish, Bengali, Urdu, Punjabi, Mandarin and Yoruba pointing to the same page, because those are the kitchens that dominate the low-rated lists in London.

### 8.4 Launch week

- Sitemap to Google and Bing.
- Posts in the UK takeaway and restaurant owner Facebook groups (search "takeaway owners UK", "restaurant owners UK", "fish and chip shop owners") and r/UKfoodbusiness-type subreddits, written as an owner who went from a 1 to a 5 and learned what the officer was really scoring. One link.
- The 45-second Short on TikTok, Reels and Shorts, captioned.
- One 10-minute YouTube video: "What a food hygiene inspection report actually scores, line by line", evergreen.

### 8.5 Weeks 2 to 4

- Partners with a reason to refer: food hygiene training providers (they sell the Level 2 course; the pack sends them students, and they send us low-rated businesses; 30% affiliate both ways), cash-and-carry depots and food wholesalers whose reps visit every takeaway in a borough, and local accountants who do the books for independents. Each gets the card and a code.
- Delivery platform partner managers: not a partnership, but a note. They are the ones telling businesses to improve or be removed; a PDF explaining the pack, sent to the partner support addresses, costs nothing.
- Comparison page: "Rescore vs a food safety consultant vs doing it yourself with the FSA pack", honest.
- Weekly Search Console review and letter-code conversion review; drop the boroughs where letters do not convert, double the ones where they do.

### 8.6 What we do not do

- No paid ads for 90 days.
- No rating-improvement claims until 100 recorded outcomes.
- No contact with an environmental health officer on a business's behalf.
- No outreach to a premises whose report shows a prohibition; those get the consultant referral only.

---

## 9. Analytics and success criteria

Events: report_uploaded, classified (rating, scores, item_count, hard_stop), checkout_opened, purchase (tier, source: web|ios|android, code), items_done (count), evidence_uploaded (count), fsms_generated (confirm_count), ready, export (which), outcome (rating_before, rating_after, council), lead_status (new|posted|visited|converted).

90-day targets:

- 70 pages indexed; at least 10 council pages on page one for their term.
- 120 paid packs at an average of GBP 120.
- Letter conversion above 2% of letters posted; card conversion above 8% of premises visited.
- 60% of packs reach "Ready to request a re-visit".
- Outcomes recorded on at least 50% of packs; publish nothing until 100.
- Zero liability incidents; professional indemnity in place.

---

## 10. Launch checklist (web)

- Domain live; trade mark check on "Rescore" done; handles reserved
- Professional indemnity quote obtained; consultant referral partner named in env
- .env populated; Lemon Squeezy live with 4 products and a verified webhook
- Free report read works in incognito, rate-limited
- Full rating-1 case run end to end with a fixture report (tick-box style) and a fixture letter (narrative style); items classified correctly; hard stop fires on a prohibition fixture
- FSMS pack generates with [CONFIRM] markers on unconfirmed facts; allergen matrix blank where dishes are unconfirmed
- Readiness check rejects a mismatched photo fixture
- Right to reply factual and concise; re-visit request carries the correct council fee and route for three test councils
- 70 landing pages render with unique titles and FSA attribution; sitemap has 74 URLs
- FSA watcher runs, upserts leads, posts new ones to Slack
- Postal API test letter printed to your own address
- Privacy, terms, the not-a-guarantee footer on every document
- Nightly purge tested against 12-month retention; Plausible, Sentry, n8n live
- Lighthouse mobile: Performance 90+, Accessibility 100
- Reinstate and Approvable test suites still pass

---

## 11. Build order for Claude Code, web

**Phase 1: scoring, items, FSMS templates, councils, prompts (3 hours).** Thresholds from the Brand Standard, the items taxonomy, the safe-method slots, the councils seed from the FSA Authorities endpoint with the enrichment script run for the 59 launch councils, platform policies with dates, the five prompts, and a CLI that runs classify, plan, FSMS and review on two fixture reports. Check: the fixture rating-1 report classifies into three areas with points summing to the recorded rating; the FSMS output contains [CONFIRM] for an unconfirmed fridge temperature.

**Phase 2: hero, score panel and landing pages (2 hours).** Home with the report reader and three bars, the 70 pages, pricing, help, privacy, terms, sitemap, OG, logo, favicon. Check: build passes, Lighthouse met, FSA attribution present on council pages.

**Phase 3: cases, payments, email (1 hour, engine).** Four products, webhook, magic link, share to a manager. Check: test purchase creates a case.

**Phase 4: intake, plan, FSMS, evidence, review, documents, outcome (4 hours).** Check: the section 10 end-to-end run.

**Phase 5: watcher and outreach plumbing (1 hour).** Scheduled FSA poller, leads table, Slack post, postal API integration with the letter template and QR code, POST code tracking. Check: a manual run inserts leads for one council and prints one test letter.

**Phase 6: deploy (1 hour).** Third Netlify site via the connector, env, domain, purge, analytics, n8n, Lemon Squeezy live, checklist.

Roughly 12 hours.

---

## 12. Mobile apps, TestFlight first

As Reinstate section 12, with these differences:

- **Scope:** the report reader (camera and Files), the action plan as a checklist the owner works through in the kitchen, camera capture of evidence against each item with automatic date stamping, the FSMS confirm prompts (the owner walks the kitchen answering "what temperature does this fridge run at" in front of it), the readiness check, and the outcome control. Documents are read and exported on any screen via the case link.
- **Store rules:** consumables pack_r01, pack_r2, pack_r34, premises_addon at GBP 148.99 / 98.99 / 48.99 / 78.99; free report read before any paywall; restore purchases; privacy labels: email for the case link, photos for app functionality, no tracking.
- **Screens:** Start (read my report), Score panel, Paywall, Intake, Plan (checklist with camera on each item), Confirm (FSMS facts), Ready, Cases.
- **Alpha:** internal and external TestFlight groups, Play internal track, 30 alpha owners recruited from the first postal and card runs in Newham and Hackney with the ALPHA code. Exit criteria: 20 completed packs, 8 recorded outcomes, no evidence-mismatch false positives reported twice.
- **Build order:** Phases 7 to 10 as Reinstate's 6 to 9, about 8 hours because the shell is shared.
- **Store presence:** name "Rescore: Food Hygiene Rating", subtitle "Fix, prove and re-rate". Keywords: food hygiene,rating,re-rating,inspection,takeaway,restaurant,safer food,allergen,deliveroo,just eat. Category: Business (both stores).

---

## 13. Connector runbook

As Reinstate section 13, with the third set of resources: Netlify site rescore, Drive folder Rescore / {Spec, Assets, Alpha, Outreach, Legal}, Slack channels #rescore-leads, #rescore-alpha and #rescore-sales, Jira project RSC, Zoho CRM as the system of record for leads (imported from the leads table nightly by n8n, with status, letter date, visit date, code used), Figma for the logo, screenshots, the letter and the A6 card, Higgsfield for the preview video and Short, Gmail label and filter for desk@rescore.app replies, n8n for the watcher override, the Zoho sync and the feedback sheet. The Outreach folder holds the letter and card artwork and the weekly conversion report the VA maintains.

---

## 14. Operator runbook delta (Taiwo)

Everything in the Reinstate operator runbook applies. What is new or different:

1. **Trade mark check** for "Rescore" on the UK IPO register before buying the domain.
2. **Lemon Squeezy:** a third store Rescore with four products: rating 0 or 1 GBP 149, rating 2 GBP 99, rating 3 or 4 GBP 49, second premises GBP 79. Local currency display off.
3. **Professional indemnity:** ask Alluvium's broker for cover extending to software that generates food safety documentation. Send them section 3.8. Needed before public launch, not before alpha.
4. **Consultant referral partner:** one environmental health consultancy (a registered EHO practitioner or a small firm) that takes the hard-stop cases; a booking link and a written referral agreement. Trade associations for environmental health practitioners list members by area.
5. **Postal print service:** an account with a UK print-and-post API (Stannp is the common choice); top up GBP 200 for the first run. Approve the letter artwork Claude Code and Figma produce before the first batch goes.
6. **Runner for the card drops:** one person for three days in week one across the six boroughs in 8.3. Give them the cards, a list from #rescore-leads, and a simple form for the WhatsApp numbers they collect.
7. **Apple and Google:** a third app in each console (app.rescore.ios, app.rescore.android), four consumables each; RevenueCat third project.
8. **Resend:** add the domain and desk@rescore.app.
9. **Translations:** one line each in Turkish, Bengali, Urdu, Punjabi, Mandarin and Yoruba for the letter and card; use the team's own speakers where possible, a translator otherwise.

---

## 15. Phase 2 (after the 90-day review)

- Scotland (FHIS pass/fail and improvement-required notices).
- Manufacturers, care homes and schools with their own item taxonomies.
- The monthly digital diary, if the review says yes.
- Natasha's Law labelling for prepacked-for-direct-sale foods and calorie labelling for larger businesses, as add-on packs generated from the same confirmed ingredient data.
- Council pages for every authority, and a "new rating" watch a business can subscribe to for its own premises.
- Multi-site operators (five or more premises) with a per-site rate.
