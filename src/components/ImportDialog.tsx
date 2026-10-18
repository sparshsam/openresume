import { useEffect, useRef, useState } from 'react';
import { parseResume } from '../lib/parse';
import type { Resume } from '../types/resume';

interface ImportDialogProps {
  open: boolean;
  currentText: string;
  onClose: () => void;
  onApply: (resume: Resume, warnings: string[]) => void;
}

type ImportDialogContentProps = Omit<ImportDialogProps, 'open'>;

function ImportDialogContent({ currentText, onClose, onApply }: ImportDialogContentProps) {
  const [text, setText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => textareaRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const apply = () => {
    if (!text.trim()) {
      setError('Paste a resume before importing.');
      return;
    }
    const parsed = parseResume(text);
    if (parsed.documentCount > 1) {
      setWarnings(parsed.warnings);
      setError(
        `This text contains ${parsed.documentCount} resume headings. Import one resume at a time so the document is replaced cleanly.`,
      );
      return;
    }
    setError(null);
    setWarnings(parsed.warnings);
    onApply(parsed.resume, parsed.warnings);
  };

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="import-heading">
        <h2 id="import-heading">Import structured text</h2>
        <p className="dialog-help">
          The editor starts empty so a new import replaces the current document. Use{' '}
          <strong>Load current draft</strong> if you want to edit the existing content as text.
          Parsing is deterministic and runs entirely in this browser.
        </p>
        <textarea
          ref={textareaRef}
          className="dialog-textarea"
          aria-label="Structured resume text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          spellCheck={false}
          placeholder={'# Your Name\nHeadline | email@example.com | Toronto, ON\n\n## SUMMARY\n...'}
        />
        {error ? (
          <p className="warning-list" role="alert">
            {error}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <ul className="warning-list" aria-live="polite">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        <div className="dialog-actions">
          <button
            type="button"
            className="button button-small"
            onClick={() => {
              setText(currentText);
              setError(null);
              setWarnings([]);
            }}
          >
            Load current draft
          </button>
          <button
            type="button"
            className="button button-small"
            onClick={() => {
              setText('');
              setError(null);
              setWarnings([]);
            }}
          >
            Clear
          </button>
          <span className="dialog-spacer" />
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="button button-primary" onClick={apply}>
            Parse and replace
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImportDialog({ open, currentText, onClose, onApply }: ImportDialogProps) {
  if (!open) return null;
  return <ImportDialogContent currentText={currentText} onClose={onClose} onApply={onApply} />;
}
