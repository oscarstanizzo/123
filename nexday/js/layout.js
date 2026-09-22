/* NexDay Supply — shared chrome.
   Every page ships <div data-layout="header"> and <div data-layout="footer">;
   this file fills them, wires the mega menu, the search box and the mobile
   drawer. Keeping the nav in one place means a catalogue change in
   catalog.js reaches all nine pages at once. */
(function () {
  'use strict';

  var CAT = window.NEXDAY;

  /* ---------- Icons ----------
     24×24, 1.75 stroke, no fill unless stated. Written inline rather than
     loaded as a sprite so a page works straight off the filesystem. */
  var PATHS = {
    search:   '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16.7 16.7"/>',
    user:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    cart:     '<circle cx="9.5" cy="20" r="1.4"/><circle cx="18.5" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.2a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L22 7H6"/>',
    truck:    '<path d="M2 5h12v11H2z"/><path d="M14 9h4l3 3.2V16h-7z"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="18.5" r="2.2"/>',
    shield:   '<path d="M12 22s8-4 8-10V5.5L12 2.5 4 5.5V12c0 6 8 10 8 10z"/><path d="m8.8 11.8 2.2 2.2 4.2-4.4"/>',
    check:    '<path d="m4 12.5 5 5 11-11"/>',
    chevron:  '<path d="m6 9.5 6 6 6-6"/>',
    arrow:    '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    menu:     '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
    pin:      '<path d="M20 10c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.8"/>',
    phone:    '<path d="M21.5 16.9v2.8a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 3.8 2h2.9a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L7.6 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.9 2z"/>',
    mail:     '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 6.2 9-6.2"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    leaf:     '<path d="M20.5 3.5C10 3.5 3.5 9 3.5 18.5c9.5 0 16-6 17-15z"/><path d="M4 20.5 13 11.5"/>',
    headset:  '<path d="M4 14.5v-2.8a8 8 0 0 1 16 0v2.8"/><path d="M4 14.5h3.2v6H6a2 2 0 0 1-2-2z"/><path d="M20 14.5h-3.2v6H18a2 2 0 0 0 2-2z"/>',
    tag:      '<path d="M20.4 13.3 13.3 20.4a2 2 0 0 1-2.8 0L3 12.9V3h9.9l7.5 7.5a2 2 0 0 1 0 2.8z"/><circle cx="7.8" cy="7.8" r="1.5"/>',
    box:      '<path d="m21 8-9-5-9 5 9 5 9-5z"/><path d="M3 8v8.2l9 4.8 9-4.8V8"/><path d="M12 13v8"/>',
    cup:      '<path d="M6 3.5h12l-1.3 17a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9z"/><path d="M5.6 9h12.8"/>',
    label:    '<path d="M3 6h13.2l4.3 6-4.3 6H3z"/><circle cx="7.6" cy="12" r="1.5"/>',
    broom:    '<path d="M12 2.5v9"/><path d="M7 11.5h10l-1.4 10h-7.2z"/><path d="M8.4 16h7.2"/>',
    bottle:   '<path d="M10 2.5h4v3l2 3.2V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V8.7l2-3.2z"/><path d="M8 13.5h8"/>',
    roll:     '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
    glove:    '<path d="M8 21.5V11a2 2 0 0 1 4 0V4.2a1.6 1.6 0 0 1 3.2 0V11l2 1a3 3 0 0 1 1.6 2.7v6.8z"/>',
    helmet:   '<path d="M3 17.5a9 9 0 0 1 18 0z"/><path d="M8 17.5V8.6a4 4 0 0 1 8 0v8.9"/><path d="M2 17.5h20"/>',
    cross:    '<path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z"/>',
    bin:      '<path d="M3.5 6.5h17"/><path d="M8.5 6.5v-3h7v3"/><path d="m6 6.5 1 14.5h10l1-14.5"/>',
    soap:     '<path d="M9 8.5h6a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a3 3 0 0 1 3-3z"/><path d="M10 8.5V5h4v3.5"/><path d="M14 4h3.2v2"/>',
    bed:      '<path d="M3 19.5V7"/><path d="M3 12h16a2 2 0 0 1 2 2v5.5"/><path d="M7.5 12V9h5v3"/>',
    card:     '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>',
    grid:     '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'
  };

  function icon(name, size) {
    var d = PATHS[name] || '';
    var s = size || 20;
    return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      d + '</svg>';
  }

  /* Nav tabs mirror the live site's top-level sections. */
  var NAV = [
    { label: 'Products', href: 'products.html', mega: true },
    { label: 'Special Offers', href: 'special-offers.html' },
    { label: 'Shop By Brand', href: 'brands.html' },
    { label: 'NexDay Rewards', href: 'rewards.html' },
    { label: 'NexDay Guarantee', href: 'guarantee.html' },
    { label: 'About Us', href: 'about.html' },
    { label: 'Contact Us', href: 'contact.html' },
    { label: 'Clearance', href: 'special-offers.html#clearance', accent: true }
  ];

  var here = location.pathname.split('/').pop() || 'index.html';

  function megaMarkup() {
    var cols = CAT.categories.map(function (cat) {
      var subs = cat.subs.slice(0, 5).map(function (sub) {
        return '<li><a class="sub" href="category.html?c=' + cat.slug +
          '&s=' + encodeURIComponent(sub) + '">' + sub + '</a></li>';
      }).join('');
      var rest = cat.subs.length - 5;
      return '<div class="mega__col">' +
        '<a class="mega__head" href="category.html?c=' + cat.slug + '">' +
          icon(cat.icon, 18) + cat.short + '</a>' +
        '<ul>' + subs + '</ul>' +
        (rest > 0 ? '<a class="mega__more" href="category.html?c=' + cat.slug + '">+ ' + rest + ' more</a>' : '') +
      '</div>';
    }).join('');

    return '<div class="mega" id="mega" hidden>' +
      '<div class="wrap">' +
        '<div class="mega__grid">' + cols + '</div>' +
        '<div class="mega__foot">' +
          '<span>Over 40,000 line items across 12 departments — all stocked in Canada.</span>' +
          '<a class="link-arrow" href="products.html">Browse the full product directory ' + icon('arrow', 16) + '</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function headerMarkup() {
    var tabs = NAV.map(function (item) {
      if (item.mega) {
        return '<li><button class="nav__link" type="button" aria-expanded="false" aria-controls="mega">' +
          icon('grid', 16) + 'Products ' + icon('chevron', 14) + '</button></li>';
      }
      var current = item.href === here ? ' aria-current="page"' : '';
      return '<li><a class="nav__link' + (item.accent ? ' nav__link--accent' : '') + '" href="' +
        item.href + '"' + current + '>' + item.label + '</a></li>';
    }).join('');

    return '' +
    '<div class="utility"><div class="wrap">' +
      '<p class="utility__promo"><span class="utility__dot"></span>' +
        '<strong>Order by 4:00 PM ET</strong> — NexDay Guaranteed items ship the same day.</p>' +
      '<ul class="utility__links">' +
        '<li><a href="guarantee.html">Shipping &amp; Delivery</a></li>' +
        '<li><a href="rewards.html">Rewards Program</a></li>' +
        '<li><a href="contact.html">Request a Quote</a></li>' +
        '<li><a href="contact.html">1-800-555-0199</a></li>' +
      '</ul>' +
    '</div></div>' +

    '<header class="masthead">' +
      '<div class="wrap masthead__bar">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand__mark" aria-hidden="true">ND</span>' +
          '<span><span class="brand__name">Nex<span>Day</span> Supply</span>' +
          '<span class="brand__tag">Wholesale · Canada-wide</span></span>' +
        '</a>' +

        '<form class="search" role="search" action="products.html" autocomplete="off">' +
          '<label class="visually-hidden" for="q">Search products</label>' +
          '<div class="search__field">' + icon('search', 18) +
            '<input id="q" name="q" type="search" placeholder="Search 40,000+ products, brands or SKUs">' +
            '<button type="submit">Search</button>' +
          '</div>' +
          '<div class="search__results" id="search-results" role="listbox" hidden></div>' +
        '</form>' +

        '<div class="masthead__tools">' +
          '<a class="tool" href="contact.html">' + icon('headset', 20) + '<span>Support</span></a>' +
          '<a class="tool" href="contact.html">' + icon('user', 20) + '<span>Sign in</span></a>' +
          '<a class="tool tool--cart" href="products.html">' + icon('cart', 20) +
            '<span>Cart</span><span class="tool__count">0</span></a>' +
          '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">' +
            icon('menu', 20) + '<span class="visually-hidden">Menu</span></button>' +
        '</div>' +
      '</div>' +

      '<nav class="nav" id="primary-nav" aria-label="Primary">' +
        '<div class="wrap"><ul class="nav__list">' + tabs + '</ul></div>' +
      '</nav>' +
      megaMarkup() +
    '</header>';
  }

  function footerMarkup() {
    var shop = CAT.categories.slice(0, 6).map(function (c) {
      return '<li><a href="category.html?c=' + c.slug + '">' + c.short + '</a></li>';
    }).join('');
    var shop2 = CAT.categories.slice(6).map(function (c) {
      return '<li><a href="category.html?c=' + c.slug + '">' + c.short + '</a></li>';
    }).join('');

    return '<footer class="footer"><div class="wrap">' +
      '<div class="footer__top">' +
        '<div class="footer__about">' +
          '<a class="brand" href="index.html">' +
            '<span class="brand__mark" aria-hidden="true">ND</span>' +
            '<span><span class="brand__name">Nex<span>Day</span> Supply</span>' +
            '<span class="brand__tag">Wholesale · Canada-wide</span></span>' +
          '</a>' +
          '<p>A single-source distributor for foodservice packaging, janitorial, safety, ' +
          'medical and hospitality supplies — stocked in Canada and shipped from four ' +
          'distribution centres, so the order lands the next day.</p>' +
          '<ul class="footer__dc"><li>Toronto</li><li>Vancouver</li><li>Calgary</li><li>Edmonton</li></ul>' +
        '</div>' +
        '<div><h3>Shop</h3><ul>' + shop + '</ul></div>' +
        '<div><h3>More departments</h3><ul>' + shop2 + '</ul></div>' +
        '<div><h3>Buying</h3><ul>' +
          '<li><a href="special-offers.html">Special Offers</a></li>' +
          '<li><a href="special-offers.html#clearance">Overstock &amp; Clearance</a></li>' +
          '<li><a href="brands.html">Shop By Brand</a></li>' +
          '<li><a href="rewards.html">NexDay Rewards</a></li>' +
          '<li><a href="guarantee.html">NexDay Guarantee</a></li>' +
          '<li><a href="contact.html">Request a Quote</a></li>' +
        '</ul></div>' +
        '<div><h3>Company</h3><ul>' +
          '<li><a href="about.html">About Us</a></li>' +
          '<li><a href="contact.html">Contact Us</a></li>' +
          '<li><a href="guarantee.html">Shipping &amp; Returns</a></li>' +
          '<li><a href="about.html#sustainability">Sustainability</a></li>' +
          '<li><a href="contact.html">Careers</a></li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="footer__bottom">' +
        '<p>© ' + new Date().getFullYear() + ' NexDay Supply — design mock. Not the live store.</p>' +
        '<ul class="footer__legal">' +
          '<li><a href="#">Terms &amp; Conditions</a></li>' +
          '<li><a href="#">Privacy Policy</a></li>' +
          '<li><a href="#">Accessibility</a></li>' +
        '</ul>' +
      '</div>' +
    '</div></footer>';
  }

  /* ---------- Behaviour ---------- */
  function wireMega() {
    var btn = document.querySelector('.nav__link[aria-controls="mega"]');
    var mega = document.getElementById('mega');
    if (!btn || !mega) return;

    function close() {
      btn.setAttribute('aria-expanded', 'false');
      mega.hidden = true;
    }

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      mega.hidden = open;
    });

    document.addEventListener('click', function (e) {
      if (!mega.hidden && !mega.contains(e.target) && !btn.contains(e.target)) close();
    });

    // Following a link inside the menu leaves it open over the new content
    // wherever navigation does not reload the document.
    mega.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mega.hidden) { close(); btn.focus(); }
    });
  }

  function wireDrawer() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    // Same reason as the mega menu: close the drawer once a link is taken.
    nav.addEventListener('click', function (e) {
      if (!e.target.closest('a')) return;
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    });
  }

  function wireSearch() {
    var form = document.querySelector('.search');
    var input = document.getElementById('q');
    var panel = document.getElementById('search-results');
    if (!form || !input || !panel) return;

    var index = CAT.searchIndex();

    function render(term) {
      var q = term.trim().toLowerCase();
      if (q.length < 2) { panel.hidden = true; panel.innerHTML = ''; return; }

      var hits = index.filter(function (row) {
        return row.label.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 9);

      panel.innerHTML = hits.length
        ? hits.map(function (h) {
            return '<a href="' + h.href + '" role="option"><span>' + h.label +
              '</span><span class="kind">' + h.kind + '</span></a>';
          }).join('')
        : '<p class="search__empty">No categories match “' + term + '”. Try a product type, ' +
          'a brand or a SKU — or <a href="contact.html">ask our team</a>.</p>';
      panel.hidden = false;
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('focus', function () { render(input.value); });
    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) panel.hidden = true;
    });
    form.addEventListener('submit', function (e) {
      // Nothing behind this mock searches, so send the first match instead of 404ing.
      var first = panel.querySelector('a[role="option"]');
      if (first) { e.preventDefault(); location.href = first.getAttribute('href'); }
    });
  }

  function mount() {
    var head = document.querySelector('[data-layout="header"]');
    var foot = document.querySelector('[data-layout="footer"]');
    if (head) head.innerHTML = headerMarkup();
    if (foot) foot.innerHTML = footerMarkup();
    wireMega();
    wireDrawer();
    wireSearch();
  }

  window.NEXDAY_UI = { icon: icon, mount: mount };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
