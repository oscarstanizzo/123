/* PEAR — the shared scroll engine.
   One scroll listener and one rAF for the whole page: every frame reads the
   scroll position once, then writes to the elements that care. Reading layout
   per-element per-frame is what makes this kind of page stutter, so measured
   rects are cached and only recomputed on resize.

   Everything is opt-in through data attributes and every path is inert under
   prefers-reduced-motion, where elements resolve straight to their end state.

     .reveal            fade and rise once, on entry     (data-delay 1-4)
     data-split         split a heading into words that rise in sequence
     data-scrub         receive --p, 0 to 1, across the element's travel
     data-par="0.3"     drift vertically against the scroll
     data-rail          pin, and pull a horizontal track sideways
     data-count         count up to a number, once, on entry
     data-progress      scale to the page's total scroll progress
*/
export const calm = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- one loop, shared ---------------------------------------- */
const readers = [];   // fn(scrollY, vh) -> called every frame, may only read cache
let ticking = false;

function frame() {
  ticking = false;
  const y = window.scrollY, vh = window.innerHeight;
  for (const fn of readers) fn(y, vh);
}
function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

/* things that have to recompute when the layout changes rather than when the
   page merely scrolls — a rail's travel depends on its own track width */
const resizers = [];

/* Re-run every layout-dependent measurement. Needed after a resize, after late
   webfonts change heights, and after anything that reveals a region which was
   display:none when it was first measured. */
export function refresh() {
  for (const fn of resizers) fn();
  measure();
  request();
}

addEventListener('scroll', request, { passive: true });
addEventListener('resize', refresh, { passive: true });

/* ---------- measurement cache ---------------------------------------- */
const measured = [];  // { el, top, height, fn }
function measure() {
  for (const m of measured) {
    const r = m.el.getBoundingClientRect();
    m.top = r.top + window.scrollY;
    m.height = r.height;
  }
}
/* progress across an element's whole travel: 0 as its top edge reaches the
   bottom of the viewport, 1 as its bottom edge leaves the top */
function track(el, fn) {
  const m = { el, top: 0, height: 0 };
  measured.push(m);
  const r = el.getBoundingClientRect();
  m.top = r.top + window.scrollY; m.height = r.height;
  readers.push((y, vh) => {
    const span = m.height + vh;
    const p = span <= 0 ? 0 : (y + vh - m.top) / span;
    fn(p < 0 ? 0 : p > 1 ? 1 : p, m);
  });
}

/* ---------- reveal ---------------------------------------------------- */
function reveal(root) {
  const els = root.querySelectorAll('.reveal');
  if (calm.matches || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ---------- split headings into rising words -------------------------- */
function split(root) {
  const heads = root.querySelectorAll('[data-split]');
  if (!heads.length) return;

  for (const h of heads) {
    /* Stagger has to shrink as the line gets longer, or a pull-quote of two
       dozen words spends over a second finishing and reads as lag rather than
       craft. Short headings keep the full step; long ones compress to fit the
       same budget. */
    const words = (h.textContent.match(/\S+/g) || []).length;
    const step = Math.min(0.045, 0.62 / Math.max(1, words));

    /* walk child nodes so inline markup — a <br> inside a heading — survives
       instead of being flattened into the text */
    const out = [];
    let i = 0;
    for (const node of [...h.childNodes]) {
      if (node.nodeType !== 3) { out.push(node); continue; }
      for (const word of node.textContent.split(/(\s+)/)) {
        if (!word) continue;
        if (!word.trim()) { out.push(document.createTextNode(word)); continue; }
        const mask = document.createElement('span');
        mask.className = 'sw-m';
        const inner = document.createElement('span');
        inner.className = 'sw-i';
        inner.textContent = word;
        inner.style.transitionDelay = (i++ * step).toFixed(3) + 's';
        mask.appendChild(inner);
        out.push(mask);
      }
    }
    h.replaceChildren(...out);
    h.classList.add('is-split');
  }

  if (calm.matches || !('IntersectionObserver' in window)) {
    heads.forEach(h => h.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -15% 0px', threshold: 0.2 });
  heads.forEach(h => io.observe(h));
}

/* ---------- scrub, parallax ------------------------------------------- */
function scrub(root) {
  if (calm.matches) {
    root.querySelectorAll('[data-scrub]').forEach(el => el.style.setProperty('--p', '1'));
    return;
  }
  root.querySelectorAll('[data-scrub]').forEach(el =>
    track(el, p => el.style.setProperty('--p', p.toFixed(4))));

  root.querySelectorAll('[data-par]').forEach(el => {
    const k = parseFloat(el.dataset.par) || 0.2;
    track(el, (p, m) => {
      /* centred on the element so it drifts both ways rather than only down */
      el.style.setProperty('--par', ((p - 0.5) * k * m.height).toFixed(1) + 'px');
    });
  });
}

/* ---------- pinned horizontal rail ------------------------------------ */
function rails(root) {
  for (const sec of root.querySelectorAll('[data-rail]')) {
    const track_ = sec.querySelector('.rail__track');
    if (!track_) continue;

    /* the section is made tall enough that the sideways travel and the
       vertical scroll it consumes are the same distance */
    const size = () => {
      const over = Math.max(0, track_.scrollWidth - window.innerWidth);
      sec.style.setProperty('--rail-h', (over + window.innerHeight) + 'px');
      return over;
    };
    let over = size();
    resizers.push(() => { over = size(); });

    if (calm.matches) { sec.classList.add('is-static'); continue; }
    sec.classList.add('is-live');
    track(sec, p => {
      /* the pin only holds for the middle of the travel — the first and last
         half-viewport are the section arriving and leaving */
      const vh = window.innerHeight, span = sec.offsetHeight + vh;
      const t = (p * span - vh) / Math.max(1, sec.offsetHeight - vh);
      const c = t < 0 ? 0 : t > 1 ? 1 : t;
      track_.style.transform = 'translate3d(' + (-c * over).toFixed(1) + 'px,0,0)';
      sec.style.setProperty('--rail-p', c.toFixed(4));
    });
  }
}

/* ---------- counters --------------------------------------------------- */
function counters(root) {
  const els = root.querySelectorAll('[data-count]');
  const run = el => {
    const to = parseFloat(el.dataset.count);
    const dp = (el.dataset.count.split('.')[1] || '').length;
    const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    if (calm.matches) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1500;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      /* ease-out quint: quick off the line, long settle — reads as mechanical */
      el.textContent = fmt(+(to * (1 - Math.pow(1 - p, 5))).toFixed(dp));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      run(e.target); io.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  els.forEach(el => io.observe(el));
}

/* ---------- page scroll progress + nav state --------------------------- */
function chrome() {
  /* querySelectorAll rather than an id: a page has one nav, but the bundled
     preview stacks all three pages in one document and only shows one. An id
     lookup would find the first and leave the others inert. */
  const navs = document.querySelectorAll('.nav');
  const bars = document.querySelectorAll('[data-progress]');
  let stuck = false;
  const update = y => {
    const want = y > 40;
    if (want !== stuck) {
      stuck = want;
      navs.forEach(n => n.classList.toggle('is-stuck', want));
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (y / max).toFixed(4) : '0';
    bars.forEach(b => b.style.setProperty('--p', p));
  };
  readers.push(update);
  update(window.scrollY);
}

/* ---------- go --------------------------------------------------------- */
export function init(root = document) {
  reveal(root); split(root); scrub(root); rails(root); counters(root); chrome();
  refresh();
  /* late webfonts change heights, so re-measure once they settle */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  addEventListener('load', refresh);
}
