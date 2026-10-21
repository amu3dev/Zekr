// Supported-browser preview only. This command never launches a browser.
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
    export const Linking = {openURL:async(url:string)=>{ console.info('QA_SOURCE_OPEN '+url); ((window as any).openedSources ??= []).push(url); if((window as any).failLink) throw Error('Injected source open failure'); }};
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
  window.storageAPI=storage; window.themes=THEME_OPTIONS; window.routines=ROUTINES;
  window.snapshot=()=>storage.routinePersistence.getSnapshot();
  window.mountApp=()=>createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`);
require(resolveQA('esbuild')).buildSync({entryPoints:[path.join(scratch,'entry.tsx')], bundle:true,
  outfile:path.join(scratch,'bundle.js'), jsx:'automatic', nodePaths:[qaModules,'/Users/ayosry/work/Zekr/node_modules'],
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


const http=require('node:http');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.end(bundle);}
 const count=Number(u.searchParams.get('count') || 3),scale=Number(u.searchParams.get('scale') || 1);
 const fixture={counter:{...single,fullScreenTap:u.searchParams.get('free')==='1',dhikrId:u.searchParams.get('dhikr') || 'tasbih_tahmid'},
 routine:{version:1,inRoutine:u.searchParams.get('single')!=='1',totalRecorded:count,session:{routineId:'afterPrayer99Tahlil',definitionVersion:1,completedRepetitions:count}},
 theme:u.searchParams.get('theme') || 'midnightSapphire',scale};
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end(`<html lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div><script>
 const fixture=${JSON.stringify(fixture).replace(/</g,'\u003c')};
 if(!${u.searchParams.get('restore')==='1'}) localStorage.clear();localStorage.setItem('${counterKey}',JSON.stringify(fixture.counter));localStorage.setItem('${routineKey}',JSON.stringify(fixture.routine));localStorage.setItem('@dhikr/theme/v1',fixture.theme);window.textScale=fixture.scale;window.reducedMotion=${u.searchParams.get('motion')!=='1'};window.screenReader=${u.searchParams.get('reader')==='1'};
 if(!${u.searchParams.get('restore')==='1'}) localStorage.setItem('@dhikr/reading/v1',JSON.stringify({mode:'${u.searchParams.get('mode') || 'full'}',speed:'normal',progression:'manual'}));window.failLink=${u.searchParams.get('linkFailure')==='1'};
 </script><script src="/bundle.js"></script><script>window.mountApp();</script></body></html>`);
});
server.listen(Number(process.env.ZEKR_PREVIEW_PORT || 4183),'127.0.0.1',()=>console.log('Preview ready'));
