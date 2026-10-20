/**
 * WP0 acceptance (c), (e) and spike V8: jest-expo resolves `@caa/*` from ../packages and `zod`
 * from app/node_modules only (07 §4 moduleNameMapper), parses the labelled sample manifest
 * fixture, and the hello-world router boots, switches language and redirects unknown paths.
 * WP6/WP8 replace the hello-world; this file goes when `src/hello/` is deleted.
 */
import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter, testRouter } from 'expo-router/testing-library';
import { z } from 'zod';
import { ISODateSchema, SCHEMA_VERSION, parseManifest } from '@caa/data-schemas';
import { quantile } from '@caa/estimator';
import sample from '../../test/fixtures/manifest.sample.json';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'es', languageTag: 'es-US' }] }));

describe('@caa/* packages through jest moduleNameMapper', () => {
  it('parses the sample manifest with the app copy of zod', () => {
    const r = parseManifest(sample);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.canary.q50).toBe(54); // GOLDEN T15 (04 §9.2)
    expect(parseManifest({ ...sample, schemaVersion: 2 }).ok).toBe(false);
    expect(SCHEMA_VERSION).toBe(1);
  });

  it('resolves zod from app/node_modules (one zod copy, ARCH-1)', () => {
    const resolve = (require as unknown as { resolve(id: string): string }).resolve;
    expect(resolve('zod').replace(/\\/g, '/')).toMatch(/\/app\/node_modules\/zod\//);
    // Same class identity ⇒ the package file and this test share one zod instance.
    expect(ISODateSchema instanceof z.ZodString).toBe(true);
  });

  it('imports @caa/estimator (EST-8 quantile)', () => {
    expect(quantile([1, 0.4], 0.5)).toBe(1);
  });
});

describe('hello-world router', () => {
  const routes = {
    _layout: require('../src/app/_layout').default,
    '+not-found': require('../src/app/+not-found').default,
    welcome: require('../src/app/welcome').default,
    '(tabs)/_layout': require('../src/app/(tabs)/_layout').default,
    '(tabs)/index': require('../src/app/(tabs)/index').default,
    '(tabs)/case/_layout': require('../src/app/(tabs)/case/_layout').default,
    '(tabs)/case/index': require('../src/app/(tabs)/case/index').default,
    '(tabs)/offices/_layout': require('../src/app/(tabs)/offices/_layout').default,
    '(tabs)/offices/index': require('../src/app/(tabs)/offices/index').default,
    '(tabs)/alerts/_layout': require('../src/app/(tabs)/alerts/_layout').default,
    '(tabs)/alerts/index': require('../src/app/(tabs)/alerts/index').default,
    '(tabs)/more/_layout': require('../src/app/(tabs)/more/_layout').default,
    '(tabs)/more/index': require('../src/app/(tabs)/more/index').default,
  };

  it('boots on Home in the device language (es) and switches to English at runtime', async () => {
    const r = await renderRouter(routes, { initialUrl: '/' });
    expect(r.getPathname()).toBe('/');
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
    expect(screen.getByTestId('data-status')).toHaveTextContent('Muestra');
    await fireEvent.press(screen.getByTestId('lang-toggle')); // RNTL 14: fireEvent is async
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getByTestId('data-status')).toHaveTextContent('Sample');
    expect(screen.getByTestId('disclaimer')).toHaveTextContent(/not legal advice/);
  });

  it('redirects an unknown initial path to the home tab (+not-found)', async () => {
    const r = await renderRouter(routes, { initialUrl: '/x/y/z/index.html' });
    expect(r.getPathname()).toBe('/');
    expect(screen.getByTestId('hello-index')).toBeTruthy();
  });

  it('navigates to every tab', async () => {
    const r = await renderRouter(routes, { initialUrl: '/' });
    for (const tab of ['case', 'offices', 'alerts', 'more'] as const) {
      await testRouter.navigate(`/${tab}`);
      expect(r.getPathname()).toBe(`/${tab}`);
      expect(screen.getByTestId(`hello-${tab}`)).toBeTruthy();
    }
  });
});
