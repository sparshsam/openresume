import type { GuidedAssistant } from '../../lib/guidedAssistants';
import type { GuidedOutput } from '../../lib/guidedPrompt';

interface GuidedStepBuildProps {
  output: GuidedOutput;
  assistant: GuidedAssistant;
  text: string;
  error: string | null;
  onChange: (text: string) => void;
  onBuild: () => void;
  onBack: () => void;
}

export function GuidedStepBuild({
  output,
  assistant,
  text,
  error,
  onChange,
  onBuild,
  onBack,
}: GuidedStepBuildProps) {
  const isKit = output === 'applicationKit';

  return (
    <div className="guided-stack">
      <section className="guided-card" aria-labelledby="guided-build-heading">
        <h2 id="guided-build-heading">Paste the structured output</h2>
        <p className="guided-muted">
          Paste the final structured output from {assistant.name}. OpenResume reads it in your
          browser; nothing is uploaded.
        </p>

        <div className="guided-callout">
          {isKit ? (
            <p>
              Paste both documents in one response. The output must include the exact lines{' '}
              <code>=== OPENRESUME: RESUME ===</code> and{' '}
              <code>=== OPENRESUME: COVER LETTER ===</code>, in that order.
            </p>
          ) : (
            <p>
              Paste the complete résumé output. It should start with <code># Your Name</code> and
              keep the <code>#</code>, <code>##</code>, and <code>###</code> lines.
            </p>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="guided-structured-text">
            AI-generated content
          </label>
          <textarea
            id="guided-structured-text"
            className="textarea guided-textarea"
            value={text}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby="guided-structured-help"
            aria-invalid={Boolean(error)}
            spellCheck={false}
          />
          <p className="guided-muted" id="guided-structured-help">
            Keep the complete response, including every heading, bullet, and delimiter. Do not paste
            only part of it.
          </p>
        </div>

        {error ? (
          <div className="guided-error" role="alert">
            <p>
              <strong>We could not build your documents.</strong>
            </p>
            <p>{error}</p>
            <p>
              Return to {assistant.name}, ask it to fix the structure, and paste the complete
              response again. Your text stays here so you can edit it.
            </p>
          </div>
        ) : null}

        <div className="guided-actions">
          <div className="guided-action-group">
            <button type="button" className="button" onClick={onBack}>
              ← Back
            </button>
            <a className="button" href={assistant.url} target="_blank" rel="noopener noreferrer">
              Open {assistant.name} again
            </a>
          </div>
          <button type="button" className="button button-primary guided-primary" onClick={onBuild}>
            Build documents
          </button>
        </div>
      </section>
    </div>
  );
}
