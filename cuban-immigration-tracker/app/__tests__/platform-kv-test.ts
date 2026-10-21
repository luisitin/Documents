/**
 * 07 WP6 acceptance: "KV web adapter with localStorage throwing, both getter and setItem", plus the
 * native AsyncStorage hydration and "Borrar mis datos" (`clear('caa:')`; 02-data-model.md §6).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createWebKv } from '@/storage/kv.web';
import { createNativeKv } from '@/storage/kv.native';
import { createMemoryKv, readJson, readyWithin } from '@/storage/kvCore';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const g = globalThis as { localStorage?: unknown };

function fakeStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    _map: m,
  };
}

afterEach(() => {
  delete g.localStorage;
});

describe('web KV (guarded localStorage + memory)', () => {
  it('hydrates synchronously from localStorage (only caa: keys)', () => {
    g.localStorage = fakeStorage({ 'caa:v1:settings': '{"x":1}', other: 'y' });
    const kv = createWebKv();
    expect(kv.get('caa:v1:settings')).toBe('{"x":1}');
    expect(kv.get('other' as never)).toBeNull();
  });

  it('keeps working in memory when the localStorage GETTER throws', async () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    const kv = createWebKv();
    await kv.ready;
    expect(kv.get('caa:v1:settings')).toBeNull();
    expect(() => kv.set('caa:v1:settings', 'a')).not.toThrow();
    expect(kv.get('caa:v1:settings')).toBe('a');
    expect(() => kv.remove('caa:v1:settings')).not.toThrow();
    expect(() => kv.clear('caa:')).not.toThrow();
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it('keeps working in memory when setItem / getItem / removeItem throw', () => {
    const s = fakeStorage({ 'caa:v1:cases': '{}' });
    s.getItem = () => { throw new Error('blocked'); };
    s.setItem = () => { throw new Error('QuotaExceededError'); };
    s.removeItem = () => { throw new Error('blocked'); };
    g.localStorage = s;
    const kv = createWebKv();
    expect(kv.get('caa:v1:cases')).toBeNull();
    kv.set('caa:v1:cases', '[1]');
    expect(kv.get('caa:v1:cases')).toBe('[1]');
    kv.clear('caa:');
    expect(kv.get('caa:v1:cases')).toBeNull();
  });

  it('persists writes and clear() removes every caa: key, including keys not in memory', () => {
    const s = fakeStorage({ 'caa:v1:refresh': '{}', keep: 'me' });
    g.localStorage = s;
    const kv = createWebKv();
    kv.set('caa:v1:settings', 'v');
    expect(s._map.get('caa:v1:settings')).toBe('v');
    s._map.set('caa:v1:alerts:read', '[]'); // written by another tab
    kv.clear('caa:');
    expect([...s._map.keys()]).toEqual(['keep']);
  });
});

describe('native KV (AsyncStorage 2.2.0 + memory mirror)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('hydrates all caa: keys once, then reads synchronously', async () => {
    await AsyncStorage.setItem('caa:v1:settings', 's');
    await AsyncStorage.setItem('unrelated', 'u');
    const kv = createNativeKv();
    await kv.ready;
    expect(kv.get('caa:v1:settings')).toBe('s');
    expect(kv.get('unrelated' as never)).toBeNull();
  });

  it('a value written before hydration finished is not overwritten by storage', async () => {
    await AsyncStorage.setItem('caa:v1:settings', 'old');
    const kv = createNativeKv();
    kv.set('caa:v1:settings', 'new');
    await kv.ready;
    expect(kv.get('caa:v1:settings')).toBe('new');
    await new Promise((r) => setTimeout(r, 0));
    expect(await AsyncStorage.getItem('caa:v1:settings')).toBe('new');
  });

  it('clear("caa:") empties memory and storage', async () => {
    await AsyncStorage.multiSet([['caa:v1:cases', 'c'], ['caa:v1:refresh', 'r'], ['x', 'y']]);
    const kv = createNativeKv();
    await kv.ready;
    kv.clear('caa:');
    expect(kv.get('caa:v1:cases')).toBeNull();
    await new Promise((r) => setTimeout(r, 0));
    expect(await AsyncStorage.getAllKeys()).toEqual(['x']);
  });

  it('readyWithin() never waits longer than the 300 ms splash budget', async () => {
    const never = { ...createMemoryKv(), ready: new Promise<void>(() => undefined) };
    const t0 = Date.now();
    await readyWithin(never, 50);
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

describe('readJson', () => {
  it('removes unparsable and invalid values (02 §6 "invalid → removed")', () => {
    const kv = createMemoryKv({ 'caa:v1:settings': '{not json', 'caa:v1:cases': '{"a":1}' });
    expect(readJson(kv, 'caa:v1:settings', () => 1)).toBeNull();
    expect(kv.get('caa:v1:settings')).toBeNull();
    expect(readJson(kv, 'caa:v1:cases', () => null)).toBeNull();
    expect(kv.get('caa:v1:cases')).toBeNull();
  });
});
