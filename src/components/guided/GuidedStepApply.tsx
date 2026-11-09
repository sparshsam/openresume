import { guidedFilename } from '../../lib/filename';
import { isSafeHttpsUrl, type JobContext } from '../../lib/jobContext';
import type { CoverLetter } from '../../types/coverLetter';
import type { Resume } from '../../types/resume';

interface GuidedStepApplyProps {
  job: JobContext;
  resume: Resume;
  coverLetter: CoverLetter | null;
  onBack: () => void;
  onStartOver: () => void;
}

export function GuidedStepApply({
  job,
  resume,
  coverLetter,
  onBack,
  onStartOver,
}: GuidedStepApplyProps) {
  const resumePdf = guidedFilename(resume.header.name, job.title ?? '', 'resume', 'pdf');
  const resumeDocx = guidedFilename(resume.header.name, job.title ?? '', 'resume', 'docx');
  const letterPdf = coverLetter
    ? guidedFilename(coverLetter.applicant.name, job.title ?? '', 'coverLetter', 'pdf')
    : null;
  const letterDocx = coverLetter
    ? guidedFilename(coverLetter.applicant.name, job.title ?? '', 'coverLetter', 'docx')
    : null;

  return (
    <div className="guided-stack">
      <section className="guided-card guided-complete" aria-labelledby="guided-apply-heading">
        <span className="guided-complete-mark" aria-hidden="true">
          ✓
        </span>
        <h2 id="guided-apply-heading">Your documents are ready</h2>
        <p className="guided-muted">
          {job.title ? (
            <>
              You prepared application documents for <strong>{job.title}</strong>
              {job.employer ? (
                <>
                  {' '}
                  at <strong>{job.employer}</strong>
                </>
              ) : null}
              .
            </>
          ) : (
            'Your application documents are ready.'
          )}
        </p>

        <div className="guided-callout guided-callout--left">
          <p>
            <strong>Before you continue</strong>
          </p>
          <ul className="guided-check-list">
            <li>Download your résumé{coverLetter ? ' and cover letter' : ''}.</li>
            <li>Keep the files handy; the employer’s site opens in a new tab.</li>
            <li>Complete the employer’s own application form and upload your files there.</li>
          </ul>
          <p className="guided-muted">
            Expected files: {resumePdf}, {resumeDocx}
            {letterPdf && letterDocx ? `, ${letterPdf}, ${letterDocx}` : ''}.
          </p>
        </div>

        {job.applicationUrl && isSafeHttpsUrl(job.applicationUrl) ? (
          <a
            className="button button-primary guided-primary guided-apply-button"
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the employer application page →
          </a>
        ) : (
          <p className="guided-callout">
            The employer application link was not provided. Return to the job listing to apply, and
            have your downloaded documents ready.
          </p>
        )}

        <p className="guided-muted guided-no-submit">
          OpenResume does not submit applications. You remain in control of the employer’s form.
        </p>
      </section>

      <div className="guided-actions guided-actions--outside">
        <button type="button" className="button" onClick={onBack}>
          ← Back to documents
        </button>
        <button type="button" className="button" onClick={onStartOver}>
          Start another application
        </button>
      </div>
    </div>
  );
}
