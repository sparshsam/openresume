import { loadDraft, saveDraft } from '../lib/storage';
import { usePersistedDocument, type SaveState } from './usePersistedDocument';

export type { SaveState };

export function useDraft() {
  const { document, setDocument, saveState } = usePersistedDocument(loadDraft, saveDraft);

  return { resume: document, setResume: setDocument, saveState };
}
