# 10 — Competitive landscape: apps, websites and tools that track USCIS cases or serve Cuban/Latino immigrants (as of October 2026)

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20 (all URLs surfaced by web search on this date)
**Audience:** project owner / product and design team (smart non-lawyers)
**Relationship to other docs:** extends `06-community-and-third-party-data.md` (which covered
these sources as *data inputs*). This document looks at the same world as *competitors and
design references*: what each product does, what it costs, what data it runs on, whether it
understands a Cuban Adjustment Act (CAA) / parole case, and what we can borrow or must do
differently. Where doc 06 already verified something, this doc cites it instead of repeating it.

---

## 0. Method, limits and tag legend (read first)

**Method.** Twelve web searches (English and Spanish), each returning result titles, URLs and
a synthesized summary of page content. No page could be opened directly: the sandbox blocks
uscis.gov, app stores, news sites and every tracker site, so all facts come from search
excerpts. App-store ratings and prices in particular are **snapshots re-published by
third-party app-data sites** (App Pricing Lab, AppFollow, mwm.ai, justuseapp, Soft112) and can
be weeks or years stale; treat them as order-of-magnitude indicators and re-check in the live
stores before quoting them publicly.

**Searches that came back empty (negative evidence, worth recording):**
- No official USCIS *mobile app* launch announcement was found in two searches aimed at it.
- No Spanish-language or Cuban-specific case-tracking app or "calculadora" was found.
- No Telegram/WhatsApp bot in Spanish for USCIS status was found.
- No community Google Sheet / spreadsheet of CAA I-485 timelines was found.
- Nothing about ImmigrationHelp.org offering a tracker or a processing-time tool was found
  (second time; doc 06 also found nothing).

**Tag legend used throughout**

| Tag | Meaning |
|---|---|
| **[S]** | Stated in a search result seen today; URL cited |
| **[T]** | From training knowledge; not confirmed today — verify before relying on it |
| **[I]** | Inferred by the author from the evidence; reasoning given |

---

## 1. Executive summary

1. **The closest existing competitor is Inmigreat (marketed in Spanish as "Immigrate Case
   Tracker").** Doc 06 could not identify the "Immigrate Case Tracker" platform quoted by Cuba
   en Miami. Today's searches resolve it: Inmigreat is a Miami-oriented, Spanish/English/
   Portuguese case-tracking app (iOS id 6450058436, Android `com.changayaf.inmigreat`) that
   says it tracks **more than 300,000 cases**, claims to be an **"officially partnered USCIS
   API Developer"**, and whose representative "Ángel" published a CAA approval analysis
   (1,219 approvals detected through Aug 3 2026; the **MSC 2490 receipt block** had the most
   approvals, with ~51,488 pending cases in that series and 209 approvals since June). [S]
   Its "Block View" (see who filed 7 days before/after you) and "place in line" features are
   the nearest thing on the market to a CAA cohort tracker, **but it still keys on form type and
   receipt block, not on the CAA category, parole pathway, field office or the 2025–2026
   policy regime.** [S][I]
2. **Lawfully remains the UX benchmark and the pricing ceiling** (Case Pro Unlimited
   $14.99/month, $29.99/3 months, $154.99/year per an App Store snapshot; 4.8★ on both
   stores from 170k+ / 61.7k reviews, but 3.8/5 on an independent aggregator with recurring-
   charge and paywall complaints; one subscription covers only one case). [S] It has a
   community forum where a Cuban filer (Miami field office, filed Feb 2025, pending 16+ months)
   is asking whether anyone has recent CAA approvals: proof that CAA users are on these
   platforms and are not being served. [S]
3. **The mass-market apps compete on notifications, not on estimates.** Case Tracker for USCIS
   & NVC (ImmiVision; ~309.6k reviews, 4.8★, in-app purchases $2.99–$18.99, heavy-ad complaints)
   and MigraConnect (~182.5k reviews, free, adds immigration-court/Asylum-Clock/FOIA tracking)
   are large; a long tail of ten-plus "Case Tracker for USCIS" clones launched in 2025–2026 are
   thin wrappers on the public case-status page. [S] None segments by category or nationality.
4. **The official USCIS toolset does not give a CAA applicant a personal estimate.** myProgress
   was extended to Form I-485 in November 2023 **only for family-based and Afghan
   special-immigrant applicants**; a 2026 practitioner guide still describes that limit, and
   users reported "myProgress information is unavailable" for I-485s filed in Nov 2025. [S]
   A CAA I-485 is neither family-based nor Afghan SI, so the reference case has never had an
   official personal estimate. [I] USCIS has no official case-status mobile app that any search
   surfaced. [S-negative][T]
5. **Nobody models the thing that actually determines a CAA applicant's wait in 2025–2026:**
   the policy regime (Dec 2025 adjudication pause, June 2026 vacatur, Aug 2026 First Circuit
   partial stay), the parole pathway (CHNV vs FRP vs I-220A), and milestone-conditional
   hazards (EAD received but no interview). Every competitor's estimate is a form-level
   historical average, which is exactly the failure mode Lawfully's own reviews document
   ("no longer gives an accurate filing date"). [S][I]
6. **Gap this project fills:** a Spanish-first, CAA/parole-specific tracker whose estimates are
   stratified by filing month, field office/state, milestones reached and policy regime;
   calibrated against the official quarterly CAA tables (which no app ingests); honest about N
   and confidence; alert-driven on court/policy events; and free of credential custody and
   intrusive ads. Section 6 turns this into a feature matrix and §7 into a build list.

---

## 2. Landscape at a glance

Ratings/review counts are third-party snapshots [S] unless noted; "CAA-aware" means the product
has any field, filter or content specific to Cuban Adjustment Act or parole-based cases.

| # | Product | Type / platform | Price | Data source | CAA/parole-aware? | Rating (reviews) | Last update seen | Verdict for us |
|---|---|---|---|---|---|---|---|---|
| 1 | **USCIS Case Status Online** (egov.uscis.gov/casestatus) | Official web | Free | Official | No | n/a | Continuous | Baseline every app wraps |
| 2 | **myUSCIS account + myProgress** (my.uscis.gov) | Official web | Free | Official | **No** (I-485 myProgress limited to family-based & Afghan SI) [S] | n/a | myProgress I-485 expansion Nov 2023 [S] | Gap: no estimate for CAA |
| 3 | **USCIS Check Case Processing Times** (egov.uscis.gov/processing-times) | Official web | Free | Official (completed-case percentiles) | Partially: historic table has a "Based on Cuban Adjustment" row (doc 06) [S]; whether the live tool offers a CAA category is unverified [T] | n/a | ~Monthly [S] | Prior for the estimator |
| 4 | **Inmigreat / "Immigrate Case Tracker"** | iOS + Android + web; EN/ES/PT | Free tier + "Go Pro" (price not found) | Official USCIS & EOIR data; claims USCIS API developer partnership; block-level crowd data | **Closest**: Cuban share analytics, CAA approval analyses, Block View; no CAA fields [S][I] | Not captured | 2026 (Block View; Aug 2026 CAA analysis) [S] | Primary competitor and potential partner |
| 5 | **Lawfully Case Tracker** | iOS + Android + web community | Free; Case Pro Unlimited $14.99/mo, $29.99/3mo, $154.99/yr (snapshot) [S] | Official status pages + registered user cases since Dec 2018 (doc 06) | No; CAA posts exist in its community [S] | 4.8★ (173,636 App Store; 61.7k Play); 3.8/5 (798, justuseapp); Trustpilot 4.67 [S] | Active 2026 | UX benchmark; pricing ceiling |
| 6 | **Case Tracker for USCIS & NVC** (ImmiVision LLC, iOS id 921827126) | iOS (+Android [T]) | Free + 8 IAPs $2.99–$18.99 (avg $8.74) [S] | Official status pages | No | 4.8★ (~309.6k); sentiment "mixed" 35/100 [S] | Active | Notification leader; ad-heavy anti-pattern |
| 7 | **MigraConnect Case Tracker** (Tecso Solutions LLC, iOS id 6596770726) | iOS (+Android [T]) | Free [S] | USCIS + EOIR + FOIA | No | 4.8★ (~182.5k) [S] | Active | Multi-system coverage pattern |
| 8 | **Case Now: USCIS Tracker** (iOS id 6752526606) | iOS | Not captured | Public case-status site [S] | No, but I-485-specific EAD/AP reminders [S] | Not captured | July 2026 update [S] | Milestone-reminder pattern |
| 9 | **Case Track US Immigration** (iOS id 6792917932) | iOS | Not captured | Official USCIS Case Status API [S] | No | Not captured | 2025–26 | Shows the official API path works for consumer apps |
| 10 | Long tail: Case Tracker: USCIS Status (6780353815), Case Tracker For USCIS Updates (6760368449), Case Tracker for USCIS 2025 (6754956479), Case Tracker Status for USCIS (6751452403), USCIS Case Status Track (6756267555), CaseTracker Auto (6762039740), Case Tracker for USCIS (6670608043), Case Tracker for USCIS Citizen (6483856406), USCIS Case Status (1664475151), Case Tracker US Immigration (Play `com.saldous.casetracker`) | iOS/Android | Mostly free | Public status page | No | Small samples [S] | 2024–2026 | Noise; shows low barrier to entry |
| 11 | **VisaWatch** (visawatch.app) | Web/app | Not captured | Official + Visa Bulletin | No | n/a | 2026 | Publishes competitor comparisons [S] |
| 12 | **Trackitt**, **VisaJourney**, **immihelp I-485 tracker** | Web crowdsourced (legacy) | Free | User-entered | No (free-text nationality); immihelp entries ~2007–2019 [S] | n/a | Stale | Schema reference only (doc 06) |
| 13 | **Boundless**, law-firm processing-time pages (bordercrossinglaw, beyondborderglobal, manifestlaw, immigrationdirect, lighthousehq, simvisa) | Content/SEO | Free (lead-gen) | Re-published USCIS percentiles | No | n/a | Monthly-ish | Presentation reference only |
| 14 | **casestatusapi.com / mycaseshub.com / immigrationapi.com** | Web utilities / APIs | Free–$79/yr; API $0–$299/mo (doc 06) | USCIS internal JSON | No | n/a | 2026 | Status-explainer pattern |
| 15 | **ImmigrationHelp.org** | Nonprofit form preparation [T] | Free [T] | n/a | No tracker found [S-negative] | n/a | — | Not a competitor |
| 16 | Open-source bots: Telegram (GitHub `uscis` topic), vpetkovic CLI/Azure Functions, liamgriffiths Twilio SMS | Self-hosted | Free | Scrapes/polls status page | No | n/a | Undated [S] | Demand signal for push alerts |
| 17 | Spanish-language Cuban media (CiberCuba, Cuba en Miami, Directorio Cubano, Periódico Cubano, Américatevé, La Nación) | News | Free | USCIS releases + Inmigreat | **Yes** (only CAA "tool" the community has) | n/a | Weekly | Distribution/validation partners (doc 06) |

---

## 3. Official USCIS tools (what the government itself offers a CAA applicant)

### 3.1 Case Status Online and the myUSCIS account
- Status lookup by receipt number is free and is the data source every third-party app wraps.
  CiberCuba's CAA guide tells readers to check status "mediante el sistema oficial de
  seguimiento de USCIS utilizando el número de recibo." [S]
  <https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano>
- The signed-in account exposes a richer case-service JSON (event codes, notices) that the
  open-source trackers parse; see doc 06 §3.3. [S, doc 06]
- **No official USCIS mobile app** surfaced in two targeted searches; results were entirely
  third-party apps. [S-negative] From training: USCIS has historically offered only web tools
  and an official Case Status API for registered developers, not a consumer app. [T]

### 3.2 myProgress (personalized processing time)
- USCIS announced on 2023-11-29 that myProgress "formerly personalized processing times" was
  extended to Form I-485 and Form I-821, **initially only for family-based or Afghan special
  immigrant I-485 applicants**; estimates appear in the online account and are not a
  guarantee. [S] <https://www.uscis.gov/newsroom/alerts/uscis-expands-myprogress-to-form-i-485-and-form-i-821>
- Law-firm coverage confirmed employment-based I-485s were excluded [S]
  <https://ogletree.com/insights-resources/blog-posts/uscis-update-myprogress-tool-expands-to-forms-i-485-and-i-821/>,
  <https://natlawreview.com/article/uscis-update-myprogress-tool-expands-forms-i-485-and-i-821>,
  <https://www.imwong.com/2023/12/01/uscis-expands-myprogress-processing-times-tool-to-family-based-green-cards/>.
- A 2026 practitioner guide still describes coverage as limited to family-sponsored and Afghan
  filings. [S] <https://www.lighthousehq.com/blog/my-progress-usci>
- January 2026: Lawfully community users reported "myProgress information is unavailable" for
  I-485 and I-131 cases filed in November 2025 (anecdotal). [S]
  <https://www.lawfully.com/community/posts/myprogress-weird-update-in-uscis-online-account-IvSJxRXcvoSdtKIoV17Skw==>
- **Implication [I]:** a CAA I-485 is not family-based and not Afghan SI, so the reference case
  (filed March 2025) has had no official personal estimate at any point. The myProgress
  three-step layout (received → under review → decision, with "estimated time remaining") is
  nevertheless the pattern users already recognise; see §8.

### 3.3 Check Case Processing Times
- The tool asks for form (I-485) and the office handling the case; times "vary a lot by
  office" and the tool updates "casi cada mes." [S] (CiberCuba guide, URL above.)
- The published figures are percentiles of *completed* cases (e.g., a tracker quoting USCIS
  data of Aug 17 2026 lists family-based I-485 at the Washington DC office as 17 months for
  half of cases and 23.5 months for 93%; Boise 10.5 / 21 months, July 2026). [S]
  <https://bordercrossinglaw.com/processing-times/office/washington-dc>,
  <https://bordercrossinglaw.com/processing-times/office/boise-id>
- The 93rd-percentile figure doubles as the "case inquiry date": applicants compare their
  receipt date to it to see whether they may file an e-Request. [S]
  <https://www.beyondborderglobal.com/resources/i-485-processing-time----what-recent-uscis-data-shows>
- The historic national-median table has a "Based on Cuban Adjustment" row (doc 06, verified);
  FY2026 median 11.8 months (Oct 1 2025–Jul 31 2026) vs 7.0 (FY2025), 4.6 (FY2024), 3.3
  (FY2023). [S] <https://www.directoriocubano.info/?p=154226>,
  <https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo>
- **Open point [T]:** whether the *live* processing-times tool offers "Cuban Adjustment Act" as
  an I-485 sub-category per field office (so that Miami/Hialeah CAA times are visible) could not
  be checked today; doc 06 noted a third-party table listing "CAA 5.5 months" (stale), which
  suggests such a category exists or existed. Verify on egov.uscis.gov.

### 3.4 Official Case Status API (developer.uscis.gov)
- At least one consumer app, Case Track US Immigration, says it looks up status "through the
  official USCIS Case Status API," and Inmigreat says it is an "officially partnered USCIS API
  Developer." [S] <https://apps.apple.com/us/app/case-track-us-immigration/id6792917932>,
  <https://mwm.ai/apps/inmigreat-case-tracker/6450058436>
- **Implication [I]:** registering for the official API is a realistic path for this app
  (status text only; no milestone JSON), and the "official API developer" badge is a trust
  signal competitors already use in marketing.

---

## 4. Third-party products, one by one

### 4.1 Inmigreat ("Immigrate Case Tracker") — closest competitor

**Identity.** App Store "Inmigreat Case Tracker" (id 6450058436)
<https://apps.apple.com/us/app/inmigreat-case-tracker/id6450058436>; Google Play "Inmigreat:
USCIS Case Tracker" / "Inmigreat: USCIS & EOIR Court" (`com.changayaf.inmigreat`)
<https://play.google.com/store/apps/details?id=com.changayaf.inmigreat&hl=en_US>; website
<https://www.inmigreat.com/en/>; Product Hunt listing <https://www.producthunt.com/products/inmigreat/makers>. [S]

**Why it is the "Immigrate Case Tracker" of doc 06 [I, high confidence].** The Cuba en Miami
article attributes its CAA analysis to "Ángel, representante de la plataforma Immigrate Case
Tracker"; today's search summary of the same article describes "Datos de Immigrate (Ángel,
representante de la plataforma)… 1,219 aprobaciones… entre los más de 300,000 casos que
actualmente son seguidos dentro de la aplicación," and the only app of that name/scale with
Cuban-focused analytics is Inmigreat (whose analytics page already showed the Cuban share of
pending I-485s, doc 06 §3.6). "Immigrate" is the phonetic Spanish rendering of "Inmigreat."
[S] <https://www.cubaenmiami.com/aumentan-las-aprobaciones-de-green-card-bajo-la-ley-de-ajuste-cubano-estos-son-los-casos-que-se-estan-moviendo-mas-rapido/>

**What it does [S].**
- Tracks USCIS and EOIR (immigration court) cases using "official USCIS and EOIR data"; sends
  alerts when status changes.
- Shows "your full USCIS case history as a clean timeline" and "what each status actually
  means," for I-485, I-130, I-765, N-400, I-751, I-90 and more.
- **Block View:** "see your whole filing block, not just your own case, including who filed
  7 days before and after you."
- Statistics by form type (free); **Go Pro** adds "Smart Prediction," "your processing time
  estimate and place in line," and "Judge Analytics" (EOIR).
- Languages: English, Spanish, Portuguese in the app; marketing targets Hispanic immigrants
  ("designed specifically for Hispanic immigrants" per a third-party listing).
  <https://inmigreat-case-tracker.en.softonic.com/android>,
  <https://www.appbrain.com/app/inmigreat-case-tracker/com.changayaf.inmigreat>
- Claims "officially partnered USCIS API Developer." <https://mwm.ai/apps/inmigreat-case-tracker/6450058436>
- Disclaimers: not a law firm, no legal advice, not affiliated with USCIS/EOIR. (The search
  synthesis of the Cuba en Miami coverage also described "Immigrate" as a commercial platform
  that "también vende servicios legales"; this conflicts with the not-a-law-firm disclaimer and
  may refer to attorney referrals. Unresolved. [S][I])

**CAA-specific data it has published [S]** (Cuba en Miami, analysis dated Aug 3 2026):
- 1,219 CAA residence approvals detected among >300,000 tracked cases.
- Receipt block **MSC 2490** had the most approvals: ~51,488 pending cases associated with that
  series and 209 approvals since June 2026.
- Caveats from "Ángel" himself: IOE/MSC prefixes do not determine nationality or category; the
  registry only covers cases added to the app and is not USCIS's full statistics.
- Doc 06 also recorded its analytics page showing Cuban cases as 355,371 (22.4% of pending
  I-485s) with a "95.2% approval rate" of unspecified window.

**Pricing.** Free download with in-app purchases; free tier = real-time status, complete
timeline, EOIR tracking, form-type statistics; Pro tier price not found in any result. [S]

**Weaknesses seen [S][I].**
- User review: "keeps deleting all my cases I have saved even with a paid membership."
- No CAA/parole fields: Block View is a proxy for cohort (early-2025 CAA filers cluster in
  specific MSC blocks), but it cannot separate CAA from family-based cases in the same block,
  nor record parole pathway, field office, EAD category or pause status. [I]
- Its CAA analysis counted approvals, not time-to-decision conditional on milestones; and the
  "95.2% approval rate" on the analytics page contradicts the 23.7% official Q3 FY2026 share
  unless the window is explained (doc 06 §5.3).
- Website language coverage "may lag the app" (web page describes English support). [S]

**Strengths worth matching.** Bilingual, Hispanic-first positioning; plain-language status
explanations; block/cohort view; "place in line"; official-API trust badge; press relationships
with Cuban media (Cuba en Miami quotes it as a data source).

**Strategic note [I].** Inmigreat is simultaneously the main competitor and the most valuable
potential data partner (300k+ cases). A cross-validation arrangement (they publish block-level
CAA approvals; we publish regime-stratified hazard estimates) is worth proposing; doc 06 §10
already lists contacting them as an action.

### 4.2 Lawfully Case Tracker (extends doc 06 §3.2)

- **Pricing [S].** App Store snapshot: "Case Pro Unlimited" $14.99 / 1 month, $29.99 / 3
  months, $154.99 / year; a 2025 review page lists "Lawfully Premium (1 Month)" $14.99; App
  Pricing Lab shows in-app purchases from $9.99 to $154.99. The enterprise "Lawfully Pro" (for
  firms) is custom-priced. <https://apps.apple.com/us/app/lawfully-case-tracker/id1435063223>,
  <https://justuseapp.com/en/app/1435063223/lawfully-uscis-case-status/reviews>,
  <https://apppricinglab.com/app/apple/1435063223>, <https://softwarefinder.com/legal/lawfully>
- **Ratings [S].** 4.8★ from 173,636 App Store reviews (one snapshot; another shows ~156.2k);
  Google Play 4.8★ / 61.7k; justuseapp 3.8/5 from 798 reviews with recurring-charge, free-trial
  and paywall complaints; Trustpilot (NL mirror) 4.67. <https://nl.trustpilot.com/review/lawfully.com>
- **Product claims [S].** "AI-based date predictions drawn from millions of cases"; covers
  USCIS, NVC and EOIR; progress bars; a 2025 roundup rated it 4.7/5 and said predictions use
  other users' data. <https://www.lawfully.com/>,
  <https://theusciscasestatus.com/uscis-case-tracking-apps-2025/>
- **Complaints specific to the estimator [S].** Case Analysis Pro "failed to generate a case
  analysis pro report"; "no longer gave an accurate filing date" (2025); a subscription covers
  **only one case number**, additional cases cost more. One aggregator review calls the app
  "malware" (single unverified report).
- **Community [S].** Lawfully runs a public forum. A post titled "cuban adjusment" describes a
  Miami field office case filed February 2025, still pending after 16+ months, asking "if there
  are any recent I-485 approvals under the Cuban Adjustment Act (CAA) for those who filed
  between early 2025 and 2026." <https://www.lawfully.com/community/posts/cuban-adjusment-fzm9930QB8IB_hcYrXbyVg==>
  This is direct evidence that CAA filers are inside general-purpose trackers and get no
  CAA-specific answer. [I]
- **Verdict.** Still the UX benchmark (cases ahead/behind, decision-chance curve) and the
  pricing ceiling; its per-case paywall and regime-blind estimates are the openings.

### 4.3 Case Tracker for USCIS & NVC (ImmiVision, LLC)

- iOS id 921827126; free with eight in-app purchases from $2.99 to $18.99 (average $8.74);
  4.8★ from ~309.6k reviews. [S] <https://www.apppricinglab.com/app/apple/921827126>
- Automated sentiment analysis: "mixed" (35/100); users praise notifications, complain about
  excessive, intrusive advertising in the free version. [S] <https://marlvel.ai/api/llm/apps/utilities/searcher-i485>
- A competitor comparison (VisaWatch) calls it "the app most people complain about for
  fullscreen ads, popups, and lawyer banners." [S] <https://www.visawatch.app/vs/case-tracker>
- Related listings: "Case Tracker for USCIS" (id 6670608043, country pages on AppFollow),
  "Case Tracker for USCIS Citizen" (id 6483856406), Android APK mirrors. [S]
  <https://apps.appfollow.io/ios/case-tracker-for-uscis/6670608043?country=us>,
  <https://case-tracker-for-uscis.en.uptodown.com/android>
- **Verdict.** The scale leader on notifications; its ad model is the anti-pattern to avoid for
  a trust-sensitive, scam-wary Cuban audience (doc 06 §3.8).

### 4.4 MigraConnect Case Tracker (Tecso Solutions LLC)

- iOS id 6596770726; free; 4.8★ from ~182.5k reviews; covers USCIS cases, Immigration Court
  hearings, the Asylum Clock, and FOIA requests. [S]
  <https://apps.appfollow.io/ios/migraconnect-case-tracker/6596770726?country=us>,
  <https://apps.apple.com/app/id6596770726>
- **Relevance [I].** Many Cubans who entered under I-220A rather than parole are in removal
  proceedings; a CAA app that ignores EOIR will frustrate them. MigraConnect shows the
  expected scope (USCIS + EOIR + FOIA) for a Latino-market tracker.

### 4.5 Case Now: USCIS Tracker

- iOS id 6752526606; July 2026 update added **I-485 reminders for work-permit (EAD) and
  Advance Parole timing** plus Visa Bulletin alerts; step-by-step guides per case status;
  pulls from the public USCIS case status site; not official. [S]
  <https://apps.apple.com/us/app/case-now-uscis-tracker/id6752526606>
- **Pattern to borrow:** milestone-driven reminders (EAD renewal window, I-693 validity,
  interview prep), see §8.

### 4.6 The 2025–2026 long tail of "Case Tracker" apps

Ten-plus near-identical iOS apps launched in 2024–2026 (ids 6780353815, 6760368449,
6754956479, 6751452403, 6756267555, 6762039740, 6670608043, 6483856406, 1664475151; Android
`com.saldous.casetracker`). All are free wrappers over the public status page with small
review counts; several carry "not affiliated with any U.S. government entity" disclaimers;
CaseTracker Auto describes itself as "an independent, third-party app." [S]
<https://apps.apple.com/uy/app/case-tracker-uscis-status/id6780353815>,
<https://apps.apple.com/us/app/case-tracker-for-uscis-updates/id6760368449>,
<https://apps.apple.com/us/app/-/id6754956479>, <https://apppricinglab.com/app/apple/6751452403>,
<https://apps.apple.com/app/id6756267555>, <https://apps.apple.com/cd/app/casetracker-auto/id6762039740>,
<https://play.google.com/store/apps/details?id=com.saldous.casetracker&hl=en>,
<https://mwm.ai/apps/uscis-case-status/1664475151>

**Brand confusion warning [S][I].** "CaseTracker" also names unrelated products:
casetracker.io is law-practice management software (publishes a "Best Immigration Case
Management Software 2026" guide) <https://www.casetracker.io/best-immigration-case-management-software-2026>;
casetracker.xyz is a privacy-focused status API (doc 06). Avoid any name containing "Case
Tracker."

### 4.7 Web utilities and SEO status explainers

- **mycaseshub.com** publishes per-status explainer pages (e.g., what "USCIS is currently
  processing the case" means for I-485) and a "real-time case tracker." [S]
  <https://mycaseshub.com/status/i-485/still-processing/>, <https://mycaseshub.com/>
- **VisaWatch** (visawatch.app) combines case tracking with Visa Bulletin tracking and publishes
  "vs" pages against competitors. [S] <https://www.visawatch.app/vs/case-tracker>
- **immigrationdoc.ai** maintains "Top USCIS Case Tracker Websites (2026 Complete List)";
  **editorialge.com** "Top 5 US Immigration Guide and Tracking Apps in 2026";
  **theusciscasestatus.com** "Best Mobile Apps to Track Your USCIS Case in Real-Time (2025)";
  Soft112 lists "Immigration Case Tracker" alternatives. These are affiliate/vendor-style
  roundups, not independent tests. [S]
  <https://immigrationdoc.ai/blog/top-uscis-case-tracker-websites>,
  <https://editorialge.com/us-immigration-guide-and-tracking-apps/>,
  <https://theusciscasestatus.com/uscis-case-tracking-apps-2025/>,
  <https://immigration-case-tracker-ios.soft112.com/immigration-case-tracker-ios-alternatives.html>
- A 2026 guide's useful caveat on crowdsourced timelines: value "depends on how many people
  filing the same form are posting there." [S] For CAA that number is near zero everywhere
  except Inmigreat and Cuban Facebook groups. [I]
- casestatusapi.com, immigrationapi.com, casetracker.xyz: covered in doc 06 §3.3.

### 4.8 Legacy crowdsourced trackers (Trackitt, VisaJourney, immihelp)

- Trackitt and VisaJourney: see doc 06 §3.1 and §3.4 (no CAA category; ToS risk).
- **immihelp I-485 tracker**: user-submitted entries with receipt, notice, fingerprint and card
  dates by service center; entries seen date from roughly 2007 to 2019; the site is commercial
  (insurance ads). [S] <https://www.immihelp.com/i-485-tracker/56/> (and pages /16/, /41/,
  /47/, /57/, /63/, /75/, /79/, /90/, /102/)
- **Verdict.** Dead as data; their "paired dates + days-between" columns remain a good schema
  reference (doc 06 §8).

### 4.9 Processing-time "calculators" and republishers

- No product found that is a true calculator (input your dates, get a personal estimate) other
  than Lawfully's Case Analysis Pro and Inmigreat's Smart Prediction. [S-negative]
- Republishers of USCIS percentiles disagree widely because of different snapshot dates and
  methods: 9–42.5 months (EB 9–35, FB 8–18, July 2026) at one law firm; 8–14 months "for most
  cases" with 6 months to 3+ years overall at another; "roughly 7 months" EB nationally in early
  2026 at a third. [S] <https://manifestlaw.com/blog/i485-processing-times>,
  <https://www.beyondborderglobal.com/resources/i-485-processing-time----what-recent-uscis-data-shows>,
  <https://simvisa.com/blog/uscis-processing-times-trends>,
  <https://www.lighthousehq.com/blog/i-485-processing-times>,
  <https://www.immigrationdirect.com/blog/form-i-485-processing-time/>,
  <https://muddyrivernews.com/?p=168477>
- Office-level pages (bordercrossinglaw.com per office) show the pattern of surfacing the
  50% and 93% figures side by side. [S]
- **Boundless / Track My Visa Now:** nothing new today; doc 06 §3.5 stands (official data
  repackaged monthly; no crowdsourcing; not CAA-aware).
- **Cuban media as "calculator."** Cuba en Miami published an estimate that CAA processing
  "ronda actualmente los 24 meses" and a piece on waits "de hasta 24 meses"; the outlet itself
  notes these are media analyses, "no representan tiempos oficiales de procesamiento ni
  predicciones individuales." [S]
  <https://www.cubaenmiami.com/cubanos-podrian-enfrentar-esperas-de-hasta-24-meses-para-obtener-la-residencia-bajo-la-ley-de-ajuste-cubano/>,
  <https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/>
  Américatevé and La Nación repeat the 139/447 and 11.8-month figures. [S]
  <https://www.americateve.com/cuba/alarma-cubanos-uscis-aprobo-solo-139-residencias-ley-ajuste-y-rechazo-otras-447-n5464900>,
  <https://www.lanacion.com.ar/estados-unidos/migraciones/confirmado-por-uscis-la-green-card-bajo-la-ley-de-ajuste-cubano-registra-una-demoras-de-casi-un-ano-nid03102026/>

### 4.10 ImmigrationHelp.org

- Two rounds of searching (doc 06 and today) found no tracker or processing-time tool; the
  query returned only immihelp.com, a different site. [S-negative]
- From training [T]: ImmigrationHelp.org is a nonprofit, free, guided form-preparation service
  (I-485, I-130, N-400 and similar), comparable to tax-prep software; it is not a status tracker
  and is not a competitor, though it is a plausible referral partner for self-filers.

### 4.11 Telegram, WhatsApp and SMS bots

- GitHub's `uscis` topic lists "a simple Telegram bot to track USCIS cases" (undated). [S]
  <https://www.github.com/topics/uscis>
- vpetkovic/uscis-case-status-tracker: local CLI plus two Azure Functions variants, built
  "because checking the portal repeatedly was cumbersome." [S]
  <https://github.com/vpetkovic/uscis-case-status-tracker>
- liamgriffiths/uscis: scrapes the status checker and texts the result via Twilio on a cron
  schedule. [S] <https://github.com/liamgriffiths/uscis>
- pedrocastellanos/uscis-case-tracker-bot (Telegram, tagged `parole`, 2023): doc 06.
- **No Spanish-language Telegram or WhatsApp bot for USCIS status was found; no WhatsApp tracker
  of any kind was found.** [S-negative] The Cuban community's Telegram presence is news
  channels (doc 06 §3.8), not bots.
- **Implication [I].** A Spanish WhatsApp/Telegram alert channel ("tu caso cambió", "nueva
  sentencia", "USCIS publicó cifras del trimestre") is an unserved niche and cheap to run via
  the Telegram Bot API; WhatsApp requires the Business API and opt-in.

### 4.12 Community spreadsheets

- No Google Sheet, Airtable or similar public spreadsheet of CAA I-485 timelines surfaced in
  English or Spanish. [S-negative] The search returned only media statistics, a Lawfully
  community post, and guidance pages. <https://citizenpath.com/?p=13036>,
  <https://www.vasquezlawnc.com/blog/cuban-migration>
- **Implication [I].** Unlike the Indian EB-2/EB-3 community (which runs large shared sheets
  [T]), the Cuban CHNV cohort shares timelines in Facebook/WhatsApp posts and polls, not in
  structured sheets. The app's in-app crowdsourcing (doc 06 §8) would be the first structured
  dataset; a public, read-only "hoja comunitaria" export could be a growth feature.

### 4.13 Spanish-language tools for Cubans

- Searching in Spanish for an app or calculator for Cuban cases returned **only media
  articles and the official USCIS tools**; CiberCuba's guide explicitly routes readers to the
  official processing-times tool and status lookup. [S-negative]
- Inmigreat is the only Spanish-first tracker found (§4.1); Univision/Telemundo surfaced only
  as news (doc 06), not as tool providers. [S]
- **Conclusion [I].** There is no Spanish, Cuban-specific case-tracking or estimation product
  today. The "tool" the community uses is the news cycle plus lawyer videos.

---

## 5. What each tool would tell the reference case today

Reference case: CHNV parolee; I-485 (CAA) + I-765 (c)(9) filed March 2025; EAD received
September 2025 (~6 months); no interview, no RFE reported; no decision as of 2026-10-20
(~19 months). Policy context: Dec 2 2025 adjudication pause → vacated June 5 2026 → First
Circuit partial stay Aug 14 2026 (doc 06 §4; today's search confirmed the Aug 14 2026 partial
revival of the re-review policy during appeal [S]
<https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano>).

| Tool | What it shows him | Why it is inadequate |
|---|---|---|
| USCIS Case Status Online | A status string (probably "Case Was Updated To Show Fingerprints Were Taken" or "Case Is Being Actively Reviewed") | No time estimate; no context |
| myProgress | Nothing: CAA I-485 is not family-based or Afghan SI [S][I] | Official gap |
| Processing Times tool | Office-level 50%/93% for I-485 (category availability for CAA unverified [T]); national historic CAA median 11.8 months | Completed-case percentiles lag; say nothing about a 19-month-old case with EAD and no interview |
| Lawfully Case Analysis Pro ($14.99/mo) | "Cases ahead/behind" among same form + service center + filing date; chance-of-decision range | Pool is dominated by family/EB cases; model trained on pre-freeze trends (its own caveat); one case per subscription |
| Inmigreat (free / Pro) | Timeline, status explanations, **Block View** of neighbours in his MSC/IOE block, place in line; Pro "Smart Prediction" | Block ≠ category; no regime or milestone conditioning; cannot say "EAD-holders filed Mar 2025 in Miami are deciding at rate X" |
| Case Tracker for USCIS / MigraConnect / Case Now | Push notifications; EAD-renewal reminders (Case Now) | No estimate at all |
| Cuban media | "11.8 months median", "139 approved / 447 denied", "espera de 24 meses" | National aggregates; no personalisation; confusingly mixes medians, quarterly medians and guesses |
| **This project (target)** | "Filed Mar 2025, Miami, EAD at month 6, no interview: among N similar cases, X% decided by month 19; conditional median to decision Y months (range A–B); regime: post-vacatur; next likely event: interview notice; last official data: Q3 FY2026" | — |

---

## 6. Gap analysis: feature matrix

| Capability | USCIS official | Lawfully | Inmigreat | Case Tracker (ImmiVision) | MigraConnect | Case Now | Media | **This project** |
|---|---|---|---|---|---|---|---|---|
| Status lookup + push alerts | Web only | Yes | Yes | Yes (ads) | Yes | Yes | No | Yes |
| Plain-language status explanations | Partial | Yes | Yes | Partial | ? | Yes (guides) | Yes | Yes, in Spanish |
| Personal time estimate | Only FB/Afghan I-485 | Paid | Paid | No | No | No | No | **Free, core** |
| Estimate keyed on **CAA category** | No (national historic only) | No | No | No | No | No | Aggregates only | **Yes** |
| Parole pathway (CHNV / FRP / I-220A / port of entry) | No | No | No | No | No | No | Narrative | **Yes** |
| Field office / state stratification | Office percentiles (category unverified) | Service center | Block | No | No | No | No | **Yes** |
| Milestone-conditional estimate (EAD, biometrics, interview, RFE) | No | Partial (RFE probability) | ? | No | No | Reminders only | No | **Yes** |
| Policy-regime awareness (pause / vacatur / appeal) | No | No | No | No | No | No | **Yes (news)** | **Yes (model + alerts)** |
| Calibration to official quarterly CAA counts | n/a | No | Partly (analytics page) | No | No | No | Repeats them | **Yes** |
| Shows N and confidence interval | No | Range only | ? | No | No | No | No | **Yes** |
| Cohort / "block" view | No | Cases ahead/behind | **Yes (±7 days)** | No | No | No | No | Yes (cohort = filing month × office × pathway) |
| EOIR / I-220A court tracking | Separate site | Yes | Yes | No | **Yes** | No | No | Later (link out) |
| Multiple cases per account without extra fees | Yes | **No** (one case per sub) | ? (data-loss complaint) | ? | ? | ? | n/a | Yes (household) |
| myUSCIS JSON import (exact event dates) | n/a | No | No | No | No | No | n/a | **Yes, optional** (doc 06 §3.3) |
| No credential custody | n/a | Yes | Yes | Yes | Yes | Yes | n/a | Yes |
| Spanish-first, Cuban idiom ("un año y un día", "parole", "I-220A", "congelación") | Partial ES | Partial | Yes (ES/PT) | ? | ? | No | **Yes** | **Yes** |
| Scam-resistant verification (masked receipts, moderation) | n/a | No | No | No | No | No | No | **Yes** |
| Ads | None | Some | ? | **Intrusive** | ? | ? | Yes | **None** |

---

## 7. Concrete features competitors lack (build list, prioritised)

1. **CAA/parole case model.** Entry pathway, parole date, "un año y un día" date, field office,
   EAD category (c09/c11), pause flag, mandamus flag (schema in doc 06 §8). No competitor
   captures any of these.
2. **Regime-stratified estimator.** Separate hazard curves for pre-freeze (filed ≤ Nov 2025 and
   decided before Dec 2 2025), freeze (Dec 2 2025–Jun 5 2026), post-vacatur/appeal (Jun 5 2026→).
   Lawfully's own caveat ("if the trend suddenly changed") is the pitch.
3. **Milestone-conditional "what happens next."** Given EAD at month 6 and no interview at
   month 19, show P(interview notice within 90 days), P(decision within 6 months), and the
   median residual wait, each with N and a range.
4. **Official-data calibration panel.** The quarterly CAA approve/deny/pending counts and the
   historic Cuban-row median, with the release date and the next expected release, so the
   app's crowd estimate is always shown next to the government number it must reconcile with.
5. **Cohort view keyed on receipt block AND category** (Inmigreat's Block View plus our CAA
   fields): "Cubanos CAA con recibo MSC 2490xxx, Miami: 1,204 registrados, 37 aprobados en 30
   días."
6. **Policy/court alert feed in Spanish** (Telegram channel + push): new USCIS memo, court
   order, quarterly data release, fee or form-edition change (e.g., the 09/18/26 I-485 edition
   [S] <https://www.directoriocubano.info/?p=149374>).
7. **Household/multi-case free.** Directly counters Lawfully's one-case-per-subscription.
8. **Optional myUSCIS JSON import** for exact milestone dates (doc 06); nobody in the consumer
   app market offers it.
9. **Verified-entry badges and masked receipts** to counter the documented scam/fake-screenshot
   culture (doc 06 §3.8).
10. **"Qué significa este estado"** explainer library written for CAA (e.g., why "Case Was
    Updated To Show Fingerprints Were Taken" can persist 18 months; what the I-693 validity
    rule means for a long-pending case).

---

## 8. UI patterns worth borrowing, and anti-patterns to avoid

**Borrow**
- **myProgress three-stage bar** (received → review → decision) with "estimated time
  remaining"; users already recognise it from their USCIS account. [S][T]
- **Lawfully "cases ahead of / behind you" and the chance-of-decision curve** (percentage by
  month) — doc 06 §3.2; adapt to show N and widen bands when N is small.
- **Inmigreat Block View / place in line**: neighbours who filed within ±7 days; make the
  neighbours' milestones visible (anonymised), not just their count. [S]
- **Inmigreat/Case Now plain-language status pages**: one screen per USCIS status string
  explaining what it means and what usually comes next. [S]
- **Case Now milestone reminders**: EAD expiry/renewal window (c09 EADs are now long-validity
  but parole-based c11 EADs may be void after termination), I-693 timing, interview prep. [S][I]
- **MigraConnect's multi-system scope** (USCIS + EOIR + FOIA): at minimum, let I-220A users log
  their court status so the app can tell them CAA eligibility depends on parole, not I-220A. [S][I]
- **VisaJourney-style paired dates with computed "days between"** and **Trackitt's RFE
  reason/transfer fields** (doc 06 §8).
- **humanstack "officer vs system update" and masked-receipt export** (doc 06 §3.3) for
  Reddit/Facebook sharing.
- **Office-level 50%/93% side-by-side** (bordercrossinglaw pattern) with the "case inquiry
  date" explained in Spanish. [S]

**Avoid**
- Full-screen ads, lawyer banners and pop-ups (Case Tracker for USCIS complaints). [S]
- Recurring-charge surprises and free-trial traps (Lawfully aggregator complaints). [S]
- Silent data loss of saved cases (Inmigreat complaint). [S]
- A single "approval rate" without its window (Inmigreat 95.2% vs official 23.7% for Q3
  FY2026; doc 06 §5.3). [S][I]
- Estimates that lag regime changes by months (Lawfully reviews). [S]
- Holding USCIS credentials or automating logins (wangchao92 pattern, doc 06). [S]
- Any product name containing "Case Tracker" (at least a dozen apps plus casetracker.io/.xyz). [S][I]

---

## 9. Pricing and business-model benchmarks

| Product | Free tier | Paid | Notes |
|---|---|---|---|
| Lawfully | Tracking + community | $14.99/mo, $29.99/3mo, $154.99/yr (Case Pro Unlimited, snapshot); IAPs $9.99–$154.99 | One case per subscription complaint [S] |
| Inmigreat | Status, timeline, EOIR, form stats | "Go Pro": Smart Prediction, place in line, Judge Analytics; price not found | Data-loss complaint even on paid tier [S] |
| Case Tracker for USCIS & NVC | Ad-supported tracking | 8 IAPs $2.99–$18.99 (avg $8.74) | Ad removal is likely the main IAP [I] |
| MigraConnect | Everything seen | None found | Lead-gen for legal services likely [I] |
| casestatusapi.com | Free check | $2.99 one-time 90-day report; $7.99/mo or $79/yr (doc 06) | |
| immigrationapi.com | $0 tier | up to $299/mo (doc 06) | Developer API |
| USCIS | All free | — | |

**Implication [I].** The Cuban CHNV audience is price-sensitive, scam-wary and currently served
free by media. A free core (tracking, estimate, alerts) with optional paid extras that do not
gate the estimate (e.g., PDF timeline for a lawyer or congressional inquiry, household
dashboard, ad-free is default) fits better than Lawfully's model; a nonprofit/partner model
with Cuban media or legal-aid organisations is also plausible.

---

## 10. Dated timeline of competitor and official-tool milestones

| Date | Event | Source |
|---|---|---|
| 2018-12-01 | Lawfully begins registering case data used for Case Analysis Pro | doc 06 (Lawfully) |
| 2023-11-29 | USCIS extends myProgress to I-485 (family-based & Afghan SI only) and I-821 | uscis.gov alert [S] |
| 2023 | Inmigreat launches (iOS id 6450058436 era; Product Hunt listing) | app listings [S][I] |
| 2023 | pedrocastellanos Telegram bot tagged `parole` | doc 06 |
| 2024–2026 | Wave of "Case Tracker for USCIS" clone apps (ids 6483856406 → 6780353815) | app listings [S] |
| 2025 (reviews) | Lawfully users report Case Analysis Pro inaccuracies, recurring-charge issues | justuseapp [S] |
| 2025-08-29 → 2026-10-11 | humanstack open-source tracker created/updated (JSON import, Reddit export) | doc 06 |
| 2026-01 | Lawfully community reports "myProgress information is unavailable" for Nov 2025 I-485/I-131 filings | Lawfully community [S] |
| 2026 | Inmigreat adds Block View (±7 days neighbours) | app listing [S] |
| 2026-06-05 | Court vacates the Dec 2025 adjudication pause (appeal pending) | CiberCuba guide [S] |
| 2026-07 | Case Now adds I-485 EAD/AP reminders and Visa Bulletin alerts | App Store [S] |
| 2026-08-03 | Inmigreat ("Immigrate") CAA analysis: 1,219 approvals; MSC 2490 block leads | Cuba en Miami [S] |
| 2026-08-14 | First Circuit lets the "re-review of already-approved benefits" policy revive during appeal | CiberCuba guide [S] |
| 2026-09-18 | New I-485 edition (09/18/26) mandatory; older editions rejected | Directorio Cubano [S] |
| 2026-10-03/06 | Media report FY2026 CAA median 11.8 months | La Nación, CiberCuba [S] |
| 2026-10-20 | Lawfully community CAA post (Miami, filed Feb 2025, 16+ months pending) surfaced | Lawfully [S] |

---

## 11. Open questions (hands-on verification with a normal connection)

1. Open the live USCIS processing-times tool and record whether I-485 offers a "Cuban
   Adjustment Act" category per field office, and what Miami/Hialeah/Kendall/Oakland
   Park/Tampa/Orlando show today.
2. Install Inmigreat: capture Go Pro price, the exact Block View and Smart Prediction UI, what
   categories/filters exist, whether cases can be tagged "CAA," and its privacy policy and ToS
   (especially data-sharing terms, since a partnership is contemplated). Confirm the
   "officially partnered USCIS API Developer" claim on developer.uscis.gov.
3. Confirm Inmigreat = "Immigrate Case Tracker" by opening the Cuba en Miami article and
   locating the platform link; identify "Ángel" (likely Ángel Leal, doc 06 §3.6).
4. Re-check Lawfully's current price sheet and whether its USCIS Status Explorer has an
   "other" I-485 category; read its ToS for community data reuse.
5. Verify current ratings/review counts directly in the App Store and Google Play for Lawfully,
   Case Tracker for USCIS & NVC, MigraConnect, Inmigreat, Case Now.
6. Confirm ImmigrationHelp.org's current product (form preparation only?) and whether it
   supports CAA I-485.
7. Search Cuban Facebook groups and WhatsApp communities for any shared spreadsheet or Telegram
   bot that web search cannot see; ask admins.
8. Check whether USCIS launched any official mobile app in 2025–2026 (two searches found none).
9. Resolve the "vende servicios legales" vs "not a law firm" conflict for Inmigreat.

---

## 12. Sources (every URL surfaced today; grouped)

**Official / myProgress**
- https://www.uscis.gov/newsroom/alerts/uscis-expands-myprogress-to-form-i-485-and-form-i-821
- https://natlawreview.com/article/uscis-update-myprogress-tool-expands-forms-i-485-and-i-821
- https://ogletree.com/insights-resources/blog-posts/uscis-update-myprogress-tool-expands-to-forms-i-485-and-i-821/
- https://www.imwong.com/2023/12/01/uscis-expands-myprogress-processing-times-tool-to-family-based-green-cards/
- https://www.lighthousehq.com/blog/my-progress-usci
- https://www.lawfully.com/community/posts/myprogress-weird-update-in-uscis-online-account-IvSJxRXcvoSdtKIoV17Skw==

**Inmigreat / "Immigrate Case Tracker"**
- https://apps.apple.com/us/app/inmigreat-case-tracker/id6450058436
- https://play.google.com/store/apps/details?id=com.changayaf.inmigreat&hl=en_US&gl=US
- https://play.google.com/store/apps/details?id=com.changayaf.inmigreat&hl=en_IN
- https://play.google.com/store/apps/details?id=com.changayaf.inmigreat&hl=en_US
- https://www.appbrain.com/app/inmigreat-case-tracker/com.changayaf.inmigreat
- https://www.inmigreat.com/en/
- https://inmigreat-case-tracker.en.softonic.com/android
- https://inmigreat-uscis-case-tracker.en.softonic.com/iphone
- https://inmigreat-case-tracker.en.uptodown.com/android
- https://mwm.ai/apps/inmigreat-case-tracker/6450058436
- https://www.producthunt.com/products/inmigreat/makers
- https://www.cubaenmiami.com/aumentan-las-aprobaciones-de-green-card-bajo-la-ley-de-ajuste-cubano-estos-son-los-casos-que-se-estan-moviendo-mas-rapido/

**Lawfully**
- https://www.lawfully.com/
- https://apps.apple.com/us/app/lawfully-case-tracker/id1435063223
- https://apps.apple.com/us/app/lawfully-case-tracker/id1435063223?see-all=reviews
- https://apps.apple.com/sn/app/lawfully-uscis-nvc-casetracker/id1435063223
- https://play.google.com/store/apps/details?id=com.lawfully.lawfully_ai_tracker&hl=en_US
- https://www.lawfully.com/resources/start-case-analysis-pro
- https://softwarefinder.com/legal/lawfully
- https://mwm.ai/apps/lawfully-case-tracker/1435063223
- https://justuseapp.com/en/app/1435063223/lawfully-uscis-case-status/reviews
- https://lawfully.en.aptoide.com/app
- https://nl.trustpilot.com/review/lawfully.com
- https://apppricinglab.com/app/apple/1435063223
- https://www.lawfully.com/community/posts/cuban-adjusment-fzm9930QB8IB_hcYrXbyVg==

**Other case-tracker apps and websites**
- https://www.apppricinglab.com/app/apple/921827126
- https://apps.appfollow.io/ios/migraconnect-case-tracker/6596770726?country=us
- https://apps.apple.com/app/id6596770726
- https://apps.appfollow.io/ios/case-tracker-for-uscis/6670608043?country=us
- https://apps.appfollow.io/ios/case-tracker-for-uscis/6670608043?country=mx
- https://apps.appfollow.io/ios/case-tracker-for-uscis/6670608043?country=in
- https://apps.appfollow.io/ios/case-tracker-for-uscis/6670608043?country=at
- https://marlvel.ai/api/llm/apps/utilities/searcher-i485
- https://apppricinglab.com/app/apple/6751452403
- https://apppricinglab.com/app/apple/6754956479
- https://apps.apple.com/us/app/-/id6754956479
- https://apps.apple.com/us/app/case-now-uscis-tracker/id6752526606
- https://apps.apple.com/us/app/case-track-us-immigration/id6792917932
- https://apps.apple.com/us/app/case-tracker-for-uscis-updates/id6760368449
- https://apps.apple.com/uy/app/case-tracker-uscis-status/id6780353815
- https://apps.apple.com/app/id6756267555
- https://apple.co/4cDyBx6
- https://apps.apple.com/cd/app/casetracker-auto/id6762039740
- https://apps.apple.com/in/app/id6483856406
- https://mwm.ai/apps/uscis-case-status/1664475151
- https://play.google.com/store/apps/details?id=com.saldous.casetracker&hl=en
- https://case-tracker-for-uscis.en.uptodown.com/android
- https://www.ibralaw.com/phone-applications-for-uscis-status-exams/
- https://www.visawatch.app/vs/case-tracker
- https://immigrationdoc.ai/blog/top-uscis-case-tracker-websites
- https://editorialge.com/us-immigration-guide-and-tracking-apps/
- https://theusciscasestatus.com/uscis-case-tracking-apps-2025/
- https://immigration-case-tracker-ios.soft112.com/immigration-case-tracker-ios-alternatives.html
- https://www.casetracker.io/best-immigration-case-management-software-2026
- https://mycaseshub.com/
- https://mycaseshub.com/status/i-485/still-processing/
- https://poke.com/r/UkbGJyE7EF6

**Bots and open source**
- https://github.com/vpetkovic/uscis-case-status-tracker
- https://www.github.com/topics/uscis
- https://github.com/liamgriffiths/uscis

**Legacy trackers**
- https://www.immihelp.com/i-485-tracker/56/
- https://www.immihelp.com/i-485-tracker/63/
- https://www.immihelp.com/i-485-tracker/16/
- https://www.immihelp.com/i-485-tracker/57/
- https://www.immihelp.com/i-485-tracker/41/
- https://www.immihelp.com/i-485-tracker/102/
- https://www.immihelp.com/i-485-tracker/79/
- https://www.immihelp.com/i-485-tracker/47/
- https://www.immihelp.com/i-485-tracker/90/
- https://www.immihelp.com/i-485-tracker/75/

**Processing-time republishers / calculators**
- https://www.beyondborderglobal.com/resources/i-485-processing-time----what-recent-uscis-data-shows
- https://manifestlaw.com/blog/i485-processing-times
- https://bordercrossinglaw.com/processing-times/office/washington-dc
- https://bordercrossinglaw.com/processing-times/office/boise-id
- https://bordercrossinglaw.com/processing-times/office/new-york-city-ny
- https://bordercrossinglaw.com/processing-times/office/newark-nj
- https://simvisa.com/blog/uscis-processing-times-trends
- https://www.lighthousehq.com/blog/i-485-processing-times
- https://muddyrivernews.com/?p=168477
- https://www.immigrationdirect.com/blog/form-i-485-processing-time/

**Cuban / Spanish-language media and guides**
- https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano
- https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo
- https://www.cubaheadlines.com/articles/342034
- https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/
- https://www.periodicocubano.com/uscis-acelera-aprobaciones-de-residencias-por-la-ley-de-ajuste-cubano/
- https://www.periodicocubano.com/uscis-rechaza-tres-de-cada-cuatro-peticiones-bajo-la-ley-de-ajuste-cubano-solo-estos-casos-fueron-aprobados/
- https://www.periodicocubano.com/?p=798566
- https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/
- https://www.directoriocubano.info/?p=154226
- https://www.directoriocubano.info/?p=149374
- https://www.cubaenmiami.com/preocupacion-entre-cubanos-con-i-220a-por-notificacion-sobre-sus-casos-de-green-card/
- https://www.cubaenmiami.com/residencia-por-ley-de-ajuste-cubano-tarda-mas-tiempo-de-uscis-sube-casi-un-69/
- https://www.cubaenmiami.com/cubanos-podrian-enfrentar-esperas-de-hasta-24-meses-para-obtener-la-residencia-bajo-la-ley-de-ajuste-cubano/
- https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/
- https://www.lanacion.com.ar/estados-unidos/migraciones/confirmado-por-uscis-la-green-card-bajo-la-ley-de-ajuste-cubano-registra-una-demoras-de-casi-un-ano-nid03102026/
- https://www.americateve.com/cuba/alarma-cubanos-uscis-aprobo-solo-139-residencias-ley-ajuste-y-rechazo-otras-447-n5464900
- https://inmigrausa.com/blog/migracion/ley-de-ajuste-cubano
- https://en.wikipedia.org/wiki/Cuban_Adjustment_Act

**Guides and law-firm pages**
- https://www.vasquezlawnc.com/blog/cuban-migration
- https://www.visaverge.com/news/trump-policy-change-could-end-residency-for-thousands-of-cubans/
- https://cliniclegal.org/resources/humanitarian-relief/uscis-announces-policy-change-regarding-parole-status-certain-cubans
- https://citizenpath.com/?p=13036
