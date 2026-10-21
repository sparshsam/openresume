import type { ReactNode } from 'react';
import { InternalLink } from './InternalLink';

const CONTACT_EMAIL = 'sparshsam@gmail.com';
const EFFECTIVE_DATE = '18 October 2026';

function InfoLayout({
  eyebrow,
  title,
  lede,
  effective,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  effective?: string;
  children: ReactNode;
}) {
  return (
    <main className="info-page" id="main">
      <div className="info-inner">
        <InternalLink className="info-back" href="/">
          <span aria-hidden="true">←</span> Back to builder
        </InternalLink>

        <p className="info-eyebrow">{eyebrow}</p>
        <h1 className="info-title">{title}</h1>
        <p className="info-lede">{lede}</p>
        {effective ? <p className="info-effective">Effective {effective}</p> : null}

        <div className="info-prose">{children}</div>

        <div className="info-actions">
          <InternalLink className="button button-primary" href="/">
            Back to builder
          </InternalLink>
        </div>
      </div>
    </main>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function AboutPage() {
  return (
    <InfoLayout
      eyebrow="About OpenResume"
      title="Your documents. Your words. Your next opportunity."
      lede="OpenResume is a free, straightforward way to create professional resumes, cover letters, and complete application kits without accounts, subscriptions, or unnecessary complexity."
    >
      <p>
        Bring your content, choose a document, make adjustments, and download your finished PDF or
        Word file.
      </p>
      <p>We provide the design and formatting. You remain in control of what your documents say.</p>
      <p>
        Build a resume, a cover letter, or an Application Kit that pairs a tailored resume with a
        matching cover letter from one prepared response.
      </p>
      <p>Choose from a selection of professional accent colours for each document.</p>
      <p>
        OpenResume is built by Kovina with a simple idea: useful tools should be accessible, easy to
        use, and respectful of your privacy.
      </p>
      <p>
        Resumes and cover letters remain available on their own; the Application Kit simply builds
        both together when one role needs one coordinated application.
      </p>

      <section aria-labelledby="workflow-heading">
        <h2 id="workflow-heading">How it works</h2>
        <ol className="info-workflow">
          <li>
            <span className="info-step" aria-hidden="true">
              1
            </span>
            <span>
              <strong>Prepare your content.</strong> Bring structured text prepared however you
              like.
            </span>
          </li>
          <li>
            <span className="info-step" aria-hidden="true">
              2
            </span>
            <span>
              <strong>Build your document.</strong> Choose a resume, cover letter, or Application
              Kit and paste your content.
            </span>
          </li>
          <li>
            <span className="info-step" aria-hidden="true">
              3
            </span>
            <span>
              <strong>Adjust and preview.</strong> Refine the content, layout, and formatting while
              the live preview updates.
            </span>
          </li>
          <li>
            <span className="info-step" aria-hidden="true">
              4
            </span>
            <span>
              <strong>Download PDF or DOCX.</strong> Export each document on its own, or download a
              combined Application Kit package generated locally in your browser.
            </span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="kovina-heading">
        <h2 id="kovina-heading">Built by Kovina</h2>
        <p>
          OpenResume is part of the <ExternalLink href="https://kovina.org">Kovina</ExternalLink>{' '}
          ecosystem of owned, local-first tools. The source is available on{' '}
          <ExternalLink href="https://github.com/sparshsam/openresume">GitHub</ExternalLink> under
          the MIT License.
        </p>
      </section>
    </InfoLayout>
  );
}

export function PrivacyPage() {
  return (
    <InfoLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      lede="Your resume belongs to you. We don't want a copy."
      effective={EFFECTIVE_DATE}
    >
      <section aria-labelledby="processing-heading">
        <h2 id="processing-heading">Document processing</h2>
        <p>
          Resume, cover letter, and Application Kit content is processed locally in your browser.
          OpenResume does not send document content to a server, and there is no document upload.
        </p>
      </section>

      <section aria-labelledby="storage-heading">
        <h2 id="storage-heading">Document storage</h2>
        <p>
          Document contents are held in memory during the current application session. They are not
          automatically saved to <code>localStorage</code>, <code>sessionStorage</code>, or a cloud
          account.
        </p>
        <p>
          Refreshing or closing the application clears the current documents. Older versions of
          OpenResume stored drafts in the browser; the current version removes recognized legacy
          draft entries and does not restore them.
        </p>
      </section>

      <section aria-labelledby="downloads-heading">
        <h2 id="downloads-heading">Downloads</h2>
        <p>
          PDF and DOCX files are generated locally in your browser from the document currently in
          memory. The files are not uploaded or stored by OpenResume.
        </p>
      </section>

      <section aria-labelledby="accounts-heading">
        <h2 id="accounts-heading">Accounts and analytics</h2>
        <p>
          OpenResume has no user accounts, no application analytics, no advertising trackers, and no
          collection of document content.
        </p>
      </section>

      <section aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance preferences</h2>
        <p>
          The application stores your selected appearance preference locally in the browser under{' '}
          <code>openresume-theme</code>. It is used only to restore the interface theme and is not
          sent anywhere.
        </p>
      </section>

      <section aria-labelledby="hosting-heading">
        <h2 id="hosting-heading">Hosting and technical information</h2>
        <p>
          The website is hosted on Vercel. Ordinary technical information, including IP addresses
          and HTTP request metadata, may be processed by Vercel and other infrastructure providers
          to deliver and secure the website. That processing is governed by their respective
          policies.
        </p>
      </section>

      <section aria-labelledby="external-services-heading">
        <h2 id="external-services-heading">External services</h2>
        <p>
          OpenResume contains no integrated AI service. If you use ChatGPT, Claude, or another
          external tool to prepare content, that service has its own privacy practices and may
          process what you give it.
        </p>
      </section>

      <section aria-labelledby="external-links-heading">
        <h2 id="external-links-heading">External links</h2>
        <p>
          Links to Kovina, GitHub, and other websites are governed by those websites&apos;
          respective practices. OpenResume does not control their content or privacy policies.
        </p>
      </section>

      <section aria-labelledby="changes-heading">
        <h2 id="changes-heading">Changes</h2>
        <p>
          This policy may be updated if OpenResume&apos;s functionality or data practices change.
          The effective date at the top of this page reflects the current version.
        </p>
      </section>

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact</h2>
        <p>
          Questions about this policy can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </InfoLayout>
  );
}

export function TermsPage() {
  return (
    <InfoLayout
      eyebrow="Terms"
      title="Terms of Use"
      lede="OpenResume is a free, open-source tool for building resumes and cover letters in your browser."
      effective={EFFECTIVE_DATE}
    >
      <section aria-labelledby="free-use-heading">
        <h2 id="free-use-heading">Free use</h2>
        <p>OpenResume is free to use. No account or subscription is required.</p>
      </section>

      <section aria-labelledby="ownership-heading">
        <h2 id="ownership-heading">Document ownership</h2>
        <p>
          You retain ownership and control of the content you enter. OpenResume does not claim
          ownership of resumes, cover letters, or application kits created through the application.
        </p>
      </section>

      <section aria-labelledby="permitted-heading">
        <h2 id="permitted-heading">Permitted use</h2>
        <p>
          You may create, edit, download, and use your documents for lawful personal or professional
          purposes.
        </p>
      </section>

      <section aria-labelledby="responsibility-heading">
        <h2 id="responsibility-heading">Your responsibility</h2>
        <p>
          You are responsible for ensuring that your information is accurate, appropriate, and
          lawfully used. Review every document before sending it to another person or organization.
        </p>
      </section>

      <section aria-labelledby="advice-heading">
        <h2 id="advice-heading">No professional advice</h2>
        <p>
          OpenResume is a formatting and document-building tool. It does not provide legal,
          immigration, employment, or professional career advice.
        </p>
      </section>

      <section aria-labelledby="availability-heading">
        <h2 id="availability-heading">Availability</h2>
        <p>
          The application is provided as available. Features, templates, and functionality may
          change or be removed as the project evolves.
        </p>
      </section>

      <section aria-labelledby="guarantees-heading">
        <h2 id="guarantees-heading">No guarantees</h2>
        <p>
          OpenResume does not promise employment outcomes, applicant tracking system compatibility,
          uninterrupted availability, or error-free exports. Generated documents should be reviewed
          and tested in your intended workflow.
        </p>
      </section>

      <section aria-labelledby="license-heading">
        <h2 id="license-heading">Open-source licensing</h2>
        <p>
          OpenResume&apos;s source code is available under the{' '}
          <ExternalLink href="https://github.com/sparshsam/openresume/blob/main/LICENSE">
            MIT License
          </ExternalLink>
          . The repository license governs use of the source code. These terms govern use of the
          hosted application.
        </p>
      </section>

      <section aria-labelledby="terms-changes-heading">
        <h2 id="terms-changes-heading">Changes to these terms</h2>
        <p>
          These terms may be updated as the application evolves. The effective date at the top of
          this page reflects the current version.
        </p>
      </section>

      <section aria-labelledby="terms-contact-heading">
        <h2 id="terms-contact-heading">Contact</h2>
        <p>
          Questions about these terms can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </InfoLayout>
  );
}
