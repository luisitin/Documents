/**
 * Regression (review round 1, more:privacy.stored.receipt): the Privacy screen once said the full
 * receipt number "is kept on the device and shown masked". The app cannot store it
 * (CaseTimelineSchema keeps only `receiptPrefix` ^[A-Z]{3}$ and strips `receiptFullLocal`), and the
 * form field is a picker, so the copy must say only the 3 letters are kept and must not ask the
 * user to type anything.
 */
import { describe, expect, it } from 'vitest';
import { LANGS, resources } from '@caa/i18n-core';

const privacyEntries = (lang: (typeof LANGS)[number]) =>
  Object.entries(resources[lang].more).filter(([k]) => k.startsWith('privacy.'));

describe('Privacy screen copy never claims a full receipt number is stored', () => {
  it.each(LANGS)('%s: no privacy.* string mentions a full / complete receipt number', (lang) => {
    for (const [key, value] of privacyEntries(lang)) {
      expect({ key, value }).not.toEqual({ key, value: expect.stringMatching(/completo|full receipt|masked|oculto/i) });
    }
  });

  it('privacy.stored.receipt says only the 3 letters are kept and the digits never are', () => {
    expect(resources.es.more['privacy.stored.receipt']).toMatch(/3 letras/);
    expect(resources.es.more['privacy.stored.receipt']).toMatch(/Nunca guardamos los números del recibo/);
    expect(resources.en.more['privacy.stored.receipt']).toMatch(/3 letters/);
    expect(resources.en.more['privacy.stored.receipt']).toMatch(/never store the receipt digits/);
  });

  it('privacy.tips.prefix matches the picker (choose, not type)', () => {
    expect(resources.es.more['privacy.tips.prefix']).not.toMatch(/escrib/i);
    expect(resources.en.more['privacy.tips.prefix']).not.toMatch(/\btyp/i);
  });

  it.each(LANGS)('%s: any string anywhere that mentions a full receipt number is a negative ("never ask")', (lang) => {
    for (const [ns, table] of Object.entries(resources[lang])) {
      for (const [key, value] of Object.entries(table)) {
        if (/recibo completo|full receipt/i.test(value)) {
          expect({ key: `${ns}:${key}`, negative: /\b(no pedimos|nunca|never)\b/i.test(value) }).toEqual({ key: `${ns}:${key}`, negative: true });
        }
      }
    }
  });
});
