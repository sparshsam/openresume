import { jsPDF } from 'jspdf';
import type { HeaderLayout, Layout, PageLayout } from './layout';
import { applicationKitFilename, documentFilename } from './filename';
import type { DocumentMeta } from './documentMeta';
import { DEFAULT_APPLICATION_KIT_ORDER, type ApplicationKitOrder } from '../types/applicationKit';

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

function drawPage(doc: jsPDF, page: PageLayout): void {
  if (page.header) drawHeader(doc, page.header);

  for (const block of page.blocks) {
    for (const line of block.lines) {
      doc.setFont('helvetica', line.font.bold ? 'bold' : 'normal');
      doc.setFontSize(line.font.sizePt);
      doc.setTextColor(line.color);
      doc.text(line.text, line.xPt, line.yPt + line.font.sizePt * BASELINE_RATIO);
    }
  }
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
    drawPage(doc, page);
  });

  return doc;
}

export function createCombinedPdfDocument(
  name: string,
  coverLetterLayout: Layout,
  resumeLayout: Layout,
  order: ApplicationKitOrder = DEFAULT_APPLICATION_KIT_ORDER,
): jsPDF {
  const orderedLayouts =
    order === 'resumeFirst' ? [resumeLayout, coverLetterLayout] : [coverLetterLayout, resumeLayout];
  const firstLayout = orderedLayouts.find((layout) => layout.pages.length > 0) ?? orderedLayouts[0];
  const doc = new jsPDF({
    unit: 'pt',
    format: [firstLayout.pageWidthPt, firstLayout.pageHeightPt],
    compress: false,
  });
  doc.setProperties({
    title: `${name || 'Application'} — Application Kit`,
    subject: order === 'resumeFirst' ? 'Resume and Cover Letter' : 'Cover Letter and Resume',
    creator: 'OpenResume',
    author: name || 'OpenResume',
  });

  let started = false;
  const append = (layout: Layout) => {
    layout.pages.forEach((page) => {
      if (!started) {
        started = true;
      } else {
        doc.addPage([layout.pageWidthPt, layout.pageHeightPt], 'portrait');
      }
      drawPage(doc, page);
    });
  };

  for (const layout of orderedLayouts) append(layout);

  return doc;
}

export function exportPdf(meta: DocumentMeta, layout: Layout): void {
  const doc = createPdfDocument(meta, layout);
  doc.save(documentFilename(meta.name, meta.kind, 'pdf'));
}

export function exportCombinedPdf(
  name: string,
  coverLetterLayout: Layout,
  resumeLayout: Layout,
  order: ApplicationKitOrder = DEFAULT_APPLICATION_KIT_ORDER,
): void {
  const doc = createCombinedPdfDocument(name, coverLetterLayout, resumeLayout, order);
  doc.save(applicationKitFilename(name, 'pdf'));
}
