/**
 * Merged locale resources (07 §6.0 `resources`; ADR I18N-3).
 *
 * Each namespace is one flat JSON object per language under `locales/{es,en}/<namespace>.json`.
 * JSON modules work the same in Metro, Jest (jest-expo), Vitest, esbuild and `tsc`, so the app
 * bundle, the tests and the tools share one copy of the strings.
 *
 * The files are loaded with static, literal `require` calls (no `require.context`, no `fs`), so the
 * package stays pure (ARCH-1) and Metro inlines them into the single web bundle (ARCH-4).
 */
import type { Lang } from '@caa/data-schemas';
import type { Namespace } from './keys';

/*
 * Why `require` and not `import x from './x.json'`: under jest-expo, Babel compiles a default (or
 * namespace) import into `@babel/runtime/helpers/interopRequireDefault`, and Jest resolves that
 * helper from this file's directory, where no `node_modules/@babel/runtime` exists (it lives in
 * app/node_modules). A plain `require` needs no helper and works the same in Metro (native and the
 * single web bundle), Jest, Vitest and esbuild. The `typeof import(...)` type queries are erased at
 * compile time and keep the literal key types.
 */
declare const require: (id: string) => unknown;
const load = <T>(json: unknown): T => json as T;

const esAlerts = load<typeof import('../locales/es/alerts.json')>(require('../locales/es/alerts.json'));
const esCase = load<typeof import('../locales/es/case.json')>(require('../locales/es/case.json'));
const esCommon = load<typeof import('../locales/es/common.json')>(require('../locales/es/common.json'));
const esEad = load<typeof import('../locales/es/ead.json')>(require('../locales/es/ead.json'));
const esEstimate = load<typeof import('../locales/es/estimate.json')>(require('../locales/es/estimate.json'));
const esHome = load<typeof import('../locales/es/home.json')>(require('../locales/es/home.json'));
const esMethod = load<typeof import('../locales/es/method.json')>(require('../locales/es/method.json'));
const esMore = load<typeof import('../locales/es/more.json')>(require('../locales/es/more.json'));
const esNotifications = load<typeof import('../locales/es/notifications.json')>(require('../locales/es/notifications.json'));
const esOffices = load<typeof import('../locales/es/offices.json')>(require('../locales/es/offices.json'));
const esPeers = load<typeof import('../locales/es/peers.json')>(require('../locales/es/peers.json'));
const esRemedies = load<typeof import('../locales/es/remedies.json')>(require('../locales/es/remedies.json'));
const esUi = load<typeof import('../locales/es/ui.json')>(require('../locales/es/ui.json'));
const esWelcome = load<typeof import('../locales/es/welcome.json')>(require('../locales/es/welcome.json'));

const enAlerts = load<typeof import('../locales/en/alerts.json')>(require('../locales/en/alerts.json'));
const enCase = load<typeof import('../locales/en/case.json')>(require('../locales/en/case.json'));
const enCommon = load<typeof import('../locales/en/common.json')>(require('../locales/en/common.json'));
const enEad = load<typeof import('../locales/en/ead.json')>(require('../locales/en/ead.json'));
const enEstimate = load<typeof import('../locales/en/estimate.json')>(require('../locales/en/estimate.json'));
const enHome = load<typeof import('../locales/en/home.json')>(require('../locales/en/home.json'));
const enMethod = load<typeof import('../locales/en/method.json')>(require('../locales/en/method.json'));
const enMore = load<typeof import('../locales/en/more.json')>(require('../locales/en/more.json'));
const enNotifications = load<typeof import('../locales/en/notifications.json')>(require('../locales/en/notifications.json'));
const enOffices = load<typeof import('../locales/en/offices.json')>(require('../locales/en/offices.json'));
const enPeers = load<typeof import('../locales/en/peers.json')>(require('../locales/en/peers.json'));
const enRemedies = load<typeof import('../locales/en/remedies.json')>(require('../locales/en/remedies.json'));
const enUi = load<typeof import('../locales/en/ui.json')>(require('../locales/en/ui.json'));
const enWelcome = load<typeof import('../locales/en/welcome.json')>(require('../locales/en/welcome.json'));

/** The Spanish resources with their literal key types (Spanish is first-class, 00 §3.1). */
const es = {
  common: esCommon, ui: esUi, home: esHome, case: esCase, estimate: esEstimate, peers: esPeers,
  ead: esEad, remedies: esRemedies, offices: esOffices, alerts: esAlerts, more: esMore,
  method: esMethod, notifications: esNotifications, welcome: esWelcome,
} satisfies Record<Namespace, Record<string, string>>;

const en = {
  common: enCommon, ui: enUi, home: enHome, case: enCase, estimate: enEstimate, peers: enPeers,
  ead: enEad, remedies: enRemedies, offices: enOffices, alerts: enAlerts, more: enMore,
  method: enMethod, notifications: enNotifications, welcome: enWelcome,
} satisfies Record<Namespace, Record<string, string>>;

/** Literal shape of the Spanish resources; `check-i18n` guarantees `en` has the same key sets. */
export type ResourceShape = typeof es;

/** Every key of namespace `N`, as written in the Spanish file. */
export type KeyOf<N extends Namespace> = Extract<keyof ResourceShape[N], string>;

/** Strict variant of `I18nKey`: only keys that exist today (`never` for an empty namespace). */
export type KnownI18nKey = { [N in Namespace]: `${N}:${KeyOf<N>}` }[Namespace];

/** Keys of the `common` namespace (WP4). */
export type CommonKey = KeyOf<'common'>;

/** 07 §6.0: merged namespaces per language. */
export const resources: Record<Lang, Record<Namespace, Record<string, string>>> = { es, en };
