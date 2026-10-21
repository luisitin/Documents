/**
 * S10 Ajustes / Settings (00-product-spec.md S10; F12, F13, F16, F17, F20).
 *
 * - First row: language (owner requirement 1). Two buttons plus the header toggle; the choice
 *   switches the whole app at once and is persisted by WP6 `setLang`.
 * - Theme: sistema / claro / oscuro, native only. On web the host's `data-theme` wins and the
 *   control is hidden (00 S10; artifact contract (f)).
 * - Notifications: native only, local, opt-in here (never at launch, 00 §7). WP6's
 *   `notifications.enable()` asks for permission and schedules the reminders.
 * - Discreet mode (05 §1 item 5): hides case details on "Mi caso"; it is not a security boundary.
 * - Cases (up to 3): choose the active case or delete one through the in-app `Sheet`.
 * - Data source panel: status, official period, lastCheckedAt, dataChangedAt, per-source status,
 *   app, schema and model versions, and "Actualizar".
 * - "Borrar todos mis datos": a two-step in-app sheet (never `confirm()`, contract (e); 05 §1
 *   item 4) that runs WP6 `clearAll()` = `kv.clear('caa:')` + cancel every notification.
 */
import { useState } from 'react';
import { Platform, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SCHEMA_VERSION, type CaseTimeline, type Lang } from '@caa/data-schemas';
import { LANGS } from '@caa/i18n-core';
import { ym } from '@caa/case-rules';
import { appVersion } from '@/data/DataProvider';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { notifications } from '@/notifications';
import { MAX_CASES, useCases } from '@/storage/cases';
import { getSettings, useSettings, type Settings } from '@/storage/settings';
import { AppHeader, AppText, Banner, Button, Card, Chip, Screen, Sheet, quarterLabel, statusLine, useTheme } from '@/ui';
import { nicknameLabel } from '../case/format';
import { BackLink, Disclaimer, FilterChip, hrefOf } from '../home/shared';

const LANG_NAME = { es: 'common:lang.es', en: 'common:lang.en' } as const;
const THEMES: Settings['theme'][] = ['system', 'light', 'dark'];

function nowMs(): number {
  try {
    return Date.now();
  } catch {
    return NaN;
  }
}

function Row({ label, help, value, onChange, testID }: { label: string; help?: string; value: boolean; onChange(v: boolean): void; testID: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space(3), minHeight: 48 }}>
      <View style={{ flex: 1, minWidth: 0, gap: theme.space(0.5) }}>
        <AppText weight="medium">{label}</AppText>
        {help ? (
          <AppText size="sm" muted>
            {help}
          </AppText>
        ) : null}
      </View>
      <Switch testID={testID} accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: theme.colors.accent, false: theme.colors.border }} />
    </View>
  );
}

function Language() {
  const { t, lang, setLang } = useLang();
  const theme = useTheme();
  return (
    <Card title={t('more:settings.lang.title')} testID="settings-lang">
      <AppText size="sm" muted>
        {t('more:settings.lang.help')}
      </AppText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        {LANGS.map((l: Lang) => (
          <FilterChip key={l} testID={`settings-lang-${l}`} label={t(LANG_NAME[l])} selected={lang === l} onPress={() => setLang(l)} />
        ))}
      </View>
    </Card>
  );
}

function Theme() {
  const { t } = useLang();
  const theme = useTheme();
  const { settings, update } = useSettings();
  if (Platform.OS === 'web') return null;
  return (
    <Card title={t('more:settings.theme.title')} testID="settings-theme">
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        {THEMES.map((th) => (
          <FilterChip key={th} testID={`settings-theme-${th}`} label={t(`more:settings.theme.${th}`)} selected={settings.theme === th} onPress={() => update({ theme: th })} />
        ))}
      </View>
    </Card>
  );
}

function Notifications() {
  const { t } = useLang();
  const { settings, update } = useSettings();
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  if (Platform.OS === 'web' || !notifications.available) {
    return (
      <Card title={t('more:settings.notif.title')} testID="settings-notif">
        <AppText size="sm" muted>
          {t('more:settings.notif.webOnly')}
        </AppText>
      </Card>
    );
  }
  const n = settings.notifications;
  return (
    <Card title={t('more:settings.notif.title')} testID="settings-notif">
      <Row
        testID="settings-notif-enabled"
        label={t('more:settings.notif.enabled')}
        help={t('more:settings.notif.help')}
        value={n.enabled}
        onChange={(v) => {
          if (busy) return;
          setBusy(true);
          const job = v ? notifications.enable().then((ok) => setDenied(!ok)) : notifications.disable().then(() => setDenied(false));
          void job.catch(() => setDenied(v)).finally(() => setBusy(false));
        }}
      />
      {n.enabled ? (
        <Row
          testID="settings-notif-data"
          label={t('more:settings.notif.dataMonths')}
          value={n.dataMonths}
          onChange={(v) => update({ notifications: { ...n, dataMonths: v } })}
        />
      ) : null}
      {denied ? <Banner tone="info" text={t('more:settings.notif.denied')} /> : null}
    </Card>
  );
}

function Discreet() {
  const { t } = useLang();
  const { settings, update } = useSettings();
  return (
    <Card title={t('more:settings.discreet.title')} testID="settings-discreet">
      <Row
        testID="settings-discreet-switch"
        label={t('more:settings.discreet.label')}
        help={t('more:settings.discreet.help')}
        value={settings.discreet}
        onChange={(v) => {
          update({ discreet: v });
          // Already-scheduled reminders carry dated text: re-plan them so discreet mode hides the
          // dates on the lock screen too (00 F20; 05 §3). A no-op on web / with notifications off.
          void notifications.rescheduleAll(getSettings().lang).catch(() => undefined);
        }}
      />
    </Card>
  );
}

function Cases() {
  const { t, fmt } = useLang();
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const { cases, active, setActive, remove } = useCases();
  const [pending, setPending] = useState<string | null>(null);
  const target = cases.find((c) => c.localId === pending) ?? null;
  // Preset nickname tokens ('mine', 'family', …) are translated like the case switcher does.
  const name = (i: number, c: CaseTimeline) => (settings.discreet || !c.nickname.trim() ? t('more:settings.cases.unnamed', { n: fmt.int(i + 1) }) : nicknameLabel(c, t));
  return (
    <Card title={t('more:settings.cases.title', { n: fmt.int(cases.length), max: fmt.int(MAX_CASES) })} testID="settings-cases">
      {cases.length === 0 ? <AppText testID="settings-cases-empty">{t('more:settings.cases.none')}</AppText> : null}
      {cases.map((c, i) => {
        const isActive = active?.localId === c.localId;
        const when = settings.discreet ? null : t('more:settings.cases.filed', { month: fmt.month(ym(c.i485ReceiptDate)) });
        return (
          <View key={c.localId} testID={`settings-case-${i}`} style={{ gap: theme.space(1), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: theme.colors.border, paddingTop: i === 0 ? 0 : theme.space(2) }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space(2) }}>
              <AppText weight="medium">{name(i, c)}</AppText>
              {isActive ? <Chip tone="info" label={t('more:settings.cases.active')} /> : null}
            </View>
            {when ? (
              <AppText size="sm" muted>
                {when}
              </AppText>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
              {isActive ? null : <Button variant="link" testID={`settings-case-activate-${i}`} label={t('more:settings.cases.use')} onPress={() => setActive(c.localId)} />}
              <Button variant="link" testID={`settings-case-delete-${i}`} label={t('more:settings.cases.delete')} onPress={() => setPending(c.localId)} />
            </View>
          </View>
        );
      })}
      <Button variant="secondary" testID="settings-cases-open" label={t('more:settings.cases.open')} onPress={() => router.push(hrefOf('/case'))} />
      <Sheet
        testID="sheet-case-delete"
        visible={target !== null}
        destructive
        title={t('more:settings.cases.deleteTitle', { name: target ? name(cases.indexOf(target), target) : '' })}
        body={t('more:settings.cases.deleteBody')}
        confirmLabel={t('common:action.delete')}
        cancelLabel={t('common:action.cancel')}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (target) remove(target.localId);
          setPending(null);
        }}
      />
    </Card>
  );
}

function DataPanel() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const status = statusLine({ status: d.status, manifest: d.manifest, asOf: d.asOf }, lang, nowMs());
  const m = d.manifest;
  return (
    <Card title={t('more:settings.data.title')} testID="settings-data">
      <AppText testID="settings-data-status">{status}</AppText>
      <AppText size="sm">{t('ui:provenance.latestMonth', { month: fmt.month(m.latestOfficialMonth) })}</AppText>
      <AppText size="sm">{t('ui:provenance.latestQuarter', { quarter: quarterLabel(m.latestOfficialQuarter, lang) })}</AppText>
      <AppText size="sm">{t('ui:provenance.lastCheckedAt', { date: fmt.date(m.lastCheckedAt.slice(0, 10)) })}</AppText>
      <AppText size="sm">{t('ui:provenance.dataChangedAt', { date: fmt.date(m.dataChangedAt.slice(0, 10)) })}</AppText>
      {d.asOf.artifactBuiltAt ? <AppText size="sm">{t('ui:provenance.artifactBuiltAt', { date: fmt.date(d.asOf.artifactBuiltAt.slice(0, 10)) })}</AppText> : null}
      <AppText size="sm">{t(`ui:provenance.qa.${m.qa.status}`)}</AppText>
      <View style={{ gap: theme.space(1) }}>
        <AppText weight="medium">{t('ui:provenance.sources')}</AppText>
        {m.sources.map((s) => (
          <AppText key={`${s.id}-${s.url}`} size="sm" testID={`settings-source-${s.id}`}>
            {t('ui:provenance.sourceLine', { source: t(`ui:source.${s.id}`), status: t(`ui:sourceStatus.${s.status}`) })}
          </AppText>
        ))}
      </View>
      <AppText size="sm" muted testID="settings-versions">
        {t('more:settings.data.versions', { app: appVersion(), schema: fmt.int(SCHEMA_VERSION), model: d.params.modelVersion })}
      </AppText>
      <Button
        testID="settings-refresh"
        variant="secondary"
        label={d.refreshing ? t('ui:status.refreshing') : t('common:action.refresh')}
        disabled={d.refreshing}
        onPress={() => {
          void d.refresh();
        }}
      />
    </Card>
  );
}

function DeleteAll() {
  const { t } = useLang();
  const { clearAll } = useCases();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [done, setDone] = useState(false);
  return (
    <Card title={t('more:settings.delete.title')} testID="settings-delete">
      <AppText size="sm" muted>
        {t('more:settings.delete.help')}
      </AppText>
      {done ? <Banner testID="settings-delete-done" tone="info" text={t('more:settings.delete.done')} /> : null}
      <Button testID="settings-delete-open" variant="secondary" label={t('more:settings.delete.button')} onPress={() => { setDone(false); setStep(1); }} />
      <Sheet
        testID="sheet-delete-1"
        visible={step === 1}
        title={t('more:settings.delete.step1.title')}
        body={t('more:settings.delete.step1.body')}
        confirmLabel={t('common:action.continue')}
        cancelLabel={t('common:action.cancel')}
        onCancel={() => setStep(0)}
        onConfirm={() => setStep(2)}
      />
      <Sheet
        testID="sheet-delete-2"
        visible={step === 2}
        destructive
        title={t('more:settings.delete.step2.title')}
        body={t('more:settings.delete.step2.body')}
        confirmLabel={t('more:settings.delete.step2.confirm')}
        cancelLabel={t('common:action.cancel')}
        onCancel={() => setStep(0)}
        onConfirm={() => {
          setStep(0);
          void clearAll().finally(() => setDone(true));
        }}
      />
    </Card>
  );
}

export function SettingsScreen() {
  const { t } = useLang();
  return (
    <Screen testID="screen-more-settings">
      <AppHeader title={t('more:settings.title')} />
      <BackLink label={t('more:back')} fallback="/more" />
      <Language />
      <Theme />
      <Notifications />
      <Discreet />
      <Cases />
      <DataPanel />
      <DeleteAll />
      <Disclaimer />
    </Screen>
  );
}
