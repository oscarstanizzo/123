/* PEAR — Ora. Vanilla, no dependencies.
   Every motion path here is gated on prefers-reduced-motion. */
(function () {
  'use strict';

  var calm = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- nav: solidify once we leave the hero's first screenful ---- */
  var nav = document.getElementById('nav');
  var stuck = false;
  function onScroll() {
    var want = window.scrollY > 40;
    if (want !== stuck) { stuck = want; nav.classList.toggle('is-stuck', want); }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  if (calm.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- figures count up ---------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var to = parseInt(el.dataset.count, 10);
    if (calm.matches) { el.textContent = to.toLocaleString('en-US'); return; }
    var t0 = performance.now(), dur = 1500;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      // ease-out quint: fast off the line, long settle — reads as mechanical
      var v = Math.round(to * (1 - Math.pow(1 - p, 5)));
      el.textContent = v.toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var ioC = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); ioC.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { ioC.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- finish switcher ------------------------------------------
     The whole device is drawn from CSS custom properties, so swapping a
     finish is one attribute on <html> — the SVG follows for free.        */
  var FINISH = {
    titan:     { name: 'Natural',   proc: 'Longitudinal brush, 320 grit', lead: '6 weeks' },
    champagne: { name: 'Champagne', proc: 'Type II anodise, 18 min bath', lead: '9 weeks' },
    verdigris: { name: 'Verdigris', proc: 'Type II anodise, 22 min bath', lead: '9 weeks' },
    onyx:      { name: 'Onyx',      proc: 'Bead-blast, 120 µm alumina',   lead: '7 weeks' }
  };
  var fName = document.getElementById('fName');
  var fProc = document.getElementById('fProc');
  var fLead = document.getElementById('fLead');
  var sws = document.querySelectorAll('.sw');

  function setFinish(key) {
    var f = FINISH[key];
    if (!f) return;
    document.documentElement.setAttribute('data-finish', key);
    fName.textContent = f.name;
    fProc.textContent = f.proc;
    fLead.textContent = f.lead;
    sws.forEach(function (b) {
      var on = b.dataset.finish === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  sws.forEach(function (b) {
    b.addEventListener('click', function () { setFinish(b.dataset.finish); });
    b.addEventListener('keydown', function (e) {
      // arrow keys walk the radio group, as a real radiogroup would
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' &&
          e.key !== 'ArrowDown'  && e.key !== 'ArrowUp') return;
      e.preventDefault();
      var list = Array.prototype.slice.call(sws);
      var step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      var next = list[(list.indexOf(b) + step + list.length) % list.length];
      next.focus(); setFinish(next.dataset.finish);
    });
  });
  setFinish('titan');

  /* ---------- hero: the devices lean toward the cursor ------------------
     Pointer-only. On touch the float animation carries it alone.        */
  var tilt = document.getElementById('tilt');
  var stage = document.getElementById('stage');
  if (tilt && stage && fine.matches && !calm.matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    stage.addEventListener('pointerleave', function () {
      tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop);
    });
    function loop() {
      cx += (tx - cx) * 0.075;
      cy += (ty - cy) * 0.075;
      tilt.style.transform =
        'rotateY(' + (cx * 9).toFixed(2) + 'deg) rotateX(' + (-cy * 6).toFixed(2) + 'deg)';
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001)
        ? requestAnimationFrame(loop) : 0;
    }
    // the transition is only wanted for the snap-back, not per-frame
    tilt.style.transition = 'none';
  }

  /* ---------- detail: light the panel nearest the middle of the screen -- */
  var panels = document.querySelectorAll('.panel');
  var detailDev = document.querySelector('.dev--detail');
  var POSE = [
    'rotate(0deg) scale(1)',
    'rotate(-6deg) scale(.94) translateX(-4%)',
    'rotate(5deg) scale(1.03)',
    'rotate(-2deg) scale(.97)'
  ];
  if (panels.length && !calm.matches) {
    var active = -1;
    var ioP = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.dataset.panel;
        if (i === active) return;
        active = i;
        panels.forEach(function (p, j) { p.classList.toggle('is-on', j === i); });
        if (detailDev) detailDev.style.transform = POSE[i] || POSE[0];
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    panels.forEach(function (p) { ioP.observe(p); });
    panels[0].classList.add('is-on');
  } else {
    panels.forEach(function (p) { p.classList.add('is-on'); });
  }

  /* ---------- booking form --------------------------------------------
     No endpoint is wired up — this is a design exercise, so the form
     validates and acknowledges rather than pretending to send.          */
  var book = document.getElementById('book');
  var note = document.getElementById('bookNote');
  if (book) {
    book.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = book.querySelector('#bn'), mail = book.querySelector('#be');
      if (!name.value.trim()) { name.focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value)) { mail.focus(); return; }
      note.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] +
        ' — this demo does not send. Wire a form endpoint to receive it.';
      note.classList.add('is-ok');
    });
  }
})();
