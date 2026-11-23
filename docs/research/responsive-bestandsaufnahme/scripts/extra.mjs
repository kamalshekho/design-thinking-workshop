import { chromium } from 'playwright-core';
const OUT = '/tmp/resp102/shots';
const MASK_NAME = process.env.MASK_NAME || 'MASK_NAME not set';
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const H = { 360: 780, 768: 1024, 1024: 768, 1440: 900 };
async function mask(p) {
  await p.evaluate((name) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    const ini = name.split(/\s+/).map((x) => x[0]).join('').toUpperCase();
    while ((n = w.nextNode())) {
      let t = n.nodeValue.replace(/[\w.+-]+@(?!example\.org|ichbinhier\.online)[\w-]+(\.[\w-]+)+/g, 'alex.beispiel@example.org').split(name).join('Alex Beispiel');
      if (t.trim() === ini) t = 'AB';
      if (t !== n.nodeValue) n.nodeValue = t;
    }
  }, MASK_NAME);
}
async function snap(p, file) { await p.waitForTimeout(700); await mask(p); await p.screenshot({ path: `${OUT}/${file}` }); console.log(file); }
const ctxFor = (w, extra = {}) => b.newContext({ viewport: { width: w, height: H[w] }, hasTouch: w < 1024, isMobile: w === 360, ...extra });
const safe = async (l, fn) => { try { await fn(); } catch (e) { console.log('FAIL', l, e.message.split('\n')[0]); } };

for (const w of [360, 768]) {
  const c = await ctxFor(w); await c.route('**/api/v1/route-selections', (r) => r.fulfill({ status: 204 }));
  const p = await c.newPage();
  await safe('form menu', async () => {
    await p.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
    const btn = p.locator('header button').last(); await btn.click();
    await snap(p, `form-07-menu-open-${w}-viewport.png`);
  });
  await safe('form errors viewport', async () => {
    await p.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
    await p.getByRole('combobox').first().selectOption({ label: 'Social Media' });
    await p.getByRole('button', { name: 'Bewerbung abschicken' }).click();
    await snap(p, `form-03-errors-${w}-viewport.png`);
    const info = await p.evaluate(() => {
      const a = document.activeElement; const r = a.getBoundingClientRect();
      const hdr = [...document.querySelectorAll('header, [class*=sticky], [class*=Sticky]')].map((e) => [e.tagName, getComputedStyle(e).position, Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().bottom)]);
      return { focus: a.tagName + ' ' + (a.getAttribute('name') || a.id), top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, hdr };
    });
    console.log(JSON.stringify(info));
  });
  await safe('form fill viewport', async () => {
    await p.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
    await p.getByRole('combobox').first().selectOption({ label: 'Social Media' });
    await p.getByRole('textbox').last().scrollIntoViewIfNeeded(); await p.getByRole('textbox').last().focus();
    await snap(p, `form-08-about-focused-${w}-viewport.png`);
  });
  await c.close();

  const d = await (await ctxFor(w, { storageState: '/tmp/resp102/state.json' })).newPage();
  await safe('dash menu', async () => {
    await d.goto('http://localhost:8082/#applications', { waitUntil: 'networkidle' });
    await d.locator('button').first().click();
    await snap(d, `dashboard-09-menu-open-${w}-viewport.png`);
  });
  await safe('dash drawer viewport', async () => {
    await d.goto('about:blank'); await d.goto('http://localhost:8082/#applications', { waitUntil: 'networkidle' });
    await d.getByRole('rowheader', { name: 'Mara Weber' }).first().click();
    await snap(d, `dashboard-04-application-drawer-${w}-viewport.png`);
  });
  await safe('dash table scrolled', async () => {
    await d.goto('about:blank'); await d.goto('http://localhost:8082/#applications', { waitUntil: 'networkidle' });
    await d.evaluate(() => { const s = [...document.querySelectorAll('.overflow-x-auto')][0]; s.scrollLeft = s.scrollWidth; });
    await snap(d, `dashboard-10-table-scrolled-right-${w}-viewport.png`);
  });
  await safe('dash dialog viewport', async () => {
    await d.goto('about:blank'); await d.goto('http://localhost:8082/#categories', { waitUntil: 'networkidle' });
    await d.getByRole('button', { name: 'Kategorie hinzufügen' }).click();
    await snap(d, `dashboard-07-category-dialog-${w}-viewport.png`);
  });
  await d.context().close();
}
const d = await (await ctxFor(1024, { storageState: '/tmp/resp102/state.json' })).newPage();
await safe('sidebar scroll', async () => {
  await d.goto('http://localhost:8082/#applications', { waitUntil: 'networkidle' });
  await d.mouse.wheel(0, 2000);
  await snap(d, 'dashboard-11-scrolled-down-1024-viewport.png');
  console.log(await d.evaluate(() => ({ y: scrollY, nav: Math.round(document.querySelector('nav').getBoundingClientRect().top) })));
});
await b.close();
