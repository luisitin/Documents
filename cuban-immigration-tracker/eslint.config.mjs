// Root ESLint flat config (07-implementation-plan.md §4; ADR B7). ESM so it works whatever the
// root package.json "type" is. typescript-eslint is required because ESLint 9 cannot parse .ts.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', 'app/**', 'web-artifact/**', 'data/**', 'prove-out/**', 'probe-out/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['packages/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react/*', 'react-native', 'react-native/*', 'expo', 'expo-*', '@expo/*'], message: 'packages/* are pure: no React/Expo (ARCH-1)' },
          { group: ['fs', 'node:*', 'path'], message: 'Node built-ins only in src/node.ts or packages/ingestion' },
        ],
      }],
    },
  },
  {
    files: ['packages/ingestion/**/*.ts', 'packages/data-schemas/src/node.ts', 'scripts/**', 'tools/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Build/Prove scripts run in Node and inject code into the browser page.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', window: 'readonly', document: 'readonly',
        location: 'readonly', history: 'readonly', localStorage: 'readonly', navigator: 'readonly',
      },
    },
  },
);
