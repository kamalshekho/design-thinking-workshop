import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT = '/tmp/resp102/shots';
mkdirSync(OUT, { recursive: true });
const WIDTHS = [360, 768, 1024, 1440];
const HEIGHT = { 360: 780, 768: 1024, 1024: 768, 1440: 900 };
const MASK_NAME = process.env.MASK_NAME || '';
const exe = process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const b = await chromium.launch({ executablePath: exe });
const report = [];

async function mask(p) {
  await p.evaluate((name) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const re = /[\w.+-]+@(?!example\.org|ichbinhier\.online)[\w-]+(\.[\w-]+)+/g;
    let n;
    while ((n = w.nextNode())) {
      let t = n.nodeValue.replace(re, 'alex.beispiel@example.org');
      if (name) t = t.split(name).join('Alex Beispiel');
      if (name && t.trim() === name.split(/\s+/).map((w) => w[0]).join('').toUpperCase()) t = 'AB';
      if (t !== n.nodeValue) n.nodeValue = t;
    }
    for (const el of document.querySelectorAll('input, textarea')) {
      if (/@(?!example\.org|ichbinhier\.online)/.test(el.value)) el.value = 'alex.beispiel@example.org';
    }
  }, MASK_NAME);
}

async function measure(p, width) {
  return p.evaluate((width) => {
    const vw = window.innerWidth;
    const de = document.documentElement;
    const visible = (el) => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const clippedByAncestor = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox !== 'visible') {
          const r = a.getBoundingClientRect();
          if (r.right <= vw + 1) return true;
        }
      }
      return false;
    };
    const desc = (el) => {
      const id = el.id ? '#' + el.id : '';
      const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      const txt = (el.getAttribute('aria-label') || el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${id}${cls} "${txt}"`;
    };
    const all = [...document.body.querySelectorAll('*')].filter(visible);
    const off = all.filter((el) => {
      const r = el.getBoundingClientRect();
      return (r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el);
    });
    const top = off.filter((el) => !off.includes(el.parentElement));
    const scrollers = all.filter((el) => {
      const ox = getComputedStyle(el).overflowX;
      return (ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 1;
    });
    const truncated = all.filter((el) => {
      const s = getComputedStyle(el);
      return s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
    });
    const smallTargets = all.filter((el) => {
      if (!el.matches('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox]')) return false;
      const r = el.getBoundingClientRect();
      return (r.width < 24 || r.height < 24) && !el.closest('[aria-hidden=true]');
    });
    return {
      vw, docScrollWidth: de.scrollWidth, pageOverflow: de.scrollWidth > vw + 1,
      offenders: top.slice(0, 8).map((el) => { const r = el.getBoundingClientRect(); return `${desc(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`; }),
      scrollers: scrollers.slice(0, 5).map((el) => `${desc(el)} ${el.clientWidth}/${el.scrollWidth}`),
      truncated: truncated.length,
      truncatedSample: truncated.slice(0, 5).map(desc),
      smallTargets: smallTargets.length,
      smallTargetSample: smallTargets.slice(0, 6).map((el) => { const r = el.getBoundingClientRect(); return `${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`; }),
    };
  }, width);
}

async function shot(p, app, state, width, fullPage = true) {
  await p.waitForTimeout(700);
  await mask(p);
  const file = `${app}-${state}-${width}.png`;
  const m = await measure(p, width);
  await p.screenshot({ path: `${OUT}/${file}`, fullPage });
  report.push({ app, state, width, file, ...m });
  console.log(file, m.pageOverflow ? `OVERFLOW ${m.docScrollWidth}` : 'ok', `trunc=${m.truncated} small=${m.smallTargets}`);
}

async function safe(label, fn) {
  try { await fn(); } catch (e) { console.log('FAIL', label, e.message.split('\n')[0]); report.push({ fail: label, error: e.message.split('\n')[0] }); }
}

for (const width of WIDTHS) {
  const vp = { width, height: HEIGHT[width] };
  // Applicant form
  const fctx = await b.newContext({ viewport: vp, hasTouch: width < 1024, isMobile: width === 360, deviceScaleFactor: 1 });
  await fctx.route('**/api/v1/route-selections', (r) => r.fulfill({ status: 204 }));
  await fctx.route('**/api/v1/applications', (r) => r.request().method() === 'POST'
    ? r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ applicationId: 'screenshot-run' }) })
    : r.continue());
  const f = await fctx.newPage();
  const go = async () => { await f.goto('http://localhost:8081/', { waitUntil: 'networkidle' }); };
  const combo = () => f.getByRole('combobox', { name: 'Wie möchtest du uns helfen?' });
  await safe(`form start ${width}`, async () => { await go(); await shot(f, 'form', '01-start', width); });
  await safe(`form category ${width}`, async () => {
    await go(); await combo().selectOption({ label: 'Social Media' });
    await shot(f, 'form', '02-category', width);
  });
  await safe(`form errors ${width}`, async () => {
    await f.getByRole('button', { name: 'Bewerbung abschicken' }).click();
    await shot(f, 'form', '03-errors', width);
  });
  await safe(`form thanks ${width}`, async () => {
    await go(); await combo().selectOption({ label: 'Social Media' });
    await f.getByRole('textbox', { name: /Name/ }).first().fill('Alex Beispiel');
    await f.getByRole('textbox', { name: /E-Mail/ }).first().fill('alex.beispiel@example.org');
    const radios = f.getByRole('radio');
    if (await radios.count()) await radios.first().check({ force: true });
    else { const sel = f.getByRole('combobox').nth(1); if (await sel.count()) await sel.selectOption({ index: 1 }); }
    await f.getByRole('checkbox').first().check({ force: true });
    await f.getByRole('button', { name: 'Bewerbung abschicken' }).click();
    await f.waitForTimeout(1200);
    await shot(f, 'form', '04-thanks', width);
  });
  await safe(`form community ${width}`, async () => {
    await go(); await combo().selectOption({ label: 'Bei #ichbinhier mitmachen (Aktionsgruppe)' });
    await shot(f, 'form', '05-community', width);
  });
  await safe(`form supporting ${width}`, async () => {
    await go(); await combo().selectOption({ label: 'Fördermitglied werden' });
    await shot(f, 'form', '06-supporting-member', width);
  });
  await fctx.close();

  // Dashboard: sign-in screen in a fresh context
  const lctx = await b.newContext({ viewport: vp, hasTouch: width < 1024, isMobile: width === 360 });
  const l = await lctx.newPage();
  await safe(`dash login ${width}`, async () => {
    await l.goto('http://localhost:8082/', { waitUntil: 'networkidle' });
    await shot(l, 'dashboard', '01-sign-in', width);
  });
  await lctx.close();

  const dctx = await b.newContext({ viewport: vp, hasTouch: width < 1024, isMobile: width === 360, storageState: '/tmp/resp102/state.json' });
  const d = await dctx.newPage();
  const screen = async (s) => { await d.goto('about:blank'); await d.goto('http://localhost:8082/#' + s, { waitUntil: 'networkidle' }); };
  await safe(`dash overview ${width}`, async () => { await screen('overview'); await d.locator('svg.recharts-surface').first().waitFor({ timeout: 5000 }).catch(() => {}); await shot(d, 'dashboard', '02-overview', width); });
  await safe(`dash applications ${width}`, async () => { await screen('applications'); await shot(d, 'dashboard', '03-applications', width); });
  await safe(`dash drawer ${width}`, async () => {
    await d.getByRole('rowheader', { name: 'Mara Weber' }).first().click();
    await shot(d, 'dashboard', '04-application-drawer', width);
    await d.keyboard.press('Escape');
  });
  await safe(`dash filter ${width}`, async () => {
    await screen('applications');
    await d.getByRole('button', { name: 'Filter' }).click();
    await shot(d, 'dashboard', '05-filter', width);
    await d.keyboard.press('Escape');
  });
  await safe(`dash categories ${width}`, async () => { await screen('categories'); await shot(d, 'dashboard', '06-categories', width); });
  await safe(`dash category dialog ${width}`, async () => {
    await d.getByRole('button', { name: 'Kategorie hinzufügen' }).click();
    await shot(d, 'dashboard', '07-category-dialog', width);
    await d.keyboard.press('Escape');
  });
  await safe(`dash discarded ${width}`, async () => { await screen('discarded'); await shot(d, 'dashboard', '08-discarded', width); });
  await dctx.close();
}
writeFileSync('/tmp/resp102/report.json', JSON.stringify(report, null, 2));
await b.close();
