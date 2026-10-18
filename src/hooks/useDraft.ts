import { useEffect, useState } from 'react';
import { loadDraft, saveDraft } from '../lib/storage';
import { useDebouncedEffect } from './useDebouncedEffect';
import type { Resume } from '../types/resume';

export type SaveState = 'idle' | 'loaded' | 'saving' | 'saved';

export function useDraft() {
  const [resume, setResume] = useState<Resume | null>(() => loadDraft());
  const [saveState, setSaveState] = useState<SaveState>(() => (resume ? 'loaded' : 'idle'));

  useDebouncedEffect(
    () => {
      if (!resume) return;
      setSaveState('saving');
      saveDraft(resume);
      setSaveState('saved');
    },
    400,
    [resume],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (resume && document.visibilityState === 'hidden') saveDraft(resume);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [resume]);

  return { resume, setResume, saveState };
}
