import { jsPDF } from 'jspdf';
import type { HeaderLayout, Layout } from './layout';
import { resumeFilename } from './filename';
import type { Resume } from '../types/resume';

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

export function createPdfDocument(resume: Resume, layout: Layout): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: false });
  doc.setProperties({
    title: `${resume.header.name || 'Resume'} — Resume`,
    subject: resume.header.headline ?? 'Resume',
    creator: 'OpenResume',
    author: resume.header.name || 'OpenResume',
  });

  layout.pages.forEach((page, index) => {
    if (index > 0) doc.addPage('a4', 'portrait');
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

export function exportPdf(resume: Resume, layout: Layout): void {
  const doc = createPdfDocument(resume, layout);
  doc.save(resumeFilename(resume.header.name, 'pdf'));
}
