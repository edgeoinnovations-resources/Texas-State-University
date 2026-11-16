# Dr. Injeong Jo — Instrument Lab

A searchable catalogue of the research instruments Dr. Injeong Jo (geography education,
Texas State University) built and reused between 2009 and 2024. Each instrument has an
interactive page with a structured record, a hands-on version, and a link to its
reference article.

**Live site:** https://edgeoinnovations-resources.github.io/Texas-State-University/

26 instruments (18 built, 8 reused), 23 reference articles, plus one working tool.

## Structure

```
index.html                     catalogue: search, filters, timeline / table / lineage views, bibliography
assets/data.js                 one record per instrument (citation, DOI, construct, sample, lineage, provenance)
assets/lab.js                  shared shell: masthead, record panel, citation export, notes, saved entries
assets/lab.css                 shared styles and narrow-screen fixes
instruments/*.html             one page per instrument
instruments/coding-workbench.html   code your own items with the 24-cell taxonomy; CSV in and out
```

No build step, no external libraries, no network requests. The site works from GitHub
Pages or from a local folder.

## Editing

- **Change a citation, DOI, description or link between instruments:** edit `assets/data.js`.
  The index, record panels, lineage map and RIS/BibTeX exports all read from it.
  `doi: null` means no DOI is on record; do not guess one.
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
