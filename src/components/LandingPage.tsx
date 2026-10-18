import { Icon } from './Icon';

interface LandingPageProps {
  hasResume: boolean;
  hasCoverLetter: boolean;
  onResume: () => void;
  onCoverLetter: () => void;
}

export function LandingPage({
  hasResume,
  hasCoverLetter,
  onResume,
  onCoverLetter,
}: LandingPageProps) {
  return (
    <main className="landing" id="main">
      <div className="landing-inner">
        <p className="landing-eyebrow">OpenResume</p>
        <h1 className="landing-title">Build a document that feels considered.</h1>
        <p className="landing-lede">
          Choose a document, paste structured content from an AI assistant, and review a precise
          live preview before exporting. Your content stays in this browser.
        </p>

        <div className="landing-options">
          <button type="button" className="landing-option" onClick={onResume}>
            <span className="landing-icon" aria-hidden="true">
              <Icon name="fileText" size={24} />
            </span>
            <span className="landing-copy">
              <span className="landing-option-title">Build Resume</span>
              <span className="landing-option-description">
                Turn structured experience into a precise, two-column resume.
              </span>
              <span className="landing-draft">
                {hasResume ? 'Draft saved · Continue' : 'Start from structured text'}
              </span>
            </span>
            <span className="landing-arrow" aria-hidden="true">
              →
            </span>
          </button>

          <button type="button" className="landing-option" onClick={onCoverLetter}>
            <span className="landing-icon" aria-hidden="true">
              <Icon name="mail" size={24} />
            </span>
            <span className="landing-copy">
              <span className="landing-option-title">Build Cover Letter</span>
              <span className="landing-option-description">
                Shape a calm, single-column letter that matches your resume.
              </span>
              <span className="landing-draft">
                {hasCoverLetter ? 'Draft saved · Continue' : 'Start from structured text'}
              </span>
            </span>
            <span className="landing-arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
