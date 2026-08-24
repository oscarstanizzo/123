# Pear — Ora

A three-page marketing site for **Pear**, a fictional house that makes one
luxury phone a year: the product, the founding story, and the workshop.

There are no photographs anywhere in it. The phone is drawn in SVG, and the
whole site is about **160 KB** of CSS, JS and two fonts.

| Page | Source | What it is |
|---|---|---|
| `/` | `src/index.html` | The Ora — hero, craft, finishes, detail, specification, editions |
| `/story/` | `src/story.html` | How we started — 2016 to 2026, on a pinned horizontal timeline |
| `/workshop/` | `src/workshop.html` | Four rooms, the nine finishers, and the ledger |

## There is a build step now, and why

Three pages share a nav, a footer and a 250-line SVG sprite. Keeping three
copies of those in sync by hand is exactly the kind of thing that drifts
silently, so pages are assembled from `src/` + `partials/`:

```bash
node pear/scripts/build.mjs      # src/ + partials/ -> index.html, story/, workshop/
```

`{{> nav}}` pulls in a partial. `{{root}}` becomes `''` or `'../'` so shared
links work from both the root and a subdirectory. `{{on-story}}` marks the
current page in the nav. Any token left unresolved throws rather than shipping
as literal text in the page.

**Edit `src/`, not the built pages** — `index.html`, `story/index.html` and
`workshop/index.html` are generated and will be overwritten.

## The scroll engine

`js/scroll.js` runs one scroll listener and one rAF for the page. Every frame
reads the scroll position once, then writes; measured rects are cached and only
recomputed on resize, because reading layout per-element per-frame is what makes
this kind of page stutter. Everything is opt-in through data attributes:

| Attribute | Effect |
|---|---|
| `.reveal` | fade and rise once on entry (`data-delay` 1–4 staggers it) |
| `data-split` | split a heading into words that rise out of a mask |
| `data-scrub` | receive `--p`, 0 → 1, across the element's own travel |
| `data-par="0.3"` | drift vertically against the scroll |
| `data-rail` | pin, and pull a horizontal track sideways |
| `data-count` | count up once, on entry |
| `data-progress` | scale to the page's total scroll progress |

Two details worth keeping:

- **The split stagger shrinks as the line gets longer.** At a flat 45 ms per
  word, a two-dozen-word pull-quote spends over a second finishing and reads as
  lag rather than craft. Long headings compress to the same overall budget.
- **A rail's section height is derived from its track width**, so the sideways
  travel and the vertical scroll it consumes are the same distance. It is set at
  runtime, which is why `refresh()` exists — see below.

Every path is inert under `prefers-reduced-motion`: elements resolve to their
finished state instead of animating, and the rail stops pinning and becomes an
ordinary swipeable row. `verify.mjs` asserts that nothing is left hidden.

## Why the phone is vector

A luxury product page normally leans on a studio photograph, which is the one
asset a code-only exercise cannot have. So the device is an SVG `<symbol>` pair
built from layered gradients: a ten-stop body gradient for the machined
speculars, a chamfer stroke that catches light top-left and dies out toward the
bottom-right, concentric lens barrels with an iris and a coating flare, and a
diagonal sheen over the rear panel so it reads as a surface rather than a fill.

It also **recolours at runtime**. Every finish colour is a custom property
referenced from inside the SVG's gradient stops, so switching finishes is one
attribute on `<html>` — including the `<use>` clones, because custom properties
inherit into the shadow tree that `<use>` creates. That is what makes the finish
switcher a four-line function instead of four separate drawings.

The rear panels are deliberately **desaturated** relative to the rails. Carrying
full finish saturation onto the back made champagne and verdigris read as brown
and olive *paint*; anodised metal in a dark room is much closer to neutral, with
the colour showing in the polished edges and the sheen.

| Key | Name | Surface |
|---|---|---|
| `titan` | Natural | Longitudinal brush, 320 grit |
| `champagne` | Champagne | Type II anodise |
| `verdigris` | Verdigris | Type II anodise |
| `onyx` | Onyx | Bead-blasted |

## Layout notes

Three things here are easy to break by accident:

- **The sticky Detail section** on the home page. A sticky element can only
  travel as far as its container, so the grid must stay `align-items: stretch`
  (with `start` the stage collapses to its own content and the device unpins
  after one screen) and `.panel` must keep its `min-height: 80svh`.
- **The hero is one screen** at desktop widths, ending on the facts row.
- **`--p` is composed into the device transforms, not assigned over them.**
  `.dev--front` keeps its pose and appends `translateY(calc(...))`, so the
  scroll drift and the resting position do not fight. Hero placement lives in
  `home.css`; `base.css` only holds the generic device.

All three are asserted in `verify.mjs`.

## Checks

```bash
npm install                              # from the repo root — playwright is a devDep there
node pear/scripts/build.mjs              # assemble the pages
node pear/scripts/verify.mjs             # 60 checks across all three pages
node pear/scripts/shot.mjs               # hero + full page at 1440 and 390
PAGE=story/index.html node pear/scripts/shot.mjs 1440 '#timeline'
node pear/scripts/finishes.mjs           # four-up contact sheet of the finishes
node pear/scripts/serve.mjs              # serve at :8765 to look at by hand
```

`verify.mjs` covers, per page: console and network, that both web fonts actually
loaded, that every split heading resolved and no word is stuck inside its mask,
counters, reduced motion, and horizontal overflow from 320 to 1920. Then across
pages: that every internal link resolves to a real file. Then the pieces with
moving parts — the finish switcher and its arrow keys, the pinned device's drift,
the form, the rail's pinning and travel, and the workshop spine's fill.

**Serve it — do not open a built page from disk.** A `@font-face` fetched over
`file://` is blocked by CORS, so the page silently falls back to a system face
and every screenshot taken that way misrepresents the typography. The scripts
each start their own server for this reason.

## The preview bundle

```bash
node pear/scripts/build-preview.mjs      # -> preview.html
node pear/scripts/verify-preview.mjs
```

For hosts that forbid external requests, `build-preview.mjs` inlines the CSS, the
JS and both fonts as data URIs into a single ~200 KB file that makes no network
requests. All three pages are stacked in one document behind a hash router
(`#/story`), so one file still previews as a multi-page site.

Two hazards it guards against, because both fail silently:

- **Concatenating modules into one scope.** A duplicated top-level name is a
  SyntaxError that kills the entire bundle — and the page still *renders*, just
  with no JavaScript at all. The build compares top-level declarations across
  the engine, the page script and the router, and throws on a collision.
- **Duplicate ids.** Every page carries `id="nav"` and `id="main"`; stacked, an
  id lookup finds only the first and leaves the other two panels' chrome inert.
  The bundler suffixes them per panel, `verify-preview.mjs` asserts no id
  repeats, and the engine drives navs by class rather than by id.

`preview.html` is generated output and is not tracked.

## This is fiction

Pear is invented, and so is everything on the site: Ilse Brandt and Tomás Refai,
the nine finishers, the workshop at Rue du Seyon 14, the prices, the serial
numbers, the ledger, the press quote and the outlets that carry it. The booking
form validates and acknowledges but has no endpoint. Nothing here is affiliated
with any actual phone manufacturer.
