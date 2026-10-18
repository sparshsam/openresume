import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorPanel, type FocusTarget } from './components/EditorPanel';
import { ImportDialog } from './components/ImportDialog';
import { Preview } from './components/Preview';
import { Toolbar } from './components/Toolbar';
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
  updateBullet,
  updateContact,
  updateHeader,
  updateItem,
  updateSection,
} from './lib/resumeEdits';
import { serializeResume } from './lib/serialize';
import type { Resume, ResumeItem, ResumeSection, SectionKind } from './types/resume';

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

export default function App() {
  const { resume, setResume, reset, saveState } = useDraft();
  const [importOpen, setImportOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const layout = useMemo(() => layoutResume(resume), [resume]);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(id);
  }, [message]);

  const onFocusTarget = useCallback((sectionId: string, itemId?: string) => {
    setFocusTarget({ sectionId, itemId, nonce: Date.now() });
  }, []);

  const applyImport = (next: Resume, warnings: string[]) => {
    setResume((current) => ({ ...next, template: current.template }));
    setImportOpen(false);
    setMessage(
      warnings.length > 0
        ? `Imported with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
        : 'Text imported.',
    );
  };

  const handleExportPdf = async () => {
    try {
      const { exportPdf } = await import('./lib/exportPdf');
      exportPdf(resume, layout);
      setMessage('PDF downloaded.');
    } catch {
      setMessage('PDF export failed.');
    }
  };

  const handleExportDocx = async () => {
    try {
      const { exportDocx } = await import('./lib/exportDocx');
      const blob = await exportDocx(resume, layout);
      downloadBlob(blob, resumeFilename(resume.header.name, 'docx'));
      setMessage('DOCX downloaded.');
    } catch {
      setMessage('DOCX export failed.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to the sample resume? Your current draft will be replaced.')) {
      reset();
      setMessage('Sample restored.');
    }
  };

  const sectionHandlers = {
    onAddSection: (kind: SectionKind) => setResume((current) => addSection(current, kind)),
    onUpdateSection: (sectionId: string, patch: Partial<ResumeSection>) =>
      setResume((current) => updateSection(current, sectionId, patch)),
    onRemoveSection: (sectionId: string) =>
      setResume((current) => removeSection(current, sectionId)),
    onMoveSection: (sectionId: string, direction: -1 | 1) =>
      setResume((current) => moveSection(current, sectionId, direction)),
    onAddItem: (sectionId: string) => setResume((current) => addItem(current, sectionId)),
    onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ResumeItem>) =>
      setResume((current) => updateItem(current, sectionId, itemId, patch)),
    onRemoveItem: (sectionId: string, itemId: string) =>
      setResume((current) => removeItem(current, sectionId, itemId)),
    onAddBullet: (sectionId: string, itemId: string) =>
      setResume((current) => addBullet(current, sectionId, itemId)),
    onUpdateBullet: (sectionId: string, itemId: string, bulletIndex: number, value: string) =>
      setResume((current) => updateBullet(current, sectionId, itemId, bulletIndex, value)),
    onRemoveBullet: (sectionId: string, itemId: string, bulletIndex: number) =>
      setResume((current) => removeBullet(current, sectionId, itemId, bulletIndex)),
  };

  return (
    <div className="app">
      <a className="skip-link" href="#editor">
        Skip to editor
      </a>
      <Toolbar
        saveState={saveState}
        message={message}
        onImport={() => setImportOpen(true)}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        onReset={handleReset}
      />
      <div className="workspace">
        <EditorPanel
          resume={resume}
          focusTarget={focusTarget}
          onHeader={(patch) => setResume((current) => updateHeader(current, patch))}
          onContact={(patch) => setResume((current) => updateContact(current, patch))}
          {...sectionHandlers}
        />
        <Preview layout={layout} onFocusTarget={onFocusTarget} />
      </div>
      <ImportDialog
        open={importOpen}
        currentText={serializeResume(resume)}
        onClose={() => setImportOpen(false)}
        onApply={applyImport}
      />
    </div>
  );
}
