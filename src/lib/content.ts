import type { Resume } from '../types/resume';

export function collectContentStrings(resume: Resume): string[] {
  const values: string[] = [];
  const push = (value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) values.push(trimmed);
  };

  push(resume.header.name);
  push(resume.header.headline);
  push(resume.contact.email);
  push(resume.contact.phone);
  push(resume.contact.location);
  for (const link of resume.contact.links) push(link.label);

  for (const section of resume.sections) {
    if (!section.enabled) continue;
    push(section.title.toUpperCase());
    for (const item of section.items) {
      push(item.title);
      push(item.subtitle);
      push(item.dateRange);
      push(item.location);
      push(item.body);
      for (const bullet of item.bullets) push(bullet);
    }
  }

  return values;
}
