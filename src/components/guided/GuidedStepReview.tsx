import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import { CoverLetterEditor } from '../CoverLetterEditor';
import { EditorPanel, type FocusTarget } from '../EditorPanel';
import { FormattingPanel } from '../FormattingPanel';
import { Preview } from '../Preview';
import type { ToastTone } from '../ToastRegion';
import {
  addBodyParagraph,
  removeBodyParagraph,
  resetLetterTemplate,
  updateApplicant,
  updateApplicantContact,
  updateBodyParagraph,
  updateLetter,
  updateLetterFormat,
  updateLetterTemplate,
} from '../../lib/coverLetterEdits';
import { layoutCoverLetter } from '../../lib/coverLetterLayout';
import { downloadBlob } from '../../lib/download';
import { resumeMeta, coverLetterMeta } from '../../lib/documentMeta';
import { guidedFilename } from '../../lib/filename';
import { layoutResume } from '../../lib/layout';
import { resolveCoverLetterStyle, resumeDesignName, suggestedLetterStyle } from '../../lib/designs';
import {
  addBullet,
  addItem,
  addSection,
  moveSection,
  removeBullet,
  removeItem,
  removeSection,
  reorderSection,
  resetTemplate,
  updateBullet,
  updateContact,
  updateFormat,
  updateHeader,
  updateItem,
  updateSection,
  updateTemplate,
} from '../../lib/resumeEdits';
import type { JobContext } from '../../lib/jobContext';
import type { CoverLetter } from '../../types/coverLetter';
import type { DocumentKind } from '../../types/document';
import type {
  CoverLetterStyleId,
  FormatSettings,
  PageSize,
  PaginationSettings,
  Resume,
  ResumeItem,
  ResumeLayoutId,
  ResumeSection,
  SectionKind,
} from '../../types/resume';

interface GuidedStepReviewProps {
  resume: Resume;
  coverLetter: CoverLetter | null;
  job: JobContext;
  warnings: string[];
  onResume: Dispatch<SetStateAction<Resume>>;
  onCoverLetter: Dispatch<SetStateAction<CoverLetter>>;
  onBack: () => void;
  onContinue: () => void;
  notify: (message: string, tone?: ToastTone) => void;
}

export function GuidedStepReview({
  resume,
  coverLetter,
  job,
  warnings,
  onResume,
  onCoverLetter,
  onBack,
  onContinue,
  notify,
}: GuidedStepReviewProps) {
  const [activeKind, setActiveKind] = useState<DocumentKind>('resume');
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const tabRefs = useRef<Record<DocumentKind, HTMLButtonElement | null>>({
    resume: null,
    coverLetter: null,
  });

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!coverLetter) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next: DocumentKind =
      event.key === 'ArrowLeft' || event.key === 'Home' ? 'resume' : 'coverLetter';
    setActiveKind(next);
    setFormattingOpen(false);
    setFocusTarget(null);
    tabRefs.current[next]?.focus();
  };

  const resumeLayout = useMemo(() => layoutResume(resume), [resume]);
  const coverLetterLayout = useMemo(
    () => (coverLetter ? layoutCoverLetter(coverLetter) : null),
    [coverLetter],
  );
  const activeTemplate = activeKind === 'resume' ? resume.template : coverLetter?.template;
  const layout = activeKind === 'resume' ? resumeLayout : coverLetterLayout;
  const activeCoverLetter = activeKind === 'coverLetter' ? coverLetter : null;
  const letterSuggestion = coverLetter
    ? {
        suggestedLetterStyle: suggestedLetterStyle(resume.template.layout),
        suggestionSourceName: resumeDesignName(resume.template.layout),
      }
    : undefined;

  const download = async (kind: DocumentKind, format: 'pdf' | 'docx') => {
    const documentLayout = kind === 'resume' ? resumeLayout : coverLetterLayout;
    if (!documentLayout) return;
    const name = kind === 'resume' ? resume.header.name : (coverLetter?.applicant.name ?? '');
    const filename = guidedFilename(name, job.title ?? '', kind, format);
    try {
      if (format === 'pdf') {
        const { createPdfDocument } = await import('../../lib/exportPdf');
        createPdfDocument(
          kind === 'resume' ? resumeMeta(resume) : coverLetterMeta(coverLetter!),
          documentLayout,
        ).save(filename);
      } else {
        const { exportDocx, exportCoverLetterDocx } = await import('../../lib/exportDocx');
        const blob =
          kind === 'resume'
            ? await exportDocx(resume, documentLayout)
            : await exportCoverLetterDocx(coverLetter!, documentLayout);
        downloadBlob(blob, filename);
      }
      notify(
        `${kind === 'resume' ? 'Résumé' : 'Cover letter'} downloaded as ${format.toUpperCase()}.`,
      );
    } catch {
      notify('Download failed. Please try again.', 'error');
    }
  };

  const downloadBoth = async (kind: DocumentKind) => {
    await download(kind, 'pdf');
    await download(kind, 'docx');
  };

  const sectionHandlers = {
    onAddSection: (kind: SectionKind) => onResume((current) => addSection(current, kind)),
    onUpdateSection: (sectionId: string, patch: Partial<ResumeSection>) =>
      onResume((current) => updateSection(current, sectionId, patch)),
    onRemoveSection: (sectionId: string) =>
      onResume((current) => removeSection(current, sectionId)),
    onMoveSection: (sectionId: string, direction: -1 | 1) =>
      onResume((current) => moveSection(current, sectionId, direction)),
    onReorderSections: (sourceId: string, targetId: string) =>
      onResume((current) => reorderSection(current, sourceId, targetId)),
    onAddItem: (sectionId: string) => onResume((current) => addItem(current, sectionId)),
    onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ResumeItem>) =>
      onResume((current) => updateItem(current, sectionId, itemId, patch)),
    onRemoveItem: (sectionId: string, itemId: string) =>
      onResume((current) => removeItem(current, sectionId, itemId)),
    onAddBullet: (sectionId: string, itemId: string) =>
      onResume((current) => addBullet(current, sectionId, itemId)),
    onUpdateBullet: (sectionId: string, itemId: string, bulletIndex: number, value: string) =>
      onResume((current) => updateBullet(current, sectionId, itemId, bulletIndex, value)),
    onRemoveBullet: (sectionId: string, itemId: string, bulletIndex: number) =>
      onResume((current) => removeBullet(current, sectionId, itemId, bulletIndex)),
  };

  const handlePageSize = (pageSize: PageSize) => {
    if (activeKind === 'resume') onResume((current) => updateTemplate(current, { pageSize }));
    else onCoverLetter((current) => updateLetterTemplate(current, { pageSize }));
  };

  const handleLayout = (layoutId: ResumeLayoutId) => {
    onResume((current) => updateTemplate(current, { layout: layoutId }));
  };

  const handleLetterStyle = (letterStyle: CoverLetterStyleId) => {
    onCoverLetter((current) => updateLetterTemplate(current, { letterStyle }));
  };

  const handleFormat = (patch: Partial<FormatSettings>) => {
    if (activeKind === 'resume') onResume((current) => updateFormat(current, patch));
    else onCoverLetter((current) => updateLetterFormat(current, patch));
  };

  const handlePagination = (patch: Partial<PaginationSettings>) => {
    if (activeKind === 'resume') {
      onResume((current) =>
        updateTemplate(current, {
          pagination: { ...current.template.pagination, ...patch },
        }),
      );
    } else {
      onCoverLetter((current) =>
        updateLetterTemplate(current, {
          pagination: { ...current.template.pagination, ...patch },
        }),
      );
    }
  };

  const handleAccent = (accent: string) => {
    if (activeKind === 'resume') onResume((current) => updateTemplate(current, { accent }));
    else onCoverLetter((current) => updateLetterTemplate(current, { accent }));
  };

  const handleReset = () => {
    if (activeKind === 'resume') onResume((current) => resetTemplate(current));
    else onCoverLetter((current) => resetLetterTemplate(current));
    notify('Formatting reset to defaults.');
  };

  const documentLabel = activeKind === 'resume' ? 'résumé' : 'cover letter';
  const selectedLetterStyle = coverLetter
    ? resolveCoverLetterStyle(coverLetter.template.letterStyle)
    : null;

  return (
    <div className="guided-review">
      <div className="guided-review-toolbar">
        <div className="guided-doc-tabs" role="tablist" aria-label="Documents">
          <button
            ref={(node) => {
              tabRefs.current.resume = node;
            }}
            type="button"
            role="tab"
            id="guided-doc-tab-resume"
            aria-selected={activeKind === 'resume'}
            aria-controls="guided-doc-panel"
            tabIndex={activeKind === 'resume' ? 0 : -1}
            onKeyDown={handleTabKey}
            onClick={() => {
              setActiveKind('resume');
              setFormattingOpen(false);
              setFocusTarget(null);
            }}
          >
            Résumé
          </button>
          {coverLetter ? (
            <button
              ref={(node) => {
                tabRefs.current.coverLetter = node;
              }}
              type="button"
              role="tab"
              id="guided-doc-tab-cover"
              aria-selected={activeKind === 'coverLetter'}
              aria-controls="guided-doc-panel"
              tabIndex={activeKind === 'coverLetter' ? 0 : -1}
              onKeyDown={handleTabKey}
              onClick={() => {
                setActiveKind('coverLetter');
                setFormattingOpen(false);
                setFocusTarget(null);
              }}
            >
              Cover letter
            </button>
          ) : null}
        </div>

        <span className="guided-page-count">
          {layout ? `${layout.pages.length} ${layout.pages.length === 1 ? 'page' : 'pages'}` : ''}
        </span>

        <div className="guided-toolbar-actions">
          <button
            type="button"
            className="button button-small"
            aria-expanded={formattingOpen}
            aria-controls="formatting-panel"
            onClick={() => setFormattingOpen((open) => !open)}
          >
            Format
          </button>
          <button
            type="button"
            className="button button-small"
            onClick={() => void download(activeKind, 'pdf')}
            aria-label={`Download ${documentLabel} as PDF`}
          >
            PDF
          </button>
          <button
            type="button"
            className="button button-small"
            onClick={() => void download(activeKind, 'docx')}
            aria-label={`Download ${documentLabel} as Word`}
          >
            Word
          </button>
          <button
            type="button"
            className="button button-small button-export"
            onClick={() => void downloadBoth(activeKind)}
            aria-label={`Download ${documentLabel} in both formats`}
          >
            Both formats
          </button>
        </div>
      </div>

      {coverLetter ? (
        <p className="guided-download-note">
          Use the document tabs to download the résumé and cover letter separately. The other
          document is not included in this download.
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <details className="guided-warning-panel">
          <summary>
            {warnings.length} review {warnings.length === 1 ? 'note' : 'notes'}
          </summary>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <div
        className="guided-review-workspace"
        id="guided-doc-panel"
        role="tabpanel"
        aria-labelledby={activeKind === 'resume' ? 'guided-doc-tab-resume' : 'guided-doc-tab-cover'}
      >
        {activeKind === 'resume' ? (
          <EditorPanel
            resume={resume}
            focusTarget={focusTarget}
            onHeader={(patch) => onResume((current) => updateHeader(current, patch))}
            onContact={(patch) => onResume((current) => updateContact(current, patch))}
            {...sectionHandlers}
          />
        ) : activeCoverLetter ? (
          <CoverLetterEditor
            letter={activeCoverLetter}
            focusTarget={focusTarget}
            onApplicant={(patch) => onCoverLetter((current) => updateApplicant(current, patch))}
            onContact={(patch) =>
              onCoverLetter((current) => updateApplicantContact(current, patch))
            }
            onLetter={(patch) => onCoverLetter((current) => updateLetter(current, patch))}
            onBodyParagraph={(index, value) =>
              onCoverLetter((current) => updateBodyParagraph(current, index, value))
            }
            onAddParagraph={() => onCoverLetter((current) => addBodyParagraph(current))}
            onRemoveParagraph={(index) =>
              onCoverLetter((current) => removeBodyParagraph(current, index))
            }
          />
        ) : null}
        {layout ? (
          <Preview
            layout={layout}
            onFocusTarget={(sectionId, itemId) =>
              setFocusTarget({ sectionId, itemId, nonce: Date.now() })
            }
          />
        ) : null}
      </div>

      <div className="guided-review-footer">
        <button type="button" className="button" onClick={onBack}>
          ← Back
        </button>
        <p className="guided-muted guided-footer-note">
          {selectedLetterStyle ? `Letter style: ${selectedLetterStyle.name}. ` : ''}
          Downloads are generated in your browser.
        </p>
        <button type="button" className="button button-primary guided-primary" onClick={onContinue}>
          Continue to application →
        </button>
      </div>

      {formattingOpen && activeTemplate ? (
        <FormattingPanel
          kind={activeKind}
          template={activeTemplate}
          onPageSize={handlePageSize}
          onLayout={handleLayout}
          onLetterStyle={handleLetterStyle}
          onFormat={handleFormat}
          onPagination={handlePagination}
          onAccent={handleAccent}
          onReset={handleReset}
          onClose={() => setFormattingOpen(false)}
          {...(activeKind === 'coverLetter' ? letterSuggestion : {})}
        />
      ) : null}
    </div>
  );
}
