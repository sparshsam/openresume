import { describe, expect, it } from 'vitest';
import { parseContactLine } from '../src/lib/contact';

describe('parseContactLine', () => {
  it('classifies headline, email, phone, location, and links', () => {
    const parsed = parseContactLine(
      'Product engineer | jordan@example.com | +1 555 0142 | Toronto, ON | linkedin.com/in/jordan',
    );

    expect(parsed.headline).toBe('Product engineer');
    expect(parsed.contact.email).toBe('jordan@example.com');
    expect(parsed.contact.phone).toBe('+1 555 0142');
    expect(parsed.contact.location).toBe('Toronto, ON');
    expect(parsed.contact.links).toEqual([
      { label: 'linkedin.com/in/jordan', url: 'https://linkedin.com/in/jordan' },
    ]);
  });

  it('handles a missing headline and comma-free location', () => {
    const parsed = parseContactLine('jordan@example.com | +1 555 0142 | Remote');
    expect(parsed.headline).toBeUndefined();
    expect(parsed.contact.location).toBe('Remote');
  });

  it('preserves explicit URLs', () => {
    const parsed = parseContactLine('https://example.com/portfolio');
    expect(parsed.contact.links[0]).toEqual({
      label: 'example.com/portfolio',
      url: 'https://example.com/portfolio',
    });
  });
});
