import { useCallback, useEffect, useState } from 'react';
import { createSampleResume } from '../lib/sample';
import { clearDraft, loadDraft, saveDraft } from '../lib/storage';
import { useDebouncedEffect } from './useDebouncedEffect';
import type { Resume } from '../types/resume';

export type SaveState = 'loaded' | 'saving' | 'saved';

export function useDraft() {
  const [resume, setResume] = useState<Resume>(() => loadDraft() ?? createSampleResume());
  const [saveState, setSaveState] = useState<SaveState>('loaded');

  useDebouncedEffect(
    () => {
      setSaveState('saving');
      saveDraft(resume);
      setSaveState('saved');
    },
    400,
    [resume],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveDraft(resume);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [resume]);

  const reset = useCallback(() => {
    clearDraft();
    setResume((current) => ({ ...createSampleResume(), template: current.template }));
    setSaveState('loaded');
  }, []);

  return { resume, setResume, reset, saveState };
}
