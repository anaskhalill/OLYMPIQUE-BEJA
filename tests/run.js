/*
 * Security test runner. Executes every board test suite in a child process so
 * an early failure cannot stop the remaining suites. Exits non-zero if any
 * suite fails.
 *
 * Usage: node tests/run.js
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const suites = [
  "catalog-auth.test.js",
  "points-flow.test.js",
  "trivia-flow.test.js",
  "stripe-flow.test.js",
];

let failed = 0;
for (const file of suites) {
  const full = path.join(__dirname, file);
  console.log(`\n=== ${file} ===`);
  const r = spawnSync(process.execPath, [full], { stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) {
    failed++;
    console.log(`[RESULT] ${file}: FAILED`);
  } else {
    console.log(`[RESULT] ${file}: OK`);
  }
}

console.log(`\n=== SUMMARY: ${suites.length - failed}/${suites.length} suites passed ===`);
process.exit(failed === 0 ? 0 : 1);
