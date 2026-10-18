import type { SaveState } from '../hooks/useDraft';

interface ToolbarProps {
  saveState: SaveState;
  message: string | null;
  formattingOpen: boolean;
  onToggleFormatting: () => void;
  onImport: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onReset: () => void;
}

function statusText(saveState: SaveState, message: string | null): string {
  if (message) return message;
  if (saveState === 'saving') return 'Saving…';
  if (saveState === 'saved') return 'Saved locally';
  return 'Loaded from this browser';
}

export function Toolbar({
  saveState,
  message,
  formattingOpen,
  onToggleFormatting,
  onImport,
  onExportPdf,
  onExportDocx,
  onReset,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-name">OpenResume</span>
        <span className="brand-tagline">Structured text in. Precise documents out.</span>
      </div>

      <div className="toolbar-actions">
        <span className="toolbar-status" role="status" aria-live="polite">
          {statusText(saveState, message)}
        </span>
        <button
          type="button"
          className="button"
          aria-expanded={formattingOpen}
          aria-controls="formatting-panel"
          onClick={onToggleFormatting}
        >
          Formatting
        </button>
        <button type="button" className="button" onClick={onImport}>
          Import text
        </button>
        <button type="button" className="button" onClick={onReset}>
          Reset sample
        </button>
        <button type="button" className="button button-primary" onClick={onExportPdf}>
          Export PDF
        </button>
        <button type="button" className="button" onClick={onExportDocx}>
          Export DOCX
        </button>
      </div>
    </header>
  );
}
