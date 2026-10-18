import { jsPDF } from 'jspdf';
import type { HeaderLayout, Layout } from './layout';
import { documentFilename } from './filename';
import type { DocumentMeta } from './documentMeta';

const BASELINE_RATIO = 0.78;

function drawHeader(doc: jsPDF, header: HeaderLayout): void {
  const lines = [
    header.name,
    ...(header.headline ? [header.headline] : []),
    ...header.contactLines,
  ];
  for (const line of lines) {
    doc.setFont('helvetica', line.font.bold ? 'bold' : 'normal');
    doc.setFontSize(line.font.sizePt);
    doc.setTextColor(line.color);
    doc.text(line.text, line.xPt, line.yPt + line.font.sizePt * BASELINE_RATIO);
  }
  doc.setDrawColor(header.rule.color);
  doc.setLineWidth(header.rule.widthPt);
  doc.line(header.rule.x1Pt, header.rule.y1Pt, header.rule.x2Pt, header.rule.y2Pt);
}

export function createPdfDocument(meta: DocumentMeta, layout: Layout): jsPDF {
  const pageFormat: [number, number] = [layout.pageWidthPt, layout.pageHeightPt];
  const doc = new jsPDF({ unit: 'pt', format: pageFormat, compress: false });
  const label = meta.kind === 'resume' ? 'Resume' : 'Cover Letter';
  doc.setProperties({
    title: `${meta.name || 'Document'} — ${label}`,
    subject: meta.headline ?? meta.subject ?? label,
    creator: 'OpenResume',
    author: meta.name || 'OpenResume',
  });

  layout.pages.forEach((page, index) => {
    if (index > 0) doc.addPage(pageFormat, 'portrait');
    if (page.header) drawHeader(doc, page.header);

    for (const block of page.blocks) {
      for (const line of block.lines) {
        doc.setFont('helvetica', line.font.bold ? 'bold' : 'normal');
        doc.setFontSize(line.font.sizePt);
        doc.setTextColor(line.color);
        doc.text(line.text, line.xPt, line.yPt + line.font.sizePt * BASELINE_RATIO);
      }
    }
  });

  return doc;
}

export function exportPdf(meta: DocumentMeta, layout: Layout): void {
  const doc = createPdfDocument(meta, layout);
  doc.save(documentFilename(meta.name, meta.kind, 'pdf'));
}
