# 15 — Delay remedies for a pending Cuban Adjustment Act I-485 (late 2026)

**Scope.** What a Cuban CHNV parolee (or their lawyer) can actually *do* when a CAA Form I-485 — and often the companion (c)(9) I-765 — has been pending longer than expected, as of 2026-10-20. Six official or quasi-official channels are covered, each with its rules, forms, eligibility threshold, cost, realistic turnaround and Spanish terminology: (a) the USCIS e-Request "case outside normal processing time"; (b) a USCIS expedite request; (c) CIS Ombudsman case assistance (Form DHS-7001); (d) a congressional inquiry; (e) a mandamus / APA "unreasonable delay" lawsuit, including the 2026 *Acosta Reynoso* denials and the *Red Eagle* class order; (f) field-office appointments and the USCIS Contact Center for Spanish speakers.

**Why this document exists.** The corpus plans a "what can I do" screen (doc 11 §10 Q6, doc 10 §7) and schema fields `congressional_inquiry_date`, `ombudsman_date`, `mandamus_filed_date` (doc 06 §8.1) but had no criteria, forms or timings for any of them. This fills that gap. Read with: `04-uscis-data-sources.md` §2.1/§2.4 (processing-time methodology and the 2026-10-15 case-inquiry dates), `06-community-and-third-party-data.md` §3.11 and §8.1 (mandamus rule of thumb, schema), `07-reported-timelines-2024-2026.md` (Acosta Reynoso row; attorney advice on EAD delays), `08-estimation-methodology.md` (mandamus multiplier), `11-policy-and-rules-master-timeline.md` §7 (litigation map), `12-field-offices-states-and-geography.md` §6 (venues).

**Evidence legend.** **[S]** stated in a search result seen on 2026-10-20 (URL cited) · **[T]** training knowledge, not confirmed today · **[I]** inferred/calculated here · **[C]** carried from an existing corpus document (its own tag applies) · **[S-FC]** stated in a search result reported by the 2026-10-20 adversarial fact-check pass (URL cited), not seen by the editor. Network egress to uscis.gov/dhs.gov/courts was blocked in this environment, so every official page is cited from search-result summaries, not from a page read today. Research budget: 15 web searches, all used; the 2026-10-20 editorial pass used 2 more (§13).

**Not legal advice.** The app must say so on this screen (see §9 for copy).

---

## 1. Executive summary — the remedy ladder

The honest message for a March/April 2025 CAA filer at a South-Florida office is: **the two free channels most people reach for first (e-Request and congressional inquiry) are gated by USCIS's own "normal processing time" yardstick, and by that yardstick a 2025 I-485 is still "normal" today**, because the published case-inquiry dates for I-485 at Miami, Hialeah, Kendall and Tampa are all in 2023–2024 (doc 04 §2.4) [C]. The channels that are *not* gated by that date are the expedite request (needs a qualifying hardship, and "I need my work permit" alone is explicitly not enough) [S], the Ombudsman (which generally refuses cases within processing time, and which after the March 2025 RIF is reported to be down to roughly two staff, so a request may never receive a substantive reply) [S/S-FC], and a lawsuit (expensive; the 143-plaintiff Tampa suit lost its TRO and PI in July 2026) [S].

| # | Remedy | Who runs it | Form / channel | Gate (eligibility threshold) | Cost | Realistic turnaround | What you get back | Spanish (official where known) |
|---|---|---|---|---|---|---|---|---|
| a | e-Request "Case outside normal processing time" | USCIS Contact Center → field office / NBC | `egov.uscis.gov/e-request` (paper filers) or myUSCIS account (online filers) [T]; Processing Times tool first | Receipt date must be **earlier** than the "receipt date for a case inquiry" shown for your form/office [S] | Free | Secondary sources: 30 days or 30–60 days; usually a template reply [S] | Status statement ("pending background checks", "scheduled for interview", etc.); no adjudication [S/T] | *Consulta de caso fuera del tiempo normal de procesamiento* [S-3rd party]; *Fecha de recibo para una consulta de caso* [T] |
| b | Expedite request | USCIS (adjudicating office decides) | Call 1-800-375-5283 or ask through the online account [S/T]; USCIS Policy Manual Vol. 1 Pt. A Ch. 5 | One of five criteria with documents: severe financial loss; emergency/urgent humanitarian; nonprofit cultural/social interest; U.S. government interest; clear USCIS error [S] | Free | Days to a few weeks for a yes/no [T]; a "yes" moves the case to the front, not to approval [T] | Granted → case worked out of order; denied → no appeal [T] | *Solicitud de procesamiento expedito*; *Criterios para el procesamiento expedito* [S official page] |
| c | CIS Ombudsman case assistance | DHS Office of the CIS Ombudsman (independent of USCIS) [S] | Form DHS-7001 online at `dhs.gov/topic/cis-ombudsman/7001` [S] | Must contact USCIS first; generally no cases within published processing time, limited exceptions [S] | Free | Online confirmation ≤24 h [S]; substantive answer historically weeks to months [T]; after the March 2025 RIF the office is reported at ~2 staff with a 2026 budget of $5.0M (from $11.6M) and described as "effectively closed" — a request **may receive no substantive reply** [S-FC — GAO B-337366; WOLA] | Ombudsman asks USCIS to review; cannot order action [T] | *Oficina del Ombudsman de Servicios de Ciudadanía e Inmigración*, *Formulario DHS-7001, Solicitud de Asistencia de Caso* [T] |
| d | Congressional inquiry | Your U.S. Representative or Senator → USCIS Office of Legislative Affairs | Member's privacy-release form (2026 versions exist) [S] | Offices generally will not file a *status* inquiry while within normal processing time; expedite requests through the office need evidence [S] | Free | USCIS policy: initial reply ≤5 days, "meaningful response" ≤30 days [S] | Same status statement as e-Request, sometimes with more detail; can carry an expedite request [S/T] | *Consulta congresional* / *carta del congresista*; *formulario de autorización de privacidad* [T] |
| e | Mandamus / APA unreasonable-delay suit | U.S. District Court | Complaint under 28 U.S.C. §1361 and 5 U.S.C. §§555(b), 706(1) [T] | No statutory threshold; practitioners' rule of thumb >2 yrs, realistically ~3 yrs (doc 06) [C]; TRAC factors [T] | $405 filing fee [T] + attorney fee (no 2026 figure found today; typical individual range $3k–$8k [T]) | Government answer due 60 days after service [T]; *Acosta Reynoso*: filed May 4 → TRO denied Jul 3 → PI denied Jul 30 2026 for lack of irreparable harm; the court ordered a report by Aug 13 on which plaintiffs' cases USCIS had since adjudicated [S/S-FC/C] | A court order to decide (not to approve); whether the M.D. Fla. court also held that §1252(a)(2)(B)(ii) bars the Mandamus Act count is **unconfirmed** (§6.2) [S-negative] | *Demanda de mandamus* / *recurso de mandamus* [S Spanish press] |
| f | Field-office appointment / Contact Center | USCIS Contact Center | Online appointment-request form (replaced InfoPass); no walk-ins [S]; phone 1-800-375-5283 (TTY 1-800-767-1833) [S] | Appointment only for specific needs (e.g., ADIT stamp, emergency travel document) — not for "why is my case slow" [T] | Free | Contact Center reviews and confirms date/time; not guaranteed [S] | In-person service for the specific need; Spanish-speaking agents available by phone [T] | *Cita en persona en una oficina local*; *Centro de Contacto de USCIS* [T] |

**Red Eagle class membership** (doc 03/11): a Cuban with an I-485 pending and not finally adjudicated on 2026-08-24 is a class member and USCIS has said it will comply with the injunction and "issue updated instructions" [S]. Today's searches found **no class-member complaint channel, hotline or e-mail** published by USCIS or class counsel [S-negative]; see §6.4.

---

## 2. (a) The e-Request "outside normal processing time" rule and what the case-inquiry date means today

### 2.1 Rules

- USCIS's Case Processing Times tool (`egov.uscis.gov/processing-times/`) shows, for each form, sub-category and office, a headline processing time and a separate **"receipt date for a case inquiry"**. If your receipt date is **earlier** than that date, your case is "outside normal processing time" and you may submit an e-Request [S — https://manifestlaw.com/blog/i485-processing-times ; https://www.lighthousehq.com/blog/i-485-processing-times ; https://nnuimmigration.com/uscis-processing-times/].
- You must enter your receipt date in the tool; the system blocks an inquiry until the milestone passes [S — https://citizenpath.com/form-i-485-processing-time/ ; https://www.immigrationdirect.com/blog/uscis-processing-times-explained/]. Early submissions "generally do not produce a result" beyond a template reply [S — https://nnuimmigration.com/uscis-processing-times/].
- The headline figure is the time in which **80%** of cases were completed over the previous six months (doc 04 §2.1, official `more-info` page) [C]; the inquiry date is set at a **higher** percentile, generally described as the **93%** completion point [S secondary — https://nnuimmigration.com/uscis-processing-times/ ; https://www.ellisporter.com/immigration-news/2018/3/23/case-processing-web (2018 description of the 50%/93% range)]. One result instead describes the headline as a median (50%) [S — https://manifestlaw.com/blog/i485-processing-times]; treat the 80% headline as the official statement (doc 04) and 93% as well-supported but secondary. These numbers are retrospective and are **not** predictions for an individual case [S — https://nnuimmigration.com/uscis-processing-times/].
- **An inquiry does not speed up adjudication.** It can surface a stalled background check or a missing document [S — https://www.lighthousehq.com/blog/i-485-processing-times]. Response: one source says within 30 days, another 30–60 days; no official response-time statement was found today [S — https://manifestlaw.com/blog/i485-processing-times ; https://www.immigrationdirect.com/blog/uscis-processing-times-explained/].
- **Follow-up rule used by practitioners:** if there is no response to the e-Request within 30 days, call the Contact Center (or use Emma) with the confirmation number to request an update [S-FC — https://learn.simplecitizen.com/immigration-support/when-your-uscis-case-is-outside-normal-processing-times----what-to-do]. One explainer states that USCIS changed its processing-times methodology/display in **February 2026**; the content of that change was not described and must be reconciled with doc 04 §2.1 before the §2.2 extrapolation is trusted [S-FC — https://manifestlaw.com/blog/uscis-processing-times ; §11 item 12].
- Other e-Request types (not gated by the inquiry date): did not receive notice/card/document by mail, typographical error on a notice, appointment accommodations, change of address [T]. An expedite is **not** an e-Request type (§3).
- Where the request goes: for an I-485 pending at a field office, the Contact Center routes the service request to that office; for the (c)(9) I-765, to the National Benefits Center (NBC) or the service centre holding it [T].

### 2.2 What "case inquiry date" means for a CAA I-485 at MIA / HIA / KND / TAM today

There is **no CAA sub-category** in the tool (doc 04 §2.4) [C]; the closest proxy is I-485 `131A-FAM` ("family-based") at the applicant's field office. Dates below are the `service_request_date` values published 2026-10-15 (doc 04 §2.4, verified from the `jzebedee/uscis` release diff) [C]; the Oct 18 2024 values are from the same doc [C]. The last two columns are this document's arithmetic [I].

| Office | Code | Inquiry date 2024-10-18 | Inquiry date 2026-10-15 | Movement in 24 months | Gap to a 2025-03-15 receipt | Crude linear ETA for a Mar-2025 filer to become "outside normal" [I] |
|---|---|---|---|---|---|---|
| Miami | MIA | 2020-10-07 | 2023-06-17 | +32.3 mo (1.35 mo per calendar month) | 21 mo | ≈ 15.5 months → **≈ Feb 2028** |
| Hialeah | HIA | 2023-02-03 | 2024-07-05 | +17.0 mo (0.71) | 8.3 mo | ≈ 11.7 months → **≈ Oct 2027** |
| Kendall | KND | 2022-11-06 | 2024-05-28 | +18.7 mo (0.78) | 9.6 mo | ≈ 12.3 months → **≈ Oct/Nov 2027** |
| Tampa | TAM | 2023-01-24 | 2024-08-07 | +18.4 mo (0.77) | 7.3 mo | ≈ 9.5 months → **≈ Aug 2027** |
| Orlando | ORL | 2022-06-24 | 2024-01-28 | +19.1 mo (0.80) | 13.5 mo | ≈ 17 months → ≈ Mar 2028 |
| West Palm Beach | WPB | 2022-07-13 | 2024-05-18 | +22.2 mo (0.92) | 9.9 mo | ≈ 10.7 months → ≈ Sep 2027 |
| Fort Myers | OFM | 2022-01-29 | 2024-05-11 | +27.4 mo (1.14) | 10.1 mo | ≈ 8.9 months → ≈ Jul 2027 |

Reading: **today no 2025 CAA filer at any Florida office can file an "outside normal processing time" e-Request**; it will be refused as "within normal processing" (README §2.3 already says this) [C/I]. The crude ETAs assume the inquiry date keeps moving at its 2024→2026 pace, which it will not if the Cuban backlog (355,520 pending, Aug 2026 [C]) keeps growing; they are illustrative bounds for the app's "you can file an e-Request from about …" line, and must be recomputed from the live tool each refresh [I].

For the **(c)(9) EAD**, the proxy is I-765 `147-C9` at NBC: inquiry date **2025-06-13** (NBC) / 2025-06-24 (SCD) as of 2026-10-15 (doc 04 §2.4) [C]. So an I-765 (c)(9) filed with a March 2025 I-485 **is** past the inquiry date today, and an e-Request on the EAD can be filed now [I]. The (c)(11) parole-EAD proxy `147-C11` has inquiry date 2025-04-26 [C], which is moot for CHNV Cubans because (c)(11) EADs were terminated in June 2025 (doc 03) [C].

### 2.3 How to file (steps the app can show)

1. Open the Processing Times tool, select I-485 → "Family-based adjustment" (proxy) → your field office; enter the receipt date from the I-797C; the tool says whether you may submit an inquiry [S — https://citizenpath.com/form-i-485-processing-time/].
2. If eligible: `egov.uscis.gov/e-request` → "Case outside normal processing time" (paper-filed I-485) or, for cases visible in a myUSCIS account, the account's "ask about my case" path [T]. Needed: receipt number, form, filing date, name, DOB, A-number, mailing address [T].
3. Keep the confirmation number; expect a template reply in roughly a month [S secondary]; if the answer is "pending background check" or "awaiting interview scheduling", that *is* the information, and the next rung is §4/§5 [I].

Spanish: the official tool is "Tiempos de procesamiento de casos" and the field is "Fecha de recibo para una consulta de caso" [T]; third-party Spanish guides use "fuera del tiempo normal de procesamiento" and "formulario de consulta" [S — https://oficinainmigracion.com/tiempo-procesamiento-uscis/ ; https://newfrontier.us/es/blog/%C2%BFQu%C3%A9-hacer-El-USCIS-tarda-demasiado./]. "e-Request" is usually left in English in community usage, or rendered *solicitud electrónica / solicitud de servicio* [T].

---

## 3. (b) USCIS expedite criteria and whether loss of work authorization qualifies

### 3.1 The criteria (USCIS Policy Manual, Vol. 1, Part A, Chapter 5)

The chapter was substantively amended by **PA-2024-05 (March 21 2024)** [S — https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20240321-ExpediteRequests.pdf ; https://www.ey.com/en_ca/insights/law/mobility-alerts/2024/uscis-issues-guidance-clarifying-processes-and-requirements-for-expedite-requests] and **updated again later in 2024** (next paragraph); both build on PA-2021-12 (June 9 2021) which restored nonprofit expedites [S — https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20210609-ExpediteCriteria.pdf] and a January 2022 clarification [S — https://aila.org/library/uscis-clarifies-guidance-on-expedite-requests]. **Later-2024 update(s).** USCIS's newsroom carries a separate alert, "USCIS Updates Policy Guidance Clarifying Expedite Requests", at a different URL from the March alert ("USCIS Updates Guidance on Expedite Requests", which now sits under /archive/), and law-firm alerts dated October 2024 report a clarification covering government-interest and emergency/urgent-humanitarian expedites (including I-131 travel), submission of requests with evidence through the USCIS online account's secure messaging, and the "sole discretion" standard [S — https://www.uscis.gov/newsroom/alerts/uscis-updates-policy-guidance-clarifying-expedite-requests ; https://www.uscis.gov/archive/uscis-updates-guidance-on-expedite-requests ; https://bizlegalservices.com/2024/10/18/expedite-requests-update/ ; https://www.fredlaw.com/alert-uscis-clarifies-policy-guidance-on-expedite-requests ; https://eiglaw.com/uscis-updates-policy-manual-regarding-expedite-requests/]. Today's search summary could not confirm an exact "October 11 2024" date and attributed the same content to March 21 2024; the fact-check pass also saw a Chapter 5 entry "effective July 12 2024" on the Policy Manual updates page. Treat the 2024 history as **two or three updates (Mar 21; Jul 12?; Oct 2024)** whose exact dates must be read from uscis.gov/policy-manual/updates [S/S-FC/I; §11 item 11]. **No 2025 or 2026 policy alert changing the chapter was found today** (re-confirmed by the fact-check pass) [S-negative — https://www.rnlawgroup.com/uscis-expedite-request-criteria/ ; https://www.visalawyerblog.com/uscis-releases-updated-guidance-for-expedite-request-criteria/]. The Spanish official page is "Procesamiento Expedito de Solicitudes" / "Criterios para el procesamiento expedito", which states that the decision to expedite "queda a discreción exclusiva de USCIS" and that supporting documents are usually requested [S — https://uscis.gov/es/formularios/criterios-para-el-procesamiento-expedito].

| Criterion (EN) | Criterio (ES, official page naming [T] except where marked) | What USCIS says it means | Applies to a CAA case? [I] |
|---|---|---|---|
| Severe financial loss to a company or person | *Pérdida financiera grave para una compañía o persona* | Loss must not stem from the requestor's failure to file or respond timely. Company: risk of failing, losing a critical contract, laying off others. Person: **job loss may be sufficient depending on circumstances**; also loss of critical public benefits or services. **"The need to obtain employment authorization by itself, without evidence of other compelling factors, does not warrant expedited treatment"** [S — https://www.rnlawgroup.com/uscis-expedite-request-criteria/ ; https://www.visalawyerblog.com/uscis-releases-updated-guidance-for-expedite-request-criteria/ ; https://learn.simplecitizen.com/immigration-support/submitting-an-expedite-request-for-the-employment-authorization-document-ead] | Yes for the **I-765 (c)(9)** when the (c)(11) card was terminated and a documented job offer/termination, eviction or benefit loss exists; weak for the I-485 itself |
| Emergencies and urgent humanitarian reasons | *Emergencias y razones humanitarias urgentes* | Illness, disability, death or serious condition of the requestor or a close relative; travel for an emergency is normally handled by an I-131 expedite [S/T — Salazar handout https://salazar.house.gov/sites/evo-subsites/salazar.house.gov/files/evo-media-document/information-about-uscis-categories-for-expedite-oct2023.pdf] | Yes, with medical/death documentation |
| Nonprofit organization (IRS-designated) whose request furthers U.S. cultural and social interests | *Organización sin fines de lucro* | Restored by PA-2021-12 [S] | Rarely |
| U.S. government interests | *Intereses del gobierno de EE. UU.* | Public safety, national security, federal contracts, other agencies' interests; PA-2024-05 added detail [S — EY] | Rarely (e.g., military enlistment) |
| Clear USCIS error | *Error claro de USCIS* | E.g., card issued with wrong data, case mis-routed, notice never sent [S — EY] | Yes where the case was wrongly held or a notice/biometrics was never generated |

USCIS decides "case by case" and the decision is in its "sole discretion"; there is no appeal of a refused expedite and the applicant may re-request with new evidence [S — https://www.rnlawgroup.com/uscis-expedite-request-criteria/ ; https://uscis.gov/es/formularios/criterios-para-el-procesamiento-expedito]. A granted expedite moves the case ahead in the queue; it does not decide it [T].

### 3.2 Does (c)(11) revocation or a long-pending CAA case qualify?

- **Pending CAA case by itself: no.** Delay is not a criterion; the agency's own backlog is not "clear USCIS error" [I from the criteria above].
- **Loss of the (c)(11) EAD (terminated June 2025, doc 03) with a still-pending (c)(9) I-765: possibly, on the "severe financial loss to a person" ground, but only with documents** — employer letter of termination or conditional offer, pay stubs, lease/eviction notice, utility shut-off, loss of Medicaid/SNAP or a professional licence tied to the EAD [S criteria; I application]. The rule that "need for an EAD alone is not enough" is the exact line USCIS uses to refuse these, so the request must be framed as *consequences* of not working, not as *wanting to work* [S/I]. A Florida Cuban-district congressional office (Rep. Salazar, FL-27) publishes its own one-page "Information about USCIS' categories for expedite" (last update 10/2/2023) for exactly this casework [S — Salazar PDF above].
- **The I-485 itself:** an expedite is realistic only on medical/humanitarian facts, or on "clear USCIS error" (e.g., a case still flagged under a hold that was vacated on 2026-06-05 / enjoined on 2026-08-24, or a biometrics appointment never generated) [I].

### 3.3 How to file

Call the USCIS Contact Center (1-800-375-5283; Spanish line available) and ask for an **expedite request** on the receipt number; the agent creates a service request and USCIS replies (by mail/e-mail/account message) asking for evidence, after which it grants or denies [T; phone number S — https://www.uscis.gov/policy-manual/volume-1-part-a-chapter-3]. If the case is in a myUSCIS account, the 2024 guidance says the applicant can submit the expedite request and upload supporting evidence through the account's secure messaging; requestors who go through the Contact Center are generally told when a decision is made [S — https://www.uscis.gov/newsroom/alerts/uscis-updates-policy-guidance-clarifying-expedite-requests ; https://www.fredlaw.com/alert-uscis-clarifies-policy-guidance-on-expedite-requests]. A member of Congress can forward the same request with the same evidence (§5) [S — https://pelosi.house.gov/us-citizenship-and-immigration-services]. Third-party Spanish guides describe the same path [S — https://vrapiweeks.com/expedited-processing/ ; https://www.visaido.com/es/blog/expedite-i-130-i-485 ; https://abogadolozano.com/expedite-uscis-case-premium-processing/]. Premium processing (Form I-907) does **not** exist for the I-485 or the (c)(9) I-765 [T].

---

## 4. (c) CIS Ombudsman case assistance (Form DHS-7001)

### 4.1 What it is and its 2025–2026 status

- The Office of the Citizenship and Immigration Services Ombudsman is an independent office within DHS, not part of USCIS [S — https://www.dhs.gov/topic/cis-ombudsman/7001]. It takes individual "requests for case assistance" on **DHS Form 7001** and asks USCIS to review; it cannot order USCIS to act [S/T].
- **March 21 2025:** DHS issued reduction-in-force notices to most CIS Ombudsman staff (together with CRCL and the Immigration Detention Ombudsman); staff were put on leave with RIFs to take effect May 23 2025; a coalition of state attorneys general and civil-rights groups sued; a judge denied a TRO to halt the cuts; DHS stated the office "continues to exist and will perform its statutorily required functions" [S — https://psbplaw.com/blog/the-closure-of-the-cis-ombudsman-office-a-legal-perspective/ ; https://immpolicytracking.org/policies/reported-trump-fires-nearly-all-dhs-civil-rights-and-civil-liberties-employees/ ; https://www.aila.org/library/policy-brief-shuttering-the-cis-ombudsman-closes-the-door-on-oversight-and-accountability-for-uscis ; https://www.boundless.com/blog/dhs-suspends-uscis-ombudsman-office-what-this-means-for-immigrants ; https://news.bgov.com/bloomberg-government-news/scrapping-immigration-ombudsman-office-erases-oversight-of-uscis]. A 2026 law-firm assessment: individual case-assistance capacity "appears significantly reduced and far less dependable than it once was" [S — https://www.sglegalgroup.com/blog/uscis-case-delayed-past-processing-time-what-to-do----from-case-inquiry-to-mandamus].
- **The office formally exists in 2026 but is reported to be near-dormant.** DHS lists a **2025 Annual Report dated 12/02/2025** (covering CY2024; USCIS responses deferred to an addendum) and a **2026 Annual Report dated 10/15/2026** [S — https://www.dhs.gov/publication/cis-ombudsman-annual-report ; https://www.dhs.gov/sites/default/files/2025-12/25_1202-cisomb-2025-Annual-Report-Redacted-508.pdf]. But: a GAO decision (**B-337366**, applying the Impoundment Control Act to the CISOMB/CRCL/OIDO cuts) confirms that RIF notices went to the majority of those offices' workforce on March 21 2025; an advocacy analysis reports CISOMB left with **one full-time employee plus one detailee** (≈95% cut from 40) and a budget cut from **$11,597,000 (2025) to $5,000,000 (2026)**; a February 2026 tracker entry calls the office "effectively closed", while another tracker gives a higher figure (head, deputy, five to seven FTE) [S-FC — https://www.gao.gov/products/b-337366 ; https://www.wola.org/analysis/denouncing-into-the-void-the-dismantling-of-internal-oversight-and-accountability-at-dhs/]. No source seen today or by the fact-check confirms that DHS-7001 requests receive substantive handling in 2026 [S-negative]. The 2026 report's text (and any 2025 case-assistance volume or response-time figure) could not be read today [S-negative].
- **September 25 2025:** DHS published a Federal Register information-collection notice revising Form DHS-7001 (FR doc 2025-18562) [S — https://www.federalregister.gov/documents/2025/09/25/2025-18562/agency-information-collection-activities-citizenship-and-immigration-services-ombudsman-request-for]; the draft revised form on reginfo.gov states the office "generally won't take a case that is within published processing times" and allows exceptions "only in very limited circumstances" [S — https://www.reginfo.gov/public/do/DownloadDocument?objectID=119155902].
- Baseline volumes for scale: ~30,000 requests for case assistance in 2023; the 2023 report says the backlog of requests was cut 69% (6,434 → 1,969) [S — https://www.dhs.gov/sites/default/files/2023-07/2023%20Annual%20Report%20to%20Congress_0.pdf ; https://www.aila.org/library/policy-brief-shuttering-the-cis-ombudsman-closes-the-door-on-oversight-and-accountability-for-uscis].

### 4.2 Intake criteria (what the form instructions require)

| Requirement | Source |
|---|---|
| **Contact USCIS first** ("contact USCIS first before submitting a request with our office") — i.e., an e-Request, Contact Center call or expedite request, with the confirmation/service-request number | [S — https://www.dhs.gov/topic/cis-ombudsman/7001 ; https://www.dhs.gov/publication/form-dhs-7001-instructions] |
| Case must generally be **outside published processing times**; very limited exceptions (emergencies, USCIS error, systemic problems) | [S — reginfo draft form; https://www.boundless.com/immigration-resources/how-to-submit-a-case-assistance-request-with-the-cis-ombudsman-a-step-by-step-guide] |
| File **online** (strongly preferred); paper or e-mailed forms take two to three weeks just to be entered; online filings are confirmed within 24 hours | [S — https://www.dhs.gov/sites/default/files/2024-04/24_0430_cisomb_Case-Assistance-Request-Tip-Sheet.pdf (April 2024 tip sheet) ; https://www.dhs.gov/topic/cis-ombudsman/7001] |
| Status of a request can be checked online with the CIS Ombudsman Request Number (go.dhs.gov/34R → "Check the Status of Your Request") | [S — https://x.com/cisombudsman?lang=en (Jan 2025 post)] |
| Signed consent (DHS-7001 includes a privacy/consent section; a representative may file with a G-28) | [T] |
| No fee | [T] |

**Turnaround.** No official 2026 response-time figure was found [S-negative]. Pre-2025 practice was an acknowledgement within days and a substantive reply typically in one to three months, longer for complex cases [T]; given the 2025 staff cuts (§4.1), the app should **not** promise "weeks to months" (the wording one Spanish-language guide uses, "de semanas a meses" [S — https://newfrontier.us/es/blog/%C2%BFQu%C3%A9-hacer-El-USCIS-tarda-demasiado./]); it should say the request **may receive no substantive reply** and must not be the only step taken [S-FC/I].

**Practical reading for a CAA filer.** Because the Ombudsman's own gate is the same "published processing time" test as the e-Request (§2.2), a 2025 CAA I-485 at a Florida office will usually be declined as premature unless framed as an exception: (i) the companion (c)(9) I-765 is past its inquiry date (NBC 2025-06-13) — file on the EAD; (ii) "USCIS error / systemic problem" — case still carrying a hold flag after the Dorcas vacatur and Red Eagle injunction; (iii) a documented emergency [I].

Spanish: the office's own Spanish naming is *Oficina del Ombudsman de Servicios de Ciudadanía e Inmigración* (also seen as *Defensor del Pueblo de CIS*) and the form is *Formulario DHS-7001, Solicitud de Asistencia de Caso*; DHS offers the online form in Spanish [T]. Today's searches did not surface the official Spanish page [S-negative].

---

## 5. (d) Congressional inquiry

### 5.1 How it works

- Every House and Senate office does "constituent casework". The applicant signs the member's **privacy release** (a Privacy Act consent to disclosure, 5 U.S.C. §552a(b); 8 U.S.C. §1367's confidentiality rules matter only for VAWA/T/U-protected applicants [T]) so USCIS can discuss the case with the office; 2026 editions are posted by, e.g., Rep. Cleaver ("privacy-waiver-uscis-2026.pdf") and Rep. McBath (March 2026) [S — https://cleaver.house.gov/sites/evo-subsites/cleaver-evo.house.gov/files/evo-media-document/privacy-waiver-uscis-2026.pdf ; https://mcbath.house.gov/wp-content/uploads/2026/03/cache-b-0-b0294912-a060-49b8-81c2-3f2e2cf86b86-98138b01600ec6779ceec3fadd83b904e09af0013ea3612fc745120319d8abbe-uscis-prf.pdf ; https://moran.house.gov/uploadedfiles/immigration_privacy_release_interactive.pdf ; https://wilson.house.gov/congressional-privacy-release-form].
- USCIS's **Office of Legislative Affairs** handles inquiries (uscis.gov/congress, "Congressional Casework"); the release must carry the subject's full name, date of birth, USCIS receipt number and/or A-number and the form numbers, and must **not** include a Social Security number; it must be signed by the subject of the inquiry [S — https://www.uscis.gov/sites/default/files/document/questions-and-answers/5%20117%20-%20New%20Member%20Outreach%20FAQs%2001042021.pdf].
- **USCIS's stated service standard:** at least an initial response within **5 days** of receipt and a "meaningful response" within **30 days** [S — same USCIS OLA FAQ]. Practitioner experience: offices often relay the answer in 2–8 weeks [T].
- **Gate:** at least one office states it cannot submit a "case status" inquiry while the case is within normal processing times, and that expedite requests need supporting evidence [S — https://pelosi.house.gov/us-citizenship-and-immigration-services]. Other offices will still send a "please review" letter; the answer then is the same template as an e-Request [T; https://lawandborder.com/asking-a-member-of-congress-for-help-with-your-immigration-case/ (general guide, S)].
- What USCIS answers: a short status ("the application is pending; background checks are in process"; "the case is awaiting interview scheduling at the X field office"; "an RFE was issued on …"; "the case is being held pending guidance") — it is information, not action, unless the letter carries an expedite request that meets §3 [T/I].

### 5.2 Florida's Cuban-district offices and 2026 CAA activity

- Reps. María Elvira Salazar (FL-27), Carlos Giménez (FL-28) and Mario Díaz-Balart (FL-26) all run casework and have intervened on CAA/CHNV matters [S — https://www.cubanet.org/?p=413766 ; https://mariodiazbalart.house.gov/media-center/press-releases/diaz-balart-salazar-gimenez-envian-carta-al-secretario-mayorkas-sobre].
- **2026-03-31:** Salazar wrote to DHS Secretary Markwayne Mullin asking USCIS to resume naturalization and other processes for Cubans and Venezuelans held under the December 2025 guidance [S — https://salazar.house.gov/media/press-releases/congresista-salazar-pide-al-departamento-de-seguridad-nacional-dhs-reanudar].
- **2026-07-16:** USCIS answered Salazar that it had begun lifting the pauses after the D.R.I. vacatur of June 5, and that it was "evaluating alternatives" for Cuban Adjustment Act cases [S — https://www.diariolasamericas.com/florida/uscis-levanta-las-pausas-que-frenaban-tramites-migratorios-cubanos-y-venezolanos-n5399295 ; https://lapatilla.com/2026/07/20/buenas-noticias-para-venezolanos-en-eeuu-uscis-retomo-procesos-de-naturalizacion/] (this is the "Jul 16 2026 letter to Rep. Salazar" already in docs 03/11) [C].
- Salazar's office publishes the expedite-criteria handout cited in §3 [S].
- Spanish: community outlets write *consulta congresional*, *carta del congresista*, *oficina del congresista*; the privacy release is *formulario de autorización de privacidad* / *autorización de divulgación* [T/I — the term did not surface in today's Spanish results].

---

## 6. (e) The 2026 mandamus landscape for CAA cases

### 6.1 The law in one paragraph

A "mandamus" suit asks a federal district court to order USCIS to **decide** (not approve) a case. Plaintiffs plead the Mandamus Act (28 U.S.C. §1361: clear duty owed to the plaintiff, no other adequate remedy) and the APA (5 U.S.C. §555(b): agencies must conclude matters "within a reasonable time"; §706(1): court may "compel agency action unlawfully withheld or unreasonably delayed") [T]. Courts weigh the **TRAC factors** (*Telecommunications Research & Action Center v. FCC*, 750 F.2d 70 (D.C. Cir. 1984)): rule of reason, any statutory timetable, human health and welfare at stake, effect on competing priorities, interests prejudiced, and no need to find impropriety [T]. Law-firm summaries seen today restate the three mandamus elements and warn that a case still inside USCIS's published times is a weak case, and that judges look at statutory deadlines, health/welfare and hard-to-reverse harm [S — https://immigrationhelpla.com/uscis-mandamus/ ; https://www.wilneroreilly.com/uscis-delays-writ-of-mandamus/ ; https://www.jeelani-law.com/articles/top-8-things-to-know-about-filing-a-writ-of-mandamus]. Venue is where the plaintiff resides or where the agency acts (28 U.S.C. §1391(e)); the government's answer is due 60 days after service (Fed. R. Civ. P. 12(a)(2)), which is why many single-plaintiff cases end with USCIS adjudicating in 2–6 months rather than litigating [T].

### 6.2 *Acosta Reynoso et al. v. USCIS et al.*, No. 8:26-cv-1314-KKM-NHA (M.D. Fla., Tampa Division)

| Date | Event | Source |
|---|---|---|
| 2026-05-04 | Filed by Cuban nationals (129 reported at filing, 143 in the court's order) under the APA and Mandamus Act over delayed CAA I-485s and I-765s; also attacks PM-602-0192/-0194/-0199 | [C — docs 06/07/12] |
| 2026-07-03 | TRO denied | [C — doc 12 §9] |
| 2026-07-30 (one outlet says "August") | **Preliminary injunction denied** (Judge Kathryn Kimball Mizelle, per the KKM suffix): the plaintiffs' failure to show a risk of irreparable injury absent an injunction was "fatal" to the motion; the court treated the government's position that **PM-602-0199 does not govern CAA applications** as persuasive, while noting the Cuban pathway does not mean all Cuban applications must be approved. The same order directed plaintiffs to **report by 2026-08-13 which of their I-485 and I-765 applications USCIS had adjudicated since filing**. Whether the court also found no likelihood of success, or held that **8 U.S.C. §1252(a)(2)(B)(ii) bars the Mandamus Act claims**, is **UNCONFIRMED**: neither today's search nor the fact-check pass found any result mentioning a §1252 holding or a TRAC analysis | [S-FC — order PDF https://ecf.flmd.uscourts.gov/cgi-bin/show_public_doc?2026-01314-41-8-cv= (doc. 41, as summarized in the fact-check search); S — https://en.cibercuba.com/noticias/2026-10-08-u1-e13-s27061-nid342267-demandan-uscis-nuevas-restricciones-obtener-green-card ; https://www.mundonow.com/en/lawsuit-against-uscis-puts-new-hurdles-for-green-card-in-spotlight-what-you-need/ ; https://www.cubaheadlines.com/articles/342267] |
| 2026-08-13 | Deadline for the plaintiffs' report on applications adjudicated since filing (contents not seen) | [S-FC — ECF doc 41] |
| 2026-10-20 | Case continues; no merits ruling found | [S-negative] |

The order text itself was not retrievable today. An earlier draft of this document stated a §1252(a)(2)(B)(ii) jurisdictional holding and a TRAC analysis as fact; the 2026-10-20 re-check (two independent search passes) found no result mentioning either, so they are carried only as open questions (§11 item 5; doc 11 §10 Q6 flags the same) [S-negative]. Today's search also confirmed only the case basics (143 Cuban plaintiffs; APA and Mandamus Act claims; a PI denial in July 2026) and surfaced a court opinions listing that attributes a 2026-07-03 order in this case to Judge Virginia M. Hernandez Covington while the case suffix (KKM) points to Judge Mizelle — possibly a duty-judge TRO ruling; unresolved [S — https://ecf.flmd.uscourts.gov/cgi-bin/Opinions.pl?judge=&division=8 ; https://www.mundonow.com/en/lawsuit-against-uscis-puts-new-hurdles-for-green-card-in-spotlight-what-you-need/].

**What this means for a CAA filer in 2026.** (1) The one large, well-publicised CAA delay suit obtained **no court-ordered acceleration** in its first five months — consistent with doc 06's conclusion that `mandamus_filed_date` is not a strong accelerator in 2026 and doc 08's provisional ×3-for-4-months multiplier should be reviewed downward [C/I]. **Caveat:** the PI order's instruction to report which plaintiffs' I-485/I-765s had been adjudicated since filing implies that USCIS adjudicated at least some of the 143 plaintiffs' cases while the suit was pending; that report (due 2026-08-13) is the single best data point for `multipliers.mandamus` (§9.3) and must be read before the "no acceleration" conclusion is finalised [S-FC/I]. (2) In the Tampa Division the Mandamus Act count *may* face a §1252(a)(2)(B)(ii) jurisdiction argument (the government routinely raises it); whether the court has so held is unconfirmed, so plaintiffs should plead the APA count in any event [T/I]. (3) Courts weigh "competing priorities": with 355,520 Cuban I-485s pending and ~800 completions a month (doc 04/08), a court is reluctant to put one plaintiff ahead of others absent special harm [I].

### 6.3 Thresholds and costs

- **When is it worth filing?** No statute sets a number. Directorio Cubano's practitioner rule of thumb (doc 06 §3.11): more than 2 years of delay, realistically about 3 years [C]. Law firms seen today frame it as "beyond posted processing times plus concrete harm"; one DACA-focused piece suggests escalation after ~120 days, which does not transfer to CAA cases [S — https://www.gozellaw.com/blog/daca-renewal-delay-mandamus]. For the reference case (filed 2025-03-15), the "2 years" mark is **2027-03-15**, "3 years" **2028-03-15** [I]. Because ~10 of its 19 months were spent inside court-vacated holds (README §2.3), a plaintiff can argue the delay is unreasonable *because* it was unlawful rather than merely long [I].
- **Cost.** Federal filing fee $405 [T]. No attorney-fee figures surfaced in today's search [S-negative — https://immigrationhelpla.com/uscis-mandamus/]; typical U.S. ranges for an individual delay suit are roughly $3,000–$8,000 flat, with multi-plaintiff suits (like the 143-plaintiff Tampa case) priced per plaintiff at a lower rate [T/I]. EAJA fees (28 U.S.C. §2412) are recoverable only if the plaintiff prevails and the government's position was not substantially justified [T].
- **Timeline.** Government answer in 60 days; many cases settle by adjudication before that; contested cases take 6–12+ months [T]. *Acosta Reynoso*: 3 months from filing to PI denial [S/C].
- **Pro se?** Possible but rare; the app should route users to AILA/legal-aid finders, not to templates [I].

### 6.4 *Red Eagle Law, L.C. v. Edlow* and the class-member "compliance channel"

- N.D. Cal. No. 3:26-cv-04850-CRB (Judge Charles R. Breyer), filed 2026-05-21; on **2026-08-24** the court certified a class and enjoined PM-602-0192 and PM-602-0194; USCIS is ordered to adjudicate class members' applications "in the normal course" [S — https://clearinghouse.net/case/48417/ ; https://assets.aila.org/files/0a1b20ad-2309-453a-9d87-b6911dfc201d/26090103.pdf ; https://www.visaverge.com/uscis/red-eagle-class-covers-pending-i-589-i-485-and-other-uscis-applications/].
- **Class definition:** citizens or natives of the 39 countries in Proclamations 10949/10998 (Cuba included) or the Palestinian Authority with a pending I-589 or other USCIS benefit application (I-485 included) held under those memoranda and not finally adjudicated as of certification [S — AILA PDF; https://news.clinchlaw.com/en/article/federal-court-certifies-class-and-blocks-uscis-hold-and-review-policies-affectin-mthwklkh ; https://txlrs.org/blog-post/texas-uscis-hold-policies-class-order-august-2026].
- **USCIS alert "Recent Court Order on Hold Policies"** (posted/updated 2026-08-28): USCIS "strongly disagrees" but "will follow its terms pending possible further judicial review" and "will issue updated instructions pending further litigation developments" [S — https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies ; https://www.lawitlaw.com/blog/uscis-publishes-recent-court-order-on-hold-policies/ ; https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/]. Commentary: the order "removes the hold as a reason for inaction and returns the case to ordinary processing"; it does not decide any application and can be modified or stayed later [S — mwlawllc].
- **Named plaintiffs and later procedure:** the 2026-08-24 order also required USCIS to decide the *named* plaintiffs' applications within **30 days** — a benchmark for what court-ordered "normal course" adjudication looks like — and the court later stayed further proceedings and deferred ruling on the government's motion to dismiss [S-FC — https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3 ; https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/]. Whether USCIS met the 30-day deadline (≈2026-09-23) is not known [S-negative; §11 item 14].
- **Compliance channel:** today's searches found **no** USCIS e-mail, form, or class-counsel hotline for class members whose cases remain stuck [S-negative]. The practical channel is therefore (i) an e-Request/expedite/congressional letter quoting the alert and the case number, and (ii) reporting non-compliance to class counsel via the docket (Clearinghouse page above; CourtListener per doc 05/13) [I]. **If USCIS answers an e-Request or congressional inquiry that the case is "on hold pending guidance"** despite the orders, the app should tell the user to keep that written reply (it is evidence of non-compliance), quote the 2026-08-28 alert and both case numbers in the next inquiry, and pass the reply to class counsel through the docket contacts; the two monitoring points to surface are the Clearinghouse case page (https://clearinghouse.net/case/48417/) and the PressUnpause docket tracker (https://uscis-pause-tracker.com/) [I; S-FC for the tracker]. The case is stayed pending the *Dorcas* First Circuit appeal (README §2.3) [C].
- **Related — two independent nationwide orders:** PM-602-0192/-0194 were already vacated nationwide by the June 5 2026 *Dorcas* judgment (D.R.I.) before *Red Eagle* enjoined them; a Cuban I-485 held under either memo is therefore covered by **both** orders, and a letter should cite both (the vacatur and the class injunction) [S-FC — uscis-pause-tracker; C]. USCIS's June 11/12 compliance alert and the First Circuit's Aug 14 partial stay (re-review only) are in docs 03/11 [C].

### 6.5 If the case is *denied* rather than delayed

Two October 2026 CiberCuba pieces explain that under PA-2026-05 USCIS may deny without an RFE/NOID and what a Cuban can do about a denial [S — https://en.cibercuba.com/noticias/2026-10-14-u1-e192519-s27061-nid342874-te-negaron-green-card-poder-defenderte-debes-saber ; https://www.cubaheadlines.com/articles/342874]. Remedies there are Form I-290B (motion to reopen/reconsider; no AAO appeal for a denied I-485), re-filing, or renewing the CAA application before an immigration judge if placed in proceedings [T]. Out of scope here but the app's "what can I do" screen should branch on *denied* vs *delayed* [I]. The separate challenge to the 2026 adjustment restrictions (reported as AAUP v. Mullin in docs 07/11) was **filed in Massachusetts (D. Mass.) on 2026-10-05**; Oct 8 is the CiberCuba reporting date, not the filing date. It is a policy challenge, not an individual remedy [S-FC — https://en.cibercuba.com/noticias/2026-10-08-u1-e13-s27061-nid342267-demandan-uscis-nuevas-restricciones-obtener-green-card ; C].

---

## 7. (f) Field-office appointments and the USCIS Contact Center path for Spanish speakers

- **No walk-ins.** "USCIS field offices do not allow walk-ins. You must have an appointment to visit an office" [S — https://www.uscis.gov/about-us/find-a-uscis-office/field-offices].
- **InfoPass is gone.** USCIS launched an **online appointment request form** that "replaces the InfoPass appointment reservation system"; it is a *request*, not self-scheduling: USCIS "does not guarantee an appointment for the preferred date or time requested"; the Contact Center reviews each request and confirms [S — https://www.uscis.gov/newsroom/alerts/uscis-launches-online-appointment-request-form ; https://www.cliniclegal.org/resources/religious-immigration-law/uscis-launches-new-online-form-request-appointments ; https://content.govdelivery.com/accounts/USDHSCIS/bulletins/36bf4cd]. URL: `my.uscis.gov/appointment` [T].
- **Phone fallback.** Policy Manual Vol. 1 Pt. A Ch. 3: those unable to request online "may call the USCIS Contact Center at 1-800-375-5283 (TTY: 1-800-767-1833)" [S — https://www.uscis.gov/policy-manual/volume-1-part-a-chapter-3].
- **What an appointment is for** (not for "why is my I-485 slow"): ADIT stamp / temporary I-551 evidence, emergency advance parole, proof of status, naturalization-ceremony issues, and similar [T; general guides S — https://baileyimmigration.com/how-to-request-an-in-person-appointment-at-a-uscis-field-office/ ; https://rjimmigrationlaw.com/resources/what-you-need-to-know-before-visiting-a-uscis-field-office/]. Community advice for Cubans waiting >12 months for a (c)(9) EAD was to "call USCIS and request InfoPass" (attorney Liudmila Marcelo, CiberCuba 2026-06-11, doc 07) [C] — in 2026 that means the online appointment request, and the Contact Center will usually redirect an EAD-delay complaint to an e-Request/expedite rather than grant an appointment [I].
- **2026 change at interviews:** effective **2026-05-18** attorneys/accredited representatives may no longer participate remotely in field-office interviews except in limited circumstances [S — https://www.uscis.gov/about-us/find-a-uscis-office/field-offices].
- **Spanish path.** The Contact Center phone tree offers Spanish ("para español, oprima 2"); the virtual assistant **Emma** answers in Spanish on uscis.gov/es; live agents ("Tier 1", then "Tier 2" immigration services officers for substantive issues) are reachable after Emma or the phone tree [T]. Today's searches did not surface an official page describing the Spanish live-agent path [S-negative]. The USCIS Spanish site (uscis.gov/es) carries the expedite-criteria page [S] and the parole page ("Permisos de Permanencia Temporal (Parole)") [S — https://uscis.gov/es/programas-humanitarios/permiso-humanitario-o-de-beneficio-publico-significativo-para-personas-que-estan-fuera-de-estados/permisos-de-permanencia-temporal-parole]. Note that the Contact Center was reported in 2025 to be shifting more traffic to online self-service; keep the phone number but set expectations of long holds [T].

---

## 8. Spanish terminology (for the app's ES strings)

| English (official) | Español | Tag / source |
|---|---|---|
| Case Processing Times tool; "Receipt date for a case inquiry" | *Tiempos de procesamiento de casos*; *Fecha de recibo para una consulta de caso* | [T] |
| e-Request: "Case outside normal processing time" | *Consulta de caso fuera del tiempo normal de procesamiento* (community/3rd-party: "caso fuera del tiempo normal de procesamiento") | [S — oficinainmigracion.com, newfrontier.us]; official wording [T] |
| Expedite request; expedite criteria | *Solicitud de procesamiento expedito*; *Criterios para el procesamiento expedito* ("Procesamiento Expedito de Solicitudes") | [S — https://uscis.gov/es/formularios/criterios-para-el-procesamiento-expedito] |
| Severe financial loss / emergencies and urgent humanitarian reasons / clear USCIS error | *pérdida financiera grave* / *emergencias y razones humanitarias urgentes* / *error claro de USCIS* | [T] |
| CIS Ombudsman; Request for Case Assistance (DHS-7001) | *Oficina del Ombudsman de Servicios de Ciudadanía e Inmigración* (also *Defensor del Pueblo de CIS*); *Solicitud de Asistencia de Caso, Formulario DHS-7001* | [T]; Spanish blog usage "Ombudsman" [S — newfrontier.us] |
| Congressional inquiry; privacy release form | *consulta congresional* / *gestión del congresista*; *formulario de autorización de privacidad* | [T/I] |
| Writ of mandamus; unreasonable delay | *demanda (recurso) de mandamus*; *demora irrazonable* | [S — Spanish press summaries in today's results; C — doc 06/11 Directorio Cubano] |
| USCIS Contact Center; in-person appointment at a field office | *Centro de Contacto de USCIS*; *cita en persona en una oficina local (oficina de campo)* | [T] |
| Employment Authorization Document (EAD) | *Documento de Autorización de Empleo (EAD)*; community: *permiso de trabajo* | [T; C doc 06] |
| Parole | *Permiso de Permanencia Temporal (Parole)*; community: *parole humanitario* | [S — uscis.gov/es parole page] |
| Request for Evidence / Notice of Intent to Deny | *Solicitud de Evidencia (RFE)* / *Notificación de Intención de Denegar (NOID)* | [T] |
| Premium processing (not available for I-485/(c)(9)) | *procesamiento prioritario* | [S — uscis.gov/es press-release URL "expandir el procesamiento prioritario"] |
| Receipt notice (I-797C) | *Notificación de recibo* | [T] |

---

## 9. What the app should encode

### 9.1 Decision tree for the "What can I do? / ¿Qué puedo hacer?" screen [I]

```
INPUT: form (I-485 | I-765 c9), receipt_date, office_code, milestones, hardship flags
1. Fetch inquiry_date(form, subtype proxy, office) from the processing-times snapshot (doc 04/13).
   - I-485: subtype 131A-FAM at office_code.   - I-765 c9: 147-C9 at NBC.
2. If receipt_date < inquiry_date  → "e-Request available" (rung a). Else → show the
   estimated month the inquiry date will pass receipt_date (§2.2 extrapolation) and skip to 3.
3. If hardship ∈ {job_loss_documented, benefits_loss, medical_emergency, death_in_family,
   uscis_error} → "Expedite request possible" (rung b) with the evidence checklist (§3).
   Else say explicitly: "needing the work permit by itself is not an expedite reason" [S].
4. Always offer rung d (congressional) with the caveat that the office may decline a status
   inquiry while within normal processing time [S]; show the member lookup by ZIP.
5. If rung a was used and ≥30 days passed with no reply → prompt "call the Contact Center / Emma
   with your confirmation number" [S-FC]. If (rung a or d was used and ≥30 days passed without
   resolution) AND (receipt_date < inquiry_date OR hardship OR hold_flag_after_2026-06-12)
   → rung c (Ombudsman), shown with the warning "may receive no reply" (§4.1).
6. If months_pending ≥ 24 (soft) / ≥ 36 (strong) OR a hold-vacatur argument applies →
   "Talk to a lawyer about mandamus" (rung e), with Acosta Reynoso context and the cost note.
7. Red Eagle: if nationality=Cuba AND I-485 not finally adjudicated on 2026-08-24 →
   class_member=true; show the USCIS alert link and suggest quoting it (and the Dorcas vacatur)
   in rungs a/b/d. If a reply says "on hold pending guidance", show the keep-the-reply /
   report-to-counsel step and the two monitoring links (§6.4).
8. Rung f only when the user picks a concrete need (ADIT stamp, emergency travel, proof of
   status); otherwise explain that appointments are not for status questions.
9. If decision=denied → branch to the denial screen (I-290B / lawyer), not this ladder.
```

### 9.2 Schema additions to doc 06 §8.1 (`case_timelines`)

`erequest_date`, `erequest_type` (outside_processing | no_notice | no_card | typo | other), `erequest_response_date`, `erequest_response` (template_pending | background_check | interview_pending | rfe | other); `expedite_request_date`, `expedite_basis` (financial | humanitarian | govt | nonprofit | uscis_error), `expedite_outcome` (granted | denied | no_response), `expedite_outcome_date`; `congressional_inquiry_date` (existing), `congressional_office` (free text, masked to state+chamber), `congressional_response_date`; `ombudsman_date` (existing), `ombudsman_request_number_present` (bool), `ombudsman_response_date`; `mandamus_filed_date` (existing), `mandamus_court` (district), `mandamus_outcome` (adjudicated | dismissed | pending | pi_denied), `mandamus_outcome_date`; `red_eagle_class_member` (derived bool). Suppress all with the n ≥ 5 rule [C].

### 9.3 Estimator hooks (doc 08)

- `multipliers.mandamus` default ×3 for 4 months is **unsupported for CAA in 2026**; recommend ×1.3 for 4 months until crowdsourced `mandamus_outcome` data (n ≥ 20) says otherwise [I; C doc 06/08]. Re-check against the *Acosta Reynoso* 2026-08-13 report of plaintiffs' applications adjudicated since filing (§6.2): if a material share of the 143 were adjudicated within ~3 months of filing, the multiplier should rise, not fall [S-FC/I].
- Expedite granted: treat as a milestone that moves the case to the post-interview-like distribution (median ≈ 2 months) only if `expedite_outcome=granted` [I].
- Congressional/Ombudsman/e-Request: no hazard change; they inform, they do not accelerate [S/I].

### 9.4 UI copy (EN / ES)

- EN: "By USCIS's own yardstick your I-485 is still 'within normal processing time' at {office} (inquiry date {inquiry_date}). USCIS will refuse a delay inquiry until the inquiry date passes your receipt date ({receipt_date}); at the current pace that could be around {eta_month}. You can still ask your member of Congress, request an expedite if you have a documented emergency or financial loss, or talk to a lawyer. This is not legal advice."
- ES: "Según el propio criterio de USCIS, su I-485 todavía está 'dentro del tiempo normal de procesamiento' en {office} (fecha de consulta {inquiry_date}). USCIS rechazará una consulta por demora hasta que la fecha de consulta pase su fecha de recibo ({receipt_date}); al ritmo actual eso podría ocurrir hacia {eta_month}. Aun así puede pedir ayuda a su congresista, solicitar procesamiento expedito si tiene una emergencia o una pérdida financiera documentada, o consultar a un abogado. Esto no es asesoría legal."
- EN (EAD): "Your (c)(9) work-permit application is past USCIS's inquiry date ({c9_inquiry_date}); you can file an 'outside normal processing time' e-Request today. If you lost a job or benefits because your parole work permit ended, you may also request an expedite with proof."
- ES (EAD): "Su solicitud de permiso de trabajo (c)(9) ya pasó la fecha de consulta de USCIS ({c9_inquiry_date}); hoy puede presentar una consulta por 'caso fuera del tiempo normal de procesamiento'. Si perdió un empleo o beneficios porque terminó su permiso de trabajo del parole, también puede pedir procesamiento expedito con pruebas."
- EN (Ombudsman): "The CIS Ombudsman office lost most of its staff in 2025. You can still file Form DHS-7001 online, but you may never receive a substantive reply; do not rely on it alone."
- ES (Ombudsman): "La Oficina del Ombudsman de CIS perdió a la mayoría de su personal en 2025. Todavía puede presentar el Formulario DHS-7001 en línea, pero es posible que nunca reciba una respuesta de fondo; no dependa solo de este paso."

---

## 10. Dated timeline of remedy-related events

| Date | Event | Tag / source |
|---|---|---|
| 2018-03 | USCIS reworks processing-time display; inquiry threshold described as the 93% point of a 50–93% range | [S — https://www.ellisporter.com/immigration-news/2018/3/23/case-processing-web] |
| 2019 (approx.) | InfoPass self-scheduling retired in favour of Contact Center-screened appointments | [T] |
| 2021-06-09 | PA-2021-12 restores nonprofit expedites (Policy Manual Vol. 1 Pt. A Ch. 5) | [S — USCIS 20210609-ExpediteCriteria.pdf] |
| 2022-01 | Expedite guidance clarified (nonprofits, government, emergencies) | [S — AILA] |
| 2022-03 | Processing-times tool moves to a single 80% figure plus separate case-inquiry date | [C — doc 04/08] |
| 2023 (approx.) | USCIS launches the online appointment-request form replacing InfoPass | [S — USCIS alert "USCIS Launches Online Appointment Request Form"] |
| 2023-10-02 | Rep. Salazar's office updates its expedite-categories handout | [S — salazar.house.gov PDF] |
| 2024-03-21 | PA-2024-05: expedite guidance updated (government interest, I-131, clear error; "sole discretion") | [S — USCIS 20240321-ExpediteRequests.pdf; EY] |
| 2024-07-12 (?) / 2024-10 (reported as 10-11) | Further 2024 update(s) to the expedite chapter: a Policy Manual updates-page entry "effective July 12 2024" (seen by the fact-check) and the USCIS alert "USCIS Updates Policy Guidance Clarifying Expedite Requests" reported by law firms in October 2024 (online-account submission; government-interest/emergency clarifications). One change or two: unresolved (§11 item 11) | [S — uscis.gov alert; bizlegalservices 2024-10-18; fredlaw; S-FC — Policy Manual updates page] |
| 2024-04-30 | CIS Ombudsman "Tips for Submitting a Case Assistance Request" revised | [S — dhs.gov PDF] |
| 2025-01 | CIS Ombudsman announces online status check for DHS-7001 requests (go.dhs.gov/34R) | [S — x.com/cisombudsman] |
| 2025-02-14 → 2025-06-09 | Parolee benefit hold (Freeze #1) | [C — doc 03] |
| 2025-03-21 | DHS issues RIF notices to most CIS Ombudsman staff; lawsuits follow; TRO denied; DHS says office continues; GAO decision B-337366 later confirms the notices went to the majority of the CISOMB/CRCL/OIDO workforce | [S — psbplaw, immpolicytracking, AILA, Boundless, BGOV; S-FC — gao.gov/products/b-337366] |
| 2025-05-23 | RIF effective date reported | [S — immpolicytracking] |
| 2025-09-25 | Federal Register notice 2025-18562 revising Form DHS-7001 | [S — federalregister.gov] |
| 2025-12-02 | CIS Ombudsman 2025 Annual Report (CY2024) published; USCIS responses deferred to addendum | [S — dhs.gov PDF] |
| 2025-12-02 → 2026-06-12 | Country hold (Freeze #2) | [C — doc 03] |
| 2026-02 | A tracker entry describes the CIS Ombudsman as "effectively closed" (reported ~2 staff; 2026 budget $5.0M vs $11.6M); a processing-times explainer reports a USCIS methodology/display change this month (content not captured) | [S-FC — WOLA; manifestlaw] |
| 2026-03-31 | Rep. Salazar letter to Sec. Mullin on Cuban/Venezuelan holds | [S — salazar.house.gov] |
| 2026-05-04 | *Acosta Reynoso v. USCIS* filed (M.D. Fla.) | [C — docs 06/12] |
| 2026-05-18 | Remote attorney participation at field-office interviews ends (limited exceptions) | [S — uscis.gov field-offices page] |
| 2026-05-21 | *Red Eagle Law v. Edlow* filed (N.D. Cal.) | [S — clearinghouse.net] |
| 2026-06-05 / 06-11 | *Dorcas* vacatur and USCIS compliance alert | [C — doc 03] |
| 2026-07-03 | *Acosta Reynoso* TRO denied | [C — doc 12] |
| 2026-07-16 | USCIS letter to Rep. Salazar: pauses being lifted; "evaluating alternatives" for CAA cases | [S — Diario las Américas; lapatilla] |
| 2026-07-30 | *Acosta Reynoso* PI denied for lack of irreparable harm; PM-602-0199 treated as not applying to CAA; plaintiffs ordered to report by 08-13 which applications were adjudicated since filing (a §1252(a)(2)(B)(ii) Mandamus Act holding is unconfirmed) | [S-FC — ECF doc 41 summary; S — CiberCuba; MundoNow] |
| 2026-08-13 | *Acosta Reynoso* plaintiffs' adjudication report due (contents not seen) | [S-FC — ECF doc 41] |
| 2026-08-24 | *Red Eagle* class certified, PM-602-0192/-0194 enjoined; named plaintiffs' applications to be decided within 30 days | [S — AILA; clearinghouse; S-FC — uscis-pause-tracker] |
| 2026-08-28 | USCIS alert "Recent Court Order on Hold Policies": will comply, "updated instructions" to follow | [S — uscis.gov alert] |
| 2026-10-05 (reported 10-08) | Policy challenge to the 2026 adjustment restrictions filed in Massachusetts (D. Mass.); reported by CiberCuba on 10-08 | [S-FC — CiberCuba] |
| 2026-10-15 | CIS Ombudsman 2026 Annual Report listed by DHS; processing-times release with inquiry dates used in §2.2 | [S — dhs.gov listing; C — doc 04] |
| 2026-10-20 | Today: no 2025/2026 change to expedite criteria found (re-confirmed); no Red Eagle class-member channel found; no official e-Request/Ombudsman response-time figure found; no source confirms a §1252(a)(2)(B)(ii) holding in *Acosta Reynoso* | [S-negative] |

---

## 11. Open questions and unverified items

1. **Exact percentile behind the case-inquiry date** (93%) — still secondary-source only; the official `more-info` page text was not read today (doc 04/08 flag the same) [S/T].
2. **Official response-time commitments** for e-Request and Ombudsman requests in 2026 — none found; only the congressional 5-day/30-day standard is official [S].
3. **CIS Ombudsman 2026 Annual Report (10/15/2026)** — exists; contents (2025 request volume, staffing after the RIF, response times) unread. High value for the app's "Ombudsman realistic turnaround" text.
4. **Revised DHS-7001 (FR 2025-18562)** — whether the final 2026 form adds a hard "USCIS inquiry number required" field; the draft says cases within processing time are generally refused [S].
5. ***Acosta Reynoso* order (ECF 41) and the 2026-08-13 report** — read the PDF to establish (i) whether any §1252(a)(2)(B)(ii) holding or TRAC analysis exists at all (two search passes found none; treat as unconfirmed), (ii) the exact irreparable-harm and PM-602-0199 language, (iii) how many of the 143 plaintiffs' I-485/I-765s were adjudicated between filing and the report; check whether a merits schedule or dismissal followed; and resolve which judge issued the 2026-07-03 order (Covington per the opinions listing vs Mizelle per the KKM suffix) [S/S-FC/I].
6. **Red Eagle class notice / counsel contact** — none found; check the docket (Clearinghouse 48417; CourtListener) for a class-notice order and counsel e-mail [S-negative].
7. **USCIS "updated instructions"** promised in the Aug 28 2026 alert — not found; if issued, they may create the compliance channel this document could not find.
8. **Mandamus attorney fees for CAA cases in Florida (2026)** — not found; the $3k–$8k range is [T].
9. **Spanish official strings** for the e-Request, Ombudsman and Contact Center pages — not surfaced today; the app's ES strings in §8 marked [T] need a pass against uscis.gov/es and dhs.gov/es when egress is available.
10. **Whether USCIS in 2026 routes "outside normal processing time" I-485 inquiries to the field office or answers centrally** — [T] in §2.1.
11. **2024 expedite-chapter history** — whether the "effective July 12 2024" Chapter 5 entry and the October 2024 alert "USCIS Updates Policy Guidance Clarifying Expedite Requests" are one change or two, and their exact dates; read uscis.gov/policy-manual/updates [S/S-FC].
12. **February 2026 processing-times methodology/display change** reported by one explainer — content unknown; reconcile with doc 04 §2.1 before trusting the §2.2 extrapolation [S-FC].
13. **CIS Ombudsman 2026 staffing and intake** — conflicting figures (≈2 staff vs "head, deputy, five to seven FTE"); whether online DHS-7001 requests get any substantive response in 2026; date and full text of GAO B-337366 [S-FC].
14. ***Red Eagle* 30-day named-plaintiff deadline** — whether USCIS met it (≈2026-09-23), and the current stay / motion-to-dismiss status [S-FC].
15. **Massachusetts policy challenge (filed 2026-10-05)** — caption, docket number, and whether it is the AAUP v. Mullin case referenced in docs 07/11 [S-FC/C].

---

## 12. Sources

Official / primary (as surfaced by search summaries, not read directly):
- https://www.uscis.gov/about-us/find-a-uscis-office/field-offices
- https://www.uscis.gov/newsroom/alerts/uscis-launches-online-appointment-request-form
- https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies
- https://www.uscis.gov/policy-manual/volume-1-part-a-chapter-3
- https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20240321-ExpediteRequests.pdf
- https://www.uscis.gov/newsroom/alerts/uscis-updates-policy-guidance-clarifying-expedite-requests (later-2024 alert)
- https://www.uscis.gov/archive/uscis-updates-guidance-on-expedite-requests (March 2024 alert, archived)
- https://www.gao.gov/products/b-337366 [S-FC]
- https://ecf.flmd.uscourts.gov/cgi-bin/Opinions.pl?judge=&division=8
- https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20210609-ExpediteCriteria.pdf
- https://www.uscis.gov/sites/default/files/document/questions-and-answers/5%20117%20-%20New%20Member%20Outreach%20FAQs%2001042021.pdf
- https://uscis.gov/es/formularios/criterios-para-el-procesamiento-expedito
- https://uscis.gov/es/programas-humanitarios/permiso-humanitario-o-de-beneficio-publico-significativo-para-personas-que-estan-fuera-de-estados/permisos-de-permanencia-temporal-parole
- https://uscis.gov/es/noticias/comunicados-de-prensa/uscis-anuncia-nuevas-acciones-para-atender-retrasos-expandir-el-procesamiento-prioritario-y
- https://content.govdelivery.com/accounts/USDHSCIS/bulletins/36bf4cd
- https://www.dhs.gov/topic/cis-ombudsman/7001
- https://www.dhs.gov/publication/form-dhs-7001-instructions
- https://www.dhs.gov/sites/default/files/2024-04/24_0430_cisomb_Case-Assistance-Request-Tip-Sheet.pdf
- https://www.dhs.gov/publication/cis-ombudsman-annual-report
- https://www.dhs.gov/publications-library/office-of-the-citizenship-and-immigration-services-ombudsman
- https://www.dhs.gov/sites/default/files/2025-12/25_1202-cisomb-2025-Annual-Report-Redacted-508.pdf
- https://www.dhs.gov/sites/default/files/2023-07/2023%20Annual%20Report%20to%20Congress_0.pdf
- https://www.federalregister.gov/documents/2025/09/25/2025-18562/agency-information-collection-activities-citizenship-and-immigration-services-ombudsman-request-for
- https://www.reginfo.gov/public/do/DownloadDocument?objectID=119155902
- https://x.com/cisombudsman?lang=en
- https://ecf.flmd.uscourts.gov/cgi-bin/show_public_doc?2026-01314-41-8-cv=
- https://clearinghouse.net/case/48417/
- https://assets.aila.org/files/0a1b20ad-2309-453a-9d87-b6911dfc201d/26090103.pdf
- https://salazar.house.gov/sites/evo-subsites/salazar.house.gov/files/evo-media-document/information-about-uscis-categories-for-expedite-oct2023.pdf
- https://salazar.house.gov/media/press-releases/congresista-salazar-pide-al-departamento-de-seguridad-nacional-dhs-reanudar
- https://mariodiazbalart.house.gov/media-center/press-releases/diaz-balart-salazar-gimenez-envian-carta-al-secretario-mayorkas-sobre
- https://cleaver.house.gov/sites/evo-subsites/cleaver-evo.house.gov/files/evo-media-document/privacy-waiver-uscis-2026.pdf
- https://mcbath.house.gov/wp-content/uploads/2026/03/cache-b-0-b0294912-a060-49b8-81c2-3f2e2cf86b86-98138b01600ec6779ceec3fadd83b904e09af0013ea3612fc745120319d8abbe-uscis-prf.pdf
- https://moran.house.gov/uploadedfiles/immigration_privacy_release_interactive.pdf
- https://wilson.house.gov/congressional-privacy-release-form
- https://pelosi.house.gov/us-citizenship-and-immigration-services

Practitioner / NGO analyses:
- https://aila.org/library/uscis-clarifies-guidance-on-expedite-requests
- https://www.aila.org/library/policy-brief-shuttering-the-cis-ombudsman-closes-the-door-on-oversight-and-accountability-for-uscis
- https://www.ey.com/en_ca/insights/law/mobility-alerts/2024/uscis-issues-guidance-clarifying-processes-and-requirements-for-expedite-requests
- https://www.rnlawgroup.com/uscis-expedite-request-criteria/
- https://www.visalawyerblog.com/uscis-releases-updated-guidance-for-expedite-request-criteria/
- https://learn.simplecitizen.com/immigration-support/submitting-an-expedite-request-for-the-employment-authorization-document-ead
- https://abogadolozano.com/expedite-uscis-case-premium-processing/
- https://psbplaw.com/blog/the-closure-of-the-cis-ombudsman-office-a-legal-perspective/
- https://immpolicytracking.org/policies/reported-trump-fires-nearly-all-dhs-civil-rights-and-civil-liberties-employees/
- https://www.boundless.com/blog/dhs-suspends-uscis-ombudsman-office-what-this-means-for-immigrants
- https://www.boundless.com/immigration-resources/how-to-submit-a-case-assistance-request-with-the-cis-ombudsman-a-step-by-step-guide
- https://news.bgov.com/bloomberg-government-news/scrapping-immigration-ombudsman-office-erases-oversight-of-uscis
- https://www.sglegalgroup.com/blog/uscis-case-delayed-past-processing-time-what-to-do----from-case-inquiry-to-mandamus
- https://lawandborder.com/asking-a-member-of-congress-for-help-with-your-immigration-case/
- https://immigrationhelpla.com/uscis-mandamus/
- https://www.wilneroreilly.com/uscis-delays-writ-of-mandamus/
- https://www.jeelani-law.com/articles/top-8-things-to-know-about-filing-a-writ-of-mandamus
- https://www.gozellaw.com/blog/daca-renewal-delay-mandamus
- https://www.lawitlaw.com/blog/uscis-publishes-recent-court-order-on-hold-policies/
- https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/
- https://uscis-pause-tracker.com/ ; https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3 [S-FC]
- https://www.wola.org/analysis/denouncing-into-the-void-the-dismantling-of-internal-oversight-and-accountability-at-dhs/ [S-FC]
- https://bizlegalservices.com/2024/10/18/expedite-requests-update/
- https://www.fredlaw.com/alert-uscis-clarifies-policy-guidance-on-expedite-requests
- https://eiglaw.com/uscis-updates-policy-manual-regarding-expedite-requests/
- https://learn.simplecitizen.com/immigration-support/when-your-uscis-case-is-outside-normal-processing-times----what-to-do [S-FC]
- https://txlrs.org/blog-post/texas-uscis-hold-policies-class-order-august-2026
- https://news.clinchlaw.com/en/article/federal-court-certifies-class-and-blocks-uscis-hold-and-review-policies-affectin-mthwklkh
- https://www.visaverge.com/uscis/red-eagle-class-covers-pending-i-589-i-485-and-other-uscis-applications/
- https://www.cliniclegal.org/resources/religious-immigration-law/uscis-launches-new-online-form-request-appointments
- https://baileyimmigration.com/how-to-request-an-in-person-appointment-at-a-uscis-field-office/
- https://rjimmigrationlaw.com/resources/what-you-need-to-know-before-visiting-a-uscis-field-office/

Processing-time explainers (secondary):
- https://manifestlaw.com/blog/i485-processing-times
- https://manifestlaw.com/blog/uscis-processing-times [S-FC]
- https://www.lighthousehq.com/blog/i-485-processing-times
- https://citizenpath.com/form-i-485-processing-time/
- https://www.immigrationdirect.com/blog/uscis-processing-times-explained/
- https://nnuimmigration.com/uscis-processing-times/
- https://www.ellisporter.com/immigration-news/2018/3/23/case-processing-web

Spanish-language (community and guides):
- https://en.cibercuba.com/noticias/2026-10-08-u1-e13-s27061-nid342267-demandan-uscis-nuevas-restricciones-obtener-green-card
- https://en.cibercuba.com/noticias/2026-10-14-u1-e192519-s27061-nid342874-te-negaron-green-card-poder-defenderte-debes-saber
- https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste
- https://www.cubaheadlines.com/articles/342267
- https://www.cubaheadlines.com/articles/342874
- https://www.mundonow.com/en/lawsuit-against-uscis-puts-new-hurdles-for-green-card-in-spotlight-what-you-need/
- https://www.diariolasamericas.com/florida/uscis-levanta-las-pausas-que-frenaban-tramites-migratorios-cubanos-y-venezolanos-n5399295
- https://lapatilla.com/2026/07/20/buenas-noticias-para-venezolanos-en-eeuu-uscis-retomo-procesos-de-naturalizacion/
- https://www.cubanet.org/?p=413766
- https://newfrontier.us/es/blog/%C2%BFQu%C3%A9-hacer-El-USCIS-tarda-demasiado./
- https://vrapiweeks.com/expedited-processing/
- https://www.visaido.com/es/blog/expedite-i-130-i-485
- https://oficinainmigracion.com/tiempo-procesamiento-uscis/

Existing corpus documents relied on: `04-uscis-data-sources.md` §2.1, §2.4; `06-community-and-third-party-data.md` §3.11, §8.1; `07-reported-timelines-2024-2026.md` (Acosta Reynoso row; CiberCuba 2026-06-11 attorney advice); `08-estimation-methodology.md` (multipliers); `11-policy-and-rules-master-timeline.md` §7, §10; `12-field-offices-states-and-geography.md` §6, §9; `README.md` §2.3.


---

## 13. Verification notes (editorial pass, 2026-10-20)

Two adversarial fact-check passes reviewed the first draft (5 extended searches between them); the editor then ran 2 further searches. Network egress to uscis.gov, dhs.gov, the courts and news sites remained blocked, so every check is search-summary based; nothing below was read from an official page.

**Accepted and applied**

1. *Expedite-chapter amendment history* (§3.1, §3.3, §10, §11) — major. The claim that PA-2024-05 (Mar 21 2024) was the *last* amendment was withdrawn. [S] Today's search found a USCIS newsroom alert "USCIS Updates Policy Guidance Clarifying Expedite Requests" at a different URL from the March alert (which now sits under /archive/), plus law-firm alerts dated October 2024 (bizlegalservices 2024-10-18; Fredrikson; EIG) reporting the clarification; the search summary itself could not confirm an "Oct 11 2024" date and attributed the same content to March 21, and the fact-check saw a "July 12 2024" Chapter 5 entry. Resolution: two or three 2024 updates with exact dates left open (§11 item 11). No 2025/2026 change [S-negative, confirmed by both passes]. The fact-checker's URL for the October alert (/newsroom/alerts/uscis-updates-guidance-on-expedite-requests) did not appear in today's results; the two URLs seen today are cited instead.
2. *Acosta Reynoso §1252(a)(2)(B)(ii) holding* (§1, §6.2, §10, §11) — major. Downgraded from fact to unconfirmed: the fact-check's search of ECF doc 41 and the editor's search found no result mentioning it; the reported dispositive ground is irreparable harm ("fatal") [S-FC]. [S] The editor's search confirmed only the case, 143 Cuban plaintiffs, APA/Mandamus Act claims and a July 2026 PI denial, and surfaced a court listing attributing the 2026-07-03 order to Judge Covington (unresolved; §11 item 5).
3. *PI grounds and the 2026-08-13 adjudication report* (§6.2, §9.3, §10) — minor. Applied; the report is flagged as the key data point for `multipliers.mandamus`, and the "no acceleration" conclusion is now qualified.
4. *CIS Ombudsman status* (§1, §4.1, §9.1, §9.4, §10, §11) — major. "Still operating" replaced by "formally exists, reported near-dormant" with GAO B-337366, the ~2-staff / $5.0M-vs-$11.6M figures and the "effectively closed" tracker entry, all [S-FC]; the app copy now carries a "may receive no reply" warning in EN/ES.
5. *Massachusetts policy challenge filed 2026-10-05, not 10-08; venue D. Mass.* (§6.5, §10) — minor. Applied [S-FC].
6. *Privacy-release legal basis* (§5.1) — minor. §1367 replaced by 5 U.S.C. §552a(b) [T]; the editor agrees from training knowledge that §1367 is the VAWA/T/U confidentiality provision, not a general consent statute.

**Missing points added:** Red Eagle 30-day named-plaintiff deadline and later stay (§6.4, §10, §11); Dorcas/Red Eagle overlap stated explicitly (§6.4, §9.1); monitoring points and the "on hold pending guidance" reply step (§6.4, §9.1); e-Request 30-day follow-up rule (§2.1, §9.1); February 2026 processing-times methodology change flagged (§2.1, §10, §11); 2024 online-account expedite submission (§3.3).

**Not changed:** Red Eagle core facts (confirmed by the fact-check, no edits); the 93% inquiry-date percentile, Contact Center numbers, $405 fee, 60-day answer, TRAC citation, 2026-05-18 interview change, FR 2025-18562 and the congressional PDF URLs remain [T]/[S] as before (not re-searched). No dead or wrong URLs were reported by either pass.

**Tag added:** [S-FC] = stated in a search result reported by the fact-check pass, not seen by the editor.
