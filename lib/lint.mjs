// Editorial lint. Reports only. Never edits the author's words.
const FILLER = ["delve","tapestry","in today's fast-paced","game-changer","unlock the power","navigate the landscape","it's important to note","seamless","leverage","robust"];
export function lintGuide(chapters) {
  const out = [];
  chapters.forEach((c, i) => {
    const text = c.md; const where = `chapter ${i + 1} "${c.title}"`;
    if (c.words < 120 && c.kind === "chapter") out.push({ where, note: `short (${c.words} words)` });
    if (c.words > 1800) out.push({ where, note: `long (${c.words} words); consider splitting` });
    for (const f of FILLER) if (text.toLowerCase().includes(f)) out.push({ where, note: `stock phrase: "${f}"` });
    if ((text.match(/—/g) || []).length) out.push({ where, note: "contains em dashes" });
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    sentences.forEach((s) => { const w = s.split(/\s+/).length; if (w > 45) out.push({ where, note: `very long sentence (${w} words): "${s.slice(0, 50)}..."` }); });
  });
  return out;
}
export function lintAdventure(src) {
  const out = []; const filler = FILLER.filter((f) => src.toLowerCase().includes(f));
  filler.forEach((f) => out.push({ where: "story", note: `stock phrase: "${f}"` }));
  if ((src.match(/—/g) || []).length) out.push({ where: "story", note: "contains em dashes" });
  return out;
}
