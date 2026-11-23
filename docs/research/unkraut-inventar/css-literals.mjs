// List literal sizes, colours and shadows in CSS declarations and at-rule params.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [app, ...skip] = process.argv.slice(2);
const require = createRequire(path.resolve(app, 'package.json'));
const postcss = require('postcss');
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
const size = /(?<![\w-])-?\d*\.?\d+(px|rem|em|vw|vh|ch|ms|s|deg|%)(?![\w-])/g;
const named = /(?<![\w-])(white|black|transparent|red|gray|grey|currentcolor)(?![\w-])/gi;
const out = [];
for (const f of walk(path.join(app, 'src')).filter(f => f.endsWith('.css'))) {
  const rel = path.relative(app, f);
  if (skip.some(s => rel.endsWith(s))) continue;
  const root = postcss.parse(fs.readFileSync(f, 'utf8'), { from: f });
  root.walkDecls(d => {
    if (d.prop.startsWith('--')) { out.push({ rel, line: d.source.start.line, kind: 'custom-prop-def', v: `${d.prop}: ${d.value}` }); return; }
    const v = d.value.replace(/var\([^)]*\)/g, 'var()');
    const s = v.match(size); const n = v.match(named);
    if (s) out.push({ rel, line: d.source.start.line, kind: /shadow/.test(d.prop) ? 'shadow' : (/duration|transition|animation/.test(d.prop) ? 'time' : 'size'), v: `${d.prop}: ${d.value}` });
    if (n && !/currentcolor/i.test(n.join())) out.push({ rel, line: d.source.start.line, kind: 'named-colour', v: `${d.prop}: ${d.value}` });
  });
  root.walkAtRules(a => { if (/media|container/.test(a.name) && size.test(a.params)) out.push({ rel, line: a.source.start.line, kind: 'media', v: `@${a.name} ${a.params}` }); size.lastIndex = 0; });
}
console.log(JSON.stringify(out));
