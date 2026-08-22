/* Submits the quote form to Formspree over fetch so the confirmation shows
   in place. With JS off the form posts normally and Formspree handles it. */
(function () {
  'use strict';

  var form = document.querySelector('.form');
  if (!form || !window.fetch) return;

  var status = form.querySelector('[data-form-status]');
  var button = form.querySelector('button[type="submit"]');
  if (!status) return;

  function say(text, ok) {
    status.textContent = text;
    status.hidden = false;
    status.classList.toggle('is-error', !ok);
  }

  form.addEventListener('submit', function (e) {
    // Not configured yet — let the browser do its thing rather than fake a success.
    if (form.action.indexOf('FORMSPREE_ENDPOINT_HERE') !== -1) return;

    e.preventDefault();
    var label = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        say("Request sent. We'll get back to you within two business days.", true);
      })
      .catch(function () {
        say('That didn’t send. Call or text 437-922-8301 and we’ll sort it out.', false);
      })
      .then(function () {
        if (button) {
          button.disabled = false;
          button.textContent = label;
        }
      });
  });
})();
