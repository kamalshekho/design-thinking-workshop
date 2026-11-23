// List string literals and JSX text that look like German UI copy.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [app, ...skipDirs] = process.argv.slice(2);
const ts = createRequire(path.resolve(app, 'package.json'))('typescript');
const german = /[äöüÄÖÜß]|\b(und|oder|der|die|das|nicht|kein|keine|Bitte|wird|wurde|ist|zu|mit|für|von|bei|noch|alle|Anfrage|Anfragen|Kategorie|Kategorien|Übersicht|Aussortiert|Abmelden|Speichern|Abbrechen|Löschen|Zurück|Weiter|Fehler|Name|Status)\b/;
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
for (const f of walk(path.join(app, 'src')).filter(f => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f))) {
  const rel = path.relative(app, f);
  if (skipDirs.some(s => rel.startsWith(s))) continue;
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = n => {
    let t = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) t = n.text;
    if (ts.isJsxText(n) && n.text.trim()) t = n.text.trim();
    if (ts.isTemplateExpression(n)) t = n.getText();
    if (t && german.test(t)) console.log(`${rel}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}\t${t.replace(/\s+/g, ' ').slice(0, 90)}`);
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
