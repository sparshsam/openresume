export type FontFamily = 'helvetica' | 'times';

export interface FontSpec {
  sizePt: number;
  bold?: boolean;
  italic?: boolean;
  family?: FontFamily;
  letterSpacingPt?: number;
}

const DIGIT_WIDTH = 556;

const UPPER_REGULAR: Record<string, number> = {
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
};

const LOWER_REGULAR: Record<string, number> = {
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
};

const UPPER_BOLD: Record<string, number> = {
  A: 722,
  B: 722,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 556,
  K: 722,
  L: 611,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
};

const LOWER_BOLD: Record<string, number> = {
  a: 556,
  b: 611,
  c: 556,
  d: 611,
  e: 556,
  f: 333,
  g: 611,
  h: 611,
  i: 278,
  j: 278,
  k: 556,
  l: 278,
  m: 889,
  n: 611,
  o: 611,
  p: 611,
  q: 611,
  r: 389,
  s: 556,
  t: 333,
  u: 611,
  v: 556,
  w: 778,
  x: 556,
  y: 556,
  z: 500,
};

const PUNCTUATION: Record<string, number> = {
  ' ': 278,
  '!': 278,
  '"': 355,
  '#': 556,
  $: 556,
  '%': 889,
  '&': 667,
  "'": 191,
  '(': 333,
  ')': 333,
  '*': 389,
  '+': 584,
  ',': 278,
  '-': 333,
  '.': 278,
  '/': 278,
  ':': 278,
  ';': 278,
  '<': 584,
  '=': 584,
  '>': 584,
  '?': 556,
  '@': 1015,
  '[': 278,
  '\\': 278,
  ']': 278,
  '^': 469,
  _: 556,
  '`': 333,
  '{': 334,
  '|': 260,
  '}': 334,
  '~': 584,
};

const SPECIAL: Record<string, number> = {
  '—': 1000,
  '–': 556,
  '•': 350,
  '·': 278,
  '…': 1000,
  '‘': 222,
  '’': 222,
  '“': 333,
  '”': 333,
};

/**
 * Times-Roman / Times-Bold AFM widths. Both are PDF standard fonts, so the
 * same metrics are available in every viewer without bundling an asset, while
 * Word maps them to Times New Roman.
 */
const TIMES_REGULAR: Record<string, number> = {
  ' ': 250,
  '!': 333,
  '"': 408,
  '#': 500,
  $: 500,
  '%': 833,
  '&': 778,
  "'": 180,
  '(': 333,
  ')': 333,
  '*': 500,
  '+': 564,
  ',': 250,
  '-': 333,
  '.': 250,
  '/': 278,
  ':': 278,
  ';': 278,
  '<': 564,
  '=': 564,
  '>': 564,
  '?': 444,
  '@': 921,
  '[': 333,
  '\\': 278,
  ']': 333,
  '^': 469,
  _: 500,
  '`': 333,
  '{': 480,
  '|': 200,
  '}': 480,
  '~': 541,
  A: 722,
  B: 667,
  C: 667,
  D: 722,
  E: 611,
  F: 556,
  G: 722,
  H: 722,
  I: 333,
  J: 389,
  K: 722,
  L: 611,
  M: 889,
  N: 722,
  O: 722,
  P: 556,
  Q: 722,
  R: 667,
  S: 556,
  T: 611,
  U: 722,
  V: 722,
  W: 944,
  X: 722,
  Y: 722,
  Z: 611,
  a: 444,
  b: 500,
  c: 444,
  d: 500,
  e: 444,
  f: 333,
  g: 500,
  h: 500,
  i: 278,
  j: 278,
  k: 500,
  l: 278,
  m: 778,
  n: 500,
  o: 500,
  p: 500,
  q: 500,
  r: 333,
  s: 389,
  t: 278,
  u: 500,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 444,
};

const TIMES_BOLD: Record<string, number> = {
  ' ': 250,
  '!': 333,
  '"': 555,
  '#': 500,
  $: 500,
  '%': 1000,
  '&': 833,
  "'": 278,
  '(': 333,
  ')': 333,
  '*': 500,
  '+': 570,
  ',': 250,
  '-': 333,
  '.': 250,
  '/': 278,
  ':': 333,
  ';': 333,
  '<': 570,
  '=': 570,
  '>': 570,
  '?': 500,
  '@': 930,
  '[': 333,
  '\\': 278,
  ']': 333,
  '^': 581,
  _: 500,
  '`': 333,
  '{': 394,
  '|': 220,
  '}': 394,
  '~': 520,
  A: 722,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 778,
  I: 389,
  J: 500,
  K: 778,
  L: 667,
  M: 944,
  N: 722,
  O: 778,
  P: 611,
  Q: 778,
  R: 722,
  S: 556,
  T: 667,
  U: 722,
  V: 722,
  W: 1000,
  X: 722,
  Y: 722,
  Z: 667,
  a: 500,
  b: 556,
  c: 444,
  d: 556,
  e: 444,
  f: 333,
  g: 500,
  h: 556,
  i: 278,
  j: 333,
  k: 556,
  l: 278,
  m: 833,
  n: 556,
  o: 500,
  p: 556,
  q: 556,
  r: 444,
  s: 389,
  t: 333,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 444,
};

const TIMES_SPECIAL: Record<string, number> = {
  '—': 1000,
  '–': 500,
  '•': 350,
  '·': 250,
  '…': 1000,
  '‘': 333,
  '’': 333,
  '“': 444,
  '”': 444,
};

function widthUnits(char: string, bold: boolean, family: FontFamily): number {
  if (char >= '0' && char <= '9') return family === 'times' ? 500 : DIGIT_WIDTH;
  if (family === 'times') {
    return (bold ? TIMES_BOLD : TIMES_REGULAR)[char] ?? TIMES_SPECIAL[char] ?? 500;
  }
  const punctuation = PUNCTUATION[char];
  if (punctuation !== undefined) return punctuation;
  const upper = bold ? UPPER_BOLD[char] : UPPER_REGULAR[char];
  if (upper !== undefined) return upper;
  const lower = bold ? LOWER_BOLD[char] : LOWER_REGULAR[char];
  if (lower !== undefined) return lower;
  const special = SPECIAL[char];
  if (special !== undefined) return special;
  return 556;
}

export function measureLineWidth(text: string, font: FontSpec): number {
  let units = 0;
  for (const char of text)
    units += widthUnits(char, Boolean(font.bold), font.family ?? 'helvetica');
  const spacing = (font.letterSpacingPt ?? 0) * Math.max(0, [...text].length - 1);
  return (units / 1000) * font.sizePt + spacing;
}

function splitLongWord(word: string, maxWidthPt: number, font: FontSpec): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const char of word) {
    const candidate = current + char;
    if (current && measureLineWidth(candidate, font) > maxWidthPt) {
      pieces.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

export function wrapText(text: string, maxWidthPt: number, font: FontSpec): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureLineWidth(candidate, font) <= maxWidthPt) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    if (measureLineWidth(word, font) <= maxWidthPt) {
      current = word;
    } else {
      const pieces = splitLongWord(word, maxWidthPt, font);
      const last = pieces.pop() ?? '';
      lines.push(...pieces);
      current = last;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}
