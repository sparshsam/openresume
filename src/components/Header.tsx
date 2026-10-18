import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';
import type { SaveState } from '../hooks/useDraft';

interface HeaderProps {
  view: 'import' | 'editor';
  saveState: SaveState;
  message: string | null;
  formattingOpen: boolean;
  onNew: () => void;
  onImport: () => void;
  onToggleFormatting: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
}

function statusText(saveState: SaveState, message: string | null): string {
  if (message) return message;
  if (saveState === 'saving') return 'Saving…';
  if (saveState === 'saved') return 'Saved locally';
  if (saveState === 'loaded') return 'Loaded from this browser';
  return 'No saved draft';
}

export function Header({
  view,
  saveState,
  message,
  formattingOpen,
  onNew,
  onImport,
  onToggleFormatting,
  onExportPdf,
  onExportDocx,
}: HeaderProps) {
  const isEditor = view === 'editor';

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <img className="brand-mark" src="/icon-192.png" alt="" aria-hidden="true" />
          <div className="brand-copy">
            <span className="brand-name">OpenResume</span>
            <span className="brand-tagline">Structured text in. Precise documents out.</span>
          </div>
        </div>

        {isEditor ? (
          <>
            <nav className="header-actions" aria-label="Document actions">
              <span className="header-status" role="status" aria-live="polite">
                {statusText(saveState, message)}
              </span>

              <div className="action-group">
                <button
                  type="button"
                  className="button"
                  onClick={onNew}
                  aria-label="New resume"
                  title="Start a new resume"
                >
                  <Icon name="plus" />
                  <span className="button-label">New</span>
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={onImport}
                  aria-label="Import resume"
                  title="Import a resume"
                >
                  <Icon name="upload" />
                  <span className="button-label">Import</span>
                </button>
              </div>

              <span className="action-divider" aria-hidden="true" />

              <button
                type="button"
                className="button"
                aria-expanded={formattingOpen}
                aria-controls="formatting-panel"
                aria-label="Formatting"
                title="Document formatting"
                onClick={onToggleFormatting}
              >
                <Icon name="sliders" />
                <span className="button-label">Format</span>
              </button>

              <span className="action-divider" aria-hidden="true" />

              <div className="action-group">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={onExportPdf}
                  aria-label="Export PDF"
                  title="Export PDF"
                >
                  <Icon name="fileText" />
                  <span className="button-label">PDF</span>
                </button>
                <button
                  type="button"
                  className="button button-export"
                  onClick={onExportDocx}
                  aria-label="Export Word document"
                  title="Export Word document"
                >
                  <Icon name="fileWord" />
                  <span className="button-label">Word</span>
                </button>
              </div>
            </nav>
          </>
        ) : null}

        <div className="header-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
