import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface PngExpectation {
  path: string;
  width: number;
  height: number;
}

const PNG_ASSETS: PngExpectation[] = [
  { path: 'assets/branding/source-assets/openresume_lightmode.png', width: 1024, height: 1024 },
  { path: 'assets/branding/source-assets/openresume_darkmode.png', width: 1024, height: 1024 },
  { path: 'assets/app-icon/icon-source.png', width: 1024, height: 1024 },
  { path: 'assets/app-icon/light/favicon-16.png', width: 16, height: 16 },
  { path: 'assets/app-icon/light/favicon-32.png', width: 32, height: 32 },
  { path: 'assets/app-icon/light/apple-touch-icon.png', width: 180, height: 180 },
  { path: 'assets/app-icon/light/apple-touch-icon-152x152.png', width: 152, height: 152 },
  { path: 'assets/app-icon/light/mstile-150x150.png', width: 150, height: 150 },
  { path: 'assets/app-icon/light/icon-192.png', width: 192, height: 192 },
  { path: 'assets/app-icon/light/icon-512.png', width: 512, height: 512 },
  { path: 'assets/app-icon/dark/favicon-16.png', width: 16, height: 16 },
  { path: 'assets/app-icon/dark/favicon-32.png', width: 32, height: 32 },
  { path: 'assets/app-icon/dark/icon-192.png', width: 192, height: 192 },
  { path: 'assets/app-icon/dark/icon-512.png', width: 512, height: 512 },
  { path: 'public/favicon-16.png', width: 16, height: 16 },
  { path: 'public/favicon-16-dark.png', width: 16, height: 16 },
  { path: 'public/favicon-32.png', width: 32, height: 32 },
  { path: 'public/favicon-32-dark.png', width: 32, height: 32 },
  { path: 'public/apple-touch-icon.png', width: 180, height: 180 },
  { path: 'public/apple-touch-icon-152x152.png', width: 152, height: 152 },
  { path: 'public/mstile-150x150.png', width: 150, height: 150 },
  { path: 'public/icon-192.png', width: 192, height: 192 },
  { path: 'public/icon-192-dark.png', width: 192, height: 192 },
  { path: 'public/icon-512.png', width: 512, height: 512 },
  { path: 'public/icon-512-dark.png', width: 512, height: 512 },
  { path: 'public/openresume-social.png', width: 1200, height: 630 },
];

function pngSize(buffer: Buffer): { width: number; height: number } {
  expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('brand assets', () => {
  it.each(PNG_ASSETS)('$path is a valid $width×$height PNG', ({ path, width, height }) => {
    const file = resolve(process.cwd(), path);
    const buffer = readFileSync(file);
    expect(statSync(file).size).toBeGreaterThan(0);
    expect(pngSize(buffer)).toEqual({ width, height });
  });

  it.each(['public/favicon.ico', 'assets/app-icon/light/favicon.ico'])(
    '%s is a multi-resolution ICO',
    (path) => {
      const buffer = readFileSync(resolve(process.cwd(), path));
      expect(buffer.readUInt16LE(0)).toBe(0);
      expect(buffer.readUInt16LE(2)).toBe(1);
      expect(buffer.readUInt16LE(4)).toBeGreaterThanOrEqual(2);
    },
  );

  it('keeps repository masters byte-identical to the preserved copies', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'assets/branding/source-assets/openresume_lightmode.png'),
    );
    const canonical = readFileSync(resolve(process.cwd(), 'assets/app-icon/icon-source.png'));
    expect(canonical.equals(source)).toBe(true);
  });
});
