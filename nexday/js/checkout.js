/* NexDay Supply — checkout.
   Two ways to finish an order, because a distributor serves both: pay now by
   card, or place it against a Net-30 account with a PO number and let sales
   invoice it. The steps are shared; only the payment step differs.

   Card fields are inert demo fields. Nothing here takes a real payment — that
   needs a payment provider and a server, neither of which a static mock has. */
(function () {
  'use strict';

  var CART = window.NEXDAY_CART;

  /* Combined federal + provincial rate, as a business would quote it.
     Illustrative — a real store gets these from a tax service. */
  var TAX = {
    AB: 0.05, BC: 0.12, MB: 0.12, NB: 0.15, NL: 0.15, NS: 0.14,
    NT: 0.05, NU: 0.05, ON: 0.13, PE: 0.15, QC: 0.14975, SK: 0.11, YT: 0.05
  };
  var PROVINCES = [
    ['ON', 'Ontario'], ['QC', 'Quebec'], ['BC', 'British Columbia'],
    ['AB', 'Alberta'], ['MB', 'Manitoba'], ['SK', 'Saskatchewan'],
    ['NS', 'Nova Scotia'], ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'],
    ['PE', 'Prince Edward Island'], ['NT', 'Northwest Territories'],
    ['NU', 'Nunavut'], ['YT', 'Yukon']
  ];

  var DELIVERY = {
    standard: { label: 'Standard — next business day', note: 'Ships today if ordered by 4:00 PM ET', fee: 19.95 },
    saturday: { label: 'Saturday delivery', note: 'Where the carrier offers it', fee: 49.95 },
    pickup:   { label: 'Pick up at a distribution centre', note: 'Ready in 2 hours, no freight charge', fee: 0 }
  };

  var money = CART.money;
  var esc = CART.esc;

  var state = {
    step: 1,
    mode: 'card',
    delivery: 'standard',
    values: {},
    errors: {},
    placed: null
  };

  /* ---------- Totals ---------- */
  function totals() {
    var sub = CART.subtotal();
    var d = DELIVERY[state.delivery];
    var freight = (state.delivery === 'standard' && sub >= CART.FREE_FREIGHT) ? 0 : d.fee;
    var rate = TAX[state.values.province] != null ? TAX[state.values.province] : TAX.ON;
    var tax = (sub + freight) * rate;
    return { sub: sub, freight: freight, rate: rate, tax: tax, total: sub + freight + tax };
  }

  /* ---------- Validation ---------- */
  var REQUIRED = {
    1: ['firstName', 'lastName', 'company', 'email', 'phone', 'address', 'city', 'province', 'postal'],
    2: [],
    3: []
  };

  function validate(step) {
    var errs = {};
    (REQUIRED[step] || []).forEach(function (name) {
      if (!String(state.values[name] || '').trim()) errs[name] = 'Required';
    });
    if (step === 1) {
      var email = String(state.values.email || '').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.email = 'Enter a valid email address';
      var postal = String(state.values.postal || '').trim();
      if (postal && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postal)) errs.postal = 'Use the format A1A 1A1';
    }
    if (step === 3 && state.mode === 'po') {
      if (!String(state.values.poNumber || '').trim()) errs.poNumber = 'Required for a purchase order';
    }
    state.errors = errs;
    return !Object.keys(errs).length;
  }

  /* ---------- Field helpers ---------- */
  function field(name, label, opts) {
    opts = opts || {};
    var err = state.errors[name];
    var val = esc(state.values[name] || '');
    var input;
    if (opts.type === 'select') {
      input = '<select id="co-' + name + '" name="' + name + '" data-field>' +
        '<option value="">Choose…</option>' +
        opts.options.map(function (o) {
          return '<option value="' + o[0] + '"' + (state.values[name] === o[0] ? ' selected' : '') +
            '>' + o[1] + '</option>';
        }).join('') + '</select>';
    } else if (opts.type === 'textarea') {
      input = '<textarea id="co-' + name + '" name="' + name + '" data-field rows="3" placeholder="' +
        esc(opts.placeholder || '') + '">' + val + '</textarea>';
    } else {
      input = '<input id="co-' + name + '" name="' + name + '" data-field type="' + (opts.type || 'text') +
        '" value="' + val + '"' +
        (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') +
        (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') +
        (opts.readonly ? ' readonly' : '') + '>';
    }
    return '<p class="field' + (err ? ' field--error' : '') + '">' +
      '<label for="co-' + name + '">' + label + (opts.optional ? ' <span>(optional)</span>' : '') + '</label>' +
      input +
      (err ? '<span class="field__err">' + err + '</span>' : '') +
    '</p>';
  }

  function stepHead(n, title, summary) {
    var done = state.step > n;
    return '<div class="co-step__head">' +
      '<h2><span class="co-step__n">' + (done ? '✓' : n) + '</span>' + title + '</h2>' +
      (done ? '<button class="co-edit" type="button" data-goto="' + n + '">Edit</button>' : '') +
    '</div>' + (done && summary ? '<p class="co-step__summary">' + summary + '</p>' : '');
  }

  /* ---------- Steps ---------- */
  function step1() {
    var v = state.values;
    var summary = esc([v.firstName + ' ' + v.lastName, v.company, v.address,
      [v.city, v.province, v.postal].filter(Boolean).join(' ')].filter(Boolean).join(' · '));
    var body = state.step === 1
      ? '<div class="co-grid">' +
          field('firstName', 'First name', { autocomplete: 'given-name' }) +
          field('lastName', 'Last name', { autocomplete: 'family-name' }) +
        '</div>' +
        field('company', 'Business name', { autocomplete: 'organization' }) +
        '<div class="co-grid">' +
          field('email', 'Work email', { type: 'email', autocomplete: 'email' }) +
          field('phone', 'Phone', { type: 'tel', autocomplete: 'tel' }) +
        '</div>' +
        field('address', 'Street address', { autocomplete: 'street-address' }) +
        field('address2', 'Unit, suite or dock', { optional: true }) +
        '<div class="co-grid co-grid--3">' +
          field('city', 'City', { autocomplete: 'address-level2' }) +
          field('province', 'Province', { type: 'select', options: PROVINCES }) +
          field('postal', 'Postal code', { placeholder: 'A1A 1A1', autocomplete: 'postal-code' }) +
        '</div>' +
        '<p class="co-actions"><button class="btn btn--amber" type="button" data-next>Continue to delivery</button></p>'
      : '';
    return '<section class="co-step' + (state.step === 1 ? ' is-active' : '') + '">' +
      stepHead(1, 'Contact &amp; delivery address', summary) + body + '</section>';
  }

  function step2() {
    var body = state.step === 2
      ? Object.keys(DELIVERY).map(function (key) {
          var d = DELIVERY[key];
          var sub = CART.subtotal();
          var free = key === 'standard' && sub >= CART.FREE_FREIGHT;
          return '<label class="co-option' + (state.delivery === key ? ' is-on' : '') + '">' +
            '<input type="radio" name="delivery" value="' + key + '" data-delivery' +
              (state.delivery === key ? ' checked' : '') + '>' +
            '<span class="co-option__text"><b>' + d.label + '</b><span>' + d.note + '</span></span>' +
            '<span class="co-option__price">' + (free ? 'Free' : d.fee ? money(d.fee) : 'Free') + '</span>' +
          '</label>';
        }).join('') +
        field('instructions', 'Delivery instructions', { type: 'textarea', optional: true,
          placeholder: 'Dock hours, appointment requirements, where to leave the skid…' }) +
        '<p class="co-actions">' +
          '<button class="btn btn--amber" type="button" data-next>Continue to payment</button>' +
          '<button class="btn btn--ghost" type="button" data-goto="1">Back</button>' +
        '</p>'
      : '';
    return '<section class="co-step' + (state.step === 2 ? ' is-active' : '') + '">' +
      stepHead(2, 'Delivery', DELIVERY[state.delivery].label) + body + '</section>';
  }

  function step3() {
    if (state.step !== 3) {
      return '<section class="co-step">' +
        stepHead(3, 'Payment', state.mode === 'card' ? 'Credit card' : 'Net-30 account · PO ' +
          esc(state.values.poNumber || '')) + '</section>';
    }

    var card =
      '<div class="co-demo">Demo fields — this mock cannot take a real payment. ' +
      'Do not enter real card details.</div>' +
      field('cardName', 'Name on card', { readonly: true }) +
      '<div class="co-grid co-grid--3">' +
        field('cardNumber', 'Card number', { readonly: true }) +
        field('cardExp', 'Expiry', { readonly: true }) +
        field('cardCvc', 'CVC', { readonly: true }) +
      '</div>';

    var po =
      '<p class="co-hint">Your order is placed against your account and invoiced on Net-30 terms. ' +
      'Sales confirms contract pricing and freight before it ships.</p>' +
      '<div class="co-grid">' +
        field('poNumber', 'Purchase order number') +
        field('costCentre', 'Cost centre', { optional: true }) +
      '</div>' +
      field('accountNumber', 'Account number', { optional: true, placeholder: 'Leave blank if you are opening a new account' });

    return '<section class="co-step is-active">' +
      stepHead(3, 'Payment') +
      '<div class="co-modes">' +
        '<label class="co-option' + (state.mode === 'card' ? ' is-on' : '') + '">' +
          '<input type="radio" name="mode" value="card" data-mode' + (state.mode === 'card' ? ' checked' : '') + '>' +
          '<span class="co-option__text"><b>Pay now by card</b><span>Visa, Mastercard or Amex</span></span>' +
        '</label>' +
        '<label class="co-option' + (state.mode === 'po' ? ' is-on' : '') + '">' +
          '<input type="radio" name="mode" value="po" data-mode' + (state.mode === 'po' ? ' checked' : '') + '>' +
          '<span class="co-option__text"><b>Net-30 account or PO</b><span>Invoice my account after it ships</span></span>' +
        '</label>' +
      '</div>' +
      (state.mode === 'card' ? card : po) +
      '<p class="co-actions">' +
        '<button class="btn btn--amber" type="button" data-place>' +
          (state.mode === 'card' ? 'Place order' : 'Submit order for invoicing') + '</button>' +
        '<button class="btn btn--ghost" type="button" data-goto="2">Back</button>' +
      '</p>' +
    '</section>';
  }

  /* ---------- Summary ---------- */
  function summary() {
    var t = totals();
    var lines = CART.lines();
    return '<aside class="co-summary">' +
      '<h2>Order summary</h2>' +
      '<ul class="co-lines">' + lines.map(function (l) {
        return '<li><span class="co-lines__q">' + l.qty + '×</span>' +
          '<span class="co-lines__n">' + esc(l.name) + '<span>' + esc(l.pack) + '</span></span>' +
          '<span class="co-lines__t">' + money(l.price * l.qty) + '</span></li>';
      }).join('') + '</ul>' +
      '<dl class="co-totals">' +
        '<div><dt>Subtotal</dt><dd>' + money(t.sub) + '</dd></div>' +
        '<div><dt>Freight</dt><dd>' + (t.freight ? money(t.freight) : 'Free') + '</dd></div>' +
        '<div><dt>Tax (' + (t.rate * 100).toFixed(t.rate === 0.14975 ? 3 : 0) + '%)</dt><dd>' + money(t.tax) + '</dd></div>' +
        '<div class="co-totals__grand"><dt>Total</dt><dd>' + money(t.total) + '</dd></div>' +
      '</dl>' +
      '<p class="co-summary__note">Tax rates are illustrative. ' +
        (state.mode === 'po' ? 'Final pricing is confirmed on your invoice.' : '') + '</p>' +
    '</aside>';
  }

  /* ---------- Confirmation ---------- */
  function confirmation() {
    var o = state.placed;
    return '<div class="co-done">' +
      '<p class="co-done__tick">✓</p>' +
      '<h1>' + (o.mode === 'card' ? 'Order placed' : 'Order submitted for invoicing') + '</h1>' +
      '<p class="co-done__num">Order <b>' + o.number + '</b></p>' +
      '<p class="co-done__lede">' + (o.mode === 'card'
        ? 'A confirmation is on its way to ' + esc(o.email) + '. Guaranteed items ordered before 4:00 PM ET ship today.'
        : 'Sales will confirm contract pricing and freight against PO ' + esc(o.po) +
          ', then release it. A copy is on its way to ' + esc(o.email) + '.') + '</p>' +
      '<dl class="facts co-done__facts">' +
        '<div><dt>Ship to</dt><dd>' + esc(o.shipTo) + '</dd></div>' +
        '<div><dt>Delivery</dt><dd>' + esc(o.delivery) + '</dd></div>' +
        '<div><dt>Items</dt><dd>' + o.items + '</dd></div>' +
        '<div><dt>Total</dt><dd>' + money(o.total) + '</dd></div>' +
      '</dl>' +
      '<p class="co-actions"><a class="btn" href="products.html">Keep shopping</a>' +
        '<a class="btn btn--ghost" href="index.html">Back to home</a></p>' +
      '<p class="co-demo co-demo--flat">This is a design mock. No order was placed, nothing was ' +
        'charged, and no email was sent.</p>' +
    '</div>';
  }

  /* ---------- Render ---------- */
  function render() {
    var host = document.querySelector('[data-render="checkout"]');
    if (!host) return;

    if (state.placed) { host.innerHTML = confirmation(); return; }

    if (!CART.lines().length) {
      host.innerHTML = '<div class="co-done">' +
        '<h1>Your order is empty</h1>' +
        '<p class="co-done__lede">Add items from any department and they will collect here, ready to check out.</p>' +
        '<p class="co-actions"><a class="btn btn--amber" href="products.html">Browse products</a></p>' +
      '</div>';
      return;
    }

    host.innerHTML = '<div class="co-layout"><div class="co-steps">' +
      step1() + step2() + step3() +
    '</div>' + summary() + '</div>';
  }

  /* ---------- Events ---------- */
  function readFields() {
    document.querySelectorAll('[data-field]').forEach(function (el) {
      state.values[el.name] = el.value;
    });
  }

  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-field]')) state.values[e.target.name] = e.target.value;
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-delivery]')) { state.delivery = e.target.value; render(); }
    if (e.target.matches('[data-mode]')) {
      readFields();
      state.mode = e.target.value;
      state.errors = {};
      render();
    }
    if (e.target.matches('[data-field]')) {
      state.values[e.target.name] = e.target.value;
      if (e.target.name === 'province') render();
    }
  });

  document.addEventListener('click', function (e) {
    var next = e.target.closest('[data-next]');
    if (next) {
      readFields();
      if (validate(state.step)) state.step += 1;
      render();
      var firstErr = document.querySelector('.field--error input, .field--error select');
      if (firstErr) firstErr.focus();
      return;
    }

    var goto = e.target.closest('[data-goto]');
    if (goto) {
      readFields();
      state.step = parseInt(goto.getAttribute('data-goto'), 10);
      state.errors = {};
      render();
      return;
    }

    if (e.target.closest('[data-place]')) {
      readFields();
      if (!validate(3)) { render(); return; }
      var t = totals();
      var v = state.values;
      state.placed = {
        number: 'SO-' + new Date().getFullYear() + '-' + String(Math.floor(100000 + Math.random() * 899999)),
        mode: state.mode,
        email: v.email,
        po: v.poNumber,
        shipTo: [v.company, v.city, v.province].filter(Boolean).join(', '),
        delivery: DELIVERY[state.delivery].label,
        items: CART.lines().reduce(function (n, l) { return n + l.qty; }, 0),
        total: t.total
      };
      CART.clear();
      render();
      window.scrollTo(0, 0);
    }
  });

  function start() {
    // ?mode=quote lands straight on the invoicing path, from the cart drawer.
    var q = new URLSearchParams(window.__NEXDAY_QUERY || location.search);
    if (q.get('mode') === 'quote') state.mode = 'po';
    state.placed = null;
    state.step = 1;
    render();
  }

  if (window.NEXDAY_PAGES && window.NEXDAY_PAGES.register) {
    window.NEXDAY_PAGES.register('checkout', start);
  }

  if (document.body && document.body.getAttribute('data-page') === 'checkout') start();
})();
