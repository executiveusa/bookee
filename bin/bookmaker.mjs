#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildHtml, loadBook, slugify } from "../lib/build.mjs";
import { validateInk } from "../lib/validate.mjs";
import { lintGuide, lintAdventure } from "../lib/lint.mjs";
import { plan } from "../lib/outline.mjs";
import { loadProposal, checkProposal } from "../lib/proposal.mjs";
const [cmd, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : d; };
const target = rest.find((a, i) => !a.startsWith("--") && !(rest[i - 1] || "").startsWith("--"));
const usage = `bookmaker <command>
  plan  --kind guide|adventure --does "..." --reader "..." --say "..."   print the chapter plan (no prose is written)
  new   <dir> --kind guide|adventure|proposal                                     scaffold a book folder
  check <dir>                                                            validate paths (adventure), lint (reports only), list media slots
  build <dir> [--out dist]                                               one self-contained HTML book`;
if (cmd === "plan") {
  console.log(JSON.stringify(plan({ kind: flag("kind", "guide"), does: flag("does"), reader: flag("reader"), say: flag("say") }), null, 2));
} else if (cmd === "new") {
  if (!target) { console.log(usage); process.exit(1); }
  const kind = flag("kind", "guide"); fs.mkdirSync(path.join(target, "art"), { recursive: true });
  const title = path.basename(target);
  if (kind === "proposal") {
    fs.writeFileSync(path.join(target, "proposal.json"), JSON.stringify({
      id: path.basename(target), title, brand: "YOUR BRAND", provider: "Your Company", client: "Client Name", date: new Date().toISOString().slice(0, 10),
      pages: [
        { title: "Cover", kind: "cover front-cover", md: "" },
        { title: "The problem", kicker: "WHY", md: "# The problem\n\nWhat is broken for the client." },
        { title: "The plan", kicker: "WHAT", md: "# The plan\n\nYour 30/60/90 or three stages." },
        { title: "The offer", kicker: "OFFER", md: "# The offer\n\nOne clear offer." },
        { title: "Investment", kind: "proposal-page legal-page", md: "## $0,000\n\nPayment structure here." },
        { title: "Signatures", kind: "proposal-page legal-page", md: "# Signatures\n\nProvider: ______  Client: ______  Date: ______" },
        { title: "End", kind: "back-cover", md: "" }
      ]
    }, null, 2) + "\n");
  } else if (kind === "adventure") {
    fs.writeFileSync(path.join(target, "book.json"), JSON.stringify({ title, subtitle: "", author: "", slots: true }, null, 2) + "\n");
    fs.writeFileSync(path.join(target, "story.ink"), `VAR seen = 0\n=== start ===\n# image: cover\nWrite the first page here.\n+ [First choice] -> ending_one\n+ [Second choice] -> ending_one\n=== ending_one ===\n# ending: The first ending\nWrite the ending here.\n-> END\n`);
  } else {
    fs.writeFileSync(path.join(target, "book.md"), `---\ntitle: ${title}\nsubtitle: \nauthor: \n---\n\n# Who this is for\n\n# What goes wrong\n\n# Your method\n\n# About the author\n`);
  }
  console.log("created", target);
} else if (cmd === "check") {
  if (!target) { console.log(usage); process.exit(1); }
  if (fs.existsSync(path.join(target, "proposal.json"))) {
    const book = loadProposal(target); const r = checkProposal(book);
    console.log(`proposal: ${book.pages.length} pages, brand "${book.meta.brand}", client "${book.meta.client}"`);
    r.notes.forEach((n) => console.log(" -", n));
    console.log("note: check reports only. It never changes your words.");
    process.exit(r.bad);
  }
  const book = loadBook(target); let bad = 0;
  if (book.mode === "adventure") {
    if (book.inkErrors?.length) { console.log("INK ERRORS:\n" + book.inkErrors.join("\n")); process.exit(1); }
    const vars = [...book.src.matchAll(/^VAR (\w+)/gm)].map((m) => m[1]);
    const v = validateInk(book.ink, { vars });
    console.log(`paths: ${v.uniqueStates} states, max depth ${v.maxDepth ?? "?"}`);
    console.log(`endings reached: ${v.endings.length}  ${v.endings.map((e) => e.name + "@" + e.shortest).join(", ")}`);
    console.log(`dead ends: ${v.deadEnds.length}   unreachable knots: ${v.unreachable?.length ?? 0}   truncated: ${!!v.truncated}`);
    if (v.deadEnds.length || v.unreachable?.length) bad = 1;
    const l = lintAdventure(book.src); l.forEach((x) => console.log("lint:", x.where, "-", x.note));
    console.log("media slots:");
    book.slots.forEach((s) => console.log(`  ${s.filled ? "filled " : "EMPTY  "} ${s.kind} ${s.id}${s.filled ? "" : "   -> drop art/" + s.id + ".jpg|png|svg"}`));
  } else {
    console.log(`guide: ${book.chapters.length} chapters, ${book.chapters.reduce((a, c) => a + c.words, 0)} words`);
    const l = lintGuide(book.chapters); l.forEach((x) => console.log("lint:", x.where, "-", x.note));
    if (!l.length) console.log("lint: nothing to report");
  }
  console.log("note: lint reports only. It never changes your words.");
  process.exit(bad);
} else if (cmd === "build") {
  if (!target) { console.log(usage); process.exit(1); }
  const out = flag("out", "dist");
  const { html, model } = buildHtml(target);
  const dir = path.join(out, model.id); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  console.log(`built ${path.join(dir, "index.html")} (${(html.length / 1024).toFixed(0)} KB, ${model.mode})`);
} else { console.log(usage); }
