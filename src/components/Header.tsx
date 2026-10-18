import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';
import type { SaveState } from '../hooks/useDraft';
import type { DocumentKind } from '../types/document';

interface HeaderProps {
  view: 'landing' | 'prepare' | 'workspace';
  kind: DocumentKind | null;
  saveState: SaveState;
  message: string | null;
  formattingOpen: boolean;
  onHome: () => void;
  onNew: () => void;
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
  kind,
  saveState,
  message,
  formattingOpen,
  onHome,
  onNew,
  onToggleFormatting,
  onExportPdf,
  onExportDocx,
}: HeaderProps) {
  const isWorkspace = view === 'workspace' && kind !== null;
  const kindLabel = kind === 'resume' ? 'Resume' : 'Cover Letter';

  return (
    <header className="app-header">
      <div className="header-inner">
        <button
          type="button"
          className="brand brand-button"
          onClick={onHome}
          aria-label={view === 'workspace' ? 'Back to document selection' : 'OpenResume home'}
        >
          <img className="brand-mark" src="/icon-192.png" alt="" aria-hidden="true" />
          <span className="brand-copy">
            <span className="brand-name">OpenResume</span>
            <span className="brand-tagline">Structured text in. Precise documents out.</span>
          </span>
        </button>

        {isWorkspace ? (
          <>
            <span className="document-label">{kindLabel}</span>

            <nav className="header-actions" aria-label="Document actions">
              <span className="header-status" role="status" aria-live="polite">
                {statusText(saveState, message)}
              </span>

              <button
                type="button"
                className="button"
                onClick={onNew}
                aria-label={`New ${kind === 'resume' ? 'resume' : 'cover letter'}`}
                title={`Start a new ${kind === 'resume' ? 'resume' : 'cover letter'}`}
              >
                <Icon name="plus" />
                <span className="button-label">New</span>
              </button>

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
