export type GuidedAssistantId = 'chatgpt' | 'claude' | 'gemini';

export interface GuidedAssistant {
  id: GuidedAssistantId;
  name: string;
  description: string;
  /** The provider's new-chat page. Opened in a separate tab. */
  url: string;
}

export const GUIDED_ASSISTANTS: GuidedAssistant[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI’s assistant. You may need to sign in or create a free account.',
    url: 'https://chatgpt.com/',
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic’s assistant. You may need to sign in or create an account.',
    url: 'https://claude.ai/new',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google’s assistant. You may need to sign in with a Google account.',
    url: 'https://gemini.google.com/app',
  },
];

export function findGuidedAssistant(id: GuidedAssistantId): GuidedAssistant {
  return GUIDED_ASSISTANTS.find((assistant) => assistant.id === id) ?? GUIDED_ASSISTANTS[0];
}
