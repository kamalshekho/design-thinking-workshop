/**
 * Reports every custom property defined in src/styles/tokens.css that the
 * applicant form never reads through var(). An unused token looks like part
 * of the design system, so the next person copies it or keeps it in sync with
 * token.json for nothing.
 *
 * A token counts as used when a var() outside a token definition reads it:
 * in a CSS module, in base.css, in a rule of tokens.css itself, or in a .ts or
 * .tsx file under src/. A token that only another token's definition reads is
 * used only if that other token is used, so a chain of aliases nobody reads
 * is reported in full.
 *
 * Plain Node without dependencies. Exits 1 and lists every unused token on
 * stderr when it finds one.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const TOKENS = path.join(SRC, 'styles', 'tokens.css');

const DEFINITION = /(--[\w-]+)\s*:([^;}]*)/g;
const VAR_READ = /var\(\s*(--[\w-]+)/g;

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function reads(text) {
  return [...text.matchAll(VAR_READ)].map((match) => match[1]);
}

function sourceFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(css|ts|tsx)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

const tokensCss = stripCssComments(readFileSync(TOKENS, 'utf8'));

/** Token name to the tokens its definitions read. */
const readsByToken = new Map();
for (const [, name, value] of tokensCss.matchAll(DEFINITION)) {
  const known = readsByToken.get(name) ?? [];
  readsByToken.set(name, [...known, ...reads(value)]);
}

const used = new Set();
const pending = [];
function markUsed(name) {
  if (used.has(name)) return;
  used.add(name);
  pending.push(name);
}

for (const file of sourceFiles(SRC)) {
  let text = readFileSync(file, 'utf8');
  if (file.endsWith('.css')) text = stripCssComments(text);
  if (file === TOKENS) text = text.replace(DEFINITION, '');
  reads(text).forEach(markUsed);
}

while (pending.length > 0) {
  const name = pending.pop();
  (readsByToken.get(name) ?? []).forEach(markUsed);
}

const unused = [...readsByToken.keys()].filter((name) => !used.has(name));

if (unused.length > 0) {
  console.error(
    `${unused.length} token(s) in ${path.relative(ROOT, TOKENS)} that nothing reads:`,
  );
  for (const name of unused) console.error(`- ${name}`);
  process.exit(1);
}
