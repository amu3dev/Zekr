// Actual App through the established isolated React Native Web QA runtime.
// OS APIs are mocked. Doubled Text styles approximate 200% native text layout.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const qaModules = process.env.ZEKR_QA_MODULES || path.join(root, 'node_modules');
const resolveQA = name => require.resolve(name, { paths: [qaModules] });
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'zekr-routines-'));
const output = process.env.ZEKR_QA_OUTPUT ? path.resolve(process.env.ZEKR_QA_OUTPUT) : path.join(scratch, 'results');
fs.mkdirSync(output, { recursive: true });
const mocks = {
  'rn.tsx': `import React from 'react'; import {Text as WebText, StyleSheet, Animated as WebAnimated, useWindowDimensions as webDimensions} from 'react-native-web';
    export * from 'react-native-web';
    export const useWindowDimensions=()=>({...webDimensions(),fontScale:(window as any).textScale || 1});
    export const Text = React.forwardRef(({style,...props}:any,ref:any) => {
      const flat = StyleSheet.flatten(style) || {};
      const scale = props.allowFontScaling===false ? 1 : Math.min((window as any).textScale || 1,props.maxFontSizeMultiplier || Infinity);
      return <WebText {...props} ref={ref} style={[style, {
        fontSize:(flat.fontSize || 14)*scale, ...(flat.lineHeight ? {lineHeight:flat.lineHeight*scale} : {})
      }]}/>;
    });
    const listeners = new Map<string,Set<any>>();
    (window as any).announcements = []; (window as any).animations = [];
    (window as any).motion = (value:boolean) => { (window as any).reducedMotion=value;
      listeners.get('reduceMotionChanged')?.forEach(fn => fn(value)); };
    export const AccessibilityInfo = {
      isReduceMotionEnabled: async () => (window as any).reducedMotion !== false,
      isScreenReaderEnabled: async () => (window as any).screenReader === true,
      announceForAccessibility: (message:string) => (window as any).announcements.push(message),
      addEventListener: (name:string, fn:any) => { if(!listeners.has(name)) listeners.set(name,new Set());
        listeners.get(name)!.add(fn); return {remove:()=>listeners.get(name)!.delete(fn)}; }
    };
    export const AppState = {currentState:'active',addEventListener:()=>({remove(){}})};
    export const Linking = {openURL:async(url:string)=>{ ((window as any).openedSources ??= []).push(url); if((window as any).failLink) throw Error('Injected source open failure'); }};
    export const Animated = {...WebAnimated, timing:(...args:any[])=>{(window as any).animations.push('timing');
      return (WebAnimated.timing as any)(...args);}, spring:(...args:any[])=>{(window as any).animations.push('spring');
      return (WebAnimated.spring as any)(...args);}};`,
  'safe.tsx': `import React from 'react'; export const useSafeAreaInsets=()=>({top:24,bottom:24,left:0,right:0});
    export const SafeAreaProvider=({children}:any)=><>{children}</>;`,
  'splash.ts': `export const setOptions=()=>{}; export const preventAutoHideAsync=async()=>{}; export const hideAsync=async()=>{};`,
  'haptics.ts': `export const NotificationFeedbackType={Success:'success',Warning:'warning'};
    export const ImpactFeedbackStyle={Light:'tap'}; export const notificationAsync=async()=>{};
    export const impactAsync=async()=>{};`,
};
for (const [name, source] of Object.entries(mocks)) fs.writeFileSync(path.join(scratch, name), source);
fs.writeFileSync(path.join(scratch, 'entry.tsx'), `import React from 'react'; import {createRoot} from 'react-dom/client';
  import App from ${JSON.stringify(path.join(root, 'App.tsx'))};
  import * as storage from ${JSON.stringify(path.join(root, 'src/storage.ts'))};
  import {THEME_OPTIONS} from ${JSON.stringify(path.join(root, 'src/theme.ts'))};
  import {ROUTINES} from ${JSON.stringify(path.join(root, 'src/routines.ts'))};
  import {DHIKR_OPTIONS} from ${JSON.stringify(path.join(root, 'src/counter.ts'))};
  window.storageAPI=storage; window.themes=THEME_OPTIONS; window.routines=ROUTINES;
  window.dhikrDefinitions=DHIKR_OPTIONS;
  window.snapshot=()=>storage.routinePersistence.getSnapshot();
  window.mountApp=()=>createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`);
require(resolveQA('esbuild')).buildSync({entryPoints:[path.join(scratch,'entry.tsx')], bundle:true,
  outfile:path.join(scratch,'bundle.js'), jsx:'automatic', nodePaths:[qaModules,path.join(root,'node_modules')],
  alias:{react:path.dirname(resolveQA('react/package.json')), 'react-dom':path.dirname(resolveQA('react-dom/package.json')),
    'react-native':path.join(scratch,'rn.tsx'), 'react-native-safe-area-context':path.join(scratch,'safe.tsx'),
    'expo-splash-screen':path.join(scratch,'splash.ts'), 'expo-haptics':path.join(scratch,'haptics.ts')},
  resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.js'], loader:{'.png':'dataurl'},
  define:{global:'globalThis',__DEV__:'true','process.env.NODE_ENV':'"development"','process.env.EXPO_OS':'"web"'},
});
const bundle = fs.readFileSync(path.join(scratch,'bundle.js'),'utf8');
const routineKey='@dhikr/routines/v1', counterKey='@dhikr/counter-state/v1';
const single={count:44,target:33,dhikrId:'tasbih_tahmid',totalSessionCount:500,
  fullScreenTap:false,hapticsEnabled:false,visualEffectsEnabled:true};

const phase=process.env.QA_PHASE || 'after';

(async()=>{
  const {chromium}=require(process.env.ZEKR_QA_PLAYWRIGHT || resolveQA('playwright'));
  const browser=await chromium.launch({headless:true,chromiumSandbox:true,
    ...(process.env.ZEKR_QA_CHROME ? {executablePath:process.env.ZEKR_QA_CHROME}: {})});
  const results=[], errors=[];
  const button=(page,name)=>page.getByRole(['القراءة الكاملة','الشريط المتحرك','القراءة بالمقاطع','التمرير الذكي','بطيء','عادي','سريع','يدوي','تلقائي'].includes(name)?'radio':'button',{name,exact:true});
  async function open({mode='full',width=320,height=640,scale=1,theme='midnightSapphire',free=false,guided=false,motion=false,reader=false}={}) {
    const context=await browser.newContext({viewport:{width,height},hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.route('http://qa.zekr.test/**',r=>r.fulfill({contentType:'text/html',body:'<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>'}));
    await page.goto('http://qa.zekr.test');
    await page.evaluate(({mode,theme,scale,free,guided,motion,reader,single})=>{
      localStorage.setItem('@dhikr/counter-state/v1',JSON.stringify({...single,dhikrId:'sayyid_istighfar',fullScreenTap:free}));
      localStorage.setItem('@dhikr/routines/v1',JSON.stringify({version:1,inRoutine:guided,totalRecorded:99,session:guided?{routineId:'afterPrayer99Tahlil',definitionVersion:1,completedRepetitions:99}:null}));
      localStorage.setItem('@dhikr/theme/v1',theme);
      localStorage.setItem('@dhikr/reading/v1',JSON.stringify({mode,speed:'normal',progression:'manual'}));
      window.textScale=scale;window.reducedMotion=!motion;window.screenReader=reader;
    },{mode,theme,scale,free,guided,motion,reader,single});
    await page.addScriptTag({content:bundle});await page.evaluate(()=>window.mountApp());
    await button(page,'قراءة نص الذكر كاملًا').waitFor();
    return {page,context};
  }
  try {
    {
      const seed=await open();const ids=await seed.page.evaluate(()=>window.themes.map(t=>t.id));await seed.context.close();
      for(const theme of ids) for(const [width,height,scale] of [[320,640,1],[390,844,1],[320,844,2]]) for(const mode of ['full','ticker','segments','vertical']) {
        const {page,context}=await open({theme,width,height,scale,mode});
        await button(page,'قراءة نص الذكر كاملًا').click();
        const canonical=await page.evaluate(()=>window.dhikrDefinitions.find(d=>d.id==='sayyid_istighfar').phrase);
        if(mode==='full') assert.equal(await page.getByTestId('expanded-dhikr-phrase').textContent(),canonical);
        else {
          await page.getByTestId('smart-reader-'+mode).waitFor();
          if(mode==='ticker') assert.equal(await page.getByTestId('ticker-phrase').textContent(),canonical);
          if(mode==='vertical') {
            assert.equal(await page.getByTestId('vertical-phrase').textContent(),canonical);
            const measured=await page.getByTestId('vertical-window').boundingBox();assert.ok(measured.height>0);
          }
          if(mode==='segments') {
            let combined='';
            while(true){combined+=await page.getByTestId('segment-phrase').textContent();if(!await button(page,'التالي').isEnabled())break;await button(page,'التالي').click();}
            assert.equal(combined,canonical);
            await button(page,'من البداية').click();
          }
          assert.equal(await button(page,'تشغيل القراءة').count(),0,'reduced motion has no forced movement');
        }
        assert.equal(await page.getByTestId('reading-counter').textContent(),'٤٤ من ٦٦');
        await button(page,'تسجيل تسبيحة في وضع القراءة').click();assert.equal(await page.getByTestId('reading-counter').textContent(),'٤٥ من ٦٦');
        await button(page,'تراجع في وضع القراءة').click();assert.equal(await page.getByTestId('reading-counter').textContent(),'٤٤ من ٦٦');
        const dock=await button(page,'تسجيل تسبيحة في وضع القراءة').boundingBox();assert.ok(dock.y>=0 && dock.y+dock.height<=height+1,JSON.stringify({theme,width,height,scale,mode,dock}));
        results.push({theme,width,height,scale,mode});await context.close();
      }
    }
    for(const free of [false,true]) for(const mode of ['ticker','segments','vertical']) {
      const {page,context}=await open({mode,free});await button(page,'قراءة نص الذكر كاملًا').click();await page.getByTestId('smart-reader-'+mode).waitFor();await context.close();
    }
    // Guided 98 -> final Tahlil -> completion -> Undo keeps the same reader open.
    for(const free of [false,true]) for(const mode of ['full','ticker','segments','vertical']) {
      const {page,context}=await open({mode,guided:true,free});await button(page,'قراءة نص الذكر كاملًا').click();
      await button(page,'تراجع في وضع القراءة').click();
      await button(page,'تسجيل تسبيحة في وضع القراءة').click();
      const phrase=await page.evaluate(()=>window.dhikrDefinitions.find(d=>d.id==='tahlil').phrase);
      const text=mode==='full'?'expanded-dhikr-phrase':mode==='segments'?'segment-phrase':mode==='ticker'?'ticker-phrase':'vertical-phrase';
      const actual=await page.getByTestId(text).textContent();assert.ok(mode==='segments'?phrase.startsWith(actual):phrase===actual);
      await button(page,'تسجيل تسبيحة في وضع القراءة').click();assert.equal(await button(page,'تسجيل تسبيحة في وضع القراءة').isEnabled(),false);
      await button(page,'تراجع في وضع القراءة').click();assert.equal(await button(page,'تسجيل تسبيحة في وضع القراءة').isEnabled(),true);await context.close();
    }
    // Ticker speed, pause/resume and restart use the same translation value.
    const {page,context}=await open({mode:'ticker',motion:true});await button(page,'قراءة نص الذكر كاملًا').click();
    const transform=()=>page.getByTestId('ticker-phrase').evaluate(node=>node.parentElement.style.transform);
    const start=await transform();await button(page,'تشغيل القراءة').click();await page.waitForTimeout(250);await button(page,'إيقاف مؤقت').click();const paused=await transform();assert.notEqual(paused,start);
    await page.waitForTimeout(200);assert.equal(await transform(),paused);await button(page,'تشغيل القراءة').click();await page.waitForTimeout(200);await button(page,'إيقاف مؤقت').click();assert.notEqual(await transform(),paused);
    await button(page,'من البداية').click();assert.equal(await transform(),start);
    await button(page,'طريقة القراءة: الشريط المتحرك').click();await button(page,'سريع').click();
    await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>window.storageAPI.readingPersistence.getSnapshot().value.speed),'fast');
    await button(page,'القراءة بالمقاطع').click();assert.equal(await page.getByTestId('reading-counter').textContent(),'٤٤ من ٦٦');
    await page.evaluate(()=>window.storageAPI.readingPersistence.flush());assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('@dhikr/reading/v1')).mode),'segments');
    await button(page,'طريقة القراءة: القراءة بالمقاطع').click();await button(page,'تلقائي').click();
    const opening=await page.getByTestId('segment-phrase').textContent();await button(page,'تشغيل القراءة').click();
    await page.waitForTimeout(2800);assert.notEqual(await page.getByTestId('segment-phrase').textContent(),opening);
    await button(page,'إيقاف مؤقت').click();const stopped=await page.getByTestId('segment-phrase').textContent();
    await page.waitForTimeout(250);assert.equal(await page.getByTestId('segment-phrase').textContent(),stopped);
    await button(page,'تشغيل القراءة').click();await page.evaluate(()=>window.motion(true));await button(page,'إيقاف مؤقت').waitFor({state:'detached'});assert.equal(await button(page,'إيقاف مؤقت').count(),0);
    await page.waitForTimeout(2800);assert.equal(await page.getByTestId('segment-phrase').textContent(),stopped);
    await page.evaluate(()=>window.motion(false));await button(page,'تشغيل القراءة').waitFor();assert.equal(await button(page,'إيقاف مؤقت').count(),0);
    await button(page,'إغلاق نص الذكر').click();await button(page,'القائمة والإعدادات').click();
    await page.getByRole('heading',{name:'طريقة قراءة الأذكار',exact:true}).waitFor();
    await button(page,'القراءة الكاملة').click();assert.equal(await button(page,'بطيء').count(),0);assert.equal(await button(page,'تلقائي').count(),0);
    await button(page,'الشريط المتحرك').click();assert.equal(await button(page,'بطيء').count(),1);assert.equal(await button(page,'تلقائي').count(),0);
    await page.getByTestId('reading-live-preview').waitFor();await context.close();
    // Screen-reader fallback is the complete, selectable canonical wording.
    const accessible=await open({mode:'ticker',motion:true,reader:true});await button(accessible.page,'قراءة نص الذكر كاملًا').click();
    assert.equal(await accessible.page.getByTestId('smart-accessible-phrase').textContent(),await accessible.page.evaluate(()=>window.dhikrDefinitions.find(d=>d.id==='sayyid_istighfar').phrase));
    assert.equal(await button(accessible.page,'تشغيل القراءة').count(),0);await accessible.context.close();
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({matrix:results,errors},null,2));console.log('PASS',results.length,'mode/theme/size cases; Free Tap, routine boundaries, ticker controls, persistence, safety');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
