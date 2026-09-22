# NexDay Supply — storefront design mock

A modern, professional redesign concept for the NexDay Supply product catalogue
(`nexdaysupply.ca`). Static HTML, CSS and vanilla JS — no framework, no build
step. Open `index.html` in a browser and it runs.

**This is an unaffiliated design mock.** Every page carries a banner saying so.
Prices, SKUs, statistics, phone numbers and the contact form are placeholders;
brand names on the Shop By Brand page are illustrative. Nothing here is the
live store, and it should not be published anywhere it could be mistaken for it.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home — hero, trust bar, 12 departments, weekly offers, how ordering works, who we supply, brands, proof |
| `products.html` | Full product directory: every department and all 116 subcategories |
| `category.html` | Department page, driven by `?c=<slug>` and optionally `&s=<subcategory>` |
| `special-offers.html` | Daily specials plus the `#clearance` overstock section |
| `brands.html` | Featured brands and an A–Z index |
| `rewards.html` | NexDay Rewards — how it works, rates, FAQ |
| `guarantee.html` | NexDay Guarantee — cut-off, freight, returns FAQ |
| `about.html` | Company, commitments, `#sustainability` |
| `contact.html` | Quote request form, direct contacts, distribution centres |

## How it fits together

```
css/site.css      one stylesheet: tokens → base → layout → components
js/catalog.js     the catalogue: 12 departments, 116 subcategories, brands
js/layout.js      header, mega menu, search, footer — injected into every page
js/pages.js       per-page renderers, chosen by <body data-page="…">
```

Pages declare `<div data-layout="header">` and `<div data-layout="footer">`;
`layout.js` fills them. That keeps the navigation in one place — adding a
subcategory to `catalog.js` makes it appear in the mega menu, the directory,
the category sidebar, the chip row and the search box at once.

`category.html` is one file serving all twelve departments. It reads the query
string, so `category.html?c=gloves&s=Nitrile%20Gloves` is a real, linkable page.

## About the product rows

There is no inventory feed behind this. `catalog.js` generates product cards
from a seeded PRNG (`makeProducts`), keyed on the subcategory name — so the
same subcategory always shows the same products, and sorting or reloading
never reshuffles them. Thumbnails are the department icon on a dot-grid
placeholder; drop in real photography and the card layout is unchanged.

## Taxonomy source

The live site was unreachable from the environment this was built in (blocked
by the network egress policy), so the department and subcategory names were
reconstructed from NexDay Supply's indexed page titles and category URLs:
Foodservice/Restaurant/Grocery, Food Packaging Labels, Cleaning Tools,
Paper Products & Dispensers, Disposable Gloves, Safety Supplies & Protective
Gear, Personal Hygiene/Guest Amenities, Sanisac Liners and Mopping Supplies all
correspond to real category pages. The remaining subcategories are plausible
fills for a distributor of this type. **Check them against the live site before
treating this as their real taxonomy.**

Top-level navigation mirrors the real site's sections: Products, Special
Offers, Shop By Brand, NexDay Rewards, NexDay Guarantee, About Us, Contact Us.

## Checks

Rendered in headless Chromium at 1360px and 390px: no console errors, no
horizontal overflow, header and footer present on all nine pages.

```bash
npm install
node scripts/check-nexday.mjs
```

## Single-file preview

To click through the whole site without a server — or to hand someone one file
instead of a directory — build the bundled version:

```bash
npm run preview:nexday          # writes nexday-preview.html at the repo root
```

It inlines the stylesheet, the scripts and all nine pages' content, and swaps
between them with a hash router (`#!category?c=gloves&s=Nitrile%20Gloves`), so
the nav, mega menu, filters and sort all still work. The multi-page site under
`nexday/` stays the source of truth; the bundle is a build output and is not
committed.

Two flags change what it emits:

```bash
npm run preview:nexday -- out.html --brand "Kestrel Supply"
npm run preview:nexday -- out.html --brand "Kestrel Supply" --artifact
```

`--brand` renames the company everywhere it is visible — the split-colour
wordmark, the badge initials, the Rewards and Guarantee page names, the
internal globals — and swaps the banner for one that describes a fictional
distributor. Use it to show the design to someone without putting a real
business's name on a shared page. `--artifact` drops the document wrapper for
hosts that supply their own, and shifts the sticky header onto the safe-area
inset.

## Design notes

- **Palette** — navy carries the pages, amber is reserved for actions and the
  next-day promise, so the eye learns where to click.
- **Type** — one system-font stack, tight tracking on headings, generous line
  height in body copy. No webfont to download.
- **Density** — B2B buyers scan; cards are compact, prices are the heaviest
  thing on a product card, and stock status is always visible.
- **Accessibility** — skip link, visible focus rings, `aria-expanded` on the
  mega menu and drawer, `aria-current` on the active nav and filter, and a
  `prefers-reduced-motion` block that disables transitions.
