import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APPLICATION_KIT_AI_INSTRUCTIONS, RESUME_AI_INSTRUCTIONS } from '../src/lib/aiInstructions';
import { copyAiInstructions } from '../src/lib/aiClipboard';

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

describe('copyAiInstructions', () => {
  it('copies the resume template', async () => {
    await expect(copyAiInstructions('resume')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(RESUME_AI_INSTRUCTIONS);
  });

  it('copies the application kit template', async () => {
    await expect(copyAiInstructions('applicationKit')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(APPLICATION_KIT_AI_INSTRUCTIONS);
  });

  it('returns false when the clipboard rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('blocked'));
    await expect(copyAiInstructions('resume')).resolves.toBe(false);
  });
});
