// Milestone browser regression harness: actual app code; mocked native APIs and OS events.
// QA packages live outside the application dependency tree (see docs/launch).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const qaModules = process.env.ZEKR_QA_MODULES || path.join(root, 'node_modules');
const resolveQA = name => require.resolve(name, { paths: [qaModules] });
const esbuild = require(resolveQA('esbuild'));
const { chromium } = require(process.env.ZEKR_QA_PLAYWRIGHT || resolveQA('playwright'));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'zekr-launch-qa-'));
const mocks = {
  "rn.ts": "export * from 'react-native-web';\nconst listeners = new Set<(value: string) => void>();\nconst motionListeners = new Set<(value: boolean) => void>();\nexport const AppState = { currentState: 'active', addEventListener: (_: string, fn: (value: string) => void) => { listeners.add(fn); return { remove: () => listeners.delete(fn) }; } };\nexport const AccessibilityInfo = { announceForAccessibility: (message: string) => { ((window as any).qa.announcements ??= []).push(message); }, isReduceMotionEnabled: () => new Promise<boolean>(resolve => setTimeout(() => resolve(matchMedia('(prefers-reduced-motion: reduce)').matches), (window as any).qa.motionDelay || 0)), addEventListener: (_: string, fn: (value: boolean) => void) => { motionListeners.add(fn); return { remove: () => motionListeners.delete(fn) }; } };\n(window as any).qa = { background: () => listeners.forEach(fn => fn('background')), foreground: () => listeners.forEach(fn => fn('active')), starts: [], reduce: () => motionListeners.forEach(fn => fn(true)) };\nimport { Animated } from 'react-native-web';\nconst parallel = Animated.parallel; Animated.parallel = (items: any[], config: any) => { if (items.length > 12) (window as any).qa.starts.push(performance.now()); return parallel(items, config); };\n(window as any).qa.failAnimation = () => { const original = Animated.parallel; Animated.parallel = (animations: any[], config: any) => { if (animations.length > 12) throw new Error('QA: launch animation unavailable'); return original(animations, config); }; };\n(window as any).qa.unknownMotion = () => { AccessibilityInfo.isReduceMotionEnabled = () => new Promise(() => {}); };\n",
  "safe.tsx": "import React from 'react';\nexport const useSafeAreaInsets = () => ({top: 24, bottom: 24, left:0, right:0});\nexport const SafeAreaProvider = ({children}: any) => <>{children}</>;\n",
  "splash.ts": "export const preventAutoHideAsync = async () => {};\nexport const hideAsync = async () => { (window as any).nativeHides = ((window as any).nativeHides || 0) + 1; (window as any).hideAt = performance.now(); };\nexport const setOptions = () => {};\n",
  "haptics.ts": "export const NotificationFeedbackType = { Success:'success', Warning:'warning' };\nexport const ImpactFeedbackStyle = { Light:'tap' };\nexport const notificationAsync = async (value: string) => { ((window as any).qa.haptics ??= []).push(value); };\nexport const impactAsync = async (value: string) => { ((window as any).qa.haptics ??= []).push(value); };\n"
};
for (const [name, source] of Object.entries(mocks)) fs.writeFileSync(path.join(scratch, name), source);
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `import React from 'react'; import { createRoot } from 'react-dom/client'; import App from ${JSON.stringify(path.join(root, 'App.tsx'))}; window.mountApp = () => createRoot(document.getElementById('root')).render(<App/>);`);
esbuild.buildSync({
  entryPoints: [path.join(scratch, 'entry.tsx')], bundle: true, outfile: path.join(scratch, 'bundle.js'), jsx: 'automatic',
  nodePaths: [qaModules, path.join(root, 'node_modules')],
  alias: { react: path.dirname(resolveQA('react/package.json')), 'react-dom': path.dirname(resolveQA('react-dom/package.json')), 'react-native': path.join(scratch, 'rn.ts'), 'expo-splash-screen': path.join(scratch, 'splash.ts'), 'expo-haptics': path.join(scratch, 'haptics.ts'), 'react-native-safe-area-context': path.join(scratch, 'safe.tsx') },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'], loader: { '.png': 'dataurl', '.ttf': 'dataurl' },
  define: { global: 'globalThis', __DEV__: 'true', 'process.env.NODE_ENV': '"development"', 'process.env.EXPO_OS': '"web"' },
});
const bundle = fs.readFileSync(path.join(scratch, 'bundle.js'), 'utf8');
const output = path.join(root, 'docs', 'milestones');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.ZEKR_QA_CHROME ? { executablePath: process.env.ZEKR_QA_CHROME } : {}) });
  const results = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('http://qa.zekr.test/**', route => route.fulfill({ contentType: 'text/html', body: '<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>' }));
  await page.goto('http://qa.zekr.test');
  await page.evaluate(() => localStorage.setItem('@dhikr/counter-state/v1', JSON.stringify({ count: 32, target: 33, cycle: 8, totalSessionCount: 90, hapticsEnabled: true, visualEffectsEnabled: true })));
  async function mount() {
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => window.mountApp());
    await page.waitForFunction(() => window.nativeHides === 1);
    await page.waitForTimeout(100);
  }
  const counter = () => page.getByRole('button', { name: /^عدّاد / });
  async function value(locator, expected) {
    await page.waitForFunction(({label, expected}) => {
      const element = Array.from(document.querySelectorAll(`[aria-label="${label}"]`)).at(-1);
      if (!element) return false;
      let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && !fiber.memoizedProps?.accessibilityValue) fiber = fiber.return;
      return fiber?.memoizedProps.accessibilityValue.text === expected ||
        fiber?.alternate?.memoizedProps.accessibilityValue?.text === expected;
    }, { label: await locator.getAttribute('aria-label'), expected });
    await page.getByText(expected, {exact: true}).first().waitFor();
  }
  async function burst(taps, component = 'CounterRing') {
    await page.evaluate(({taps, component}) => {
      const element = Array.from(document.querySelectorAll(component === 'CounterRing' ? '[aria-label^="عدّاد "]' : '[aria-label="النقر الحر"]')).at(-1);
      let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && fiber.type?.name !== component) fiber = fiber.return;
      if (!fiber) throw new Error('Tap callback not found');
      for (let i = 0; i < taps; i++) (component === 'CounterRing' ? fiber.memoizedProps.onPress : fiber.memoizedProps.onTap)();
    }, { taps, component });
  }
  await mount();
  await value(counter(), '٣٢ من ٣٣');
  assert.equal(await page.getByText('اكتمل الهدف', { exact: false }).count(), 0);
  await counter().click();
  await value(counter(), '٣٣ من ٣٣');
  await page.getByText('اكتمل الهدف ٣٣', {exact: true}).waitFor();
  await page.screenshot({path: output + '/33-complete-browser.png'});
  await counter().click();
  await value(counter(), '٣٤ من ٦٦');
  assert.equal(await page.getByText('اكتمل الهدف ٣٣', {exact: true}).count(), 0);
  await burst(10);
  await value(counter(), '٤٤ من ٦٦');
  const ring = await counter().evaluate(element => {
    const svg = element.parentElement.parentElement.querySelector('svg');
    return {
      activeBeads: svg.querySelectorAll('circle[r="7.2"][fill="url(#activeBeadSphere)"]').length,
      dash: Number(svg.querySelector('circle[r="157"][stroke="url(#progressStroke)"]').getAttribute('stroke-dashoffset')),
    };
  });
  assert.equal(ring.activeBeads, 11);
  assert.ok(Math.abs(ring.dash - 2 * Math.PI * 157 * 2 / 3) < 0.001);
  await page.screenshot({path: output + '/44-of-66-browser.png'});
  await burst(22);
  await value(counter(), '٦٦ من ٦٦');
  await page.waitForTimeout(1000);
  assert.equal(await page.getByText('اكتمل الهدف ٦٦', {exact: true}).count(), 0);
  await counter().click();
  await value(counter(), '٦٧ من ٩٩');
  await page.getByRole('button', {name: 'تراجع', exact: true}).click();
  await value(counter(), '٦٦ من ٦٦');
  assert.equal(await page.getByText('اكتمل الهدف ٦٦', {exact: true}).count(), 0);
  assert.deepEqual(await page.evaluate(() => window.qa.announcements), ['اكتمل الهدف ٣٣', 'اكتمل الهدف ٦٦']);
  results.push('32 → 33 → 34 → 44 → 66 → 67 → undo 66: cumulative labels, temporary completion and tap-only announcements pass.');
  await page.getByRole('radio', {name: 'الهدف ١٠٠', exact: true}).click();
  await value(counter(), '٦٦ من ١٠٠');
  await burst(35);
  await value(counter(), '١٠١ من ٢٠٠');
  assert.equal(await page.getByRole('button', {name: 'بدء الدورة التالية'}).count(), 0);
  assert.deepEqual(await page.evaluate(() => window.qa.announcements), ['اكتمل الهدف ٣٣', 'اكتمل الهدف ٦٦', 'اكتمل الهدف ١٠٠']);
  results.push('Goal change preserves count; 35 batched taps cross 100 with exactly one completion.');
  await page.getByRole('button', {name: 'النقر الحر', exact: true}).click();
  const free = page.getByRole('button', {name: 'النقر الحر', exact: true}).last();
  await value(free, '١٠١ من ٢٠٠');
  await burst(99, 'FreeTapMode');
  await value(free, '٢٠٠ من ٢٠٠');
  await page.screenshot({path: output + '/free-200-browser.png'});
  await free.click({position: {x: 10, y: 300}});
  await value(free, '٢٠١ من ٣٠٠');
  await page.screenshot({path: output + '/free-201-browser.png'});
  await page.waitForTimeout(450);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('@dhikr/counter-state/v1')));
  assert.equal(saved.count, 201); assert.equal(saved.target, 100); assert.equal(saved.fullScreenTap, true);
  await page.reload(); await mount();
  await value(free, '٢٠١ من ٣٠٠');
  assert.equal(await page.evaluate(() => (window.qa.announcements || []).length), 0);
  assert.equal(await page.evaluate(() => (window.qa.haptics || []).length), 0);
  results.push('Free Tap crosses 200; reload restores count, base target and mode without completion replay.');
  await page.getByRole('button', {name: 'إنهاء وضع النقر الحر'}).click();
  await page.getByRole('button', {name: 'القائمة والإعدادات'}).click();
  await page.getByRole('button', {name: /استعراض المظاهر/}).click();
  const gallery = page.getByRole('radiogroup', {name: 'المظاهر'});
  await gallery.getByRole('radio').nth(1).click();
  // The gallery stays open while applying a theme; close its labelled dialog.
  await page.getByRole('button', {name: 'العودة إلى الإعدادات', exact: true}).first().click();
  const close = page.getByRole('button', {name: /إغلاق/});
  while (await close.count()) { await close.last().click(); }
  await value(counter(), '٢٠١ من ٣٠٠');
  await page.screenshot({path: output + '/theme-active-browser.png'});
  await page.waitForTimeout(450);
  const selectedTheme = await page.evaluate(() => localStorage.getItem('@dhikr/theme/v1'));
  assert.ok(selectedTheme);
  await page.reload(); await mount();
  await value(counter(), '٢٠١ من ٣٠٠');
  assert.equal(await page.evaluate(() => localStorage.getItem('@dhikr/theme/v1')), selectedTheme);
  assert.equal(await page.evaluate(() => (window.qa.announcements || []).length), 0);
  await page.getByRole('button', {name: 'إعادة تعيين', exact: true}).click();
  await page.getByRole('button', {name: 'نعم، ابدأ من جديد', exact: true}).click();
  await value(counter(), '٠ من ١٠٠');
  await page.getByRole('radio', {name: 'هدف مخصص', exact: true}).click();
  await page.getByRole('textbox', {name: 'الهدف المخصص'}).fill('٧');
  await page.getByRole('button', {name: 'حفظ الهدف', exact: true}).click();
  await burst(7);
  await value(counter(), '٧ من ٧');
  await counter().click();
  await value(counter(), '٨ من ١٤');
  await page.getByRole('radio', {name: /هدف مخصص، الحالي/}).click();
  await page.getByRole('textbox', {name: 'الهدف المخصص'}).fill('٤٠');
  await page.getByRole('button', {name: 'حفظ الهدف', exact: true}).click();
  await value(counter(), '٨ من ٤٠');
  await burst(32);
  await value(counter(), '٤٠ من ٤٠');
  await page.waitForTimeout(450);
  await page.reload(); await mount();
  await value(counter(), '٤٠ من ٤٠');
  assert.equal(await page.getByText('اكتمل الهدف ٤٠', {exact: true}).count(), 0);
  assert.equal(await page.evaluate(() => (window.qa.announcements || []).length), 0);
  results.push('Custom Arabic input goals 7 and 40 preserve count, cross boundaries, and restore at an exact milestone without replay.');
  results.push('Theme switching and theme restoration preserve progression; reset returns to 0 and first milestone.');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.reload(); await mount();
  await page.waitForTimeout(150);
  assert.equal(await page.getByText('اكتمل الهدف ٤٠', {exact: true}).count(), 0);
  await counter().click();
  await value(counter(), '٤١ من ٨٠');
  await page.waitForTimeout(300);
  results.push('Motion enabled: restoration does not start completion feedback; next interval continues immediately.');
  assert.deepEqual(errors, []);
  await browser.close();
  fs.writeFileSync(output + '/browser-qa-results.json', JSON.stringify({environment: 'Actual app rendered through React Native Web in Chromium, mocked native APIs. No physical device or native simulator testing.', results}, null, 2));
  console.log(results.join('\n'));
})().catch(error => { console.error(error); process.exit(1); });
