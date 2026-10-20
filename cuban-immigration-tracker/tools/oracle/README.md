# VPH-1.1 reference oracle (`tools/oracle`)

Stdlib-only Python (3.12+, run with `python3 -I`; no pip install, 07 §3.3) that produces the
estimator's acceptance target, `packages/estimator/golden/vph1.golden.json` (04 EST-13).

| File | What it is |
|---|---|
| `vph1.py` | The core: `docs/planning/04-estimation-model.md` Appendix A, copied **verbatim** (only a provenance header was added). Pool reconstruction, β fit, projection, grid, mixture, quantiles. |
| `golden_cases.py` | **The entry point.** Its first line puts its own directory on `sys.path` (because `-I` implies `-P`), then imports `vph1`. It adds what 04 §4–§7 specify (milestone multipliers, special modes, state mixture, structural extras, likelihood update with the S0–S2 sub-mass floor, alert composition) and writes every row of 04 §9. |

```sh
npm run golden:write   # python3 -I tools/oracle/golden_cases.py --write packages/estimator/golden/vph1.golden.json
npm run golden:check   # recompute and diff the committed file (tolerance 1e-6); CI runs this
```

## Precedence (EST-13)

Every number printed in 04 §9 (plus §3.1, §3.2, §5.3, §6.2, §7) is encoded in `DOC_EXPECTED`
at the precision the document prints it (172 values). Both `--write` and `--check` verify them
first. On any disagreement the script prints `ESCALATE`, exits 2 and writes nothing: the owner
must approve an edit of 04 §9 before the golden file may change. Never regenerate the file to
match new code.

## Fixture choices (documented, not model changes)

- **Office fixture multipliers.** T16 and the FL-4 state mixture (T30) use the key-facts §3
  multipliers as printed (HIA 0.947, KND 0.829, MIA 0.963, TAM 1.936, HOU 1.140), which is what
  04 §5.3 lists for FL-4 and what reproduces the T16 values to the printed 5 decimals. T6 checks
  separately that EST-11 on the doc 04 §1.3 rows reproduces those multipliers (unrounded: e.g.
  TAM 1.93633). The difference is < 3e-5 on any P12, far inside the 5e-4 TS tolerance.
- **T17** ("vintage 2025-10") is the T15 fixture moved to a 2025-10-15 receipt with a biometrics
  milestone, so the vintage is the only change (the 0.7 no-biometrics rule stays off).
- **Origin-month receipts.** A receipt in or before the pool origin month (2024-09) maps to
  `legacy>6mo` when it is at least 6 months before the origin and to `legacy<6mo` otherwise
  (EST-1's split of the origin row). 04 §3.3's comment says "`legacy>6mo` if receipt < 2024-09";
  no golden case depends on the refinement.
- **Alert composition.** An active alert for an event overrides a curated litigation state that has
  not caught up (an active `DORCAS_REVERSED`/`DORCAS_AFFIRMED` ⇒ Dorcas not pending; an active
  `RED_EAGLE_DISSOLVED` ⇒ the PI is not in force). That is what keeps "never compound past × 3"
  true for every curated state (T32 checks both).

All inputs are the official monthly rows (doc 04 §1.1 [F]) and office rows (doc 04 §1.3 [F]);
the outputs are model results, never official figures, and the file says so in `meta.note`.
