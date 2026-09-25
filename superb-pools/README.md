# Superb Pools & Spa website

Single-page marketing site for Superb Pools & Spa, a swimming pool contractor at
1733 Blackbird Dr, Mississauga. It follows the same design system as the Blandi
Land site in the repo root: light grounds, hairline grids, Archivo and Public
Sans (self-hosted in `fonts/`), and one accent colour, here pool blue.

Plain HTML, CSS and vanilla JS: no build step. Upload this folder to any static
host (Netlify, GitHub Pages, Cloudflare Pages). To preview locally, serve it
rather than opening the file, since browsers block the fonts on `file://`:

```bash
python3 -m http.server --directory superb-pools 8000
```

```
superb-pools/
  index.html      all content and sections
  css/style.css   design tokens at the top (colours, fonts)
  fonts/          Archivo + Public Sans, same files as the Blandi Land site
  js/water.js     animated water in the hero pool (WebGL, pauses off screen)
  js/main.js      card reveals and the contact form
```

## Before going live

- **Contact form.** There is no backend. Set `data-endpoint` on the `<form>` in
  `index.html` to a form service URL (Formspree, Basin, Netlify Forms) to get
  requests by email. Until then, "Send request" opens a pre-filled text message
  to (416) 305-7444, which works on phones but not on most desktops.
- **Project photos.** The hero is an illustrated aerial view of a backyard pool
  with live water, not a photo. Real photos of finished pools are the single
  biggest upgrade: a photo can replace the `.scene` block in the hero, and the
  "Designed around your yard" cards are the natural place for a gallery.
- **Hours.** Only "closes 7 p.m." was known, so the page says "Open until 7 p.m.".
  Add the full weekly hours to the Contact section once confirmed.
- **Reviews.** The two quotes and the 5.0 rating are from the Google listing.
  Update them as new reviews come in.
