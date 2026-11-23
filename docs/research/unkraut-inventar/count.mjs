// Count lines and comment lines per file; emit comment blocks as JSON.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [app, mode] = process.argv.slice(2);
const require = createRequire(path.resolve(app, 'package.json'));
const ts = require('typescript');
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
const files = walk(path.join(app, 'src')).filter(f => /\.(tsx?|css)$/.test(f));
const blocks = []; const rows = [];
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n'); if (lines.at(-1) === '') lines.pop();
  const commentLines = new Set();
  const add = (start, end, kind) => {
    const sl = text.slice(0, start).split('\n').length; const el = text.slice(0, end).split('\n').length;
    for (let i = sl; i <= el; i++) commentLines.add(i);
    blocks.push({ file: f, line: sl, endLine: el, kind, text: text.slice(start, end) });
  };
  if (f.endsWith('.css')) {
    for (const m of text.matchAll(/\/\*[\s\S]*?\*\//g)) add(m.index, m.index + m[0].length, 'block');
  } else {
    const sc = ts.createScanner(ts.ScriptTarget.Latest, false, f.endsWith('x') ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard, text);
    let t; let prevLineEnd = -1; let cur = null;
    while ((t = sc.scan()) !== ts.SyntaxKind.EndOfFileToken) {
      if (t === ts.SyntaxKind.SingleLineCommentTrivia || t === ts.SyntaxKind.MultiLineCommentTrivia) {
        const s = sc.getTokenStart(), e = sc.getTokenEnd();
        // merge consecutive // lines into one block
        if (t === ts.SyntaxKind.SingleLineCommentTrivia && cur && /^\s*$/.test(text.slice(cur.e, s)) && text.slice(cur.e, s).split('\n').length === 2) { cur.e = e; continue; }
        if (cur) add(cur.s, cur.e, cur.k);
        cur = { s, e, k: t === ts.SyntaxKind.SingleLineCommentTrivia ? 'line' : 'block' };
      } else if (t !== ts.SyntaxKind.WhitespaceTrivia && t !== ts.SyntaxKind.NewLineTrivia) {
        if (cur) { add(cur.s, cur.e, cur.k); cur = null; }
      }
    }
    if (cur) add(cur.s, cur.e, cur.k);
  }
  const blank = lines.filter(l => l.trim() === '').length;
  rows.push({ file: path.relative(app, f), lines: lines.length, comment: commentLines.size, blank });
}
if (mode === 'blocks') console.log(JSON.stringify(blocks)); else console.log(JSON.stringify(rows));
