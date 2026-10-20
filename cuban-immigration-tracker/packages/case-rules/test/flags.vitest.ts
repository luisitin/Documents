/**
 * Gate and flag tests (07 WP3 acceptance "Gate tests"; 02-data-model.md §3; key facts §1;
 * doc 16 §4.3, §8.1, §8.4). Today = 2026-10-20.
 */
import { describe, expect, it } from 'vitest';
import { basicDocsComplete, deriveFlags } from '@caa/case-rules';
import { TODAY, curatedPolicy, ms, policy, t15, variant } from './helpers';

describe('eligibility gate (02 §3)', () => {
  it.each([
    ['I220A', 'i220a'],
    ['EWI', 'ewi'],
    ['CONDITIONAL_PAROLE_236', 'conditional_parole_236'],
  ] as const)('%s → noEstimateReason %s', (ch, reason) => {
    const f = deriveFlags(variant({ entryChannel: ch }), policy, TODAY);
    expect(f.noEstimateReason).toBe(reason);
    expect(f.isParoleBased).toBe(false);
    expect(f.admittedOrParoled).toBe(false);
  });

  it('VISA is eligible: admittedOrParoled, no reason, not parole-based', () => {
    const f = deriveFlags(variant({ entryChannel: 'VISA' }), policy, TODAY);
    expect(f.noEstimateReason).toBeNull();
    expect(f.admittedOrParoled).toBe(true);
    expect(f.isParoleBased).toBe(false);
    expect(f.r1HoldApplies).toBe(false);
  });

  it('UNKNOWN gets an estimate (both clocks are shown by clockFor)', () => {
    const f = deriveFlags(variant({ entryChannel: 'UNKNOWN' }), policy, TODAY);
    expect(f.noEstimateReason).toBeNull();
    expect(f.r1HoldApplies).toBe('unknown_channel');
  });

  it.each(['CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE'] as const)('%s is parole-based and eligible', (ch) => {
    const f = deriveFlags(variant({ entryChannel: ch }), policy, TODAY);
    expect(f.isParoleBased).toBe(true);
    expect(f.admittedOrParoled).toBe(true);
    expect(f.noEstimateReason).toBeNull();
  });

  it('a decision milestone → decided (takes precedence over the channel gate, 04 §4)', () => {
    expect(deriveFlags(variant({}, { add: [ms('decision', '2026-09-10', { outcome: 'approved' })] }), policy, TODAY).noEstimateReason).toBe('decided');
    expect(deriveFlags(variant({ entryChannel: 'I220A' }, { add: [ms('decision', '2026-09-10', { outcome: 'denied' })] }), policy, TODAY).noEstimateReason).toBe('decided');
  });
});

describe('R1 scope from the curated regimes (doc 16 §3)', () => {
  it.each([
    ['CHNV', true], ['FRP_CFRP', true], ['U4U', true], ['CBP_ONE', 'low_confidence'], ['VISA', false], ['OTHER_PAROLE', false], ['I220A', false],
  ] as const)('%s → r1HoldApplies %s', (ch, v) => {
    expect(deriveFlags(variant({ entryChannel: ch }), policy, TODAY).r1HoldApplies).toBe(v);
    expect(deriveFlags(variant({ entryChannel: ch }), curatedPolicy, TODAY).r1HoldApplies).toBe(v);
  });
});

describe('class and warning flags', () => {
  it('T15 reference case', () => {
    const f = deriveFlags(t15(), policy, TODAY);
    expect(f).toEqual({
      isParoleBased: true, admittedOrParoled: true, noEstimateReason: null, r1HoldApplies: true, frpI485Carveout: false,
      redEagleAppearsInClass: true, doeDhsAppearsInClass: false, expeditedRemovalWarning: false, reTerminationDateSuspicious: false,
      oneYearWarning: false, basicDocsComplete: null, filedAfterRedEagle: false,
    });
  });

  it('re-termination I-94 end date 2026-04-24 → reTerminationDateSuspicious (doc 16 §8.1)', () => {
    const f = deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleEndDateOriginal: '2026-04-24' }), policy, TODAY);
    expect(f.reTerminationDateSuspicious).toBe(true);
    expect(f.expeditedRemovalWarning).toBe(true); // end date before today (doc 16 §8.4)
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleEndDateOriginal: '2026-05-24' }), policy, TODAY).reTerminationDateSuspicious).toBe(false);
  });

  it('receipt after 2026-08-24 → filedAfterRedEagle and not in the Red Eagle class (T25)', () => {
    const c = variant({ i485ReceiptDate: '2026-09-01' }, { drop: ['biometrics', 'ead_c9'] });
    const f = deriveFlags(c, policy, TODAY);
    expect(f.filedAfterRedEagle).toBe(true);
    expect(f.redEagleAppearsInClass).toBe(false);
    const onTheDay = deriveFlags(variant({ i485ReceiptDate: '2026-08-24' }, { drop: ['biometrics', 'ead_c9'] }), policy, TODAY);
    expect(onTheDay.filedAfterRedEagle).toBe(false);
    expect(onTheDay.redEagleAppearsInClass).toBe(true);
  });

  it('Red Eagle: decided on/before 2026-08-24 is outside the class; any channel can be inside', () => {
    expect(deriveFlags(variant({}, { add: [ms('decision', '2026-08-20', { outcome: 'denied' })] }), policy, TODAY).redEagleAppearsInClass).toBe(false);
    expect(deriveFlags(variant({}, { add: [ms('decision', '2026-09-20', { outcome: 'approved' })] }), policy, TODAY).redEagleAppearsInClass).toBe(true);
    expect(deriveFlags(variant({ entryChannel: 'I220A' }), policy, TODAY).redEagleAppearsInClass).toBe(true);
    expect(deriveFlags(t15(), policy, '2026-08-23').redEagleAppearsInClass).toBe(false); // class not yet certified
  });

  it('FRP carve-out: FRP_CFRP with I-485 filed on/before 2025-12-15 (90 FR 58032)', () => {
    expect(deriveFlags(variant({ entryChannel: 'FRP_CFRP' }), policy, TODAY).frpI485Carveout).toBe(true);
    expect(deriveFlags(variant({ entryChannel: 'FRP_CFRP', i485ReceiptDate: '2025-12-15' }, { drop: ['biometrics', 'ead_c9'] }), policy, TODAY).frpI485Carveout).toBe(true);
    expect(deriveFlags(variant({ entryChannel: 'FRP_CFRP', i485ReceiptDate: '2025-12-16' }, { drop: ['biometrics', 'ead_c9'] }), policy, TODAY).frpI485Carveout).toBe(false);
    expect(deriveFlags(variant({ entryChannel: 'CHNV' }), policy, TODAY).frpI485Carveout).toBe(false);
  });

  it('Doe v. DHS class: CBP One, parole 2023-05-15 → 2025-01-19, April 2025 e-mail (doc 16 §4.3)', () => {
    const email = ms('parole_termination_notice', '2025-04-08', { terminationNotice: 'EMAIL_APR_2025' });
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleDate: '2024-02-01' }, { add: [email] }), policy, TODAY).doeDhsAppearsInClass).toBe(true);
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleDate: '2024-02-01' }), policy, TODAY).doeDhsAppearsInClass).toBe('unknown');
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE' }), policy, TODAY).doeDhsAppearsInClass).toBe('unknown');
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleDate: '2023-03-01' }, { add: [email] }), policy, TODAY).doeDhsAppearsInClass).toBe(false);
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleDate: '2023-05-15' }, { add: [email] }), policy, TODAY).doeDhsAppearsInClass).toBe('unknown');
    expect(deriveFlags(variant({ entryChannel: 'CHNV', paroleDate: '2024-02-01' }, { add: [email] }), policy, TODAY).doeDhsAppearsInClass).toBe(false);
  });

  it('expedited-removal warning: termination notice or original end date passed; not after approval', () => {
    const notice = ms('parole_termination_notice', '2025-06-12', { terminationNotice: 'CHNV_JUN_2025' });
    expect(deriveFlags(variant({}, { add: [notice] }), policy, TODAY).expeditedRemovalWarning).toBe(true);
    expect(deriveFlags(variant({ paroleEndDateOriginal: '2027-01-01' }), policy, TODAY).expeditedRemovalWarning).toBe(false);
    expect(deriveFlags(variant({ entryChannel: 'VISA' }, { add: [notice] }), policy, TODAY).expeditedRemovalWarning).toBe(false);
    expect(deriveFlags(variant({}, { add: [notice, ms('decision', '2026-09-01', { outcome: 'approved' })] }), policy, TODAY).expeditedRemovalWarning).toBe(false);
  });

  it('one-year warning: receipt before parole + 366 days ("un año y un día")', () => {
    expect(deriveFlags(variant({ entryChannel: 'CBP_ONE', paroleDate: '2024-02-01', i485ReceiptDate: '2025-02-05' }), policy, TODAY).oneYearWarning).toBe(false); // T22
    expect(deriveFlags(variant({ paroleDate: '2024-03-20' }), policy, TODAY).oneYearWarning).toBe(true); // 2025-03-15 < 2025-03-21
    expect(deriveFlags(variant({ paroleDate: '2024-03-14' }), policy, TODAY).oneYearWarning).toBe(false); // +366 = 2025-03-15
  });

  it('basic documents: true only when all five are true; false if any is false; else null', () => {
    const all = { paroleRecord: true, nationalityProof: true, i693: true, photos: true, feeOrWaiver: true };
    expect(basicDocsComplete(variant({ basicDocs: all }))).toBe(true);
    expect(basicDocsComplete(variant({ basicDocs: { ...all, i693: false } }))).toBe(false);
    expect(basicDocsComplete(variant({ basicDocs: { ...all, photos: null } }))).toBeNull();
    expect(deriveFlags(variant({ basicDocs: all }), policy, TODAY).basicDocsComplete).toBe(true);
  });

  it('is deterministic and does not mutate the case', () => {
    const c = t15();
    const before = JSON.stringify(c);
    expect(JSON.stringify(deriveFlags(c, policy, TODAY))).toBe(JSON.stringify(deriveFlags(c, policy, TODAY)));
    expect(JSON.stringify(c)).toBe(before);
  });
});
