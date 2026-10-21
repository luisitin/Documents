/**
 * `DateField { label; value; granularity; min?; max?; onChange(v, g) }` (07 §6.0; 00 S2 step 2).
 *
 * Three in-app selects (year, month, day) instead of a native date picker: no extra native module,
 * identical on iOS, Android and the artifact, and month names come from the locale files, so they
 * switch with the language (owner requirement 1). "Solo sé el mes" switches to month granularity
 * and records day 15 (00 S2: "'Solo sé el mes' allowed, which records day = 15 and
 * granularity: 'month'"). Dates are plain ISO strings; no `Date` parsing, no timezone (02 §1).
 * Range errors (e.g. "no future dates", 00 S2) are shown inline; the value is still reported so
 * the form can decide whether to block or warn.
 */
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { ISODate } from '@caa/data-schemas';
import { monthNames } from '@caa/i18n-core';
import { useLang } from '../deps';
import { Icon } from '../icons';
import { MIN_TOUCH, useTheme } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { FormField } from './FormField';
import { Select } from './Select';

export interface DateFieldProps {
  label: string;
  value: ISODate | null;
  granularity: 'day' | 'month';
  min?: ISODate;
  max?: ISODate;
  onChange(v: ISODate | null, g: 'day' | 'month'): void;
  help?: string;
  testID?: string;
}

/** Day 15 stands for "only the month is known" (00 S2). */
export const MONTH_ONLY_DAY = 15;

const pad = (n: number) => String(n).padStart(2, '0');

/** Days in a Gregorian month (pure; no Date). */
export function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

interface Parts {
  y: number | null;
  m: number | null;
  d: number | null;
}

/** Splits an ISO date into numeric parts (null parts when absent or malformed). */
export function splitIso(v: ISODate | null): Parts {
  const match = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  if (!match) return { y: null, m: null, d: null };
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Builds the ISO value from parts, or null while incomplete. Month granularity → day 15. */
export function composeIso(p: Parts, g: 'day' | 'month'): ISODate | null {
  if (p.y === null || p.m === null) return null;
  if (g === 'month') return `${p.y}-${pad(p.m)}-${pad(MONTH_ONLY_DAY)}`;
  if (p.d === null) return null;
  const d = Math.min(p.d, daysInMonth(p.y, p.m));
  return `${p.y}-${pad(p.m)}-${pad(d)}`;
}

/** 'min' | 'max' when `v` falls outside the bounds (ISO strings compare lexicographically). */
export function rangeError(v: ISODate | null, g: 'day' | 'month', min?: ISODate, max?: ISODate): 'min' | 'max' | null {
  if (!v) return null;
  // With month granularity only the month is compared (the 15th is a placeholder, not a fact).
  const cmp = g === 'month' ? (s: string) => s.slice(0, 7) : (s: string) => s;
  if (min && cmp(v) < cmp(min)) return 'min';
  if (max && cmp(v) > cmp(max)) return 'max';
  return null;
}

function currentYear(): number {
  try {
    return new Date().getUTCFullYear();
  } catch {
    return 2026;
  }
}

export function DateField({ label, value, granularity, min, max, onChange, help, testID }: DateFieldProps) {
  const theme = useTheme();
  const { t, lang, fmt } = useLang();
  const [parts, setParts] = useState<Parts>(() => splitIso(value));
  const [seen, setSeen] = useState<ISODate | null>(value);
  if (seen !== value) {
    // The parent changed the value: adopt it during render (no effect), but keep a partially
    // entered date while the parent still reports null.
    setSeen(value);
    if (value !== null || composeIso(parts, granularity) !== null) setParts(splitIso(value));
  }

  const id = testID ?? 'date';
  const maxYear = max ? Number(max.slice(0, 4)) : currentYear() + 1;
  const minYear = min ? Number(min.slice(0, 4)) : maxYear - 15;
  const months = monthNames(lang);

  const yearOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let y = maxYear; y >= minYear; y--) out.push({ value: String(y), label: String(y) });
    return out;
  }, [maxYear, minYear]);
  const monthOptions = useMemo(() => months.map((name, i) => ({ value: pad(i + 1), label: name })), [months]);
  const dayCount = parts.y !== null && parts.m !== null ? daysInMonth(parts.y, parts.m) : 31;
  const dayOptions = useMemo(() => Array.from({ length: dayCount }, (_, i) => ({ value: pad(i + 1), label: String(i + 1) })), [dayCount]);

  const emit = (p: Parts, g: 'day' | 'month') => {
    setParts(p);
    onChange(composeIso(p, g), g);
  };

  const err = rangeError(value, granularity, min, max);
  const error =
    err === 'min' && min ? t('ui:date.errorMin', { date: granularity === 'month' ? fmt.month(min) : fmt.date(min) })
      : err === 'max' && max ? t('ui:date.errorMax', { date: granularity === 'month' ? fmt.month(max) : fmt.date(max) })
        : undefined;
  const monthOnly = granularity === 'month';
  const toggleLabel = t('ui:date.onlyMonth');

  return (
    <FormField label={label} help={help} error={error} testID={id}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        <View style={{ flexGrow: 1, flexBasis: 110 }}>
          <Select
            testID={`${id}-month`}
            label={t('ui:date.month')}
            value={parts.m === null ? null : pad(parts.m)}
            options={monthOptions}
            onChange={(v) => emit({ ...parts, m: Number(v) }, granularity)}
          />
        </View>
        {monthOnly ? null : (
          <View style={{ flexGrow: 1, flexBasis: 80 }}>
            <Select
              testID={`${id}-day`}
              label={t('ui:date.day')}
              value={parts.d === null ? null : pad(parts.d)}
              options={dayOptions}
              onChange={(v) => emit({ ...parts, d: Number(v) }, granularity)}
            />
          </View>
        )}
        <View style={{ flexGrow: 1, flexBasis: 90 }}>
          <Select
            testID={`${id}-year`}
            label={t('ui:date.year')}
            value={parts.y === null ? null : String(parts.y)}
            options={yearOptions}
            onChange={(v) => emit({ ...parts, y: Number(v) }, granularity)}
          />
        </View>
      </View>
      <Pressable
        testID={`${id}-only-month`}
        accessibilityRole="checkbox"
        accessibilityLabel={toggleLabel}
        accessibilityState={{ checked: monthOnly }}
        onPress={() => emit(parts, monthOnly ? 'day' : 'month')}
        style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: theme.space(2), alignSelf: 'flex-start' }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: monthOnly ? theme.colors.accent : theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {monthOnly ? <Icon name="check" size={18} color={theme.colors.accent} /> : null}
        </View>
        <AppText>{toggleLabel}</AppText>
      </Pressable>
      {value ? <Button testID={`${id}-clear`} variant="link" label={t('ui:date.clear')} onPress={() => emit({ y: null, m: null, d: null }, granularity)} /> : null}
    </FormField>
  );
}
