import { describe, expect, it } from 'vitest';
import { stripEnclosingCodeFence } from '../src/lib/codeFence';

const DOCUMENT = [
  '# Jordan Avery',
  'Product engineer | jordan.avery@example.com | Toronto, ON',
  '',
  '## SUMMARY',
  'A concise summary.',
].join('\n');

describe('stripEnclosingCodeFence', () => {
  it('strips an unlabelled enclosing fence', () => {
    const input = `\`\`\`\n${DOCUMENT}\n\`\`\``;
    expect(stripEnclosingCodeFence(input)).toBe(DOCUMENT);
  });

  it('strips a text-labelled enclosing fence', () => {
    const input = `\`\`\`text\n${DOCUMENT}\n\`\`\``;
    expect(stripEnclosingCodeFence(input)).toBe(DOCUMENT);
  });

  it('accepts a capitalised text label and trailing spaces', () => {
    const input = `\`\`\` Text  \n${DOCUMENT}\n\`\`\`   `;
    expect(stripEnclosingCodeFence(input)).toBe(DOCUMENT);
  });

  it('preserves the interior exactly, including blank lines', () => {
    const input = `\`\`\`text\n\n${DOCUMENT}\n\n\`\`\``;
    expect(stripEnclosingCodeFence(input)).toBe(`\n${DOCUMENT}\n`);
  });

  it('ignores blank lines outside the fence', () => {
    const input = `\n\n\`\`\`text\n${DOCUMENT}\n\`\`\`\n\n`;
    expect(stripEnclosingCodeFence(input)).toBe(DOCUMENT);
  });

  it('returns unfenced input unchanged', () => {
    expect(stripEnclosingCodeFence(DOCUMENT)).toBe(DOCUMENT);
  });

  it('returns input unchanged when prose surrounds the fence', () => {
    const input = `Here is your resume:\n\`\`\`text\n${DOCUMENT}\n\`\`\`\nLet me know if it helps.`;
    expect(stripEnclosingCodeFence(input)).toBe(input);
  });

  it('returns input unchanged for an unbalanced opening fence', () => {
    const input = `\`\`\`text\n${DOCUMENT}`;
    expect(stripEnclosingCodeFence(input)).toBe(input);
  });

  it('returns input unchanged for an unbalanced closing fence', () => {
    const input = `${DOCUMENT}\n\`\`\``;
    expect(stripEnclosingCodeFence(input)).toBe(input);
  });

  it('returns input unchanged when the interior contains a fence line', () => {
    const input = `\`\`\`text\n${DOCUMENT}\n\`\`\`\nMore text.`;
    expect(stripEnclosingCodeFence(input)).toBe(input);
  });

  it('returns input unchanged for two separate fence pairs', () => {
    const input = `\`\`\`text\n# First\n\`\`\`\n\n\`\`\`text\n# Second\n\`\`\``;
    expect(stripEnclosingCodeFence(input)).toBe(input);
  });

  it('returns input unchanged when the fence is empty', () => {
    const input = '```text\n```';
    expect(stripEnclosingCodeFence(input)).toBe(input);
  });

  it('normalizes CRLF only when a fence is stripped', () => {
    const fenced = `\`\`\`text\r\n${DOCUMENT.replace(/\n/g, '\r\n')}\r\n\`\`\``;
    expect(stripEnclosingCodeFence(fenced)).toBe(DOCUMENT);
    expect(stripEnclosingCodeFence(DOCUMENT.replace(/\n/g, '\r\n'))).toBe(
      DOCUMENT.replace(/\n/g, '\r\n'),
    );
  });
});
