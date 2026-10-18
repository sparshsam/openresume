import { describe, expect, it } from 'vitest';
import { parseResume } from '../src/lib/parse';

const SAMPLE = `# Sparsh Example
Product-minded software generalist | sparsh@example.com | +1 555 0100 | Toronto, ON | linkedin.com/in/example | github.com/example

## SUMMARY
Privacy-first builder of calm software. Second sentence stays here.

## EXPERIENCE
### Example Company — Senior Product Engineer
2021 – Present | Toronto, ON
- Shipped a thing that mattered, with 42% fewer steps.
- Led another thing across two teams.

### Earlier Company — Software Engineer
2018 – 2021 | Remote
- Built and maintained the core system.

## EDUCATION
### Example University — B.Sc. Computer Science
2014 – 2018 | Toronto, ON

## SKILLS
Languages: TypeScript, Python, SQL
Product: Discovery, roadmapping, user research

## CERTIFICATIONS
- Example Certification — Issuer, 2024

## SIDE QUEST
A custom section preserved exactly.
`;

describe('parseResume', () => {
  it('parses the name and contact line', () => {
    const { resume, warnings } = parseResume(SAMPLE);
    expect(resume.header.name).toBe('Sparsh Example');
    expect(resume.header.headline).toBe('Product-minded software generalist');
    expect(resume.contact.email).toBe('sparsh@example.com');
    expect(resume.contact.phone).toBe('+1 555 0100');
    expect(resume.contact.location).toBe('Toronto, ON');
    expect(resume.contact.links.map((link) => link.url)).toEqual([
      'https://linkedin.com/in/example',
      'https://github.com/example',
    ]);
    expect(resume.contact.links.map((link) => link.label)).toEqual([
      'linkedin.com/in/example',
      'github.com/example',
    ]);
    expect(warnings).toEqual([]);
  });

  it('maps predefined section aliases to their canonical kinds', () => {
    const input = [
      '# A',
      '',
      '## OBJECTIVE',
      'One line.',
      '## WORK EXPERIENCE',
      '### Co — Role',
      '- Did a thing.',
      '## TECHNICAL SKILLS',
      'Languages: TypeScript',
      '## AWARDS',
      '- A prize.',
      '## LANGUAGES',
      '- English',
      '## VOLUNTEER',
      '### Shelter — Volunteer',
      '- Helped.',
      '## INTERESTS',
      '- Reading',
    ].join('\n');

    const { resume } = parseResume(input);
    expect(resume.sections.map((section) => section.kind)).toEqual([
      'summary',
      'experience',
      'skills',
      'awards',
      'languages',
      'volunteer',
      'interests',
    ]);
  });

  it('preserves a custom section with its original title', () => {
    const { resume } = parseResume(SAMPLE);
    const custom = resume.sections.find((section) => section.kind === 'custom');
    expect(custom?.title).toBe('SIDE QUEST');
    expect(custom?.items[0]?.body).toBe('A custom section preserved exactly.');
  });

  it('parses item headers, metadata, and bullets', () => {
    const { resume } = parseResume(SAMPLE);
    const experience = resume.sections.find((section) => section.kind === 'experience');
    expect(experience?.items).toHaveLength(2);
    const [first] = experience!.items;
    expect(first.title).toBe('Example Company');
    expect(first.subtitle).toBe('Senior Product Engineer');
    expect(first.dateRange).toBe('2021 – Present');
    expect(first.location).toBe('Toronto, ON');
    expect(first.bullets).toEqual([
      'Shipped a thing that mattered, with 42% fewer steps.',
      'Led another thing across two teams.',
    ]);
  });

  it('joins continuation lines into the preceding bullet', () => {
    const input = [
      '# A',
      '',
      '## EXPERIENCE',
      '### Co — Role',
      '- A bullet that spans',
      'two source lines.',
    ].join('\n');
    const { resume } = parseResume(input);
    expect(resume.sections[0]?.items[0]?.bullets).toEqual([
      'A bullet that spans two source lines.',
    ]);
  });

  it('parses skill groups as title and subtitle', () => {
    const { resume } = parseResume(SAMPLE);
    const skills = resume.sections.find((section) => section.kind === 'skills');
    expect(skills?.items[0]).toMatchObject({
      title: 'Languages',
      subtitle: 'TypeScript, Python, SQL',
    });
  });

  it('turns certification bullets into items', () => {
    const { resume } = parseResume(SAMPLE);
    const certifications = resume.sections.find((section) => section.kind === 'certifications');
    expect(certifications?.items[0]?.body).toBe('Example Certification — Issuer, 2024');
    expect(certifications?.items[0]?.bullets).toEqual([]);
  });

  it('returns a valid empty resume for empty input without throwing', () => {
    const { resume, warnings } = parseResume('   \n\n');
    expect(resume.header.name).toBe('');
    expect(resume.sections).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('preserves punctuation, capitalization, and spacing inside content', () => {
    const input = [
      '#  Ada Lovelace ',
      '## SUMMARY',
      'I build things — carefully, and with  Two  spaces.',
    ].join('\n');
    const { resume } = parseResume(input);
    expect(resume.header.name).toBe('Ada Lovelace');
    expect(resume.sections[0]?.items[0]?.body).toBe(
      'I build things — carefully, and with  Two  spaces.',
    );
  });

  it('assigns stable ids across repeated parses', () => {
    const first = parseResume(SAMPLE).resume;
    const second = parseResume(SAMPLE).resume;
    expect(second).toEqual(first);
  });
});
