import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorPanel, type FocusTarget } from './components/EditorPanel';
import { Footer } from './components/Footer';
import { FormattingPanel } from './components/FormattingPanel';
import { Header } from './components/Header';
import { ImportScreen } from './components/ImportScreen';
import { Preview } from './components/Preview';
import { useDraft } from './hooks/useDraft';
import { resumeFilename } from './lib/filename';
import { layoutResume } from './lib/layout';
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
import { serializeResume } from './lib/serialize';
import { DEFAULT_TEMPLATE } from './types/resume';
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

type View = 'import' | 'editor';
type ImportMode = 'new' | 'import';

export default function App() {
  const { resume, setResume, saveState } = useDraft();
  const [view, setView] = useState<View>(resume ? 'editor' : 'import');
  const [importMode, setImportMode] = useState<ImportMode>('new');
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const layout = useMemo(() => (resume ? layoutResume(resume) : null), [resume]);
  const showEditor = view === 'editor' && resume !== null;

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(id);
  }, [message]);

  const updateResume = useCallback(
    (updater: (current: Resume) => Resume) => {
      setResume((current) => (current ? updater(current) : current));
    },
    [setResume],
  );

  const onFocusTarget = useCallback((sectionId: string, itemId?: string) => {
    setFocusTarget({ sectionId, itemId, nonce: Date.now() });
  }, []);

  const openImport = (mode: ImportMode) => {
    setImportMode(mode);
    setView('import');
    setFormattingOpen(false);
  };

  const applyImport = (next: Resume, warnings: string[]) => {
    setResume((current) => ({
      ...next,
      template: current?.template ?? DEFAULT_TEMPLATE,
    }));
    setView('editor');
    setMessage(
      warnings.length > 0
        ? `Imported with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
        : 'Resume imported.',
    );
  };

  const handleExportPdf = async () => {
    if (!resume || !layout) return;
    try {
      const { exportPdf } = await import('./lib/exportPdf');
      exportPdf(resume, layout);
      setMessage('PDF downloaded.');
    } catch {
      setMessage('PDF export failed.');
    }
  };

  const handleExportDocx = async () => {
    if (!resume || !layout) return;
    try {
      const { exportDocx } = await import('./lib/exportDocx');
      const blob = await exportDocx(resume, layout);
      downloadBlob(blob, resumeFilename(resume.header.name, 'docx'));
      setMessage('DOCX downloaded.');
    } catch {
      setMessage('DOCX export failed.');
    }
  };

  const handlePageSize = (pageSize: PageSize) => {
    updateResume((current) => updateTemplate(current, { pageSize }));
  };

  const handleFormat = (patch: Partial<FormatSettings>) => {
    updateResume((current) => updateFormat(current, patch));
  };

  const handleResetFormatting = () => {
    updateResume((current) => resetTemplate(current));
    setMessage('Formatting reset to defaults.');
  };

  const sectionHandlers = {
    onAddSection: (kind: SectionKind) => updateResume((current) => addSection(current, kind)),
    onUpdateSection: (sectionId: string, patch: Partial<ResumeSection>) =>
      updateResume((current) => updateSection(current, sectionId, patch)),
    onRemoveSection: (sectionId: string) =>
      updateResume((current) => removeSection(current, sectionId)),
    onMoveSection: (sectionId: string, direction: -1 | 1) =>
      updateResume((current) => moveSection(current, sectionId, direction)),
    onAddItem: (sectionId: string) => updateResume((current) => addItem(current, sectionId)),
    onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ResumeItem>) =>
      updateResume((current) => updateItem(current, sectionId, itemId, patch)),
    onRemoveItem: (sectionId: string, itemId: string) =>
      updateResume((current) => removeItem(current, sectionId, itemId)),
    onAddBullet: (sectionId: string, itemId: string) =>
      updateResume((current) => addBullet(current, sectionId, itemId)),
    onUpdateBullet: (sectionId: string, itemId: string, bulletIndex: number, value: string) =>
      updateResume((current) => updateBullet(current, sectionId, itemId, bulletIndex, value)),
    onRemoveBullet: (sectionId: string, itemId: string, bulletIndex: number) =>
      updateResume((current) => removeBullet(current, sectionId, itemId, bulletIndex)),
  };

  return (
    <div className="app">
      <a className="skip-link" href={showEditor ? '#editor' : '#import-text'}>
        {showEditor ? 'Skip to editor' : 'Skip to import'}
      </a>

      <Header
        view={showEditor ? 'editor' : 'import'}
        saveState={saveState}
        message={message}
        formattingOpen={formattingOpen}
        onNew={() => openImport('new')}
        onImport={() => openImport('import')}
        onToggleFormatting={() => setFormattingOpen((open) => !open)}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
      />

      {showEditor ? (
        <>
          {formattingOpen ? (
            <FormattingPanel
              template={resume.template}
              onPageSize={handlePageSize}
              onFormat={handleFormat}
              onReset={handleResetFormatting}
            />
          ) : null}
          <main className="workspace" id="main">
            <EditorPanel
              resume={resume}
              focusTarget={focusTarget}
              onHeader={(patch) => updateResume((current) => updateHeader(current, patch))}
              onContact={(patch) => updateResume((current) => updateContact(current, patch))}
              {...sectionHandlers}
            />
            {layout ? <Preview layout={layout} onFocusTarget={onFocusTarget} /> : null}
          </main>
        </>
      ) : (
        <ImportScreen
          mode={importMode}
          currentText={resume ? serializeResume(resume) : undefined}
          onImport={applyImport}
          onBack={resume ? () => setView('editor') : undefined}
        />
      )}

      <Footer />
    </div>
  );
}
