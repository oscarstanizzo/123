// Measures LCP / FCP / CLS and total transfer under Lighthouse's mobile
// Slow 4G profile (1.6 Mbps down, 150 ms RTT, 4x CPU slowdown).
// Usage: node scripts/measure-perf.mjs [viewportWidth]
import { chromium } from 'playwright';
import { serve, CHROMIUM } from './lib/serve.mjs';

const WIDTH = Number(process.argv[2] || 390);
const PORT = 8094;
const { origin, close } = await serve(PORT);

const browser = await chromium.launch({ executablePath: CHROMIUM });
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

const transfer = [];
const T0 = Date.now();
page.on('request', (r) => {
  transfer.push({ url: r.url().replace(origin, ''), start: Date.now() - T0, end: null, len: 0 });
});
page.on('response', (r) => {
  const url = r.url().replace(origin, '');
  const rec = transfer.find((x) => x.url === url && x.end === null);
  if (rec) {
    rec.end = Date.now() - T0;
    rec.len = Number(r.headers()['content-length'] || 0);
  }
});

// LCP entries are not retained in the performance timeline, so collect them.
await page.addInitScript(() => {
  window.__cls = 0;
  window.__lcp = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__lcp.push({ t: Math.round(e.startTime), tag: e.element ? e.element.tagName : '?', url: e.url || '' });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});

await page.goto(origin + '/', { waitUntil: 'load', timeout: 120000 });
await page.waitForLoadState('networkidle', { timeout: 120000 });
await page.waitForTimeout(1500);

const m = await page.evaluate(() => {
  const lcps = window.__lcp || [];
  const last = lcps[lcps.length - 1];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    lcp: last ? last.t : null,
    lcpTag: last ? last.tag : '(none)',
    lcpUrl: last ? last.url : '',
    candidates: lcps.map((e) => e.t + 'ms ' + e.tag),
    fcp: fcp ? Math.round(fcp.startTime) : null,
    cls: +(window.__cls || 0).toFixed(4),
  };
});

const pass = (ok) => (ok ? 'PASS' : 'FAIL');
console.log(`--- Slow 4G (1.6 Mbps, 150 ms RTT), 4x CPU, ${WIDTH}px mobile ---`);
console.log('  FCP :', m.fcp, 'ms');
console.log('  LCP :', m.lcp, 'ms  ', pass(m.lcp !== null && m.lcp < 2500), '(budget < 2500)');
console.log('  LCP element:', m.lcpTag, m.lcpUrl.replace(origin, ''));
console.log('  CLS :', m.cls, '  ', pass(m.cls < 0.1), '(budget < 0.1)');
console.log('  candidates:', m.candidates.join(' -> '));

const total = transfer.reduce((a, x) => a + x.len, 0);
console.log('\n--- transfer (start -> response headers, ms) ---');
transfer
  .filter((x) => x.len > 0)
  .sort((a, b) => a.start - b.start)
  .forEach((x) =>
    console.log('  ' + (x.len / 1024).toFixed(1).padStart(8) + ' KB  ' + String(x.start).padStart(5) + ' -> ' + String(x.end).padStart(5) + '  ' + x.url)
  );
console.log(
  '  ' + (total / 1024).toFixed(1).padStart(8) + ' KB  TOTAL (' + transfer.length + ' requests)  ',
  pass(total < 1024 * 1024),
  '(budget < 1024 KB)'
);

await browser.close();
close();
if (m.lcp === null || m.lcp >= 2500 || m.cls >= 0.1 || total >= 1024 * 1024) process.exit(1);
