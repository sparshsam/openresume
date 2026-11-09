import type { GuidedAssistant } from '../../lib/guidedAssistants';
import { isSafeHttpsUrl } from '../../lib/jobContext';
import type { JobContext } from '../../lib/jobContext';
import type { GuidedOutput } from '../../lib/guidedPrompt';

export type CopyState = 'idle' | 'copied' | 'error';

interface GuidedStepPrepareProps {
  job: JobContext;
  assistant: GuidedAssistant;
  output: GuidedOutput;
  prompt: string;
  copyState: CopyState;
  hasHiddenCoverLetter: boolean;
  onOutput: (output: GuidedOutput) => void;
  onCopy: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function GuidedStepPrepare({
  job,
  assistant,
  output,
  prompt,
  copyState,
  hasHiddenCoverLetter,
  onOutput,
  onCopy,
  onBack,
  onContinue,
}: GuidedStepPrepareProps) {
  return (
    <div className="guided-stack">
      <section className="guided-card" aria-labelledby="guided-prepare-heading">
        <h2 id="guided-prepare-heading">Your tailoring prompt</h2>
        <p className="guided-muted">
          Your AI assistant needs two things before it can tailor anything: your existing résumé and
          the complete job description. The prompt below asks for both and refuses to continue
          without them.
        </p>

        <fieldset className="guided-fieldset">
          <legend>What should the assistant prepare?</legend>
          <label className="guided-radio">
            <input
              type="radio"
              name="guided-output"
              value="resume"
              checked={output === 'resume'}
              onChange={() => onOutput('resume')}
            />
            <span>
              <strong>Résumé only</strong>
              <span className="guided-muted">One tailored résumé for this job.</span>
            </span>
          </label>
          <label className="guided-radio">
            <input
              type="radio"
              name="guided-output"
              value="applicationKit"
              checked={output === 'applicationKit'}
              onChange={() => onOutput('applicationKit')}
            />
            <span>
              <strong>Résumé + cover letter</strong>
              <span className="guided-muted">
                A coordinated résumé and matching cover letter (Application Kit).
              </span>
            </span>
          </label>
        </fieldset>

        {hasHiddenCoverLetter ? (
          <p className="guided-note">
            Your existing cover letter is kept in this session but will not be included in this
            résumé-only application. Choose “Résumé + cover letter” and rebuild to include it.
          </p>
        ) : null}

        <div className="guided-callout">
          <p>
            <strong>Job-description link:</strong>{' '}
            {job.jobDescriptionUrl && isSafeHttpsUrl(job.jobDescriptionUrl) ? (
              <a href={job.jobDescriptionUrl} target="_blank" rel="noopener noreferrer">
                {job.jobDescriptionUrl}
              </a>
            ) : (
              <span>
                Not provided. The prompt will ask the assistant to request the full description.
              </span>
            )}
          </p>
          {!job.jobDescriptionUrl ? (
            <p className="guided-muted">
              When the assistant asks, paste the complete job description as text or upload
              screenshots of every part of it. A short listing summary is not enough.
            </p>
          ) : null}
        </div>

        <ol className="guided-steps-list">
          <li>
            Copy the prompt and paste it into{' '}
            <a href={assistant.url} target="_blank" rel="noopener noreferrer">
              {assistant.name}
            </a>
            .
          </li>
          <li>Upload or paste your existing résumé when the assistant asks for it.</li>
          <li>
            Let the assistant read the job description. If it cannot open the link, paste the
            description or upload screenshots.
          </li>
          <li>Answer its questions truthfully and wait for the final structured output.</li>
          <li>Copy the complete output, then continue to the next step.</li>
        </ol>

        <div className="guided-copy-row">
          <button type="button" className="button button-primary guided-primary" onClick={onCopy}>
            Copy AI tailoring prompt
          </button>
          <span role="status" aria-live="polite" className="guided-copy-status">
            {copyState === 'copied'
              ? 'Prompt copied.'
              : copyState === 'error'
                ? 'Could not copy. Select the prompt below and copy it manually.'
                : ''}
          </span>
        </div>

        <details className="guided-prompt-details">
          <summary>View the full prompt</summary>
          <pre className="guided-prompt-preview">{prompt}</pre>
        </details>
      </section>

      <div className="guided-actions guided-actions--outside">
        <button type="button" className="button" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="button button-primary guided-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
