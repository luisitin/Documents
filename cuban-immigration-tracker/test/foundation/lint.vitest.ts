/**
 * WP0 acceptance (g): `npm run lint` lints `.ts` under packages/ with typescript-eslint and
 * rejects a seeded `import 'react'` there (ARCH-1 package purity, 07 §4 root eslint config).
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../..', import.meta.url));

describe('root eslint config', () => {
  const eslint = new ESLint({ cwd });

  it('parses TypeScript syntax in packages/ (typescript-eslint)', async () => {
    const [r] = await eslint.lintText('export const x: number = 1;\nexport type Y = { a?: string };\n', {
      filePath: 'packages/estimator/src/__seed_ok__.ts',
    });
    expect(r?.fatalErrorCount).toBe(0);
    expect(r?.errorCount).toBe(0);
  });

  it("rejects a seeded import 'react' under packages/", async () => {
    const [r] = await eslint.lintText("import 'react';\nexport {};\n", { filePath: 'packages/estimator/src/__seed__.ts' });
    expect(r?.errorCount).toBeGreaterThan(0);
    expect(r?.messages.map((m) => m.message).join('\n')).toMatch(/ARCH-1/);
  });

  it('rejects Node built-ins in pure packages but allows them in ingestion', async () => {
    const src = "import { readFileSync } from 'node:fs';\nexport const f = readFileSync;\n";
    const [pure] = await eslint.lintText(src, { filePath: 'packages/case-rules/src/__seed__.ts' });
    const [ing] = await eslint.lintText(src, { filePath: 'packages/ingestion/src/__seed__.ts' });
    expect(pure?.errorCount).toBeGreaterThan(0);
    expect(ing?.errorCount).toBe(0);
  });

  it('the committed skeletons lint clean', async () => {
    const results = await eslint.lintFiles(['packages']);
    expect(results.length).toBeGreaterThanOrEqual(5);
    expect(results.reduce((n, r) => n + r.errorCount, 0)).toBe(0);
  });
});
