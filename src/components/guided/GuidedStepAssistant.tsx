import { useState } from 'react';
import { GUIDED_ASSISTANTS, type GuidedAssistantId } from '../../lib/guidedAssistants';
import { isSafeHttpsUrl, type JobContext } from '../../lib/jobContext';

interface GuidedStepAssistantProps {
  job: JobContext;
  hasJobContext: boolean;
  jobWarnings: string[];
  assistant: GuidedAssistantId | null;
  confirmed: boolean;
  onAssistant: (id: GuidedAssistantId) => void;
  onConfirmed: (confirmed: boolean) => void;
  onJobChange: (patch: Partial<JobContext>) => void;
  onContinue: () => void;
}

function display(value: string | undefined): string {
  return value?.trim() || 'Not provided';
}

export function GuidedStepAssistant({
  job,
  hasJobContext,
  jobWarnings,
  assistant,
  confirmed,
  onAssistant,
  onConfirmed,
  onJobChange,
  onContinue,
}: GuidedStepAssistantProps) {
  const [editing, setEditing] = useState(!hasJobContext);
  const descriptionError =
    job.jobDescriptionUrl && !isSafeHttpsUrl(job.jobDescriptionUrl)
      ? 'Use a complete https:// link, or leave this blank.'
      : null;
  const applicationError =
    job.applicationUrl && !isSafeHttpsUrl(job.applicationUrl)
      ? 'Use a complete https:// link, or leave this blank.'
      : null;
  const hasUrlError = Boolean(descriptionError || applicationError);
  const canContinue = Boolean(assistant && confirmed && !hasUrlError);
  const blockedReason = !assistant
    ? 'Choose an assistant and open it to continue.'
    : !confirmed
      ? 'Confirm that you opened your assistant to continue.'
      : hasUrlError
        ? 'Fix the job links below to continue.'
        : 'Ready to continue.';

  return (
    <div className="guided-stack">
      <section className="guided-card" aria-labelledby="guided-job-heading">
        <div className="guided-card-heading">
          <div>
            <h2 id="guided-job-heading">Your job</h2>
            <p className="guided-muted">
              We use these details to tailor your documents. They stay in this browser.
            </p>
          </div>
          <button
            type="button"
            className="button button-small"
            onClick={() => setEditing((value) => !value)}
            aria-expanded={editing}
            aria-controls="guided-job-form"
          >
            {editing ? 'Done editing' : 'Edit job details'}
          </button>
        </div>

        <dl className="guided-dl">
          <dt>Job title</dt>
          <dd>{display(job.title)}</dd>
          <dt>Employer</dt>
          <dd>{display(job.employer)}</dd>
          <dt>Location</dt>
          <dd>{display(job.location)}</dd>
          {job.jobDescriptionUrl ? (
            <>
              <dt>Job description</dt>
              <dd>
                <a href={job.jobDescriptionUrl} target="_blank" rel="noopener noreferrer">
                  Open the job description
                </a>
              </dd>
            </>
          ) : null}
          {job.applicationUrl ? (
            <>
              <dt>Application page</dt>
              <dd>
                <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                  Open the employer application page
                </a>
              </dd>
            </>
          ) : null}
        </dl>

        {jobWarnings.length > 0 ? (
          <ul className="guided-warning-list" aria-label="Job detail warnings">
            {jobWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        {!editing && hasUrlError ? (
          <p className="guided-field-error" role="alert">
            Fix the job links before continuing. Use a complete https:// link, or leave the field
            blank.
          </p>
        ) : null}

        {editing ? (
          <div className="guided-form" id="guided-job-form">
            <div className="field">
              <label className="field-label" htmlFor="guided-job-title">
                Job title
              </label>
              <input
                id="guided-job-title"
                className="input"
                value={job.title ?? ''}
                maxLength={200}
                onChange={(event) => onJobChange({ title: event.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="guided-employer">
                  Employer
                </label>
                <input
                  id="guided-employer"
                  className="input"
                  value={job.employer ?? ''}
                  maxLength={200}
                  onChange={(event) => onJobChange({ employer: event.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="guided-location">
                  Location
                </label>
                <input
                  id="guided-location"
                  className="input"
                  value={job.location ?? ''}
                  maxLength={200}
                  onChange={(event) => onJobChange({ location: event.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="guided-jd-url">
                Job-description URL (https)
              </label>
              <input
                id="guided-jd-url"
                className="input"
                type="url"
                inputMode="url"
                value={job.jobDescriptionUrl ?? ''}
                maxLength={2048}
                aria-invalid={Boolean(descriptionError)}
                aria-describedby={descriptionError ? 'guided-jd-url-error' : undefined}
                onChange={(event) => onJobChange({ jobDescriptionUrl: event.target.value })}
              />
              {descriptionError ? (
                <p className="guided-field-error" id="guided-jd-url-error" role="alert">
                  {descriptionError}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="guided-apply-url">
                Employer application URL (https)
              </label>
              <input
                id="guided-apply-url"
                className="input"
                type="url"
                inputMode="url"
                value={job.applicationUrl ?? ''}
                maxLength={2048}
                aria-invalid={Boolean(applicationError)}
                aria-describedby={applicationError ? 'guided-apply-url-error' : undefined}
                onChange={(event) => onJobChange({ applicationUrl: event.target.value })}
              />
              {applicationError ? (
                <p className="guided-field-error" id="guided-apply-url-error" role="alert">
                  {applicationError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="guided-card" aria-labelledby="guided-assistant-heading">
        <fieldset className="guided-assistant-fieldset">
          <legend id="guided-assistant-heading">Select your assistant</legend>
          <p className="guided-muted">
            You need an AI assistant to tailor your résumé. Choose one below, then open its new-chat
            page in a separate tab. You may need to sign in. OpenResume does not connect to or read
            your assistant account.
          </p>

          <div className="guided-assistant-grid">
            {GUIDED_ASSISTANTS.map((entry) => {
              const selected = assistant === entry.id;
              return (
                <div key={entry.id} className={`guided-assistant${selected ? ' is-selected' : ''}`}>
                  <label className="guided-assistant-choice">
                    <input
                      type="radio"
                      name="guided-assistant"
                      value={entry.id}
                      checked={selected}
                      onChange={() => onAssistant(entry.id)}
                    />
                    <span className="guided-assistant-name">{entry.name}</span>
                  </label>
                  <p className="guided-muted">{entry.description}</p>
                  <a
                    className="button button-small"
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onAssistant(entry.id)}
                  >
                    Open {entry.name}
                  </a>
                </div>
              );
            })}
          </div>
        </fieldset>

        <label className="guided-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmed(event.target.checked)}
          />
          <span>I have opened my AI assistant and I am ready to prepare my documents.</span>
        </label>

        <div className="guided-actions">
          <p className="guided-muted" aria-live="polite">
            {blockedReason}
          </p>
          <button
            type="button"
            className="button button-primary guided-primary"
            onClick={onContinue}
            disabled={!canContinue}
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
