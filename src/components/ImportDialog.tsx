import { useEffect, useRef, useState } from 'react';
import { parseResume } from '../lib/parse';
import type { Resume } from '../types/resume';

interface ImportDialogProps {
  open: boolean;
  initialText: string;
  onClose: () => void;
  onApply: (resume: Resume, warnings: string[]) => void;
}

type ImportDialogContentProps = Omit<ImportDialogProps, 'open'>;

function ImportDialogContent({ initialText, onClose, onApply }: ImportDialogContentProps) {
  const [text, setText] = useState(initialText);
  const [warnings, setWarnings] = useState<string[]>([]);
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
    const parsed = parseResume(text);
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
          Paste resume content using the format in <code>docs/input-format.md</code>. Parsing is
          deterministic and runs entirely in this browser.
        </p>
        <textarea
          ref={textareaRef}
          className="dialog-textarea"
          aria-label="Structured resume text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
        />
        {warnings.length > 0 ? (
          <ul className="warning-list" aria-live="polite">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        <div className="dialog-actions">
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

export function ImportDialog({ open, initialText, onClose, onApply }: ImportDialogProps) {
  if (!open) return null;
  return <ImportDialogContent initialText={initialText} onClose={onClose} onApply={onApply} />;
}
