// Actual App/ThemeProvider/AsyncStorage web adapter in fresh browser profiles.
// Native lifecycle/splash/haptics are mocked; this is not native-device evidence.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const qaModules = process.env.ZEKR_QA_MODULES || path.join(root, 'node_modules');
const resolveQA = name => require.resolve(name, { paths: [qaModules] });
const esbuild = require(resolveQA('esbuild'));
const { chromium } = require(process.env.ZEKR_QA_PLAYWRIGHT || resolveQA('playwright'));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'zekr-persistence-qa-'));
const mocks = {
  'rn.ts': `export * from 'react-native-web';
    const listeners = new Set<(value: string) => void>();
    export const AppState = { addEventListener: (_: string, fn: (value: string) => void) => {
      listeners.add(fn); return { remove: () => listeners.delete(fn) }; } };
    export const AccessibilityInfo = { announceForAccessibility: () => {},
      isReduceMotionEnabled: async () => true, addEventListener: () => ({ remove: () => {} }) };
    (window as any).lifecycle = (state: string) => listeners.forEach(fn => fn(state));`,
  'safe.tsx': `import React from 'react'; export const useSafeAreaInsets = () => ({top:24,bottom:24,left:0,right:0});
    export const SafeAreaProvider = ({children}: any) => <>{children}</>;`,
  'splash.ts': `export const setOptions = () => {}; export const preventAutoHideAsync = async () => {};
    export const hideAsync = async () => { (window as any).nativeHides = ((window as any).nativeHides || 0) + 1; };`,
  'haptics.ts': `export const NotificationFeedbackType = {}; export const ImpactFeedbackStyle = {};
    export const notificationAsync = async () => {}; export const impactAsync = async () => {};`,
};
for (const [name, source] of Object.entries(mocks)) fs.writeFileSync(path.join(scratch, name), source);
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `import React from 'react'; import {createRoot} from 'react-dom/client';
  import App from ${JSON.stringify(path.join(root, 'App.tsx'))};
  import * as storage from ${JSON.stringify(path.join(root, 'src/storage.ts'))};
  (window as any).storageAPI = storage;
  let appRoot: ReturnType<typeof createRoot>;
  (window as any).mountApp = () => { appRoot = createRoot(document.getElementById('root')!); appRoot.render(<React.StrictMode><App/></React.StrictMode>); };
  (window as any).unmountApp = () => appRoot.unmount();`);
esbuild.buildSync({ entryPoints: [path.join(scratch, 'entry.tsx')], bundle: true,
  outfile: path.join(scratch, 'bundle.js'), jsx: 'automatic', nodePaths: [qaModules, path.join(root, 'node_modules')],
  alias: { react: path.dirname(resolveQA('react/package.json')), 'react-dom': path.dirname(resolveQA('react-dom/package.json')),
    'react-native': path.join(scratch, 'rn.ts'), 'react-native-safe-area-context': path.join(scratch, 'safe.tsx'),
    'expo-splash-screen': path.join(scratch, 'splash.ts'), 'expo-haptics': path.join(scratch, 'haptics.ts') },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'], loader: { '.png': 'dataurl' },
  define: { global: 'globalThis', __DEV__: 'true', 'process.env.NODE_ENV': '"development"', 'process.env.EXPO_OS': '"web"' },
});
const bundle = fs.readFileSync(path.join(scratch, 'bundle.js'), 'utf8');
const output = process.env.ZEKR_QA_OUTPUT ? path.resolve(process.env.ZEKR_QA_OUTPUT) : path.join(scratch, 'results');
fs.mkdirSync(output, { recursive: true });
const counterKey = '@dhikr/counter-state/v1';
const themeKey = '@dhikr/theme/v1';
const saved = { count: 202, target: 33, totalSessionCount: 500, dhikrId: 'tasbih_tahmid',
  hapticsEnabled: false, visualEffectsEnabled: false, fullScreenTap: false };

(async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.ZEKR_QA_CHROME ? { executablePath: process.env.ZEKR_QA_CHROME } : {}) });
  const errors = [], results = [];
  async function installFaults(page, faults = {}) {
    await page.evaluate(faults => {
      window.faults = { read: {}, write: {}, keys: false, ...faults };
      window.attempts = { read: [], write: [] };
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      const length = Object.getOwnPropertyDescriptor(Storage.prototype, 'length');
      Object.defineProperty(Storage.prototype, 'length', { configurable: true, get() {
        if (window.faults.keys) throw Error('Isolated injected key enumeration failure');
        return length.get.call(this);
      } });
      window.diskGet = key => get.call(localStorage, key);
      window.diskSet = (key, value) => set.call(localStorage, key, value);
      Storage.prototype.getItem = function(key) {
        window.attempts.read.push(key);
        if (window.faults.read[key]) { window.faults.read[key]--; throw Error('Isolated injected read failure'); }
        return get.call(this, key);
      };
      Storage.prototype.setItem = function(key, value) {
        window.attempts.write.push({ key, value });
        if (window.faults.write[key]) { window.faults.write[key]--; throw Error('Isolated injected write failure'); }
        return set.call(this, key, value);
      };
    }, faults);
  }
  async function mount(page) {
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => window.mountApp());
  }
  async function open({ state = saved, theme = 'softIvory', faults = {}, raw } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('http://qa.zekr.test/**', r => r.fulfill({ contentType: 'text/html',
      body: '<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>' }));
    await page.goto('http://qa.zekr.test');
    await installFaults(page, faults);
    await page.evaluate(({ state, theme, raw, counterKey, themeKey }) => {
      if (state !== null || raw !== undefined) window.diskSet(counterKey, raw ?? JSON.stringify(state));
      if (theme !== null) window.diskSet(themeKey, theme);
    }, { state, theme, raw, counterKey, themeKey });
    await mount(page);
    return { page, context };
  }
  const counter = page => page.getByRole('button', { name: /^عدّاد / });
  async function ready(page, count = 202) {
    await page.getByTestId('central-counter-text').filter({ hasText: String(count).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) }).waitFor();
    await page.getByRole('button', { name: 'تخطي المقدمة' }).waitFor({ state: 'detached' });
  }
  const disk = (page, key = counterKey) => page.evaluate(key => window.diskGet(key), key);
  async function burst(page, count) {
    await page.evaluate(count => {
      const el = document.querySelector('[aria-label^="عدّاد "]');
      let fiber = el[Object.keys(el).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && fiber.type?.name !== 'CounterRing') fiber = fiber.return;
      for (let i = 0; i < count; i++) fiber.memoizedProps.onPress();
    }, count);
  }
  async function persisted(page, count, total) {
    await page.waitForFunction(({ key, count, total }) => {
      const data = JSON.parse(window.diskGet(key));
      return data?.count === count && data?.totalSessionCount === total;
    }, { key: counterKey, count, total });
  }
  try {
    // Same pre-fix audit fault: exactly one read fails, writes remain available.
    for (const failures of [1, 4]) {
      const { page, context } = await open({ faults: { read: { [counterKey]: failures } } });
      await page.getByText('تعذّر استعادة البيانات', { exact: true }).waitFor();
      await page.waitForFunction(() => window.nativeHides === 1);
      assert.equal(await counter(page).count(), 0);
      const original = JSON.stringify(saved);
      for (let attempt = 1; attempt < failures; attempt++) {
        await page.getByRole('button', { name: 'إعادة محاولة استعادة البيانات' }).click();
        await page.getByText('تعذّر استعادة البيانات', { exact: true }).waitFor();
      }
      await page.evaluate(() => { window.lifecycle('background'); window.lifecycle('inactive'); });
      await page.waitForTimeout(600);
      assert.equal(await disk(page), original);
      assert.equal(await page.evaluate(() => window.attempts.write.length), 0);
      await page.screenshot({ path: path.join(output, `read-error-${failures}.png`) });
      await page.getByRole('button', { name: 'إعادة محاولة استعادة البيانات' }).click();
      await ready(page);
      assert.equal(await disk(page), original);
      assert.equal(await page.evaluate(() => window.storageAPI.counterPersistence.getSnapshot().value.totalSessionCount), 500);
      await page.reload(); await installFaults(page); await mount(page); await ready(page);
      assert.equal(await disk(page), original);
      results.push({ scenario: `${failures} failed reads, retry, background and restart`, before: saved, after: JSON.parse(await disk(page)), writes: 0 });
      await context.close();
    }

    const empty = await open({ state: null, theme: null });
    await ready(empty.page, 0);
    assert.equal(await disk(empty.page), null);
    await counter(empty.page).click();
    await persisted(empty.page, 1, 1);
    results.push({ scenario: 'Empty storage and first count', passed: true });
    await empty.context.close();

    const write = await open({ faults: { write: { [counterKey]: 100 } } });
    await ready(write.page);
    await counter(write.page).click();
    await write.page.getByText('التغييرات لم تُحفظ بعد', { exact: true }).waitFor();
    assert.equal(JSON.parse(await disk(write.page)).count, 202);
    await burst(write.page, 50);
    await ready(write.page, 253);
    await write.page.screenshot({ path: path.join(output, 'unsaved-counting.png') });
    await write.page.evaluate(key => { window.faults.write[key] = 0; }, counterKey);
    await write.page.getByRole('button', { name: 'إعادة محاولة الحفظ' }).click();
    await persisted(write.page, 253, 551);
    await write.page.getByText('التغييرات لم تُحفظ بعد', { exact: true }).waitFor({ state: 'detached' });
    await write.page.reload(); await installFaults(write.page); await mount(write.page); await ready(write.page, 253);
    results.push({ scenario: 'Write failure, continued rapid counting, retry and restart', after: JSON.parse(await disk(write.page)) });
    await write.context.close();

    const automatic = await open({ faults: { write: { [counterKey]: 1 } } });
    await ready(automatic.page); await burst(automatic.page, 1000);
    await automatic.page.getByText('التغييرات لم تُحفظ بعد', { exact: true }).waitFor();
    await persisted(automatic.page, 1202, 1500);
    results.push({ scenario: 'Automatic write retry saves all 1000 rapid taps', passed: true });
    await automatic.context.close();

    const background = await open();
    await ready(background.page);
    await burst(background.page, 19);
    await background.page.evaluate(() => { window.lifecycle('inactive'); window.lifecycle('background'); });
    await persisted(background.page, 221, 519);
    await burst(background.page, 3);
    await background.page.evaluate(() => window.unmountApp());
    await persisted(background.page, 224, 522);
    await background.page.evaluate(() => window.mountApp()); await ready(background.page, 224);
    results.push({ scenario: 'Background flush and component unmount/remount retain latest actions', passed: true });
    await background.context.close();

    const theme = await open({ faults: { read: { [themeKey]: 1 } } });
    await theme.page.getByText('تعذّر استعادة البيانات', { exact: true }).waitFor();
    assert.equal(await disk(theme.page, themeKey), 'softIvory');
    assert.equal(await theme.page.evaluate(() => window.attempts.write.length), 0);
    await theme.page.getByRole('button', { name: 'إعادة محاولة استعادة البيانات' }).click();
    await ready(theme.page);
    assert.equal(await theme.page.evaluate(() => window.storageAPI.themePersistence.getSnapshot().value), 'softIvory');
    await theme.page.evaluate(key => { window.faults.write[key] = 100; window.storageAPI.themePersistence.update(() => 'royalAmethyst'); }, themeKey);
    await theme.page.getByText('التغييرات لم تُحفظ بعد', { exact: true }).waitFor();
    assert.equal(await disk(theme.page, themeKey), 'softIvory');
    await theme.page.evaluate(key => { window.faults.write[key] = 0; window.lifecycle('active'); }, themeKey);
    await theme.page.waitForFunction(key => window.diskGet(key) === 'royalAmethyst', themeKey);
    await theme.page.reload(); await installFaults(theme.page); await mount(theme.page); await ready(theme.page);
    assert.equal(await theme.page.evaluate(() => window.storageAPI.themePersistence.getSnapshot().value), 'royalAmethyst');
    assert.deepEqual(JSON.parse(await disk(theme.page)), saved);
    results.push({ scenario: 'Theme read failure, write failure, foreground recovery and restart', passed: true });
    await theme.context.close();

    const galleryFailure = await open();
    await ready(galleryFailure.page);
    await galleryFailure.page.getByRole('button', { name: 'القائمة والإعدادات' }).click();
    await galleryFailure.page.getByRole('button', { name: /استعراض المظاهر/ }).click();
    await galleryFailure.page.evaluate(key => { window.faults.write[key] = 100; }, themeKey);
    await galleryFailure.page.getByRole('radiogroup', { name: 'المظاهر' }).getByRole('radio').nth(1).click();
    await galleryFailure.page.getByText('التغييرات لم تُحفظ بعد', { exact: true }).last().waitFor();
    await galleryFailure.page.screenshot({ path: path.join(output, 'theme-gallery-unsaved.png') });
    assert.equal(await disk(galleryFailure.page, themeKey), 'softIvory');
    await galleryFailure.page.evaluate(key => { window.faults.write[key] = 0; }, themeKey);
    await galleryFailure.page.getByRole('button', { name: 'إعادة محاولة الحفظ' }).last().click();
    await galleryFailure.page.waitForFunction(key => window.diskGet(key) === 'royalAmethyst', themeKey);
    assert.deepEqual(JSON.parse(await disk(galleryFailure.page)), saved);
    results.push({ scenario: 'Theme gallery displays save failure and retry inside the open modal', passed: true });
    await galleryFailure.context.close();

    const settings = await open(); await ready(settings.page);
    await settings.page.evaluate(() => {
      const store = window.storageAPI.counterPersistence;
      store.update(value => ({ ...value, hapticsEnabled: true, visualEffectsEnabled: true, fullScreenTap: true, target: 7 }));
      window.lifecycle('background');
    });
    await settings.page.waitForFunction(key => JSON.parse(window.diskGet(key)).fullScreenTap === true, counterKey);
    await settings.page.reload(); await installFaults(settings.page); await mount(settings.page);
    await settings.page.getByRole('button', { name: 'النقر الحر', exact: true }).last().waitFor();
    const restored = await settings.page.evaluate(() => window.storageAPI.counterPersistence.getSnapshot().value);
    assert.deepEqual(restored, { ...saved, hapticsEnabled: true, visualEffectsEnabled: true, fullScreenTap: true, target: 7 });
    results.push({ scenario: 'Settings, Free Tap, target and progress restore on restart', passed: true });
    await settings.context.close();

    for (const raw of ['', '{broken', 'null', '[]', '{"count":-1,"totalSessionCount":500}', '{"count":202,"totalSessionCount":"500"}']) {
      const corrupt = await open({ raw });
      await corrupt.page.getByText('تعذّر استعادة البيانات', { exact: true }).waitFor();
      await corrupt.page.evaluate(() => window.lifecycle('background'));
      assert.equal(await disk(corrupt.page), raw);
      assert.equal(await corrupt.page.evaluate(() => window.attempts.write.length), 0);
      if (raw === '') {
        await corrupt.page.evaluate(({ key, value }) => window.diskSet(key, value), { key: counterKey, value: JSON.stringify(saved) });
        await corrupt.page.getByRole('button', { name: 'إعادة محاولة استعادة البيانات' }).click();
        await ready(corrupt.page);
        assert.deepEqual(JSON.parse(await disk(corrupt.page)), saved);
        assert.equal(await corrupt.page.evaluate(() => window.attempts.write.length), 0);
      }
      await corrupt.context.close();
    }
    results.push({ scenario: 'Empty/malformed/invalid progress is preserved; empty payload recovers through retry', cases: 6 });

    const uncertain = await open({ state: null, faults: { keys: true } });
    await uncertain.page.getByText('تعذّر استعادة البيانات', { exact: true }).waitFor();
    await uncertain.page.evaluate(() => window.lifecycle('background'));
    assert.equal(await disk(uncertain.page), null);
    assert.equal(await uncertain.page.evaluate(() => window.attempts.write.length), 0);
    await uncertain.page.evaluate(() => { window.faults.keys = false; });
    await uncertain.page.getByRole('button', { name: 'إعادة محاولة استعادة البيانات' }).click();
    await ready(uncertain.page, 0);
    assert.equal(await disk(uncertain.page), null);
    await counter(uncertain.page).click();
    await persisted(uncertain.page, 1, 1);
    results.push({ scenario: 'Null read plus failed web enumeration blocks defaults until verified absence', passed: true });
    await uncertain.context.close();

    const emptyTheme = await open({ theme: '' });
    await emptyTheme.page.getByText('تعذّر استعادة البيانات', { exact: true }).waitFor();
    assert.equal(await disk(emptyTheme.page, themeKey), '');
    assert.deepEqual(JSON.parse(await disk(emptyTheme.page)), saved);
    assert.equal(await emptyTheme.page.evaluate(() => window.attempts.write.length), 0);
    await emptyTheme.page.evaluate(key => window.diskSet(key, 'softIvory'), themeKey);
    await emptyTheme.page.getByRole('button', { name: 'إعادة محاولة استعادة البيانات' }).click();
    await ready(emptyTheme.page);
    assert.equal(await disk(emptyTheme.page, themeKey), 'softIvory');
    assert.equal(await emptyTheme.page.evaluate(() => window.attempts.write.length), 0);
    results.push({ scenario: 'Existing empty web theme blocks startup and restores valid theme after recovery', passed: true });
    await emptyTheme.context.close();

    const legacy = await open({ state: { count: 202, target: 33, cycle: 9 } });
    await ready(legacy.page);
    assert.deepEqual(JSON.parse(await disk(legacy.page)), { count: 202, target: 33, cycle: 9 });
    await counter(legacy.page).click(); await persisted(legacy.page, 203, 203);
    assert.equal(JSON.parse(await disk(legacy.page)).visualEffectsEnabled, true);
    results.push({ scenario: 'Existing legacy migration preserves saved data until an actual update', passed: true });
    await legacy.context.close();

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ environment: 'Actual React Native Web app, mocked native APIs, isolated browser contexts', results, errors }, null, 2));
    console.log(JSON.stringify({ output, scenarios: results.length, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
