/**
 * DateField regressions (review round 1):
 * - without `max`, the year list must reach real EAD card expiry dates (a 5-year (c)(9) card
 *   issued 2025-09-15 expires 2030-09-14; 00 S5: the card date always wins);
 * - `allowMonthOnly={false}` hides "Solo sé el mes", so callers that fix granularity="day" can
 *   never have the real day silently replaced by 15.
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as deps from '@/ui/deps';
import { DateField, FUTURE_YEARS } from '@/ui';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must be synchronous
jest.mock('@/ui/deps', () => require('../../__mocks__/deps'));
const fake = (deps as unknown as { __fake: typeof import('../../__mocks__/deps').__fake }).__fake;

beforeEach(async () => {
  await act(async () => {
    fake.reset();
  });
});

describe('DateField', () => {
  it('offers a card expiry year five years ahead when no max is given', async () => {
    const onChange = jest.fn();
    await render(<DateField testID="exp" label="Vence la tarjeta" value="2030-09-14" granularity="day" min="2015-01-01" onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('exp-year'));
    const last = new Date().getUTCFullYear() + FUTURE_YEARS;
    expect(last).toBeGreaterThanOrEqual(2030);
    expect(screen.getByTestId('exp-year-option-2030')).toBeTruthy();
    expect(screen.getByTestId(`exp-year-option-${last}`)).toBeTruthy();
    expect(screen.queryByTestId(`exp-year-option-${last + 1}`)).toBeNull();
    await fireEvent.press(screen.getByTestId('exp-year-option-2030'));
    expect(onChange).toHaveBeenLastCalledWith('2030-09-14', 'day');
  });

  it('keeps an explicit max as the last year', async () => {
    await render(<DateField testID="rc" label="Recibo" value={null} granularity="day" max="2026-10-20" onChange={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('rc-year'));
    expect(screen.getByTestId('rc-year-option-2026')).toBeTruthy();
    expect(screen.queryByTestId('rc-year-option-2027')).toBeNull();
  });

  it('hides "Solo sé el mes" when allowMonthOnly is false, so the day cannot become 15', async () => {
    const onChange = jest.fn();
    await render(
      <DateField testID="pd" label="Fecha del parole" value="2023-04-03" granularity="day" max="2026-10-20" allowMonthOnly={false} onChange={onChange} />,
    );
    expect(screen.queryByTestId('pd-only-month')).toBeNull();
    expect(screen.getByTestId('pd-day')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('pd-month'));
    await fireEvent.press(screen.getByTestId('pd-month-option-05'));
    expect(onChange).toHaveBeenLastCalledWith('2023-05-03', 'day');
    expect(onChange).not.toHaveBeenCalledWith(expect.anything(), 'month');
  });

  it('still shows the toggle by default and for a stored month-only value', async () => {
    const r = await render(<DateField testID="a" label="A" value="2025-03-15" granularity="day" onChange={jest.fn()} />);
    expect(screen.getByTestId('a-only-month')).toBeTruthy();
    await r.rerender(<DateField testID="a" label="A" value="2025-03-15" granularity="month" allowMonthOnly={false} onChange={jest.fn()} />);
    expect(screen.getByTestId('a-only-month')).toBeTruthy();
  });
});
