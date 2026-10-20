/**
 * probWord (04 §8 item 2), localize (02 §1), language helpers, resources and translate.
 */
import { describe, expect, it } from 'vitest';
import {
  I18NEXT_FORMAT_OPTIONS, LANGS, NAMESPACES, NAMESPACE_OWNERS, createFmt, hasKey, interpolate, interpolationVars,
  langFromLocale, localize, monthNames, monthShortNames, otherLang, pluralCategory, pluralKey, probBand, probWord,
  resources, splitKey, translate, type CommonKey, type I18nKey, type KnownI18nKey,
} from '@caa/i18n-core';

describe('probWord (04 §8 item 2; 07 WP4 acceptance boundaries)', () => {
  const cases: [number, string, string][] = [
    [0.0499, 'muy poco probable', 'very unlikely'],
    [0.05, 'poco probable', 'unlikely'],
    [0.2, 'posible', 'possible'],
    [0.5, 'probable', 'likely'],
    [0.8, 'probable', 'likely'],
    [0.8001, 'muy probable', 'very likely'],
  ];
  it.each(cases)('%f → %s / %s', (p, wantEs, wantEn) => {
    expect(probWord(p, 'es')).toBe(wantEs);
    expect(probWord(p, 'en')).toBe(wantEn);
  });

  it('covers the extremes and the reference headline', () => {
    expect(probWord(0, 'es')).toBe('muy poco probable');
    expect(probWord(1, 'en')).toBe('very likely');
    expect(probWord(0.1999, 'es')).toBe('poco probable');
    expect(probWord(0.4999, 'en')).toBe('possible');
    // GOLDEN T15 P(≤12) = 0.0923 (04 §9) → "poco probable".
    expect(probWord(0.0923, 'es')).toBe('poco probable');
  });

  it('non-finite → dash', () => {
    expect(probBand(Number.NaN)).toBeNull();
    expect(probWord(Number.NaN, 'es')).toBe('—');
  });
});

describe('localize', () => {
  it('picks the requested side', () => {
    const l = { es: 'Ley de Ajuste Cubano', en: 'Cuban Adjustment Act' };
    expect(localize(l, 'es')).toBe('Ley de Ajuste Cubano');
    expect(localize(l, 'en')).toBe('Cuban Adjustment Act');
  });

  it('falls back to the other side when one is blank (old cached file)', () => {
    expect(localize({ es: '  ', en: 'Only English' }, 'es')).toBe('Only English');
    expect(localize({ es: 'Solo español', en: '' }, 'en')).toBe('Solo español');
  });
});

describe('language helpers', () => {
  it('device locale default: es* → es, else en (00 S0 step 1)', () => {
    expect(langFromLocale('es-US')).toBe('es');
    expect(langFromLocale('es')).toBe('es');
    expect(langFromLocale('ES_cu')).toBe('es');
    expect(langFromLocale('en-US')).toBe('en');
    expect(langFromLocale('fr-FR')).toBe('en');
    expect(langFromLocale('est')).toBe('en');
    expect(langFromLocale(null)).toBe('en');
    expect(langFromLocale(undefined)).toBe('en');
  });

  it('otherLang and LANGS', () => {
    expect(otherLang('es')).toBe('en');
    expect(otherLang('en')).toBe('es');
    expect(LANGS).toEqual(['es', 'en']);
  });
});

describe('resources (I18N-3)', () => {
  it('has all 14 namespaces in both languages, each with an owner', () => {
    expect(NAMESPACES).toHaveLength(14);
    for (const lang of LANGS) {
      expect(Object.keys(resources[lang]).sort()).toEqual([...NAMESPACES].sort());
    }
    for (const ns of NAMESPACES) expect(NAMESPACE_OWNERS[ns]).toMatch(/^WP\d+[ab]?$/);
  });

  it('every namespace has the same keys in es and en, all strings', () => {
    for (const ns of NAMESPACES) {
      expect(Object.keys(resources.es[ns]).sort(), ns).toEqual(Object.keys(resources.en[ns]).sort());
      for (const lang of LANGS) {
        for (const v of Object.values(resources[lang][ns])) expect(typeof v).toBe('string');
      }
    }
  });

  it('common carries the 00 §8 disclaimer verbatim in both languages', () => {
    expect(resources.es.common['disclaimer.full']).toBe(
      'CAA Tracker es una herramienta independiente y no oficial. No está afiliada a USCIS, DHS ni a ninguna agencia del gobierno. Los estimados son proyecciones estadísticas con datos públicos, no están validados para el período de política actual y pueden equivocarse; cada caso es distinto. Esto no es asesoría legal: consulte a un abogado de inmigración o a un representante acreditado.',
    );
    expect(resources.en.common['disclaimer.full']).toBe(
      'CAA Tracker is an independent, unofficial tool. It is not affiliated with USCIS, DHS or any government agency. Estimates are statistical projections from public data, are not validated for the current policy period and can be wrong; every case is different. This is not legal advice: consult an immigration attorney or an accredited representative.',
    );
  });

  it('uses the Cuban terminology of key facts §10 / 07 §8', () => {
    const es = resources.es.common;
    expect(es['term.caa']).toBe('Ley de Ajuste Cubano');
    expect(es['term.adjustment']).toBe('ajuste cubano');
    expect(es['term.parole']).toBe('parole');
    expect(es['term.ead']).toBe('permiso de trabajo (EAD)');
    expect(es['term.eadC9']).toBe('permiso de trabajo (c)(9)');
    expect(es['term.contactCenter']).toBe('Centro de Contacto de USCIS (oprima 2)');
    expect(es['term.expeditedRemoval']).toBe('deportación acelerada');
    expect(es['term.nationalGroup']).toBe('el promedio del grupo nacional de I-485 cubanos');
  });

  it('month tables come from common.json', () => {
    expect(monthShortNames('es')[8]).toBe('sept');
    expect(monthNames('en')[7]).toBe('August');
    expect(monthNames('es')).toHaveLength(12);
  });
});

describe('interpolate / translate', () => {
  it('replaces single-brace placeholders and leaves unknown ones visible', () => {
    expect(interpolate('Vence el {date}', { date: '20 oct 2026' })).toBe('Vence el 20 oct 2026');
    expect(interpolate('{a} y {b}', { a: 1 })).toBe('1 y {b}');
    expect(interpolate('${amount}', { amount: '405' })).toBe('$405');
    expect(interpolate('sin variables')).toBe('sin variables');
    expect(interpolationVars('{b} {a} {b} {{x}}')).toEqual(['a', 'b', 'x']);
  });

  it('translates through resources with i18next missing-key behaviour', () => {
    const fmt = createFmt('es');
    expect(translate('es', 'common:asOf.uscisThrough', { month: fmt.month('2026-08') })).toBe('Datos de USCIS hasta ago 2026');
    expect(translate('en', 'common:asOf.uscisThrough', { month: createFmt('en').month('2026-08') })).toBe('USCIS data through Aug 2026');
    expect(translate('es', 'common:legal.consult')).toBe('Consulte a un abogado o representante acreditado.');
    expect(translate('en', 'common:does.not.exist')).toBe('common:does.not.exist');
    expect(translate('en', 'nope:key')).toBe('nope:key');
    expect(hasKey('common:disclaimer.short')).toBe(true);
    expect(hasKey('common:missing')).toBe(false);
  });

  it('deterministic plurals (no Intl.PluralRules)', () => {
    expect(pluralCategory(1)).toBe('one');
    expect(pluralCategory(0)).toBe('other');
    expect(pluralCategory(2)).toBe('other');
    expect(pluralCategory(1_000_000)).toBe('other');
    expect(translate('es', pluralKey('common:unit.month', 1), { n: 1 })).toBe('1 mes');
    expect(translate('es', pluralKey('common:unit.month', 19), { n: 19 })).toBe('19 meses');
    expect(translate('en', pluralKey('common:unit.day', 306), { n: createFmt('en').int(306) })).toBe('306 days');
  });

  it('splitKey and the i18next options', () => {
    expect(splitKey('common:disclaimer.full')).toEqual({ ns: 'common', key: 'disclaimer.full' });
    expect(splitKey('disclaimer.full')).toBeNull();
    expect(splitKey('common:')).toBeNull();
    expect(I18NEXT_FORMAT_OPTIONS).toEqual({
      nsSeparator: ':', keySeparator: false, interpolation: { prefix: '{', suffix: '}', escapeValue: false },
    });
  });

  it('key types', () => {
    const k: I18nKey = 'case:anything';
    const known: KnownI18nKey = 'common:disclaimer.full';
    const ck: CommonKey = 'term.caa';
    // @ts-expect-error — not a key of common.json
    const bad: CommonKey = 'term.nope';
    expect([k, known, ck, bad]).toHaveLength(4);
  });
});
