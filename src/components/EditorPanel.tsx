import { useEffect, useState } from 'react';
import { SectionEditor } from './SectionEditor';
import { linksToText, textToLinks } from '../lib/links';
import type { Resume, ResumeItem, ResumeSection, SectionKind } from '../types/resume';

const ADDABLE_SECTIONS: { kind: SectionKind; label: string }[] = [
  { kind: 'custom', label: 'Custom section' },
  { kind: 'experience', label: 'Experience' },
  { kind: 'education', label: 'Education' },
  { kind: 'skills', label: 'Skills' },
  { kind: 'projects', label: 'Projects' },
  { kind: 'certifications', label: 'Certifications' },
  { kind: 'awards', label: 'Awards' },
  { kind: 'languages', label: 'Languages' },
  { kind: 'volunteer', label: 'Volunteer' },
  { kind: 'interests', label: 'Interests' },
  { kind: 'summary', label: 'Summary' },
];

export interface FocusTarget {
  sectionId: string;
  itemId?: string;
  nonce: number;
}

interface EditorPanelProps {
  resume: Resume;
  focusTarget: FocusTarget | null;
  onHeader: (patch: Partial<Resume['header']>) => void;
  onContact: (patch: Partial<Resume['contact']>) => void;
  onAddSection: (kind: SectionKind) => void;
  onUpdateSection: (sectionId: string, patch: Partial<ResumeSection>) => void;
  onRemoveSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ResumeItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onAddBullet: (sectionId: string, itemId: string) => void;
  onUpdateBullet: (sectionId: string, itemId: string, bulletIndex: number, value: string) => void;
  onRemoveBullet: (sectionId: string, itemId: string, bulletIndex: number) => void;
  onCreateMatchingCoverLetter?: () => void;
}

export function EditorPanel({
  resume,
  focusTarget,
  onHeader,
  onContact,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
  onCreateMatchingCoverLetter,
}: EditorPanelProps) {
  const [newSectionKind, setNewSectionKind] = useState<SectionKind>('custom');

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget.sectionId === '__header__') {
      const name = document.getElementById('identity-name');
      name?.focus();
      name?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return;
    }

    const root = document.getElementById(`section-${focusTarget.sectionId}`);
    if (!root) return;
    root.scrollIntoView?.({ block: 'center', behavior: 'smooth' });

    if (focusTarget.itemId) {
      const item = document.getElementById(`item-${focusTarget.sectionId}-${focusTarget.itemId}`);
      const field = item?.querySelector<HTMLElement>('input, textarea, select');
      field?.focus({ preventScroll: true });
      return;
    }

    const title = root.querySelector<HTMLElement>('.section-title-input');
    title?.focus({ preventScroll: true });
  }, [focusTarget]);

  return (
    <aside className="editor" id="editor" aria-label="Resume editor">
      <section className="field-group" id="section-__header__" aria-labelledby="identity-heading">
        <h2 className="editor-heading" id="identity-heading">
          Identity
        </h2>
        <div className="field">
          <label className="field-label" htmlFor="identity-name">
            Name
          </label>
          <input
            id="identity-name"
            className="input"
            value={resume.header.name}
            onChange={(event) => onHeader({ name: event.target.value })}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="identity-headline">
            Headline
          </label>
          <input
            id="identity-headline"
            className="input"
            value={resume.header.headline ?? ''}
            onChange={(event) => onHeader({ headline: event.target.value || undefined })}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="identity-email">
              Email
            </label>
            <input
              id="identity-email"
              className="input"
              type="email"
              value={resume.contact.email ?? ''}
              onChange={(event) => onContact({ email: event.target.value || undefined })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="identity-phone">
              Phone
            </label>
            <input
              id="identity-phone"
              className="input"
              value={resume.contact.phone ?? ''}
              onChange={(event) => onContact({ phone: event.target.value || undefined })}
            />
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="identity-location">
            Location
          </label>
          <input
            id="identity-location"
            className="input"
            value={resume.contact.location ?? ''}
            onChange={(event) => onContact({ location: event.target.value || undefined })}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="identity-links">
            Links, one per line as “label | url”
          </label>
          <textarea
            id="identity-links"
            className="textarea"
            rows={3}
            value={linksToText(resume.contact.links)}
            onChange={(event) => onContact({ links: textToLinks(event.target.value) })}
          />
        </div>
        {onCreateMatchingCoverLetter ? (
          <button
            type="button"
            className="button button-small button-ghost editor-back"
            onClick={onCreateMatchingCoverLetter}
          >
            Create matching cover letter →
          </button>
        ) : null}
      </section>

      <h2 className="editor-heading">Sections</h2>

      {resume.sections.map((section, index) => (
        <SectionEditor
          key={section.id}
          section={section}
          index={index}
          total={resume.sections.length}
          showColumn={resume.template.layout !== 'atsSimple'}
          onUpdate={(patch) => onUpdateSection(section.id, patch)}
          onRemove={() => onRemoveSection(section.id)}
          onMove={(direction) => onMoveSection(section.id, direction)}
          onAddItem={() => onAddItem(section.id)}
          onUpdateItem={(itemId, patch) => onUpdateItem(section.id, itemId, patch)}
          onRemoveItem={(itemId) => onRemoveItem(section.id, itemId)}
          onAddBullet={(itemId) => onAddBullet(section.id, itemId)}
          onUpdateBullet={(itemId, bulletIndex, value) =>
            onUpdateBullet(section.id, itemId, bulletIndex, value)
          }
          onRemoveBullet={(itemId, bulletIndex) => onRemoveBullet(section.id, itemId, bulletIndex)}
        />
      ))}

      <div className="add-section-row">
        <select
          className="select"
          aria-label="Section type to add"
          value={newSectionKind}
          onChange={(event) => setNewSectionKind(event.target.value as SectionKind)}
        >
          {ADDABLE_SECTIONS.map((option) => (
            <option key={option.kind} value={option.kind}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button button-small"
          onClick={() => onAddSection(newSectionKind)}
        >
          Add section
        </button>
      </div>
    </aside>
  );
}
