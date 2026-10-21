import { getAiInstructions } from './aiInstructions';
import type { PrepareKind } from '../types/document';

export async function copyAiInstructions(kind: PrepareKind): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getAiInstructions(kind));
    return true;
  } catch {
    return false;
  }
}
