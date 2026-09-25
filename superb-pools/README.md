# Superb Pools & Spa website

Single-page marketing site for Superb Pools & Spa, a swimming pool contractor at
1733 Blackbird Dr, Mississauga. Plain HTML, CSS and vanilla JS: no build step.
Open `index.html` in a browser, or upload this folder to any static host
(Netlify, GitHub Pages, Cloudflare Pages).

```
superb-pools/
  index.html      all content and sections
  css/style.css   design tokens at the top (colours, fonts)
  js/water.js     animated water caustics in the hero (WebGL, pauses off screen)
  js/main.js      header, mobile menu, scroll reveals, contact form
```

## Before going live

- **Contact form.** There is no backend. Set `data-endpoint` on the `<form>` in
  `index.html` to a form service URL (Formspree, Basin, Netlify Forms) to get
  requests by email. Until then, "Send request" opens a pre-filled text message
  to (416) 305-7444, which works on phones but not on most desktops.
- **Project photos.** The site uses illustrations and an animated water effect,
  not photos. Real photos of finished pools are the single biggest upgrade; the
  "Signature forms" cards are the natural place for them.
- **Hours.** Only "closes 7 p.m." was known, so the page says "Open until 7 p.m.".
  Add the full weekly hours to the Contact section once confirmed.
- **Reviews.** The two quotes and the 5.0 rating are from the Google listing.
  Update them as new reviews come in.
