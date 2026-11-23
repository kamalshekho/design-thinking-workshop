import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
for (const [w, h] of [[360, 780], [360, 640], [768, 1024], [1024, 768]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, storageState: '/tmp/resp102/state.json' });
  const p = await c.newPage();
  await p.goto('http://localhost:8082/#categories', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Kategorie hinzufügen' }).click();
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]');
    const btn = [...dlg.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Anlegen');
    const br = btn.getBoundingClientRect();
    let sc = null; for (let a = btn.parentElement; a; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll)/.test(s.overflowY) && a.scrollHeight > a.clientHeight) { sc = a.tagName + ' ' + a.clientHeight + '/' + a.scrollHeight; break; } }
    const sw = dlg.querySelector('[role=switch], input[type=checkbox]');
    const label = [...dlg.querySelectorAll('*')].find((e) => e.childNodes.length === 1 && e.textContent.trim() === 'Im Formular anzeigen');
    const s = sw && (sw.closest('label') || sw).getBoundingClientRect(); const l = label && label.getBoundingClientRect();
    return { vh: innerHeight, anlegenTop: Math.round(br.top), anlegenBottom: Math.round(br.bottom), scroller: sc, toggleRight: s && Math.round(s.right), labelLeft: l && Math.round(l.left) };
  });
  if (w === 360 && h === 640) { await p.getByRole('button', { name: 'Anlegen' }).scrollIntoViewIfNeeded(); await p.screenshot({ path: '/tmp/resp102/shots/dashboard-07-category-dialog-360x640-scrolled-viewport.png' }); }
  console.log(w, h, JSON.stringify(r));
  await c.close();
}
await b.close();
