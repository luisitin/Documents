/**
 * 07 WP8b / I18N-3: every key the case screens build dynamically exists in BOTH languages of the
 * WP8b namespaces (case, estimate, peers, ead, remedies). `t()` returns the key itself when a key
 * is missing, so this test is what keeps a typo from showing raw keys to a user. It also pins the
 * case-rules `REMEDY_KEYS` contract (WP3 → WP8b).
 */
import { REMEDY_KEYS } from '@caa/case-rules';
import { hasKey, resources } from '@caa/i18n-core';
import { BASIC_DOCS, CHANNEL_OPTIONS, FORM_MILESTONES, HARDSHIPS, META_DATE, NICKNAMES, OUTCOMES } from '@/features/case';

const RUNGS = ['a_i485', 'a_c9', 'b', 'd', 'c', 'e', 'f', 'denial'] as const;
const STATES = ['available', 'not_yet', 'depends', 'not_applicable'] as const;

describe('WP8b locale keys', () => {
  it('REMEDY_KEYS (case-rules contract) and every rung title / steps / state key exist in es and en', () => {
    for (const k of REMEDY_KEYS) expect([k, hasKey(k)]).toEqual([k, true]);
    for (const r of RUNGS) {
      expect(hasKey(`remedies:${r}.title`)).toBe(true);
      expect(hasKey(`remedies:${r}.steps`)).toBe(true);
    }
    for (const s of STATES) {
      expect(hasKey(`remedies:state.${s}`)).toBe(true);
      expect(hasKey(`ead:pending.state.${s}`)).toBe(true);
    }
  });

  it('form option keys: channels, milestones, meta dates, outcomes, hardship, documents, nicknames, sources', () => {
    const keys = [
      ...CHANNEL_OPTIONS.map((c) => `case:channel.${c}`),
      ...FORM_MILESTONES.map((m) => `case:milestone.${m}`),
      ...Object.values(META_DATE).map((m) => `case:milestone.${m}`),
      ...Object.values(OUTCOMES).flat().map((o) => `case:outcome.${o}`),
      ...['approved', 'denied', 'withdrawn', 'admin_closed', 'unknown'].map((o) => `case:outcome.${o}`),
      ...HARDSHIPS.map((h) => `case:hardship.${h}`),
      ...BASIC_DOCS.map((d) => `case:docs.${d}`),
      ...NICKNAMES.map((n) => `case:nickname.${n}`),
      ...['notice', 'online_status', 'memory'].map((s) => `case:source.${s}`),
      ...['low', 'medium', 'medium_high', 'high'].map((l) => `peers:confidence.${l}`),
      ...['copied', 'copyFailed', 'shareFailed'].map((s) => `case:share.${s}`),
    ];
    for (const k of keys) expect([k, hasKey(k)]).toEqual([k, true]);
  });

  it('es and en have the same keys and the same placeholders in every WP8b namespace', () => {
    for (const ns of ['case', 'estimate', 'peers', 'ead', 'remedies'] as const) {
      const es = resources.es[ns];
      const en = resources.en[ns];
      expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
      for (const k of Object.keys(es)) {
        const vars = (s: string) => (s.match(/\{[A-Za-z_][A-Za-z0-9_]*\}/g) ?? []).sort();
        expect([ns, k, vars(es[k] as string)]).toEqual([ns, k, vars(en[k] as string)]);
      }
    }
  });
});
