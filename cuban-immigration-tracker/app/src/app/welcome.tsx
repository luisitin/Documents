// S0 Welcome modal (00 S0). Route files are thin wrappers (07 §2); the screen lives in features/welcome.
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen';

export default function WelcomeRoute() {
  return <WelcomeScreen />;
}
