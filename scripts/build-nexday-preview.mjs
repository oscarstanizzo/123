/* Bundles nexday/ into one self-contained HTML file you can open anywhere —
   no server, no sibling files. Every page's <main> is inlined and a small hash
   router swaps between them, so the nav, the mega menu and the category query
   strings all still work.

   Usage: node scripts/build-nexday-preview.mjs [outfile] */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'nexday');
const out = process.argv[2] || join(root, '..', 'nexday-preview.html');

const grab = (src, re) => (src.match(re) || [, ''])[1];

const pages = readdirSync(root)
  .filter((f) => f.endsWith('.html'))
  .map((file) => {
    const src = readFileSync(join(root, file), 'utf8');
    return {
      key: file.replace(/\.html$/, ''),
      file,
      title: grab(src, /<title>([\s\S]*?)<\/title>/).trim(),
      banner: (src.match(/<p class="mock-note">[\s\S]*?<\/p>/) || [''])[0],
      main: (src.match(/<main[\s\S]*?<\/main>/) || [''])[0]
    };
  });

const css = readFileSync(join(root, 'css/site.css'), 'utf8');
const js = ['catalog.js', 'layout.js', 'pages.js']
  .map((f) => readFileSync(join(root, 'js', f), 'utf8'))
  .join('\n');

const viewsJson = JSON.stringify(
  Object.fromEntries(pages.map((p) => [p.key, { t: p.title, b: p.banner, m: p.main }]))
);

const router = `
/* Single-file router. Link hrefs in the pages point at sibling .html files;
   here they resolve to inlined views instead. */
(function () {
  'use strict';
  var VIEWS = ${viewsJson};
  var view = document.getElementById('view');
  var banner = document.getElementById('banner');

  function show(key, search, hash) {
    var v = VIEWS[key] || VIEWS.index;
    window.__NEXDAY_QUERY = search || '';
    document.body.setAttribute('data-page', (v.m.match(/data-page="([^"]*)"/) || [])[1] || key);
    banner.innerHTML = v.b;
    view.innerHTML = v.m;
    document.title = v.t;

    // body[data-page] drives the renderers, so read it off the source page.
    var m = VIEWS[key] ? key : 'index';
    var srcPage = { index: 'home', products: 'products', category: 'category',
                    brands: 'brands', 'special-offers': 'offers' }[m] || m;
    document.body.setAttribute('data-page', srcPage);
    if (window.NEXDAY_PAGES) window.NEXDAY_PAGES.run();

    document.querySelectorAll('.nav__link[href]').forEach(function (a) {
      var target = a.getAttribute('href').split(/[?#]/)[0].replace(/\\.html$/, '');
      if (target === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (hash) {
      var el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || !/\\.html(\\?|#|$)/.test(href)) return;
    e.preventDefault();
    var file = href.split(/[?#]/)[0].replace(/\\.html$/, '');
    var search = (href.match(/\\?[^#]*/) || [''])[0];
    var hash = (href.match(/#.*$/) || [''])[0];
    location.hash = '!' + file + search + hash;
  });

  function fromHash() {
    var raw = location.hash.replace(/^#!?/, '') || 'index';
    var file = raw.split(/[?#]/)[0] || 'index';
    var search = (raw.match(/\\?[^#]*/) || [''])[0];
    var hash = (raw.match(/#.*$/) || [''])[0];
    show(file, search, hash);
  }

  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
`;

const html = `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NexDay Supply — storefront design mock (preview)</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0B1626">
<style>
${css}
</style>
</head>
<body data-page="home">
<a class="skip-link" href="#main">Skip to content</a>
<div id="banner"></div>
<div data-layout="header"></div>
<div id="view"></div>
<div data-layout="footer"></div>
<script>
${js}
${router}
</script>
</body>
</html>
`;

writeFileSync(out, html);
console.log('wrote ' + out + ' (' + Math.round(html.length / 1024) + ' KB, ' + pages.length + ' pages inlined)');
