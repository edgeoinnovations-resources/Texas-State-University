# Dr. Injeong Jo — Instrument Lab

An interactive tour of the research instruments Dr. Injeong Jo (geography education,
Texas State University) built and reused across 2009–2024.

**Live site:** https://edgeoinnovations-resources.github.io/Texas-State-University/

The landing page (`index.html`) presents the instruments as a chronological timeline.
Each instrument lives in `instruments/` as a fully self-contained HTML page — all CSS
and JS inline, no external libraries, no CDNs, no build step. Every page works offline
and standalone; open any file directly in a browser.

## Structure

```
index.html         chronological timeline landing page
instruments/       the interactive instrument pages
.nojekyll          serve folders verbatim on GitHub Pages
```

## Instruments

| Year | Page | Instrument | Type |
|------|------|-----------|------|
| 2009 | `taxonomy-3d-cube.html` | Taxonomy of Spatial Thinking — 3D rotatable cube | Built |
| 2011 | `where-spatial-questions-hide.html` | Question-Location Coding Scheme | Built |
| 2013 | `college-readiness-geography.html` | Seven-Goal College-Readiness Scheme | Built |
| 2014 | `disposition-inventory.html` | Teaching Spatial Thinking Disposition Inventory | Built |
| 2016 | `methods-review-2016.html` | 191-Article Methods-Review Database | Built |
| 2016 | `stat-explorer.html` | Spatial Thinking Ability Test (STAT) | Reused |
| 2019 | `scientific-literacy-coding.html` | Four-Domain Scientific-Literacy Coding | Built |
| 2020 | `spatial-concept-test.html` | Spatial-Concept Generation & Recognition Test | Reused |
| 2022 | `geoactivity-optic-scrap.html` | GeoActivity Scaffolds — OPTIC & SCRAP | Built |
| 2023 | `tpack-gst-rubric.html` | TPACK-Based GST Lesson-Assessment Rubric | Reused |
| 2024 | `vsr-explainer.html` | Video-Stimulated Recall & Interview Protocols | Reused |
| 2024 | `spatial-concepts-gis-2024.html` | 16-Spatial-Concepts Self-Report Survey | Built |

**Not yet in this repo:** `taxonomy-of-spatial-thinking.html` (Jo & Bednarz 2009 —
report + 2D matrix explorer). Once added to `instruments/`, add its card to the 2009
row in `index.html`.

## Notes

These pages are interactive learning aids — recreations built to make each instrument's
logic explorable, not official research instruments or scoring tools. For the *reused*
instruments, sample items are original illustrations written for this site in the style
of the published instrument, not the copyrighted original items. Consult the cited
source for the authoritative instrument.
