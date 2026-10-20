// Contract (c): the artifact boots from an unknown path; unmatched routes go to the home tab.
import { Redirect } from 'expo-router';

export default function NotFound() {
  return <Redirect href="/" />;
}
