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
| `checkout.html` | Four-step checkout branching to card or Net-30 / PO |
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

## The cart

`cart.js` owns the order. Add buttons carry the line data as `data-*`
attributes, and the click handler is delegated from `document`, because product
grids re-render underneath it on every sort and filter. Lines mirror to
`localStorage` so a reload keeps the order; every read and write is wrapped,
so a private window or blocked site data degrades to a session-only cart
rather than breaking the page.

The drawer shows line totals, a quantity stepper, a subtotal and progress
toward the $500 free-freight threshold the rest of the site advertises.

## Photography

The hero and the twelve department photographs were generated with Higgsfield
(`z_image`) and optimized to WebP by `scripts/optimize-nexday-images.mjs` —
720×540 for the department shots, 1920 and 960 wide for the hero, 316 KB for
the set. The ~3 MB source PNGs live in `nexday/images/src/` and are gitignored;
only the WebP ships.

Each department names its own photograph in `catalog.js`, so one file feeds the
category cards, the product thumbnails and the department pages. Product cards
fall back to the department icon when a photograph is missing, which is how the
build check caught two departments before their images had been generated.

Prompts asked for blank, unbranded goods on a seamless grey-white background.
Worth knowing if you regenerate any: the first passes put invented brand text
on the chemical bottles and hotel amenities, which had to be reshot with an
explicit "no letters, no words, nothing printed" instruction. Check any new
image for invented lettering before shipping it.

To regenerate after adding or replacing a source PNG:

```bash
node scripts/optimize-nexday-images.mjs
```

## Checkout

`checkout.html` runs four steps — contact and address, delivery, payment,
confirmation — and branches at payment, because a distributor serves both
kinds of buyer: pay now by card, or place the order against a Net-30 account
with a PO number and let sales invoice it. The cart drawer links to each path
directly (`checkout.html?mode=quote` lands on the invoicing one).

Freight follows the delivery choice and honours the $500 free-freight
threshold; tax follows the selected province. Both rate tables are
illustrative — a real store gets tax from a tax service and freight from the
carrier.

**Nothing here takes a payment.** The card fields are readonly demo fields
behind a notice saying so, no order is recorded anywhere, and the confirmation
page says plainly that nothing was charged and no email was sent. Taking real
money needs a payment provider and a server: Stripe, Snipcart or Foxy for a
static site like this one, or Shopify (full or headless) for inventory and
accounts too.

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
