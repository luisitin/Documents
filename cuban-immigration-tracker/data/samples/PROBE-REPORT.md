# PROBE-REPORT: first probe run (local sandbox, 2026-10-20)

> **This local probe was blocked by the sandbox's egress policy.** These results do not describe
> the endpoints. They only show that the build container cannot reach them.
>
> The build sandbox's proxy allows only `registry.npmjs.org`, `pypi.org`, `github.com` and
> `raw.githubusercontent.com`. It refuses every government host (`uscis.gov`, `egov.uscis.gov`,
> `dhs.gov`, `cbp.gov`, `federalregister.gov`, `census.gov`) and `courtlistener.com`. Those calls
> fail before reaching a server (`ENOTFOUND` → `network_error`). The GitHub API is also outside
> this session's policy (`api.github.com` → `http_error 401/403`). No secrets were set, so the Torch
> and CourtListener probes are `skipped_no_secret`.
>
> **The real report comes from CI.** On every push to `claude/cuban-immigration-tracker-b6y4b1`
> that touches `cuban-immigration-tracker/packages/ingestion/**` (and on `workflow_dispatch`), the
> `caa-probe` workflow (`.github/workflows/caa-probe.yml`) runs the same probes from a GitHub-hosted
> runner, which has open internet. It prints `PROBE-REPORT.md` to the job log and the job summary,
> and uploads `probe-out/` as the `probe-report` workflow artifact. It never commits. Copy that
> report here when it lands.
>
> Nothing below was faked or edited by hand. Apart from its title line, the section below is the verbatim output of
> `npm run probe` (`packages/ingestion/src/cli.ts probe --report-dir probe-out`), run in the sandbox
> on 2026-10-20. It classifies every probe of `docs/research/13-live-data-endpoints-and-probe-plan.md`
> §12.4. Some doc 13 ids are expanded here:
> - `pt.time.*` becomes one row per form, office and subtype.
> - `rss.*` becomes one row per feed.
> - `portal.monthly.next` and `portal.quarterly.next` become one row per predicted file.
> - `pt.nextaction` adds `pt.nextaction.page`.
> - `ohss.dictionary` adds `ohss.dictionary.page`.
> - `pt.mirror.jzebedee` adds `pt.mirror.jzebedee.release`.
>
> The one `ok` row, `mirror.visualizer` (raw.githubusercontent.com), is the only reachable source.
> It is also what the first committed data (G1) was built from. That data is marked
> `fallback_used` in `data/manifest.json`.

## Local run output (verbatim)

Run: 2026-10-20T23:38:25.511Z → 2026-10-20T23:39:05.939Z · runner: **local**

Totals: http_error 2 · network_error 54 · ok 1 · skipped_no_secret 7

| id | classification | status | ms | bytes | note |
|---|---|---|---:|---:|---|
| pt.landing | network_error | — | 61 |  | TypeError: fetch failed: ENOTFOUND |
| pt.forms | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.formtypes.i485 | network_error | — | 4 |  | TypeError: fetch failed: ENOTFOUND |
| pt.formtypes.i765 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.offices.fam | network_error | — | 4 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-485.HIA.131A-FAM | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-485.KND.131A-FAM | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-485.MIA.131A-FAM | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-485.TAM.131A-FAM | network_error | — | 4 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-485.HOU.131A-FAM | network_error | — | 4 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-765.NBC.147-C9 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.time.I-765.NBC.147-C11 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.nextaction.page | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.nextaction | network_error | — | 0 |  | page not reachable; POST not attempted |
| pt.apify_claim | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.historic | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| pt.moreinfo | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| torch.token | skipped_no_secret | — | 0 |  | missing USCIS_CLIENT_ID, USCIS_CLIENT_SECRET |
| torch.case | skipped_no_secret | — | 0 |  | no sandbox token |
| torch.case.422 | skipped_no_secret | — | 0 |  | no sandbox token |
| torch.prod.unauth | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| torch.pt.unauth | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| portal.index | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| portal.allforms.q3 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| portal.i485office.q3 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| portal.monthly.aug26 | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| portal.monthly.next.2026-09 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| portal.monthly.next.2026-10 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| portal.quarterly.next.FY2026Q4.allforms | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| portal.quarterly.next.FY2026Q4.i485office | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| portal.i765 | network_error | — | 0 |  | index not reachable |
| ohss.monthly.page | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| ohss.monthly.file | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| ohss.dictionary.page | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| ohss.dictionary | network_error | — | 0 |  | page not reachable |
| ohss.yearbook | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| ohss.yearbook.lprsupp1 | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| cbp.dec24 | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| cbp.jan25 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| cbp.custody | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| cbp.custody.fy2026 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| fr.search | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| fr.doc | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| fr.search.frp | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| fr.agencies | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| cl.docket | skipped_no_secret | — | 0 |  | missing COURTLISTENER_TOKEN |
| cl.entries | skipped_no_secret | — | 0 |  | missing COURTLISTENER_TOKEN |
| cl.search | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| cl.alerts.list | skipped_no_secret | — | 0 |  | missing COURTLISTENER_TOKEN |
| cl.usage | skipped_no_secret | — | 0 |  | missing COURTLISTENER_TOKEN |
| census.group | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| census.state | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| census.2025 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| rss.22984 | network_error | — | 1 |  | TypeError: fetch failed: ENOTFOUND |
| rss.23269 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| rss.59144 | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| rss.60288 | network_error | — | 5 |  | TypeError: fetch failed: ENOTFOUND |
| rss.93166 | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| rss.97790 | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| rss.forms-updates | network_error | — | 2 |  | TypeError: fetch failed: ENOTFOUND |
| pt.mirror.jzebedee.release | http_error | 401 | 76 | 112 |  |
| pt.mirror.jzebedee | http_error | — | 0 |  | release lookup failed; asset not downloaded |
| foia.metrics | network_error | — | 3 |  | TypeError: fetch failed: ENOTFOUND |
| mirror.visualizer | ok | 200 | 127 | 785620 | direct copy not fetched; sha not compared |

## Findings

- EGOV_REACHABLE=false
