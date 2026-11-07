/**
 * Centralized Official PDF Font & Export Configuration — ECC EduManage
 * Enforces "Siemreap" as the official global Khmer font for all PDF exports.
 */

import { EMBEDDED_FONTS_CSS, SIEMREAP_BASE64, INTER_BASE64, MOUL_BASE64 } from '../assets/fontBase64';

export const PDF_FONTS = {
  khmer: '"Siemreap", system-ui, sans-serif',
  english: "'Inter', Arial, sans-serif",
  mixed: '"Siemreap", "Inter", system-ui, sans-serif',
  family: '"Siemreap", "Inter", system-ui, sans-serif',
  institution: '"Moul", serif'
};

export const PDF_PAGE_CONFIG = {
  format: 'a4',
  orientation: 'portrait',
  unit: 'mm',
  width: 210,
  height: 297,
  compress: true,
  scale: 3 // 300 DPI high-definition capture
};

export const PDF_EMBEDDED_FONTS_CSS = `${EMBEDDED_FONTS_CSS}
@font-face {
  font-family: 'Moul';
  src: url(data:font/ttf;base64,${MOUL_BASE64}) format('truetype');
  font-weight: 400;
  font-style: normal;
}`;

/**
 * Registers official embedded fonts into a jsPDF instance VFS.
 * Allows direct pdf.text() and pdf.setFont('Siemreap') calls when needed.
 *
 * @param {import('jspdf').jsPDF} pdf
 */
export const registerPdfFonts = (pdf) => {
  if (!pdf || typeof pdf.addFileToVFS !== 'function') return;

  try {
    if (SIEMREAP_BASE64) {
      pdf.addFileToVFS('Siemreap.ttf', SIEMREAP_BASE64);
      pdf.addFont('Siemreap.ttf', 'Siemreap', 'normal');
      pdf.addFont('Siemreap.ttf', 'Siemreap', 'bold');
    }

    if (INTER_BASE64) {
      pdf.addFileToVFS('Inter.ttf', INTER_BASE64);
      pdf.addFont('Inter.ttf', 'Inter', 'normal');
      pdf.addFont('Inter.ttf', 'Inter', 'bold');
    }

    if (MOUL_BASE64) {
      pdf.addFileToVFS('Moul.ttf', MOUL_BASE64);
      pdf.addFont('Moul.ttf', 'Moul', 'normal');
    }
  } catch (err) {
    console.warn('PDF VFS font registration warning:', err);
  }
};

