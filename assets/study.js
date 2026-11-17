/* Instrument Lab — renderer for study, review and framework pages.
   A page sets window.STUDY = { sections:[...] } and includes this file after lab.js.
   Section types: prose, tiles, bars, dumbbell, cards, cycle, ladder, table, likert, audit, planner, list. */
(function () {
  "use strict";
  var S = window.STUDY, LAB = window.LAB; if (!S || !LAB) return;
  var U = LAB.util, esc = U.esc, id = document.body.getAttribute("data-lab-id");
  var root = document.getElementById("study"); if (!root) return;
  var fam = (LAB.families[(U.byId[id] || {}).family] || {}).color || "#1f6f8b";
  root.style.setProperty("--fam", fam);
  function tag(src) { return src === "site" ? '<span class="st-src site">Written for this site</span>' : src === "paper" ? '<span class="st-src">From the article</span>' : ""; }
  function fmt(v, d) { return typeof v === "number" ? v.toFixed(d == null ? (v % 1 ? 2 : 0) : d) : v; }
  var R = {};

  R.prose = function (s) { return (s.paras || []).map(function (p) { return "<p>" + p + "</p>"; }).join(""); };
  R.list = function (s) { return "<ul class='st-list'>" + s.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>"; };
  R.tiles = function (s) { return '<div class="st-tiles">' + s.items.map(function (t) { return '<div class="st-tile"><b>' + esc(t[0]) + "</b><span>" + esc(t[1]) + "</span></div>"; }).join("") + "</div>"; };
  R.bars = function (s) {
    var max = s.max || Math.max.apply(null, s.rows.map(function (r) { return r[1]; }));
    return '<div class="st-bars" role="img" aria-label="' + esc(s.title || "Bar chart") + '">' + s.rows.map(function (r) {
      return '<div class="st-bar"><span class="l">' + esc(r[0]) + '</span><span class="t"><i style="width:' + (100 * r[1] / max) + "%" + (r[3] ? ";background:" + r[3] : "") + '"></i></span><span class="v">' + fmt(r[1], s.dec) + (s.unit || "") + (r[2] ? ' <em>' + esc(r[2]) + "</em>" : "") + "</span></div>";
    }).join("") + "</div>" + (s.note ? '<p class="st-note">' + s.note + "</p>" : "");
  };
  R.dumbbell = function (s) {
    var lo = s.min, hi = s.max, w = function (v) { return 100 * (v - lo) / (hi - lo); };
    var axis = '<div class="st-db-axis"><span></span><span class="t">' + [0, 0.25, 0.5, 0.75, 1].map(function (f) { return "<i style='left:" + f * 100 + "%'>" + fmt(lo + f * (hi - lo), 1) + "</i>"; }).join("") + "</span><span></span></div>";
    return '<div class="st-db" role="img" aria-label="' + esc(s.title || "Comparison chart") + '"><div class="st-db-key"><span><i class="a"></i>' + esc(s.a) + '</span><span><i class="b"></i>' + esc(s.b) + "</span></div>" + axis + s.rows.map(function (r) {
      var x1 = w(Math.min(r[1], r[2])), x2 = w(Math.max(r[1], r[2]));
      return '<div class="st-db-row"><span class="l">' + esc(r[0]) + '</span><span class="t"><i class="ln" style="left:' + x1 + "%;width:" + (x2 - x1) + '%"></i><i class="a" style="left:' + w(r[1]) + '%" title="' + esc(s.a) + " " + r[1] + '"></i><i class="b" style="left:' + w(r[2]) + '%" title="' + esc(s.b) + " " + r[2] + '"></i></span><span class="v">' + fmt(r[1], s.dec) + " → " + fmt(r[2], s.dec) + (r[3] ? " <em>" + esc(r[3]) + "</em>" : "") + "</span></div>";
    }).join("") + "</div>" + (s.note ? '<p class="st-note">' + s.note + "</p>" : "");
  };
  R.cards = function (s) {
    return '<div class="st-cards' + (s.cols ? " c" + s.cols : "") + '">' + s.items.map(function (c, i) {
      return '<details class="st-card"' + (s.open ? " open" : "") + "><summary>" + (s.numbered === false ? "" : '<span class="n">' + (c.n || i + 1) + "</span>") + "<span>" + esc(c.t) + "</span></summary><div>" + (c.d ? "<p>" + c.d + "</p>" : "") + (c.sub ? "<ul>" + c.sub.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "") + "</div></details>";
    }).join("") + "</div>";
  };
  R.cycle = function (s) {
    var n = s.items.length, W = 560, H = 430, cx = W / 2, cy = H / 2, r = 150, out = '<svg class="st-cycle" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(s.title || "Cycle diagram") + '"><defs><marker id="stc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + fam + '"/></marker></defs>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + fam + '" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 6"/>';
    if (s.center) out += '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" class="c">' + esc(s.center) + "</text>";
    s.items.forEach(function (it, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), a2 = a + 2 * Math.PI / n;
      var ax = cx + r * Math.cos(a + 0.36), ay = cy + r * Math.sin(a + 0.36), bx = cx + r * Math.cos(a2 - 0.36), by = cy + r * Math.sin(a2 - 0.36);
      out += '<path d="M' + ax + " " + ay + " A" + r + " " + r + " 0 0 1 " + bx + " " + by + '" fill="none" stroke="' + fam + '" stroke-width="2" marker-end="url(#stc)"/>';
      out += '<g><rect x="' + (x - 78) + '" y="' + (y - 24) + '" width="156" height="48" rx="24" fill="#fff" stroke="' + fam + '" stroke-width="2"/><text x="' + x + '" y="' + (y - 2) + '" text-anchor="middle" class="n">' + (i + 1) + ". " + esc(it.t) + '</text><text x="' + x + '" y="' + (y + 14) + '" text-anchor="middle" class="d">' + esc(it.s || "") + "</text></g>";
    });
    return out + "</svg>" + (s.items[0].d ? R.cards({ items: s.items.map(function (i) { return { t: i.t, d: i.d }; }), cols: 3, open: true }) : "");
  };
  R.ladder = function (s) {
    return '<div class="st-ladder">' + s.items.slice().reverse().map(function (l, i, arr) {
      return '<div class="st-rung" style="--k:' + (arr.length - i) / arr.length + '"><b>' + esc(l.t) + "</b><span>" + esc(l.s || "") + "</span><p>" + l.d + "</p></div>";
    }).join("") + "</div>";
  };
  R.table = function (s) {
    return '<div class="lab-scroll"><table class="st-table"><thead><tr>' + s.head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" + s.rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return (i ? "<td>" : "<th scope='row'>") + c + (i ? "</td>" : "</th>"); }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" + (s.note ? '<p class="st-note">' + s.note + "</p>" : "");
  };

  /* ---- working tools: state is saved per page and exports to CSV ---- */
  function toolState(k) { return U.store.get(id + ":tool:" + k, {}); }
  function saveTool(k, v) { U.store.set(id + ":tool:" + k, v); }
  R.likert = function (s, k) {
    var st = toolState(k), sc = s.scale || ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
    return '<div class="st-tool" data-tool="likert" data-k="' + k + '"><div class="st-lik">' + s.items.map(function (it, i) {
      return '<fieldset><legend><span class="n">' + (i + 1) + "</span> " + esc(it.t) + (it.cat ? ' <em>' + esc(it.cat) + "</em>" : "") + "</legend><div>" + sc.map(function (l, v) { return '<label title="' + esc(l) + '"><input type="radio" name="' + k + "_" + i + '" value="' + (v + 1) + '"' + (st[i] == v + 1 ? " checked" : "") + "><span>" + (v + 1) + "</span></label>"; }).join("") + "</div></fieldset>";
    }).join("") + '</div><p class="st-scale">1 = ' + esc(sc[0]) + " · " + sc.length + " = " + esc(sc[sc.length - 1]) + '</p><div class="st-out" aria-live="polite"></div><div class="lab-btns"><button class="lab-btn primary" type="button" data-x="csv">Export responses (CSV)</button><button class="lab-btn" type="button" data-x="reset">Reset</button></div></div>';
  };
  R.audit = function (s, k) {
    var st = toolState(k), lv = s.levels || ["Not yet", "Partly", "Yes"];
    return '<div class="st-tool" data-tool="audit" data-k="' + k + '"><div class="st-audit">' + s.items.map(function (it, i) {
      return '<div class="row"><div><b>' + esc(it.t) + "</b>" + (it.d ? "<span>" + it.d + "</span>" : "") + '</div><div class="seg" role="group" aria-label="' + esc(it.t) + '">' + lv.map(function (l, v) { return '<button type="button" data-i="' + i + '" data-v="' + v + '" aria-pressed="' + (st[i] === v) + '">' + esc(l) + "</button>"; }).join("") + '</div><input type="text" data-n="' + i + '" value="' + esc(st["n" + i] || "") + '" placeholder="Evidence or note" aria-label="Note for: ' + esc(it.t) + '"></div>';
    }).join("") + '</div><div class="st-out" aria-live="polite"></div><div class="lab-btns"><button class="lab-btn primary" type="button" data-x="csv">Export audit (CSV)</button><button class="lab-btn" type="button" data-x="reset">Reset</button></div></div>';
  };
  R.planner = function (s, k) {
    var st = toolState(k);
    return '<div class="st-tool" data-tool="planner" data-k="' + k + '"><div class="st-plan">' + s.items.map(function (it, i) {
      return "<label><b>" + esc(it.t) + "</b>" + (it.d ? "<span>" + it.d + "</span>" : "") + '<textarea data-i="' + i + '" rows="3" placeholder="' + esc(it.ph || "") + '">' + esc(st[i] || "") + "</textarea></label>";
    }).join("") + '</div><div class="lab-btns"><button class="lab-btn primary" type="button" data-x="csv">Export plan (CSV)</button><button class="lab-btn" type="button" data-x="reset">Reset</button></div></div>';
  };

  var html = "", nav = [];
  S.sections.forEach(function (s, i) {
    var k = "s" + i, sid = "sec-" + i;
    if (s.h) nav.push('<a href="#' + sid + '">' + esc(s.nav || s.h) + "</a>");
    html += '<section class="st-sec' + (s.tool ? " tool" : "") + '" id="' + sid + '">' + (s.h ? '<div class="st-h"><h2>' + esc(s.h) + "</h2>" + tag(s.src) + "</div>" : "") + (s.lead ? '<p class="st-lead">' + s.lead + "</p>" : "") + (R[s.type] ? R[s.type](s, k) : "") + (s.after ? '<p class="st-note">' + s.after + "</p>" : "") + "</section>";
  });
  root.innerHTML = '<nav class="st-nav" aria-label="On this page">' + nav.join("") + "</nav>" + html;

  /* ---- tool behaviour ---- */
  function when() { return new Date().toISOString(); }
  root.querySelectorAll(".st-tool").forEach(function (box) {
    var k = box.getAttribute("data-k"), s = S.sections[+k.slice(1)], kind = box.getAttribute("data-tool"), out = box.querySelector(".st-out");
    function likertOut() {
      var st = toolState(k), vals = [], cats = {};
      s.items.forEach(function (it, i) { if (st[i]) { var v = it.rev ? (s.scale ? s.scale.length : 5) + 1 - st[i] : +st[i]; vals.push(v); if (it.cat) (cats[it.cat] = cats[it.cat] || []).push(v); } });
      if (!vals.length) { out.innerHTML = ""; return; }
      var mean = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
      out.innerHTML = '<div class="st-score"><b>' + mean(vals).toFixed(2) + "</b><span>mean of " + vals.length + " of " + s.items.length + " items</span></div>" + Object.keys(cats).map(function (c) { return '<div class="st-bar"><span class="l">' + esc(c) + '</span><span class="t"><i style="width:' + (100 * mean(cats[c]) / 5) + '%"></i></span><span class="v">' + mean(cats[c]).toFixed(2) + "</span></div>"; }).join("") + (s.compare ? '<p class="st-note">' + s.compare + "</p>" : "");
    }
    function auditOut() {
      var st = toolState(k), lv = s.levels || ["Not yet", "Partly", "Yes"], c = lv.map(function () { return 0; }), done = 0;
      s.items.forEach(function (_, i) { if (st[i] != null) { c[st[i]]++; done++; } });
      out.innerHTML = done ? '<div class="st-score"><b>' + done + "/" + s.items.length + "</b><span>" + lv.map(function (l, i) { return c[i] + " " + l.toLowerCase(); }).join(" · ") + "</span></div>" : "";
    }
    if (kind === "likert") { box.addEventListener("change", function (e) { if (e.target.type !== "radio") return; var st = toolState(k); st[+e.target.name.split("_")[1]] = +e.target.value; saveTool(k, st); likertOut(); }); likertOut(); }
    if (kind === "audit") {
      box.addEventListener("click", function (e) { var b = e.target; if (b.getAttribute("data-v") == null) return; var st = toolState(k), i = +b.getAttribute("data-i"), v = +b.getAttribute("data-v"); st[i] = st[i] === v ? null : v; saveTool(k, st); b.parentNode.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", st[i] === +x.getAttribute("data-v")); }); auditOut(); });
      box.addEventListener("input", function (e) { var n = e.target.getAttribute("data-n"); if (n == null) return; var st = toolState(k); st["n" + n] = e.target.value; saveTool(k, st); });
      auditOut();
    }
    if (kind === "planner") box.addEventListener("input", function (e) { var i = e.target.getAttribute("data-i"); if (i == null) return; var st = toolState(k); st[i] = e.target.value; saveTool(k, st); });
    box.addEventListener("click", function (e) {
      var x = e.target.getAttribute("data-x"); if (!x) return;
      if (x === "reset") { saveTool(k, {}); box.querySelectorAll("input[type=radio]").forEach(function (r) { r.checked = false; }); box.querySelectorAll("input[type=text],textarea").forEach(function (t) { t.value = ""; }); box.querySelectorAll("[aria-pressed]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); if (out) out.innerHTML = ""; return; }
      var st = toolState(k), rows, lv = s.levels || ["Not yet", "Partly", "Yes"];
      if (kind === "likert") rows = [["item", "statement", "category", "response", "scored", "exported"]].concat(s.items.map(function (it, i) { return [i + 1, it.t, it.cat || "", st[i] || "", st[i] ? (it.rev ? 6 - st[i] : st[i]) : "", when()]; }));
      if (kind === "audit") rows = [["criterion", "rating", "note", "exported"]].concat(s.items.map(function (it, i) { return [it.t, st[i] == null ? "" : lv[st[i]], st["n" + i] || "", when()]; }));
      if (kind === "planner") rows = [["prompt", "response", "exported"]].concat(s.items.map(function (it, i) { return [it.t, st[i] || "", when()]; }));
      U.download(id + "-" + kind + ".csv", U.csv(rows), "text/csv");
    });
  });
})();
