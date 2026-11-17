# Dr. Injeong Jo — Instrument Lab

A searchable catalogue of the research of Dr. Injeong Jo (geography education, Texas
State University), 2009 to 2026: every instrument she built or reused, and her studies,
reviews and frameworks. Each has a page with a structured record, a hands-on tool, and
a link to its source.

**Live site:** https://edgeoinnovations-resources.github.io/Texas-State-University/

26 instruments (18 built, 8 reused), 12 studies and reviews, 34 source publications,
plus one working tool. Thirteen further works are listed on the index as not yet covered.

## Structure

```
index.html                     catalogue: search, filters, timeline / table / lineage views, bibliography
assets/data.js                 one record per instrument (citation, DOI, construct, sample, lineage, provenance)
assets/lab.js                  shared shell: masthead, record panel, citation export, notes, saved entries
assets/lab.css                 shared styles, hero, study-page components, narrow-screen fixes
assets/study.js                renderer for study, review and framework pages (charts, diagrams, tools)
instruments/*.html             one page per instrument
instruments/coding-workbench.html   code your own items with the 24-cell taxonomy; CSV in and out
```

No build step, no external libraries, no network requests. The site works from GitHub
Pages or from a local folder.

## Editing

- **Change a citation, DOI, description or link between instruments:** edit `assets/data.js`.
  The index, record panels, lineage map and RIS/BibTeX exports all read from it.
  `doi: null` means no DOI is on record; do not guess one.
- **Add a study or review page:** add a record with `study: true`, then create a page that
  sets `window.STUDY = { sections: [...] }` and loads `study.js`; see any `*-20xx*.html` page.
- **Add an instrument:** add a record to `assets/data.js`, create `instruments/<id>.html`
  with `<body data-lab-id="<id>">`, and load `../assets/lab.css`, `../assets/data.js` and
  `../assets/lab.js` as the existing pages do.

## What each page states

Every page opens with a record: what the instrument measures, who it was studied with,
the reference article, and which parts of the page come from the article and which were
written for this site. Sample items for reused instruments are illustrations, not the
published items.

These pages are study aids. They are not official instruments and are not endorsed by
the authors. Consult the cited article before using anything here in research.

## Data kept in the browser

Notes, typed entries and workbench projects are stored in the visitor's own browser
(localStorage) and are never transmitted. Use the export buttons to keep copies.
