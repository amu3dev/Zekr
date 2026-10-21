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
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `import React from 'react'; import { createRoot } from 'react-dom/client';
import App from ${JSON.stringify(path.join(root, 'App.tsx'))};
import { CounterRing } from ${JSON.stringify(path.join(root, 'src/components/CounterRing.tsx'))};
import { FreeTapMode } from ${JSON.stringify(path.join(root, 'src/components/FreeTapMode.tsx'))};
import { ThemeContext, THEMES } from ${JSON.stringify(path.join(root, 'src/theme.ts'))};
import { DHIKR_OPTIONS } from ${JSON.stringify(path.join(root, 'src/counter.ts'))};
window.mountApp = () => createRoot(document.getElementById('root')).render(<App/>);
// Separate component fixture: no persistence owner, storage reads or writes.
let fixtureRoot;
window.renderMilestoneFixture = (mode, count, target, size) => {
  fixtureRoot ??= createRoot(document.getElementById('root'));
  fixtureRoot.render(<ThemeContext.Provider value={{themeId:'midnightSapphire',theme:THEMES.midnightSapphire,
    isReady:true,hydration:'ready',saveStatus:'saved',setThemeId:()=>{}}}>
    {mode === 'main' ? <CounterRing size={size} count={count} target={target} title="اختبار" completion={null}
      effectsEnabled={false} onPress={()=>{}}/> : <FreeTapMode count={count} target={target} dhikr={DHIKR_OPTIONS[0]}
      completion={null} effectsEnabled={false} topInset={24} bottomInset={24} onTap={()=>{}} onExit={()=>{}}/>}
  </ThemeContext.Provider>);
};`);
esbuild.buildSync({
  entryPoints: [path.join(scratch, 'entry.tsx')], bundle: true, outfile: path.join(scratch, 'bundle.js'), jsx: 'automatic',
  nodePaths: [qaModules, path.join(root, 'node_modules')],
  alias: { react: path.dirname(resolveQA('react/package.json')), 'react-dom': path.dirname(resolveQA('react-dom/package.json')), 'react-native': path.join(scratch, 'rn.ts'), 'expo-splash-screen': path.join(scratch, 'splash.ts'), 'expo-haptics': path.join(scratch, 'haptics.ts'), 'react-native-safe-area-context': path.join(scratch, 'safe.tsx') },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'], loader: { '.png': 'dataurl', '.ttf': 'dataurl' },
  define: { global: 'globalThis', __DEV__: 'true', 'process.env.NODE_ENV': '"development"', 'process.env.EXPO_OS': '"web"' },
});
const bundle = fs.readFileSync(path.join(scratch, 'bundle.js'), 'utf8');
const output = process.env.ZEKR_QA_OUTPUT ? path.resolve(process.env.ZEKR_QA_OUTPUT) : path.join(scratch, 'results');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, chromiumSandbox: true, ...(process.env.ZEKR_QA_CHROME ? { executablePath: process.env.ZEKR_QA_CHROME } : {}) });
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
  async function value(locator, count, target, testPage = page) {
    const arabic = value => String(value).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
    const milestone = Math.max(1, Math.ceil(count / target)) * target;
    const visible = `${arabic(count)} من ${arabic(milestone)}`;
    const expected = `${arabic(count)} تسبيحة، ${visible} في الهدف الحالي`;
    const hint = `تقدّم الحلقة في الفترة الحالية: ${arabic(count === 0 ? 0 : ((count - 1) % target) + 1)} من ${arabic(target)}`;
    await testPage.waitForFunction(({label, expected, hint}) => {
      const element = Array.from(document.querySelectorAll(`[aria-label="${label}"]`)).at(-1);
      if (!element) return false;
      let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && !fiber.memoizedProps?.accessibilityValue) fiber = fiber.return;
      return [fiber?.memoizedProps, fiber?.alternate?.memoizedProps].some(props =>
        props?.accessibilityValue?.text === expected && props.accessibilityHint?.endsWith(hint));
    }, { label: await locator.getAttribute('aria-label'), expected, hint });
    await testPage.getByText(visible, {exact: true}).first().waitFor();
    await testPage.getByText(arabic(count), {exact: true}).first().waitFor();
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
  await value(counter(), 32, 33);
  assert.equal(await page.getByText('اكتمل الهدف', { exact: false }).count(), 0);
  await counter().click();
  await value(counter(), 33, 33);
  await page.getByText('اكتمل الهدف ٣٣', {exact: true}).waitFor();
  await page.screenshot({path: output + '/33-complete-browser.png'});
  await counter().click();
  await value(counter(), 34, 33);
  assert.equal(await page.getByText('اكتمل الهدف ٣٣', {exact: true}).count(), 0);
  await burst(10);
  await value(counter(), 44, 33);
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
  await page.getByRole('button', {name: 'النقر الحر', exact: true}).click();
  await value(page.getByRole('button', {name: 'النقر الحر', exact: true}).last(), 44, 33);
  await page.screenshot({path: output + '/free-44-of-66-browser.png'});
  await page.getByRole('button', {name: 'إنهاء وضع النقر الحر'}).click();
  await value(counter(), 44, 33);
  await burst(22);
  await value(counter(), 66, 33);
  await page.waitForTimeout(1000);
  assert.equal(await page.getByText('اكتمل الهدف ٦٦', {exact: true}).count(), 0);
  await counter().click();
  await value(counter(), 67, 33);
  await page.getByRole('button', {name: 'تراجع', exact: true}).click();
  await value(counter(), 66, 33);
  assert.equal(await page.getByText('اكتمل الهدف ٦٦', {exact: true}).count(), 0);
  assert.deepEqual(await page.evaluate(() => window.qa.announcements), ['اكتمل الهدف ٣٣', 'اكتمل الهدف ٦٦']);
  results.push('32 → 33 → 34 → 44 → 66 → 67 → undo 66: cumulative milestone labels, unchanged interval ring, temporary completion and tap-only announcements pass.');
  await page.getByRole('radio', {name: 'الهدف ١٠٠', exact: true}).click();
  await value(counter(), 66, 100);
  await burst(35);
  await value(counter(), 101, 100);
  assert.equal(await page.getByRole('button', {name: 'بدء الدورة التالية'}).count(), 0);
  assert.deepEqual(await page.evaluate(() => window.qa.announcements), ['اكتمل الهدف ٣٣', 'اكتمل الهدف ٦٦', 'اكتمل الهدف ١٠٠']);
  results.push('Goal change preserves count; 35 batched taps cross 100 with exactly one completion.');
  await page.getByRole('button', {name: 'النقر الحر', exact: true}).click();
  const free = page.getByRole('button', {name: 'النقر الحر', exact: true}).last();
  await value(free, 101, 100);
  await burst(99, 'FreeTapMode');
  await value(free, 200, 100);
  await page.screenshot({path: output + '/free-200-browser.png'});
  await free.click({position: {x: 2, y: 300}});
  await value(free, 201, 100);
  await page.screenshot({path: output + '/free-201-browser.png'});
  await page.waitForTimeout(450);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('@dhikr/counter-state/v1')));
  assert.equal(saved.count, 201); assert.equal(saved.target, 100); assert.equal(saved.fullScreenTap, true);
  await page.reload(); await mount();
  await value(free, 201, 100);
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
  await close.last().click();
  await close.waitFor({state: 'detached'});
  await value(counter(), 201, 100);
  await page.screenshot({path: output + '/theme-active-browser.png'});
  await page.waitForTimeout(450);
  const selectedTheme = await page.evaluate(() => localStorage.getItem('@dhikr/theme/v1'));
  assert.ok(selectedTheme);
  await page.reload(); await mount();
  await value(counter(), 201, 100);
  assert.equal(await page.evaluate(() => localStorage.getItem('@dhikr/theme/v1')), selectedTheme);
  assert.equal(await page.evaluate(() => (window.qa.announcements || []).length), 0);
  await page.getByRole('button', {name: 'إعادة تعيين', exact: true}).click();
  await page.getByRole('button', {name: 'نعم، ابدأ من جديد', exact: true}).click();
  await value(counter(), 0, 100);
  await page.getByRole('radio', {name: 'هدف مخصص', exact: true}).click();
  await page.getByRole('textbox', {name: 'الهدف المخصص'}).fill('٧');
  await page.getByRole('button', {name: 'حفظ الهدف', exact: true}).click();
  await burst(7);
  await value(counter(), 7, 7);
  await counter().click();
  await value(counter(), 8, 7);
  await page.getByRole('radio', {name: /هدف مخصص، الحالي/}).click();
  await page.getByRole('textbox', {name: 'الهدف المخصص'}).fill('٤٠');
  await page.getByRole('button', {name: 'حفظ الهدف', exact: true}).click();
  await value(counter(), 8, 40);
  await burst(32);
  await value(counter(), 40, 40);
  await page.waitForTimeout(450);
  await page.reload(); await mount();
  await value(counter(), 40, 40);
  assert.equal(await page.getByText('اكتمل الهدف ٤٠', {exact: true}).count(), 0);
  assert.equal(await page.evaluate(() => (window.qa.announcements || []).length), 0);
  results.push('Custom Arabic input goals 7 and 40 preserve count, cross boundaries, and restore at an exact milestone without replay.');
  results.push('Theme switching and theme restoration preserve progression; reset returns to 0 and first milestone.');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.reload(); await mount();
  await page.waitForTimeout(150);
  assert.equal(await page.getByText('اكتمل الهدف ٤٠', {exact: true}).count(), 0);
  await counter().click();
  await value(counter(), 41, 40);
  await page.waitForTimeout(300);
  results.push('Motion enabled: restoration does not start completion feedback; next interval continues immediately.');
  await page.getByRole('radio', {name: /هدف مخصص، الحالي/}).click();
  await page.getByRole('textbox', {name: 'الهدف المخصص'}).fill('١');
  await page.getByRole('button', {name: 'حفظ الهدف', exact: true}).click();
  await page.evaluate(() => { window.qa.announcements = []; window.qa.haptics = []; });
  await burst(3);
  await value(counter(), 44, 1);
  assert.deepEqual(await page.evaluate(() => window.qa.announcements), []);
  assert.deepEqual(await page.evaluate(() => window.qa.haptics), ['tap', 'tap', 'tap']);
  assert.equal(await page.getByText('اكتمل الهدف', {exact: false}).count(), 0);
  await page.getByRole('button', {name: 'النقر الحر', exact: true}).click();
  await page.evaluate(() => { window.qa.announcements = []; window.qa.haptics = []; });
  await burst(3, 'FreeTapMode');
  await value(free, 47, 1);
  assert.deepEqual(await page.evaluate(() => window.qa.announcements), []);
  assert.deepEqual(await page.evaluate(() => window.qa.haptics), ['tap', 'tap', 'tap']);
  assert.equal(await page.getByText('اكتمل الهدف', {exact: false}).count(), 0);
  results.push('Goal 1 in both modes: count increments with ordinary tap haptics and no repeated completion text or announcements.');
  // Rendering regression: use the real reducer callback across the reported values.
  await page.reload();
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('@dhikr/counter-state/v1', JSON.stringify({ count: 32, target: 33, visualEffectsEnabled: true }));
  });
  await mount();
  let previousCount = 32;
  for (const count of [33, 66, 67, 99, 100, 103, 132, 133, 137, 999, 1000]) {
    await burst(count - previousCount);
    await value(counter(), count, 33);
    const text = page.getByTestId('central-counter-text');
    const box = await text.boundingBox();
    assert.ok(box && box.width > 0 && box.height > 0);
    assert.equal(await text.textContent(), String(count).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]));
    previousCount = count;
  }
  results.push('Reported Android counts: exact cumulative Arabic-Indic text at 33, 66, 67, 99, 100, 103, 132, 133, 137, 999 and 1000. Native font fitting is tested separately on Android.');

  // Round badge regression: verify cycle pill is compact and centered within the inner circle in Soft Ivory
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('@dhikr/counter-state/v1', JSON.stringify({ count: 201, target: 33, visualEffectsEnabled: true }));
    localStorage.setItem('@dhikr/theme/v1', 'softIvory');
  });
  await page.reload();
  await mount();
  const cycleText = page.getByText('الدورة السابعة', { exact: true });
  await cycleText.waitFor();
  const badgeMetrics = await page.evaluate(() => {
    const textNode = Array.from(document.querySelectorAll('*')).find(n => n.textContent === 'الدورة السابعة' && n.children.length === 0);
    const pill = textNode ? textNode.parentElement : null;
    const touchArea = pill ? pill.closest('[aria-label^="عدّاد "]') : null;
    if (!pill || !touchArea) return null;
    const pillRect = pill.getBoundingClientRect();
    const touchRect = touchArea.getBoundingClientRect();
    return {
      pillWidth: pillRect.width,
      pillCenterX: pillRect.left + pillRect.width / 2,
      touchWidth: touchRect.width,
      touchCenterX: touchRect.left + touchRect.width / 2,
      touchTop: touchRect.top,
      pillTop: pillRect.top,
      pillBottom: pillRect.bottom,
    };
  });
  assert.ok(badgeMetrics, 'Round badge and touch area must exist');
  assert.ok(badgeMetrics.pillWidth < badgeMetrics.touchWidth * 0.70, `Pill width ${badgeMetrics.pillWidth} must be < 70% of inner circle ${badgeMetrics.touchWidth}`);
  assert.ok(Math.abs(badgeMetrics.pillCenterX - badgeMetrics.touchCenterX) <= 2, `Pill center ${badgeMetrics.pillCenterX} must match touch center ${badgeMetrics.touchCenterX}`);
  assert.ok(badgeMetrics.pillTop >= badgeMetrics.touchTop, 'Pill top must be inside touch area');
  assert.ok(badgeMetrics.pillBottom <= badgeMetrics.touchTop + badgeMetrics.touchWidth * 0.28, 'Pill must stay above the central counter');
  results.push('Round badge regression: compact content-based width and horizontal centering within the inner circle pass in Soft Ivory.');
  // Render actual components with controlled props to cover large values without
  // generating artificial taps or writing derived values into application storage.
  const fixture = await context.newPage();
  fixture.on('pageerror', error => errors.push(error.message));
  await fixture.route('http://qa.zekr.test/**', route => route.fulfill({contentType:'text/html',
    body:'<html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;justify-content:center;align-items:center}</style></head><body><div id="root"></div></body></html>'}));
  await fixture.goto('http://qa.zekr.test');
  await fixture.addScriptTag({content:bundle});
  const matrix = [];
  const approved = new Map([[0,'٠ من ٣٣'],[32,'٣٢ من ٣٣'],[33,'٣٣ من ٣٣'],[34,'٣٤ من ٦٦'],
    [44,'٤٤ من ٦٦'],[66,'٦٦ من ٦٦'],[67,'٦٧ من ٩٩'],[99,'٩٩ من ٩٩'],[100,'١٠٠ من ١٣٢']]);
  async function checkFixture(mode, count, target) {
    await fixture.evaluate(({mode,count,target}) => window.renderMilestoneFixture(mode,count,target,Math.min(innerWidth - 28,350)), {mode,count,target});
    const control = fixture.getByRole('button', {name:mode === 'main' ? 'عدّاد اختبار' : 'النقر الحر', exact:true});
    await control.waitFor();
    await value(control,count,target,fixture);
    const ar = number => String(number).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
    const milestone = Math.max(1,Math.ceil(count/target))*target;
    const label = `${ar(count)} من ${ar(milestone)}`;
    if (target === 33 && approved.has(count)) assert.equal(label,approved.get(count));
    const geometry = await fixture.evaluate(mode => {
      const arc = document.querySelector(mode === 'main' ? '[stroke="url(#progressStroke)"]' : '[stroke="url(#freeTapProgress)"]');
      return {radius:Number(arc.getAttribute('r')),dash:Number(arc.getAttribute('stroke-dashoffset')),
        beads:document.querySelectorAll('circle[r="7.2"]').length,
        active:document.querySelectorAll('circle[r="7.2"][fill="url(#activeBeadSphere)"]').length};
    },mode);
    const interval = count === 0 ? 0 : ((count-1)%target)+1;
    assert.ok(Math.abs(geometry.dash - 2*Math.PI*geometry.radius*(1-interval/target)) < 0.001,
      `${mode} ${count}/${target}: ring must retain interval progress`);
    if (mode === 'main') {
      assert.equal(geometry.beads,33);
      assert.equal(geometry.active,count === 0 ? 0 : ((count-1)%33)+1);
    }
    const visible = fixture.getByText(label,{exact:true});
    const overflow = await visible.evaluate(element => element.scrollWidth > element.clientWidth + 1);
    assert.equal(overflow,false,`${mode} ${label}: milestone label must fit`);
    return {mode,count,target,label,interval,geometry};
  }
  for (const mode of ['main','free']) {
    for (const target of [1,7,25,33,40,99,100,1000,9999]) {
      for (const count of [0,1,6,7,25,32,33,34,44,65,66,67,98,99,100,132,999,1000,1001,9999,999999]) {
        matrix.push(await checkFixture(mode,count,target));
      }
    }
    for (const width of [320,390]) {
      await fixture.setViewportSize({width,height:844});
      for (const count of [44,999999]) {
        await checkFixture(mode,count,33);
        await fixture.screenshot({path:`${output}/${mode}-${count}-${width}.png`});
      }
    }
  }
  await fixture.close();
  fs.writeFileSync(output+'/presentation-matrix.json',JSON.stringify(matrix,null,2));
  results.push(`${matrix.length} rendered main/Free Tap contract cases: cumulative Arabic labels and accessibility values, interval ring offsets, 33-bead independence and large-count label fit pass.`);
  assert.deepEqual(errors, []);
  await browser.close();
  fs.writeFileSync(output + '/browser-qa-results.json', JSON.stringify({environment: 'Actual app rendered through React Native Web in Chromium, mocked native APIs. No physical device or native simulator testing.', results}, null, 2));
  console.log(results.join('\n'));
  console.log(`QA artifacts: ${output}`);
})().catch(error => { console.error(error); process.exit(1); });
