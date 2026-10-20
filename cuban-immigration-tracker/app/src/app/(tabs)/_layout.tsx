// WP0 hello-world tab layout (WP6 replaces it): exactly five tabs, labels switch with the language,
// and a react-native-svg dot stands in for the WP7 icons (no icon fonts, ARCH-3).
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useHello } from '@/hello';

function Dot({ color }: { color: ColorValue }) {
  return (
    <Svg width={20} height={20} accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={10} cy={10} r={6} fill={color} />
    </Svg>
  );
}

const icon = ({ color }: { color: ColorValue }) => <Dot color={color} />;

export default function TabLayout() {
  const { s } = useHello();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarIcon: icon }}>
      <Tabs.Screen name="index" options={{ title: s.tabs.index }} />
      <Tabs.Screen name="case" options={{ title: s.tabs.case }} />
      <Tabs.Screen name="offices" options={{ title: s.tabs.offices }} />
      <Tabs.Screen name="alerts" options={{ title: s.tabs.alerts }} />
      <Tabs.Screen name="more" options={{ title: s.tabs.more }} />
    </Tabs>
  );
}
