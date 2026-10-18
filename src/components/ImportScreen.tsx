import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { parseResume } from '../lib/parse';
import { SAMPLE_RESUME_TEXT } from '../lib/sample';
import type { Resume } from '../types/resume';

const FORMAT_EXAMPLE = `# Your Name
Headline | email@example.com | +1 555 0100 | Toronto, ON | linkedin.com/in/you

## SUMMARY
One or two sentences about the work you do and the value you bring.

## EXPERIENCE
### Company — Role
2022 – Present | Toronto, ON
- A specific achievement with a number attached.
- Another contribution and its outcome.

## EDUCATION
### University — Degree
2014 – 2018 | City

## SKILLS
Languages: TypeScript, Python, SQL
Tools: React, Vite, Git`;

interface ImportScreenProps {
  mode: 'new' | 'import';
  currentText?: string;
  onImport: (resume: Resume, warnings: string[]) => void;
  onBack?: () => void;
}

export function ImportScreen({ mode, currentText, onImport, onBack }: ImportScreenProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => textareaRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!onBack) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  const importText = () => {
    if (!text.trim()) {
      setError('Paste resume text before importing.');
      return;
    }

    const parsed = parseResume(text);
    if (parsed.documentCount === 0) {
      setError('Start with a single "# Your Name" line.');
      return;
    }
    if (parsed.documentCount > 1) {
      setError(
        `This text contains ${parsed.documentCount} resume headings. Import one resume at a time so the document is replaced cleanly.`,
      );
      return;
    }

    setError(null);
    onImport(parsed.resume, parsed.warnings);
  };

  const isNew = mode === 'new';

  return (
    <main className="import-screen" id="main">
      <div className="import-inner">
        <p className="import-eyebrow">OpenResume</p>
        <h1 className="import-title">{isNew ? 'Create your resume' : 'Import a resume'}</h1>
        <p className="import-lede">
          Paste structured resume content from ChatGPT or any AI assistant. OpenResume turns it into
          a precise two-column document you can review, edit, and export as PDF or Word.
        </p>

        <form
          className="import-form"
          onSubmit={(event) => {
            event.preventDefault();
            importText();
          }}
        >
          <label className="import-label" htmlFor="import-text">
            Resume text
          </label>
          <textarea
            ref={textareaRef}
            id="import-text"
            className="import-textarea"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                importText();
              }
            }}
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'import-error' : 'import-help'}
            placeholder={FORMAT_EXAMPLE}
          />

          {error ? (
            <p className="import-error" id="import-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="import-help" id="import-help">
              Your text stays in this browser. Nothing is uploaded.
            </p>
          )}

          <div className="import-actions">
            <button type="submit" className="button button-primary">
              <Icon name="upload" />
              <span>Import &amp; Preview</span>
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setText(SAMPLE_RESUME_TEXT);
                setError(null);
                textareaRef.current?.focus();
              }}
            >
              Load example
            </button>
            {currentText ? (
              <button
                type="button"
                className="button button-ghost import-link"
                onClick={() => {
                  setText(currentText);
                  setError(null);
                  textareaRef.current?.focus();
                }}
              >
                Load current draft
              </button>
            ) : null}
            {onBack ? (
              <button type="button" className="button" onClick={onBack}>
                Back to current resume
              </button>
            ) : null}
          </div>
          <p className="import-note">
            Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> to import.
          </p>
        </form>

        <details className="import-details">
          <summary>Example input format</summary>
          <pre>{FORMAT_EXAMPLE}</pre>
        </details>

        {currentText ? (
          <p className="import-note import-safety">
            Your current draft remains saved until you import a new resume.
          </p>
        ) : null}
      </div>
    </main>
  );
}
