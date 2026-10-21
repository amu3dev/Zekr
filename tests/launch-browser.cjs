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
for (const [name, source] of Object.entries(mocks)) fs.writeFileSync(path.join(scratch, name), source);
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `import React from 'react'; import { createRoot } from 'react-dom/client'; import App from ${JSON.stringify(path.join(root, 'App.tsx'))}; window.mountApp = (strict = false) => createRoot(document.getElementById('root')).render(strict ? <React.StrictMode><App/></React.StrictMode> : <App/>);`);
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
(async()=>{
 const browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.ZEKR_QA_CHROME ? {executablePath:process.env.ZEKR_QA_CHROME} : {})});
 const results=[];
 async function pageFor({reduce=false,theme=null,video=false,counter=null}={}){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,reducedMotion:reduce?'reduce':'no-preference',...(video?{recordVideo:{dir:path.join(scratch,'video'),size:{width:390,height:844}}}:{})});
  const page=await context.newPage();
  page.on('pageerror',e=>{console.error('PAGE ERROR',e);});
  await page.route('http://qa.zekr.test/**',r=>r.fulfill({contentType:'text/html',body:'<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0;background:#0B132B}#root{display:flex}</style></head><body><div id="root"></div></body></html>'}));
  await page.goto('http://qa.zekr.test');
  if(theme)await page.evaluate(t=>localStorage.setItem('@dhikr/theme/v1',t),theme);
  if(counter)await page.evaluate(c=>localStorage.setItem('@dhikr/counter-state/v1',JSON.stringify(c)),counter);
  await page.addScriptTag({content:bundle});
  return {page,context};
 }
 const first=await pageFor({video:true});
 await first.page.evaluate(()=>window.mountApp());
 await first.page.getByRole('button',{name:'تخطي المقدمة'}).waitFor();
 await first.page.waitForTimeout(400);
 await first.page.screenshot({path:output+'/launch-browser.png'});
 await first.page.waitForTimeout(700);
 assert.equal(await first.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 assert.equal(await first.page.evaluate(()=>window.nativeHides),1);
 await first.page.screenshot({path:output+'/home-browser.png'});
 await first.page.evaluate(()=>{window.qa.background();window.qa.foreground();});
 await first.page.waitForTimeout(100);
 assert.equal(await first.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 assert.equal(await first.page.evaluate(()=>window.nativeHides),1);
 results.push('Normal launch exits; background/foreground does not replay; native hide called once.');
 const video=first.page.video();await first.context.close();await video.saveAs(output+'/launch-browser.webm');
 const strict=await pageFor();await strict.page.evaluate(()=>window.mountApp(true));
 await strict.page.waitForFunction(()=>window.nativeHides===1);
 await strict.page.getByRole('button',{name:'تخطي المقدمة'}).waitFor({state:'detached'});
 assert.equal(await strict.page.evaluate(()=>window.nativeHides),1);
 assert.equal(await strict.page.evaluate(()=>window.qa.starts.length),1);
 assert.equal(await strict.page.evaluate(()=>(window.qa.haptics||[]).length),0);
 results.push('StrictMode effect replay still completes launch, starts the reveal once and hides native splash once without counting.');await strict.context.close();
 const skip=await pageFor();await skip.page.evaluate(()=>window.mountApp());
 await skip.page.getByRole('button',{name:'تخطي المقدمة'}).click();
 assert.equal(await skip.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 results.push('Skip dismisses the launch.');await skip.context.close();
 const reduced=await pageFor({reduce:true,theme:'softIvory'});await reduced.page.evaluate(()=>window.mountApp());
 await reduced.page.waitForFunction(()=>window.nativeHides===1);await reduced.page.waitForTimeout(100);
 assert.equal(await reduced.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 assert.equal(await reduced.page.evaluate(()=>localStorage.getItem('@dhikr/theme/v1')),'softIvory');
 await reduced.page.screenshot({path:output+'/reduced-motion-ivory-browser.png'});
 results.push('Reduced motion dismisses immediately and preserves stored theme.');await reduced.context.close();
 const interrupt=await pageFor();await interrupt.page.evaluate(()=>window.mountApp());
 await interrupt.page.getByRole('button',{name:'تخطي المقدمة'}).waitFor();await interrupt.page.evaluate(()=>window.qa.background());
 await interrupt.page.waitForTimeout(50);await interrupt.page.evaluate(()=>window.qa.foreground());
 assert.equal(await interrupt.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 results.push('Background during launch cancels and does not replay.');await interrupt.context.close();

 const touch=await pageFor({theme:'royalAmethyst'});await touch.page.evaluate(()=>window.mountApp());
 await touch.page.getByRole('button',{name:'تخطي المقدمة'}).waitFor();
 await touch.page.touchscreen.tap(195,422);
 assert.equal(await touch.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 await touch.page.waitForTimeout(500);
 const saved=await touch.page.evaluate(()=>JSON.parse(localStorage.getItem('@dhikr/counter-state/v1')));
 assert.equal(saved,null); // Hydration/launch alone must never write defaults.
 assert.equal(await touch.page.getByTestId('central-counter-text').textContent(),'٠');
 assert.equal(await touch.page.evaluate(()=>localStorage.getItem('@dhikr/theme/v1')),'royalAmethyst');
 results.push('Emblem tap dismisses without changing count; Amethyst theme remains stored.');
 await touch.context.close();
 const liveMotion=await pageFor();await liveMotion.page.evaluate(()=>window.mountApp());
 await liveMotion.page.getByRole('button',{name:'تخطي المقدمة'}).waitFor();await liveMotion.page.evaluate(()=>window.qa.reduce());
 await liveMotion.page.waitForTimeout(50);assert.equal(await liveMotion.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 results.push('Enabling reduced motion during launch immediately cancels it.');await liveMotion.context.close();

 for (const mode of ['failAnimation','unknownMotion']) {
  const fallback=await pageFor();await fallback.page.evaluate(m=>{window.qa[m]();window.mountApp();},mode);
  await fallback.page.waitForFunction(()=>window.nativeHides===1);await fallback.page.waitForTimeout(1000);
  assert.equal(await fallback.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
  results.push(mode+': native handoff is independent of the bounded fallback.');await fallback.context.close();
 }

 const burst=await pageFor({counter:{count:98,target:100,cycle:1,totalSessionCount:98,hapticsEnabled:true}});
 await burst.page.evaluate(()=>window.mountApp());await burst.page.getByRole('button',{name:'تخطي المقدمة'}).click();
 await burst.page.getByRole('button',{name:/^عدّاد /}).waitFor();
 await burst.page.evaluate(()=>{
  const element=document.querySelector('[aria-label^="عدّاد "]');
  let fiber=element[Object.keys(element).find(key=>key.startsWith('__reactFiber$'))];
  while(fiber && fiber.type?.name!=='CounterRing')fiber=fiber.return;
  if(!fiber)throw new Error('CounterRing callback not found');
  window.qa.haptics=[];fiber.memoizedProps.onPress();fiber.memoizedProps.onPress();fiber.memoizedProps.onPress();
 });
 await burst.page.waitForTimeout(500);
 assert.deepEqual(await burst.page.evaluate(()=>window.qa.haptics),['tap','success','tap']);
 assert.equal(await burst.page.evaluate(()=>JSON.parse(localStorage.getItem('@dhikr/counter-state/v1')).count),101);
 results.push('Three batched taps from 98 to 101 trigger exactly one success at 100 and preserve count.');
 await burst.context.close();
 const gallery=await pageFor();await gallery.page.evaluate(()=>window.mountApp());await gallery.page.getByRole('button',{name:'تخطي المقدمة'}).click();
 await gallery.page.getByRole('button',{name:'القائمة والإعدادات'}).click();
 await gallery.page.getByRole('button',{name:/استعراض المظاهر/}).click();
 await gallery.page.getByRole('radiogroup',{name:'المظاهر'}).waitFor();
 assert.equal(await gallery.page.getByRole('radiogroup',{name:'المظاهر'}).getByRole('radio').count(),6);
 await gallery.page.screenshot({path:output+'/theme-gallery-browser.png'});
 results.push('Gallery exposes a labelled radio group with six selectable themes.');await gallery.context.close();

 const delayed=await pageFor();await delayed.page.evaluate(()=>{window.qa.motionDelay=250;window.mountApp();});
 await delayed.page.waitForFunction(()=>window.nativeHides===1);
 await delayed.page.waitForTimeout(350);
 assert.equal(await delayed.page.evaluate(()=>window.qa.starts.length),1);
 await delayed.page.waitForTimeout(600);assert.equal(await delayed.page.getByRole('button',{name:'تخطي المقدمة'}).count(),0);
 results.push('A delayed motion preference starts the intro without delaying native hide or extending the deadline.');await delayed.context.close();

 const hold=await pageFor();await hold.page.evaluate(()=>window.mountApp());await hold.page.getByRole('button',{name:'تخطي المقدمة'}).waitFor();
 const cdp=await hold.context.newCDPSession(hold.page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:422}]});
 await hold.page.waitForTimeout(1100);
 assert.equal(await hold.page.getByRole('button',{name:'تخطي المقدمة'}).count(),1);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await hold.page.waitForTimeout(500);
 assert.equal(await hold.page.evaluate(()=>localStorage.getItem('@dhikr/counter-state/v1')),null);
 assert.equal(await hold.page.getByTestId('central-counter-text').textContent(),'٠');
 results.push('Holding a launch tap beyond the animation deadline keeps the responder and does not increment home.');await hold.context.close();
 await browser.close();fs.writeFileSync(output+'/browser-qa-results.json',JSON.stringify({environment:'Actual App + LaunchExperience via React Native Web; mocked native splash, safe area and OS events. Not Android validation.',results},null,2));console.log(results.join('\n'));console.log(`QA artifacts: ${output}`);
})();
