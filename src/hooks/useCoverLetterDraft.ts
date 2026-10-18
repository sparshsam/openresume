import { loadCoverLetterDraft, saveCoverLetterDraft } from '../lib/storage';
import { usePersistedDocument } from './usePersistedDocument';

export function useCoverLetterDraft() {
  const { document, setDocument, saveState } = usePersistedDocument(
    loadCoverLetterDraft,
    saveCoverLetterDraft,
  );

  return { coverLetter: document, setCoverLetter: setDocument, saveState };
}
