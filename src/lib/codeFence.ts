const OPENING_FENCE = /^```[ \t]*(?:text)?[ \t]*$/i;
const CLOSING_FENCE = /^```[ \t]*$/;

/**
 * Remove exactly one complete Markdown code fence that encloses the entire
 * input. The fence is treated purely as a delivery container; the interior is
 * returned unchanged. Ambiguous or partial fences are left untouched so
 * unrelated content is never rewritten.
 */
export function stripEnclosingCodeFence(input: string): string {
  const normalized = input.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  let first = 0;
  while (first < lines.length && !lines[first].trim()) first += 1;
  let last = lines.length - 1;
  while (last >= 0 && !lines[last].trim()) last -= 1;

  if (first >= last) return input;

  if (!OPENING_FENCE.test(lines[first].trim()) || !CLOSING_FENCE.test(lines[last].trim())) {
    return input;
  }

  const interior = lines.slice(first + 1, last);

  if (!interior.some((line) => line.trim())) return input;
  if (interior.some((line) => line.trim().startsWith('```'))) return input;

  return interior.join('\n');
}
