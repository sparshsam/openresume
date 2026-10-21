import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { copyAiInstructions } from '../lib/aiClipboard';
import { SAMPLE_COVER_LETTER_TEXT } from '../lib/coverLetterSample';
import { parseApplicationKit } from '../lib/parseApplicationKit';
import { parseCoverLetter } from '../lib/parseCoverLetter';
import { parseResume } from '../lib/parse';
import { SAMPLE_RESUME_TEXT } from '../lib/sample';
import type { CoverLetter } from '../types/coverLetter';
import type { PrepareKind } from '../types/document';
import type { Resume } from '../types/resume';

interface PrepareScreenProps {
  kind: PrepareKind;
  initialText?: string;
  reusedFromResume?: boolean;
  resumeScaffold?: string;
  onBuildResume?: (resume: Resume, warnings: string[]) => void;
  onBuildCoverLetter?: (letter: CoverLetter, warnings: string[]) => void;
  onBuildApplicationKit?: (resume: Resume, coverLetter: CoverLetter, warnings: string[]) => void;
  onNotify?: (message: string, tone?: 'success' | 'error') => void;
  onBack: () => void;
}

const PLACEHOLDER: Record<PrepareKind, string> = {
  resume:
    '# Your Name\nHeadline | email@example.com | Toronto, ON\n\n## SUMMARY\nA short positioning line.\n\n## EXPERIENCE\n### Company — Role\n2022 – Present | Toronto, ON\n- A specific achievement.',
  coverLetter:
    '# Your Name\nHeadline | email@example.com | Toronto, ON\n\n## DATE\nOctober 18, 2026\n\n## RECIPIENT\nHiring Manager\nExample Company\n\n## BODY\nYour first paragraph.',
  applicationKit:
    '=== OPENRESUME: RESUME ===\n# Your Name\nHeadline | email@example.com | Toronto, ON\n\n## SUMMARY\nA short positioning line.\n\n=== OPENRESUME: COVER LETTER ===\n# Your Name\nHeadline | email@example.com | Toronto, ON\n\n## BODY\nYour first paragraph.',
};

export function PrepareScreen({
  kind,
  initialText,
  reusedFromResume = false,
  resumeScaffold,
  onBuildResume,
  onBuildCoverLetter,
  onBuildApplicationKit,
  onNotify,
  onBack,
}: PrepareScreenProps) {
  const [text, setText] = useState(initialText ?? '');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => textareaRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  const isResume = kind === 'resume';
  const isApplicationKit = kind === 'applicationKit';
  const label = isResume ? 'resume' : isApplicationKit ? 'application kit' : 'cover letter';
  const title = isResume
    ? 'Create your resume'
    : isApplicationKit
      ? 'Create your application kit'
      : 'Create your cover letter';
  const textareaLabel = isResume
    ? 'Resume text'
    : isApplicationKit
      ? 'Application kit text'
      : 'Cover letter text';
  const buildLabel = isResume
    ? 'Build Resume'
    : isApplicationKit
      ? 'Build Application Kit'
      : 'Build Cover Letter';

  const build = () => {
    if (!text.trim()) {
      setError(`Paste ${label} text before building.`);
      return;
    }

    if (isApplicationKit) {
      const parsed = parseApplicationKit(text);
      if (!parsed.ok) {
        setError(parsed.errors.join(' '));
        return;
      }
      setError(null);
      onBuildApplicationKit?.(parsed.resume, parsed.coverLetter, parsed.warnings);
      return;
    }

    if (isResume) {
      const parsed = parseResume(text);
      if (parsed.documentCount === 0) {
        setError('Start with a single "# Your Name" line.');
        return;
      }
      if (parsed.documentCount > 1) {
        setError(
          `This text contains ${parsed.documentCount} resume headings. Build one resume at a time.`,
        );
        return;
      }
      if (!parsed.resume.header.name.trim()) {
        setError('Add the applicant name after "# ".');
        return;
      }
      setError(null);
      onBuildResume?.(parsed.resume, parsed.warnings);
      return;
    }

    const parsed = parseCoverLetter(text);
    if (parsed.documentCount === 0) {
      setError('Start with a single "# Your Name" line.');
      return;
    }
    if (parsed.documentCount > 1) {
      setError(
        `This text contains ${parsed.documentCount} cover letter headings. Build one letter at a time.`,
      );
      return;
    }
    if (!parsed.coverLetter.applicant.name.trim()) {
      setError('Add the applicant name after "# ".');
      return;
    }
    if (parsed.coverLetter.body.length === 0) {
      setError('Add a BODY section with at least one paragraph.');
      return;
    }
    setError(null);
    onBuildCoverLetter?.(parsed.coverLetter, parsed.warnings);
  };

  const copyInstructions = async () => {
    const copied = await copyAiInstructions(kind);
    onNotify?.(
      copied
        ? 'AI instructions copied. Paste them into your AI assistant.'
        : 'Could not copy. Allow clipboard access and try again.',
      copied ? 'success' : 'error',
    );
  };

  return (
    <main className="prepare-screen" id="main">
      <div className="prepare-inner">
        <button type="button" className="prepare-back" onClick={onBack}>
          ← Back
        </button>

        <p className="prepare-eyebrow">OpenResume</p>
        <h1 className="prepare-title">{title}</h1>
        <p className="prepare-lede">
          Paste structured content from ChatGPT or any AI assistant. Copy the AI instructions first
          if you want the assistant to produce a format OpenResume can parse exactly.
        </p>

        <ol className="prepare-steps" aria-label="AI workflow">
          <li>Copy AI Instructions.</li>
          <li>Paste them into ChatGPT or another AI assistant.</li>
          <li>Provide your details and the target job description.</li>
          <li>Copy the generated structured text.</li>
          <li>Paste it into OpenResume.</li>
          <li>{isApplicationKit ? 'Build both documents.' : 'Build the document.'}</li>
        </ol>

        {reusedFromResume ? (
          <p className="prepare-note">
            Applicant details from your resume are pre-filled. Add the recipient, role, salutation,
            and letter body.
          </p>
        ) : null}

        <form
          className="prepare-form"
          onSubmit={(event) => {
            event.preventDefault();
            build();
          }}
        >
          <label className="prepare-label" htmlFor="prepare-text">
            {textareaLabel}
          </label>
          <textarea
            ref={textareaRef}
            id="prepare-text"
            className="prepare-textarea"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                build();
              }
            }}
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'prepare-error' : 'prepare-help'}
            placeholder={PLACEHOLDER[kind]}
          />

          {error ? (
            <p className="prepare-error" id="prepare-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="prepare-help" id="prepare-help">
              Your text stays in this browser. Nothing is uploaded.
            </p>
          )}

          <div className="prepare-actions">
            <button type="submit" className="button button-primary">
              <Icon name={isResume ? 'fileText' : isApplicationKit ? 'files' : 'mail'} />
              <span>{buildLabel}</span>
            </button>
            <button type="button" className="button" onClick={copyInstructions}>
              Copy AI Instructions
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setText(isResume ? SAMPLE_RESUME_TEXT : SAMPLE_COVER_LETTER_TEXT);
                setError(null);
                textareaRef.current?.focus();
              }}
            >
              Load Example
            </button>
            {resumeScaffold ? (
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setText(resumeScaffold);
                  setError(null);
                  textareaRef.current?.focus();
                }}
              >
                Use resume details
              </button>
            ) : null}
          </div>

          <p className="prepare-help">
            Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> to build.
          </p>
        </form>
      </div>
    </main>
  );
}
