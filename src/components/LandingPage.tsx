import { Icon } from './Icon';

interface LandingPageProps {
  hasResume: boolean;
  hasCoverLetter: boolean;
  onResume: () => void;
  onCoverLetter: () => void;
  onContinueResume: () => void;
  onContinueCoverLetter: () => void;
}

export function LandingPage({
  hasResume,
  hasCoverLetter,
  onResume,
  onCoverLetter,
  onContinueResume,
  onContinueCoverLetter,
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
            Create professional resumes and cover letters from AI-prepared content. Review, refine,
            and export in minutes.
          </p>
        </header>

        <div className="landing-options">
          <article className="landing-card">
            <div className="landing-card-head">
              <span className="landing-icon" aria-hidden="true">
                <Icon name="fileText" size={26} />
              </span>
              {hasResume ? <span className="landing-saved">Saved draft</span> : null}
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
              {hasResume ? (
                <button type="button" className="landing-card-continue" onClick={onContinueResume}>
                  Continue Saved Resume
                </button>
              ) : null}
            </div>
          </article>

          <article className="landing-card">
            <div className="landing-card-head">
              <span className="landing-icon" aria-hidden="true">
                <Icon name="mail" size={26} />
              </span>
              {hasCoverLetter ? <span className="landing-saved">Saved draft</span> : null}
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
              {hasCoverLetter ? (
                <button
                  type="button"
                  className="landing-card-continue"
                  onClick={onContinueCoverLetter}
                >
                  Continue Saved Cover Letter
                </button>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
