// Collect identifiers that contain German word stems or umlauts.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [app] = process.argv.slice(2);
const ts = createRequire(path.resolve(app, 'package.json'))('typescript');
const stems = /kontakt|rechtlich|bewerb|anfrage|kategori|impressum|datenschutz|spende|ehrenamt|aussortier|uebersicht|übersicht|mitarbeit|anmeld|abmeld|einstellung|nachricht|zustimm|einwillig|absend|fehler|ä|ö|ü|ß/i;
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
const hits = new Map();
for (const f of walk(path.join(app, 'src')).filter(f => /\.tsx?$/.test(f))) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = n => { if (ts.isIdentifier(n) && stems.test(n.text)) { const k = n.text; const r = path.relative(app, f); if (!hits.has(k)) hits.set(k, new Set()); hits.get(k).add(r); } ts.forEachChild(n, visit); };
  visit(sf);
}
for (const [k, v] of [...hits].sort()) console.log(`${k}\t${[...v].length} files\t${[...v].slice(0, 3).join(', ')}`);
