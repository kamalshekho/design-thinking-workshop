// Count any, non-null assertions, type assertions and ts directives outside tests.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [app] = process.argv.slice(2);
const ts = createRequire(path.resolve(app, 'package.json'))('typescript');
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
const c = { any: [], nonNull: [], asCast: [], asConst: 0 };
for (const f of walk(path.join(app, 'src')).filter(f => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f) && !/\/src\/(test|mocks)\//.test(f))) {
  const rel = path.relative(app, f);
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
  const at = n => `${rel}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  const visit = n => {
    if (n.kind === ts.SyntaxKind.AnyKeyword) c.any.push(at(n));
    if (ts.isNonNullExpression(n)) c.nonNull.push(at(n));
    if (ts.isAsExpression(n)) { if (n.type.getText() === 'const') c.asConst++; else c.asCast.push(`${at(n)} as ${n.type.getText().slice(0, 40)}`); }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log(`any=${c.any.length} nonNull=${c.nonNull.length} asCast=${c.asCast.length} asConst=${c.asConst}`);
for (const k of ['any', 'nonNull', 'asCast']) for (const x of c[k]) console.log(`  ${k}\t${x}`);
