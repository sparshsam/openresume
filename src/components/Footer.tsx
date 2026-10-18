import { APP_VERSION } from '../lib/appMeta';

export function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-inner">
        <p className="footer-brand">
          <span className="footer-product">OpenResume</span>{' '}
          <span className="footer-version">v{APP_VERSION}</span> — Part of the{' '}
          <a href="https://kovina.org" target="_blank" rel="noopener noreferrer">
            Kovina
          </a>{' '}
          ecosystem. Built by{' '}
          <a href="https://github.com/sparshsam" target="_blank" rel="noopener noreferrer">
            Sparsh Sam
          </a>
          .
        </p>
        <nav className="footer-links" aria-label="Footer">
          <a
            href="https://github.com/sparshsam/openresume"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://github.com/sparshsam/openresume/blob/main/docs/input-format.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Input format
          </a>
          <a
            href="https://github.com/sparshsam/openresume/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT license
          </a>
        </nav>
      </div>
    </footer>
  );
}
