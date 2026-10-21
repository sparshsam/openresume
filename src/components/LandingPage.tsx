import { Icon } from './Icon';
import type { PrepareKind } from '../types/document';

interface LandingPageProps {
  hasResume: boolean;
  hasCoverLetter: boolean;
  hasApplicationKit: boolean;
  onResume: () => void;
  onCoverLetter: () => void;
  onApplicationKit: () => void;
  onOpenResume: () => void;
  onOpenCoverLetter: () => void;
  onOpenApplicationKit: () => void;
  onCopyInstructions: (kind: PrepareKind) => void;
}

export function LandingPage({
  hasResume,
  hasCoverLetter,
  hasApplicationKit,
  onResume,
  onCoverLetter,
  onApplicationKit,
  onOpenResume,
  onOpenCoverLetter,
  onOpenApplicationKit,
  onCopyInstructions,
}: LandingPageProps) {
  return (
    <main className="landing" id="main">
      <div className="landing-inner">
        <header className="landing-intro">
          <p className="landing-eyebrow">OpenResume</p>
          <h1 className="landing-title">
            Your next application,
            <br />
            beautifully presented.
          </h1>
          <p className="landing-lede">
            Create professional resumes, cover letters, and complete application kits from
            AI-prepared content. Review, refine, and export in minutes.
          </p>
        </header>

        <div className="landing-options">
          <article className="landing-card">
            <div className="landing-card-head">
              <span className="landing-icon" aria-hidden="true">
                <Icon name="fileText" size={26} />
              </span>
            </div>

            <div className="landing-card-body">
              <h2 className="landing-card-title">Resume</h2>
              <p className="landing-card-description">
                Turn your experience into a clear, professional resume.
              </p>
            </div>

            <div className="landing-card-actions">
              <button type="button" className="landing-card-action" onClick={onResume}>
                <span>Build Resume</span>
                <span className="landing-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button
                type="button"
                className="landing-card-copy"
                onClick={() => onCopyInstructions('resume')}
              >
                Copy AI Instructions
              </button>
              {hasResume ? (
                <button type="button" className="landing-card-continue" onClick={onOpenResume}>
                  Open resume
                </button>
              ) : null}
            </div>
          </article>

          <article className="landing-card">
            <div className="landing-card-head">
              <span className="landing-icon" aria-hidden="true">
                <Icon name="mail" size={26} />
              </span>
            </div>

            <div className="landing-card-body">
              <h2 className="landing-card-title">Cover Letter</h2>
              <p className="landing-card-description">
                Present your story with a thoughtful, polished letter.
              </p>
            </div>

            <div className="landing-card-actions">
              <button type="button" className="landing-card-action" onClick={onCoverLetter}>
                <span>Build Cover Letter</span>
                <span className="landing-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button
                type="button"
                className="landing-card-copy"
                onClick={() => onCopyInstructions('coverLetter')}
              >
                Copy AI Instructions
              </button>
              {hasCoverLetter ? (
                <button type="button" className="landing-card-continue" onClick={onOpenCoverLetter}>
                  Open cover letter
                </button>
              ) : null}
            </div>
          </article>

          <article className="landing-card">
            <div className="landing-card-head">
              <span className="landing-icon" aria-hidden="true">
                <Icon name="files" size={26} />
              </span>
            </div>

            <div className="landing-card-body">
              <h2 className="landing-card-title">Application Kit</h2>
              <p className="landing-card-description">
                One application. Two coordinated documents. Create a tailored resume and matching
                cover letter together, then download your complete application.
              </p>
            </div>

            <div className="landing-card-actions">
              <button type="button" className="landing-card-action" onClick={onApplicationKit}>
                <span>Build Application Kit</span>
                <span className="landing-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button
                type="button"
                className="landing-card-copy"
                onClick={() => onCopyInstructions('applicationKit')}
              >
                Copy AI Instructions
              </button>
              {hasApplicationKit ? (
                <button
                  type="button"
                  className="landing-card-continue"
                  onClick={onOpenApplicationKit}
                >
                  Open application kit
                </button>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
