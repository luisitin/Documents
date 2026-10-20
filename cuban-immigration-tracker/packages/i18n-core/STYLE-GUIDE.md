# CAA Tracker — guía de estilo / style guide for locale strings

Owner: WP4 (`07-implementation-plan.md` §8, ADR I18N-1/I18N-2/I18N-3). This guide binds every locale
namespace in `packages/i18n-core/locales/{es,en}/`, every `Localized` field in `data/curated/**`,
notification templates and disclaimers. `npm run i18n:check` enforces the mechanical rules.

Spanish is first-class. It is written for Cubans in the United States, many of them recent arrivals
with CHNV or CBP One parole, so it uses the words they use ("ajuste cubano", "parole", "permiso de
trabajo (EAD)", "residencia").

## 1. Register: usted (I18N-1)

- Always **usted**: "su caso", "puede presentar", "consulte", "revise".
- Never tú forms. The checker rejects "tú", "tu", "tus" ("tu caso"), "puedes", "tienes", "debes",
  "quieres", "necesitas", "sabes", "eres" and "estás" in Spanish strings.
- Doc 16 §8.4's copy is in tú. Convert it before use (see `common:disclaimer.enforcement`).
- If a string must quote tú wording verbatim (a rumour on the myths screen, for example), add an entry
  to `src/i18n-check-allowlist.json` with the file, the key, the term and a reason.

## 2. Terminology (doc 15 §8, key facts §10)

Use these terms. The `common:term.*` keys hold them, so screens can reuse them.

| Concept | Español | English |
|---|---|---|
| CAA | Ley de Ajuste Cubano; "ajuste cubano" in running text | Cuban Adjustment Act |
| Parole | parole (CHNV: "parole humanitario CHNV"; "parole por cita de CBP One") | parole |
| I-485 | solicitud de residencia (I-485); residencia permanente (green card) | green card application (I-485) |
| EAD | permiso de trabajo (EAD); "permiso de trabajo (c)(9)"; "(c)(11)" for parole-based | work permit (EAD) |
| e-Request | consulta de caso fuera del tiempo normal de procesamiento | case outside normal processing time |
| Expedite | procesamiento expedito | expedite request |
| RFE | Solicitud de Evidencia (RFE) | Request for Evidence (RFE) |
| NOID | Notificación de Intención de Denegar (NOID) | Notice of Intent to Deny (NOID) |
| Expedited removal | deportación acelerada | expedited removal |
| Contact Center | Centro de Contacto de USCIS (oprima 2) | USCIS Contact Center |
| Hold | pausa de adjudicación | adjudication hold |
| Vacatur | anulación judicial (vacatur) | court vacatur |
| The pool | el promedio del grupo nacional de I-485 cubanos | the national average for Cuban I-485s |

## 3. Banned wording (05 §5; 00 §3)

Rejected in **both** languages:

- "casos como el suyo" / "cases like yours". The estimate describes the national pool, not cases like
  the user's (00 §3.5).
- "será aprobado" / "will be approved", and "garantizado". The app never promises an outcome (05 §5.4).
- "presente ahora" / "file now", and "debe demandar". No directives (05 §5.3). Write "puede…", and end
  every expedite or mandamus rung with "consulte a un abogado o representante acreditado"
  (`common:legal.consult`).
- "inconstitucional" / "unconstitutional". The courts **vacated** the holds under the APA (doc 03 §12;
  05 §5.5). Write "un tribunal federal anuló (vacatur) la pausa".

## 4. Numbers, dates and placeholders (I18N-2)

- Never type a percentage or a date into a string. Interpolate it, and format it with `createFmt(lang)`:
  `"Vence el {date}"` with `{ date: fmt.date(d) }`. The checker warns on literal `9 %` or `2026-10-20`.
- Placeholders use single braces, `{name}`. The name is an ASCII identifier and must be identical in
  `es` and `en` (the checker compares the sets). Prefer short English names: `{date}`, `{month}`, `{n}`,
  `{p}`, `{fee}`. `{fecha}` is also fine, as long as both languages use it.
- Numbers use the US convention in both languages: `355,520` and `20.6` (ADR-I18N-2, 02 §9).
- Spanish percentages carry a no-break space (`9 %`, U+00A0). English uses `9%`. Below 1 % the app
  shows `<1 %` / `<1%`, and between 99 % and 100 % it shows `>99 %` / `>99%`.
- Dates: `20 oct 2026` / `Oct 20, 2026`. Months: `ago 2026` / `Aug 2026`; long form `agosto de 2026` /
  `August 2026`. Spanish month abbreviations are `ene feb mar abr may jun jul ago sept oct nov dic`.
- Plurals: use explicit `.one` / `.other` keys and `pluralKey(base, n)`. Do not use i18next `count`
  suffixes; they call `Intl.PluralRules`, which differs between engines.

## 5. Keys and files (I18N-3)

- One flat JSON object per namespace and language. A dot inside a key is part of the key
  (`"disclaimer.full"`), never a path. Values are non-empty strings.
- Each namespace has one writer: `common` → WP4, `ui` → WP7, `notifications` → WP6,
  `home offices alerts more method welcome` → WP8a, `case estimate peers ead remedies` → WP8b.
  WP9 may later edit values only (07 declared exception 3).
- Add a key to `es` and `en` in the same change; the checker fails on any key-set difference.
- In the app, configure i18next with `I18NEXT_FORMAT_OPTIONS` (`nsSeparator ':'`,
  `keySeparator false`, `{`/`}` interpolation) so it reads these files exactly as `translate()` does.

## 6. Tone (07 §8)

- Calm. Do not use alarm words for routine waiting. Red is only for real deadlines (00 §3.8).
- For a deadline, give the date and the action: "vence el {date}".
- Prefer short sentences and plain words. Write official terms out in full once, with the English
  acronym in parentheses: "Solicitud de Evidencia (RFE)".

## 7. Review gate

A native Cuban-Spanish reviewer checks every string, every curated `Localized` field, every
notification template and every disclaimer before release (05 §5.8). The sign-off is recorded in the
release PR.

## 8. Sources of the `common` strings

| Keys | Source |
|---|---|
| `disclaimer.full`, `disclaimer.antiScam` | `00-product-spec.md` §8 (verbatim) |
| `disclaimer.enforcement` | `00-product-spec.md` §8 (doc 16 §8.4 converted to usted; the date, 2026-08-11, is passed as `{date}`: key facts §3, doc 16 §6). The English text is our translation. |
| `disclaimer.unofficial`, `disclaimer.estimates` | `00-product-spec.md` S0 step 2, cards 1 and 3 |
| `disclaimer.short` | `00-product-spec.md` S7 pinned disclaimer |
| `legal.consult` | `00-product-spec.md` §3.7; `05` §5.3 |
| `state.updateFailed` | `00-product-spec.md` §5.1 (error state) |
| `prob.*` | `04-estimation-model.md` §8 item 2 |
| `unit.moreThanSixYears` | `04-estimation-model.md` §8 item 4 (median only if q50 ≤ 72) |
| `term.*` | key facts §10 glossary; `07` §8 terminology; `00` §3.5 (`term.nationalGroup`) |
| `month.*`, `monthShort.*`, `fmt.*`, `relative.*` | `02-data-model.md` §9 |
| `answer.unknown` ("No sé" / "I don't know") | `00-product-spec.md` S2 (every form step) |
