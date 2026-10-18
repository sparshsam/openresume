import { describe, expect, it } from 'vitest';
import { parseResume } from '../src/lib/parse';
import { serializeResume } from '../src/lib/serialize';
import { SAMPLE_RESUME_TEXT, createSampleResume } from '../src/lib/sample';

describe('serializeResume', () => {
  it('round-trips the sample resume without semantic loss', () => {
    const original = createSampleResume();
    const reparsed = parseResume(serializeResume(original)).resume;
    expect(reparsed).toEqual(original);
  });

  it('emits a canonical header and contact line', () => {
    const text = serializeResume(parseResume(SAMPLE_RESUME_TEXT).resume);
    expect(text.split('\n')[0]).toBe('# Jordan Avery');
    expect(text.split('\n')[1]).toContain('Product-minded software generalist');
    expect(text.split('\n')[1]).toContain('jordan.avery@example.com');
  });

  it('round-trips a resume with no headline and a comma-free location', () => {
    const input = [
      '# A Person',
      'a@example.com | +1 555 0111 | Remote',
      '',
      '## SUMMARY',
      'Hi.',
    ].join('\n');
    const original = parseResume(input).resume;
    expect(original.header.headline).toBeUndefined();
    expect(original.contact.location).toBe('Remote');
    expect(parseResume(serializeResume(original)).resume).toEqual(original);
  });
});
