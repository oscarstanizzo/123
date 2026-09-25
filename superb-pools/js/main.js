(function () {
  'use strict';

  // Soft fade-in for the design cards. Gated on .js-reveal so a failed script
  // never leaves them invisible.
  var items = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (items.length && !reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(i, 3) * 80 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Contact form. Posts to data-endpoint when one is configured; otherwise
  // hands the request to the phone's messaging app, addressed to the business.
  var form = document.querySelector('.form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var PHONE = '+14163057444';

  function setStatus(msg, isError) {
    status.hidden = !msg;
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  function markInvalid(input, bad) {
    input.closest('.field').classList.toggle('is-invalid', bad);
    if (bad) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  form.addEventListener('input', function (e) {
    if (e.target.matches('input:not([type="checkbox"]), textarea')) markInvalid(e.target, false);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var missing = ['name', 'phone'].filter(function (n) {
      var input = form.elements[n];
      var bad = !input.value.trim();
      markInvalid(input, bad);
      return bad;
    });
    var email = form.elements.email;
    var badEmail = !!email.value && !email.checkValidity();
    markInvalid(email, badEmail);

    if (missing.length || badEmail) {
      setStatus(missing.length
        ? 'Please add your name and a phone number so we can reach you.'
        : 'That email address doesn’t look right.', true);
      form.elements[missing[0] || 'email'].focus();
      return;
    }

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
          setStatus('Thank you. We’ll be in touch shortly to set up your consultation.');
        })
        .catch(function () {
          setStatus('Something went wrong sending your request. Please call us at (416) 305-7444.', true);
        })
        .then(function () { btn.disabled = false; });
      return;
    }

    var interests = data.getAll('interest');
    var lines = [
      'Hi Superb Pools & Spa, I’d like to book a consultation.',
      'Name: ' + data.get('name'),
      'Phone: ' + data.get('phone')
    ];
    if (data.get('email')) lines.push('Email: ' + data.get('email'));
    if (data.get('city')) lines.push('Location: ' + data.get('city'));
    if (interests.length) lines.push('Interested in: ' + interests.join(', '));
    if (data.get('message')) lines.push(data.get('message'));

    setStatus('Opening your messages app. Prefer to talk? Call (416) 305-7444.');
    window.location.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent(lines.join('\n'));
  });
})();
