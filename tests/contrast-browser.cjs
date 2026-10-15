// Browser regression harness: actual app code; mocked native APIs and OS events.
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
// RN Web does not implement OS Dynamic Type. This explicit shim exercises layout
// branches and scaled type; native auto-fit/VoiceOver/TalkBack still need devices.
const fontScale = Number(process.env.ZEKR_QA_FONT_SCALE || 1);
mocks['rn.ts'] += `
import React from 'react';
import { Text as NativeText, StyleSheet, useWindowDimensions as nativeDimensions } from 'react-native-web';
export const useWindowDimensions = () => ({...nativeDimensions(), fontScale: ${fontScale}});
export const Text = React.forwardRef((props: any, ref: any) => {
 const style = StyleSheet.flatten(props.style) || {};
 const scale = props.allowFontScaling === false ? 1 : Math.min(${fontScale}, props.maxFontSizeMultiplier || Infinity);
 return React.createElement(NativeText, {...props, ref, style: [props.style, {
   ...(style.fontSize ? {fontSize: style.fontSize * scale} : {}),
   ...(style.lineHeight ? {lineHeight: style.lineHeight * scale} : {})
 }]});
});
`;
for (const [name, source] of Object.entries(mocks)) fs.writeFileSync(path.join(scratch, name), source);
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `import React from 'react'; import { createRoot } from 'react-dom/client'; import App from ${JSON.stringify(path.join(root, 'App.tsx'))}; window.mountApp = (strict = false) => createRoot(document.getElementById('root')).render(strict ? <React.StrictMode><App/></React.StrictMode> : <App/>);`);
async function run() {
await esbuild.build({
  entryPoints: [path.join(scratch, 'entry.tsx')], bundle: true, outfile: path.join(scratch, 'bundle.js'), jsx: 'automatic',
  nodePaths: [qaModules, path.join(root, 'node_modules')],
  plugins: process.env.ZEKR_QA_BASELINE_THEME ? [{ name: 'before-theme', setup(build) {
    build.onLoad({ filter: /src\/theme\.ts$/ }, () => ({ contents: fs.readFileSync(process.env.ZEKR_QA_BASELINE_THEME, 'utf8'), loader: 'ts', resolveDir: path.join(root, 'src') }));
  }}] : [],
  alias: { react: path.dirname(resolveQA('react/package.json')), 'react-dom': path.dirname(resolveQA('react-dom/package.json')), 'react-native': path.join(scratch, 'rn.ts'), 'expo-splash-screen': path.join(scratch, 'splash.ts'), 'expo-haptics': path.join(scratch, 'haptics.ts'), 'react-native-safe-area-context': path.join(scratch, 'safe.tsx') },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'], loader: { '.png': 'dataurl', '.ttf': 'dataurl' },
  define: { global: 'globalThis', __DEV__: 'true', 'process.env.NODE_ENV': '"development"', 'process.env.EXPO_OS': '"web"' },
});
const bundle = fs.readFileSync(path.join(scratch, 'bundle.js'), 'utf8');
const output = process.env.ZEKR_QA_OUTPUT ? path.resolve(process.env.ZEKR_QA_OUTPUT) : path.join(scratch, 'results');
fs.mkdirSync(output, { recursive: true });

 const browser=await chromium.launch({headless:true,...(process.env.ZEKR_QA_CHROME ? {executablePath:process.env.ZEKR_QA_CHROME} : {})});
 const phase=process.env.QA_PHASE || 'after';
 const results=[];
 for(const theme of (process.env.ZEKR_QA_THEMES || 'softIvory,midnightSapphire,royalAmethyst,obsidianEmber,glacierPrism,solarPulse').split(',')) {
  const context=await browser.newContext({viewport:{width:Number(process.env.ZEKR_QA_WIDTH || 390),height:Number(process.env.ZEKR_QA_HEIGHT || 844)},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://qa.zekr.test/**',r=>r.fulfill({contentType:'text/html',body:'<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>'}));
  await page.goto('http://qa.zekr.test');
  await page.evaluate(t=>{localStorage.setItem('@dhikr/theme/v1',t);localStorage.setItem('@dhikr/counter-state/v1',JSON.stringify({count:44,target:33,totalSessionCount:44,hapticsEnabled:false,visualEffectsEnabled:false}));},theme);
  await page.addScriptTag({content:bundle}); await page.evaluate(()=>window.mountApp());
  const counter=page.getByRole('button',{name:/^عدّاد /}); await counter.waitFor(); await page.waitForTimeout(1100);
  await page.screenshot({path:`${output}/${phase}-${theme}-main.png`});
  if (page.viewportSize().width <= 320) {
    await counter.scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/${phase}-${theme}-main-counter.png`});
  }
  assert.equal(await page.getByTestId('central-counter-text').textContent(),'٤٤');
  await page.getByRole('button',{name:'النقر الحر',exact:true}).click();
  const free=page.getByRole('button',{name:'النقر الحر',exact:true}).last(); await free.waitFor();
  await page.screenshot({path:`${output}/${phase}-${theme}-free.png`});
  await page.getByRole('button',{name:'إنهاء وضع النقر الحر'}).click();
  await page.getByRole('button',{name:'القائمة والإعدادات'}).click();
  await page.screenshot({path:`${output}/${phase}-${theme}-settings.png`});
  await page.getByRole('button',{name:/استعراض المظاهر/}).click();
  const radios=page.getByRole('radiogroup',{name:'المظاهر'}).getByRole('radio');
  assert.equal(await radios.count(),6);
  assert.equal(await radios.filter({has:page.getByText('مفعّل',{exact:true})}).count(),1);
  await page.screenshot({path:`${output}/${phase}-${theme}-gallery.png`});
  await radios.last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await page.screenshot({path:`${output}/${phase}-${theme}-gallery-scrolled.png`});
  await radios.first().scrollIntoViewIfNeeded();
  const radioState=await radios.evaluateAll(es=>es.map(e=>({label:e.getAttribute('aria-label'),checked:e.getAttribute('aria-checked'),selected:e.getAttribute('aria-selected')})));
  // Selected state is exposed in addition to the checkmark and selected border.
  const themeLabels = {
    softIvory: 'العاجي الهادئ',
    midnightSapphire: 'ياقوت الليل',
    royalAmethyst: 'الجمشت الملكي',
    obsidianEmber: 'جمر الليل',
    glacierPrism: 'طيف الجليد',
    solarPulse: 'نبض الشمس',
  };
  const selected = page.getByRole('radio', {name: new RegExp(themeLabels[theme] || theme)});
  const readState = element => {
    let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
    while (fiber && !fiber.memoizedProps?.accessibilityState) fiber = fiber.return;
    return fiber?.memoizedProps.accessibilityState;
  };
  const nativeSelectedState = await selected.evaluate(readState);
  assert.deepEqual(nativeSelectedState, {checked:true, selected:true});
  await radios.first().click();
  await page.waitForTimeout(80);
  assert.deepEqual(await radios.first().evaluate(readState), {checked:true, selected:true});
  await selected.click();
  await page.waitForTimeout(80);
  await page.getByRole('button',{name:'العودة إلى الإعدادات',exact:true}).first().click();
  const toggle = page.getByRole('switch',{name:'الاهتزاز اللمسي',exact:true});
  await toggle.click();
  assert.equal(await toggle.isChecked(),true);
  await page.waitForTimeout(120);
  // RN Web ignores native thumbColor while ON; inspect the real React props.
  const switchProps = await toggle.evaluate(element => {
    let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
    while (fiber && !fiber.memoizedProps?.thumbColor) fiber = fiber.return;
    const props = [fiber?.memoizedProps, fiber?.alternate?.memoizedProps].find(props => props?.value === true);
    return {thumb: props?.thumbColor, track: props?.trackColor};
  });
  assert.ok(switchProps.thumb);
  if (theme === 'softIvory' && !process.env.ZEKR_QA_BASELINE_THEME) {
    assert.equal(switchProps.thumb, '#FFF9F0');
    assert.equal(switchProps.track.true, '#A65E51');
  }
  if (theme === 'glacierPrism' && !process.env.ZEKR_QA_BASELINE_THEME) {
    assert.equal(switchProps.thumb, '#FFFFFF');
    assert.equal(switchProps.track.true, '#087F99');
  }
  await page.screenshot({path:`${output}/${phase}-${theme}-switch-on.png`});
  assert.equal(await page.getByText('٤٤',{exact:true}).count() > 0,true);
  if (['softIvory', 'obsidianEmber', 'glacierPrism', 'solarPulse'].includes(theme) && fontScale === 1 && page.viewportSize().width === 390) {
    await page.getByText('تصفير الإحصائيات', {exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/${phase}-${theme}-settings-stats.png`});
    await page.getByText('تصفير الإحصائيات', {exact:true}).click();
    await page.getByRole('button',{name:'نعم، حذف وتصفير',exact:true}).waitFor();
    await page.screenshot({path:`${output}/${phase}-${theme}-danger.png`});
    await page.getByRole('button',{name:'إلغاء',exact:true}).click();
    await page.getByRole('button',{name:'تم',exact:true}).click();
    const burst = async (component, count) => page.evaluate(({component,count}) => {
      const element = Array.from(document.querySelectorAll(component === 'CounterRing' ? '[aria-label^="عدّاد "]' : '[aria-label="النقر الحر"]')).at(-1);
      let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && fiber.type?.name !== component) fiber = fiber.return;
      for (let i=0; i<count; i++) (component === 'CounterRing' ? fiber.memoizedProps.onPress : fiber.memoizedProps.onTap)();
    },{component,count});
    await burst('CounterRing',22);
    await page.getByText('اكتمل الهدف ٦٦',{exact:true}).waitFor();
    await page.screenshot({path:`${output}/${phase}-${theme}-completion-main.png`});
    await page.getByRole('button',{name:'النقر الحر',exact:true}).click();
    await burst('FreeTapMode',33);
    await page.getByText('اكتمل الهدف ٩٩',{exact:true}).last().waitFor();
    await page.screenshot({path:`${output}/${phase}-${theme}-completion-free.png`});
  }
  assert.deepEqual(errors,[]);
  results.push({theme,fontScale,viewport:page.viewportSize(),switchProps,nativeSelectedState,errors,radios:radioState});
  await context.close();
 }
 fs.writeFileSync(`${output}/${phase}-browser-results.json`,JSON.stringify(results,null,2));
 const compPage = await browser.newPage({ viewport: { width: 1400, height: 750 }, deviceScaleFactor: 2 });
 const themeList = ['midnightSapphire', 'royalAmethyst', 'softIvory', 'obsidianEmber', 'glacierPrism', 'solarPulse'];
 const themeTitles = {
   midnightSapphire: 'Midnight Sapphire<br><span style="color:#F0CF91;font-size:15px">ياقوت الليل</span>',
   royalAmethyst: 'Royal Amethyst<br><span style="color:#F4B7A7;font-size:15px">الجمشت الملكي</span>',
   softIvory: 'Soft Ivory<br><span style="color:#C77C65;font-size:15px">العاجي الهادئ</span>',
   obsidianEmber: 'Obsidian Ember<br><span style="color:#FF794F;font-size:15px">جمر الليل</span>',
   glacierPrism: 'Glacier Prism<br><span style="color:#087F99;font-size:15px">طيف الجليد</span>',
   solarPulse: 'Solar Pulse<br><span style="color:#FF866B;font-size:15px">نبض الشمس</span>',
 };
 const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
 body { margin: 0; padding: 28px 20px; background: #0A0D14; font-family: -apple-system, system-ui, sans-serif; color: #F0F4F8; text-align: center; }
 h1 { font-size: 26px; margin: 0 0 6px; font-weight: 800; letter-spacing: -0.5px; }
 p.subtitle { color: #8C99A8; font-size: 13px; margin: 0 0 24px; }
 .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; max-width: 1360px; margin: 0 auto; }
 .item { display: flex; flex-direction: column; align-items: center; }
 .label { font-size: 13px; font-weight: 700; margin-bottom: 10px; line-height: 1.4; min-height: 42px; }
 img { width: 100%; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.12); }
</style>
</head>
<body>
 <h1>ذِكْر — تشكيلة المظاهر الستة الفاخرة</h1>
 <p class="subtitle">Zekr — Expand Theme Collection to Six Premium Themes</p>
 <div class="grid">
   ${themeList.map(t => `
     <div class="item">
       <div class="label">${themeTitles[t]}</div>
       <img src="data:image/png;base64,${fs.readFileSync(`${output}/${phase}-${t}-main.png`).toString('base64')}">
     </div>
   `).join('')}
 </div>
</body>
</html>`;
 await compPage.setContent(html);
 await compPage.waitForTimeout(300);
 await compPage.screenshot({ path: `${output}/all-six-themes-comparison.png`, fullPage: true });
 await compPage.close();
 await browser.close(); console.log(output);
}
run().catch(e=>{console.error(e);process.exit(1)});
