export const SITE_ORIGIN = 'https://resume.kovina.org';
export const SOCIAL_IMAGE = `${SITE_ORIGIN}/openresume-social.png`;

export type InfoPageKey = 'about' | 'privacy' | 'terms';
type PageKey = 'home' | InfoPageKey;

interface PageMeta {
  title: string;
  description: string;
  path: string;
}

export const PAGE_META: Record<PageKey, PageMeta> = {
  home: {
    title: 'OpenResume — Resume and cover letter builder',
    description:
      'Privacy-first, local-first resume and cover letter builder. Turn AI-prepared content into precise PDF or Word documents. Your content stays in your browser.',
    path: '/',
  },
  about: {
    title: 'About OpenResume',
    description:
      'Learn how OpenResume turns prepared content into polished PDF and DOCX resumes and cover letters, built by Kovina.',
    path: '/about',
  },
  privacy: {
    title: 'Privacy Policy — OpenResume',
    description:
      'How OpenResume handles your documents: local processing, session-only memory, no accounts, no analytics, and local exports.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Use — OpenResume',
    description:
      'Terms for using OpenResume, a free, open-source resume and cover letter builder from Kovina.',
    path: '/terms',
  },
};

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = href;
}

export function applyPageMeta(page: InfoPageKey | null): void {
  const key: PageKey = page ?? 'home';
  const meta = PAGE_META[key];
  const canonical = `${SITE_ORIGIN}${meta.path}`;

  document.title = meta.title;
  setMeta('name', 'description', meta.description);
  setCanonical(canonical);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', SOCIAL_IMAGE);
  setMeta('property', 'og:type', 'website');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', SOCIAL_IMAGE);
}

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function infoPageFromPath(pathname: string): InfoPageKey | null {
  const path = normalizePath(pathname).replace(/\.html$/, '');
  if (path === '/about') return 'about';
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return null;
}

/**
 * Client-side navigation for the three public information pages. It never
 * reloads the document, so the in-memory resume and cover letter survive.
 */
export function navigate(path: string): void {
  const target = normalizePath(path);
  if (normalizePath(window.location.pathname) !== target) {
    window.history.pushState({}, '', target);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}
