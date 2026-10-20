# G0 — hand-built SAMPLE snapshot (WP1)

**This is sample data, not a pipeline download.** It is the gate G0 of
`docs/planning/07-implementation-plan.md` §5: the 7 v1 data files plus a manifest, transcribed by
hand so the UI work packages can start before the ingestion pipeline (WP5) runs. WP5 copies the
`*.json` files into `app/src/data/sample/` in its first commit and later replaces them with G1
(the frozen golden snapshot produced by `npm run data:refresh` + `npm run data:sample`).

The manifest says so in machine-readable form: `origin: "bundled_sample"`,
`generatedBy.runId: "g0-handbuilt"`, every `sources[].status` is `fallback_used` with a note, and
`qa.notes` carries the bilingual sample label.

| File | Content | Source (all as of 2026-10-20) |
|---|---|---|
| `national.json` | the 24 monthly "I-485 (Cuban)" rows Sep 2024 → Aug 2026; `i765National` empty (no complete [F] I-765 row in the research) | `docs/planning/04-estimation-model.md` Appendix A = `docs/research/04-uscis-data-sources.md` §1.1 [F] |
| `quarterly.json` | FY2026 Q1–Q3 rows for I-485 (Cuban) and I-765 (Adjustment Of Status); historic FY medians; approval baselines 91.7 / 52.6 / 23.7 / 83.2 % | doc 04 §1.2 [F]; key facts §7 (medians via press [S-sec]) |
| `offices.json` | HIA, KND, MIA, TAM (the FL-4 golden fixture, 04 §5.3) and HOU; FY26 Q2–Q3 humanitarian-column stats; 131A-FAM and NBC 147-C9 inquiry dates of 2026-10-15; the 2024-10-18 → 2026-10-15 inquiry-date history | doc 04 §1.3 [F]; key facts §5–§6; doc 15 §2.2 |
| `policy.json` | regimes R0–R4, sub-breakpoints, scenarios S0–S3, alert rules, litigation, classes, cohort, approval, EAD, PA-2026-05, fees, congressional offices | key facts §1–§4, §9; 04 §6.1, §6.3; doc 15 §5.2 |
| `alerts.json` | empty list (07 §5) | — |
| `content.json` | empty myths, peer-reason copy and glossary (WP9 writes the curated content) | — |
| `params.json` | β = 0.0373909… with SSE 4.8515 (Appendix A oracle core, run 2026-10-20); office multipliers by EST-11; observation σ 0.30; prior weights | 04 §3.2, §5.3, §6.2, §6.3 |
| `manifest.json` | sha256 and byte length of each file; canary = GOLDEN T15 (P12 0.09229, q50 54) | 04 §9.2 |

Notes:
- `retrievedAt` is the date the research was compiled (2026-10-20T00:00:00Z), not a live fetch.
- `months80` is `null` in the processing-time records: the research has 80 % times only from a
  different, secondary source and month (key facts §6), so none is attached to the 2026-10-15
  publication.
- `NBC` is referenced by the (c)(9) record but not listed as an office (its state is not in the
  research); `validateDataDir` reports this as a warning, not an error.

After editing any file here, recompute the manifest entries (`sha256`, `bytes`) and run
`npx vitest run packages/data-schemas`, which validates this directory with `validateDataDir` and
checks the numbers against the documents above.
