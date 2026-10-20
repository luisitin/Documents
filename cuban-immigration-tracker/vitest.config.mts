// Root vitest config (07-implementation-plan.md ARCH-1). Pure-TS packages, ingestion, scripts.
// Test files are named *.vitest.ts so jest-expo (app/) never picks them up (SDK notes §7).
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkg = (p: string) => fileURLToPath(new URL(`./packages/${p}`, import.meta.url));

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.vitest.ts', 'test/**/*.vitest.ts'],
    exclude: ['**/node_modules/**', 'app/**', 'web-artifact/**'],
    environment: 'node',
    // 4 CPUs in the sandbox (orchestrator rule 6); keep the worker pool modest.
    maxWorkers: 2,
  },
  resolve: {
    // Mirrors tsconfig.base.json `paths` (@caa/* → packages/*/src). Most specific first.
    alias: [
      { find: /^@caa\/data-schemas\/node$/, replacement: pkg('data-schemas/src/node.ts') },
      { find: /^@caa\/estimator\/golden$/, replacement: pkg('estimator/src/golden.ts') },
      { find: /^@caa\/(data-schemas|estimator|case-rules|i18n-core|ingestion)$/, replacement: pkg('$1/src/index.ts') },
    ],
  },
});
