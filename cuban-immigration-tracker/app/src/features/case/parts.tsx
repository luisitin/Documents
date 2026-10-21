/**
 * Shared building blocks of the "Mi caso" tab screens (WP8b): the screen frame (header with the
 * language toggle and the data-status chip on every screen, 00 §5), the "as of" line (owner rule:
 * every screen shows an as-of date and whether data is live or sample), the in-tab back action
 * (Prove P5), the set-up prompt and the example banner.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
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

export interface CaseFrameProps {
  title: string;
  testID: string;
  /** Deep screens show a back action to the tab index (Prove P5). */
  back?: boolean;
  children: ReactNode;
}

/** Screen + AppHeader (title, LangToggle, DataStatusChip) + as-of line + optional back action. */
export function CaseFrame({ title, testID, back = false, children }: CaseFrameProps) {
  const { t } = useLang();
  const nav = useCaseNav();
  return (
    <Screen testID={testID}>
      {back ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Button testID="case-back" variant="link" label={t('case:nav.back')} onPress={() => nav.back()} />
        </View>
      ) : null}
      <AppHeader title={title} />
      <AsOfLine />
      {children}
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
