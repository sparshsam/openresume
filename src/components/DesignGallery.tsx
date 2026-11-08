import { useState } from 'react';
import {
  APPLICATION_CONTEXTS,
  COVER_LETTER_STYLES,
  RESUME_DESIGNS,
  resolveCoverLetterStyle,
  resolveResumeDesign,
  type ApplicationContextId,
} from '../lib/designs';
import type { CoverLetterStyleId, ResumeLayoutId, ResumeTemplate } from '../types/resume';
import type { DocumentKind } from '../types/document';
import { DesignThumbnail } from './DesignThumbnail';

interface DesignGalleryProps {
  kind: DocumentKind;
  template: ResumeTemplate;
  onLayout: (layout: ResumeLayoutId) => void;
  onLetterStyle: (style: CoverLetterStyleId) => void;
  suggestedLetterStyle?: CoverLetterStyleId;
  suggestionSourceName?: string;
}

export function DesignGallery({
  kind,
  template,
  onLayout,
  onLetterStyle,
  suggestedLetterStyle,
  suggestionSourceName,
}: DesignGalleryProps) {
  const [context, setContext] = useState<ApplicationContextId | ''>('');
  const isResume = kind === 'resume';

  if (isResume) {
    const selectedContext = APPLICATION_CONTEXTS.find((entry) => entry.id === context);
    const recommended = new Set(selectedContext?.recommended ?? []);

    return (
      <section className="design-gallery-section" aria-labelledby="design-gallery-heading">
        <div className="design-gallery-toolbar">
          <h3 className="formatting-label" id="design-gallery-heading">
            Browse Designs
          </h3>
          <div className="formatting-field design-context-field">
            <label className="formatting-label" htmlFor="format-context">
              Application context (optional)
            </label>
            <select
              id="format-context"
              className="select"
              value={context}
              onChange={(event) => setContext(event.target.value as ApplicationContextId | '')}
            >
              <option value="">No recommendation</option>
              {APPLICATION_CONTEXTS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedContext ? (
          <p className="design-recommendation" role="status">
            Suggested for {selectedContext.label.toLowerCase()}:{' '}
            {selectedContext.recommended.map((id) => resolveResumeDesign(id).name).join(', ')}.
            Recommendations are informational and do not predict hiring outcomes.
          </p>
        ) : null}

        <p className="design-recommendation">
          Pairs with{' '}
          {resolveCoverLetterStyle(resolveResumeDesign(template.layout).suggestedLetterStyle).name}.
          Letter style stays independent and can be changed on the cover letter.
        </p>

        <div
          className="design-gallery design-gallery--compact"
          role="radiogroup"
          aria-labelledby="design-gallery-heading"
        >
          {RESUME_DESIGNS.map((design) => {
            const selected = template.layout === design.id;
            const isRecommended = recommended.has(design.id);
            return (
              <label
                key={design.id}
                className={`design-card${selected ? ' is-selected' : ''}${isRecommended ? ' is-recommended' : ''}`}
                title={design.description}
              >
                <input
                  className="design-input"
                  type="radio"
                  name="resume-design"
                  value={design.id}
                  checked={selected}
                  onChange={() => onLayout(design.id)}
                  aria-label={`${design.name}. ${design.description}`}
                />
                <span className="design-thumb-frame">
                  <DesignThumbnail kind="resume" design={design} />
                </span>
                <span className="design-card-body">
                  <span className="design-card-name">
                    {design.name}
                    {selected ? (
                      <span className="design-selected" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </span>
                  {isRecommended ? <span className="design-badge">Suggested</span> : null}
                </span>
              </label>
            );
          })}
        </div>
      </section>
    );
  }

  const suggested = suggestedLetterStyle
    ? resolveCoverLetterStyle(suggestedLetterStyle)
    : undefined;
  const showSuggestion = suggested && suggested.id !== template.letterStyle && suggestionSourceName;

  return (
    <section className="design-gallery-section" aria-labelledby="letter-style-heading">
      <h3 className="formatting-label" id="letter-style-heading">
        Letter style
      </h3>
      {showSuggestion ? (
        <p className="design-recommendation">
          {suggestionSourceName} pairs well with {suggested.name}.{' '}
          <button
            type="button"
            className="button button-small"
            onClick={() => onLetterStyle(suggested.id)}
          >
            Use {suggested.name}
          </button>
        </p>
      ) : null}
      <div
        className="design-gallery design-gallery--compact design-gallery-letter"
        role="radiogroup"
        aria-labelledby="letter-style-heading"
      >
        {COVER_LETTER_STYLES.map((style) => {
          const selected = template.letterStyle === style.id;
          return (
            <label
              key={style.id}
              className={`design-card${selected ? ' is-selected' : ''}`}
              title={style.description}
            >
              <input
                className="design-input"
                type="radio"
                name="letter-style"
                value={style.id}
                checked={selected}
                onChange={() => onLetterStyle(style.id)}
                aria-label={`${style.name}. ${style.description}`}
              />
              <span className="design-thumb-frame">
                <DesignThumbnail kind="coverLetter" style={style} />
              </span>
              <span className="design-card-body">
                <span className="design-card-name">
                  {style.name}
                  {selected ? (
                    <span className="design-selected" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
