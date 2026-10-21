// Actual App rendered through React Native Web. Native APIs are mocked.
// QA dependencies stay external; captures default to ignored .qa-artifacts/.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const qaModules = process.env.ZEKR_QA_MODULES || path.join(root, 'node_modules');
const resolveQA = name => require.resolve(name, { paths: [qaModules] });
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'zekr-baseline-'));
const output = require('./support/qa-output.cjs')('baseline-browser');
fs.mkdirSync(output, { recursive: true });
const mocks = {
  'rn.ts': `export * from 'react-native-web';
    export const AppState = { addEventListener: () => ({remove(){}}) };
    export const AccessibilityInfo = { isReduceMotionEnabled: async () => true,
      addEventListener: () => ({remove(){}}), announceForAccessibility(){} };`,
  'safe.tsx': `import React from 'react';
    export const useSafeAreaInsets = () => ({top:24,bottom:24,left:0,right:0});
    export const SafeAreaProvider = ({children}:any) => <>{children}</>;`,
  'splash.ts': `export const preventAutoHideAsync = async () => {};
    export const hideAsync = async () => {}; export const setOptions = () => {};`,
  'haptics.ts': `export const NotificationFeedbackType = {Success:'success',Warning:'warning'};
    export const ImpactFeedbackStyle = {Light:'tap'};
    export const notificationAsync = async () => {}; export const impactAsync = async () => {};`,
};
for (const [name, source] of Object.entries(mocks)) fs.writeFileSync(path.join(scratch, name), source);
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import App from ${JSON.stringify(path.join(root, 'App.tsx'))};
  import {THEME_OPTIONS} from ${JSON.stringify(path.join(root, 'src/theme.ts'))};
  import {counterPersistence,themePersistence} from ${JSON.stringify(path.join(root, 'src/storage.ts'))};
  window.registry = THEME_OPTIONS.map(({id,name,displayName}) => ({id,name,displayName}));
  window.snapshot = () => ({counter:counterPersistence.getSnapshot(),theme:themePersistence.getSnapshot()});
  window.mountApp = () => createRoot(document.getElementById('root')).render(<App/>);
`);
require(resolveQA('esbuild')).buildSync({
  entryPoints: [path.join(scratch, 'entry.tsx')], bundle: true, outfile: path.join(scratch, 'bundle.js'), jsx: 'automatic',
  nodePaths: [qaModules, path.join(root, 'node_modules')],
  alias: { react: path.dirname(resolveQA('react/package.json')), 'react-dom': path.dirname(resolveQA('react-dom/package.json')),
    'react-native': path.join(scratch, 'rn.ts'), 'react-native-safe-area-context': path.join(scratch, 'safe.tsx'),
    'expo-splash-screen': path.join(scratch, 'splash.ts'), 'expo-haptics': path.join(scratch, 'haptics.ts') },
  resolveExtensions: ['.web.tsx','.web.ts','.web.js','.tsx','.ts','.js'], loader: {'.png':'dataurl'},
  define: {global:'globalThis',__DEV__:'true','process.env.NODE_ENV':'"development"','process.env.EXPO_OS':'"web"'},
});
const bundle = fs.readFileSync(path.join(scratch, 'bundle.js'), 'utf8');
const counterKey = '@dhikr/counter-state/v1';
const themeKey = '@dhikr/theme/v1';
const seed = {count:44,target:33,dhikrId:'tasbih_tahmid',totalSessionCount:44,
  fullScreenTap:false,hapticsEnabled:false,visualEffectsEnabled:false};
const slug = id => id.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

(async () => {
  const {chromium} = require(process.env.ZEKR_QA_PLAYWRIGHT || resolveQA('playwright'));
  const browser = await chromium.launch({headless:true,chromiumSandbox:true,
    ...(process.env.ZEKR_QA_CHROME ? {executablePath:process.env.ZEKR_QA_CHROME} : {})});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://qa.zekr.test/**', route => route.fulfill({contentType:'text/html',body:
      '<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>'}));
    await page.goto('http://qa.zekr.test');
    await page.evaluate(({seed,counterKey}) => localStorage.setItem(counterKey,JSON.stringify(seed)), {seed,counterKey});
    // Start from another theme so selecting the default also exercises a real write.
    await page.evaluate(key => localStorage.setItem(key,'solarPulse'),themeKey);
    const mount = async () => {
      await page.addScriptTag({content:bundle});
      await page.evaluate(() => window.mountApp());
      await page.waitForFunction(() => window.snapshot().counter.hydration === 'ready' && window.snapshot().theme.hydration === 'ready');
      await page.getByRole('button',{name:'تخطي المقدمة'}).waitFor({state:'hidden'});
      await page.waitForTimeout(150);
    };
    const capture = async name => {
      // Native Modal's web transition can lag behind its accessible content.
      await page.waitForTimeout(350);
      await page.screenshot({path:path.join(output,`${name}.png`)});
    };
    await mount();
    const registry = await page.evaluate(() => window.registry);
    assert.deepEqual(registry.map(t=>t.id), ['midnightSapphire','royalAmethyst','softIvory','obsidianEmber','glacierPrism','solarPulse']);
    const results = [];
    for (const theme of registry) {
      await page.getByRole('button',{name:'القائمة والإعدادات'}).click();
      const browse = page.getByRole('button',{name:/استعراض المظاهر/});
      assert.match(await browse.getAttribute('aria-label'), /٦ مظاهر متاحة/);
      await browse.click();
      const radios = page.getByRole('radiogroup',{name:'المظاهر'}).getByRole('radio');
      assert.equal(await radios.count(),registry.length);
      const selected = page.getByRole('radio',{name:new RegExp(`مظهر ${theme.displayName}،`)});
      await selected.click();
      await page.waitForFunction(id => window.snapshot().theme.value === id && window.snapshot().theme.saveStatus === 'saved',theme.id);
      const nativeState = await selected.evaluate(element => {
        let fiber=element[Object.keys(element).find(key=>key.startsWith('__reactFiber$'))];
        while(fiber && !fiber.memoizedProps?.accessibilityState) fiber=fiber.return;
        return fiber.memoizedProps.accessibilityState;
      });
      assert.deepEqual(nativeState,{checked:true,selected:true});
      if(theme.id==='solarPulse') {
        await radios.first().scrollIntoViewIfNeeded(); await capture('theme-gallery-initial');
        await radios.last().scrollIntoViewIfNeeded(); await capture('theme-gallery-scrolled');
      }
      await page.getByRole('button',{name:'العودة إلى الإعدادات',exact:true}).first().click();
      if(theme.id==='solarPulse') await capture('settings-solar-pulse');
      await page.getByRole('button',{name:'إغلاق',exact:true}).click();
      await page.getByRole('button',{name:'إغلاق',exact:true}).waitFor({state:'hidden'});
      assert.deepEqual(await page.evaluate(()=>window.snapshot().counter.value),seed);
      await page.waitForFunction(() => window.snapshot().counter.saveStatus === 'saved');
      await page.reload(); await mount();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),themeKey),theme.id);
      assert.equal(await page.evaluate(()=>window.snapshot().theme.value),theme.id);
      assert.deepEqual(await page.evaluate(()=>window.snapshot().counter.value),seed);
      await page.getByText('٤٤ من ٦٦',{exact:true}).waitFor();
      const geometry = await page.getByRole('button',{name:/^عدّاد /}).evaluate(element => {
        const svg=element.parentElement.parentElement.querySelector('svg');
        return {beads:svg.querySelectorAll('circle[r="7.2"]').length,
          active:svg.querySelectorAll('circle[r="7.2"][fill="url(#activeBeadSphere)"]').length};
      });
      assert.deepEqual(geometry,{beads:33,active:11});
      const badge = await page.getByText('الدورة الثانية',{exact:true}).evaluate(element => {
        const pill=element.parentElement.getBoundingClientRect();
        const touch=element.closest('[aria-label^="عدّاد "]').getBoundingClientRect();
        return {centerOffset:Math.abs(pill.left+pill.width/2-touch.left-touch.width/2),width:pill.width,touchWidth:touch.width};
      });
      assert.ok(badge.centerOffset<=2 && badge.width<badge.touchWidth*0.7);
      await capture(`tasbeeh-${slug(theme.id)}`);
      await page.getByRole('button',{name:'النقر الحر',exact:true}).click();
      await page.getByText('٤٤ من ٦٦',{exact:true}).last().waitFor();
      await capture(`free-tap-${slug(theme.id)}`);
      await page.getByRole('button',{name:'إنهاء وضع النقر الحر'}).click();
      assert.deepEqual(await page.evaluate(()=>window.snapshot().counter.value),seed);
      await page.waitForFunction(() => window.snapshot().counter.saveStatus === 'saved');
      results.push({...theme,selection:true,restoration:true,countPreserved:true,main:true,freeTap:true,...geometry,badge});
    }
    await page.getByRole('button',{name:'مكتبة الأذكار',exact:true}).click();
    await page.getByText('اختر الذكر المأثور لتبدأ ورده وفضله',{exact:true}).waitFor();
    await capture('dhikr-selection');
    await page.getByRole('button',{name:'إغلاق',exact:true}).click();
    await page.getByRole('button',{name:'إغلاق',exact:true}).waitFor({state:'hidden'});
    await page.getByRole('radio',{name:'هدف مخصص',exact:true}).click();
    await page.getByRole('textbox',{name:'الهدف المخصص'}).fill('٥٠');
    await capture('custom-target');
    await page.getByRole('button',{name:'إلغاء',exact:true}).click();
    await page.evaluate(({seed,counterKey}) => localStorage.setItem(counterKey,JSON.stringify({...seed,count:32,totalSessionCount:32})),{seed,counterKey});
    await page.reload(); await mount();
    await page.getByRole('button',{name:/^عدّاد /}).click();
    await page.getByText('اكتمل الهدف ٣٣',{exact:true}).waitFor();
    await capture('milestone-33-completion');
    assert.deepEqual(errors,[]);
    const files=execFileSync('git',['ls-files','App.tsx','index.ts','src','assets','app.json','app.config.ts','package.json','package-lock.json','eas.json'],{cwd:root,encoding:'utf8'}).trim().split('\n');
    const sourceHashes=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
    fs.writeFileSync(path.join(output,'capture-manifest.json'),JSON.stringify({
      capturedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
      environment:'Actual App via React Native Web / Chromium. Mocked native splash, haptics, safe areas (24px top/bottom), reduced motion and lifecycle. Not native Android or iOS evidence.',
      viewport:{width:390,height:844,deviceScaleFactor:1},seed,results,errors,sourceHashes,
      captureScriptSha256:createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
      screenshotSha256:Object.fromEntries(fs.readdirSync(output).filter(file=>file.endsWith('.png')).sort()
        .map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex')])),
    },null,2)+'\n');
    console.log(JSON.stringify({output,themes:results.length,errors}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
