/**
 * 07 WP2 acceptance: the reference case with bands plus the FL state mixture runs in under 150 ms
 * in Node (02 §4: "< 150 ms on device"). The measured times are printed in the test output.
 */
import { describe, expect, it } from 'vitest';
import { estimate, referenceCase } from '@caa/estimator';
import { goldenSnapshot, inputFor, ok } from './helpers';

describe('performance', () => {
  it('T15 with bands + T15 with the FL state mixture (FL-4) < 150 ms each, first call (cold)', () => {
    const snap = goldenSnapshot();
    const t0 = performance.now();
    const national = ok(estimate(inputFor(referenceCase(), snap, '2026-10-20', { opts: { bands: true } })));
    const t1 = performance.now();
    const fl = ok(estimate(inputFor({ ...referenceCase(), state: 'FL' }, snap, '2026-10-20', { opts: { bands: true } })));
    const t2 = performance.now();
    const warm: number[] = [];
    for (let i = 0; i < 5; i++) {
      const a = performance.now();
      estimate(inputFor({ ...referenceCase(), state: 'FL' }, snap, '2026-10-20'));
      warm.push(performance.now() - a);
    }
    warm.sort((a, b) => a - b);
    const line = `[perf] VPH-1.1 estimate(): T15 national + bands ${(t1 - t0).toFixed(1)} ms (cold); T15 + FL state mixture + bands ${(t2 - t1).toFixed(1)} ms (cold); FL warm median ${warm[2]!.toFixed(1)} ms`;
    console.log(line);
    process.stderr.write(`${line}\n`); // shown even when vitest hides passing-test console output
    expect(national.office.basis).toBe('national');
    expect(fl.office.basis).toBe('state_mixture');
    expect(t1 - t0).toBeLessThan(150);
    expect(t2 - t1).toBeLessThan(150);
    expect(warm[2]!).toBeLessThan(150);
  });
});
