import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as counter from '../../src/counter.ts';
import * as persistence from '../../src/persistence.ts';
import * as theme from '../../src/theme.ts';
import * as routines from '../../src/routines.ts';
import * as smartReading from '../../src/smartReading.ts';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('../../node_modules/@react-native-async-storage/async-storage/', import.meta.url));
const storageFile = fileURLToPath(new URL('../../src/storage.ts', import.meta.url));

function evaluateCommonJS(filename, overrides = {}, globals = {}, source = readFileSync(filename, 'utf8')) {
  const module = { exports: {} };
  const localRequire = createRequire(filename);
  runInNewContext(source, { module, exports: module.exports,
    require: id => Object.hasOwn(overrides, id) ? overrides[id] : localRequire(id),
    setTimeout, clearTimeout, setImmediate, console, ...globals }, { filename });
  return module.exports;
}

// These are the installed JS adapters, not copies of their implementation.
// Only the native bridge (or the web window.localStorage object) is simulated.
// No React Native runtime, browser profile or device storage is ever accessed.
export function adapterFixture(platform, entries = []) {
  const disk = new Map(entries);
  const calls = { reads: [], writes: [], keys: 0 };
  const faults = { read: false, nullRead: false, keys: false, keysResult: undefined, keysErrorWithResult: false };
  let adapter;
  if (platform === 'native') {
    const bridge = {
      multiGet: (keys, callback) => {
        calls.reads.push(...keys);
        if (faults.read) callback([{ message: 'Injected native read failure' }], null);
        else callback(null, keys.map(key => [key, !faults.nullRead && disk.has(key) ? disk.get(key) : null]));
      },
      multiSet: (pairs, callback) => {
        for (const [key, value] of pairs) { calls.writes.push([key, value]); disk.set(key, value); }
        callback(null);
      },
      getAllKeys: callback => {
        calls.keys++;
        if (faults.keys) callback({ message: 'Injected native enumeration failure' }, null);
        else callback(faults.keysErrorWithResult ? { message: 'Enumeration error with result' } : null,
          faults.keysResult === undefined ? [...disk.keys()] : faults.keysResult);
      },
    };
    adapter = evaluateCommonJS(`${packageRoot}lib/commonjs/AsyncStorage.native.js`, { './RCTAsyncStorage': bridge }).default;
  } else if (platform === 'web') {
    const localStorage = {
      getItem(key) {
        calls.reads.push(key);
        if (faults.read) throw Error('Injected web read failure');
        return !faults.nullRead && disk.has(key) ? disk.get(key) : null;
      },
      setItem(key, value) { calls.writes.push([key, value]); disk.set(key, value); },
      get length() {
        calls.keys++;
        if (faults.keys) throw Error('Injected web enumeration failure');
        return disk.size;
      },
      key(index) { return [...disk.keys()][index] ?? null; },
    };
    adapter = evaluateCommonJS(`${packageRoot}lib/commonjs/AsyncStorage.js`, {}, { window: { localStorage } }).default;
  } else {
    throw Error(`Unknown test platform: ${platform}`);
  }
  const source = ts.transpileModule(readFileSync(storageFile, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const storage = evaluateCommonJS(storageFile, {
    '@react-native-async-storage/async-storage': { __esModule: true, default: adapter },
    './counter': counter, './persistence': persistence, './theme': theme, './routines': routines, './smartReading': smartReading,
  }, {}, source);
  return { adapter, storage, disk, calls, faults };
}

export const adapterVersion = require(`${packageRoot}package.json`).version;
