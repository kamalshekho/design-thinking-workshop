import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: '/tmp/resp102/state.json' })).newPage();
for (const s of ['applications', 'categories']) {
  await d.goto('about:blank'); await d.goto('http://localhost:8082/#' + s, { waitUntil: 'networkidle' });
  console.log(s, await d.evaluate(() => [...document.querySelectorAll('main input[type=checkbox]')].slice(0, 2).map((i) => {
    const l = i.closest('label') || i.parentElement.parentElement;
    const boxes = [...l.querySelectorAll('div,span')].filter((e) => !e.contains(i)).map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; });
    const lr = l.getBoundingClientRect();
    return { label: l.tagName + ' ' + Math.round(lr.width) + 'x' + Math.round(lr.height), boxes };
  })));
}
await b.close();
