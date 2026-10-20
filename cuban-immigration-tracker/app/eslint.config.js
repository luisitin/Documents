// App ESLint flat config, run by `expo lint` (07-implementation-plan.md §4, ARCH-3, WP7 lint rule).
// https://docs.expo.dev/guides/using-eslint/ (SDK notes §8)
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// ARCH-3 lean bundle: forbidden DIRECT imports in app/. expo-font stays in node_modules because
// expo@58 depends on it; only importing it is banned.
const banned = [
  'expo-sqlite', 'expo-symbols', '@expo/vector-icons', 'expo-font', 'react-native-gifted-charts',
  'victory-native', '@shopify/react-native-skia', 'react-native-mmkv', 'date-fns', 'moment',
  'lodash', '@tanstack/react-query',
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'expo-env.d.ts'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: banned.map((name) => ({ name, message: 'Forbidden in app/ (ARCH-3 lean bundle; use react-native-svg / in-repo code).' })),
        patterns: [
          { group: banned.map((n) => `${n}/*`), message: 'Forbidden in app/ (ARCH-3 lean bundle).' },
          { group: ['@caa/estimator/golden'], message: 'GOLDEN is test-only; never import it from app code (07 WP2).' },
        ],
      }],
    },
  },
  {
    // Every user-facing string comes from i18n (owner requirement 1; WP7 acceptance).
    files: ['src/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true, allowedStrings: ['·', '—', '–', '/', '|', '(', ')', ':', '%'] }],
    },
  },
  {
    // Tests may import the golden values (07 WP2) but still not the ARCH-3 banned libraries.
    files: ['__tests__/**/*'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: banned.map((name) => ({ name, message: 'Forbidden in app/ (ARCH-3 lean bundle).' })),
      }],
    },
  },
]);
