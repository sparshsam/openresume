import type { ContactLink } from '../types/resume';

export function linksToText(links: ContactLink[]): string {
  return links.map((link) => `${link.label} | ${link.url}`).join('\n');
}

export function textToLinks(text: string): ContactLink[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, second] = line.split('|').map((part) => part.trim());
      const url = second || first;
      return {
        label: first,
        url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
      };
    });
}
