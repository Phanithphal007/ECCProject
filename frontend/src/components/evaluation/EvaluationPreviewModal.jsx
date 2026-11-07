import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  FileText,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import { EccEvaluationReport } from './EccEvaluationReport';
import { EccOfficialPdfTemplate } from './EccOfficialPdfTemplate';
import { exportStudentEvaluationPdf, printEvaluationReport } from '../../services/pdfGenerator';
import { useApp } from '../../context/useApp';
import { getOfficialStudentId } from '../../utils/studentId';

export const EvaluationPreviewModal = ({
  isOpen,
  onClose,
  student,
  academicYear = "២០២៦- ២០២៧",
  courseLevel = "សន្ទនាសម្រាប់បឋមទូទៅ",
  termName = "វគ្គទី ៤ បញ្ចប់វគ្គសិក្សា",
  reportDate = "07/09/2026",
  leadTeacher = "Teacher Sophea",
  foreignTeacher = ""
}) => {
  const { addToast } = useApp();
  const reportRef = useRef(null);
  const exportRef = useRef(null);

  const [zoom, setZoom] = useState(0.85);
  const [isExporting, setIsExporting] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Custom evaluation parameters
  const [customCourse, setCustomCourse] = useState(courseLevel);
  const [customYear, setCustomYear] = useState(academicYear);
  const [customTerm, setCustomTerm] = useState(termName);
  const [customDate, setCustomDate] = useState(reportDate);

  const [khComments, setKhComments] = useState([
    "-ជាសិស្សសកម្មក្នុងការសិក្សា",
    "-ជាសិស្សមានភាពអត់ធ្មត់លើការសិក្សា",
    "-ជាសិស្សមានការតាំងចិត្តខ្ពស់លើការសិក្សា"
  ]);

  const prefixTitle = (student?.gender === 'Female' || student?.gender === 'ស្រី') ? 'Miss' : 'Mr.';
  const studentEngName = (student?.name || 'KOSAL SOKPISAL').toUpperCase();

  const [enComments, setEnComments] = useState([
    `1. ${prefixTitle} ${studentEngName} demonstrates a positive attitude toward learning English.`,
    `2. He is encouraged to improve his speaking confidence, vocabulary, pronunciation, through regular practice with ${leadTeacher || 'Teacher Veasna'}.`,
    "3. With consistent effort and dedication, he can achieve greater progress in English communication."
  ]);

  if (!isOpen || !student) return null;

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const target = exportRef.current || reportRef.current;
      await exportStudentEvaluationPdf(target, student);
      addToast({
        type: 'success',
        title: 'PDF Export Completed',
        message: `ECC Evaluation for ${student.name} downloaded successfully.`
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      addToast({
        type: 'warning',
        title: 'Opening Print / PDF Saver',
        message: 'Direct PDF failed. Launching print engine (Choose "Save as PDF").'
      });
      printEvaluationReport(reportRef.current);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printEvaluationReport(reportRef.current);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl h-[94vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/60 flex flex-col overflow-hidden text-slate-100"
        >
          {/* ================= MODAL TOOLBAR ================= */}
          <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  ECC Evaluation Report — {student.name}
                  {student.khmerName && <span className="font-siemreap text-xs text-amber-300">({student.khmerName})</span>}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  ID: {getOfficialStudentId(student)} • Class: {student.className}
                </p>
              </div>
            </div>

            {/* Actions: Zoom, Customize, Print, Download */}
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="hidden sm:flex items-center bg-slate-700/60 rounded-lg p-0.5 border border-slate-600">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-600 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="px-2 text-xs font-mono text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-600 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              {/* Customize comments & metadata toggle */}
              <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isCustomizing
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-700/60 text-slate-200 border-slate-600 hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Customize</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>

              {/* Download PDF Button */}
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors ml-1"
                aria-label="Close Preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ================= BODY: PREVIEW / CUSTOMIZER ================= */}
          <div className="flex-1 overflow-hidden flex">
            {/* Customization Drawer (Collapsible) */}
            {isCustomizing && (
              <div className="w-80 bg-slate-850 border-r border-slate-700 p-4 overflow-y-auto space-y-4 text-xs shrink-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="font-bold text-slate-200">Report Customization</span>
                  <button
                    onClick={() => setIsCustomizing(false)}
                    className="text-slate-400 hover:text-slate-200 text-[11px]"
                  >
                    Hide
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Course Level Title (Khmer)
                  </label>
                  <input
                    type="text"
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-siemreap focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={customYear}
                      onChange={(e) => setCustomYear(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-siemreap"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Report Date</label>
                    <input
                      type="text"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Term Name</label>
                  <input
                    type="text"
                    value={customTerm}
                    onChange={(e) => setCustomTerm(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-siemreap"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <label className="block text-amber-300 font-bold text-[11px]">
                    Local Teacher Comments (Khmer)
                  </label>
                  {khComments.map((comment, i) => (
                    <input
                      key={i}
                      type="text"
                      value={comment}
                      onChange={(e) => {
                        const copy = [...khComments];
                        copy[i] = e.target.value;
                        setKhComments(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-siemreap"
                    />
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <label className="block text-amber-300 font-bold text-[11px]">
                    Foreign Teacher Comments (English)
                  </label>
                  {enComments.map((comment, i) => (
                    <textarea
                      key={i}
                      rows={2}
                      value={comment}
                      onChange={(e) => {
                        const copy = [...enComments];
                        copy[i] = e.target.value;
                        setEnComments(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs italic"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Document Canvas Viewport */}
            <div className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-8 flex items-start justify-center">
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
                className="shadow-2xl rounded-sm"
              >
                <EccEvaluationReport
                  ref={reportRef}
                  mode="screen"
                  student={student}
                  academicYear={customYear}
                  courseLevel={customCourse}
                  termName={customTerm}
                  reportDate={customDate}
                  teacherComments={khComments}
                  foreignTeacherComments={enComments}
                  leadTeacher={leadTeacher}
                  foreignTeacherName={foreignTeacher}
                  localTeacherName={leadTeacher}
                />
              </div>
            </div>
          </div>

          {/* Off-screen 1:1 A4 Render Target for Clean PDF Export (No CSS scale transforms) */}
          <div
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: '210mm',
              background: '#ffffff',
              pointerEvents: 'none'
            }}
          >
            <EccOfficialPdfTemplate
              ref={exportRef}
              student={student}
              academicYear={customYear}
              courseLevel={customCourse}
              termName={customTerm}
              reportDate={customDate}
              teacherComments={khComments}
              foreignTeacherComments={enComments}
              leadTeacher={leadTeacher}
              foreignTeacherName={foreignTeacher}
              localTeacherName={leadTeacher}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
