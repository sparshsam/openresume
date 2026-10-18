import { DOCUMENT_ACCENTS, documentAccentName } from '../lib/tokens';
import type { DocumentKind } from '../types/document';
import type {
  ColumnSpacingPreset,
  DensityPreset,
  FontSizePreset,
  FormatSettings,
  MarginPreset,
  PageSize,
  ResumeTemplate,
  SpacingPreset,
} from '../types/resume';

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

interface FormattingPanelProps {
  kind: DocumentKind;
  template: ResumeTemplate;
  onPageSize: (pageSize: PageSize) => void;
  onFormat: (patch: Partial<FormatSettings>) => void;
  onAccent: (accent: string) => void;
  onReset: () => void;
}

export function FormattingPanel({
  kind,
  template,
  onPageSize,
  onFormat,
  onAccent,
  onReset,
}: FormattingPanelProps) {
  const { format } = template;
  const selectedAccent = documentAccentName(template.accent) ?? 'Custom';

  return (
    <section className="formatting-panel" id="formatting-panel" aria-label="Document formatting">
      <div className="formatting-accent">
        <span className="formatting-label" id="format-accent-label">
          Accent Colour
        </span>
        <div className="accent-options" role="radiogroup" aria-labelledby="format-accent-label">
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
          <>
            <SelectField
              id="format-bullet-spacing"
              label="Bullet spacing"
              value={format.bulletSpacing}
              options={SPACING_OPTIONS}
              onChange={(bulletSpacing) => onFormat({ bulletSpacing })}
            />
            <SelectField
              id="format-column-spacing"
              label="Column spacing"
              value={format.columnSpacing}
              options={COLUMN_OPTIONS}
              onChange={(columnSpacing) => onFormat({ columnSpacing })}
            />
          </>
        )}
        <SelectField
          id="format-density"
          label="Content density"
          value={format.density}
          options={DENSITY_OPTIONS}
          onChange={(density) => onFormat({ density })}
        />
      </div>
      <div className="formatting-actions">
        <p className="formatting-note">
          Changes apply to the preview, PDF, and DOCX. Density adjusts vertical rhythm on top of
          your individual spacing choices.
        </p>
        <button type="button" className="button button-small" onClick={onReset}>
          Reset to defaults
        </button>
      </div>
    </section>
  );
}
