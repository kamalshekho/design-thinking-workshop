// Sum blocks and lines per hand-assigned class; extrapolate a sample to its population.
import fs from 'node:fs';
const [blocksFile, filter, sampleN, seed, mode, classesCsv, popBlocks, popLines] = process.argv.slice(2);
let blocks = JSON.parse(fs.readFileSync(blocksFile, 'utf8')).filter(b => !/\.(test|stories)\.tsx?$/.test(b.file) && new RegExp(filter).test(b.file));
const copies = new Set(fs.readFileSync(new URL('./copies.txt', import.meta.url), 'utf8').split('\n').filter(Boolean).map(f => 'dashboard/' + f));
if (mode === 'own') blocks = blocks.filter(b => !copies.has(b.file) && !/\/src\/test\//.test(b.file));
if (mode === 'copy') blocks = blocks.filter(b => copies.has(b.file));
if (sampleN !== '0') { let s = Number(seed); const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; blocks = blocks.map(b => [rnd(), b]).sort((a, b) => a[0] - b[0]).slice(0, Number(sampleN)).map(x => x[1]).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line); }
const cls = classesCsv.split(',');
if (cls.length !== blocks.length) throw new Error(`classes ${cls.length} != blocks ${blocks.length}`);
const t = {};
blocks.forEach((b, i) => { const k = cls[i]; t[k] ??= { blocks: 0, lines: 0 }; t[k].blocks++; t[k].lines += b.endLine - b.line + 1; });
const totL = Object.values(t).reduce((a, x) => a + x.lines, 0);
for (const [k, v] of Object.entries(t)) {
  const ext = popBlocks ? `  ~pop blocks=${Math.round(v.blocks / blocks.length * popBlocks)} ~pop lines=${Math.round(v.lines / totL * popLines)}` : '';
  console.log(`${k}\tblocks=${v.blocks}\tlines=${v.lines}\tshare=${(v.blocks / blocks.length * 100).toFixed(0)}%${ext}`);
}
