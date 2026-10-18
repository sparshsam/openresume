import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CoverLetterEditor } from './components/CoverLetterEditor';
import { EditorPanel, type FocusTarget } from './components/EditorPanel';
import { Footer } from './components/Footer';
import { FormattingPanel } from './components/FormattingPanel';
import { Header } from './components/Header';
import { AboutPage, PrivacyPage, TermsPage } from './components/InfoPages';
import { LandingPage } from './components/LandingPage';
import { PrepareScreen } from './components/PrepareScreen';
import { Preview } from './components/Preview';
import { ToastRegion, type ToastItem, type ToastTone } from './components/ToastRegion';
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
} from './lib/coverLetterEdits';
import { layoutCoverLetter } from './lib/coverLetterLayout';
import { buildCoverLetterScaffold } from './lib/coverLetterScaffold';
import { coverLetterMeta, resumeMeta } from './lib/documentMeta';
import { documentFilename } from './lib/filename';
import { layoutResume } from './lib/layout';
import { applyPageMeta, infoPageFromPath, navigate, type InfoPageKey } from './lib/publicPages';
import { clearLegacyDrafts } from './lib/storage';
import {
  addBullet,
  addItem,
  addSection,
  moveSection,
  removeBullet,
  removeItem,
  removeSection,
  resetTemplate,
  updateBullet,
  updateContact,
  updateFormat,
  updateHeader,
  updateItem,
  updateSection,
  updateTemplate,
} from './lib/resumeEdits';
import type { CoverLetter } from './types/coverLetter';
import type { DocumentKind } from './types/document';
import type {
  FormatSettings,
  PageSize,
  Resume,
  ResumeItem,
  ResumeSection,
  SectionKind,
} from './types/resume';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

type View = 'landing' | 'prepare' | 'workspace';

interface PrepareBack {
  view: 'landing' | 'workspace';
  kind: DocumentKind;
}

export default function App() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);

  const [view, setView] = useState<View>('landing');
  const [infoPage, setInfoPage] = useState<InfoPageKey | null>(() =>
    infoPageFromPath(window.location.pathname),
  );
  const [activeKind, setActiveKind] = useState<DocumentKind>('resume');
  const [prepareNonce, setPrepareNonce] = useState(0);
  const [prepareText, setPrepareText] = useState<string | undefined>(undefined);
  const [prepareFromResume, setPrepareFromResume] = useState(false);
  const [prepareBack, setPrepareBack] = useState<PrepareBack>({
    view: 'landing',
    kind: 'resume',
  });
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(0);

  const activeTemplate = activeKind === 'resume' ? resume?.template : coverLetter?.template;

  const layout = useMemo(() => {
    if (activeKind === 'resume' && resume) return layoutResume(resume);
    if (activeKind === 'coverLetter' && coverLetter) {
      return layoutCoverLetter(coverLetter);
    }
    return null;
  }, [activeKind, resume, coverLetter]);

  useEffect(() => {
    clearLegacyDrafts();
  }, []);

  useEffect(() => {
    const syncInfoPage = () => setInfoPage(infoPageFromPath(window.location.pathname));
    window.addEventListener('popstate', syncInfoPage);
    return () => window.removeEventListener('popstate', syncInfoPage);
  }, []);

  useEffect(() => {
    applyPageMeta(infoPage);
  }, [infoPage]);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    nextToastId.current += 1;
    const toast = { id: nextToastId.current, message, tone };
    setToasts((current) => [...current.slice(-2), toast]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const onFocusTarget = useCallback((sectionId: string, itemId?: string) => {
    setFocusTarget({ sectionId, itemId, nonce: Date.now() });
  }, []);

  const openPrepare = (
    kind: DocumentKind,
    back: PrepareBack,
    text?: string,
    reusedFromResume = false,
  ) => {
    setActiveKind(kind);
    setPrepareText(text);
    setPrepareFromResume(reusedFromResume);
    setPrepareBack(back);
    setPrepareNonce((value) => value + 1);
    setFormattingOpen(false);
    setFocusTarget(null);
    setView('prepare');
  };

  const openWorkspace = (kind: DocumentKind) => {
    setActiveKind(kind);
    setFormattingOpen(false);
    setFocusTarget(null);
    setView('workspace');
  };

  const goHome = () => {
    navigate('/');
    setView('landing');
    setFormattingOpen(false);
    setFocusTarget(null);
  };

  const handleNew = () => {
    const exists = activeKind === 'resume' ? Boolean(resume) : Boolean(coverLetter);
    openPrepare(activeKind, {
      view: exists ? 'workspace' : 'landing',
      kind: activeKind,
    });
  };

  const handlePrepareBack = () => {
    if (prepareBack.view === 'workspace') {
      const targetExists = prepareBack.kind === 'resume' ? Boolean(resume) : Boolean(coverLetter);
      if (targetExists) {
        setActiveKind(prepareBack.kind);
        setView('workspace');
        return;
      }
    }
    setView('landing');
  };

  const handleBuildResume = (next: Resume, warnings: string[]) => {
    setResume((current) => ({
      ...next,
      template: current?.template ?? next.template,
    }));
    setActiveKind('resume');
    setView('workspace');
    notify(
      warnings.length > 0
        ? `Resume built with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
        : 'Resume built.',
    );
  };

  const handleBuildCoverLetter = (next: CoverLetter, warnings: string[]) => {
    setCoverLetter((current) => ({
      ...next,
      template: current?.template ?? resume?.template ?? next.template,
    }));
    setActiveKind('coverLetter');
    setView('workspace');
    notify(
      warnings.length > 0
        ? `Cover letter built with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
        : 'Cover letter built.',
    );
  };

  const handleCreateMatchingCoverLetter = () => {
    if (!resume) return;
    openPrepare(
      'coverLetter',
      { view: 'workspace', kind: 'resume' },
      buildCoverLetterScaffold(resume),
      true,
    );
  };

  const handleBackToResume = () => {
    setActiveKind('resume');
    setView('workspace');
    setFormattingOpen(false);
    setFocusTarget(null);
  };

  const handlePageSize = (pageSize: PageSize) => {
    if (activeKind === 'resume') {
      setResume((current) => (current ? updateTemplate(current, { pageSize }) : current));
    } else {
      setCoverLetter((current) =>
        current ? updateLetterTemplate(current, { pageSize }) : current,
      );
    }
  };

  const handleFormat = (patch: Partial<FormatSettings>) => {
    if (activeKind === 'resume') {
      setResume((current) => (current ? updateFormat(current, patch) : current));
    } else {
      setCoverLetter((current) => (current ? updateLetterFormat(current, patch) : current));
    }
  };

  const handleAccent = (accent: string) => {
    if (activeKind === 'resume') {
      setResume((current) => (current ? updateTemplate(current, { accent }) : current));
    } else {
      setCoverLetter((current) => (current ? updateLetterTemplate(current, { accent }) : current));
    }
  };

  const handleResetFormatting = () => {
    if (activeKind === 'resume') {
      setResume((current) => (current ? resetTemplate(current) : current));
    } else {
      setCoverLetter((current) => (current ? resetLetterTemplate(current) : current));
    }
    notify('Formatting reset to defaults.');
  };

  const handleExportPdf = async () => {
    if (!layout) return;
    try {
      const { exportPdf } = await import('./lib/exportPdf');
      if (activeKind === 'resume' && resume) {
        exportPdf(resumeMeta(resume), layout);
      } else if (coverLetter) {
        exportPdf(coverLetterMeta(coverLetter), layout);
      }
      notify('PDF exported.');
    } catch {
      notify('PDF export failed.', 'error');
    }
  };

  const handleExportDocx = async () => {
    if (!layout) return;
    try {
      if (activeKind === 'resume' && resume) {
        const { exportDocx } = await import('./lib/exportDocx');
        const blob = await exportDocx(resume, layout);
        downloadBlob(blob, documentFilename(resume.header.name, 'resume', 'docx'));
      } else if (coverLetter) {
        const { exportCoverLetterDocx } = await import('./lib/exportDocx');
        const blob = await exportCoverLetterDocx(coverLetter, layout);
        downloadBlob(blob, documentFilename(coverLetter.applicant.name, 'coverLetter', 'docx'));
      }
      notify('Word document exported.');
    } catch {
      notify('Word export failed.', 'error');
    }
  };

  const sectionHandlers = {
    onAddSection: (kind: SectionKind) =>
      setResume((current) => (current ? addSection(current, kind) : current)),
    onUpdateSection: (sectionId: string, patch: Partial<ResumeSection>) =>
      setResume((current) => (current ? updateSection(current, sectionId, patch) : current)),
    onRemoveSection: (sectionId: string) =>
      setResume((current) => (current ? removeSection(current, sectionId) : current)),
    onMoveSection: (sectionId: string, direction: -1 | 1) =>
      setResume((current) => (current ? moveSection(current, sectionId, direction) : current)),
    onAddItem: (sectionId: string) =>
      setResume((current) => (current ? addItem(current, sectionId) : current)),
    onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ResumeItem>) =>
      setResume((current) => (current ? updateItem(current, sectionId, itemId, patch) : current)),
    onRemoveItem: (sectionId: string, itemId: string) =>
      setResume((current) => (current ? removeItem(current, sectionId, itemId) : current)),
    onAddBullet: (sectionId: string, itemId: string) =>
      setResume((current) => (current ? addBullet(current, sectionId, itemId) : current)),
    onUpdateBullet: (sectionId: string, itemId: string, bulletIndex: number, value: string) =>
      setResume((current) =>
        current ? updateBullet(current, sectionId, itemId, bulletIndex, value) : current,
      ),
    onRemoveBullet: (sectionId: string, itemId: string, bulletIndex: number) =>
      setResume((current) =>
        current ? removeBullet(current, sectionId, itemId, bulletIndex) : current,
      ),
  };

  const hasActiveDocument = activeKind === 'resume' ? Boolean(resume) : Boolean(coverLetter);
  const renderView: View = view === 'workspace' && !hasActiveDocument ? 'landing' : view;
  const showingInfo = infoPage !== null;
  const headerView: View = showingInfo ? 'landing' : renderView;

  const skipTarget = showingInfo
    ? '#main'
    : renderView === 'landing'
      ? '#main'
      : renderView === 'prepare'
        ? '#prepare-text'
        : '#editor';

  return (
    <div className="app">
      <a className="skip-link" href={skipTarget}>
        {renderView === 'workspace' && !showingInfo ? 'Skip to editor' : 'Skip to main content'}
      </a>

      <Header
        view={headerView}
        kind={headerView === 'workspace' ? activeKind : null}
        formattingOpen={formattingOpen}
        onHome={goHome}
        onNew={handleNew}
        onToggleFormatting={() => setFormattingOpen((open) => !open)}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
      />

      {infoPage === 'about' ? (
        <AboutPage />
      ) : infoPage === 'privacy' ? (
        <PrivacyPage />
      ) : infoPage === 'terms' ? (
        <TermsPage />
      ) : renderView === 'landing' ? (
        <LandingPage
          hasResume={Boolean(resume)}
          hasCoverLetter={Boolean(coverLetter)}
          onResume={() => openPrepare('resume', { view: 'landing', kind: 'resume' })}
          onCoverLetter={() => openPrepare('coverLetter', { view: 'landing', kind: 'coverLetter' })}
          onOpenResume={() => openWorkspace('resume')}
          onOpenCoverLetter={() => openWorkspace('coverLetter')}
        />
      ) : renderView === 'prepare' ? (
        <PrepareScreen
          key={`${activeKind}-${prepareNonce}`}
          kind={activeKind}
          initialText={prepareText}
          reusedFromResume={prepareFromResume}
          resumeScaffold={
            activeKind === 'coverLetter' && resume ? buildCoverLetterScaffold(resume) : undefined
          }
          onBuildResume={handleBuildResume}
          onBuildCoverLetter={handleBuildCoverLetter}
          onNotify={notify}
          onBack={handlePrepareBack}
        />
      ) : (
        <>
          {formattingOpen && activeTemplate ? (
            <FormattingPanel
              kind={activeKind}
              template={activeTemplate}
              onPageSize={handlePageSize}
              onFormat={handleFormat}
              onAccent={handleAccent}
              onReset={handleResetFormatting}
            />
          ) : null}

          <main className="workspace" id="main">
            {activeKind === 'resume' && resume ? (
              <>
                <EditorPanel
                  resume={resume}
                  focusTarget={focusTarget}
                  onHeader={(patch) =>
                    setResume((current) => (current ? updateHeader(current, patch) : current))
                  }
                  onContact={(patch) =>
                    setResume((current) => (current ? updateContact(current, patch) : current))
                  }
                  onCreateMatchingCoverLetter={handleCreateMatchingCoverLetter}
                  {...sectionHandlers}
                />
                {layout ? <Preview layout={layout} onFocusTarget={onFocusTarget} /> : null}
              </>
            ) : coverLetter ? (
              <>
                <CoverLetterEditor
                  letter={coverLetter}
                  focusTarget={focusTarget}
                  onApplicant={(patch) =>
                    setCoverLetter((current) =>
                      current ? updateApplicant(current, patch) : current,
                    )
                  }
                  onContact={(patch) =>
                    setCoverLetter((current) =>
                      current ? updateApplicantContact(current, patch) : current,
                    )
                  }
                  onLetter={(patch) =>
                    setCoverLetter((current) => (current ? updateLetter(current, patch) : current))
                  }
                  onBodyParagraph={(index, value) =>
                    setCoverLetter((current) =>
                      current ? updateBodyParagraph(current, index, value) : current,
                    )
                  }
                  onAddParagraph={() =>
                    setCoverLetter((current) => (current ? addBodyParagraph(current) : current))
                  }
                  onRemoveParagraph={(index) =>
                    setCoverLetter((current) =>
                      current ? removeBodyParagraph(current, index) : current,
                    )
                  }
                  onBackToResume={resume ? handleBackToResume : undefined}
                />
                {layout ? <Preview layout={layout} onFocusTarget={onFocusTarget} /> : null}
              </>
            ) : null}
          </main>
        </>
      )}

      <Footer />
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
