import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PAGE_META,
  infoPageFromPath,
  normalizePath,
  type InfoPageKey,
} from '../src/lib/publicPages';

const PAGES: InfoPageKey[] = ['about', 'privacy', 'terms'];

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('public page routing and metadata', () => {
  it('maps public paths to information pages', () => {
    expect(infoPageFromPath('/')).toBeNull();
    for (const page of PAGES) {
      expect(infoPageFromPath(`/${page}`)).toBe(page);
      expect(infoPageFromPath(`/${page}/`)).toBe(page);
      expect(infoPageFromPath(`/${page}.html`)).toBe(page);
    }
    expect(normalizePath('/about/')).toBe('/about');
    expect(normalizePath('/')).toBe('/');
  });

  it('defines canonical metadata on the production domain', () => {
    for (const page of ['home', ...PAGES] as const) {
      expect(PAGE_META[page].path.startsWith('/')).toBe(true);
      const canonical = `https://resume.kovina.org${PAGE_META[page].path}`;
      expect(canonical.startsWith('https://resume.kovina.org/')).toBe(true);
    }
  });

  it.each(PAGES)('%s.html carries matching page metadata', (page) => {
    const html = read(`${page}.html`);
    const meta = PAGE_META[page];
    const canonical = `https://resume.kovina.org${meta.path}`;

    expect(html).toContain(`<title>${meta.title}</title>`);
    expect(html).toContain(`<link rel="canonical" href="${canonical}" />`);
    expect(html).toContain('name="description"');
    expect(html).toContain(meta.description);
    expect(html).toContain(`<meta property="og:url" content="${canonical}" />`);
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('src="/src/main.tsx"');
  });

  it('publishes robots.txt and a sitemap with only the public pages', () => {
    const robots = read('public/robots.txt');
    const sitemap = read('public/sitemap.xml');

    expect(robots).toContain('Sitemap: https://resume.kovina.org/sitemap.xml');
    expect(robots).not.toContain('openresume-sigma.vercel.app');
    expect(sitemap).not.toContain('openresume-sigma.vercel.app');

    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual([
      'https://resume.kovina.org/',
      'https://resume.kovina.org/about',
      'https://resume.kovina.org/privacy',
      'https://resume.kovina.org/terms',
    ]);
  });

  it('provides homepage structured data', () => {
    const html = read('index.html');
    expect(html).toContain('"@type": "SoftwareApplication"');
    expect(html).toContain('"url": "https://resume.kovina.org/"');
    expect(html).toContain('"price": "0"');
  });

  it('enables clean URLs for the static information pages', () => {
    const config = JSON.parse(read('vercel.json')) as {
      cleanUrls?: boolean;
      headers?: { source: string; headers: { key: string; value: string }[] }[];
    };
    expect(config.cleanUrls).toBe(true);
    expect(config.headers?.some((header) => header.source === '/(about|privacy|terms)')).toBe(true);
    expect(read('vercel.json')).toContain('"X-Robots-Tag"');
    expect(read('vercel.json')).toContain('openresume-sigma\\\\.vercel\\\\.app');
  });
});
