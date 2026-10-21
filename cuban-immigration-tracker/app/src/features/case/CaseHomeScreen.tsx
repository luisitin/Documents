/**
 * `/case` — the "Mi caso" tab index (00 §5 table: "Case form, or estimate if a case exists";
 * S2/S3). With no saved case it offers "Configurar mi caso" and "Ver un ejemplo"; the example
 * (T15) is shown read-only and never written to the KV. With up to 3 saved cases, a switcher picks
 * the one to view (00 F3). Links lead to the peers, EAD, remedies and share screens.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { MAX_CASES, useCases } from '@/storage/cases';
import { useLang } from '@/i18n/useLang';
import { Button, Select, Sheet, useTheme } from '@/ui';
import { EstimateBody } from './EstimateView';
import { nicknameLabel } from './format';
import { CaseFrame, ExampleBanner, NavList, NoCasePrompt, useCaseNav } from './parts';
import { useCaseSubject } from './subject';

export function CaseHomeScreen() {
  const { t } = useLang();
  const theme = useTheme();
  const nav = useCaseNav();
  const subject = useCaseSubject();
  const { cases, setActive, remove } = useCases();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const c = subject.timeline;

  if (!c) {
    return (
      <CaseFrame title={t('case:title')} testID="screen-case">
        <NoCasePrompt />
      </CaseFrame>
    );
  }

  const options = cases.map((x) => ({ value: x.localId, label: nicknameLabel(x, t) }));
  const showSwitcher = !subject.isExample && cases.length > 1;
  return (
    <CaseFrame title={t('case:title')} testID="screen-case">
      <ExampleBanner />
      {showSwitcher ? (
        <Select
          testID="case-switcher"
          label={t('case:switcher.label')}
          value={c.localId}
          options={options}
          onChange={(id) => {
            setActive(id);
            subject.select(id);
          }}
        />
      ) : null}
      <EstimateBody subject={subject} />
      <NavList
        items={[
          { label: t('case:nav.peers'), to: '/case/peers', testID: 'case-nav-peers' },
          { label: t('case:nav.ead'), to: '/case/ead', testID: 'case-nav-ead' },
          { label: t('case:nav.remedies'), to: '/case/remedies', testID: 'case-nav-remedies' },
          { label: t('case:nav.share'), to: '/case/share', testID: 'case-nav-share' },
        ]}
      />
      <View style={{ gap: theme.space(2) }}>
        {subject.isExample ? (
          <Button testID="case-setup-button" label={t('case:intro.setup')} onPress={() => nav.push('/case/edit')} />
        ) : (
          <>
            <Button testID="case-edit-button" label={t('case:action.edit')} onPress={() => nav.push('/case/edit')} />
            {cases.length < MAX_CASES ? (
              <Button
                testID="case-add-button"
                variant="secondary"
                label={t('case:action.add')}
                onPress={() => {
                  subject.select(null);
                  nav.push('/case/edit?new=1');
                }}
              />
            ) : null}
            <Button testID="case-example-button" variant="secondary" label={t('case:intro.example')} onPress={() => subject.select('example')} />
            <Button testID="case-delete-button" variant="link" label={t('case:action.delete')} onPress={() => setConfirmDelete(true)} />
          </>
        )}
      </View>
      <Sheet
        testID="case-delete-sheet"
        visible={confirmDelete}
        title={t('case:delete.title')}
        body={t('case:delete.body')}
        confirmLabel={t('case:delete.confirm')}
        cancelLabel={t('common:action.cancel')}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove(c.localId);
          subject.select(null);
        }}
      />
    </CaseFrame>
  );
}
