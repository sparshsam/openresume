import { describe, expect, it } from 'vitest';
import {
  addBullet,
  addItem,
  addSection,
  moveSection,
  removeBullet,
  removeItem,
  removeSection,
  updateBullet,
  updateItem,
  updateSection,
} from '../src/lib/resumeEdits';
import { createSampleResume } from '../src/lib/sample';

describe('resumeEdits', () => {
  it('moves sections without mutating the original', () => {
    const resume = createSampleResume();
    const firstTitle = resume.sections[0].title;
    const moved = moveSection(resume, resume.sections[0].id, 1);
    expect(moved.sections[1].title).toBe(firstTitle);
    expect(resume.sections[0].title).toBe(firstTitle);
    expect(moved).not.toBe(resume);
  });

  it('ignores out-of-range moves', () => {
    const resume = createSampleResume();
    expect(moveSection(resume, resume.sections[0].id, -1)).toBe(resume);
    const last = resume.sections[resume.sections.length - 1];
    expect(moveSection(resume, last.id, 1)).toBe(resume);
  });

  it('adds and removes sections', () => {
    const resume = createSampleResume();
    const added = addSection(resume, 'custom');
    expect(added.sections).toHaveLength(resume.sections.length + 1);
    const removed = removeSection(added, added.sections[added.sections.length - 1].id);
    expect(removed.sections).toHaveLength(resume.sections.length);
  });

  it('adds, updates, and removes items', () => {
    const resume = createSampleResume();
    const section = resume.sections.find((item) => item.kind === 'experience')!;
    const added = addItem(resume, section.id);
    const target = added.sections.find((item) => item.id === section.id)!;
    const newItem = target.items[target.items.length - 1];

    const updated = updateItem(added, section.id, newItem.id, { title: 'New Role' });
    const updatedSection = updated.sections.find((item) => item.id === section.id)!;
    expect(updatedSection.items[updatedSection.items.length - 1].title).toBe('New Role');

    const removed = removeItem(updated, section.id, newItem.id);
    const removedSection = removed.sections.find((item) => item.id === section.id)!;
    expect(removedSection.items).toHaveLength(section.items.length);
  });

  it('adds, updates, and removes bullets', () => {
    const resume = createSampleResume();
    const section = resume.sections.find((item) => item.kind === 'experience')!;
    const item = section.items[0];

    const added = addBullet(resume, section.id, item.id);
    const withBullet = added.sections
      .find((s) => s.id === section.id)!
      .items.find((i) => i.id === item.id)!;
    expect(withBullet.bullets).toHaveLength(item.bullets.length + 1);

    const index = withBullet.bullets.length - 1;
    const updated = updateBullet(added, section.id, item.id, index, 'A new bullet.');
    const updatedItem = updated.sections
      .find((s) => s.id === section.id)!
      .items.find((i) => i.id === item.id)!;
    expect(updatedItem.bullets[index]).toBe('A new bullet.');

    const removed = removeBullet(updated, section.id, item.id, index);
    const removedItem = removed.sections
      .find((s) => s.id === section.id)!
      .items.find((i) => i.id === item.id)!;
    expect(removedItem.bullets).toHaveLength(item.bullets.length);
  });

  it('updates section metadata', () => {
    const resume = createSampleResume();
    const section = resume.sections[0];
    const updated = updateSection(resume, section.id, { enabled: false, column: 'side' });
    expect(updated.sections[0]).toMatchObject({ enabled: false, column: 'side' });
  });
});
