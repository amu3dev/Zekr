// Output selection only; importing this helper never launches a browser.
const fs = require('node:fs');
const path = require('node:path');
module.exports = function qaOutput(suite) {
  if (process.env.ZEKR_QA_OUTPUT) return path.resolve(process.env.ZEKR_QA_OUTPUT);
  const base = path.resolve(__dirname, '../../.qa-artifacts');
  fs.mkdirSync(base, { recursive: true });
  return fs.mkdtempSync(path.join(base, `${suite}-`));
};
