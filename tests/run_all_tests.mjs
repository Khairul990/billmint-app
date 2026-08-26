import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.test.mjs'))
  .sort();

console.log(`\n======================================================`);
console.log(`🚀 RUNNING COMPLETE BILLQYRO REGRESSION TEST SUITE (${files.length} test suites)`);
console.log(`======================================================\n`);

let passedSuites = 0;
let failedSuites = [];

const origExit = process.exit;

for (const file of files) {
  console.log(`\n▶️  STARTING SUITE: ${file}`);
  let suiteError = null;
  process.exit = (code) => {
    if (code && code !== 0) {
      throw new Error(`Test suite ${file} explicitly called process.exit(${code})`);
    }
  };

  try {
    await import(`./${file}?t=${Date.now()}`);
    passedSuites++;
    console.log(`✅ COMPLETED SUITE: ${file}`);
  } catch (error) {
    console.error(`\n❌ FAILED SUITE: ${file}`);
    console.error(error.message);
    failedSuites.push({ file, error: error.message });
  }
}

process.exit = origExit;

console.log(`\n======================================================`);
console.log(`📊 FINAL REGRESSION SUMMARY`);
console.log(`   Passed Suites: ${passedSuites} / ${files.length}`);
console.log(`   Failed Suites: ${failedSuites.length}`);
if (failedSuites.length > 0) {
  console.log(`\nFailed Suites List:`);
  failedSuites.forEach(f => console.log(` - ${f.file}: ${f.error}`));
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${files.length} TEST SUITES PASSED PERFECTLY (100%)!`);
  process.exit(0);
}
