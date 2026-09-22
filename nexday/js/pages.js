/* NexDay Supply — page renderers.
   Each page sets <body data-page="…">; this file fills the placeholders that
   page declares. Product rows come from catalog.js, so a category page and the
   home page can never drift apart. */
(function () {
  'use strict';

  var CAT = window.NEXDAY;
  var icon = window.NEXDAY_UI.icon;

  function query() {
    return new URLSearchParams(window.__NEXDAY_QUERY || location.search);
  }

  function money(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function stars(rating) {
    var full = Math.round(rating);
    return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
  }

  function thumbFor(cat) {
    return '<div class="prod__thumb">' + icon(cat ? cat.icon : 'box', 42) + '</div>';
  }

  function productCard(p, cat) {
    var save = p.list > p.price ? Math.round((1 - p.price / p.list) * 100) : 0;
    var flags = '';
    if (p.nexday) flags += '<span class="badge badge--nexday">NexDay</span>';
    if (p.eco) flags += '<span class="badge badge--eco">Eco</span>';
    if (save >= 20) flags += '<span class="badge badge--save">-' + save + '%</span>';

    return '<article class="prod">' +
      '<div class="prod__thumb">' + icon(cat ? cat.icon : 'box', 42) +
        (flags ? '<div class="prod__flags">' + flags + '</div>' : '') +
      '</div>' +
      '<div class="prod__body">' +
        '<p class="prod__sku">' + p.sku + '</p>' +
        '<h3 class="prod__name">' + p.name + '</h3>' +
        '<p class="prod__pack">' + p.pack + '</p>' +
        '<p class="prod__rating"><span class="stars" aria-hidden="true">' + stars(p.rating) + '</span>' +
          '<span>' + p.rating.toFixed(1) + ' (' + p.reviews + ')</span></p>' +
        '<p class="prod__price"><b>' + money(p.price) + '</b>' +
          (save ? '<s>' + money(p.list) + '</s>' : '') + '</p>' +
        '<p class="prod__stock' + (p.stock === 'In stock' ? '' : ' prod__stock--slow') + '">' + p.stock + '</p>' +
        '<div class="prod__foot"><button class="btn btn--sm btn--block" type="button">Add to order</button></div>' +
      '</div>' +
    '</article>';
  }

  function categoryCard(cat) {
    var chips = cat.subs.slice(0, 4).map(function (s) { return '<li>' + s + '</li>'; }).join('');
    return '<a class="cat-card" href="category.html?c=' + cat.slug + '">' +
      '<span class="cat-card__ico">' + icon(cat.icon, 22) + '</span>' +
      '<h3>' + cat.name + '</h3>' +
      '<p>' + cat.blurb + '</p>' +
      '<ul class="cat-card__subs">' + chips + '</ul>' +
      '<p class="cat-card__count">' + cat.subs.length + ' subcategories ' + icon('arrow', 14) + '</p>' +
    '</a>';
  }

  /* ---------- Home ---------- */
  function renderHome() {
    var grid = document.querySelector('[data-render="categories"]');
    if (grid) grid.innerHTML = CAT.categories.map(categoryCard).join('');

    var deals = document.querySelector('[data-render="deals"]');
    if (deals) {
      var picks = [];
      ['gloves', 'paper-products', 'chemicals', 'foodservice', 'waste', 'safety'].forEach(function (slug) {
        var cat = CAT.findCategory(slug);
        var p = CAT.makeProducts(cat.name, cat.subs[0], 3)[1];
        picks.push(productCard(p, cat));
      });
      deals.innerHTML = picks.join('');
    }

    var brands = document.querySelector('[data-render="brands-preview"]');
    if (brands) {
      brands.innerHTML = CAT.brands.slice(0, 12).map(function (b) {
        return '<a class="brand-tile" href="brands.html">' + b + '</a>';
      }).join('');
    }
  }

  /* ---------- Products directory ---------- */
  function renderDirectory() {
    var wrap = document.querySelector('[data-render="directory"]');
    if (!wrap) return;

    wrap.innerHTML = CAT.categories.map(function (cat) {
      var subs = cat.subs.map(function (sub) {
        return '<li><a href="category.html?c=' + cat.slug + '&s=' + encodeURIComponent(sub) + '">' + sub + '</a></li>';
      }).join('');
      return '<section class="dir-card">' +
        '<div class="dir-card__head"><span class="ico">' + icon(cat.icon, 20) + '</span>' +
          '<h2><a href="category.html?c=' + cat.slug + '">' + cat.name + '</a></h2></div>' +
        '<ul>' + subs + '</ul>' +
        '<p class="dir-card__foot"><a class="link-arrow" href="category.html?c=' + cat.slug + '">' +
          'Shop ' + cat.short + ' ' + icon('arrow', 15) + '</a></p>' +
      '</section>';
    }).join('');

    var q = query().get('q');
    var note = document.querySelector('[data-render="query-note"]');
    if (q && note) {
      note.innerHTML = 'Showing the full directory — search for “' +
        q.replace(/[<>&]/g, '') + '” is not wired up in this mock.';
      note.hidden = false;
    }
  }

  /* ---------- Category page ---------- */
  function renderCategory() {
    var host = document.querySelector('[data-render="category"]');
    if (!host) return;

    var params = query();
    var cat = CAT.findCategory(params.get('c') || '') || CAT.categories[0];
    var activeSub = params.get('s');
    if (cat.subs.indexOf(activeSub) === -1) activeSub = null;

    document.title = cat.name + ' | NexDay Supply';

    // Header block
    var head = document.querySelector('[data-render="category-head"]');
    head.innerHTML =
      '<ul class="crumbs">' +
        '<li><a href="index.html">Home</a></li>' +
        '<li><a href="products.html">Products</a></li>' +
        (activeSub ? '<li><a href="category.html?c=' + cat.slug + '">' + cat.short + '</a></li>' : '') +
        '<li aria-current="page">' + (activeSub || cat.name) + '</li>' +
      '</ul>' +
      '<h1>' + (activeSub || cat.name) + '</h1>' +
      '<p>' + cat.blurb + '</p>';

    // Sidebar
    var side = document.querySelector('[data-render="category-nav"]');
    var subLinks = cat.subs.map(function (sub) {
      var n = 12 + (sub.length % 9) * 7;
      return '<li><a href="category.html?c=' + cat.slug + '&s=' + encodeURIComponent(sub) + '"' +
        (sub === activeSub ? ' aria-current="true"' : '') + '>' +
        '<span>' + sub + '</span><span class="n">' + n + '</span></a></li>';
    }).join('');
    var others = CAT.categories.filter(function (c) { return c.slug !== cat.slug; })
      .map(function (c) {
        return '<li><a href="category.html?c=' + c.slug + '"><span>' + c.short + '</span></a></li>';
      }).join('');

    side.innerHTML =
      '<nav class="filters" aria-label="Subcategories">' +
        '<h2>' + cat.short + '</h2>' +
        '<ul><li><a href="category.html?c=' + cat.slug + '"' + (activeSub ? '' : ' aria-current="true"') + '>' +
          '<span>All ' + cat.short + '</span></a></li>' + subLinks + '</ul>' +
      '</nav>' +
      '<nav class="filters" aria-label="Other departments"><h2>Departments</h2><ul>' + others + '</ul></nav>';

    // Products
    var subs = activeSub ? [activeSub] : cat.subs.slice(0, 6);
    var rows = [];
    subs.forEach(function (sub) {
      rows = rows.concat(CAT.makeProducts(cat.name, sub, activeSub ? 12 : 4));
    });

    var chips = '<a class="chip" href="category.html?c=' + cat.slug + '"' +
      (activeSub ? '' : ' aria-current="true"') + '>All</a>' +
      cat.subs.map(function (sub) {
        return '<a class="chip" href="category.html?c=' + cat.slug + '&s=' + encodeURIComponent(sub) + '"' +
          (sub === activeSub ? ' aria-current="true"' : '') + '>' + sub + '</a>';
      }).join('');

    var main = document.querySelector('[data-render="category-body"]');
    main.innerHTML =
      '<div class="chips">' + chips + '</div>' +
      '<div class="toolbar">' +
        '<p class="toolbar__count"><b>' + rows.length + '</b> of ' +
          (cat.subs.length * 34) + ' items' + (activeSub ? ' in ' + activeSub : '') + '</p>' +
        '<div class="toolbar__right">' +
          '<label class="visually-hidden" for="sort">Sort by</label>' +
          '<select id="sort" data-sort>' +
            '<option value="featured">Featured</option>' +
            '<option value="low">Price: low to high</option>' +
            '<option value="high">Price: high to low</option>' +
            '<option value="rating">Top rated</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="prod-grid" data-grid></div>' +
      '<p class="pager"><button class="btn btn--ghost" type="button">Load more ' + cat.short + '</button></p>';

    var grid = main.querySelector('[data-grid]');

    function paint(order) {
      var list = rows.slice();
      if (order === 'low') list.sort(function (a, b) { return a.price - b.price; });
      if (order === 'high') list.sort(function (a, b) { return b.price - a.price; });
      if (order === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
      grid.innerHTML = list.map(function (p) { return productCard(p, cat); }).join('');
    }

    paint('featured');
    main.querySelector('[data-sort]').addEventListener('change', function (e) { paint(e.target.value); });
  }

  /* ---------- Brands ---------- */
  function renderBrands() {
    var host = document.querySelector('[data-render="brands"]');
    if (!host) return;
    host.innerHTML = CAT.brands.map(function (b) {
      return '<a class="brand-tile" href="products.html">' + b + '</a>';
    }).join('');

    var az = document.querySelector('[data-render="brand-az"]');
    if (az) {
      var letters = {};
      CAT.brands.forEach(function (b) {
        var k = b[0].toUpperCase();
        (letters[k] = letters[k] || []).push(b);
      });
      az.innerHTML = Object.keys(letters).sort().map(function (k) {
        return '<section class="dir-card"><div class="dir-card__head"><span class="ico">' + k +
          '</span><h2>' + k + '</h2></div><ul>' +
          letters[k].map(function (b) { return '<li><a href="products.html">' + b + '</a></li>'; }).join('') +
          '</ul></section>';
      }).join('');
    }
  }

  /* ---------- Special offers ---------- */
  function renderOffers() {
    var deals = document.querySelector('[data-render="offers"]');
    if (deals) {
      var out = [];
      CAT.categories.forEach(function (cat) {
        CAT.makeProducts(cat.name, cat.subs[1] || cat.subs[0], 4)
          .filter(function (p) { return p.list / p.price > 1.2; })
          .slice(0, 1)
          .forEach(function (p) { out.push(productCard(p, cat)); });
      });
      deals.innerHTML = out.join('');
    }

    var clear = document.querySelector('[data-render="clearance"]');
    if (clear) {
      var rows = [];
      CAT.categories.slice(0, 8).forEach(function (cat) {
        var p = CAT.makeProducts(cat.name, cat.subs[cat.subs.length - 1], 2)[0];
        rows.push(productCard(p, cat));
      });
      clear.innerHTML = rows.join('');
    }
  }

  var routes = {
    home: renderHome,
    products: renderDirectory,
    category: renderCategory,
    brands: renderBrands,
    offers: renderOffers
  };

  function run() {
    var page = document.body.getAttribute('data-page');
    if (routes[page]) routes[page]();
  }

  window.NEXDAY_PAGES = { run: run };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
