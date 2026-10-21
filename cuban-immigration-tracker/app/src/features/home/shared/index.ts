/**
 * Shared pieces of the WP8a screens (Home, Offices, Alerts, More, Welcome). They live under
 * `features/home/` because WP8a owns `app/src/features/{home,offices,alerts,more,welcome}/**`
 * (07 §2, WP8a) and has no separate shared folder.
 */
export { BackLink } from './BackLink';
export { Bullets } from './Bullets';
export { DataBanners } from './DataBanners';
export { Disclaimer } from './Disclaimer';
export { ExternalLink } from './ExternalLink';
export { FilterChip } from './FilterChip';
export { byYm, daysText, fold, monthsText, nextQuarter, pct1, quarterIndex, shortSha, sourceLabel } from './format';
export { goBackOr, hrefOf, seg } from './nav';
