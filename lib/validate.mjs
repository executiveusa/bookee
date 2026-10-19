// Walk every reachable path of an ink story and report what a reader can actually hit.
import { Story } from "./ink.mjs";
export function validateInk(json, opts = {}) {
  const varNames = opts.vars || [];
  const stateKey = (c) => c.state.currentPathString + "|" + varNames.map((v) => String(c.variablesState[v])).join(",") + "|" + c.currentChoices.map((x) => x.text).join("/");
  const maxStates = opts.maxStates || 20000, maxDepth = opts.maxDepth || 60;
  const root = JSON.parse(json);
  const knots = Object.keys(root.root[root.root.length - 1] || {}).filter((k) => !k.startsWith("#") && k !== "global decl");
  const seenPaths = new Set(), endings = new Map(), deadEnds = [], longBeats = [];
  let beats = 0, explored = 0, maxSeenDepth = 0, truncated = false;
  const seenState = new Set();
  const s0 = new Story(json);
  function run(s) {
    const paras = [], tags = [];
    while (s.canContinue) { const before=s.state.currentPathString; if(before)seenPaths.add(before.split(".")[0]); const t = s.Continue().trim(); if (t) paras.push(t); (s.currentTags || []).forEach((x) => tags.push(x)); const p = s.state.currentPathString; if (p) seenPaths.add(p.split(".")[0]); { const pp = s.state.previousPointer; const pc = pp && pp.container && pp.container.path.toString(); if (pc) seenPaths.add(pc.split(".")[0]); } }
    knots.forEach(k => { if(s.state.VisitCountAtPathString(k)>0)seenPaths.add(k); });
    return { paras, tags, choices: s.currentChoices.length };
  }
  const stack = [{ state: null, depth: 0, trail: [] }];
  let first = run(s0); beats++;
  stack[0] = { state: s0.state.toJson(), depth: 0, trail: [], info: first };
  while (stack.length) {
    const node = stack.pop();
    const info = node.info;
    const words = info.paras.join(" ").split(/\s+/).filter(Boolean).length;
    if (words > (opts.maxWords || 85)) longBeats.push({ trail: node.trail.join(">"), words, starts: info.paras[0].slice(0, 48) });
    maxSeenDepth = Math.max(maxSeenDepth, node.depth);
    if (info.choices === 0) {
      const e = info.tags.map((t) => /^\s*ending\s*:\s*(.+)$/.exec(t)).filter(Boolean)[0];
      if (e) { const name = e[1].trim(); if (!endings.has(name) || endings.get(name).length > node.trail.length) endings.set(name, node.trail); }
      else deadEnds.push(node.trail.join(">"));
      continue;
    }
    if (node.depth >= maxDepth) { truncated = true; continue; }
    const s = new Story(json); s.state.LoadJson(node.state);
    const n = s.currentChoices.length;
    for (let k = 0; k < n; k++) {
      const c = new Story(json); c.state.LoadJson(node.state);
      c.ChooseChoiceIndex(k);
      const info2 = run(c);
      const key = stateKey(c) + "|" + info2.paras.join("\u0001") + "|" + info2.tags.join(",");
      explored++;
      if (seenState.has(key)) continue;
      seenState.add(key);
      if (seenState.size > maxStates) { truncated = true; break; }
      beats++;
      stack.push({ state: c.state.toJson(), depth: node.depth + 1, trail: [...node.trail, k], info: info2 });
    }
  }
  const unreachable = knots.filter((k) => !seenPaths.has(k));
  return { knots: knots.length, beatsSeen: beats, uniqueStates: seenState.size, maxDepth: maxSeenDepth, endings: [...endings].map(([name, trail]) => ({ name, shortest: trail.length, trail })), deadEnds, unreachable, longBeats: [...new Map(longBeats.map((b) => [b.starts, b])).values()], truncated };
}
