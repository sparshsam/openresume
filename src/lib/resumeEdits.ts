import {
  DEFAULT_FORMAT,
  DEFAULT_TEMPLATE,
  type FormatSettings,
  type Resume,
  type ResumeItem,
  type ResumeSection,
  type ResumeTemplate,
  type SectionKind,
} from '../types/resume';

let counter = 0;

function newId(prefix: string): string {
  counter += 1;
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}-${counter}`;
}

export const SECTION_DEFAULTS: Record<SectionKind, { title: string; column: 'main' | 'side' }> = {
  summary: { title: 'SUMMARY', column: 'main' },
  experience: { title: 'EXPERIENCE', column: 'main' },
  education: { title: 'EDUCATION', column: 'side' },
  skills: { title: 'SKILLS', column: 'side' },
  projects: { title: 'PROJECTS', column: 'main' },
  certifications: { title: 'CERTIFICATIONS', column: 'side' },
  awards: { title: 'AWARDS', column: 'side' },
  languages: { title: 'LANGUAGES', column: 'side' },
  volunteer: { title: 'VOLUNTEER', column: 'main' },
  interests: { title: 'INTERESTS', column: 'side' },
  custom: { title: 'NEW SECTION', column: 'main' },
};

export function updateSection(
  resume: Resume,
  sectionId: string,
  patch: Partial<ResumeSection>,
): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId ? { ...section, ...patch } : section,
    ),
  };
}

export function moveSection(resume: Resume, sectionId: string, direction: -1 | 1): Resume {
  const index = resume.sections.findIndex((section) => section.id === sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= resume.sections.length) return resume;
  const sections = [...resume.sections];
  [sections[index], sections[target]] = [sections[target], sections[index]];
  return { ...resume, sections };
}

export function addSection(resume: Resume, kind: SectionKind = 'custom'): Resume {
  const defaults = SECTION_DEFAULTS[kind];
  const section: ResumeSection = {
    id: newId('sec'),
    kind,
    title: defaults.title,
    column: defaults.column,
    enabled: true,
    items: [],
  };
  return { ...resume, sections: [...resume.sections, section] };
}

export function removeSection(resume: Resume, sectionId: string): Resume {
  return { ...resume, sections: resume.sections.filter((section) => section.id !== sectionId) };
}

export function updateItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  patch: Partial<ResumeItem>,
): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
          }
        : section,
    ),
  };
}

export function addItem(resume: Resume, sectionId: string): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId
        ? { ...section, items: [...section.items, { id: newId('item'), bullets: [] }] }
        : section,
    ),
  };
}

export function removeItem(resume: Resume, sectionId: string, itemId: string): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId
        ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
        : section,
    ),
  };
}

export function updateBullet(
  resume: Resume,
  sectionId: string,
  itemId: string,
  index: number,
  value: string,
): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId
                ? { ...item, bullets: item.bullets.map((b, i) => (i === index ? value : b)) }
                : item,
            ),
          }
        : section,
    ),
  };
}

export function addBullet(resume: Resume, sectionId: string, itemId: string): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, bullets: [...item.bullets, ''] } : item,
            ),
          }
        : section,
    ),
  };
}

export function removeBullet(
  resume: Resume,
  sectionId: string,
  itemId: string,
  index: number,
): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId
                ? { ...item, bullets: item.bullets.filter((_, i) => i !== index) }
                : item,
            ),
          }
        : section,
    ),
  };
}

export function updateTemplate(resume: Resume, patch: Partial<ResumeTemplate>): Resume {
  return { ...resume, template: { ...resume.template, ...patch } };
}

export function updateFormat(resume: Resume, patch: Partial<FormatSettings>): Resume {
  return updateTemplate(resume, {
    format: { ...resume.template.format, ...patch },
  });
}

export function resetTemplate(resume: Resume): Resume {
  return {
    ...resume,
    template: { ...DEFAULT_TEMPLATE, format: { ...DEFAULT_FORMAT } },
  };
}

export function updateHeader(resume: Resume, patch: Partial<Resume['header']>): Resume {
  return { ...resume, header: { ...resume.header, ...patch } };
}

export function updateContact(resume: Resume, patch: Partial<Resume['contact']>): Resume {
  return { ...resume, contact: { ...resume.contact, ...patch } };
}
