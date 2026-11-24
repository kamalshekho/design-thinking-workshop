/**
 * Compares every confirmed primitive in token.json against its CSS custom
 * property in src/styles/tokens.css. tokens.css is the source of truth because
 * its values come from the live site; token.json is what Figma reads.
 *
 * Confirmed primitives that exist only for Figma (or outside tokens.css, such
 * as @font-face and font-weight in base.css) are listed explicitly so
 * check:tokens does not force unread variables into tokens.css. Any confirmed
 * entry that is neither mapped nor listed as Figma-only fails the run.
 *
 * Plain Node without dependencies. Exits 1 and lists every mismatch or
 * unmapped confirmed primitive on stderr when it finds one.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEFAULT_TOKEN_JSON = path.join(ROOT, 'token.json');
const DEFAULT_TOKENS_CSS = path.join(ROOT, 'src', 'styles', 'tokens.css');

const DEFINITION = /(--[\w-]+)\s*:\s*([^;}]+)/g;

const PRIMITIVE_MAP = new Map([
  ['color.brand.purple', '--color-fuut-purple'],
  ['color.brand.red', '--color-fuut-red'],
  ['color.brand.gray', '--color-fuut-gray'],
  ['color.brand.creme', '--color-fuut-creme'],
  ['typography.size.small', '--wp--preset--font-size--small'],
  ['typography.size.medium', '--wp--preset--font-size--medium'],
  ['typography.size.large', '--wp--preset--font-size--large'],
  ['typography.size.xLarge', '--wp--preset--font-size--x-large'],
  ['spacing.wp20', '--wp--preset--spacing--20'],
  ['spacing.wp30', '--wp--preset--spacing--30'],
  ['spacing.wp40', '--wp--preset--spacing--40'],
  ['spacing.wp50', '--wp--preset--spacing--50'],
  ['spacing.wp60', '--wp--preset--spacing--60'],
  ['spacing.wp70', '--wp--preset--spacing--70'],
  ['spacing.wp80', '--wp--preset--spacing--80'],
  ['layout.container.max', '--container-max'],
]);

const FIGMA_ONLY_PRIMITIVES = new Set([
  'color.brand.lila',
  'shadow.natural',
  'shadow.deep',
  'shadow.sharp',
  'shadow.outlined',
  'shadow.crisp',
  'typography.fontFace.regular',
  'typography.weight.regular',
]);

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readCssTokens(tokensCssPath) {
  const css = stripCssComments(readFileSync(tokensCssPath, 'utf8'));
  const tokens = new Map();
  for (const [, name, rawValue] of css.matchAll(DEFINITION)) {
    tokens.set(name, rawValue.trim());
  }
  return tokens;
}

function collectConfirmedEntries(node, prefix = '', out = []) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return out;
  }
  if (node.source === 'confirmed') {
    out.push({ path: prefix, value: node.value });
    return out;
  }
  for (const [key, child] of Object.entries(node)) {
    const nextPath = prefix === '' ? key : `${prefix}.${key}`;
    collectConfirmedEntries(child, nextPath, out);
  }
  return out;
}

function normalizeColor(value) {
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(
    value,
  );
  if (hexMatch) {
    const hex = hexMatch[1].toLowerCase();
    if (hex.length === 3 || hex.length === 4) {
      return `#${[...hex].map((ch) => ch + ch).join('')}`;
    }
    return `#${hex}`;
  }
  const rgbMatch =
    /^rgb\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)$/i.exec(
      value,
    );
  if (rgbMatch) {
    const channels = rgbMatch.slice(1, 4).map(Number);
    if (channels.every((c) => c >= 0 && c <= 255)) {
      return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return null;
}

function normalizeValue(raw) {
  const collapsed = String(raw).trim().replace(/\s+/g, ' ');
  return normalizeColor(collapsed) ?? collapsed.toLowerCase();
}

const [tokenJsonArg, tokensCssArg] = process.argv.slice(2);
const tokenJsonPath = tokenJsonArg
  ? path.resolve(tokenJsonArg)
  : DEFAULT_TOKEN_JSON;
const tokensCssPath = tokensCssArg
  ? path.resolve(tokensCssArg)
  : DEFAULT_TOKENS_CSS;

const tokenJson = JSON.parse(readFileSync(tokenJsonPath, 'utf8'));
const cssTokens = readCssTokens(tokensCssPath);
const confirmed = collectConfirmedEntries(tokenJson);

const errors = [];
const seenConfirmed = new Set();

for (const entry of confirmed) {
  seenConfirmed.add(entry.path);
  if (FIGMA_ONLY_PRIMITIVES.has(entry.path)) continue;

  const cssVar = PRIMITIVE_MAP.get(entry.path);
  if (cssVar === undefined) {
    errors.push(
      `unmapped confirmed primitive "${entry.path}" in token.json (map it to a variable in tokens.css or list it as Figma-only)`,
    );
    continue;
  }

  const cssValue = cssTokens.get(cssVar);
  if (cssValue === undefined) {
    errors.push(
      `${entry.path} (${cssVar}): missing in tokens.css (token.json has "${String(entry.value)}")`,
    );
    continue;
  }

  if (normalizeValue(entry.value) !== normalizeValue(cssValue)) {
    errors.push(
      `${entry.path} (${cssVar}): token.json has "${String(entry.value)}", tokens.css has "${cssValue}"`,
    );
  }
}

for (const [jsonPath, cssVar] of PRIMITIVE_MAP) {
  if (!seenConfirmed.has(jsonPath)) {
    errors.push(
      `${jsonPath} (${cssVar}): mapped in check-token-json.mjs but not found as source="confirmed" in token.json`,
    );
  }
}

if (errors.length > 0) {
  console.error(`${errors.length} token.json / tokens.css mismatch(es) found:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
