/**
 * WP0 HELLO-WORLD (07-implementation-plan.md WP0 step 5: re-run spikes V1–V8 inside the repo).
 *
 * Temporary scaffolding that proves the toolchain end to end: Expo Router tabs, one
 * `@caa/estimator` import and one `@caa/data-schemas` (zod) import bundled from ../packages,
 * a runtime es/en switch, a guarded storage read, and the web data base captured by the
 * artifact prelude (WEB-1). WP6 (platform), WP7 (UI kit) and WP8a/WP8b (screens) replace the
 * route files and then delete this folder. Nothing here is real data: the status reads
 * "Muestra / Sample" unless a schema-valid `./data/manifest.json` is served next to the page.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { getLocales } from 'expo-localization';
import { SCHEMA_VERSION, parseManifest } from '@caa/data-schemas';
import { quantile } from '@caa/estimator';

export type HelloLang = 'es' | 'en';
type TabKey = 'index' | 'case' | 'offices' | 'alerts' | 'more';

/** Bilingual copy (Spanish first-class, usted register: 07 §8). */
const STRINGS = {
  es: {
    appTitle: 'Seguimiento del Ajuste Cubano',
    tabs: { index: 'Inicio', case: 'Mi caso', offices: 'Oficinas', alerts: 'Alertas', more: 'Más' },
    langButton: 'English',
    langLabel: 'Cambiar el idioma a inglés',
    placeholder: 'Versión de prueba de la estructura de la app. Las pantallas reales llegan en las próximas etapas.',
    statusSample: 'Muestra',
    statusPublished: 'Publicado',
    dataMonth: 'Último mes oficial',
    noData: 'sin datos',
    engine: 'Motor de estimación',
    linked: 'enlazado',
    schema: 'Esquema de datos',
    welcome: 'Bienvenido',
    disclaimer:
      'Esto no es asesoría legal. No estamos afiliados a USCIS ni al DHS. Para su caso, consulte a un abogado o representante acreditado.',
  },
  en: {
    appTitle: 'Cuban Adjustment Tracker',
    tabs: { index: 'Home', case: 'My case', offices: 'Offices', alerts: 'Alerts', more: 'More' },
    langButton: 'Español',
    langLabel: 'Switch the language to Spanish',
    placeholder: 'Test build of the app structure. The real screens arrive in the next stages.',
    statusSample: 'Sample',
    statusPublished: 'Published',
    dataMonth: 'Latest official month',
    noData: 'no data',
    engine: 'Estimation engine',
    linked: 'linked',
    schema: 'Data schema',
    welcome: 'Welcome',
    disclaimer:
      'This is not legal advice. We are not affiliated with USCIS or DHS. For your case, consult an attorney or accredited representative.',
  },
} as const;

const STORAGE_KEY = 'caa:v1:hello.lang';

/** Contract (d): storage may throw or be empty; every access is guarded. */
function readLang(): HelloLang | null {
  if (Platform.OS !== 'web') return null;
  try {
    const v = globalThis.localStorage?.getItem(STORAGE_KEY);
    return v === 'es' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}
function writeLang(l: HelloLang): void {
  if (Platform.OS !== 'web') return;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, l);
  } catch {
    /* memory only */
  }
}
function deviceLang(): HelloLang {
  try {
    return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
  } catch {
    return 'es';
  }
}

type DataState = { status: 'sample' } | { status: 'published'; month: string };

interface HelloCtx {
  lang: HelloLang;
  setLang(l: HelloLang): void;
  s: (typeof STRINGS)[HelloLang];
  data: DataState;
}
const Ctx = createContext<HelloCtx | null>(null);

declare global {
  // Set by the artifact prelude (WEB-1) before the bundle runs.
  var __CAA_DATA_BASE__: string | undefined;
}

export function HelloProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<HelloLang>(() => readLang() ?? deviceLang());
  const [data, setData] = useState<DataState>({ status: 'sample' });
  const setLang = useCallback((l: HelloLang) => {
    writeLang(l);
    setLangState(l);
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return; // native fetching is WP6 (raw GitHub URLs from app.json extra.data)
    let alive = true;
    const base = globalThis.__CAA_DATA_BASE__ ?? './data/';
    fetch(`${base}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: unknown) => {
        const m = parseManifest(j);
        if (alive && m.ok) setData({ status: 'published', month: m.value.latestOfficialMonth });
      })
      .catch(() => {
        /* missing or blocked data → bundled sample path (01 §4) */
      });
    return () => {
      alive = false;
    };
  }, []);
  const value = useMemo(() => ({ lang, setLang, s: STRINGS[lang], data }), [lang, setLang, data]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHello(): HelloCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useHello outside HelloProvider');
  return c;
}

export function useTabTitle(key: TabKey): string {
  return useHello().s.tabs[key];
}

function palette(dark: boolean) {
  return dark
    ? { bg: '#111317', surface: '#1b1e24', text: '#eceef2', muted: '#a9afbb', accent: '#7aa7ff', border: '#2c313a' }
    : { bg: '#f7f7f5', surface: '#ffffff', text: '#16181d', muted: '#565d6b', accent: '#1d4ed8', border: '#d9dce1' };
}

export function LangButton() {
  const { lang, setLang, s } = useHello();
  const c = palette(useColorScheme() === 'dark');
  return (
    <Pressable
      testID="lang-toggle"
      accessibilityRole="button"
      accessibilityLabel={s.langLabel}
      onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
      style={{ minHeight: 48, minWidth: 48, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: c.border }}
    >
      <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600' }}>{s.langButton}</Text>
    </Pressable>
  );
}

export function HelloScreen({ tab }: { tab: TabKey }) {
  const { s, data } = useHello();
  const c = palette(useColorScheme() === 'dark');
  const statusText = data.status === 'published' ? `${s.statusPublished} · ${data.month}` : s.statusSample;
  const engineText = `${s.engine}: ${typeof quantile === 'function' ? s.linked : s.noData} · ${s.schema}: v${SCHEMA_VERSION}`;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ alignItems: 'center' }}>
      <View testID={`hello-${tab}`} style={{ width: '100%', maxWidth: 560, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text accessibilityRole="header" style={{ color: c.text, fontSize: 20, fontWeight: '700', flexShrink: 1 }}>
            {s.tabs[tab]}
          </Text>
          <LangButton />
        </View>
        <Text testID="data-status" style={{ color: c.muted, fontSize: 13 }}>
          {statusText}
        </Text>
        <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{s.appTitle}</Text>
          <Text style={{ color: c.text, fontSize: 14 }}>{s.placeholder}</Text>
          <Text style={{ color: c.muted, fontSize: 13 }}>
            {engineText}
          </Text>
        </View>
        <Text testID="disclaimer" style={{ color: c.muted, fontSize: 12 }}>
          {s.disclaimer}
        </Text>
      </View>
    </ScrollView>
  );
}
