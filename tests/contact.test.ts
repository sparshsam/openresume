import { describe, expect, it } from 'vitest';
import { looksLikeJobTitle, looksLikeLocation, parseContactLine } from '../src/lib/contact';

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

  it('keeps a job title out of the location slot when the headline is omitted', () => {
    const parsed = parseContactLine(
      'jordan@example.com | +1 555 0142 | Senior Product Engineer | Toronto, ON',
    );

    expect(parsed.headline).toBe('Senior Product Engineer');
    expect(parsed.contact.location).toBe('Toronto, ON');
    expect(parsed.warnings).toEqual([]);
  });

  it('never accepts a job title as the location when no location exists', () => {
    const parsed = parseContactLine(
      'jordan@example.com | +1 555 0142 | Senior Product Engineer',
    );

    expect(parsed.contact.location).toBeUndefined();
    expect(parsed.headline).toBe('Senior Product Engineer');
    expect(parsed.warnings[0]).toMatch(/job title or professional headline/i);
  });

  it('leaves an unverified location empty when the headline is present', () => {
    const parsed = parseContactLine(
      'Product-minded software generalist | jordan@example.com | +1 555 0142',
    );

    expect(parsed.headline).toBe('Product-minded software generalist');
    expect(parsed.contact.location).toBeUndefined();
    expect(parsed.warnings).toEqual([]);
  });

  it('keeps a missing headline from shifting the location into another field', () => {
    const parsed = parseContactLine('jordan@example.com | +1 555 0142 | Toronto, ON');

    expect(parsed.headline).toBeUndefined();
    expect(parsed.contact.location).toBe('Toronto, ON');
    expect(parsed.contact.email).toBe('jordan@example.com');
  });

  it('preserves multiple links in any order', () => {
    const parsed = parseContactLine(
      'Product engineer | linkedin.com/in/jordan | jordan@example.com | github.com/jordan | +1 555 0142 | Toronto, ON | https://jordan.example.com',
    );

    expect(parsed.headline).toBe('Product engineer');
    expect(parsed.contact.links.map((link) => link.label)).toEqual([
      'linkedin.com/in/jordan',
      'github.com/jordan',
      'jordan.example.com',
    ]);
    expect(parsed.contact.location).toBe('Toronto, ON');
  });

  it('accepts confirmed work arrangements without inventing a city', () => {
    for (const value of ['Remote', 'Hybrid', 'On-site', 'Onsite', 'Online', 'Remote (Canada)']) {
      const parsed = parseContactLine(`jordan@example.com | ${value}`);
      expect(parsed.contact.location, value).toBe(value);
      expect(parsed.headline, value).toBeUndefined();
    }
  });

  it('does not turn a remote-first headline into a location', () => {
    const parsed = parseContactLine('Remote-first product leader | jordan@example.com');

    expect(parsed.headline).toBe('Remote-first product leader');
    expect(parsed.contact.location).toBeUndefined();
  });

  it('accepts legitimate geographic locations', () => {
    for (const value of [
      'Toronto, ON',
      'Vancouver, British Columbia',
      'Berlin, Germany',
      'New York, NY',
      'New York',
      'San Francisco',
      'Singapore',
      'London',
      'Toronto, ON / Remote',
    ]) {
      expect(looksLikeLocation(value), value).toBe(true);
    }
  });

  it('rejects obvious job titles and headlines as locations', () => {
    for (const value of [
      'Senior Product Engineer',
      'Product-minded software generalist',
      'Hiring Manager',
      'Brightline Labs',
      'Remote-first product leader',
    ]) {
      expect(looksLikeLocation(value) && !looksLikeJobTitle(value), value).toBe(false);
    }
  });

  it('keeps a repeated title out of the location slot and preserves both values', () => {
    const parsed = parseContactLine(
      'Product-minded software generalist | jordan@example.com | Senior Product Engineer',
    );

    expect(parsed.contact.location).toBeUndefined();
    expect(parsed.headline).toBe(
      'Product-minded software generalist · Senior Product Engineer',
    );
  });

  it('keeps a location that appears before a title-like value', () => {
    const parsed = parseContactLine(
      'Product-minded software generalist | jordan@example.com | Toronto, ON | Senior Product Engineer',
    );

    expect(parsed.contact.location).toBe('Toronto, ON');
    expect(parsed.headline).toBe(
      'Product-minded software generalist · Senior Product Engineer',
    );
  });
});
