# Pear — Ora

Marketing site for **Pear**, a fictional house that makes one luxury phone a
year. Built as a design exercise: static `index.html`, one stylesheet, one
vanilla JS file, no framework and no build step.

The whole page — including the product — is **126 KB over 5 requests**. There
are no photographs. The phone is drawn as SVG.

## Why the phone is vector, not a render

A luxury product page normally leans on a studio photograph, which is the one
asset a code-only exercise cannot have. So the device is built as an SVG
`<symbol>` pair (front and back) out of layered gradients: a ten-stop body
gradient for the machined speculars, a chamfer stroke that catches light on the
top-left and dies out toward the bottom-right, concentric lens barrels with an
iris gradient and a coating flare, and a broad diagonal sheen over the rear
panel so it reads as a surface rather than a fill.

Two things follow from that choice, and both are the reason it was worth it:

- **It is resolution-independent and nearly free.** It costs bytes already spent
  on the HTML, and it is sharp on any display.
- **It recolours at runtime.** Every finish colour is a CSS custom property
  (`--f-deep/-dark/-mid/-lite/-back/-glow`) referenced from inside the SVG's
  gradient stops. Switching finishes is one attribute on `<html>`, and the
  device follows for free — including the instances drawn with `<use>`, because
  custom properties inherit into the shadow tree that `<use>` creates.

That last point is what makes the finish switcher a four-line function instead
of four separate drawings.

## Finishes

| Key | Name | Surface |
|---|---|---|
| `titan` | Natural | Longitudinal brush, 320 grit |
| `champagne` | Champagne | Type II anodise |
| `verdigris` | Verdigris | Type II anodise |
| `onyx` | Onyx | Bead-blasted |

The rear panels are deliberately **desaturated** relative to the rails. Carrying
full finish saturation onto the back made champagne and verdigris read as brown
and olive *paint*; anodised metal in a dark room is much closer to neutral, with
the colour showing mostly in the polished edges and the sheen.

## Layout notes

Two things here are easy to break by accident:

- **The sticky Detail section.** The pinned device lives in `.detail__sticky`
  inside `.detail__stage`, and a sticky element can only travel as far as its
  *container*. The grid must stay `align-items: stretch` (with `align-items:
  start` the stage collapses to its own content and the device unpins after one
  screen), and `.panel` must keep its `min-height: 80svh` so the scrolling
  column is tall enough to pin against. `verify.mjs` checks the device's drift
  across the section for exactly this reason.
- **The hero is meant to be one screen** at desktop widths, ending on the facts
  row. `verify.mjs` asserts that at ≥1180px.

## Checks

```bash
npm install                      # from the repo root — playwright is a devDep there
node pear/scripts/verify.mjs     # console, fonts, interactions, sticky, responsive
node pear/scripts/shot.mjs       # hero + full page at 1440 and 390
node pear/scripts/shot.mjs 1440 '#specs'   # one section at one width
node pear/scripts/finishes.mjs   # four-up contact sheet of the finishes
node pear/scripts/serve.mjs      # just serve it at :8765 to look at by hand
```

**Serve it — do not open `index.html` from disk.** A `@font-face` fetched over
`file://` is blocked by CORS, so the page silently falls back to a system face
and every screenshot taken that way misrepresents the typography. The scripts
each start their own server for this reason, and `verify.mjs` asserts both fonts
actually loaded.

`prefers-reduced-motion` is honoured throughout: reveals, counters, the float,
the marquee, the cursor tilt and the panel dimming all resolve to their finished
state rather than animating, and `verify.mjs` asserts nothing stays hidden.

## This is fiction

Pear is invented, and so is everything on the page: the workshop, the prices,
the serial numbers, the press quote and the outlets that carry it, and the three
atelier addresses. The booking form validates and acknowledges but has no
endpoint — wire one up before it goes anywhere real. Nothing here is affiliated
with any actual phone manufacturer.
