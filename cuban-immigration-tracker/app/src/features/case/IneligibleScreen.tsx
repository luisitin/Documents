/**
 * `/case/ineligible` — S9 as its own screen (00-product-spec.md S9). The same content also replaces
 * the estimate on `/case` for an I-220A, EWI or INA 236 entry. Without such a case it explains the
 * I-220A situation in general (the most common question; key facts §1), still with no numbers.
 */
import { useEstimate } from '@/data/useEstimate';
import { useLang } from '@/i18n/useLang';
import { IneligibleContent } from './IneligibleView';
import { CaseFrame, ExampleBanner } from './parts';
import { useCaseSubject } from './subject';

export function IneligibleScreen() {
  const { t } = useLang();
  const subject = useCaseSubject();
  const est = useEstimate(subject.estimateId);
  const reason = est.flags?.noEstimateReason;
  const shown = reason === 'ewi' || reason === 'conditional_parole_236' ? reason : 'i220a';
  return (
    <CaseFrame title={t('case:ineligible.title')} testID="screen-case-ineligible" back discreet>
      <ExampleBanner />
      <IneligibleContent reason={shown} />
    </CaseFrame>
  );
}
