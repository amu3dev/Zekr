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
      announceForAccessibility: (message:string) => (window as any).announcements.push(message),
      addEventListener: (name:string, fn:any) => { if(!listeners.has(name)) listeners.set(name,new Set());
        listeners.get(name)!.add(fn); return {remove:()=>listeners.get(name)!.delete(fn)}; }
    };
    export const AppState = {addEventListener:()=>({remove(){}})};
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
  const results=[],errors=[];
  const button=(page,name)=>page.getByRole('button',{name,exact:true});
  const ring=page=>page.getByRole('button',{name:/^عدّاد /}).last();
  async function open({width=390,height=844,scale=1,count=3,theme='midnightSapphire',singleMode=false,free=false,dhikrId='tasbih_tahmid'}={}) {
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror',e=>errors.push(e.message));
    await page.route('http://qa.zekr.test/**',r=>r.fulfill({contentType:'text/html',body:'<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>'}));
    await page.goto('http://qa.zekr.test');
    await page.evaluate(({single,counterKey,routineKey,count,theme,scale,singleMode,free,dhikrId})=>{
      localStorage.setItem(counterKey,JSON.stringify({...single,fullScreenTap:free,dhikrId}));
      localStorage.setItem('@dhikr/theme/v1',theme);
      localStorage.setItem(routineKey,JSON.stringify({version:1,inRoutine:!singleMode,totalRecorded:count,
        session:{routineId:'afterPrayer99Tahlil',definitionVersion:1,completedRepetitions:count}}));
      window.textScale=scale; window.reducedMotion=true;
    },{single,counterKey,routineKey,count,theme,scale,singleMode,free,dhikrId});
    await page.addScriptTag({content:bundle}); await page.evaluate(()=>window.mountApp());
    await page.waitForFunction(()=>window.snapshot().hydration==='ready');
    await button(page,'تخطي المقدمة').waitFor({state:'hidden'});
    return {page,context};
  }
  const capture=async(page,name)=>page.screenshot({path:path.join(output,`${name}.png`)});
  async function inspect(page,config) {
    const labels=config.singleMode ? [] : ['routine-phrase','routine-step','routine-overall'];
    const bounds={};
    for(const id of labels) bounds[id]=await page.getByTestId(id).last().boundingBox();
    bounds.counter=await ring(page).boundingBox();
    bounds.undo=await button(page,'تراجع').last().boundingBox();
    const scrolling=await page.evaluate(()=>Array.from(document.querySelectorAll('*')).filter(el=>{
      const overflow=getComputedStyle(el).overflowY;
      return ['auto','scroll'].includes(overflow) && !el.getAttribute('data-testid')?.endsWith('-reader') && el.clientHeight>0 && el.scrollHeight>el.clientHeight+2;
    }).map(el=>({id:el.getAttribute('data-testid'),height:el.clientHeight,scrollHeight:el.scrollHeight})));
    if(phase==='after' && config.scale===1) {
      for(const [id,rect] of Object.entries(bounds)) {
        assert.ok(rect && rect.x>=-1 && rect.y>=23 && rect.x+rect.width<=config.width+1 && rect.y+rect.height<=config.height-23,
          `${config.name}: ${id} outside usable viewport: ${JSON.stringify(rect)}`);
      }
      assert.ok(bounds.counter.width>=120 && bounds.counter.height>=120);
      assert.ok(bounds.undo.width>=44 && bounds.undo.height>=44);
      await ring(page).evaluate(el=>{
        const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        if(!hit || !(hit===el || el.contains(hit))) throw Error('Counter is overlapped');
      });
      assert.deepEqual(scrolling,[],`${config.name}: unexpected standard counting scroll`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      for(const name of config.free ? ['تراجع','إنهاء وضع النقر الحر','خيارات الورد'] : ['تراجع','التسبيحات الكاملة','النقر الحر']) {
        const target=button(page,name).last();
        await target.evaluate(el=>{
          const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          if(!hit || !(hit===el || el.contains(hit))) throw Error('Essential control is overlapped');
        });
      }
    }
    return {name:config.name,width:config.width,height:config.height,fontScale:config.scale,bounds,scrolling};
  }
  try {
    const basic=[{name:'single-home',singleMode:true},{name:'single-short',singleMode:true,width:320,height:640},
      {name:'single-long',singleMode:true,dhikrId:'sayyid_istighfar',width:320,height:640},
      {name:'single-enlarged',singleMode:true,width:320,scale:2},
      {name:'step-1',count:3},{name:'transition',count:33},
      {name:'long-tahlil',count:99},{name:'completed',count:100},{name:'free-tap',count:3,free:true},
      {name:'light-ivory',count:3,theme:'softIvory'},{name:'dark-amethyst',count:3,theme:'royalAmethyst'}];
    for(const item of basic) {
      const config={width:390,height:844,scale:1,...item};
      const {page,context}=await open(config);
      await capture(page,item.name);
      results.push(await inspect(page,config));
      if(item.name==='single-enlarged') {
        for(const target of [33,99,100,1000]) {
          const control=page.getByRole('radio',{name:`الهدف ${String(target).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d])}`,exact:true});
          await control.scrollIntoViewIfNeeded();
          const bounds=await control.boundingBox();
          assert.ok(bounds.x>=0 && bounds.x+bounds.width<=321 && bounds.height>=44);
        }
      }
      await context.close();
    }
    if(phase==='after') for(const scale of [1,2]) {
      const {page,context}=await open({singleMode:true,free:true,width:320,height:844,scale});
      await capture(page,`single-free-${scale}x`);
      // RN Web's box-none CSS re-enables HUD descendants, unlike native hit testing.
      // Use the exposed immersive surface, as the existing milestone suite does.
      // Enlarged mode owns its descendants and supports the normal center click.
      await button(page,'النقر الحر').click(scale===1 ? {position:{x:2,y:300}} : {});
      await page.waitForFunction(()=>window.storageAPI.counterPersistence.getSnapshot().value.count===45);
      await button(page,'إنهاء وضع النقر الحر').click();
      await page.getByTestId('central-counter-text').filter({hasText:'٤٥'}).waitFor();
      results.push({singleFreeTap:true,fontScale:scale,sharedCount:true,exitNoExtraTap:true});
      await context.close();
    }
    if(phase==='after') for(const singleMode of [false,true]) for(const free of [false,true]) {
      const {page,context}=await open({singleMode,free,count:99,dhikrId:'sayyid_istighfar',width:320,scale:2});
      const phrase=page.getByTestId(singleMode ? (free ? 'single-free-phrase' : 'single-dhikr-phrase') : 'routine-phrase').last();
      const clamp=await phrase.evaluate(el=>getComputedStyle(el).webkitLineClamp);
      assert.ok(!clamp || clamp==='none','full wording must not be line-clamped');
      const preview=await phrase.textContent();
      const wording=await page.evaluate(id=>window.dhikrDefinitions.find(d=>d.id===id).phrase,singleMode?'sayyid_istighfar':'tahlil');
      assert.ok(wording.startsWith(preview));
      await page.getByText('مقتطف من الذكر',{exact:true}).last().waitFor();
      assert.equal(await page.getByTestId(singleMode?(free?'single-free-phrase-reader':'single-dhikr-phrase-reader'):'routine-phrase-reader').count(),0,'no clipped inline scroller');
      await button(page,'قراءة نص الذكر كاملًا').last().click();
      assert.equal(await page.getByTestId('expanded-dhikr-phrase').textContent(),wording);
      const increment=button(page,'تسجيل تسبيحة في وضع القراءة');
      await increment.click();
      await page.waitForFunction(singleMode=>singleMode ? window.storageAPI.counterPersistence.getSnapshot().value.count===45 : window.snapshot().value.session.completedRepetitions===100,singleMode);
      if(!singleMode) assert.equal(await increment.isDisabled(),true);
      await button(page,'تراجع في وضع القراءة').click();
      await page.waitForFunction(singleMode=>singleMode ? window.storageAPI.counterPersistence.getSnapshot().value.count===44 : window.snapshot().value.session.completedRepetitions===99,singleMode);
      assert.equal(await page.getByTestId('expanded-dhikr-phrase').textContent(),wording);
      for(const control of [increment,button(page,'تراجع في وضع القراءة')]) {
        const r=await control.boundingBox();
        assert.ok(r.x>=0 && r.x+r.width<=321 && r.y>=24 && r.y+r.height<=821 && r.width>=44 && r.height>=44);
      }
      assert.deepEqual(await page.evaluate(()=>window.animations),[],'reduced motion remains respected in reading mode');
      await capture(page,`reading-count-${singleMode?'single':'routine'}-${free?'free':'main'}-2x`);
      await button(page,'إغلاق نص الذكر').click();
      results.push({persistentReading:true,singleMode,free,fullWording:true,incrementUndoShared:true,completionCorrection:!singleMode});
      await context.close();
    }
    const narrow=phase==='before' ? [{width:320,height:640,scale:1},{width:320,height:844,scale:2}] :
      [{width:320,height:640,scale:1},{width:360,height:640,scale:1},{width:360,height:800,scale:1},
        {width:390,height:844,scale:1},{width:320,height:844,scale:2},{width:390,height:844,scale:2}];
    const themes=phase==='before' ? ['midnightSapphire'] : ['midnightSapphire','royalAmethyst','softIvory','obsidianEmber','glacierPrism','solarPulse'];
    for(const dimensions of narrow) for(const theme of themes) for(const free of [false,true]) {
      const config={...dimensions,theme,free,count:99,name:`${theme}-${dimensions.width}x${dimensions.height}-${dimensions.scale}x-${free?'free':'main'}`};
      const {page,context}=await open(config);
      await capture(page,config.name);
      results.push(await inspect(page,config));
      if(phase==='after' && dimensions.scale===2) {
        await button(page,'قراءة نص الذكر كاملًا').last().click();
        const full=page.getByTestId('expanded-dhikr-phrase');
        await full.waitFor(); assert.match(await full.textContent(),/قَدِيرٌ/);
        await capture(page,`${config.name}-reading`);
        await button(page,'إغلاق نص الذكر').click();
        await ring(page).scrollIntoViewIfNeeded();
        await button(page,'تراجع').last().scrollIntoViewIfNeeded();
        assert.ok(await button(page,'تراجع').last().isEnabled());
      }
      await context.close();
    }
    {
      const {page,context}=await open({singleMode:true});
      await button(page,'التسبيحات الكاملة').click();
      await capture(page,'catalog-initial');
      if(phase==='after') {
        const definitions=await page.evaluate(()=>window.routines);
        assert.equal(await page.getByTestId('routine-sequence-card').count(),3);
        assert.equal(await page.getByTestId('routine-sequence-summary').filter({hasText:'التكبير ٣٤'}).count(),1);
        for(const r of definitions) {
          const previous=await page.evaluate(()=>window.openedSources ?? []);
          await button(page,`تفاصيل المصدر: ${r.source.collection}، الحديث ${r.source.reference}`).click();
          assert.deepEqual(await page.evaluate(()=>window.openedSources ?? []),previous,'inspecting a citation must not open a website');
          await page.getByTestId('source-citation').filter({hasText:r.source.collection}).waitFor();
          await page.getByRole('link',{name:'فتح المصدر',exact:true}).click();
          await button(page,'إغلاق مرجع الحديث').click();
        }
        assert.deepEqual(await page.evaluate(()=>window.openedSources),definitions.map(r=>r.source.url));
        await page.evaluate(()=>{window.failLink=true;});
        await button(page,`تفاصيل المصدر: ${definitions[3].source.collection}، الحديث ${definitions[3].source.reference}`).click();
        await page.getByRole('link',{name:'فتح المصدر',exact:true}).click();
        await page.getByText('تعذّر فتح المصدر. حاول مرة أخرى.',{exact:true}).waitFor();
        assert.equal(await page.evaluate(()=>window.snapshot().value.session.completedRepetitions),3);
        await button(page,'إغلاق مرجع الحديث').click();
        assert.equal(await page.getByText('https://',{exact:false}).count(),0);
        results.push({sourceDestinations:true,failureHandled:true,noAccidentalCounting:true});
      }
      await page.getByRole('button',{name:/بدء تسبيح ما قبل النوم/}).scrollIntoViewIfNeeded();
      await capture(page,'catalog-remaining');
      await context.close();
    }
    assert.deepEqual(errors,[]);
    const files=['App.tsx','src/components/RoutineExperience.tsx','src/components/Modals.tsx','src/components/FreeTapMode.tsx','src/routines.ts','src/storage.ts','src/persistence.ts','src/counter.ts','src/beads.ts','src/theme.ts'];
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({phase,date:'2026-10-19',evidence:'Actual App via React Native Web; OS APIs mocked; scaled styles approximate native text scaling',
      files:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])),results,errors},null,2));
    console.log(JSON.stringify({phase,output,cases:results.length,errors}));
  } catch(error) {
    for(const c of browser.contexts()) for(const p of c.pages()) await p.screenshot({path:path.join(output,'failure.png')});
    throw error;
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
