import { useRef, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import type { DocumentKind } from '../types/document';
import type { ApplicationKitOrder } from '../types/applicationKit';

interface ApplicationKitToolbarProps {
  activeKind: DocumentKind;
  order: ApplicationKitOrder;
  onSelect: (kind: DocumentKind) => void;
  onOrder: (order: ApplicationKitOrder) => void;
  onExportCombinedPdf: () => void;
  onExportCombinedDocx: () => void;
  onExportSeparate: (kind: DocumentKind, format: 'pdf' | 'docx') => void;
}

const TABS: { kind: DocumentKind; label: string }[] = [
  { kind: 'resume', label: 'Resume' },
  { kind: 'coverLetter', label: 'Cover Letter' },
];

export function ApplicationKitToolbar({
  activeKind,
  order,
  onSelect,
  onOrder,
  onExportCombinedPdf,
  onExportCombinedDocx,
  onExportSeparate,
}: ApplicationKitToolbarProps) {
  const tabRefs = useRef<Record<DocumentKind, HTMLButtonElement | null>>({
    resume: null,
    coverLetter: null,
  });

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? TABS.length - 1
              : null;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = TABS[nextIndex];
    onSelect(next.kind);
    tabRefs.current[next.kind]?.focus();
  };

  return (
    <section className="kit-bar" aria-label="Application Kit">
      <div className="kit-identity">
        <span className="kit-eyebrow">Application Kit</span>
        <span className="kit-hint">Two coordinated documents</span>
      </div>

      <div className="kit-tabs" role="tablist" aria-label="Application Kit documents">
        {TABS.map((tab, index) => (
          <button
            key={tab.kind}
            ref={(element) => {
              tabRefs.current[tab.kind] = element;
            }}
            type="button"
            role="tab"
            id={`kit-tab-${tab.kind}`}
            className="kit-tab"
            aria-selected={activeKind === tab.kind}
            aria-controls="main"
            tabIndex={activeKind === tab.kind ? 0 : -1}
            onClick={() => onSelect(tab.kind)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="kit-order">
        <label className="formatting-label" htmlFor="kit-document-order">
          Document order
        </label>
        <select
          id="kit-document-order"
          className="select"
          value={order}
          onChange={(event) => onOrder(event.target.value as ApplicationKitOrder)}
        >
          <option value="coverLetterFirst">Cover Letter → Resume</option>
          <option value="resumeFirst">Resume → Cover Letter</option>
        </select>
      </div>

      <div className="kit-export-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={onExportCombinedPdf}
          aria-label="Download combined PDF"
        >
          <Icon name="fileText" />
          <span className="button-label">Combined PDF</span>
        </button>
        <button
          type="button"
          className="button"
          onClick={onExportCombinedDocx}
          aria-label="Download combined Word document"
        >
          <Icon name="fileWord" />
          <span className="button-label">Combined Word</span>
        </button>

        <details className="kit-separate">
          <summary className="button">Download separately</summary>
          <div className="kit-separate-menu" role="group" aria-label="Separate downloads">
            <button type="button" onClick={() => onExportSeparate('resume', 'pdf')}>
              Resume PDF
            </button>
            <button type="button" onClick={() => onExportSeparate('resume', 'docx')}>
              Resume Word
            </button>
            <button type="button" onClick={() => onExportSeparate('coverLetter', 'pdf')}>
              Cover letter PDF
            </button>
            <button type="button" onClick={() => onExportSeparate('coverLetter', 'docx')}>
              Cover letter Word
            </button>
          </div>
        </details>
      </div>
    </section>
  );
}
