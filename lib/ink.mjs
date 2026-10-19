import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let inkjs;
function lib() {
  if (inkjs) return inkjs;
  const p = path.join(ROOT, "vendor/ink-compiler.js");
  const m = { exports: {} };
  const code = fs.readFileSync(p, "utf8");
  const fn = new Function("module", "exports", "require", code + "\n;return module.exports;");
  inkjs = fn(m, m.exports, require);
  return inkjs;
}
export function compileInk(src) {
  const { Compiler, CompilerOptions } = lib();
  const errors = [], warnings = [];
  const opts = new CompilerOptions(null, [], false, (msg, type) => { (type === 2 ? errors : warnings).push(msg); }, null);
  let json = null;
  try { const c = new Compiler(src, opts); json = c.Compile().ToJson(); } catch (e) { errors.push(String(e.message || e)); }
  return { json, errors, warnings };
}
export function Story(json) { return new (lib().Story)(json); }
