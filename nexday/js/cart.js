/* NexDay Supply — the order cart.
   Holds lines in memory, mirrors them to localStorage so a reload keeps the
   order, and renders a drawer. Storage is best-effort: a private window or
   blocked site data throws, and the cart still works for the session. */
(function () {
  'use strict';

  var KEY = 'nexday-order-v1';
  var FREE_FREIGHT = 500;

  var lines = load();
  var drawer, backdrop;

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(raw) ? raw.filter(function (l) {
        return l && l.sku && typeof l.price === 'number' && l.qty > 0;
      }) : [];
    } catch (e) { return []; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* session-only */ }
  }

  function money(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function count() {
    return lines.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function subtotal() {
    return lines.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
  }

  function find(sku) {
    for (var i = 0; i < lines.length; i++) if (lines[i].sku === sku) return lines[i];
    return null;
  }

  function add(line) {
    var existing = find(line.sku);
    if (existing) existing.qty += 1;
    else lines.push({ sku: line.sku, name: line.name, pack: line.pack, price: line.price, qty: 1 });
    save();
    render();
  }

  function setQty(sku, qty) {
    var l = find(sku);
    if (!l) return;
    l.qty = Math.max(0, qty);
    if (!l.qty) lines = lines.filter(function (x) { return x.sku !== sku; });
    save();
    render();
  }

  /* ---------- Drawer ---------- */
  function mount() {
    if (document.querySelector('[data-cart-drawer]')) return;

    backdrop = document.createElement('div');
    backdrop.className = 'cart-backdrop';
    backdrop.hidden = true;
    backdrop.setAttribute('data-cart-close', '');

    drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.setAttribute('data-cart-drawer', '');
    drawer.setAttribute('aria-label', 'Your order');
    drawer.hidden = true;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    render();
  }

  function renderDrawer() {
    if (!drawer) return;
    var sub = subtotal();
    var short = FREE_FREIGHT - sub;

    var body = lines.length
      ? '<ul class="cart-lines">' + lines.map(function (l) {
          return '<li class="cart-line">' +
            '<div class="cart-line__main">' +
              '<p class="cart-line__name">' + esc(l.name) + '</p>' +
              '<p class="cart-line__meta">' + esc(l.sku) + ' · ' + esc(l.pack) + '</p>' +
            '</div>' +
            '<div class="cart-line__right">' +
              '<p class="cart-line__total">' + money(l.price * l.qty) + '</p>' +
              '<div class="qty">' +
                '<button type="button" data-qty="-1" data-sku="' + esc(l.sku) + '" aria-label="Decrease quantity">−</button>' +
                '<span>' + l.qty + '</span>' +
                '<button type="button" data-qty="1" data-sku="' + esc(l.sku) + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<button class="cart-line__remove" type="button" data-remove="' + esc(l.sku) + '">Remove</button>' +
            '</div>' +
          '</li>';
        }).join('') + '</ul>'
      : '<div class="cart-empty">' +
          '<p><b>Your order is empty.</b></p>' +
          '<p>Add items from any department and they will collect here.</p>' +
          '<p><a class="btn btn--sm" href="products.html" data-cart-close>Browse products</a></p>' +
        '</div>';

    var freight = lines.length
      ? (short > 0
          ? '<p class="cart-freight">Add <b>' + money(short) + '</b> for free freight.' +
            '<span class="cart-freight__bar"><span style="width:' +
            Math.min(100, (sub / FREE_FREIGHT) * 100).toFixed(1) + '%"></span></span></p>'
          : '<p class="cart-freight cart-freight--met">✓ Qualifies for free freight.</p>')
      : '';

    drawer.innerHTML =
      '<header class="cart-head">' +
        '<h2>Your order</h2>' +
        '<button class="cart-close" type="button" data-cart-close aria-label="Close order">✕</button>' +
      '</header>' +
      freight +
      '<div class="cart-body">' + body + '</div>' +
      (lines.length
        ? '<footer class="cart-foot">' +
            '<p class="cart-sub"><span>Subtotal</span><b>' + money(sub) + '</b></p>' +
            '<p class="cart-note">Taxes and freight calculated at checkout.</p>' +
            '<a class="btn btn--amber btn--block" href="checkout.html" data-cart-close>Proceed to checkout</a>' +
            '<a class="btn btn--ghost btn--block" href="checkout.html?mode=quote" data-cart-close>' +
              'Request a quote / submit a PO</a>' +
            '<button class="cart-keep" type="button" data-cart-close>Keep shopping</button>' +
          '</footer>'
        : '');
  }

  function render() {
    var badge = document.querySelector('.tool__count');
    if (badge) {
      var n = count();
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.hidden = n === 0;
    }
    renderDrawer();
  }

  function open() {
    if (!drawer) return;
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    var close = drawer.querySelector('[data-cart-close]');
    if (close) close.focus();
  }

  function close() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    backdrop.hidden = true;
    drawer.hidden = true;
  }

  /* ---------- Wiring ----------
     Delegated, because product grids re-render under it constantly. */
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      add({
        sku: addBtn.getAttribute('data-sku'),
        name: addBtn.getAttribute('data-name'),
        pack: addBtn.getAttribute('data-pack'),
        price: parseFloat(addBtn.getAttribute('data-price'))
      });
      var label = addBtn.getAttribute('data-label') || addBtn.textContent;
      addBtn.setAttribute('data-label', label);
      addBtn.textContent = 'Added ✓';
      addBtn.classList.add('is-added');
      clearTimeout(addBtn._t);
      addBtn._t = setTimeout(function () {
        addBtn.textContent = label;
        addBtn.classList.remove('is-added');
      }, 1400);
      return;
    }

    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); open(); return; }
    if (e.target.closest('[data-cart-close]')) {
      // Links inside the drawer should still navigate; just shut the panel.
      close();
      return;
    }

    var qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      var line = find(qtyBtn.getAttribute('data-sku'));
      if (line) setQty(line.sku, line.qty + parseInt(qtyBtn.getAttribute('data-qty'), 10));
      return;
    }

    var rm = e.target.closest('[data-remove]');
    if (rm) setQty(rm.getAttribute('data-remove'), 0);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && !drawer.hidden) close();
  });

  function clear() { lines = []; save(); render(); }

  window.NEXDAY_CART = {
    add: add, count: count, open: open, close: close, render: render,
    lines: function () { return lines.slice(); },
    subtotal: subtotal,
    clear: clear,
    FREE_FREIGHT: FREE_FREIGHT,
    money: money,
    esc: esc
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
