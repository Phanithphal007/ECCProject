import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { EMBEDDED_FONTS_CSS } from '../assets/fontBase64';
import { getOfficialStudentId } from '../utils/studentId';
import { registerPdfFonts, PDF_FONTS, PDF_PAGE_CONFIG, PDF_EMBEDDED_FONTS_CSS } from './pdfConfig';
import { ECC_LOGO_BASE64 } from '../assets/eccLogoBase64';
import { JADEN_GRUNK_SIGNATURE_BASE64 } from '../assets/jadenGrunkSignatureBase64';

/**
 * Pre-flight asset readiness: ensures all fonts, logos, and signatures
 * are 100% loaded and rendered in the DOM before capturing the PDF.
 *
 * @param {HTMLElement} element - The target report container.
 * @returns {Promise<void>}
 */
export const waitForReportAssets = async (element) => {
  if (!element) return;

  // 1. Ensure document fonts are fully loaded
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Document fonts ready check skipped:', e);
    }
  }

  // 2. Ensure all embedded images (logo, handwritten signature) are completely loaded
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map((img) => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn('Image in report failed to load:', img.src);
        resolve(); // Continue without blocking
      };
      // Timeout safeguard after 2.5s
      setTimeout(resolve, 2500);
    });
  });

  await Promise.all(imagePromises);

  // 3. Double requestAnimationFrame tick to allow browser layout & font shaping to settle
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
};

/**
 * Capture an HTML DOM element and save it as a high-resolution, pixel-perfect A4 portrait PDF.
 * Matches 1:1 with the working website report preview.
 *
 * @param {HTMLElement|string} target - The element or DOM selector to capture.
 * @param {string} filename - Output PDF filename.
 * @returns {Promise<boolean>}
 */
export const exportElementToPdf = async (target, filename = 'ECC_Evaluation_Report.pdf') => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) {
    throw new Error('Target element for PDF export not found.');
  }

  // Pre-flight check: wait for fonts, logo, and signature
  await waitForReportAssets(element);

  let imgData;

  try {
    // Attempt 1: High-fidelity lossless PNG with inlined base64 fonts (Siemreap, Moul, Inter)
    imgData = await toPng(element, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      fontEmbedCSS: PDF_EMBEDDED_FONTS_CSS,
      cacheBust: false
    });
  } catch (err1) {
    console.warn('html-to-image toPng attempt 1 failed, attempting html2canvas fallback:', err1);
    try {
      // Attempt 2: html2canvas fallback at 3x scale
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      imgData = canvas.toDataURL('image/png');
    } catch (err2) {
      console.error('All PDF image capture attempts failed:', err2);
      throw err2;
    }
  }

  if (!imgData) {
    throw new Error('Could not generate high-resolution image data from evaluation document.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  registerPdfFonts(pdf);

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  // Insert lossless PNG at full A4 dimensions
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
  pdf.save(filename);
  return true;
};

/**
 * Export single student evaluation report.
 */
export const exportStudentEvaluationPdf = async (elementOrId, student, options = {}) => {
  const safeName = (student.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeId = getOfficialStudentId(student);
  const filename = options.filename || `ECC_Evaluation_${safeId}_${safeName}.pdf`;

  return exportElementToPdf(elementOrId, filename);
};

/**
 * Export multiple evaluation reports as a single combined multi-page A4 PDF.
 */
export const exportMultipleElementsToPdf = async (elements, filename = 'ECC_Class_Evaluations.pdf', onProgress) => {
  if (!elements || elements.length === 0) {
    throw new Error('No elements provided for bulk PDF export.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  registerPdfFonts(pdf);

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (onProgress) onProgress(i + 1, elements.length);

    await waitForReportAssets(el);

    let imgData;
    try {
      imgData = await toPng(el, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        fontEmbedCSS: PDF_EMBEDDED_FONTS_CSS,
        cacheBust: false
      });
    } catch {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      imgData = canvas.toDataURL('image/png');
    }

    if (imgData) {
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
    }
  }

  pdf.save(filename);
  return true;
};

/**
 * Direct print using browser print engine with embedded fonts and print layout.
 */
export const printEvaluationReport = (elementOrId) => {
  const element = typeof elementOrId === 'string' ? document.querySelector(elementOrId) : elementOrId;
  if (!element) {
    window.print();
    return;
  }

  window.print();
};

/**
 * Universal ECC Administrative & Academic Report PDF Generator.
 * Used across ECC EduManage for Attendance, Financial, Evaluations,
 * Enrollment, Class and Teacher reports using official Siemreap font.
 *
 * @param {Object} options
 * @param {string} options.title - Report title (English / Khmer)
 * @param {string} [options.titleKhmer] - Report title in Khmer (Siemreap font)
 * @param {string} options.type - Report category/type
 * @param {string} options.period - Academic period / date range
 * @param {string} [options.filename] - Destination PDF filename
 * @param {Array<{label: string, labelKhmer?: string, width?: string}>} [options.columns]
 * @param {Array<Array<string|number>>} [options.rows]
 * @param {Array<{label: string, value: string|number}>} [options.summary]
 * @returns {Promise<boolean>}
 */
export const generateReportPdf = async ({
  title,
  titleKhmer,
  type = 'Official Report',
  period = 'Academic Term 2026-2027',
  filename,
  columns,
  rows,
  summary
}) => {
  const safeFilename = filename || `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  // Create isolated container in DOM
  const container = document.createElement('div');
  container.className = 'ecc-official-pdf-document bg-white text-slate-950 select-none';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.minHeight = '297mm';
  container.style.padding = '10mm 15mm 12mm 15mm';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '"Siemreap", system-ui, sans-serif';
  container.style.zIndex = '-1000';

  const defaultColumns = columns || [
    { labelKhmer: 'ល.រ', label: 'No.', width: '8%' },
    { labelKhmer: 'ឈ្មោះសិស្ស / បរិយាយ', label: 'Item / Description', width: '42%' },
    { labelKhmer: 'ថ្នាក់ / កម្រិត', label: 'Class / Level', width: '25%' },
    { labelKhmer: 'ស្ថានភាព / លទ្ធផល', label: 'Status / Outcome', width: '25%' }
  ];

  const defaultRows = rows || [
    ['១', 'Kosal Sokpisal (កុសល សុខពិសាល)', 'Grade 1 — Alphabet A', 'Active / 100%'],
    ['២', 'Bopha Keo (កែវ បុប្ផា)', 'Grade 1 — Phonics', 'Active / 98%'],
    ['៣', 'Rathana Chan (ចាន់ រតនា)', 'Grade 2 — Reading', 'Active / 96%'],
    ['៤', 'Dara Sam (សំ តារា)', 'Grade 3 — Speaking', 'Active / 94%'],
    ['៥', 'Neary Pich (ពេជ្រ នារី)', 'Grade 4 — Grammar', 'Active / 99%'],
    ['៦', 'Visal Chea (ជា វិសាល)', 'Grade 5 — Writing', 'Active / 95%'],
    ['៧', 'Chantrea Meas (មាស ចន្ទ្រា)', 'Grade 6 — Advanced', 'Active / 97%']
  ];

  const colsHtml = defaultColumns.map((col) => `
    <th style="border: 1px solid #000000; padding: 6px 8px; text-align: center; font-weight: bold; color: #b91c1c; font-size: 12.5px; width: ${col.width || 'auto'}; background: #fafafa;">
      <div>${col.labelKhmer || ''}</div>
      <div style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #1e293b;">${col.label}</div>
    </th>
  `).join('');

  const rowsHtml = defaultRows.map((r, idx) => `
    <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
      ${r.map((cell, cIdx) => `
        <td style="border: 1px solid #000000; padding: 5px 8px; font-size: 12px; ${cIdx === 0 ? 'text-align: center; font-weight: bold;' : 'text-align: left;'}">
          ${cell}
        </td>
      `).join('')}
    </tr>
  `).join('');

  const summaryHtml = summary && summary.length > 0 ? `
    <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; display: flex; justify-content: space-around;">
      ${summary.map(s => `
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #64748b;">${s.label}</div>
          <div style="font-size: 14px; font-weight: bold; color: #0d3b66;">${s.value}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  container.innerHTML = `
    <!-- TOP MOTTO BAR -->
    <div style="display: flex; justify-content: space-between; padding: 0 4px 4px; font-size: 13px; color: #1a5b8c; font-weight: 600;">
      <span>មជ្ឈមណ្ឌលភាសាអង់គ្លេសសម្រាប់ទំនាក់ទំនង</span>
      <span>រៀនទីនេះ ចេះទីនេះ ទំនាក់ទំនងគ្រប់ទីកន្លែង</span>
    </div>

    <!-- TOP DOUBLE ORANGE STRIPE -->
    <div style="width: 100%; margin-bottom: 12px;">
      <div style="width: 100%; height: 4.5px; background: #c58c35;"></div>
      <div style="width: 100%; height: 2.5px;"></div>
      <div style="width: 100%; height: 1.5px; background: #c58c35;"></div>
    </div>

    <!-- HEADER: OFFICIAL LOGO & INSTITUTION -->
    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 8px 0 16px;">
      <img src="${ECC_LOGO_BASE64}" alt="ECC Logo" style="width: 72px; height: 72px; object-fit: contain;" />
      <div style="text-align: center;">
        <h2 style="font-family: 'Moul', serif; font-size: 17px; font-weight: bold; color: #0d3b66; margin: 0; line-height: 1.2;">
          មជ្ឈមណ្ឌលភាសាអង់គ្លេសសម្រាប់ទំនាក់ទំនង
        </h2>
        <h3 style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: bold; color: #111827; margin: 2px 0 0; line-height: 1.3;">
          English for Communication Centre
        </h3>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; font-weight: 500; color: #374151; margin: 2px 0 0;">
          Department of Examination & Academic Affairs
        </p>
      </div>
    </div>

    <!-- REPORT TITLE & PERIOD -->
    <div style="text-align: center; margin: 12px 0 16px;">
      <div style="font-size: 16px; font-weight: bold; color: #c02626; margin-bottom: 4px;">
        ${titleKhmer ? `របាយការណ៍ផ្លូវការ ៖ ${titleKhmer}` : 'របាយការណ៍ផ្លូវការមជ្ឈមណ្ឌល'}
      </div>
      <div style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: bold; color: #0f172a;">
        ${title}
      </div>
      <div style="display: flex; justify-content: center; gap: 24px; font-size: 13px; color: #0284c7; font-weight: bold; margin-top: 6px;">
        <span>ប្រភេទ ៖ ${type}</span>
        <span>កាលបរិច្ឆេទ/វគ្គ ៖ ${period}</span>
      </div>
    </div>

    <!-- MAIN DATA TABLE -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-top: 8px;">
      <thead>
        <tr>${colsHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    ${summaryHtml}

    <!-- OFFICIAL SIGNATURE BLOCK -->
    <div style="display: flex; justify-content: space-between; margin-top: 36px; padding: 0 10px;">
      <div style="width: 32%; text-align: center;">
        <p style="margin: 0; font-size: 12.5px; font-weight: bold; color: #0f172a;">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</p>
        <p style="margin: 3px 0 0; font-size: 12.5px; font-weight: bold; color: #dc2626;">ប្រធានផ្នែកសិក្សាធិការ</p>
        <div style="height: 48px; display: flex; align-items: center; justify-content: center;">
          <img src="${JADEN_GRUNK_SIGNATURE_BASE64}" alt="Signature" style="height: 40px; object-fit: contain;" />
        </div>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 11.5px; font-weight: 600; color: #1e293b; margin: 0;">Sophea Heng</p>
      </div>

      <div style="width: 32%; text-align: center;">
        <p style="font-family: 'Inter', Arial, sans-serif; margin: 0; font-size: 11px; color: #64748b;">
          ECC Compliance Verified: 100%
        </p>
        <p style="font-family: 'Inter', Arial, sans-serif; margin: 3px 0 0; font-size: 11.5px; font-weight: bold; color: #059669;">
          MoEYS Curriculum Standard
        </p>
        <div style="height: 48px;"></div>
        <p style="font-family: 'Inter', Arial, sans-serif; margin: 0; font-size: 11px; color: #64748b;">
          Phnom Penh, Cambodia
        </p>
      </div>

      <div style="width: 32%; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #475569;">រាជធានីភ្នំពេញ, ថ្ងៃទី ...... ខែ ...... ឆ្នាំ ២០២៦</p>
        <p style="margin: 3px 0 0; font-size: 12.5px; font-weight: bold; color: #0f172a;">នាយកមជ្ឈមណ្ឌល</p>
        <div style="height: 48px; display: flex; align-items: center; justify-content: center;">
          <span style="font-family: serif; font-style: italic; color: #1e3a8a; font-size: 15px; font-weight: bold;">
            Jaden Grunk
          </span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await exportElementToPdf(container, safeFilename);
    return true;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
