// One explicit, reviewable command for the requested browser regression batch.
// No retries; a failure (including browser registration/SIGABRT) stops the batch.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = require('./support/qa-output.cjs')('ui-regressions');
const suites = ['responsive','routines','milestones','persistence','launch','contrast','baseline'];
const results = [];
for (const suite of suites) {
  const dir = path.join(output, suite);
  fs.mkdirSync(dir, { recursive: true });
  const run = spawnSync(process.execPath, [path.join(__dirname, `${suite}-browser.cjs`)], {
    cwd: root, encoding: 'utf8', env: { ...process.env, QA_PHASE: 'after', ZEKR_QA_OUTPUT: dir },
  });
  fs.writeFileSync(path.join(dir, 'run.log'), `${run.stdout || ''}\n${run.stderr || ''}`);
  results.push({ suite, exit: run.status, signal: run.signal, output: dir });
  console.log(`${suite}: ${run.status === 0 ? 'PASS' : 'FAIL'} (${dir})`);
  fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(results, null, 2));
  if (run.status !== 0 || run.signal) {
    console.error(run.stderr || run.error || run.signal);
    process.exitCode = 1;
    break;
  }
}
