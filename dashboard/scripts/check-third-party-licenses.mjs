/**
 * Checks that THIRD_PARTY_LICENSES still describes the copies in src/. The
 * notice is the record of which files came from Untitled UI and shadcn/ui
 * under their MIT licences, so a path that no longer exists, or a copy that
 * no longer says where it came from, makes the record wrong without anyone
 * noticing.
 *
 * Each `-> src/...` line names a copy, and the line above it names the clone
 * or registry path it came from. For every such line the script checks:
 *
 * - the file exists;
 * - a .ts or .tsx copy begins with its origin header: a block comment whose
 *   first line opens with `Clone path:` (Untitled UI) or `Registry path:`
 *   (shadcn/ui), followed by the path from the line above in backticks;
 * - a `-> folded into src/...` file is code of our own that took in part of a
 *   registry file, so it only has to name that path in backticks somewhere in
 *   its first block comment.
 *
 * Images and other files carry no comment and are checked for existence only.
 *
 * Plain Node without dependencies. Exits 1 and lists every finding on stderr
 * when it finds one.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const NOTICE = path.join(ROOT, 'THIRD_PARTY_LICENSES');

const COPY_LINE = /^\s*->\s+(folded into\s+)?(src\/\S+)/;
const SECTION_RULE = /^={10,}$/;
const SOURCE = /\.(ts|tsx)$/;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The label a section's copies open their header with. */
function labelFor(section) {
  if (section.startsWith('Untitled UI')) return 'Clone path:';
  if (section.startsWith('shadcn/ui')) return 'Registry path:';
  return undefined;
}

function copiesIn(notice) {
  const lines = notice.split('\n');
  const copies = [];
  let section = '';

  lines.forEach((line, index) => {
    if (SECTION_RULE.test(lines[index - 1] ?? '') && line.trim() !== '') {
      section = line.trim();
    }
    const match = COPY_LINE.exec(line);
    if (match === null) return;
    copies.push({
      line: index + 1,
      file: match[2],
      folded: match[1] !== undefined,
      origin: (lines[index - 1] ?? '').trim(),
      label: labelFor(section),
    });
  });

  return copies;
}

function firstBlockComment(text) {
  const match = /\/\*\*?[\s\S]*?\*\//.exec(text);
  return match === null ? '' : match[0].replace(/\n\s*\*\s?/g, ' ');
}

function headerFinding({ file, folded, origin, label }, text) {
  if (folded) {
    return firstBlockComment(text).includes(`\`${origin}\``)
      ? undefined
      : `${file} does not name \`${origin}\` in its first comment`;
  }
  if (label === undefined) {
    return `${file} sits in a section the script has no header label for`;
  }
  const header = new RegExp(
    `^/\\*\\*\\n \\* ${escapeRegExp(label)}(?: |\\n \\* )\`${escapeRegExp(origin)}\``,
  );
  return header.test(text)
    ? undefined
    : `${file} does not begin with "/** ${label} \`${origin}\`"`;
}

const copies = copiesIn(readFileSync(NOTICE, 'utf8'));
const findings = [];

if (copies.length === 0) {
  findings.push('no "-> src/..." lines found');
}

for (const copy of copies) {
  const absolute = path.join(ROOT, copy.file);
  if (!existsSync(absolute)) {
    findings.push(`line ${copy.line}: ${copy.file} does not exist`);
    continue;
  }
  if (!SOURCE.test(copy.file)) continue;
  const finding = headerFinding(copy, readFileSync(absolute, 'utf8'));
  if (finding !== undefined) findings.push(`line ${copy.line}: ${finding}`);
}

if (findings.length > 0) {
  console.error(
    `${findings.length} problem(s) with the copies THIRD_PARTY_LICENSES lists:`,
  );
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `Third-party licence check passed: ${copies.length} copies exist and name their origin.`,
);
