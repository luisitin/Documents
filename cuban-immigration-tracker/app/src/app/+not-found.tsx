/**
 * 00 S13 / artifact contract (c): any unmatched path (the artifact boots from an unknown path such
 * as `/x/y/z/index.html`) redirects to the home tab; it is never visible for more than one frame.
 */
import { Redirect } from 'expo-router';

export default function NotFound() {
  return <Redirect href="/" />;
}
