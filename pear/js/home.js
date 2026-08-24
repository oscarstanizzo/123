/* PEAR — the Ora product page. Shared scroll behaviour lives in scroll.js;
   this file is only what is specific to this page. */
import { init, calm } from './scroll.js';

init();

const fine = matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- finish switcher ------------------------------------------
   The device is drawn from custom properties, so a finish is one attribute
   on <html> — every instance on the page, including the <use> clones,
   follows without being touched.                                        */
const FINISH = {
  titan:     { name: 'Natural',   proc: 'Longitudinal brush, 320 grit', lead: '6 weeks' },
  champagne: { name: 'Champagne', proc: 'Type II anodise, 18 min bath', lead: '9 weeks' },
  verdigris: { name: 'Verdigris', proc: 'Type II anodise, 22 min bath', lead: '9 weeks' },
  onyx:      { name: 'Onyx',      proc: 'Bead-blast, 120 µm alumina',   lead: '7 weeks' }
};
const sws = document.querySelectorAll('.sw');
const fName = document.getElementById('fName');
const fProc = document.getElementById('fProc');
const fLead = document.getElementById('fLead');

function setFinish(key) {
  const f = FINISH[key];
  if (!f) return;
  document.documentElement.setAttribute('data-finish', key);
  fName.textContent = f.name; fProc.textContent = f.proc; fLead.textContent = f.lead;
  sws.forEach(b => {
    const on = b.dataset.finish === key;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}
sws.forEach(b => {
  b.addEventListener('click', () => setFinish(b.dataset.finish));
  b.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const list = [...sws];
    const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    const next = list[(list.indexOf(b) + step + list.length) % list.length];
    next.focus(); setFinish(next.dataset.finish);
  });
});
if (sws.length) setFinish('titan');

/* ---------- the hero devices lean toward the cursor -------------------- */
const tilt = document.getElementById('tilt');
const stage = document.getElementById('stage');
if (tilt && stage && fine.matches && !calm.matches) {
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.075;
    cy += (ty - cy) * 0.075;
    tilt.style.transform =
      `rotateY(${(cx * 9).toFixed(2)}deg) rotateX(${(-cy * 6).toFixed(2)}deg)`;
    raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001)
      ? requestAnimationFrame(loop) : 0;
  };
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  stage.addEventListener('pointerleave', () => {
    tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop);
  });
  tilt.style.transition = 'none';   // wanted for the snap-back only, not per frame
}

/* ---------- detail: light the panel nearest the middle of the screen ---- */
const panels = document.querySelectorAll('.panel');
const detailDev = document.querySelector('.dev--detail');
const POSE = [
  'rotate(0deg) scale(1)',
  'rotate(-6deg) scale(.94) translateX(-4%)',
  'rotate(5deg) scale(1.03)',
  'rotate(-2deg) scale(.97)'
];
if (panels.length && !calm.matches) {
  let active = -1;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = +e.target.dataset.panel;
      if (i === active) continue;
      active = i;
      panels.forEach((p, j) => p.classList.toggle('is-on', j === i));
      if (detailDev) detailDev.style.transform = POSE[i] || POSE[0];
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  panels.forEach(p => io.observe(p));
  panels[0].classList.add('is-on');
} else {
  panels.forEach(p => p.classList.add('is-on'));
}

/* ---------- booking form ----------------------------------------------
   No endpoint is wired up — this is a design exercise, so the form
   validates and acknowledges rather than pretending to send.            */
const book = document.getElementById('book');
const note = document.getElementById('bookNote');
if (book) {
  book.addEventListener('submit', e => {
    e.preventDefault();
    const name = book.querySelector('#bn'), mail = book.querySelector('#be');
    if (!name.value.trim()) { name.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value)) { mail.focus(); return; }
    note.textContent = `Thank you, ${name.value.trim().split(' ')[0]} — this demo does not send. ` +
      'Wire a form endpoint to receive it.';
    note.classList.add('is-ok');
  });
}
