/* Instrument Lab — shared behaviour: masthead, record panel, citation export, notes and saved entries.
   Requires assets/data.js (window.LAB) to be loaded first. No external dependencies. */
(function () {
  "use strict";
  var LAB = window.LAB;
  if (!LAB) return;
  var script = document.currentScript;
  var base = script ? script.src.replace(/assets\/lab\.js.*$/, "") : "";
  var byId = {};
  LAB.instruments.forEach(function (i) { byId[i.id] = i; });

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function href(inst) { return base + "instruments/" + inst.id + ".html"; }
  function download(name, text, mime) {
    var blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
    var a = el("a", { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(rows) {
    return "﻿" + rows.map(function (r) {
      return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(",");
    }).join("\r\n");
  }
  function copy(text, btn) {
    function done() { if (!btn) return; var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1400); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); } else fallback();
    function fallback() { var ta = el("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("lab:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("lab:" + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem("lab:" + k); } catch (e) {} }
  };

  /* ---------- citations ---------- */
  function doiUrl(r) { return r.doi ? "https://doi.org/" + r.doi : null; }
  function findUrl(r) { return "https://scholar.google.com/scholar?q=" + encodeURIComponent('"' + r.title + '"'); }
  function apa(r, html) {
    var i = function (s) { return html ? "<i>" + esc(s) + "</i>" : s; };
    var t = function (s) { return html ? esc(s) : s; };
    var out = t(r.authors) + " (" + r.year + "). " + t(r.title) + ". ";
    if (r.type === "thesis") { out = t(r.authors) + " (" + r.year + "). " + i(r.title) + " [" + t(r.container) + "]."; }
    else if (r.type === "chapter") {
      var c = r.container.replace(/^In (.*?\(Eds\.\), )(.*)$/, function (m, eds, book) { return "In " + (html ? esc(eds) : eds) + i(book); });
      out += (c === r.container ? t(c) : c) + " (pp. " + r.pages + "). " + t(r.publisher || "") + ".";
    } else {
      out += i(r.container) + (r.volume ? ", " + i(r.volume) + (r.issue ? "(" + r.issue + ")" : "") : "") + (r.pages ? ", " + t(r.pages) : "") + ".";
    }
    if (r.doi) out += " " + (html ? '<a href="' + doiUrl(r) + '" rel="noopener">' + doiUrl(r) + "</a>" : doiUrl(r));
    return out;
  }
  function authorList(r) { return r.authors.replace(/,? & /g, ", ").split(/\.,\s+(?=[A-ZŞÖÜÇ])/).map(function (a) { a = a.trim(); return /\.$/.test(a) ? a : a + "."; }); }
  function citeKey(r) { return (r.authors.split(",")[0].replace(/[^A-Za-z]/g, "") + r.year + (r.title.split(/\s+/)[0] || "").replace(/[^A-Za-z]/g, "")).toLowerCase(); }
  function bibtex(r) {
    var f = [["author", authorList(r).join(" and ")], ["year", r.year], ["title", "{" + r.title + "}"]];
    if (r.type === "chapter") { f.push(["booktitle", r.container.replace(/^In .*?\(Eds\.\), /, "")], ["publisher", r.publisher || ""]); }
    else { f.push(["journal", r.container], ["volume", r.volume]); if (r.issue) f.push(["number", r.issue]); }
    if (r.pages) f.push(["pages", String(r.pages).replace("–", "--")]);
    if (r.doi) f.push(["doi", r.doi]);
    return "@" + (r.type === "chapter" ? "incollection" : r.type === "thesis" ? "phdthesis" : "article") + "{" + citeKey(r) + ",\n" + f.map(function (x) { return "  " + x[0] + " = {" + x[1] + "}"; }).join(",\n") + "\n}";
  }
  function ris(r) {
    var L = ["TY  - " + (r.type === "chapter" ? "CHAP" : r.type === "thesis" ? "THES" : "JOUR")];
    authorList(r).forEach(function (a) { L.push("AU  - " + a); });
    L.push("PY  - " + r.year, "TI  - " + r.title);
    if (r.type === "chapter") { L.push("T2  - " + r.container.replace(/^In .*?\(Eds\.\), /, ""), "PB  - " + (r.publisher || "")); }
    else { L.push("JO  - " + r.container, "VL  - " + r.volume); if (r.issue) L.push("IS  - " + r.issue); }
    if (r.pages) { var pp = String(r.pages).split("–"); L.push("SP  - " + pp[0]); if (pp[1]) L.push("EP  - " + pp[1]); }
    if (r.doi) L.push("DO  - " + r.doi, "UR  - " + doiUrl(r));
    L.push("ER  - ");
    return L.join("\r\n");
  }
  function uniqueRefs(list) { var seen = {}, out = []; list.forEach(function (i) { var k = citeKey(i.ref); if (!seen[k]) { seen[k] = 1; out.push(i.ref); } }); return out; }
  function statusLabel(i) { return i.status === "built" ? "Built by Jo" : i.status === "reused" ? "Reused by Jo" : i.status === "study" ? "Study or review" : "Working tool"; }

  LAB.util = { esc: esc, el: el, href: href, download: download, csv: csv, copy: copy, store: store, apa: apa, bibtex: bibtex, ris: ris, doiUrl: doiUrl, findUrl: findUrl, uniqueRefs: uniqueRefs, statusLabel: statusLabel, byId: byId, base: base };


  /* ---------- hero artwork: one generative motif per research strand ---------- */
  function motif(family, seed) {
    var W = 420, H = 300, o = '<svg viewBox="0 0 ' + W + " " + H + '" aria-hidden="true" focusable="false">', k = 0;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function L(x1, y1, x2, y2, op, w) { return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="currentColor" stroke-opacity="' + op + '" stroke-width="' + (w || 1.2) + '"/>'; }
    if (family === "taxonomy") {            /* isometric 4 x 3 x 2 lattice, nine integrated cells lit */
      var u = 34, ox = 210, oy = 70;
      var P = function (x, y, z) { return [ox + (x - z) * u * 0.87, oy + (x + z) * u * 0.5 + y * u]; };
      var cell = function (x, y, z, on) { var a = P(x, y, z), b = P(x + 1, y, z), c = P(x + 1, y, z + 1), d = P(x, y, z + 1), e = P(x, y + 1, z + 1), f = P(x + 1, y + 1, z + 1), g = P(x + 1, y + 1, z);
        var pt = function (q) { return q.map(function (v) { return v[0].toFixed(1) + "," + v[1].toFixed(1); }).join(" "); };
        return '<polygon points="' + pt([a, b, c, d]) + '" fill="' + (on ? "var(--fam-l)" : "currentColor") + '" fill-opacity="' + (on ? 0.95 : 0.1) + '" stroke="currentColor" stroke-opacity=".5"/><polygon points="' + pt([d, c, f, e]) + '" fill="' + (on ? "var(--fam-l)" : "currentColor") + '" fill-opacity="' + (on ? 0.7 : 0.06) + '" stroke="currentColor" stroke-opacity=".5"/><polygon points="' + pt([b, g, f, c]) + '" fill="' + (on ? "var(--fam-l)" : "currentColor") + '" fill-opacity="' + (on ? 0.5 : 0.04) + '" stroke="currentColor" stroke-opacity=".5"/>'; };
      for (var y = 3; y >= 0; y--) for (var z = 0; z < 2; z++) for (var x = 0; x < 3; x++) o += cell(x, y, z, y < 3 && z === 1);
    } else if (family === "disposition") {  /* five-axis radar */
      var cx = 210, cy = 155, R = 115, vals = [0.86, 0.62, 0.8, 0.9, 0.7];
      for (var r = 1; r <= 4; r++) { var pts = []; for (k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5; pts.push((cx + R * r / 4 * Math.cos(a)).toFixed(1) + "," + (cy + R * r / 4 * Math.sin(a)).toFixed(1)); } o += '<polygon points="' + pts.join(" ") + '" fill="none" stroke="currentColor" stroke-opacity=".28"/>'; }
      var vp = []; for (k = 0; k < 5; k++) { var a2 = -Math.PI / 2 + k * 2 * Math.PI / 5; o += L(cx, cy, cx + R * Math.cos(a2), cy + R * Math.sin(a2), 0.28); vp.push([cx + R * vals[k] * Math.cos(a2), cy + R * vals[k] * Math.sin(a2)]); }
      o += '<polygon points="' + vp.map(function (v) { return v[0].toFixed(1) + "," + v[1].toFixed(1); }).join(" ") + '" fill="var(--fam-l)" fill-opacity=".45" stroke="var(--fam-l)" stroke-width="2.5"/>' + vp.map(function (v) { return '<circle cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) + '" r="5" fill="#fff"/>'; }).join("");
    } else if (family === "concepts") {     /* points, lines, polygons over contours */
      for (k = 0; k < 6; k++) o += '<ellipse cx="150" cy="170" rx="' + (30 + k * 26) + '" ry="' + (18 + k * 17) + '" fill="none" stroke="currentColor" stroke-opacity="' + (0.34 - k * 0.04) + '" transform="rotate(-18 150 170)"/>';
      o += '<polygon points="255,60 345,48 380,120 320,165 250,130" fill="var(--fam-l)" fill-opacity=".4" stroke="var(--fam-l)" stroke-width="2"/><polygon points="300,105 370,95 395,170 330,200" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>';
      o += '<polyline points="40,250 110,205 175,228 250,190 330,240 395,215" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>';
      for (k = 0; k < 14; k++) o += '<circle cx="' + (95 + rnd() * 110).toFixed(0) + '" cy="' + (60 + rnd() * 80).toFixed(0) + '" r="' + (k % 4 ? 4 : 6.5) + '" fill="' + (k % 4 ? "#fff" : "var(--fam-l)") + '" fill-opacity=".9"/>';
    } else if (family === "gst") {          /* three technologies exchanging data */
      var N = [[120, 215, "GPS"], [210, 75, "RS"], [310, 205, "GIS"]];
      for (k = 0; k < 3; k++) { var A = N[k], B = N[(k + 1) % 3]; o += L(A[0], A[1], B[0], B[1], 0.6, 2); }
      o += '<circle cx="213" cy="165" r="128" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="3 7"/><circle cx="213" cy="165" r="92" fill="none" stroke="currentColor" stroke-opacity=".16"/>';
      N.forEach(function (n, i) { o += '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + (i === 2 ? 44 : 34) + '" fill="' + (i === 2 ? "var(--fam-l)" : "#fff") + '" fill-opacity="' + (i === 2 ? 0.95 : 0.16) + '" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/><text x="' + n[0] + '" y="' + (n[1] + 6) + '" text-anchor="middle" font-size="17" font-weight="700" fill="' + (i === 2 ? "#12233f" : "#fff") + '" font-family="inherit">' + n[2] + "</text>"; });
    } else if (family === "classroom") {    /* seminar circle within a circle */
      var c1 = 210, c2 = 150;
      for (k = 0; k < 14; k++) { var a3 = k * 2 * Math.PI / 14; o += '<circle cx="' + (c1 + 118 * Math.cos(a3)).toFixed(1) + '" cy="' + (c2 + 118 * Math.sin(a3)).toFixed(1) + '" r="9" fill="#fff" fill-opacity=".28"/>'; }
      for (k = 0; k < 7; k++) { var a4 = k * 2 * Math.PI / 7 + 0.2, px = c1 + 62 * Math.cos(a4), py = c2 + 62 * Math.sin(a4); o += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="13" fill="var(--fam-l)"/>' + L(px, py, c1 + 62 * Math.cos(a4 + 2.7), c2 + 62 * Math.sin(a4 + 2.7), 0.3); }
      o += '<circle cx="' + c1 + '" cy="' + c2 + '" r="118" fill="none" stroke="currentColor" stroke-opacity=".2"/>';
    } else if (family === "methods") {      /* distribution and scatter */
      for (k = 0; k < 13; k++) { var h = 150 * Math.exp(-Math.pow((k - 6) / 3.1, 2)); o += '<rect x="' + (40 + k * 26) + '" y="' + (250 - h).toFixed(1) + '" width="20" height="' + h.toFixed(1) + '" rx="3" fill="' + (k > 8 ? "var(--fam-l)" : "#fff") + '" fill-opacity="' + (k > 8 ? 0.95 : 0.22) + '"/>'; }
      o += L(30, 250, 395, 250, 0.5) + '<path d="M40 245 C120 240 150 95 210 95 S300 240 390 246" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>';
      for (k = 0; k < 22; k++) { var sx = 60 + rnd() * 310; o += '<circle cx="' + sx.toFixed(0) + '" cy="' + (70 - (sx - 60) * 0.11 + rnd() * 34).toFixed(0) + '" r="3.2" fill="#fff" fill-opacity=".55"/>'; }
    } else if (family === "knowledge") {    /* six linked components around a core */
      var kc = [210, 152];
      for (k = 0; k < 6; k++) { var a5 = -Math.PI / 2 + k * Math.PI / 3, hx = kc[0] + 108 * Math.cos(a5), hy = kc[1] + 108 * Math.sin(a5), nx = kc[0] + 108 * Math.cos(a5 + Math.PI / 3), ny = kc[1] + 108 * Math.sin(a5 + Math.PI / 3);
        o += L(kc[0], kc[1], hx, hy, 0.45, 1.5) + L(hx, hy, nx, ny, 0.3) + '<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="' + (k % 2 ? 22 : 28) + '" fill="' + (k % 2 ? "#fff" : "var(--fam-l)") + '" fill-opacity="' + (k % 2 ? 0.2 : 0.9) + '" stroke="#fff" stroke-opacity=".7"/>'; }
      o += '<circle cx="' + kc[0] + '" cy="' + kc[1] + '" r="40" fill="#fff" fill-opacity=".95"/><circle cx="' + kc[0] + '" cy="' + kc[1] + '" r="52" fill="none" stroke="#fff" stroke-opacity=".4" stroke-dasharray="2 6"/>';
    } else {                                /* learning: layered growth curves */
      for (k = 0; k < 5; k++) { var d = "M20 " + (255 - k * 14); for (var x2 = 20; x2 <= 400; x2 += 20) d += " L" + x2 + " " + (255 - k * 14 - (150 - k * 22) / (1 + Math.exp(-(x2 - 190 - k * 18) / 42))).toFixed(1); o += '<path d="' + d + '" fill="none" stroke="' + (k === 0 ? "var(--fam-l)" : "#fff") + '" stroke-opacity="' + (k === 0 ? 1 : 0.5 - k * 0.08) + '" stroke-width="' + (k === 0 ? 3.5 : 1.6) + '"/>'; }
      o += L(20, 262, 400, 262, 0.4) + '<circle cx="400" cy="105" r="7" fill="var(--fam-l)"/>';
    }
    return o + "</svg>";
  }
  LAB.util.motif = motif;

  /* ---------- page shell (instrument pages only) ---------- */
  var id = document.body.getAttribute("data-lab-id");
  var inst = id && byId[id];
  if (!inst) return;

  var ordered = LAB.instruments.slice().sort(function (a, b) { return (a.tool ? 1 : 0) - (b.tool ? 1 : 0) || a.year - b.year; });
  var pos = ordered.indexOf(inst), prev = ordered[pos - 1], next = ordered[pos + 1];
  var fam = LAB.families[inst.family];
  var r = inst.ref;

  var skip = el("a", { "class": "lab-skip", href: "#lab-main" }, "Skip to the instrument");
  var mast = el("header", { "class": "lab-mast" },
    '<div class="lab-mast-in"><a class="lab-brand" href="' + base + 'index.html">Jo Instrument Lab</a>' +
    '<span class="lab-crumb">' + esc(fam.label) + " · <b>" + esc(inst.short || inst.title) + "</b></span>" +
    '<nav class="lab-nav" aria-label="Instrument navigation">' +
    (prev ? '<a href="' + href(prev) + '" title="' + esc(prev.title) + '">← ' + esc(prev.short || prev.title) + "</a>" : "") +
    '<a href="' + base + 'index.html">All instruments</a>' +
    (next ? '<a href="' + href(next) + '" title="' + esc(next.title) + '">' + esc(next.short || next.title) + " →</a>" : "") +
    "</nav></div>");

  function linkList(ids) { return ids.filter(function (x) { return byId[x]; }).map(function (x) { return '<a href="' + href(byId[x]) + '">' + esc(byId[x].short || byId[x].title) + (/\(\d{4}\)$/.test(byId[x].short || "") ? "" : " (" + byId[x].year + ")") + "</a>"; }).join(" · "); }
  var builtOnBy = LAB.instruments.filter(function (x) { return (x.builds || []).indexOf(inst.id) > -1; }).map(function (x) { return x.id; });
  var links = "";
  if ((inst.builds || []).length) links += "<li><span>Builds on</span>" + linkList(inst.builds) + "</li>";
  if (builtOnBy.length) links += "<li><span>Built on by</span>" + linkList(builtOnBy) + "</li>";
  if ((inst.related || []).length) links += "<li><span>" + (inst.series ? "Same series / related" : "Related") + "</span>" + linkList(inst.related) + "</li>";

  var open = store.get("recordOpen", true) && !document.body.hasAttribute("data-lab-compact");
  var rec = el("section", { "class": "lab-record", "aria-label": "Instrument record" },
    '<div class="lab-record-in"><details' + (open ? " open" : "") + ">" +
    "<summary><span>Research record</span>" +
    '<span class="lab-chip ' + inst.status + '">' + statusLabel(inst) + "</span>" +
    '<span class="lab-chip plain">' + esc(LAB.kinds[inst.kind]) + "</span>" +
    '<span class="lab-chip plain">' + (inst.tool ? "Scheme from " : "") + inst.year + "</span></summary>" +
    '<div class="lab-grid"><div>' +
    '<dl class="lab-dl">' +
    "<dt>Measures</dt><dd>" + esc(inst.measures) + "</dd>" +
    "<dt>Studied with</dt><dd>" + esc(inst.population) + "</dd>" +
    "<dt>On this page</dt><dd>" + esc(inst.use) + "</dd>" +
    (inst.research ? "<dt>In research</dt><dd>" + esc(inst.research) + "</dd>" : "") +
    "</dl>" +
    '<div class="lab-prov"><b>What comes from the paper, and what does not</b>' + esc(inst.provenance) + (inst.checked ? ' <span class="lab-checked">Figures and category names on this page were checked against the article text on ' + esc(inst.checked) + ".</span>" : "") + "</div>" +
    (links ? '<ul class="lab-links">' + links + "</ul>" : "") +
    "</div><div>" +
    '<div class="lab-cite"><h3>' + (inst.status === "reused" ? "Study that applied it" : inst.tool ? "Scheme to cite" : "Reference") + "</h3>" +
    '<p id="lab-apa">' + apa(r, true) + "</p>" +
    (inst.source ? '<p class="src"><b>Original instrument:</b> ' + esc(inst.source) + "</p>" : "") +
    '<div class="lab-btns">' +
    (r.doi ? '<a class="lab-btn primary" href="' + doiUrl(r) + '" rel="noopener">Open article</a>' : '<a class="lab-btn primary" href="' + findUrl(r) + '" rel="noopener">Find article</a>') +
    '<button class="lab-btn" type="button" data-act="copy">Copy citation</button>' +
    '<button class="lab-btn" type="button" data-act="bib">BibTeX</button>' +
    '<button class="lab-btn" type="button" data-act="ris">RIS for Zotero</button>' +
    (r.zotero && store.get("zoteroLinks", false) ? '<a class="lab-btn" href="zotero://select/library/items/' + r.zotero + '">Open in my Zotero</a>' : "") +
    "</div>" + (r.doi ? "" : '<p class="src" style="margin-top:8px">No DOI is recorded for this article; the button searches for it by title.</p>') +
    "</div></div></div></details></div>");
  rec.querySelector("details").addEventListener("toggle", function (e) { store.set("recordOpen", e.target.open); });
  rec.addEventListener("click", function (e) {
    var a = e.target.getAttribute && e.target.getAttribute("data-act");
    if (a === "copy") copy(apa(r, false), e.target);
    if (a === "bib") download(citeKey(r) + ".bib", bibtex(r), "application/x-bibtex");
    if (a === "ris") download(citeKey(r) + ".ris", ris(r), "application/x-research-info-systems");
  });


  /* ---------- hero ---------- */
  var oldHero = document.querySelector("header.hero");
  var stats = inst.stats || [];
  if (!stats.length && oldHero) oldHero.querySelectorAll(".chip").forEach(function (c) { var n = c.querySelector(".n"), l = c.querySelector(".l"); if (n && l) stats.push([n.textContent.trim(), l.textContent.trim()]); });
  if (oldHero && !inst.study) oldHero.hidden = true;
  var hasH1 = Array.prototype.some.call(document.querySelectorAll("h1"), function (h) { return !h.closest("[hidden]"); });
  var hero = el("section", { "class": "lab-hero", style: "--fam:" + fam.color + ";--fam-l:" + (fam.light || "#9fe0f0") },
    '<div class="lab-hero-in"><div class="lab-hero-text">' +
    '<p class="lab-eyebrow">' + esc(fam.label) + " · " + esc(LAB.kinds[inst.kind]) + " · " + (inst.tool ? "tool" : inst.year) + (inst.flagship ? " · ★ flagship" : "") + "</p>" +
    (hasH1 ? '<p class="lab-title" role="heading" aria-level="1">' : '<h1 class="lab-title">') + esc(inst.title) + (hasH1 ? "</p>" : "</h1>") +
    '<p class="lab-blurb">' + esc(inst.blurb) + "</p>" +
    (stats.length ? '<ul class="lab-stats">' + stats.slice(0, 5).map(function (t) { return "<li><b>" + esc(t[0]) + "</b>" + esc(t[1]) + "</li>"; }).join("") + "</ul>" : "") +
    '<p class="lab-hero-cite">' + esc(r.authors) + " (" + r.year + ")" + (inst.status === "reused" ? " · applying an existing instrument" : "") + "</p>" +
    '<div class="lab-hero-btns"><a class="go" href="#lab-main">' + (inst.study ? "Read the study" : inst.tool ? "Open the tool" : "Open the instrument") + ' ↓</a><a href="' + (r.doi ? doiUrl(r) : findUrl(r)) + '" rel="noopener">' + (r.doi ? "Reference article ↗" : "Find the article ↗") + "</a></div>" +
    '</div><div class="lab-hero-art">' + motif(inst.family, inst.year * 7 + inst.id.length) + "</div></div>");

  var first = document.body.firstChild;
  document.body.insertBefore(skip, first);
  document.body.insertBefore(mast, first);
  document.body.insertBefore(hero, first);
  document.body.insertBefore(rec, first);
  var anchor = el("div", { id: "lab-main", tabindex: "-1" });
  document.body.insertBefore(anchor, first);

  /* ---------- accessibility patches for the older page bodies ---------- */
  function labelFor(f) {
    if (f.getAttribute("aria-label") || f.getAttribute("aria-labelledby")) return null;
    if (f.labels && f.labels.length) return null;
    var t = f.getAttribute("placeholder") || f.getAttribute("title");
    if (!t) { var p = f.closest("td,li,div,section,fieldset"); var h = p && p.querySelector("label,legend,h2,h3,h4,strong,b,.label"); t = h && h.textContent.trim().slice(0, 80); }
    return t || (f.tagName === "SELECT" ? "Choose an option" : f.type === "range" ? "Adjust value" : "Enter a value");
  }
  function patchA11y(root) {
    (root || document).querySelectorAll("input:not([type=hidden]),select,textarea").forEach(function (f) { if (f.closest(".lab-work")) return; var l = labelFor(f); if (l) f.setAttribute("aria-label", l); });
    (root || document).querySelectorAll("svg:not([role]):not([aria-hidden])").forEach(function (s) { if (!s.querySelector("title")) s.setAttribute("aria-hidden", "true"); });
  }
  patchA11y();
  var moT; new MutationObserver(function () { clearTimeout(moT); moT = setTimeout(function () { patchA11y(); }, 250); }).observe(document.body, { childList: true, subtree: true });

  /* ---------- workspace: notes + saved entries ---------- */
  if (!inst.tool) {
    var work = el("section", { "class": "lab-work", "aria-labelledby": "lab-work-h" },
      '<div class="lab-work-in"><h2 id="lab-work-h">Your notes on this instrument</h2>' +
      '<p class="hint">Notes and anything you type into this page are saved in this browser only. Nothing is sent anywhere. Export them to keep a copy with your research files.</p>' +
      '<div class="lab-notes"><textarea id="lab-notes" aria-label="Your notes on ' + esc(inst.title) + '" placeholder="How might you use or adapt this instrument? What would you need to check in the article first?"></textarea></div>' +
      '<div class="lab-btns" style="margin-top:10px">' +
      '<button class="lab-btn primary" type="button" data-w="export">Export notes and entries (CSV)</button>' +
      '<button class="lab-btn" type="button" data-w="print">Print this page</button>' +
      '<button class="lab-btn danger" type="button" data-w="clear">Clear what is saved for this page</button>' +
      '<span class="lab-status" id="lab-status" role="status"></span></div></div>');
    var foot = el("footer", { "class": "lab-foot" },
      '<div class="lab-foot-in"><p><b>About this page.</b> An interactive study aid built from the article cited above. It is not an official instrument and is not endorsed by the authors. Use the article itself for wording, scoring and psychometric details before using anything here in research.</p>' +
      '<p><a href="' + base + 'index.html">All instruments</a> · <a href="' + base + 'index.html#bibliography">Full bibliography</a> · <a href="' + LAB.site.repo + '" rel="noopener">Source on GitHub</a></p></div>');
    document.body.appendChild(work);
    document.body.appendChild(foot);

    var notes = work.querySelector("#lab-notes"), status = work.querySelector("#lab-status");
    notes.value = store.get(id + ":notes", "");
    var nt; notes.addEventListener("input", function () { clearTimeout(nt); nt = setTimeout(function () { store.set(id + ":notes", notes.value); status.textContent = "Saved"; }, 400); });

    var fieldSel = "textarea,select,input[type=text],input[type=number],input[type=search],input:not([type])";
    function fields() { return Array.prototype.filter.call(document.querySelectorAll(fieldSel), function (f) { return !f.closest(".lab-work") && !f.closest(".lab-record"); }); }
    function fkey(f, i) { return f.id ? "#" + f.id : f.name ? "@" + f.name : f.tagName + ":" + i; }
    function fname(f) { return f.getAttribute("aria-label") || (f.labels && f.labels[0] && f.labels[0].textContent.trim()) || f.getAttribute("placeholder") || f.id || "field"; }
    var saved = store.get(id + ":fields", {});
    var restored = 0;
    if (!document.body.hasAttribute("data-lab-nosave")) {
      fields().forEach(function (f, i) {
        var k = fkey(f, i);
        if (saved[k] != null && saved[k] !== "" && f.value !== saved[k]) {
          f.value = saved[k];
          f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true }));
          restored++;
        }
      });
      if (restored) status.textContent = "Restored " + restored + " saved " + (restored === 1 ? "entry" : "entries");
      var ft; document.addEventListener("input", function (e) {
        if (!e.isTrusted || !e.target.matches || !e.target.matches(fieldSel) || e.target.closest(".lab-work")) return;
        clearTimeout(ft); ft = setTimeout(function () { var o = {}; fields().forEach(function (f, i) { if (f.value !== "") o[fkey(f, i)] = f.value; }); store.set(id + ":fields", o); }, 500);
      }, true);
    }
    work.addEventListener("click", function (e) {
      var w = e.target.getAttribute && e.target.getAttribute("data-w");
      if (w === "print") window.print();
      if (w === "clear") { store.del(id + ":notes"); store.del(id + ":fields"); notes.value = ""; status.textContent = "Cleared. Reload to reset the page."; }
      if (w === "export") {
        var rows = [["instrument", "citation", "item", "value", "exported"]], when = new Date().toISOString();
        rows.push([inst.title, apa(r, false), "Notes", notes.value, when]);
        fields().forEach(function (f) { if (f.value !== "") rows.push([inst.title, "", fname(f), f.value, when]); });
        download(id + "-notes.csv", csv(rows), "text/csv");
      }
    });
  }
})();
