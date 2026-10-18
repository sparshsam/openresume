import { useEffect, useState } from 'react';
import { useDebouncedEffect } from './useDebouncedEffect';

export type SaveState = 'idle' | 'loaded' | 'saving' | 'saved';

export function usePersistedDocument<T>(load: () => T | null, save: (value: T) => void) {
  const [value, setValue] = useState<T | null>(() => load());
  const [saveState, setSaveState] = useState<SaveState>(() => (value ? 'loaded' : 'idle'));

  useDebouncedEffect(
    () => {
      if (!value) return;
      setSaveState('saving');
      save(value);
      setSaveState('saved');
    },
    400,
    [value, save],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (value && document.visibilityState === 'hidden') save(value);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [value, save]);

  return { document: value, setDocument: setValue, saveState };
}
