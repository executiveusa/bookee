/* Bookee reader engine. No framework. Reads window.__BOOK__. */
(function () {
  "use strict";
  var B = window.__BOOK__;
  var LS = (function () { try { localStorage.setItem("pbm", "1"); localStorage.removeItem("pbm"); return localStorage; } catch (e) { return { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }; } })();
  var key = function (k) { return "pbm:" + B.id + ":" + k; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ADV = B.mode === "adventure";

  var S = { v: 0, up: 1, pw: 360, ph: 498, fs: 20, scale: parseFloat(LS.getItem(key("scale"))) || 1, sound: LS.getItem(key("sound")) === "1", busy: false };
  var pages = [];          // page descriptors
  var chapters = [];       // guide: {title, page}
  var beats = [];          // adventure
  var endings = {};        // adventure: title -> true
  var story = null, flowN = 0, W = 0, G = 0;

  /* ---------- shell ---------- */
  var root = $("#app");
  root.innerHTML =
    '<div class="shell"><header class="bar"><span class="t">' + esc(B.title) + '</span><span class="spacer"></span>' +
    '<button class="ib" id="bToc" aria-haspopup="dialog" aria-label="Contents"><span aria-hidden="true">\u2630</span><span class="lbl">Contents</span></button>' +
    '<button class="ib" id="bSmall" aria-label="Smaller text">A\u2212</button>' +
    '<button class="ib" id="bBig" aria-label="Larger text">A+</button>' +
     (B.narration ? '<button class="ib" id="bNar" aria-pressed="false" aria-label="Read aloud"><span aria-hidden="true">\u25b6</span><span class="lbl">Listen</span></button>' : "") +
    '<button class="ib" id="bSound" aria-pressed="false" aria-label="Page-turn sound"><span aria-hidden="true">\u266a</span><span class="lbl">Sound</span></button>' +
    '<button class="ib" id="bFull" aria-pressed="false" aria-label="Full screen"><span aria-hidden="true">\u26f6</span><span class="lbl">Full screen</span></button></header>' +
    '<main class="desk" id="desk"><div class="book" id="book"><section class="page left" id="pL"></section><section class="page right" id="pR"></section></div></main>' +
    '<nav class="nav"><button id="bPrev" aria-label="Previous page">\u2190</button><div class="prog"><span id="plabel"></span><div class="meter"><i id="pbar"></i></div></div><button id="bNext" aria-label="Next page">\u2192</button></nav></div>' +
    '<dialog class="toc" id="toc"><div class="hd"><span>Contents</span><button class="ib" id="tocX" aria-label="Close contents">Close</button></div><ol id="tocList"></ol><div class="endings" id="tocEnd"></div></dialog>';
  var book = $("#book"), pL = $("#pL"), pR = $("#pR"), desk = $("#desk");
  var meas = el("div", "page"); meas.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none"; document.body.appendChild(meas);

  /* ---------- layout ---------- */
  function layout() {
    var cw = desk.clientWidth, ch = desk.clientHeight;
    S.up = (cw >= 780 && cw / ch >= 1.25) ? 2 : 1;
    var pw = S.up === 2 ? Math.min(cw * 0.95 / 2, ch * 0.95 * 13 / 18, 620) : Math.min(cw * 0.985, ch * 0.985 * 13 / 18, 620);
    pw = Math.floor(pw); S.pw = pw; S.ph = Math.floor(pw * 18 / 13);
    S.fs = Math.max(16.5, Math.min(pw * 0.056, 23)) * S.scale;
    var st = document.documentElement.style;
    st.setProperty("--pw", S.pw + "px"); st.setProperty("--ph", S.ph + "px"); st.setProperty("--fs", S.fs + "px"); st.setProperty("--up", S.up);
    W = Math.floor(S.pw * (1 - 2 * 0.095)); G = Math.floor(S.pw * 0.19);
  }

  /* ---------- guide pagination ---------- */
  function flowHTML() {
    var h = "";
    B.chapters.forEach(function (c, i) {
      h += '<h1 id="ch' + i + '" data-i="' + i + '"><span class="num">' + (c.kind === "colophon" ? "" : "Chapter " + roman(i + 1 - (B._front || 0))) + '</span>' + esc(c.title) + "</h1>" + c.html;
    });
    return h;
  }
  function roman(n) { var m = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]], r = ""; m.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } }); return r; }
  function flowStyle(k) { return "column-width:" + W + "px;column-gap:" + G + "px;width:" + W + "px;position:relative;transform:translateX(" + (-k * (W + G)) + "px)"; }
  function measure() {
    meas.innerHTML = '<div class="inner"><div class="flow" id="mflow" style="' + flowStyle(0) + '">' + flowHTML() + "</div></div>";
    var f = $("#mflow", meas);
    flowN = Math.max(1, Math.round((f.scrollWidth + G) / (W + G)));
    chapters = [];
    B.chapters.forEach(function (c, i) { var h = $("#ch" + i, f); chapters.push({ title: c.title, page: 1 + Math.round(h.offsetLeft / (W + G)), kind: c.kind }); });
    pages = [{ k: "cover" }];
    for (var i = 0; i < flowN; i++) pages.push({ k: "flow", col: i });
    pages.push({ k: "back" });
  }
  function chapterAt(pi) { var c = null; chapters.forEach(function (x) { if (x.page <= pi) c = x; }); return c; }

  /* ---------- adventure ---------- */
  function runInk(s) {
    var paras = [], tags = [];
    while (s.canContinue) { var t = s.Continue().trim(); if (t) paras.push(t); (s.currentTags || []).forEach(function (x) { tags.push(x); }); }
    var b = { paras: paras, tags: tags, choices: s.currentChoices.map(function (c) { return c.text; }), chosen: null, state: s.state.toJson() };
    b.end = b.choices.length === 0;
    tags.forEach(function (t) { var m = /^\s*(\w+)\s*:\s*(.+)$/.exec(t); if (m) b[m[1].toLowerCase()] = m[2].trim(); });
    if (b.end && b.ending) endings[b.ending] = true;
    return b;
  }
  function adventureStart() {
    story = new inkjs.Story(B.ink);
    var saved = null; try { saved = JSON.parse(LS.getItem(key("save")) || "null"); } catch (e) {}
    try { endings = JSON.parse(LS.getItem(key("endings")) || "{}"); } catch (e) { endings = {}; }
    if (saved && saved.beats && saved.beats.length) { beats = saved.beats; S.v = saved.v || 0; }
    else { beats = [runInk(story)]; S.v = 0; }
    rebuildAdv();
  }
  function chunkParas(b) {
    var budget = b.image ? 28 : 44, out = [], cur = [], n = 0;
    b.paras.forEach(function (t) {
      var w = t.split(/\s+/).length;
      if (cur.length && n + w > budget) { out.push(cur); cur = []; n = 0; }
      cur.push(t); n += w;
    });
    if (cur.length) out.push(cur);
    return out.length ? out : [[]];
  }
  function rebuildAdv() {
    pages = [{ k: "cover" }];
    beats.forEach(function (b, i) {
      var ch = chunkParas(b);
      ch.forEach(function (c, j) { pages.push({ k: "text", b: i, c: j, paras: c }); });
      if ((ch.length + 1) % 2 === 1) pages.push({ k: "orn", b: i });
      pages.push({ k: "ask", b: i });
    });
  }
  function firstPageOf(bi) { for (var i = 0; i < pages.length; i++) if (pages[i].b === bi) return i; return 0; }
  function persist() { if (ADV) { LS.setItem(key("save"), JSON.stringify({ beats: beats, v: S.v })); LS.setItem(key("endings"), JSON.stringify(endings)); } else LS.setItem(key("pos"), String(S.v / Math.max(1, pages.length))); }
  function choose(bi, k) {
    if (S.busy) return;
    story.state.LoadJson(beats[bi].state);
    beats.length = bi + 1; beats[bi].chosen = k;
    story.ChooseChoiceIndex(k);
    beats.push(runInk(story));
    rebuildAdv();
    go(firstPageOf(bi + 1), +1);
  }
  function restart() {
    LS.removeItem(key("save")); story = new inkjs.Story(B.ink); beats = [runInk(story)]; rebuildAdv(); go(0, -1);
  }

  /* ---------- page content ---------- */
  /* Bilingual layout: "Spanish line (English line)" becomes Spanish on top, English directly underneath. Words are wrapped for a future read-along highlight. */
  function words(t, lang) { var i = 0; return t.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) || !w ? w : '<span class="w" data-lang="' + lang + '">' + inline(w) + "</span>"; }).join(""); }
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("00000000" + h.toString(16)).slice(-8); }
  function bil(t) {
    var re = /([^()]+?)\s*\(([^()]+)\)/g, out = "", last = 0, m, any = false;
    while ((m = re.exec(t))) { any = true; var pre = t.slice(last, m.index).trim(); if (pre) out += words(pre, "en") + " "; out += '<span class="es"' + (B.narration && B.narration[fnv(m[1].trim())] ? ' data-nar="' + fnv(m[1].trim()) + '"' : "") + '>' + words(m[1].trim(), "es") + '</span><span class="en">' + words(m[2].trim(), "en") + "</span>"; last = re.lastIndex; }
    if (!any) return inline(t);
    var tail = t.slice(last).trim(); if (tail) out += " " + words(tail, "en");
    return out;
  }
  function pageHTML(p, side) {
    if (!p) return "";
    var n = pages.indexOf(p);
    if (p.k === "cover") return coverHTML();
    if (p.k === "back") return '<div class="cover back" style="position:absolute;inset:0"><div class="frame"></div><div style="position:relative">' + esc(B.backline || "") + "</div></div>";
    if (p.k === "flow") {
      var ch = chapterAt(n);
      return '<div class="runhead">' + esc(side === "left" ? B.title : (ch ? ch.title : "")) + '</div><div class="inner"><div class="flow" style="' + flowStyle(p.col) + '">' + flowHTML() + '</div></div><div class="folio">' + (p.col + 1) + "</div>";
    }
    if (p.k === "orn") return '<div class="inner"><div class="beat" style="display:flex;align-items:center;justify-content:center;font-size:2.4em;color:var(--brass)">\u2766</div></div>';
    var b = beats[p.b];
    if (p.k === "text") {
      var h = '<div class="runhead">' + esc(B.title) + '</div><div class="inner"><div class="beat">';
      if (b.chapter && p.c === 0) h += '<div class="chap">' + esc(b.chapter) + "</div>";
      if (p.c === 0 && b.image && B.assets && B.assets[b.image]) h += '<img class="art" alt="" src="' + B.assets[b.image] + '">';
      else if (p.c === 0 && b.image && B.slots) h += '<div class="slot" role="img" aria-label="Placeholder art"><b>Art slot</b><span>' + esc(b.image) + '</span><i>placeholder</i></div>';
      if (p.c === 0 && b.song) h += B.audio && B.audio[b.song] ? '<button class="songbtn" data-song="' + esc(b.song) + '">\u266A ' + esc(B.songLabel || "Play the theme") + '</button>' : '<div class="slot" role="img" aria-label="Song placeholder"><b>Song slot</b><span>' + esc(b.song) + '</span><i>placeholder, file pending</i></div>';
      (p.paras || []).forEach(function (t, ti) { h += "<p" + (p.c > 0 && ti === 0 ? ' class="nodrop"' : "") + ">" + bil(t) + "</p>"; });
      return h + '</div></div><div class="folio">' + (p.b + 1) + "</div>";
    }
    var a = '<div class="runhead">' + (b.end ? "The end" : "Your move") + '</div><div class="inner"><div class="beat">';
    if (b.end) {
      var total = (B.endingsTotal || 0), found = Object.keys(endings).length;
      a += '<div class="the-end"><div class="ask-title">The end</div><div class="e1">' + esc(b.ending || "The end") + '</div><p class="e2">' + found + (total ? " of " + total : "") + ' endings found</p><button class="small" data-act="restart">Begin again</button><button class="small" data-act="back">Go back one step</button></div>';
    } else {
      a += '<div class="ask-title">What do you do?</div><ul class="choices">';
      b.choices.forEach(function (c, k) { a += '<li><button class="choice" data-b="' + p.b + '" data-k="' + k + '"' + (b.chosen === k ? ' aria-current="true" style="border-left:3px solid var(--brass);padding-left:.6em"' : "") + '><span class="k">' + String.fromCharCode(65 + k) + "</span><span>" + inline(c) + "</span></button></li>"; });
      a += "</ul>";
    }
    return a + '</div></div><div class="folio"></div>';
  }
  function inline(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>"); }
  function coverHTML() {
    return '<div class="cover" style="position:absolute;inset:0"><div class="frame"></div><div class="rule"></div><div class="ctitle">' + esc(B.title) + "</div>" +
      (B.subtitle ? '<div class="csub">' + esc(B.subtitle) + "</div>" : "") +
      (B.author ? '<div class="cby">' + esc(B.author) + "</div>" : "") +
      '<button class="opener" data-act="open">' + (ADV ? "Begin" : "Open") + "</button></div>";
  }
  function fill(node, p, side) {
    node.className = "page " + side + (p && p.k === "cover" ? " cover" : "");
    node.innerHTML = p ? pageHTML(p, side) : "";
    node.classList.toggle("hidden", !p);
    fit(node);
  }
  function fit(node) {
    var bt = $(".beat", node); if (!bt) return; var s = 1, i = 0;
    while (bt.scrollHeight > bt.clientHeight + 2 && i < 6) { s -= 0.06; bt.style.fontSize = s + "em"; i++; }
  }

  /* ---------- view ---------- */
  function slots(v) {
    if (S.up === 1) return { L: null, R: pages[v] };
    if (v === 0) return { L: null, R: pages[0] };
    return { L: pages[v], R: pages[v + 1] || null };
  }
  function norm(v) { v = Math.max(0, Math.min(v, pages.length - 1)); if (S.up === 2 && v > 0 && v % 2 === 0) v -= 1; return v; }
  function render() {
    var s = slots(S.v);
    S.up === 2 ? (pL.style.display = "", fill(pL, s.L, "left")) : (pL.style.display = "none");
    fill(pR, s.R, "right");
    var cover = S.up === 2 && S.v === 0;
    book.style.width = (S.up === 2 ? S.pw * 2 : S.pw) + "px";
    book.style.transform = cover ? "translateX(" + (-S.pw / 2) + "px)" : "none";
    if (cover) pL.classList.add("hidden");
    // single page cover on 2-up: right page only
    nav();
  }
  function nav() {
    var last = pages.length - 1, vis = S.up === 2 ? Math.min(last, S.v + 1) : S.v;
    $("#bPrev").disabled = S.v <= 0;
    var nextOff = S.v >= last || (S.up === 2 && S.v + 1 >= last);
    if (ADV) { var cur = pages[Math.min(S.v + (S.up === 2 ? 1 : 0), last)]; if (cur && cur.k === "ask") nextOff = true; if (S.v === 0) nextOff = false; }
    $("#bNext").disabled = nextOff;
    var lab;
    if (ADV) { var step = S.v === 0 ? 0 : Math.ceil((S.v) / 2); lab = (S.v === 0 ? "Cover" : "Step " + (pages[Math.min(S.v, last)].b + 1)) + (B.endingsTotal ? " \u00b7 Endings " + Object.keys(endings).length + "/" + B.endingsTotal : ""); $("#pbar").style.width = (Object.keys(endings).length / Math.max(1, B.endingsTotal || 1) * 100) + "%"; }
    else { lab = S.v === 0 ? "Cover" : (pages[vis].k === "back" ? "The end" : "Page " + (pages[vis].col + 1) + " of " + flowN); $("#pbar").style.width = (S.v / Math.max(1, last) * 100) + "%"; }
    $("#plabel").textContent = lab;
    persist();
  }

  /* ---------- turning ---------- */
  function go(target, dirHint) {
    target = norm(target);
    if (target === S.v && !dirHint) return;
    if (S.busy) return;
    var dir = dirHint || (target > S.v ? 1 : -1);
    if (target === S.v) { render(); return; }
    if (reduce) { S.v = target; render(); return; }
    S.busy = true;
    var from = slots(S.v), to = slots(target), wasCover = S.up === 2 && S.v === 0, toCover = S.up === 2 && target === 0;
    var leaf = el("div", "leaf"), front = el("div", "face front page"), back = el("div", "face back page");
    var jump = Math.abs(target - S.v) > 2;
    var frontP, backP, leafLeft, origin, a0, a1;
    if (S.up === 1) {
      leafLeft = 0;
      if (dir > 0) { frontP = from.R; backP = null; origin = "left center"; a0 = 0; a1 = -180; fillPage(front, frontP, "right"); render0(to); }
      else { frontP = to.R; backP = null; origin = "left center"; a0 = -180; a1 = 0; fillPage(front, frontP, "right"); render0(from); }
    } else if (dir > 0) {
      leafLeft = wasCover ? S.pw : S.pw; origin = "left center"; a0 = 0; a1 = -180;
      fillPage(front, from.R, "right"); fillPage(back, to.L, "left");
      pR.className = "page right"; fillPage(pR, to.R, "right"); if (toCover) pR.classList.add("cover");
      if (wasCover) { pL.classList.remove("hidden"); pL.innerHTML = ""; }
    } else {
      leafLeft = 0; origin = "right center"; a0 = 0; a1 = 180;
      fillPage(front, from.L, "left"); fillPage(back, to.R, "right");
      fillPage(pL, to.L, "left"); if (toCover) pL.classList.add("hidden");
    }
    leaf.appendChild(front); if (S.up === 2) leaf.appendChild(back);
    leaf.style.left = (S.up === 2 ? (dir > 0 ? S.pw : 0) : 0) + "px"; leaf.style.transformOrigin = origin;
    if (wasCover && dir > 0) book.style.transform = "translateX(0)";
    if (toCover && dir < 0) book.style.transform = "translateX(" + (-S.pw / 2) + "px)";
    book.style.transition = "transform .55s cubic-bezier(.5,.05,.25,1)";
    book.appendChild(leaf);
    var anim = leaf.animate([{ transform: "rotateY(" + a0 + "deg)" }, { transform: "rotateY(" + a1 + "deg)" }], { duration: 620, easing: "cubic-bezier(.45,.05,.25,1)", fill: "forwards" });
    chime();
    var done = function () { book.style.transition = ""; if (leaf.parentNode) leaf.remove(); S.v = target; render(); S.busy = false; };
    anim.onfinish = done; anim.oncancel = done;
  }
  function render0(s) { S.up === 2 || (fill(pR, s.R, "right")); }
  function fillPage(node, p, side) { node.innerHTML = p ? pageHTML(p, side) : ""; fit(node); }

  /* ---------- sound (opt-in, synthesized) ---------- */
  var ac = null;
  function chime() {
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var len = ac.sampleRate * 0.28, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) { var t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * t), 1.6) * (0.5 + 0.5 * Math.sin(t * 90)); }
      var src = ac.createBufferSource(); src.buffer = buf;
      var f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.7;
      var g = ac.createGain(); g.gain.value = 0.22;
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start();
    } catch (e) {}
  }

  /* ---------- contents ---------- */
  function buildToc() {
    var ol = $("#tocList"); ol.innerHTML = "";
    if (ADV) {
      var li = el("li"); li.innerHTML = '<button data-go="0"><span>Cover</span></button>'; ol.appendChild(li);
      beats.forEach(function (b, i) { var l = el("li"); l.innerHTML = '<button data-go="' + (1 + 2 * i) + '"><span>Step ' + (i + 1) + (b.chapter ? " \u2013 " + esc(b.chapter) : "") + "</span></button>"; ol.appendChild(l); });
      var f = Object.keys(endings);
      $("#tocEnd").textContent = (B.endingsTotal ? f.length + " of " + B.endingsTotal + " endings found" : f.length + " endings found") + (f.length ? ": " + f.join(", ") : "");
    } else {
      var c0 = el("li"); c0.innerHTML = '<button data-go="0"><span>Cover</span></button>'; ol.appendChild(c0);
      chapters.forEach(function (c) { var l = el("li"); l.innerHTML = '<button data-go="' + c.page + '"><span>' + esc(c.title) + '</span><span class="pn">' + c.page + "</span></button>"; ol.appendChild(l); });
      $("#tocEnd").textContent = "";
    }
  }

  /* ---------- events ---------- */
  function step(d) { if (S.busy) return; go(S.up === 2 ? (S.v === 0 ? (d > 0 ? 1 : 0) : S.v + 2 * d) : S.v + d, d); }
  $("#bNext").onclick = function () { step(1); };
  $("#bPrev").onclick = function () { step(-1); };
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("dialog")) return;
    if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
  });
  var sx = null;
  desk.addEventListener("pointerdown", function (e) { sx = e.clientX; });
  desk.addEventListener("pointerup", function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 55) step(dx < 0 ? 1 : -1); });
  desk.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act],[data-k]"); if (!t) return;
    if (t.dataset.act === "open") step(1);
    else if (t.dataset.act === "restart") restart();
    else if (t.dataset.act === "back") step(-1);
    else if (t.dataset.k != null) choose(+t.dataset.b, +t.dataset.k);
  });
  var toc = $("#toc");
  $("#bToc").onclick = function () { buildToc(); toc.showModal ? toc.showModal() : toc.setAttribute("open", ""); };
  $("#tocX").onclick = function () { toc.close(); };
  toc.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) { toc.close(); var t = +b.dataset.go; S.busy = false; go(t, t > S.v ? 1 : -1); } else if (e.target === toc) toc.close(); });
  function rescale(d) { S.scale = Math.max(0.8, Math.min(1.4, +(S.scale + d).toFixed(2))); LS.setItem(key("scale"), S.scale); relayout(); }
  $("#bSmall").onclick = function () { rescale(-0.1); }; $("#bBig").onclick = function () { rescale(0.1); };
  var nar = { a: null, on: false, raf: 0 };
  function narStop() { nar.on = false; cancelAnimationFrame(nar.raf); if (nar.a) { nar.a.pause(); nar.a = null; } [].forEach.call(document.querySelectorAll(".w.hl"), function (w) { w.classList.remove("hl"); }); var b = $("#bNar"); if (b) b.setAttribute("aria-pressed", "false"); }
  function narPlay() {
    var segs = [].slice.call(document.querySelectorAll(".es[data-nar]")); if (!segs.length) return; var i = 0; nar.on = true; $("#bNar").setAttribute("aria-pressed", "true");
    (function next() {
      if (!nar.on || i >= segs.length) { narStop(); return; }
      var el = segs[i++], d = B.narration[el.getAttribute("data-nar")], ws = el.querySelectorAll(".w"), a = nar.a = new Audio(d.a);
      function tick() { var t = a.currentTime; for (var k = 0; k < ws.length; k++) { var w = d.w[k]; ws[k].classList.toggle("hl", !!w && t >= w.s && t < w.e + 0.05); } nar.raf = requestAnimationFrame(tick); }
      a.onended = function () { cancelAnimationFrame(nar.raf); [].forEach.call(ws, function (w) { w.classList.remove("hl"); }); next(); };
      a.play().then(tick).catch(narStop);
    })();
  }
  if ($("#bNar")) $("#bNar").onclick = function () { if (nar.on) narStop(); else narPlay(); };
  var bs = $("#bSound"); bs.setAttribute("aria-pressed", S.sound); bs.onclick = function () { S.sound = !S.sound; LS.setItem(key("sound"), S.sound ? "1" : "0"); bs.setAttribute("aria-pressed", S.sound); chime(); };
  var bf = $("#bFull");
  bf.onclick = function () {
    var d = document, de = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
    var rq = de.requestFullscreen || de.webkitRequestFullscreen;
    if (rq) { try { var r = rq.call(de); if (r && r.catch) r.catch(function () { imm(); }); } catch (e) { imm(); } } else imm();
  };
  function imm() { var on = root.classList.toggle("immersive"); root.querySelector(".bar").style.display = on ? "none" : ""; bf.setAttribute("aria-pressed", on); relayout(); }
  document.addEventListener("fullscreenchange", function () { bf.setAttribute("aria-pressed", !!document.fullscreenElement); setTimeout(relayout, 60); });

  function relayout() {
    var frac = pages.length > 1 ? S.v / pages.length : 0;
    layout();
    if (!ADV) { measure(); S.v = norm(Math.round(frac * pages.length)); } else S.v = norm(S.v);
    render();
  }
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });

  /* ---------- boot ---------- */
  function boot() {
    layout();
    if (ADV) adventureStart();
    else { measure(); var f = parseFloat(LS.getItem(key("pos"))); S.v = isNaN(f) ? 0 : Math.round(f * pages.length); }
    S.v = norm(S.v);
    render();
    window.__PBM__ = { state: S, go: go, step: step, pages: function () { return pages; }, beats: function () { return beats; }, flowN: function () { return flowN; }, chapters: function () { return chapters; }, choose: choose };
    document.documentElement.setAttribute("data-ready", "1");
  }
  var FACES = ['400 20px Newsreader', 'italic 400 20px Newsreader', '500 20px Newsreader', '600 20px Newsreader', '600 20px "Bodoni Moda"', '500 20px "Bodoni Moda"', '700 20px "Bodoni Moda"'];
  var fl = document.fonts && document.fonts.load ? Promise.all(FACES.map(function (f) { return document.fonts.load(f, "Aa"); })) : Promise.resolve();
  Promise.race([fl, new Promise(function (r) { setTimeout(r, 2500); })]).then(function () { return document.fonts && document.fonts.ready; }).then(boot);
})();

document.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest(".songbtn"); if (!t) return; var id = t.getAttribute("data-song"); window.__songs = window.__songs || {}; var LBL = "\u266A " + (window.__BOOK__.songLabel || "Play the theme"); function toggle(a) { if (a.paused) { a.play(); t.textContent = "\u275A\u275A Pause the theme"; } else { a.pause(); t.textContent = LBL; } } if (window.__songs[id]) return toggle(window.__songs[id]); t.textContent = "Loading the theme..."; Promise.resolve(window.__BOOK__.audio[id] === true && window.__loadSong ? window.__loadSong(id) : window.__BOOK__.audio[id]).then(function (src) { var a = window.__songs[id] = new Audio(src); a.loop = true; toggle(a); }); });
