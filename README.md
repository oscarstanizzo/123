# Blandi Land

Static marketing site for Blandi Land — landscaping and property maintenance in
Etobicoke, Toronto. No framework, no build step for the page itself: `index.html`,
`css/main.css` and three small vanilla JS files ship as written.

## Photos are not in this repo yet

`images/` is empty. The site references optimized photos that do not exist until
you add the originals and run the pipeline below. `npm run check` will list every
missing file.

Drop the 13 camera-named JPEGs and the logo into `images/`, then:

```bash
npm install
npm run images     # rename -> resize/WebP+JPEG -> sync width/height
npm run check      # asset existence, alt text, dimensions, page weight
```

`npm run images` runs three steps:

1. **`rename-images.mjs`** applies the camera-filename → slug mapping. Files that
   are not on the mapping are left untouched and reported, never guessed at.
2. **`optimize-images.mjs`** resizes every photo to 2000px on the long edge and
   writes 600 / 1200 / 2000 variants as WebP (q80) and JPEG (q82, mozjpeg) into
   `images/optimized/`, plus `images/manifest.json` with real dimensions.
3. **`sync-dimensions.mjs`** rewrites every `<img>` `width`/`height` in
   `index.html` from that manifest, and sets the before/after slider's aspect
   ratio, so the markup never lies about a photo's shape.

## Checks

```bash
npm run check     # asset existence, alt text, explicit dimensions, page weight
npm run perf      # LCP / FCP / CLS under Slow 4G + 4x CPU, mobile viewport
npm run verify    # slider with JS, <noscript> fallback, prefers-reduced-motion
npm run shot 390  # screenshots each section at a given width -> shots/
```

`npm run standins` generates labelled placeholder photos so `perf` and `shot`
can run before the real images arrive. They are deliberately noisy, so they
compress *worse* than real photographs — treat their numbers as a pessimistic
upper bound. Delete them before adding the real ones.

## Performance notes

The hero is the LCP element. The before/after slider sits just below the fold and
its two photos are heavy enough to starve the hero of bandwidth on a slow
connection — `loading="lazy"` does not prevent this, because Chrome's lazy
threshold on slow connections is very large. So the slider's URLs live in
`data-src`/`data-srcset`, hidden from the preload scanner, and `js/compare.js`
attaches them on `window.load`. A `<noscript>` block carries the same photos for
JS-off visitors. Removing that indirection pushes LCP from ~2.0s back over 4s.

## Before launch

- [ ] Replace `FORMSPREE_ENDPOINT_HERE` in `index.html` with the real Formspree
      form ID, then submit the form once to confirm delivery.
- [ ] Replace the placeholder testimonials (marked with a `⚠️ PLACEHOLDER REVIEWS`
      comment) with real Google reviews.
- [ ] Swap the inline SVG brand mark in the header and footer for the real logo
      asset, and re-check the two greens against it.
- [ ] Add an email address to the footer and contact section.
- [ ] Crop the house number and street sign out of the photos that show them.
