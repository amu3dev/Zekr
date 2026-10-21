// One specifically approved outside-sandbox invocation. Stop on the first failure;
// never retry a browser crash. The existing regression batch remains unchanged.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
for (const suite of ['smart-reading-browser.cjs', 'run-ui-regressions.cjs']) {
  const run = spawnSync(process.execPath, [path.join(__dirname, suite)], { stdio: 'inherit', env: process.env });
  if (run.status !== 0 || run.signal) { process.exitCode = 1; break; }
}
