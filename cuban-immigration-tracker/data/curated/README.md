# `data/curated/` — human-edited inputs (WP9)

These files are **written by people and changed only through reviewed PRs**. They are not
downloads. The pipeline (WP5, `packages/ingestion/src/sources/curated.ts`) validates them with the
**strict** zod schemas of `@caa/data-schemas`. Then it copies them into the published snapshot:

| Curated input | Published as | Schema |
|---|---|---|
| `policy.json` | `data/policy.json` | `PolicyFileSchema` (02 §2.5) |
| `alerts/<id>.json` (one file per alert, file name = `id`) | `data/alerts.json` (`{ alerts: [...] }`, sorted by date, then id) | `AlertSchema` / `AlertsFileSchema` (02 §2.6) |
| `content.json` | `data/content.json` | `ContentFileSchema` (02 §2.7) |
| `historic_medians.json` | `data/quarterly.json` → `historicMedians` | `HistoricMedian[]` (02 §2.3) |

The data bot never commits here (03 §6.1 `git reset -- data/curated`; 05 §3). If a curated file is
invalid, CI fails on the PR, never the cron job (03 C1).

All content is **as of 2026-10-20**. It was written from the research corpus in `docs/research/`
(none of it is invented). Every fact traces to the citation table below.

## Rules for editors

1. **Register and wording.** Spanish uses **usted**, never tú, "tu caso" or "puedes" (07 §8,
   ADR-I18N-1). Use the terms of doc 15 §8 and key facts §10. Never write "casos como el suyo",
   "será aprobado", "presente ahora", "debe demandar", "garantizado" or "inconstitucional".
   Courts **vacated (anularon) the holds under the APA**; never call them unconstitutional
   (doc 03 §12; 05 §5.5). Use informational copy: "puede…", and "consulte a un abogado o
   representante acreditado" on legal topics.
2. **Both languages.** Every `Localized` needs a non-empty `es` and `en`. `es` may equal `en` only
   for proper names.
3. **Numbers.** Use the US convention in both languages (`355,520`, `23.7`). In Spanish, put a
   no-break space (U+00A0) before `%` (02 §9).
4. **Alerts never move the estimate by accident.** An alert changes the scenario weights only
   through `ruleIds`, which name the `policy.alertRules` it activates (04 §6.3). On 2026-10-20
   **no rule trigger has happened**, so none of the 12 seed alerts has `ruleIds`. The weights stay
   at the priors 0.30 / 0.40 / 0.15 / 0.15, and the G1 canary equals GOLDEN T15. Add `ruleIds`
   only for the event a rule describes (for example, a First Circuit ruling that affirms *Dorcas* →
   `DORCAS_AFFIRMED`). Also update `policy.litigationState`.
5. **Estimator-bound numbers** (regime dates, scenario priors and paths, alert-rule factors, the
   `classes`, `cohort`, `ead` and `pa202605` literals) are fixed by `04-estimation-model.md` and the
   golden file. Changing them needs the owner-approved process of 07 §10 rule 3.
6. **Reviewer.** Each alert's `reviewedBy` must be the handle of a human reviewer who is not the
   author (05 §3.1). The seed alerts say `pending-native-es-review` until that review happens
   (checklist below).
7. **Validate** with `npm run data:validate` (strict zod for `data/` and `data/curated/`) and
   `npm run i18n:check` (empty sides, register, banned phrases), both run from
   `cuban-immigration-tracker/`.

## Review checklist (release gate; 07 WP9, 05 §5.8)

- [ ] **Native Cuban-Spanish reviewer sign-off** on every `es` string in this folder.
  Reviewer handle: `________` · date: `________`.
  *Not done yet. The files were written by an agent (WP9) on 2026-10-20.*
- [ ] Each seed alert's `reviewedBy` set to that reviewer's handle.
- [ ] Legal-copy review: no directive or conclusory wording (05 §5).
- [ ] Re-check `fees.mandamusFiling` (405 USD) after the 2026-12-01 federal court fee changes.
- [ ] Confirm the FY2027 H.R.1 fee amounts (570 / 1,050 / 105) against the official USCIS notice
  (doc 11 §10 item 13). Then drop the "pending confirmation" wording in `policy.fees` and in alert
  `2026-10-16-fy2027-fees`.
- [ ] Update `content.peerReasons[non_fifo]` (Aug 2026: 820 decided, 355,520 pending) when a newer
  monthly file is published. Or have the peers screen interpolate those numbers.

## Citation table (field → research section)

Abbreviations: "KF" = `docs/research/00-key-facts-for-the-app.md`; "MT" = `00-master-timeline.md`;
"doc NN" = `docs/research/NN-*.md`; "00/02/04" = `docs/planning/`. Evidence tags as in the research
([F] USCIS file, [S] primary or official-adjacent page, [S-sec] press only, [T] training knowledge,
[I] inference).

### `policy.json`

| Field | Value(s) | Source |
|---|---|---|
| `regimes[R0–R4].start/end/hold/appliesTo` | R0 → 2025-02-13; R1 2025-02-14 → 2025-06-09 (CHNV, FRP_CFRP, U4U); R2 2025-06-09 → 2025-12-01; R3 2025-12-02 → 2026-06-12 (ALL_CUBAN); R4 2026-06-12 → open | KF §3 JSON; MT "Regime breakpoints"; 02 §2.5; 04 EST-12 |
| `regimes[R1].lowConfidenceExempt` | `CBP_ONE` | KF §1 flags, §3; doc 16 §3 |
| `regimes[R1].altEnds` | legal 2025-05-28; ops 2025-06-19, 2025-06-25 | KF §3; MT 2025-05-28, 2025-06-19/25 |
| `regimes[R3].altEnds` | legal 2026-06-05; judgment 2026-06-11; ops 2026-07-16 | KF §3; MT 2026-06-05, 06-11, 07-16 |
| `regimes[*].instruments` | Davidson memo 2025-02-14; memo 2025-06-09; PM-602-0192 / 0194; PA-2025-26; PM Vol. 7 Pt A Ch. 10 (2025-11-27); parole-history factor (2025-08-19); PM-602-0199 (`appliesToCaa: false`, likely); PA-2026-05 (`true`); Red Eagle PI; 1st Cir. partial stay; I-485 edition 09/18/26 | KF §3 R4 instruments; doc 14 §1, §3, §4, §8.6; MT rows of those dates |
| `regimes[R1].suspendedBy` | Doe v. Noem second stay order, 2025-05-28, D. Mass. 1:25-cv-10495 | MT 2025-05-28; doc 03 §5.1 |
| `regimes[R3].suspendedBy` | Dorcas vacatur 2026-06-05 (D.R.I. 1:26-cv-00132); Red Eagle PI 2026-08-24 (N.D. Cal. 3:26-cv-04850-CRB) | MT 2026-06-05, 2026-08-24; KF §9 |
| `subBreakpoints` (22) | dates 2025-01-23 … 2026-10-14 | KF §3 `sub_breakpoints` (verbatim dates); MT |
| `scenarios` S0–S3 | 800 flat (0.30); ramp 800 → 4,600 over 12 mo (0.40); ramp 800 → 9,200 over 6 mo (0.15), labelled "Ritmo de fines de 2024 (oct–dic 2024)" / "Late-2024 pace (Oct–Dec 2024)"; 6-month freeze then S1 (0.15, not likelihood-updated); anchor 2026-08 | 04 §6.1 (S2 relabel, revision B14); KF §3 estimator defaults |
| `alertRules` | DORCAS_AFFIRMED S3 ÷ 3; DORCAS_REVERSED and FIRST_CIR_STAY_BENEFITS_HOLD S3 × 3 / × 1.5 (Red Eagle protects); RED_EAGLE_DISSOLVED S3 × 2 while Dorcas is pending; NEW_HOLD_MEMO_CUBA S3 × 3; AAUP_RELIEF_DENIAL_POLICY → approval card `reestimate`; COMPLETIONS_GE_2000 retired | 04 §6.3 rule table; KF §3 alert re-weighting |
| `litigation[dorcas]` | D.R.I. 1:26-cv-00132; 1st Cir. 26-1703; CL 73477958; vacatur in force, stay denied 07-15, partial stay (re-review only) 08-14 | KF §9; MT 2026-06-05, 06-12, 07-15, 08-14; doc 03 §9 |
| `litigation[red-eagle]` | N.D. Cal. 3:26-cv-04850-CRB; CL 73380879; Clearinghouse 48417; class PI 08-24, USCIS alert 08-28, case stayed | KF §9; MT 2026-08-24, 08-28; doc 15 §6.4 |
| `litigation[aaup-v-mullin]` | D. Mass. 1:26-cv-14527; CL 74919678; Clearinghouse 48515; filed 2026-10-05, no TRO/PI | KF §9; doc 14 §1(c), §5 |
| `litigation[acosta-reynoso]` | M.D. Fla. 8:26-cv-01314-KKM-NHA; 143 plaintiffs; TRO denied 07-03, PI denied 07-30 | KF §5 rung e, §9; doc 14 §6; doc 15 §6.2; MT 2026-05-04, 07-03, 07-30 |
| `litigation[doe-v-dhs]` | D. Mass. 1:25-cv-12245; CL 71085922; Clearinghouse 46889; 03-31 vacatur, 04-24 re-terminations, single-source report that they were allowed | KF §9; doc 16 §4; MT 2026-03-31, 04-24, 05-06 |
| `litigation[chirla]` | D.D.C. 1:25-cv-00872; D.C. Cir. 25-5289; Clearinghouse 46285; stay vacated 2026-08-11 (standing) | KF §1 flags, §9; doc 16 §6; MT 2026-08-11 |
| `litigation[make-the-road]` | D.C. Cir. 25-5320; June 2026 opinion unread | KF §9; doc 16 §6 |
| `litigation[bello-rubio]` | S.D. Fla. 1:25-cv-23665; 992 plaintiffs; MTD denied 09-10 | KF §1, §9; MT 2026-09-10 |
| `litigation[labrada-hechavarria]` | 11th Cir. 23-13664 / 24-10645; remand 2026-02-23; BIA decision expected Oct–Nov 2026 [S′ press] | KF §1, §9; MT 2026-02-23, 2026-07-20 |
| `litigation[doe-v-noem]` | D. Mass. 1:25-cv-10495-IT; 1st Cir. 25-1384; CL 69695790; May 28 2025 order final (appeal dismissed 2025-11-04); FRP PI of Jan 2026 in force? unconfirmed | KF §9; MT 2025-11-04, 2026-01-10/24 |
| `litigationState` | Dorcas `vacatur_in_force_appeal_pending`; Red Eagle `piInForce: true`; as of 2026-10-20 | KF §9; MT 2026-10-20 status row; 04 §6.3 "Today" |
| `classes` | Red Eagle: not finally adjudicated on 2026-08-24; Doe v. DHS: CBP One parole 2023-05-15 → 2025-01-19 (window start uncertain); FRP carve-out: I-485 pending by 2025-12-15, FR 2025-22744 | KF §1 flags; doc 16 §4.3; MT 2025-12-15 |
| `cohort` | 110,240 CHNV Cubans (CBP, Dec 2024); CBP One Cubans ≈100,000 (70k–130k), low confidence | KF §3, §7; doc 16 §2.3, §8.3 |
| `approval.cleanPrior` | 0.70–0.90, only with basic documents | KF §3; doc 14 §8.1; 04 §7 |
| `approval.unmodelledFactors` | criminal history and inadmissibility; prior removal orders; I-220A misrecording; parole history factor; expired I-693; PA-2026-05 residual denial channel | KF §1 (`packet_complete`), §3; doc 14 §8.1; 02 §2.5 |
| `ead` | 5 years if issued before 2025-12-05, 18 months from then; no auto-extension for renewals filed on or after 2025-10-30; final rule 2026-10-14 | KF §2 row 4; MT 2025-10-30, 2025-12-05, 2026-10-14 |
| `pa202605` | effective 2026-08-05; RFE ≤ 84 days (12 weeks); NOID 30 days + 3 mail | KF §2 row 8; doc 14 §4 |
| `fees` I-485 1,440 / 950 under 14; I-765 (c)(9) 260; I-131 AP 630 (since 2024-04-01) | 89 FR 6194 | KF §4; MT 2024-04-01 |
| `fees` I-912 waiver | CAA I-485 fee waivable [T] | KF §4; doc 02 |
| `fees` (c)(11) 570 / 280; parole 1,050; I-589 annual 105; TPS 500; I-246 155 (755 proposed) | H.R.1 statutory fees, FR 2025-13738 and 2025-20622; FY2027 amounts from press [S′], to be confirmed | KF §4; doc 11 §1 item 5, §6 row 2026-10-16 and §10 item 13; MT 2025-07-22, 2026-01-01, 2026-10-16 |
| `fees.freeRemedies` | e-Request, expedite, DHS-7001, congressional inquiry: free | KF §4; doc 15 |
| `fees.mandamusFiling` | 405 USD (350 filing + 55 administrative) [T], `asOf` 2026-10-20, re-check after 2026-12-01; attorney ≈ 3,000–8,000 [T/I] | KF §4; doc 15 §6.3; 07 WP9; 00 S7 |
| `fees` I-290B | **not included**: the research has no amount ("see USCIS fee schedule" [T]) | KF §4 |
| `congressionalOffices` | FL-26 Díaz-Balart, FL-27 Salazar, FL-28 Giménez | KF §6 rule 6; doc 15 §5.2 |

### `alerts/` (the 12 seed alerts of 00 S8)

| Alert id | Facts used | Source |
|---|---|---|
| `2026-05-22-pm-602-0199` | memo dated 05-21, public 05-22; silent on CAA; government told M.D. Fla. it does not apply | doc 14 §1(a), §3, §6.2; MT 2026-05-21/22 |
| `2026-06-05-dorcas-vacatur` | vacatur under the APA 06-05; USCIS will comply 06-12; appeal 26-1703 | MT 2026-06-05, 06-12; doc 03 §9.2, §12 |
| `2026-08-05-pa-2026-05` | deny without RFE/NOID; RFE ≤ 12 weeks; NOID 30 + 3 days; no extensions; covers CAA I-485/I-765/I-131 | doc 14 §1(b), §4, §8.2; KF §2 row 8 |
| `2026-08-11-chirla-stay-vacated` | D.C. Cir. 25-5289 vacated the 2025-08-01 stay for lack of standing; warning copy converted to usted | doc 16 §6, §8.4; KF §1 `expedited_removal_shield`; 00 §8 enforcement disclaimer |
| `2026-08-14-first-circuit-partial-stay` | stay limited to the Comprehensive Re-Review Policy | MT 2026-08-14; doc 03 §1 item 4 |
| `2026-08-24-red-eagle-pi` | class of applicants not finally adjudicated on 08-24; PI against PM-602-0192/0194; USCIS compliance 08-28; no complaint channel | MT 2026-08-24, 08-28; doc 15 §6.4; 05 §5.2 wording |
| `2026-09-18-i485-edition` | edition 09/18/26 mandatory, no grace; public-charge rule effective, CAA exempt | KF §1, §4; MT 2026-09-18 |
| `2026-10-05-aaup-v-mullin` | D. Mass. 1:26-cv-14527 filed 10-05; no TRO/PI as of 10-20 | doc 14 §1(c), §5; MT 2026-10-05 |
| `2026-10-14-ead-auto-extension-rule` | FR 2026-20955 effective 10-14; renewals filed ≥ 2025-10-30 not auto-extended; 18-month validity from 2025-12-05 | KF §2 row 4; MT 2026-10-14 |
| `2026-10-16-fy2027-fees` | (c)(11) 570, parole 1,050; nothing on I-485 or (c)(9) | doc 11 §1 item 5, §6 row 2026-10-16, §10 item 13; MT 2026-10-16 |
| `2026-10-20-fy26-q3-data` | FY26 Q3: 586 completions, 139 approved, 447 denied (23.7 %); Q1 91.7 % (4,098 / 4,471); Q2 52.6 % (50 / 95); same-quarter FY2025 denials 785 | KF §7 [F]; doc 14 §3.4, §8.1; 04 §6.1 conflict note (785) |
| `2026-10-20-i220a-parole-scam` | notarios selling fake parole papers to I-220A Cubans; Rep. Salazar warnings [S-sec] | 00 S8 seed list; `docs/planning/proposals/proposal-user-first.md` search #2 sources; 05 §5.6 |

### `content.json`

| Field | Source |
|---|---|
| `myths[may-memo-ended-caa]` | doc 14 §8.7; 00 S10 item 1 |
| `myths[rfe-before-denial]` | doc 14 §4, §8.7; 00 S10 item 2 |
| `myths[notario-converts-i220a]` | KF §1 (Cabrera-Fernández); 00 S10 item 3; 00 §8 anti-scam copy |
| `myths[hold-violated-constitution]` | doc 03 §1 item 6, §12; 00 S10 item 4 (the claim is reworded so the copy never calls the holds unconstitutional, even to quote the rumour) |
| `myths[terminated-parole-no-adjustment]` | doc 16 §5; KF §1 `entry_is_historical` |
| `myths[ead-speeds-green-card]` | doc 08 §7.5 (EAD multiplier 1.0, separate (c)(9) queue [F doc 04 §1.2]); 00 S10 item 6 |
| `myths[approved-screenshot]` | doc 06 §3.8 (viral screenshot story); doc 08 §5.4 (non-FIFO); 00 S4 closing line |
| `peerReasons` (exact U2 id set) | 00 S4 table (text, confidence and source per row); 04 §9 U2 |
| `glossaryExtra` (43 terms) | KF §10 (the complete glossary); doc 15 §8 Spanish terms |

### `historic_medians.json`

| Value | Source |
|---|---|
| FY2023 3.3; FY2024 4.6; FY2025 7.0; FY2026 to date 11.8 (cut 2026-07-31) and 12.3 (cut 2026-08-30) | KF §7; 03 P6; doc 04 §2.6. Values reached us via the press [S-sec] (historic-pt is Cloudflare-gated) |
