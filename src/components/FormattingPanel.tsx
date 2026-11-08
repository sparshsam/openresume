import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { DOCUMENT_ACCENTS, documentAccentName } from '../lib/tokens';
import { resolveResumeDesign } from '../lib/designs';
import type { DocumentKind } from '../types/document';
import type {
  ColumnSpacingPreset,
  CoverLetterStyleId,
  DensityPreset,
  FontSizePreset,
  FormatSettings,
  MarginPreset,
  PageSize,
  PaginationSettings,
  ResumeLayoutId,
  ResumeTemplate,
  SpacingPreset,
} from '../types/resume';
import { DesignGallery } from './DesignGallery';
import { Icon } from './Icon';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <div className="formatting-field">
      <label className="formatting-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const PAGE_OPTIONS: SelectOption<PageSize>[] = [
  { value: 'letter', label: 'US Letter (8.5 × 11 in)' },
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'legal', label: 'US Legal (8.5 × 14 in)' },
];

const MARGIN_OPTIONS: SelectOption<MarginPreset>[] = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
];

const FONT_OPTIONS: SelectOption<FontSizePreset>[] = [
  { value: 'small', label: 'Small' },
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large' },
];

const SPACING_OPTIONS: SelectOption<SpacingPreset>[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'standard', label: 'Standard' },
  { value: 'relaxed', label: 'Relaxed' },
];

const COLUMN_OPTIONS: SelectOption<ColumnSpacingPreset>[] = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'standard', label: 'Standard' },
  { value: 'wide', label: 'Wide' },
];

const DENSITY_OPTIONS: SelectOption<DensityPreset>[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'spacious', label: 'Spacious' },
];

type FormatTab = 'design' | 'format';

interface FormattingPanelProps {
  kind: DocumentKind;
  template: ResumeTemplate;
  onPageSize: (pageSize: PageSize) => void;
  onLayout: (layout: ResumeLayoutId) => void;
  onLetterStyle: (style: CoverLetterStyleId) => void;
  onFormat: (patch: Partial<FormatSettings>) => void;
  onPagination: (patch: Partial<PaginationSettings>) => void;
  onAccent: (accent: string) => void;
  onReset: () => void;
  onClose: () => void;
  suggestedLetterStyle?: CoverLetterStyleId;
  suggestionSourceName?: string;
}

export function FormattingPanel({
  kind,
  template,
  onPageSize,
  onLayout,
  onLetterStyle,
  onFormat,
  onPagination,
  onAccent,
  onReset,
  onClose,
  suggestedLetterStyle,
  suggestionSourceName,
}: FormattingPanelProps) {
  const { format } = template;
  const [tab, setTab] = useState<FormatTab>('format');
  const tabRefs = useRef<Record<FormatTab, HTMLButtonElement | null>>({
    design: null,
    format: null,
  });
  const closeIntent = useRef(false);
  const selectedAccent = documentAccentName(template.accent) ?? 'Custom';
  const atsSimple = kind === 'resume' && template.layout === 'atsSimple';
  const twoColumns = kind === 'resume' && resolveResumeDesign(template.layout).columns === 2;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    tabRefs.current.format?.focus();
    return () => {
      // Only a user-initiated close returns focus. A programmatic close, such
      // as switching kit tabs, keeps the focus that triggered it.
      if (closeIntent.current) previous?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeIntent.current = true;
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: FormatTab = tab === 'design' ? 'format' : 'design';
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <button
        type="button"
        className="format-backdrop"
        aria-label="Dismiss formatting"
        onClick={() => {
          closeIntent.current = true;
          onClose();
        }}
      />
      <aside
        className="formatting-panel format-drawer"
        id="formatting-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="format-drawer-title"
      >
        <div className="format-drawer-header">
          <div>
            <p className="format-drawer-eyebrow">Document</p>
            <h2 className="format-drawer-title" id="format-drawer-title">
              Format
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close formatting panel"
            onClick={() => {
              closeIntent.current = true;
              onClose();
            }}
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="format-tabs" role="tablist" aria-label="Formatting areas">
          <button
            ref={(node) => {
              tabRefs.current.design = node;
            }}
            type="button"
            role="tab"
            id="format-tab-design"
            aria-controls="format-panel-design"
            aria-selected={tab === 'design'}
            tabIndex={tab === 'design' ? 0 : -1}
            onClick={() => setTab('design')}
            onKeyDown={onTabKeyDown}
          >
            Designs
          </button>
          <button
            ref={(node) => {
              tabRefs.current.format = node;
            }}
            type="button"
            role="tab"
            id="format-tab-format"
            aria-controls="format-panel-format"
            aria-selected={tab === 'format'}
            tabIndex={tab === 'format' ? 0 : -1}
            onClick={() => setTab('format')}
            onKeyDown={onTabKeyDown}
          >
            Formatting
          </button>
        </div>

        <div className="format-drawer-body">
          <section
            className="format-panel"
            id="format-panel-design"
            role="tabpanel"
            aria-labelledby="format-tab-design"
            hidden={tab !== 'design'}
          >
            <DesignGallery
              kind={kind}
              template={template}
              onLayout={onLayout}
              onLetterStyle={onLetterStyle}
              suggestedLetterStyle={suggestedLetterStyle}
              suggestionSourceName={suggestionSourceName}
            />
          </section>

          <section
            className="format-panel"
            id="format-panel-format"
            role="tabpanel"
            aria-labelledby="format-tab-format"
            hidden={tab !== 'format'}
          >
            <div className="formatting-accent">
              <span className="formatting-label" id="format-accent-label">
                Accent Colour
              </span>
              <div
                className="accent-options"
                role="radiogroup"
                aria-labelledby="format-accent-label"
              >
                {DOCUMENT_ACCENTS.map((accent) => (
                  <label className="accent-swatch" key={accent.value} title={accent.name}>
                    <input
                      className="accent-input"
                      type="radio"
                      name="accent-colour"
                      value={accent.value}
                      checked={template.accent.toLowerCase() === accent.value.toLowerCase()}
                      onChange={() => onAccent(accent.value)}
                      aria-label={accent.name}
                    />
                    <span
                      className="accent-dot"
                      style={{ backgroundColor: accent.value }}
                      aria-hidden="true"
                    />
                  </label>
                ))}
                <span className="accent-name" aria-live="polite">
                  {selectedAccent}
                </span>
              </div>
            </div>

            <h3 className="formatting-label format-group-heading">Page</h3>
            <div className="formatting-grid">
              <SelectField
                id="format-page-size"
                label="Page size"
                value={template.pageSize}
                options={PAGE_OPTIONS}
                onChange={onPageSize}
              />
              <SelectField
                id="format-margins"
                label="Page margins"
                value={format.margins}
                options={MARGIN_OPTIONS}
                onChange={(margins) => onFormat({ margins })}
              />
            </div>

            <h3 className="formatting-label format-group-heading">Typography</h3>
            <div className="formatting-grid">
              <SelectField
                id="format-font-size"
                label="Font size"
                value={format.fontSize}
                options={FONT_OPTIONS}
                onChange={(fontSize) => onFormat({ fontSize })}
              />
              <SelectField
                id="format-line-spacing"
                label="Line spacing"
                value={format.lineSpacing}
                options={SPACING_OPTIONS}
                onChange={(lineSpacing) => onFormat({ lineSpacing })}
              />
            </div>

            <h3 className="formatting-label format-group-heading">Spacing</h3>
            <div className="formatting-grid">
              <SelectField
                id="format-section-spacing"
                label="Section spacing"
                value={format.sectionSpacing}
                options={SPACING_OPTIONS}
                onChange={(sectionSpacing) => onFormat({ sectionSpacing })}
              />
              {kind === 'coverLetter' ? (
                <SelectField
                  id="format-paragraph-spacing"
                  label="Paragraph spacing"
                  value={format.paragraphSpacing}
                  options={SPACING_OPTIONS}
                  onChange={(paragraphSpacing) => onFormat({ paragraphSpacing })}
                />
              ) : (
                <SelectField
                  id="format-bullet-spacing"
                  label="Bullet spacing"
                  value={format.bulletSpacing}
                  options={SPACING_OPTIONS}
                  onChange={(bulletSpacing) => onFormat({ bulletSpacing })}
                />
              )}
              {kind === 'resume' && twoColumns ? (
                <SelectField
                  id="format-column-spacing"
                  label="Column spacing"
                  value={format.columnSpacing}
                  options={COLUMN_OPTIONS}
                  onChange={(columnSpacing) => onFormat({ columnSpacing })}
                />
              ) : null}
              <SelectField
                id="format-density"
                label="Content density"
                value={format.density}
                options={DENSITY_OPTIONS}
                onChange={(density) => onFormat({ density })}
              />
            </div>

            {kind === 'resume' ? (
              <div className="formatting-pagination">
                <label className="section-toggle">
                  <input
                    type="checkbox"
                    checked={template.pagination.keepEntriesTogether}
                    onChange={(event) =>
                      onPagination({ keepEntriesTogether: event.target.checked })
                    }
                  />
                  Keep entries together
                </label>
                <p className="formatting-note">
                  Section headings stay with their first entry. Use “New page” on a section to start
                  it on a fresh page. Automatic pagination remains the default, and an entry taller
                  than a page still flows across pages.
                </p>
              </div>
            ) : null}

            {atsSimple ? (
              <p className="formatting-note">
                ATS Simple reads in one linear column with standard section headings and no tables.
                No layout can guarantee compatibility with every applicant tracking system.
              </p>
            ) : null}
          </section>
        </div>

        <div className="format-drawer-footer">
          <p className="formatting-note">Applies to the preview, PDF, and Word export.</p>
          <button type="button" className="button button-small" onClick={onReset}>
            Reset to defaults
          </button>
        </div>
      </aside>
    </>
  );
}
