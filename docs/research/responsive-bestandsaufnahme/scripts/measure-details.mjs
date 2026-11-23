import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const c = await b.newContext({ viewport: { width: 360, height: 780 } });
await c.route('**/api/v1/route-selections', (r) => r.fulfill({ status: 204 }));
const p = await c.newPage();
await p.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
await p.getByRole('combobox').first().selectOption({ label: 'Fördermitglied werden' });
await p.waitForTimeout(2000);
console.log(await p.evaluate(() => {
  const h = [...document.querySelectorAll('h2,h3')].find((e) => e.textContent.includes('unterstützt'));
  const card = h.closest('section,article,div[class*=card],div[class*=Card]') ;
  const panel = h.parentElement;
  return { vw: innerWidth, doc: document.documentElement.scrollWidth, hFont: getComputedStyle(h).fontFamily, pFont: getComputedStyle(h.nextElementSibling || h).fontFamily, h1Font: getComputedStyle(document.querySelector('h1')).fontFamily, hRight: Math.round(h.getBoundingClientRect().right), panelRight: Math.round(panel.getBoundingClientRect().right), cta: Math.round([...document.querySelectorAll('a')].find((a) => a.textContent.includes('Fördermitgliedsantrag')).getBoundingClientRect().right) };
}));
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: '/tmp/resp102/state.json' })).newPage();
await d.goto('http://localhost:8082/#applications', { waitUntil: 'networkidle' });
console.log(await d.evaluate(() => { const i = document.querySelector('tbody input[type=checkbox], [role=grid] input[type=checkbox]'); const vis = i.parentElement; const s = getComputedStyle(i); return { input: [i.getBoundingClientRect().width, i.getBoundingClientRect().height, s.opacity, s.position], parent: [Math.round(vis.getBoundingClientRect().width), Math.round(vis.getBoundingClientRect().height)], parentTag: vis.tagName + '.' + vis.className.slice(0, 60) }; }));
await b.close();
