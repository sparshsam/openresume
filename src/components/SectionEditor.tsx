import { LIST_KINDS } from '../lib/parse';
import type { ResumeItem, ResumeSection } from '../types/resume';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

function TextField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
}: TextFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className="textarea"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

interface ItemEditorProps {
  section: ResumeSection;
  item: ResumeItem;
  index: number;
  onUpdate: (patch: Partial<ResumeItem>) => void;
  onRemove: () => void;
  onAddBullet: () => void;
  onUpdateBullet: (bulletIndex: number, value: string) => void;
  onRemoveBullet: (bulletIndex: number) => void;
}

function ItemEditor({
  section,
  item,
  index,
  onUpdate,
  onRemove,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
}: ItemEditorProps) {
  const prefix = `${section.id}-${item.id}`;
  const isSkills = section.kind === 'skills';
  const isList = LIST_KINDS.has(section.kind);
  const isSummary = section.kind === 'summary' || section.kind === 'custom';

  return (
    <div className="item-card" id={`item-${section.id}-${item.id}`}>
      <div className="item-heading">
        <span className="item-heading-label">Entry {index + 1}</span>
        <button
          type="button"
          className="button button-small button-danger"
          onClick={onRemove}
          aria-label={`Remove entry ${index + 1} from ${section.title}`}
        >
          Remove
        </button>
      </div>

      {isSkills ? (
        <>
          <TextField
            id={`${prefix}-title`}
            label="Label"
            value={item.title ?? ''}
            onChange={(title) => onUpdate({ title })}
            placeholder="Languages"
          />
          <TextField
            id={`${prefix}-subtitle`}
            label="Values"
            value={item.subtitle ?? ''}
            onChange={(subtitle) => onUpdate({ subtitle })}
            placeholder="TypeScript, Python, SQL"
          />
        </>
      ) : null}

      {isList ? (
        <TextField
          id={`${prefix}-body`}
          label="Text"
          value={item.body ?? ''}
          onChange={(body) => onUpdate({ body })}
          multiline
          rows={2}
          placeholder="Certified example — Issuer, 2024"
        />
      ) : null}

      {isSummary ? (
        <TextField
          id={`${prefix}-body`}
          label="Text"
          value={item.body ?? ''}
          onChange={(body) => onUpdate({ body })}
          multiline
          rows={4}
        />
      ) : null}

      {!isSkills && !isList && !isSummary ? (
        <>
          <TextField
            id={`${prefix}-title`}
            label="Title"
            value={item.title ?? ''}
            onChange={(title) => onUpdate({ title })}
            placeholder="Example Company"
          />
          <TextField
            id={`${prefix}-subtitle`}
            label="Subtitle"
            value={item.subtitle ?? ''}
            onChange={(subtitle) => onUpdate({ subtitle })}
            placeholder="Senior Product Engineer"
          />
          <div className="field-row">
            <TextField
              id={`${prefix}-dates`}
              label="Dates"
              value={item.dateRange ?? ''}
              onChange={(dateRange) => onUpdate({ dateRange })}
              placeholder="2022 – Present"
            />
            <TextField
              id={`${prefix}-location`}
              label="Location"
              value={item.location ?? ''}
              onChange={(location) => onUpdate({ location })}
              placeholder="Toronto, ON"
            />
          </div>
          <TextField
            id={`${prefix}-body`}
            label="Summary text (optional)"
            value={item.body ?? ''}
            onChange={(body) => onUpdate({ body })}
            multiline
            rows={2}
          />
        </>
      ) : null}

      {(isSummary || (!isSkills && !isList)) && (
        <div className="field">
          <span className="field-label">Bullets</span>
          {item.bullets.map((bullet, bulletIndex) => (
            <div className="bullet-row" key={`${item.id}-bullet-${bulletIndex}`}>
              <textarea
                className="textarea"
                rows={2}
                aria-label={`Bullet ${bulletIndex + 1} for entry ${index + 1}`}
                value={bullet}
                onChange={(event) => onUpdateBullet(bulletIndex, event.target.value)}
              />
              <button
                type="button"
                className="button button-small button-danger"
                onClick={() => onRemoveBullet(bulletIndex)}
                aria-label={`Remove bullet ${bulletIndex + 1}`}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="button button-small" onClick={onAddBullet}>
            Add bullet
          </button>
        </div>
      )}
    </div>
  );
}

interface SectionEditorProps {
  section: ResumeSection;
  index: number;
  total: number;
  onUpdate: (patch: Partial<ResumeSection>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<ResumeItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onAddBullet: (itemId: string) => void;
  onUpdateBullet: (itemId: string, bulletIndex: number, value: string) => void;
  onRemoveBullet: (itemId: string, bulletIndex: number) => void;
}

export function SectionEditor({
  section,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
}: SectionEditorProps) {
  return (
    <section className="section-card" id={`section-${section.id}`} aria-label={section.title}>
      <div className="section-header">
        <label className="section-toggle">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(event) => onUpdate({ enabled: event.target.checked })}
          />
          Show
        </label>
        <input
          className="section-title-input"
          aria-label={`Title for ${section.title} section`}
          value={section.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
        />
        <div className="section-controls">
          <select
            className="select button-small"
            aria-label={`Column for ${section.title}`}
            value={section.column}
            onChange={(event) =>
              onUpdate({ column: event.target.value === 'side' ? 'side' : 'main' })
            }
          >
            <option value="main">Main</option>
            <option value="side">Side</option>
          </select>
          <button
            type="button"
            className="button button-icon"
            aria-label={`Move ${section.title} up`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="button button-icon"
            aria-label={`Move ${section.title} down`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="button button-small button-danger"
            aria-label={`Remove ${section.title} section`}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>

      {section.items.length === 0 ? (
        <p className="empty-note">No entries yet.</p>
      ) : (
        section.items.map((item, itemIndex) => (
          <ItemEditor
            key={item.id}
            section={section}
            item={item}
            index={itemIndex}
            onUpdate={(patch) => onUpdateItem(item.id, patch)}
            onRemove={() => onRemoveItem(item.id)}
            onAddBullet={() => onAddBullet(item.id)}
            onUpdateBullet={(bulletIndex, value) => onUpdateBullet(item.id, bulletIndex, value)}
            onRemoveBullet={(bulletIndex) => onRemoveBullet(item.id, bulletIndex)}
          />
        ))
      )}

      <button type="button" className="button button-small" onClick={onAddItem}>
        Add entry
      </button>
    </section>
  );
}
