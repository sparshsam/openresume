import { useEffect, useRef, useState } from 'react';
import { PageView } from './PageView';
import { PAGE } from '../lib/tokens';
import type { Layout } from '../lib/layout';

const PAGE_GAP_PX = 28;
const PX_PER_PT = 96 / 72;

interface PreviewProps {
  layout: Layout;
  onFocusTarget?: (sectionId: string, itemId?: string) => void;
}

export function Preview({ layout, onFocusTarget }: PreviewProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;

    const updateScale = () => {
      const pageWidthPx = PAGE.widthPt * PX_PER_PT;
      const available = region.clientWidth - 48;
      setScale(Math.max(0.35, Math.min(1, available / pageWidthPx)));
    };

    updateScale();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
    const observer = new ResizeObserver(updateScale);
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  const pageWidthPx = PAGE.widthPt * PX_PER_PT;
  const pageHeightPx = PAGE.heightPt * PX_PER_PT;
  const totalHeightPx =
    layout.pages.length * pageHeightPx + Math.max(0, layout.pages.length - 1) * PAGE_GAP_PX;

  return (
    <div className="preview-region" ref={regionRef} aria-label="Resume preview">
      <div className="preview-meta">
        <span>
          {layout.pages.length} {layout.pages.length === 1 ? 'page' : 'pages'}
        </span>
        <span>{Math.round(scale * 100)}%</span>
      </div>
      <div
        className="preview-scaler"
        style={{ width: pageWidthPx * scale, height: totalHeightPx * scale }}
      >
        <div
          className="pages"
          style={{
            width: pageWidthPx,
            transform: `scale(${scale})`,
          }}
        >
          {layout.pages.map((page) => (
            <PageView key={page.index} page={page} onFocusTarget={onFocusTarget} />
          ))}
        </div>
      </div>
    </div>
  );
}
