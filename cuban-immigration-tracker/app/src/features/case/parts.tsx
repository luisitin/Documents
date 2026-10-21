/**
 * Shared building blocks of the "Mi caso" tab screens (WP8b): the screen frame (header with the
 * language toggle and the data-status chip on every screen, 00 §5), the "as of" line (owner rule:
 * every screen shows an as-of date and whether data is live or sample), the in-tab back action
 * (Prove P5), the set-up prompt and the example banner.
 */
import { useSyncExternalStore, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { subscribeSettings, useSettings } from '@/storage/settings';
import { AppHeader, AppText, Banner, Button, Card, Screen, useTheme } from '@/ui';
import { useCaseSubject } from './subject';

/** Routes of the tab (typed routes may be stale in a sandbox checkout, so paths are cast once here). */
export type CaseRoute = '/case' | '/case/edit' | '/case/edit?new=1' | '/case/peers' | '/case/ead' | '/case/remedies' | '/case/ineligible' | '/case/share';
export type AppRoute = CaseRoute | '/more/method' | '/alerts';

/** Navigation helpers bound to the router. */
export function useCaseNav() {
  const router = useRouter();
  return {
    push(path: AppRoute): void {
      router.push(path as Href);
    },
    /** Back inside the tab; a deep link with no history goes to the tab index. */
    back(): void {
      if (router.canGoBack()) router.back();
      else router.replace('/case' as Href);
    },
    replace(path: AppRoute): void {
      router.replace(path as Href);
    },
  };
}

/** "Datos de USCIS hasta ago 2026 · calculado el 20 oct 2026". */
export function AsOfLine({ testID = 'case-as-of' }: { testID?: string }) {
  const { t, fmt } = useLang();
  const { asOf, today } = useData();
  const text = t('case:asOf', { month: fmt.month(asOf.latestOfficialMonth), today: fmt.date(today) });
  return (
    <AppText size="sm" muted testID={testID}>
      {text}
    </AppText>
  );
}

/*
 * Discreet mode (05 §1 item 5; more:settings.discreet.help): while it is on, the tab's screens
 * that show a saved case's nickname, dates or entry channel render a placeholder until the user
 * taps "Mostrar". The reveal lives in memory only (never persisted), is shared by the tab's
 * screens for this session, and is forgotten whenever the setting changes, so turning discreet
 * mode on again hides the details again. The example case is never hidden. Not a security boundary.
 */
let revealed = false;
const revealListeners = new Set<() => void>();
function setRevealed(next: boolean): void {
  if (revealed === next) return;
  revealed = next;
  for (const l of revealListeners) l();
}
function subscribeReveal(l: () => void): () => void {
  revealListeners.add(l);
  return () => {
    revealListeners.delete(l);
  };
}
const revealSnapshot = (): boolean => revealed;
// Any change of the setting (on or off, or "Borrar mis datos") forgets an earlier "Mostrar".
subscribeSettings((next, prev) => {
  if (next.discreet !== prev.discreet) setRevealed(false);
});

/** Whether discreet mode currently hides the tab's case details, and the in-memory "show". */
export function useDiscreetGate(): { hidden: boolean; reveal(): void } {
  const { settings } = useSettings();
  const { timeline, isExample } = useCaseSubject();
  const shown = useSyncExternalStore(subscribeReveal, revealSnapshot, revealSnapshot);
  return { hidden: settings.discreet && timeline !== null && !isExample && !shown, reveal: () => setRevealed(true) };
}

/** The placeholder shown in place of the case details while discreet mode hides them. */
export function DiscreetCard({ onReveal }: { onReveal(): void }) {
  const { t } = useLang();
  return (
    <Card title={t('more:settings.discreet.title')} testID="case-discreet">
      <AppText muted>{t('more:settings.discreet.help')}</AppText>
      <View style={{ alignSelf: 'flex-start' }}>
        <Button testID="case-discreet-reveal" variant="secondary" label={t('case:share.reveal.confirm')} onPress={onReveal} />
      </View>
    </Card>
  );
}

export interface CaseFrameProps {
  title: string;
  testID: string;
  /** Deep screens show a back action to the tab index (Prove P5). */
  back?: boolean;
  /** The screen shows a saved case's details: discreet mode replaces them with `DiscreetCard`. */
  discreet?: boolean;
  children: ReactNode;
}

/** Screen + AppHeader (title, LangToggle, DataStatusChip) + as-of line + optional back action. */
export function CaseFrame({ title, testID, back = false, discreet = false, children }: CaseFrameProps) {
  const { t } = useLang();
  const nav = useCaseNav();
  const gate = useDiscreetGate();
  return (
    <Screen testID={testID}>
      {back ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Button testID="case-back" variant="link" label={t('case:nav.back')} onPress={() => nav.back()} />
        </View>
      ) : null}
      <AppHeader title={title} />
      <AsOfLine />
      {discreet && gate.hidden ? <DiscreetCard onReveal={gate.reveal} /> : children}
    </Screen>
  );
}

/** Shown where a screen needs a case and there is none: set-up and "Ver un ejemplo". */
export function NoCasePrompt({ body }: { body?: string }) {
  const { t } = useLang();
  const theme = useTheme();
  const nav = useCaseNav();
  const { select } = useCaseSubject();
  return (
    <Card title={t('case:intro.title')} testID="case-intro">
      <AppText>{body ?? t('case:intro.body')}</AppText>
      <View style={{ gap: theme.space(2), marginTop: theme.space(2) }}>
        <Button testID="case-setup-button" label={t('case:intro.setup')} onPress={() => nav.push('/case/edit')} />
        <Button testID="case-example-button" variant="secondary" label={t('case:intro.example')} onPress={() => select('example')} />
      </View>
    </Card>
  );
}

/** "Está viendo un caso de ejemplo…" with a way out (the example is never saved). */
export function ExampleBanner() {
  const { t, fmt } = useLang();
  const { isExample, timeline, select } = useCaseSubject();
  if (!isExample || !timeline) return null;
  const ead = timeline.milestones.find((m) => m.key === 'ead_c9')?.date;
  const text = t('case:example.banner', { receipt: fmt.date(timeline.i485ReceiptDate), ead: ead ? fmt.month(ead.slice(0, 7)) : '—' });
  return <Banner testID="case-example-banner" tone="info" text={text} action={{ label: t('case:example.exit'), onPress: () => select(null) }} />;
}

/** A vertical list of navigation buttons. */
export function NavList({ items }: { items: { label: string; to: AppRoute; testID: string }[] }) {
  const theme = useTheme();
  const nav = useCaseNav();
  return (
    <View style={{ gap: theme.space(2) }}>
      {items.map((i) => (
        <Button key={i.to} testID={i.testID} variant="secondary" label={i.label} onPress={() => nav.push(i.to)} />
      ))}
    </View>
  );
}

/** One paragraph per string (copy blocks). */
export function Paragraphs({ items, muted = false, testID }: { items: string[]; muted?: boolean; testID?: string }) {
  const theme = useTheme();
  return (
    <View testID={testID} style={{ gap: theme.space(2) }}>
      {items.map((s, i) => (
        <AppText key={i} muted={muted}>
          {s}
        </AppText>
      ))}
    </View>
  );
}
