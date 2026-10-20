/**
 * Peer reasons (U2, 04 §9.2; 00 S4), EAD status (00 S5; key facts §2 row 4) and the approval card
 * (00 S3 item 12; key facts §3, §7). Today = 2026-10-20.
 */
import { describe, expect, it } from 'vitest';
import { approvalCard, deriveFlags, eadExpirySource, eadStatus, peerReasons } from '@caa/case-rules';
import { TODAY, ms, national, offices, policy, quarterly, t15, variant } from './helpers';

const peers = (c: ReturnType<typeof t15>) => peerReasons(c, deriveFlags(c, policy, TODAY), offices, TODAY);

describe('peerReasons — exactly U2', () => {
  it('T15 → {chnv_r1, ead_before_r3, non_fifo}', () => {
    expect(peers(t15())).toEqual(['chnv_r1', 'ead_before_r3', 'non_fifo']);
  });
  it('CBP One twin → {cbp_one_no_r1, ead_before_r3, non_fifo}', () => {
    expect(peers(variant({ entryChannel: 'CBP_ONE' }))).toEqual(['cbp_one_no_r1', 'ead_before_r3', 'non_fifo']);
  });
  it('no-EAD twin (T23) → {chnv_r1, ead_swept_r3, c9_erequest_available, non_fifo}', () => {
    expect(peers(variant({}, { drop: ['ead_c9'] }))).toEqual(['chnv_r1', 'ead_swept_r3', 'c9_erequest_available', 'non_fifo']);
  });
  it('+ office_diff iff the office is known', () => {
    expect(peers(variant({ officeCode: 'HIA', state: 'FL' }))).toEqual(['chnv_r1', 'ead_before_r3', 'non_fifo', 'office_diff']);
    expect(peers(variant({ state: 'FL' }))).toEqual(['chnv_r1', 'ead_before_r3', 'non_fifo']);
    expect(peers(variant({ entryChannel: 'CBP_ONE', officeCode: 'MIA' }))).toEqual(['cbp_one_no_r1', 'ead_before_r3', 'non_fifo', 'office_diff']);
    expect(peers(variant({ officeCode: 'MIA' }, { drop: ['ead_c9'] }))).toEqual(['chnv_r1', 'ead_swept_r3', 'c9_erequest_available', 'non_fifo', 'office_diff']);
  });
  it('renewal filed on/after 2025-10-30 → renewal_no_autoext', () => {
    expect(peers(variant({}, { add: [ms('ead_renewal_filed', '2025-10-30')] }))).toContain('renewal_no_autoext');
    expect(peers(variant({}, { add: [ms('ead_renewal_filed', '2025-10-29')] }))).not.toContain('renewal_no_autoext');
  });
  it('no non_fifo without an estimate (I-220A); no R1 reason for VISA or a filing after R1', () => {
    expect(peers(variant({ entryChannel: 'I220A' }))).not.toContain('non_fifo');
    expect(peers(variant({ entryChannel: 'VISA' }))).toEqual(['ead_before_r3', 'non_fifo']);
    const late = variant({ i485ReceiptDate: '2025-07-01' }, { drop: ['biometrics', 'ead_c9'] });
    expect(peers(late)).toEqual(['ead_swept_r3', 'non_fifo']); // 2025-07-01 is after the NBC 147-C9 date 2025-06-13
  });
  it('an EAD issued on/after 2025-12-02 is not ead_before_r3', () => {
    expect(peers(variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2026-07-01')] }))).toEqual(['chnv_r1', 'non_fifo']);
  });
});

describe('eadStatus', () => {
  it('issued 2025-09-15 → 5y; expiry 2030-09-14; renew by −180 days; reminders −180/−90/−30', () => {
    const c = variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2025-09-15')] });
    const s = eadStatus(c, policy, TODAY);
    expect(s.validityRule).toBe('5y');
    expect(s.expiry).toBe('2030-09-14');
    expect(s.renewBy).toBe('2030-03-18');
    expect(s.reminders).toEqual(['2030-03-18', '2030-06-16', '2030-08-15']);
    expect(s.autoExtension).toBe(false);
    expect(eadExpirySource(c, policy)).toBe('estimated');
  });

  it('issued 2025-12-05 → 18m (2027-06-04); 2025-12-04 → 5y', () => {
    const s = eadStatus(variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2025-12-05')] }), policy, TODAY);
    expect(s.validityRule).toBe('18m');
    expect(s.expiry).toBe('2027-06-04');
    expect(s.reminders).toEqual(['2026-12-06', '2027-03-06', '2027-05-05']);
    expect(eadStatus(variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2025-12-04')] }), policy, TODAY).validityRule).toBe('5y');
  });

  it('the card expiry the user enters wins', () => {
    const c = variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2025-09-15', { cardExpiry: '2030-09-14' })] });
    expect(eadStatus(c, policy, TODAY).expiry).toBe('2030-09-14');
    const typed = variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2026-01-10', { cardExpiry: '2027-07-09' })] });
    expect(eadStatus(typed, policy, TODAY)).toMatchObject({ validityRule: '18m', expiry: '2027-07-09', renewBy: '2027-01-10' });
    expect(eadExpirySource(typed, policy)).toBe('card');
  });

  it('renewal filed 2025-10-30 → autoExtension false; filed 2025-10-29 → true', () => {
    expect(eadStatus(variant({}, { add: [ms('ead_renewal_filed', '2025-10-30')] }), policy, TODAY).autoExtension).toBe(false);
    expect(eadStatus(variant({}, { add: [ms('ead_renewal_filed', '2025-10-29')] }), policy, TODAY).autoExtension).toBe(true);
  });

  it('past reminders are dropped; no EAD → unknown with no reminders', () => {
    const s = eadStatus(variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2025-12-10')] }), policy, '2027-04-01');
    expect(s.expiry).toBe('2027-06-09');
    expect(s.reminders).toEqual(['2027-05-10']);
    expect(eadStatus(variant({}, { drop: ['ead_c9'] }), policy, TODAY)).toEqual({ validityRule: 'unknown', autoExtension: false, reminders: [] });
  });

  it('month granularity: T15 (2025-09) → 5y with the earliest possible expiry; 2025-12 is ambiguous', () => {
    const s = eadStatus(t15(), policy, TODAY);
    expect(s.validityRule).toBe('5y');
    expect(s.expiry).toBe('2030-08-31');
    expect(eadStatus(variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', '2025-12-15', undefined, 'month')] }), policy, TODAY).validityRule).toBe('unknown');
    expect(eadStatus(variant({}, { drop: ['ead_c9'], add: [ms('ead_c9', null)] }), policy, TODAY).validityRule).toBe('unknown');
  });
});

describe('approvalCard', () => {
  const all = { paroleRecord: true, nationalityProof: true, i693: true, photos: true, feeOrWaiver: true };

  it('population shares 308/626 (Jul 2026) and 386/820 (Aug 2026); baselines 91.7 / 52.6 / 23.7 / 83', () => {
    const card = approvalCard(t15(), quarterly, national, policy);
    expect(card.populationShares.map((s) => [s.period, s.numerator, s.denominator])).toEqual([['2026-07', 308, 626], ['2026-08', 386, 820]]);
    expect(card.populationShares[0]!.label).toEqual({ es: 'julio de 2026', en: 'July 2026' });
    expect(card.populationShares.map((s) => Math.round(s.share * 100))).toEqual([49, 47]);
    expect(card.baselines.map((b) => Math.round(b.share * 1000) / 10)).toEqual([91.7, 52.6, 23.7, 83.2]);
    expect(Math.round(card.baselines[3]!.share * 100)).toBe(83);
    expect(card.unmodelledFactors.length).toBeGreaterThanOrEqual(5);
  });

  it('cleanRange is null unless every basic document is true', () => {
    expect(approvalCard(t15(), quarterly, national, policy).cleanRange).toBeNull();
    expect(approvalCard(variant({ basicDocs: { ...all, photos: null } }), quarterly, national, policy).cleanRange).toBeNull();
    expect(approvalCard(variant({ basicDocs: { ...all, i693: false } }), quarterly, national, policy).cleanRange).toBeNull();
    expect(approvalCard(variant({ basicDocs: all }), quarterly, national, policy).cleanRange).toEqual([0.7, 0.9]);
  });

  it('never a clean range for a channel the gate excludes', () => {
    expect(approvalCard(variant({ entryChannel: 'I220A', basicDocs: all }), quarterly, national, policy).cleanRange).toBeNull();
  });
});
