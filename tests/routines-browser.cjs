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
    export const Linking = {openURL:async()=>{}};
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

(async()=>{
  const {chromium}=require(process.env.ZEKR_QA_PLAYWRIGHT || resolveQA('playwright'));
  const browser=await chromium.launch({headless:true,chromiumSandbox:true,
    ...(process.env.ZEKR_QA_CHROME ? {executablePath:process.env.ZEKR_QA_CHROME}: {})});
  const errors=[], results=[];
  const button=(page,name)=>page.getByRole('button',{name,exact:true});
  const ring=page=>page.getByRole('button',{name:/^عدّاد /}).last();
  const accessibilityValue=locator=>locator.evaluate(el=>{
    let fiber=el[Object.keys(el).find(key=>key.startsWith('__reactFiber$'))];
    let root=fiber; while(root.return) root=root.return;
    const find=node=>{
      if(!node) return null;
      if(node.stateNode===el) return node;
      return find(node.child) || find(node.sibling);
    };
    fiber=find(root.stateNode.current);
    while(fiber && !fiber.memoizedProps?.accessibilityValue) fiber=fiber.return;
    return fiber?.memoizedProps.accessibilityValue.text;
  });
  const capture=async(page,name)=>{await page.waitForTimeout(100); await page.screenshot({path:path.join(output,`${name}.png`)});};
  async function mount(page) {
    await page.addScriptTag({content:bundle}); await page.evaluate(()=>window.mountApp());
    await page.waitForFunction(()=>window.storageAPI.counterPersistence.getSnapshot().hydration==='ready' && window.snapshot().hydration!=='loading');
    await button(page,'تخطي المقدمة').waitFor({state:'hidden'});
  }
  async function open({raw, scale=1, width=390, reduced=true, savedRoutine, failRead=0, failWrite=0, theme='midnightSapphire'}={}) {
    const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:reduced?'reduce':'no-preference'});
    const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
    page.setDefaultTimeout(10000);
    await page.route('http://qa.zekr.test/**',r=>r.fulfill({contentType:'text/html',body:
      '<html lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div></body></html>'}));
    await page.goto('http://qa.zekr.test');
    await page.evaluate(({single,counterKey,routineKey,raw,savedRoutine,scale,reduced,failRead,failWrite,theme})=>{
      localStorage.setItem(counterKey,JSON.stringify(single));
      localStorage.setItem('@dhikr/theme/v1',theme);
      if(raw!==undefined || savedRoutine) localStorage.setItem(routineKey,raw ?? JSON.stringify(savedRoutine));
      window.textScale=scale; window.reducedMotion=reduced;
      window.routineFaults={read:failRead,write:failWrite};
      window.routineWrites=[];
      const get=Storage.prototype.getItem, set=Storage.prototype.setItem;
      window.diskGet=key=>get.call(localStorage,key);
      Storage.prototype.getItem=function(key){
        if(key===routineKey && window.routineFaults.read-->0) throw Error('isolated routine read failure');
        return get.call(this,key);
      };
      Storage.prototype.setItem=function(key,value){
        if(key===routineKey) {window.routineWrites.push(value);
          if(window.routineFaults.write-->0) throw Error('isolated routine write failure');}
        return set.call(this,key,value);
      };
    },{single,counterKey,routineKey,raw,savedRoutine,scale,reduced,failRead,failWrite,theme});
    await mount(page); return {context,page};
  }
  async function count(page,expected) {
    await page.waitForFunction(value=>window.snapshot().value.session?.completedRepetitions===value,expected);
    // Store mutation precedes the React commit. Wait for the rendered overall label too.
    const arabic=String(expected).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
    const labels=page.getByTestId('routine-overall');
    if(await labels.count()) await labels.last().filter({hasText:`${arabic} من`}).waitFor();
  }
  async function burst(page,n) {
    await page.evaluate(n=>{
      const el=document.querySelector('[aria-label^="عدّاد "]');
      let fiber=el[Object.keys(el).find(key=>key.startsWith('__reactFiber$'))];
      while(fiber && fiber.type?.name!=='CounterRing') fiber=fiber.return;
      if(!fiber) throw Error('Missing actual counter component');
      for(let i=0;i<n;i++) fiber.memoizedProps.onPress();
    },n);
  }
  async function save(page) {
    await page.evaluate(async()=>{await window.storageAPI.routinePersistence.flush(); await window.storageAPI.counterPersistence.flush();});
  }
  try {
    const {context,page}=await open();
    await button(page,'التسبيحات الكاملة').click();
    const definitions=await page.evaluate(()=>window.routines);
    assert.equal(definitions.length,4);
    for(const r of definitions) {
      await page.getByRole('button',{name:`تفاصيل المصدر: ${r.source.collection}، الحديث ${r.source.reference}`,exact:true}).waitFor();
      assert.equal(await button(page,`بدء ${r.title}`).count(),1);
    }
    await capture(page,'catalog');
    await button(page,`بدء ${definitions[0].title}`).click();
    await burst(page,32); await count(page,32);
    // Use a real pointer on the boundary; component identity/focus stays stable.
    const counter=ring(page); await counter.focus(); await counter.click(); await count(page,33);
    assert.match(await accessibilityValue(counter),/المرحلة ٢ من ٤، ٠ من ٣٣/);
    assert.equal(await counter.evaluate(el=>document.activeElement===el),true);
    assert.equal((await page.evaluate(()=>window.announcements)).length,1);
    await counter.click(); await count(page,34);
    assert.equal((await page.evaluate(()=>window.announcements)).length,1);
    await button(page,'تراجع').click(); await count(page,33);
    await button(page,'تراجع').click(); await count(page,32);
    assert.match(await accessibilityValue(counter),/المرحلة ١ من ٤، ٣٢ من ٣٣/);
    await counter.click(); await count(page,33);
    await button(page,'النقر الحر').click();
    await ring(page).click(); await count(page,34);
    await button(page,'إنهاء وضع النقر الحر').click(); await count(page,34);
    assert.equal(await page.evaluate(()=>window.storageAPI.counterPersistence.getSnapshot().value.count),44);
    assert.equal(await page.evaluate(()=>window.storageAPI.counterPersistence.getSnapshot().value.totalSessionCount),500);
    await ring(page).scrollIntoViewIfNeeded();
    const beforeLong=await ring(page).boundingBox();
    await burst(page,65); await count(page,99);
    const afterLong=await ring(page).boundingBox();
    assert.ok(Math.abs(beforeLong.y-afterLong.y)<1,'automatic transition must keep the counting surface in place');
    assert.match(await page.getByTestId('routine-phrase').textContent(),/لَا إِلَهَ/);
    await capture(page,'tahlil');
    await ring(page).click(); await count(page,100);
    assert.equal(await ring(page).isDisabled(),true);
    await page.getByText('أتممت الورد بحمد الله',{exact:true}).waitFor();
    await capture(page,'completion');
    const completions=await page.evaluate(()=>window.announcements.filter(s=>s==='أتممت الورد بحمد الله').length);
    assert.equal(completions,1);
    await burst(page,10); await count(page,100);
    assert.equal(await page.evaluate(()=>window.snapshot().value.totalRecorded),100);
    await button(page,'تراجع').click(); await count(page,99);
    assert.equal(await ring(page).isDisabled(),false);
    await ring(page).click(); await count(page,100);
    await button(page,'خيارات الورد').click();
    await button(page,'إعادة بدء الورد').click();
    await button(page,'نعم، ابدأ الورد').click(); await count(page,0);
    await burst(page,34); await count(page,34);
    assert.equal(await page.evaluate(()=>window.snapshot().value.totalRecorded),134);
    await button(page,'خيارات الورد').click();
    await button(page,'العودة للتسبيح الفردي').click();
    await page.getByText('٤٤ من ٦٦',{exact:true}).waitFor();
    await button(page,'التسبيحات الكاملة').click();
    await button(page,`بدء ${definitions[2].title}`).click();
    await button(page,'إلغاء').click();
    await count(page,34);
    await button(page,`استئناف ${definitions[0].title}`).click();
    await save(page); await page.reload(); await mount(page); await count(page,34);
    assert.match(await accessibilityValue(ring(page)),/المرحلة ٢ من ٤، ١ من ٣٣/);
    assert.equal((await page.evaluate(()=>window.announcements)).length,0,'restoration must not replay transitions');
    results.push({journey:'boundaries, undo, completion, restart, leave, confirmation cancel, restore',pass:true});

    const themes=await page.evaluate(()=>window.themes.map(({id,displayName})=>({id,displayName})));
    for(const theme of themes) {
      const before=await page.evaluate(()=>window.snapshot().value);
      await button(page,'القائمة والإعدادات').click();
      await page.getByText('٦٣٤',{exact:true}).waitFor();
      await page.getByRole('button',{name:/استعراض المظاهر/}).click();
      await page.getByRole('radio',{name:new RegExp(`مظهر ${theme.displayName}،`)}).click();
      await button(page,'العودة إلى الإعدادات').first().click();
      await button(page,'إغلاق').click();
      await button(page,'إغلاق').waitFor({state:'hidden'});
      assert.deepEqual(await page.evaluate(()=>window.snapshot().value),before);
      await page.getByTestId('routine-phrase').scrollIntoViewIfNeeded();
      await capture(page,`main-${theme.id}`);
      await button(page,'النقر الحر').click();
      await capture(page,`free-${theme.id}`);
      await button(page,'إنهاء وضع النقر الحر').click();
      assert.deepEqual(await page.evaluate(()=>window.snapshot().value),before);
      results.push({theme:theme.id,main:true,freeTap:true,progressPreserved:true});
    }
    // Reduced motion disables count/transition animations; changing the OS setting enables them.
    await page.evaluate(()=>{window.animations=[];window.announcements=[];});
    await ring(page).click(); await count(page,35);
    assert.deepEqual(await page.evaluate(()=>window.animations),[]);
    await page.evaluate(()=>window.motion(false));
    await ring(page).click(); await count(page,36);
    assert.ok((await page.evaluate(()=>window.animations)).length>0);
    await page.evaluate(()=>window.motion(true));
    await button(page,'خيارات الورد').click();
    await button(page,'اختيار ورد آخر').click();
    await button(page,`بدء ${definitions[3].title}`).click();
    await button(page,'نعم، ابدأ الورد').click(); await count(page,0);
    await burst(page,99); await count(page,99);
    await ring(page).click(); await count(page,100);
    const beads=await ring(page).evaluate(el=>{
      const svg=el.parentElement.parentElement.querySelector('svg');
      return {total:svg.querySelectorAll('circle[r="7.2"]').length,
        active:svg.querySelectorAll('circle[r="7.2"][fill="url(#activeBeadSphere)"]').length};
    });
    assert.deepEqual(beads,{total:33,active:1});
    await capture(page,'34-with-33-beads');
    await button(page,'القائمة والإعدادات').click();
    await page.getByText('٧٣٦',{exact:true}).waitFor();
    await page.getByText('تصفير الإحصائيات',{exact:true}).click();
    await button(page,'نعم، حذف وتصفير').click();
    await page.waitForFunction(()=>window.snapshot().value.totalRecorded===0 &&
      window.snapshot().value.session===null && window.storageAPI.counterPersistence.getSnapshot().value.totalSessionCount===0);
    results.push({combinedStatistics:true,confirmedResetClearsBoth:true});
    results.push({reducedMotion:true,motionSettingChange:true,beads});
    await context.close();

    for(const scale of [1,2]) {
      for(const theme of scale===2 ? themes : themes.slice(0,1)) {
      const savedRoutine={version:1,inRoutine:true,totalRecorded:99,
        session:{routineId:'afterPrayer99Tahlil',definitionVersion:1,completedRepetitions:99}};
      const {context,page}=await open({scale,width:320,savedRoutine,theme:theme.id});
      for(const free of [false,true]) {
        if(free) await button(page,'النقر الحر').click();
        // The compact phrase intentionally offers expanded reading. Verify the
        // entire wording there instead of treating the two-line preview as full text.
        const originalPhrase=await page.evaluate(()=>window.dhikrDefinitions.find(d=>d.id==='tahlil').phrase);
        assert.ok(originalPhrase.startsWith(await page.getByTestId('routine-phrase').last().textContent()));
        await page.getByText('مقتطف من الذكر',{exact:true}).last().waitFor();
        await button(page,'قراءة نص الذكر كاملًا').click();
        const phrase=page.getByTestId('expanded-dhikr-phrase');
        assert.equal(await phrase.textContent(),originalPhrase);
        const geometry=await phrase.evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,
          height:el.clientHeight,scrollHeight:el.scrollHeight,overflow:getComputedStyle(el).textOverflow,
          clamp:getComputedStyle(el).webkitLineClamp}));
        assert.ok(geometry.width>=180 && geometry.scrollWidth<=geometry.width+1);
        assert.ok(geometry.scrollHeight<=geometry.height+1);
        assert.notEqual(geometry.overflow,'ellipsis');
        assert.ok(!geometry.clamp || geometry.clamp==='none');
        await capture(page,`tahlil-${theme.id}-320-${scale}x-${free?'free':'main'}-reading`);
        await button(page,'إغلاق نص الذكر').click();
        await capture(page,`tahlil-${theme.id}-320-${scale}x-${free?'free':'main'}`);
        await ring(page).scrollIntoViewIfNeeded();
        assert.ok(await ring(page).isVisible());
        if(free) await button(page,'إنهاء وضع النقر الحر').click();
        for(const id of ['routine-phrase','routine-step','routine-overall']) {
          const bounds=await page.getByTestId(id).last().boundingBox();
          assert.ok(bounds.x>=0 && bounds.x+bounds.width<=321,`${id} exceeds the narrow viewport`);
        }
        results.push({theme:theme.id,width:320,textScale:scale,free,phraseGeometry:geometry});
      }
      await context.close();
      }
    }
    {
      const savedRoutine={version:1,inRoutine:true,totalRecorded:32,
        session:{routineId:'afterPrayer99Tahlil',definitionVersion:1,completedRepetitions:32}};
      const {context,page}=await open({savedRoutine,failWrite:100});
      await ring(page).click(); await count(page,33);
      await page.evaluate(()=>window.storageAPI.routinePersistence.flush());
      await page.getByText('التغييرات لم تُحفظ بعد',{exact:true}).waitFor();
      // The visible warning must not require dismissing a layer to keep counting.
      await burst(page,1); await count(page,34);
      assert.equal(await page.evaluate(()=>window.snapshot().saveStatus),'error');
      assert.equal(await page.evaluate(key=>JSON.parse(window.diskGet(key)).session.completedRepetitions,routineKey),32);
      await capture(page,'save-failure');
      await page.evaluate(()=>{window.routineFaults.write=0;});
      await button(page,'إعادة محاولة الحفظ').click();
      await page.waitForFunction(()=>window.snapshot().saveStatus==='saved');
      assert.equal(await page.evaluate(key=>JSON.parse(window.diskGet(key)).session.completedRepetitions,routineKey),34);
      assert.equal(await page.evaluate(()=>window.snapshot().value.totalRecorded),34);
      results.push({saveFailureRetainsLatest:true,retry:true,noDoubleAggregate:true});
      await context.close();
      const restored=await open({savedRoutine,failRead:1});
      await button(restored.page,'إعادة محاولة استعادة الورد').waitFor();
      assert.deepEqual(await restored.page.evaluate(()=>window.routineWrites),[]);
      await button(restored.page,'إعادة محاولة استعادة الورد').click();
      await count(restored.page,32);
      assert.deepEqual(await restored.page.evaluate(()=>window.routineWrites),[]);
      results.push({readFailureProtected:true,retryRestores:true});
      await restored.context.close();
    }
    for(const raw of ['{', '', JSON.stringify({version:1,inRoutine:true,totalRecorded:20,
      session:{routineId:'unknown',definitionVersion:1,completedRepetitions:20}})]) {
      const {context,page}=await open({raw});
      await button(page,'إعادة محاولة استعادة الورد').waitFor();
      await ring(page).click();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),routineKey),raw);
      assert.equal(await page.evaluate(()=>window.snapshot().hydration),'error');
      assert.equal(await page.evaluate(()=>window.storageAPI.counterPersistence.getSnapshot().value.count),45);
      results.push({corruptRoutineProtected:true,singleAvailable:true});
      await context.close();
    }
    assert.deepEqual(errors,[]);
    const files=['App.tsx','src/routines.ts','src/storage.ts','src/components/RoutineExperience.tsx','src/components/CounterRing.tsx'];
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({date:'2026-10-19',evidence:'Actual React Native Web App; mocked OS APIs; doubled styles approximate 200% text, not native font scaling',
      files:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])),results,errors},null,2));
    console.log(JSON.stringify({output,scenarios:results.length,errors}));
  } catch(error) {
    for(const context of browser.contexts()) for(const page of context.pages()) {
      await page.screenshot({path:path.join(output,'failure.png')});
      console.error('Rendered progress:',await page.getByTestId('routine-overall').allTextContents());
    }
    throw error;
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
