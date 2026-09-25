(function () {

  // Header: solid background once the page scrolls past the top.
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
    document.body.classList.toggle('show-fab', window.scrollY > window.innerHeight * 0.8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu.
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Reveal sections as they enter the viewport.
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings that come in together.
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 4) * 90 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Footer year.
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Contact form. Posts to data-endpoint when one is configured; otherwise
  // hands the request to the phone's messaging app, addressed to the business.
  var form = document.querySelector('.contact-form');
  var status = form.querySelector('.form-status');
  var PHONE = '+14163057444';

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'phone'].forEach(function (n) {
      var input = form.elements[n];
      var bad = !input.value.trim();
      input.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    var email = form.elements.email;
    if (email.value && !email.checkValidity()) { email.closest('.field').classList.add('is-invalid'); ok = false; }
    else email.closest('.field').classList.remove('is-invalid');
    if (!ok) { setStatus('Please add your name and a phone number so we can reach you.', true); return; }

    var data = new FormData(form);
    var endpoint = form.getAttribute('data-endpoint');

    if (endpoint) {
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      setStatus('Sending…');
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          setStatus('Thank you. We’ll be in touch shortly to arrange your consultation.');
        })
        .catch(function () {
          setStatus('Something went wrong sending your request. Please call us at (416) 305-7444.', true);
        })
        .then(function () { btn.disabled = false; });
      return;
    }

    var body = 'Hi Superb Pools & Spa, I’d like to book a consultation.\n' +
      'Name: ' + data.get('name') + '\n' +
      'Phone: ' + data.get('phone') + '\n' +
      (data.get('email') ? 'Email: ' + data.get('email') + '\n' : '') +
      'Interested in: ' + data.get('interest') + '\n' +
      (data.get('message') ? data.get('message') : '');
    setStatus('Opening your messages app. Prefer to talk? Call (416) 305-7444.');
    window.location.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent(body);
  });

  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field');
    if (f) f.classList.remove('is-invalid');
  });
})();
