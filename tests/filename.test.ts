import { describe, expect, it } from 'vitest';
import {
  applicationKitFilename,
  documentFilename,
  guidedFilename,
  resumeFilename,
} from '../src/lib/filename';

describe('document filenames', () => {
  it('sanitizes the name and adds the extension', () => {
    expect(resumeFilename('Jordan Avery', 'pdf')).toBe('Jordan-Avery-Resume.pdf');
    expect(documentFilename('  Ada / Lovelace  ', 'resume', 'docx')).toBe(
      'Ada-Lovelace-Resume.docx',
    );
    expect(documentFilename('', 'coverLetter', 'pdf')).toBe('Document-Cover-Letter.pdf');
  });

  it('names the combined application kit', () => {
    expect(applicationKitFilename('Jordan Avery', 'pdf')).toBe('Jordan-Avery-Application-Kit.pdf');
    expect(applicationKitFilename('', 'docx')).toBe('Application-Application-Kit.docx');
  });
});

describe('guided workflow filenames', () => {
  it('uses the applicant, job title, document, and extension', () => {
    expect(guidedFilename('Jordan Avery', 'Senior Product Engineer', 'resume', 'pdf')).toBe(
      'Jordan-Avery_Senior-Product-Engineer_Resume.pdf',
    );
    expect(guidedFilename('Jordan Avery', 'Senior Product Engineer', 'coverLetter', 'docx')).toBe(
      'Jordan-Avery_Senior-Product-Engineer_Cover_Letter.docx',
    );
  });

  it('handles missing applicant names and job titles gracefully', () => {
    expect(guidedFilename('', 'Senior Product Engineer', 'resume', 'pdf')).toBe(
      'Applicant_Senior-Product-Engineer_Resume.pdf',
    );
    expect(guidedFilename('Jordan Avery', '', 'resume', 'pdf')).toBe(
      'Jordan-Avery_Position_Resume.pdf',
    );
    expect(guidedFilename('   ', '   ', 'coverLetter', 'docx')).toBe(
      'Applicant_Position_Cover_Letter.docx',
    );
  });

  it('sanitizes punctuation, slashes, and accents', () => {
    expect(guidedFilename('José / Avery', 'C++ Developer (Remote)', 'resume', 'pdf')).toBe(
      'Jose-Avery_C-Developer-Remote_Resume.pdf',
    );
    expect(guidedFilename('A_B', 'Role_Name', 'coverLetter', 'pdf')).toBe(
      'A_B_Role_Name_Cover_Letter.pdf',
    );
  });
});
