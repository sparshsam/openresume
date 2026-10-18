export interface FontSpec {
  sizePt: number;
  bold?: boolean;
  italic?: boolean;
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

function widthUnits(char: string, bold: boolean): number {
  if (char >= '0' && char <= '9') return DIGIT_WIDTH;
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
  for (const char of text) units += widthUnits(char, Boolean(font.bold));
  return (units / 1000) * font.sizePt;
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
