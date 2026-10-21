/**
 * Label keys for alert enums (02 §2.6 `Alert.kind`/`severity`, §2.5 `EntryChannel`). Severity maps
 * to a tone that is never red: red is only for deadlines (00 §3 principle 8).
 */
import type { Alert, EntryChannel } from '@caa/data-schemas';
import type { Tone } from '@/ui';

export const SEVERITY_TONE: Record<Alert['severity'], Tone> = { high: 'warning', medium: 'info', info: 'neutral' };

export const SEVERITY_KEY = {
  high: 'alerts:severity.high',
  medium: 'alerts:severity.medium',
  info: 'alerts:severity.info',
} as const satisfies Record<Alert['severity'], `alerts:${string}`>;

export const KIND_KEY = {
  policy: 'alerts:kind.policy',
  court: 'alerts:kind.court',
  data: 'alerts:kind.data',
  fees: 'alerts:kind.fees',
  enforcement: 'alerts:kind.enforcement',
  ead: 'alerts:kind.ead',
  scam: 'alerts:kind.scam',
  i220a: 'alerts:kind.i220a',
} as const satisfies Record<Alert['kind'], `alerts:${string}`>;

export const CHANNEL_KEY = {
  ALL_CUBAN: 'alerts:channel.ALL_CUBAN',
  CHNV: 'alerts:channel.CHNV',
  CBP_ONE: 'alerts:channel.CBP_ONE',
  FRP_CFRP: 'alerts:channel.FRP_CFRP',
  U4U: 'alerts:channel.U4U',
  OTHER_PAROLE: 'alerts:channel.OTHER_PAROLE',
  VISA: 'alerts:channel.VISA',
  I220A: 'alerts:channel.I220A',
  EWI: 'alerts:channel.EWI',
  CONDITIONAL_PAROLE_236: 'alerts:channel.CONDITIONAL_PAROLE_236',
  UNKNOWN: 'alerts:channel.UNKNOWN',
} as const satisfies Record<EntryChannel | 'ALL_CUBAN', `alerts:${string}`>;

export const EVIDENCE_KEY = {
  F: 'more:evidence.F',
  S: 'more:evidence.S',
  'S-sec': 'more:evidence.S-sec',
  T: 'more:evidence.T',
  I: 'more:evidence.I',
  U: 'more:evidence.U',
  V: 'more:evidence.V',
} as const;
