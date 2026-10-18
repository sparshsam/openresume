import { useEffect } from 'react';
import { TextField } from './TextField';
import type { FocusTarget } from './EditorPanel';
import { linksToText, textToLinks } from '../lib/links';
import type { CoverLetter } from '../types/coverLetter';
import type { Contact } from '../types/resume';

interface CoverLetterEditorProps {
  letter: CoverLetter;
  focusTarget: FocusTarget | null;
  onApplicant: (patch: Partial<CoverLetter['applicant']>) => void;
  onContact: (patch: Partial<Contact>) => void;
  onLetter: (patch: Partial<CoverLetter>) => void;
  onBodyParagraph: (index: number, value: string) => void;
  onAddParagraph: () => void;
  onRemoveParagraph: (index: number) => void;
  onBackToResume?: () => void;
}

export function CoverLetterEditor({
  letter,
  focusTarget,
  onApplicant,
  onContact,
  onLetter,
  onBodyParagraph,
  onAddParagraph,
  onRemoveParagraph,
  onBackToResume,
}: CoverLetterEditorProps) {
  useEffect(() => {
    if (!focusTarget) return;

    let id: string | null = null;
    if (focusTarget.sectionId === '__header__' || focusTarget.sectionId === 'letter-identity') {
      id = 'letter-name';
    } else if (focusTarget.sectionId === 'letter-body' && focusTarget.itemId) {
      id = `letter-body-${focusTarget.itemId}`;
    } else if (focusTarget.sectionId.startsWith('letter-')) {
      id = focusTarget.sectionId;
    }

    if (!id) return;
    const field = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    field?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    field?.focus({ preventScroll: true });
  }, [focusTarget]);

  return (
    <aside className="editor" id="editor" aria-label="Cover letter editor">
      {onBackToResume ? (
        <button
          type="button"
          className="button button-small button-ghost editor-back"
          onClick={onBackToResume}
        >
          ← Back to resume
        </button>
      ) : null}

      <section className="field-group" id="letter-identity">
        <h2 className="editor-heading">Applicant</h2>
        <TextField
          id="letter-name"
          label="Name"
          value={letter.applicant.name}
          onChange={(name) => onApplicant({ name })}
        />
        <TextField
          id="letter-headline"
          label="Headline (optional)"
          value={letter.applicant.headline ?? ''}
          onChange={(headline) => onApplicant({ headline: headline || undefined })}
        />
        <div className="field-row">
          <TextField
            id="letter-email"
            label="Email"
            value={letter.applicant.contact.email ?? ''}
            onChange={(email) => onContact({ email: email || undefined })}
          />
          <TextField
            id="letter-phone"
            label="Phone"
            value={letter.applicant.contact.phone ?? ''}
            onChange={(phone) => onContact({ phone: phone || undefined })}
          />
        </div>
        <TextField
          id="letter-location"
          label="Location"
          value={letter.applicant.contact.location ?? ''}
          onChange={(location) => onContact({ location: location || undefined })}
        />
        <div className="field">
          <label className="field-label" htmlFor="letter-links">
            Links, one per line as “label | url”
          </label>
          <textarea
            id="letter-links"
            className="textarea"
            rows={3}
            value={linksToText(letter.applicant.contact.links)}
            onChange={(event) => onContact({ links: textToLinks(event.target.value) })}
          />
        </div>
      </section>

      <section className="field-group">
        <h2 className="editor-heading">Letter details</h2>
        <TextField
          id="letter-date"
          label="Date (optional)"
          value={letter.date}
          onChange={(date) => onLetter({ date })}
          placeholder="October 18, 2026"
        />
        <TextField
          id="letter-recipient"
          label="Recipient details (one line per row)"
          value={letter.recipient.join('\n')}
          onChange={(recipientText) => onLetter({ recipient: recipientText.split('\n') })}
          multiline
          rows={5}
          placeholder={'Morgan Lee\nHiring Manager\nBrightline Labs\n123 Example Street'}
        />
        <TextField
          id="letter-position"
          label="Position or subject (optional)"
          value={letter.position}
          onChange={(position) => onLetter({ position })}
          placeholder="Senior Product Engineer"
        />
        <TextField
          id="letter-salutation"
          label="Salutation (optional)"
          value={letter.salutation}
          onChange={(salutation) => onLetter({ salutation })}
          placeholder="Dear Ms. Lee,"
        />
      </section>

      <section className="field-group">
        <h2 className="editor-heading">Body</h2>
        {letter.body.length === 0 ? (
          <p className="empty-note">Add at least one paragraph.</p>
        ) : null}
        {letter.body.map((paragraph, index) => (
          <div className="item-card" key={`paragraph-${index}`}>
            <div className="item-heading">
              <span className="item-heading-label">Paragraph {index + 1}</span>
              <button
                type="button"
                className="button button-small button-danger"
                onClick={() => onRemoveParagraph(index)}
                disabled={letter.body.length <= 1}
                aria-label={`Remove paragraph ${index + 1}`}
              >
                Remove
              </button>
            </div>
            <textarea
              id={`letter-body-${index}`}
              className="textarea"
              rows={5}
              aria-label={`Paragraph ${index + 1}`}
              value={paragraph}
              onChange={(event) => onBodyParagraph(index, event.target.value)}
            />
          </div>
        ))}
        <button type="button" className="button button-small" onClick={onAddParagraph}>
          Add paragraph
        </button>
      </section>

      <section className="field-group">
        <h2 className="editor-heading">Closing</h2>
        <TextField
          id="letter-closing"
          label="Closing (optional)"
          value={letter.closing}
          onChange={(closing) => onLetter({ closing })}
          placeholder="Sincerely,"
        />
        <TextField
          id="letter-signature"
          label="Signature (optional)"
          value={letter.signature}
          onChange={(signature) => onLetter({ signature })}
        />
      </section>
    </aside>
  );
}
