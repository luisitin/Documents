# `packages/ingestion/test/fixtures/`

Two kinds of fixture. Keep them apart.

## `mirror/`: real USCIS files

These are byte-identical copies of USCIS files. They come from the public mirror
`https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/`
(`docs/research/04-uscis-data-sources.md` §1.0). They were fetched on 2026-10-20.

USCIS files are U.S. Government works (17 U.S.C. § 105). `npm run data:fixtures` downloads them
again and checks each one against the sha256 pinned in `src/fixtures.ts`.

| File | Used for |
|---|---|
| `monthly_august_2026.csv` | Q2 golden row 1213 / 386 / 434 / 355,520 / 345,741 / 20.6 (03 §3.1). BOM and CRLF |
| `monthly_july_2024.csv` | Earliest seed month (02 §2.2) |
| `monthly_february_2026.csv` | Trailing comma on every row (doc 04 §1.1) |
| `monthly_april_2025.csv` | Footnote 12, (c)(11) status flips → I-765 `caveat` |
| `quarterly_all_forms_fy2026_q3_v1.xlsx` | Q2 golden Cuban row 6,279 / 139 / 447 / 586 / 342,360 / 16.3 (03 §3.2) |
| `i485_performance_data_fy2026_q3_v1.xlsx` | Q2 golden Hialeah humanitarian pending 37,486 (03 §3.3) |

## `synthetic/`: SAMPLE inputs (not real data)

This sandbox cannot reach these sources, so the inputs below were made by hand. Each file says
so in its own header. None of them is ever published.

| File | Stands in for |
|---|---|
| `jzebedee.sql` | A jzebedee/uscis SQLite release. GitHub release assets cannot be reached from the sessions (07 WP5). The SQL is turned into a database when the tests run. Its inquiry dates are the real 2026-10-15 values (doc 04 §2.4). Its range values are only test inputs |
| `portal-index.html` | The USCIS data-portal index page |
| `fr-search.json` | A Federal Register `documents.json` response. It contains the real document numbers 2025-05128 and 2025-22744 |
| `rss-alerts.xml` | A USCIS newsroom RSS feed. Its items are invented and titled "SAMPLE" |
| `cl-entries.json` | A CourtListener v4 `docket-entries` response. Its entries are invented |

Some tests also build synthetic CSVs in memory, such as a September 2026 month for the new-month
and quarantine tests. Each such CSV starts with the line `SYNTHETIC TEST FIXTURE`, and they are
never written to `data/`.
