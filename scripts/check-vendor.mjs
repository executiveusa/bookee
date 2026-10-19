// Optional dev tool: re-hash a live renderer source dir and compare against VENDORED.md.
// Usage: VENDOR_LIVE_DIR=/path/to/live-source node scripts/check-vendor.mjs
import { execSync } from "node:child_process";
const dir = process.env.VENDOR_LIVE_DIR;
if (!dir) { console.log("set VENDOR_LIVE_DIR to compare against a live source"); process.exit(0); }
const files = ["book.js","book.css","fit-text.js"];
let drift = 0;
for (const f of files) {
  try {
    const live = execSync(`md5sum ${dir}/${f}`).toString().split(" ")[0];
    const vend = execSync(`md5sum engine/vendor/flipbook-renderer/${f}`).toString().split(" ")[0];
    if (live !== vend) { console.log(`DRIFT: ${f}`); drift++; }
  } catch { console.log(`SKIP: ${f}`); }
}
console.log(drift ? `${drift} file(s) drifted - re-vendor deliberately` : "vendor snapshot matches live source");
