// Print comment blocks compactly with the code line that follows each one.
import fs from 'node:fs';
const [blocksFile, filter, sampleN, seed] = process.argv.slice(2);
let blocks = JSON.parse(fs.readFileSync(blocksFile, 'utf8')).filter(b => !/\.(test|stories)\.tsx?$/.test(b.file) && new RegExp(filter).test(b.file));
const copies = new Set(fs.readFileSync(new URL('./copies.txt', import.meta.url), 'utf8').split('\n').filter(Boolean).map(f => 'dashboard/' + f));
const mode = process.argv[6];
if (mode === 'own') blocks = blocks.filter(b => !copies.has(b.file) && !/\/src\/test\//.test(b.file));
if (mode === 'copy') blocks = blocks.filter(b => copies.has(b.file));
if (sampleN) { let s = Number(seed); const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; blocks = blocks.map(b => [rnd(), b]).sort((a, b) => a[0] - b[0]).slice(0, Number(sampleN)).map(x => x[1]).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line); }
const cache = {};
blocks.forEach((b, i) => {
  const lines = (cache[b.file] ??= fs.readFileSync(b.file, 'utf8').split('\n'));
  const next = (lines.slice(b.endLine).find(l => l.trim()) ?? '').trim().slice(0, 70);
  const t = b.text.replace(/^\s*(\/\*\*?|\*\/|\*|\/\/)\s?/gm, '').replace(/\s+/g, ' ').trim();
  console.log(`${i + 1}. ${b.file.replace(/^(frontend|dashboard)\/src\//, '')}:${b.line} [${b.endLine - b.line + 1}] ${t.slice(0, 210)} => ${next}`);
});
