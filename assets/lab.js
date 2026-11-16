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
    if (r.type === "chapter") {
      var c = r.container.replace(/^In (.*?\(Eds\.\), )(.*)$/, function (m, eds, book) { return "In " + (html ? esc(eds) : eds) + i(book); });
      out += (c === r.container ? t(c) : c) + " (pp. " + r.pages + "). " + t(r.publisher || "") + ".";
    } else {
      out += i(r.container) + ", " + i(r.volume) + (r.issue ? "(" + r.issue + ")" : "") + ", " + t(r.pages) + ".";
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
    f.push(["pages", String(r.pages).replace("–", "--")]);
    if (r.doi) f.push(["doi", r.doi]);
    return "@" + (r.type === "chapter" ? "incollection" : "article") + "{" + citeKey(r) + ",\n" + f.map(function (x) { return "  " + x[0] + " = {" + x[1] + "}"; }).join(",\n") + "\n}";
  }
  function ris(r) {
    var L = ["TY  - " + (r.type === "chapter" ? "CHAP" : "JOUR")];
    authorList(r).forEach(function (a) { L.push("AU  - " + a); });
    L.push("PY  - " + r.year, "TI  - " + r.title);
    if (r.type === "chapter") { L.push("T2  - " + r.container.replace(/^In .*?\(Eds\.\), /, ""), "PB  - " + (r.publisher || "")); }
    else { L.push("JO  - " + r.container, "VL  - " + r.volume); if (r.issue) L.push("IS  - " + r.issue); }
    var pp = String(r.pages).split("–"); L.push("SP  - " + pp[0]); if (pp[1]) L.push("EP  - " + pp[1]);
    if (r.doi) L.push("DO  - " + r.doi, "UR  - " + doiUrl(r));
    L.push("ER  - ");
    return L.join("\r\n");
  }
  function uniqueRefs(list) { var seen = {}, out = []; list.forEach(function (i) { var k = citeKey(i.ref); if (!seen[k]) { seen[k] = 1; out.push(i.ref); } }); return out; }
  function statusLabel(i) { return i.status === "built" ? "Built by Jo" : i.status === "reused" ? "Reused by Jo" : "Working tool"; }

  LAB.util = { esc: esc, el: el, href: href, download: download, csv: csv, copy: copy, store: store, apa: apa, bibtex: bibtex, ris: ris, doiUrl: doiUrl, findUrl: findUrl, uniqueRefs: uniqueRefs, statusLabel: statusLabel, byId: byId, base: base };

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

  function linkList(ids) { return ids.filter(function (x) { return byId[x]; }).map(function (x) { return '<a href="' + href(byId[x]) + '">' + esc(byId[x].short || byId[x].title) + " (" + byId[x].year + ")</a>"; }).join(" · "); }
  var builtOnBy = LAB.instruments.filter(function (x) { return (x.builds || []).indexOf(inst.id) > -1; }).map(function (x) { return x.id; });
  var links = "";
  if ((inst.builds || []).length) links += "<li><span>Builds on</span>" + linkList(inst.builds) + "</li>";
  if (builtOnBy.length) links += "<li><span>Built on by</span>" + linkList(builtOnBy) + "</li>";
  if ((inst.related || []).length) links += "<li><span>" + (inst.series ? "Same series / related" : "Related") + "</span>" + linkList(inst.related) + "</li>";

  var open = store.get("recordOpen", true) && !document.body.hasAttribute("data-lab-compact");
  var rec = el("section", { "class": "lab-record", "aria-label": "Instrument record" },
    '<div class="lab-record-in"><details' + (open ? " open" : "") + ">" +
    "<summary><span>" + esc(inst.title) + "</span>" +
    '<span class="lab-chip ' + inst.status + '">' + statusLabel(inst) + "</span>" +
    '<span class="lab-chip plain">' + esc(LAB.kinds[inst.kind]) + "</span>" +
    '<span class="lab-chip plain">' + (inst.tool ? "Scheme from " : "") + inst.year + "</span></summary>" +
    '<div class="lab-grid"><div>' +
    '<dl class="lab-dl">' +
    "<dt>Measures</dt><dd>" + esc(inst.measures) + "</dd>" +
    "<dt>Studied with</dt><dd>" + esc(inst.population) + "</dd>" +
    "<dt>On this page</dt><dd>" + esc(inst.use) + "</dd>" +
    "</dl>" +
    '<div class="lab-prov"><b>What comes from the paper, and what does not</b>' + esc(inst.provenance) + "</div>" +
    (links ? '<ul class="lab-links">' + links + "</ul>" : "") +
    "</div><div>" +
    '<div class="lab-cite"><h3>' + (inst.status === "reused" ? "Study that applied it" : inst.tool ? "Scheme to cite" : "Reference article") + "</h3>" +
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

  var first = document.body.firstChild;
  document.body.insertBefore(skip, first);
  document.body.insertBefore(mast, first);
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
