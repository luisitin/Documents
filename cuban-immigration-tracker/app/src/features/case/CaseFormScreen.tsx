/**
 * S2 — Mi caso: formulario / My case: form (`/case/edit`; 00-product-spec.md S2; 02 §3, §8).
 *
 * Five steps, each with Back/Next and "No sé" answers: 1 Entrada, 2 Fechas, 3 Dónde, 4 Lo que ya
 * recibió, 5 Documentos básicos (opcional). The rules live in `./draft` (pure, tested):
 * no future dates (except the card expiry, the scheduled interview, the due date and the original
 * I-94 end date), "Solo sé el mes" = day 15 + month granularity, milestones not before the receipt
 * (except the parole termination notice), a warning (never a block) for a receipt earlier than
 * parole + 366 days and for an I-94 end date of 2026-04-24.
 *
 * Privacy: no free-text field at all — the nickname is a preset label and only the 3-letter receipt
 * prefix can be picked (owner rule "never store names or full receipt numbers"; 05 §1). Saving goes
 * through `useCases().save`, which validates with `parseCase` and keeps at most 3 cases.
 * "Ver un ejemplo" shows the T15 example read-only and never saves it.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { EntryChannel, ISODate } from '@caa/data-schemas';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { MAX_CASES, useCases } from '@/storage/cases';
import { AppText, Banner, Button, Card, Checklist, DateField, Select, useTheme } from '@/ui';
import {
  BASIC_DOCS, CHANNEL_OPTIONS, FORM_MILESTONES, HARDSHIPS, META_DATE, MIAMI_DADE_OFFICES, OUTCOMES, RECEIPT_PREFIXES,
  caseFromDraft, draftFromCase, emptyDraft, newLocalId, validateDraft,
  type CaseDraft, type FormMilestoneKey, type MilestoneDraft, type Problem,
} from './draft';
import { NICKNAMES, officeName, type T } from './format';
import { CaseFrame, useCaseNav } from './parts';
import { useCaseSubject } from './subject';

const STEPS = 5;
const NONE = '__none__';
/** Oldest selectable year for case dates (CHNV opened in 2023; older CAA filers can still enter 2015+). */
const MIN_DATE: ISODate = '2015-01-01';

type Fmt = ReturnType<typeof useLang>['fmt'];

function problemText(p: Problem | undefined, t: T, fmt: Fmt): string | null {
  if (!p) return null;
  return t(p.key, p.date ? { date: fmt.date(p.date) } : undefined);
}

function FieldError({ p, show, testID }: { p: Problem | undefined; show: boolean; testID: string }) {
  const { t, fmt } = useLang();
  const text = show ? problemText(p, t, fmt) : null;
  return text ? <Banner testID={testID} tone="warning" text={text} /> : null;
}

function Section({ title, children, testID }: { title: string; children: ReactNode; testID: string }) {
  return (
    <Card title={title} testID={testID}>
      {children}
    </Card>
  );
}

function MilestoneEditor({ k, m, set, show, errors, today }: {
  k: FormMilestoneKey; m: MilestoneDraft; set(next: MilestoneDraft): void; show: boolean; errors: Record<string, Problem>; today: ISODate;
}) {
  const { t } = useLang();
  const theme = useTheme();
  const label = t(`case:milestone.${k}`);
  const metaKey = META_DATE[k];
  const outcomes = OUTCOMES[k];
  return (
    <View testID={`milestone-${k}`} style={{ gap: theme.space(2), borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.space(3) }}>
      <Checklist items={[{ key: k, label, value: m.happened }]} onChange={(_key, v) => set({ ...m, happened: v })} />
      {m.happened === true ? (
        <View style={{ gap: theme.space(2) }}>
          <DateField
            testID={`milestone-${k}-date`}
            label={t('case:milestone.date')}
            value={m.date}
            granularity={m.granularity}
            min={MIN_DATE}
            max={today}
            onChange={(v, g) => set({ ...m, date: v, granularity: g })}
          />
          <FieldError p={errors[`m.${k}.date`]} show={show} testID={`milestone-${k}-error`} />
          <Select
            testID={`milestone-${k}-source`}
            label={t('case:milestone.source')}
            value={m.source}
            options={(['notice', 'online_status', 'memory'] as const).map((s) => ({ value: s, label: t(`case:source.${s}`) }))}
            onChange={(v) => set({ ...m, source: v })}
          />
          {metaKey ? (
            <DateField
              testID={`milestone-${k}-meta`}
              label={t(`case:milestone.${metaKey}`)}
              value={m.metaDate}
              granularity="day"
              min={MIN_DATE}
              onChange={(v) => set({ ...m, metaDate: v })}
            />
          ) : null}
          <FieldError p={errors[`m.${k}.meta`]} show={show} testID={`milestone-${k}-meta-error`} />
          {outcomes ? (
            <Select
              testID={`milestone-${k}-outcome`}
              label={t('case:milestone.outcome')}
              value={m.outcome ?? null}
              options={outcomes.map((o) => ({ value: o as string, label: t(`case:outcome.${o}`) }))}
              onChange={(v) => set({ ...m, outcome: v as MilestoneDraft['outcome'] })}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function CaseFormScreen() {
  const { t, fmt } = useLang();
  const theme = useTheme();
  const nav = useCaseNav();
  const params = useLocalSearchParams<{ new?: string }>();
  const { offices, today } = useData();
  const { cases, save, setActive } = useCases();
  const subject = useCaseSubject();
  const editing = params.new === '1' || subject.isExample ? null : subject.timeline;
  const [draft, setDraft] = useState<CaseDraft>(() => {
    if (editing) return draftFromCase(editing);
    const used = new Set(cases.map((c) => c.nickname));
    return emptyDraft(newLocalId(), NICKNAMES.find((n) => !used.has(n)) ?? 'mine');
  });
  const [step, setStep] = useState(1);
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState(false);
  const v = useMemo(() => validateDraft(draft, today), [draft, today]);
  const full = !editing && cases.length >= MAX_CASES;
  const upd = (patch: Partial<CaseDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const show = shown[step] === true;

  const next = () => {
    if (v.stepErrors[step]) {
      setShown((s) => ({ ...s, [step]: true }));
      return;
    }
    setStep((s) => Math.min(STEPS, s + 1));
  };
  const back = () => (step === 1 ? nav.back() : setStep((s) => s - 1));
  const onSave = () => {
    const firstBad = [1, 2, 3, 4, 5].find((s) => v.stepErrors[s]);
    if (firstBad !== undefined) {
      setShown((s) => ({ ...s, [firstBad]: true }));
      setStep(firstBad);
      return;
    }
    const c = caseFromDraft(draft, new Date().toISOString());
    const r = c ? save(c) : { ok: false as const, issues: ['incomplete'] };
    if (!r.ok) {
      setSaveError(true);
      return;
    }
    setActive(r.value.localId);
    subject.select(r.value.localId);
    nav.back();
  };

  // ── step content ────────────────────────────────────────────────────────────────────────────
  const states = Object.keys(offices.stateOffices).sort();
  const stateOptions = [{ value: NONE, label: t('case:where.stateUnknown') }, ...states.map((s) => ({ value: s, label: s }))];
  const inState = draft.state ? (offices.stateOffices[draft.state] ?? []) : [];
  const officeCodes = draft.state === 'FL' && draft.miamiDade === true ? inState.filter((c) => (MIAMI_DADE_OFFICES as readonly string[]).includes(c)) : inState;
  const officeOptions = [{ value: NONE, label: t('case:where.officeUnknown') }, ...officeCodes.map((c) => ({ value: c, label: officeName(c, offices) }))];
  const warnings = v.warnings.map((w) => problemText(w, t, fmt)).filter((s): s is string => s !== null);

  let body: ReactNode = null;
  if (step === 1) {
    body = (
      <Section title={t('case:form.step1')} testID="form-step-1">
        <Select<EntryChannel>
          testID="form-channel"
          label={t('case:channel.label')}
          value={draft.entryChannel}
          options={CHANNEL_OPTIONS.map((c) => ({ value: c, label: t(`case:channel.${c}`) }))}
          onChange={(c) => upd({ entryChannel: c })}
        />
        <AppText size="sm" muted>
          {t('case:channel.hint')}
        </AppText>
        <FieldError p={v.errors.entryChannel} show={show} testID="form-channel-error" />
        <Select
          testID="form-nickname"
          label={t('case:nickname.label')}
          value={draft.nickname}
          options={NICKNAMES.map((n) => ({ value: n as string, label: t(`case:nickname.${n}`) }))}
          onChange={(n) => upd({ nickname: n })}
        />
        <AppText size="sm" muted>
          {t('case:nickname.help')}
        </AppText>
      </Section>
    );
  } else if (step === 2) {
    body = (
      <Section title={t('case:form.step2')} testID="form-step-2">
        <DateField
          testID="form-receipt"
          label={t('case:dates.receipt')}
          help={t('case:dates.receipt.help')}
          value={draft.receipt}
          granularity={draft.receiptGranularity}
          min={MIN_DATE}
          max={today}
          onChange={(d, g) => upd({ receipt: d, receiptGranularity: g })}
        />
        <FieldError p={v.errors.receipt} show={show} testID="form-receipt-error" />
        <DateField
          testID="form-parole-date"
          label={t('case:dates.paroleDate')}
          value={draft.paroleDate}
          granularity="day"
          min={MIN_DATE}
          max={today}
          onChange={(d) => upd({ paroleDate: d })}
        />
        <FieldError p={v.errors.paroleDate} show={show} testID="form-parole-error" />
        <DateField
          testID="form-parole-end"
          label={t('case:dates.paroleEnd')}
          help={t('case:dates.paroleEnd.help')}
          value={draft.paroleEndDateOriginal}
          granularity="day"
          min={MIN_DATE}
          onChange={(d) => upd({ paroleEndDateOriginal: d })}
        />
        {warnings.map((w, i) => (
          <Banner key={i} testID={`form-warning-${i}`} tone="info" text={w} />
        ))}
      </Section>
    );
  } else if (step === 3) {
    body = (
      <Section title={t('case:form.step3')} testID="form-step-3">
        <Select
          testID="form-state"
          label={t('case:where.state')}
          value={draft.state ?? NONE}
          options={stateOptions}
          onChange={(s) => upd({ state: s === NONE ? null : s, officeCode: null, miamiDade: null })}
        />
        {draft.state === 'FL' ? (
          <View style={{ gap: theme.space(1) }}>
            <Checklist
              testID="form-miami-dade"
              items={[{ key: 'miamiDade', label: t('case:where.miamiDade'), value: draft.miamiDade }]}
              onChange={(_k, val) => upd({ miamiDade: val, officeCode: null })}
            />
            <AppText size="sm" muted>
              {t('case:where.miamiDade.help')}
            </AppText>
          </View>
        ) : null}
        {draft.state ? (
          <Select
            testID="form-office"
            label={t('case:where.office')}
            value={draft.officeCode ?? NONE}
            options={officeOptions}
            onChange={(o) => upd({ officeCode: o === NONE ? null : o })}
          />
        ) : null}
        <AppText size="sm" muted>
          {t('case:where.office.help')}
        </AppText>
        <Select
          testID="form-prefix"
          label={t('case:where.receiptPrefix')}
          value={draft.receiptPrefix ?? NONE}
          options={[{ value: NONE, label: t('case:where.receiptPrefix.none') }, ...RECEIPT_PREFIXES.map((p) => ({ value: p as string, label: p as string }))]}
          onChange={(p) => upd({ receiptPrefix: p === NONE ? null : p })}
        />
        <AppText size="sm" muted>
          {t('case:where.receiptPrefix.help')}
        </AppText>
      </Section>
    );
  } else if (step === 4) {
    body = (
      <Section title={t('case:form.step4')} testID="form-step-4">
        <AppText size="sm" muted>
          {t('case:received.intro')}
        </AppText>
        <Checklist
          testID="form-concurrent"
          items={[{ key: 'concurrentI765', label: t('case:received.concurrentI765'), value: draft.concurrentI765 }]}
          onChange={(_k, val) => upd({ concurrentI765: val })}
        />
        {FORM_MILESTONES.map((k) => (
          <MilestoneEditor
            key={k}
            k={k}
            m={draft.milestones[k]}
            set={(m) => setDraft((d) => ({ ...d, milestones: { ...d.milestones, [k]: m } }))}
            show={show}
            errors={v.errors}
            today={today}
          />
        ))}
        <AppText weight="medium">{t('case:hardship.title')}</AppText>
        <Checklist
          testID="form-hardship"
          items={HARDSHIPS.map((h) => ({ key: h, label: t(`case:hardship.${h}`), value: draft.hardship[h] }))}
          onChange={(key, val) => setDraft((d) => ({ ...d, hardship: { ...d.hardship, [key]: val } }))}
        />
      </Section>
    );
  } else {
    body = (
      <Section title={t('case:form.step5')} testID="form-step-5">
        <AppText size="sm" muted>
          {t('case:docs.intro')}
        </AppText>
        <Checklist
          testID="form-docs"
          items={BASIC_DOCS.map((k) => ({ key: k, label: t(`case:docs.${k}`), value: draft.basicDocs[k] }))}
          onChange={(key, val) => setDraft((d) => ({ ...d, basicDocs: { ...d.basicDocs, [key]: val } }))}
        />
        <AppText size="sm" muted>
          {t('case:docs.note')}
        </AppText>
      </Section>
    );
  }

  const title = editing ? t('case:form.title.edit') : t('case:form.title.new');
  return (
    <CaseFrame title={title} testID="screen-case-edit" back>
      <AppText size="sm" muted>
        {t('case:form.privacy')}
      </AppText>
      {full ? <Banner testID="form-full" tone="warning" text={t('case:form.maxCases', { n: fmt.int(MAX_CASES) })} /> : null}
      <AppText weight="medium" testID="form-step">
        {t('case:form.step', { n: fmt.int(step), total: fmt.int(STEPS) })}
      </AppText>
      {body}
      {show && v.stepErrors[step] ? <Banner testID="form-fix" tone="warning" text={t('case:form.fixErrors')} /> : null}
      {saveError ? <Banner testID="form-save-error" tone="warning" text={t('case:form.saveError')} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        <Button testID="form-back" variant="secondary" label={step === 1 ? t('case:form.cancel') : t('case:form.back')} onPress={back} />
        {step < STEPS ? (
          <Button testID="form-next" label={t('case:form.next')} onPress={next} />
        ) : (
          <Button testID="form-save" label={t('case:form.save')} onPress={onSave} disabled={full} />
        )}
      </View>
      {editing ? null : (
        <View style={{ alignSelf: 'flex-start' }}>
          <Button
            testID="form-example"
            variant="link"
            label={t('case:form.example')}
            onPress={() => {
              subject.select('example');
              nav.back();
            }}
          />
        </View>
      )}
    </CaseFrame>
  );
}
