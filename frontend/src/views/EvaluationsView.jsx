import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  Edit3, 
  Search, 
  Calendar,
  Layers,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Users,
  CheckCircle2,
  Clock,
  Award,
  BookOpen
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatisticCard } from '../components/ui/StatisticCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/useApp';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';
import { EvaluationPreviewModal } from '../components/evaluation/EvaluationPreviewModal';
import { EccEvaluationReport } from '../components/evaluation/EccEvaluationReport';
import { EccOfficialPdfTemplate } from '../components/evaluation/EccOfficialPdfTemplate';
import { exportElementToPdf, exportMultipleElementsToPdf, printEvaluationReport } from '../services/pdfGenerator';
import { getOfficialStudentId } from '../utils/studentId';

export const EvaluationsView = () => {
  const { t } = useTranslation();
  const { students, classes, updateStudent, addToast } = useApp();

  // ================= 1. STATE & FILTERS =================
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('សន្ទនាសម្រាប់បឋមទូទៅ');
  const [academicYear, setAcademicYear] = useState('២០២៦- ២០២៧');
  const [evaluationPeriod, setEvaluationPeriod] = useState('វគ្គទី ៤ បញ្ចប់វគ្គសិក្សា');
  const [reportDate, setReportDate] = useState('07/09/2026');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Preview Canvas Controls (Default to 0.45 on mobile, 0.85 on desktop)
  const [zoom, setZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 0.85));
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'roster'

  // Modals & Export States
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // DOM Refs for PDF capture
  const singleExportRef = useRef(null);
  const bulkContainerRef = useRef(null);
  const reportCanvasRef = useRef(null);

  // Edit form states for current evaluation
  const [oralRating, setOralRating] = useState('Excellent');
  const [evalNotes, setEvalNotes] = useState('');
  const [criteriaScores, setCriteriaScores] = useState({
    attendance: 10,       // Max 10
    dailyObs: 13,         // Max 15
    weeklyObs: 18,        // Max 20
    nativeTest: 30,       // Max 30
    finalExam: 25         // Max 25
  });
  const [localTeacherComments, setLocalTeacherComments] = useState([
    "- ជាសិស្សសកម្មក្នុងការសិក្សា",
    "- ជាសិស្សមានភាពអត់ធ្មត់លើការសិក្សា",
    "- ជាសិស្សមានការតាំងចិត្តខ្ពស់លើការសិក្សា"
  ]);
  const [foreignTeacherComments, setForeignTeacherComments] = useState([
    "1. Demonstrates a positive attitude toward learning English and active participation.",
    "2. Encouraged to improve speaking confidence, vocabulary, pronunciation, through regular practice with teacher.",
    "3. With consistent effort and dedication, can achieve greater progress in English communication."
  ]);

  // ================= 2. CLASS & STUDENT FILTER LOGIC =================
  // Options for English Class Cohort dropdown
  const classOptions = useMemo(() => {
    const activeClasses = classes.filter((c) => c.status !== 'Archived');
    return [
      { id: 'ALL', name: t('evaluations.all_classes', 'All Classes (All Students)'), code: 'ALL' },
      ...activeClasses.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || c.id,
        enrolledStudentIds: c.enrolledStudentIds || [],
        teacher: c.teacher
      }))
    ];
  }, [classes, t]);

  // Selected Class Object
  const selectedClassObj = useMemo(() => {
    if (selectedClassId === 'ALL') return null;
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Strictly filter students enrolled in the selected class cohort
  const enrolledStudentsInClass = useMemo(() => {
    if (selectedClassId === 'ALL') {
      return students.filter((s) => s.status !== 'Archived');
    }
    if (!selectedClassObj) return [];

    const enrolledIds = new Set(selectedClassObj.enrolledStudentIds || []);
    return students.filter((s) => {
      if (s.status === 'Archived') return false;
      return (
        enrolledIds.has(s.id) ||
        s.className === selectedClassObj.name ||
        s.className === selectedClassObj.code
      );
    });
  }, [students, selectedClassId, selectedClassObj]);

  // Filter by search query (English name, Khmer name, Student ID)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return enrolledStudentsInClass;
    return enrolledStudentsInClass.filter((s) => {
      const matchName = s.name?.toLowerCase().includes(q);
      const matchKhmer = s.khmerName && s.khmerName.toLowerCase().includes(q);
      const matchId = s.id?.toLowerCase().includes(q) || (s.studentId && s.studentId.includes(q)) || getOfficialStudentId(s).includes(q);
      const matchGrade = s.grade?.toLowerCase().includes(q);
      return matchName || matchKhmer || matchId || matchGrade;
    });
  }, [enrolledStudentsInClass, searchQuery]);

  // Derive the active student id cleanly without cascading setState in an effect
  const activeStudentId = useMemo(() => {
    if (selectedStudentId && filteredStudents.some((s) => s.id === selectedStudentId)) {
      return selectedStudentId;
    }
    return filteredStudents[0]?.id || '';
  }, [selectedStudentId, filteredStudents]);

  // Currently Active Student for Report Preview
  const currentStudent = useMemo(() => {
    if (!activeStudentId) return null;
    return filteredStudents.find((s) => s.id === activeStudentId) || null;
  }, [filteredStudents, activeStudentId]);

  // Student Index Navigation (< Prev, Next >)
  const currentStudentIndex = useMemo(() => {
    if (!currentStudent) return -1;
    return filteredStudents.findIndex((s) => s.id === currentStudent.id);
  }, [filteredStudents, currentStudent]);

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(filteredStudents[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentStudentIndex + 1].id);
    }
  };

  // ================= 3. STATISTICAL CALCULATIONS =================
  const totalStudentsCount = filteredStudents.length;

  const completedEvaluationsCount = useMemo(() => {
    return filteredStudents.filter((s) => s.evaluationStatus === 'Evaluated').length;
  }, [filteredStudents]);

  const pendingEvaluationsCount = totalStudentsCount - completedEvaluationsCount;

  const averageStudentScore = useMemo(() => {
    if (filteredStudents.length === 0) return '0%';
    const scores = filteredStudents
      .map((s) => {
        if (!s.recentScore) return null;
        const parsed = parseFloat(s.recentScore.toString().split('/')[0].replace('%', ''));
        return isNaN(parsed) ? null : parsed;
      })
      .filter((n) => n !== null);

    if (scores.length === 0) return '0%';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return `${avg.toFixed(1)}%`;
  }, [filteredStudents]);

  // Populate edit form when current student changes
  const handleOpenEditModal = () => {
    if (!currentStudent) return;
    setOralRating(currentStudent.oralRating || 'Excellent');
    setEvalNotes(currentStudent.notes || '');

    if (currentStudent.evaluationData && Array.isArray(currentStudent.evaluationData)) {
      setCriteriaScores({
        attendance: currentStudent.evaluationData[0]?.score ?? 10,
        dailyObs: currentStudent.evaluationData[1]?.score ?? 13,
        weeklyObs: currentStudent.evaluationData[2]?.score ?? 18,
        nativeTest: currentStudent.evaluationData[3]?.score ?? 30,
        finalExam: currentStudent.evaluationData[4]?.score ?? 25
      });
    } else {
      const raw = parseInt(currentStudent.recentScore, 10) || 96;
      const ratio = raw / 96;
      setCriteriaScores({
        attendance: Math.min(10, Math.round(10 * ratio)),
        dailyObs: Math.min(15, Math.round(13 * ratio)),
        weeklyObs: Math.min(20, Math.round(18 * ratio)),
        nativeTest: Math.min(30, Math.round(30 * ratio)),
        finalExam: Math.min(25, Math.round(25 * ratio))
      });
    }

    if (currentStudent.teacherComments && Array.isArray(currentStudent.teacherComments)) {
      setLocalTeacherComments(currentStudent.teacherComments);
    }

    if (currentStudent.foreignTeacherComments && Array.isArray(currentStudent.foreignTeacherComments)) {
      setForeignTeacherComments(currentStudent.foreignTeacherComments);
    }

    setIsEditModalOpen(true);
  };

  // Save updated evaluation marks and remarks
  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    if (!currentStudent) return;

    const totalScore = Number(criteriaScores.attendance) +
      Number(criteriaScores.dailyObs) +
      Number(criteriaScores.weeklyObs) +
      Number(criteriaScores.nativeTest) +
      Number(criteriaScores.finalExam);

    const updatedCriteria = [
      { no: '១', name: 'វត្តមាន', max: 10, score: Number(criteriaScores.attendance), grade: criteriaScores.attendance >= 9 ? 'A' : criteriaScores.attendance >= 8 ? 'B' : 'C' },
      { no: '២', name: 'ការសង្កេតប្រចាំថ្ងៃ', max: 15, score: Number(criteriaScores.dailyObs), grade: criteriaScores.dailyObs >= 13 ? 'A' : criteriaScores.dailyObs >= 11 ? 'B' : 'C' },
      { no: '៣', name: 'ការសង្កេតប្រចាំសប្តាហ៍', max: 20, score: Number(criteriaScores.weeklyObs), grade: criteriaScores.weeklyObs >= 18 ? 'A' : criteriaScores.weeklyObs >= 15 ? 'B' : 'C' },
      { no: '៤', name: 'ការធ្វើតេស្តជាមួយបរទេស', max: 30, score: Number(criteriaScores.nativeTest), grade: criteriaScores.nativeTest >= 26 ? 'A' : criteriaScores.nativeTest >= 22 ? 'B' : 'C' },
      { no: '៥', name: 'ការប្រឡងបញ្ចប់', max: 25, score: Number(criteriaScores.finalExam), grade: criteriaScores.finalExam >= 22 ? 'A' : criteriaScores.finalExam >= 19 ? 'B' : 'C' },
    ];

    const updatedPayload = {
      evaluationStatus: 'Evaluated',
      recentScore: `${totalScore}/100`,
      oralRating,
      notes: evalNotes.trim(),
      evaluationData: updatedCriteria,
      teacherComments: localTeacherComments,
      foreignTeacherComments
    };

    updateStudent(currentStudent.id, updatedPayload);

    addToast({
      type: 'success',
      title: t('common.saved', 'Evaluation Saved'),
      message: `${currentStudent.name} evaluation recorded: ${totalScore}/100.`
    });

    setIsEditModalOpen(false);
  };

  // ================= 4. EXPORT & PRINT ACTIONS =================
  // Export single student PDF (uses Bokor font target)
  const handleExportSinglePdf = async () => {
    if (!currentStudent) return;
    try {
      setIsExportingSingle(true);
      const safeName = (currentStudent.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeId = (currentStudent.student_code || currentStudent.studentCode || currentStudent.id || 'STU').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `ECC_Evaluation_${safeId}_${safeName}.pdf`;

      await exportElementToPdf(singleExportRef.current, filename);

      addToast({
        type: 'success',
        title: t('evaluations.export_pdf', 'PDF Export Complete'),
        message: `${filename} downloaded successfully.`
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      addToast({
        type: 'warning',
        title: 'Opening Print / PDF Saver',
        message: 'Direct PDF failed. Launching print engine (Choose "Save as PDF").'
      });
      printEvaluationReport(singleExportRef.current);
    } finally {
      setIsExportingSingle(false);
    }
  };

  // Print single student report (Bokor font in print media)
  const handlePrintSingle = () => {
    if (!singleExportRef.current) return;
    printEvaluationReport(singleExportRef.current);
  };

  // Bulk export for all students in the class
  const handleBulkExportClass = async () => {
    if (filteredStudents.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Students Selected',
        message: 'There are no students to export in this cohort.'
      });
      return;
    }

    try {
      setIsBulkExporting(true);
      setBulkProgress({ current: 0, total: filteredStudents.length });

      addToast({
        type: 'info',
        title: 'Bulk Export Started',
        message: `Generating evaluation PDFs for ${filteredStudents.length} students...`
      });

      // Allow DOM to render hidden report pages
      await new Promise((r) => setTimeout(r, 450));

      const reportElements = bulkContainerRef.current?.querySelectorAll('.ecc-bulk-report-page');
      if (!reportElements || reportElements.length === 0) {
        throw new Error('Bulk report templates not ready.');
      }

      const safeClassName = (selectedClassId === 'ALL' ? 'All_Classes' : (selectedClassObj?.code || selectedClassId)).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `ECC_Class_Evaluations_${safeClassName}_${reportDate.replace(/\//g, '-')}.pdf`;

      await exportMultipleElementsToPdf(
        Array.from(reportElements),
        filename,
        (current, total) => setBulkProgress({ current, total })
      );

      addToast({
        type: 'success',
        title: t('evaluations.export_all_class_reports', 'Class Export Complete'),
        message: `Downloaded consolidated evaluation PDF (${filteredStudents.length} pages).`
      });
    } catch (err) {
      console.error('Bulk Export Error:', err);
      addToast({
        type: 'error',
        title: 'Bulk Export Failed',
        message: 'Could not complete multi-page PDF generation.'
      });
    } finally {
      setIsBulkExporting(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <PageHeader
        title={t('evaluations.title', 'Student Evaluations')}
        subtitle={t('evaluations.subtitle', 'Official ECC Student Evaluation Reports, competency grading, and Ministry-compliant performance certificates.')}
      >
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-[#1E293B] p-0.5 rounded-lg border border-slate-200 dark:border-[#29364D] flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye size={14} />
              <span>{t('evaluations.view_report', 'Report Preview')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-white dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>{t('evaluations.roster_table', 'Student Roster')}</span>
            </button>
          </div>

          {/* Export All Class Reports Button */}
          <button
            type="button"
            onClick={handleBulkExportClass}
            disabled={isBulkExporting || filteredStudents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isBulkExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Exporting ({bulkProgress.current}/{bulkProgress.total})...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>{t('evaluations.export_all_class_reports', 'Export All Class Reports')}</span>
              </>
            )}
          </button>
        </div>
      </PageHeader>

      {/* ================= 1. FOUR RESPONSIVE EVALUATION STATISTICS CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatisticCard
          icon={Users}
          title={t('evaluations.stat_total_students', 'Total Students')}
          value={totalStudentsCount}
          subtitle={
            selectedClassId === 'ALL'
              ? t('evaluations.all_cohorts', 'Across all active cohorts')
              : selectedClassObj?.name || 'Selected Cohort'
          }
          color="indigo"
        />

        <StatisticCard
          icon={CheckCircle2}
          title={t('evaluations.stat_completed', 'Completed Evaluations')}
          value={completedEvaluationsCount}
          subtitle={
            totalStudentsCount > 0
              ? `${Math.round((completedEvaluationsCount / totalStudentsCount) * 100)}% ${t('evaluations.completion_rate', 'completion rate')}`
              : t('evaluations.awaiting_review', 'Awaiting marks')
          }
          color="emerald"
        />

        <StatisticCard
          icon={Clock}
          title={t('evaluations.stat_pending', 'Pending Evaluations')}
          value={pendingEvaluationsCount}
          subtitle={t('evaluations.awaiting_review', 'Awaiting evaluation marks')}
          color="amber"
        />

        <StatisticCard
          icon={Award}
          title={t('evaluations.stat_avg_score', 'Average Student Score')}
          value={averageStudentScore}
          subtitle={t('evaluations.based_on_assessments', 'Based on term assessments')}
          color="blue"
        />
      </div>

      {/* ================= 2. EVALUATION MANAGEMENT CONTROLS TOOLBAR ================= */}
      <div className="p-4 bg-white dark:bg-[#111C32] rounded-xl border border-slate-200 dark:border-[#29364D] shadow-xs space-y-3.5">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Select English Class */}
          <div>
            <label className="block text-slate-600 dark:text-[#CBD5E1] font-semibold mb-1 flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t('evaluations.select_class', 'Select English Class')}</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
            >
              {classOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Student (Filtered to enrolled students in this class) */}
          <div>
            <label className="block text-slate-600 dark:text-[#CBD5E1] font-semibold mb-1 flex items-center gap-1.5">
              <Users size={13} className="text-blue-600 dark:text-blue-400" />
              <span>{t('evaluations.select_student', 'Select Student')}</span>
            </label>
            <select
              value={activeStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={filteredStudents.length === 0}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-medium font-siemreap focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs disabled:opacity-50"
            >
              {filteredStudents.length === 0 ? (
                <option value="">{t('common.no_data', 'No enrolled students')}</option>
              ) : (
                filteredStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.khmerName ? `(${st.khmerName})` : ''} — {st.id}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 3. Academic Year */}
          <div>
            <label className="block text-slate-600 dark:text-[#CBD5E1] font-semibold mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('evaluations.academic_year', 'Academic Year')}</span>
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-siemreap text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              <option value="២០២៦- ២០២៧">២០២៦- ២០២៧ (2026-2027)</option>
              <option value="២០២៥- ២០២៦">២០២៥- ២០២៦ (2025-2026)</option>
            </select>
          </div>

          {/* 4. Select Term */}
          <div>
            <label className="block text-slate-600 dark:text-[#CBD5E1] font-semibold mb-1 flex items-center gap-1.5">
              <BookOpen size={13} className="text-amber-500" />
              <span>{t('evaluations.term_label', 'Evaluation Term')}</span>
            </label>
            <select
              value={evaluationPeriod}
              onChange={(e) => setEvaluationPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-siemreap text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              <option value="វគ្គទី ៤ បញ្ចប់វគ្គសិក្សា">វគ្គទី ៤ បញ្ចប់ (Term 4 Final)</option>
              <option value="វគ្គទី ៣ ឆមាសទី ១">វគ្គទី ៣ ឆមាស (Term 3 Mid)</option>
              <option value="វគ្គទី ២ ពាក់កណ្ដាល">វគ្គទី ២ ពាក់កណ្ដាល (Term 2)</option>
              <option value="វគ្គទី ១ ដើមវគ្គ">វគ្គទី ១ ដើមវគ្គ (Term 1)</option>
            </select>
          </div>

          {/* 5. Report Date */}
          <div>
            <label className="block text-slate-600 dark:text-[#CBD5E1] font-semibold mb-1 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              <span>{t('evaluations.report_date', 'Report Date')}</span>
            </label>
            <input
              type="text"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Row 2: Live Search & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('evaluations.search_placeholder', 'Search by English name, Khmer name or Student ID...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 text-xs font-siemreap focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Action Buttons for Current Student */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Report */}
            <button
              type="button"
              onClick={() => setIsModalPreviewOpen(true)}
              disabled={!currentStudent}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Eye size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t('evaluations.view_report', 'View Report')}</span>
            </button>

            {/* Edit Evaluation */}
            <button
              type="button"
              onClick={handleOpenEditModal}
              disabled={!currentStudent}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Edit3 size={13} className="text-amber-600 dark:text-amber-400" />
              <span>{t('evaluations.edit_evaluation', 'Edit Evaluation')}</span>
            </button>

            {/* Print Report (Bokor font in print media) */}
            <button
              type="button"
              onClick={handlePrintSingle}
              disabled={!currentStudent}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer size={13} />
              <span>{t('evaluations.print_report', 'Print Report')}</span>
            </button>

            {/* Export PDF (Single Student, Bokor font) */}
            <button
              type="button"
              onClick={handleExportSinglePdf}
              disabled={!currentStudent || isExportingSingle}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExportingSingle ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>{t('evaluations.export_pdf', 'Export PDF')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. REPORT PREVIEW CONTAINER ================= */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-[#111C32] rounded-xl border border-slate-200 dark:border-[#29364D] shadow-xs overflow-hidden">
          {/* Preview Navigation & Zoom Bar */}
          <div className="p-3 bg-slate-50/80 dark:bg-[#1E293B]/80 border-b border-slate-200 dark:border-[#29364D] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Active Student Profile Summary */}
            {currentStudent ? (
              <div className="flex items-center gap-2.5">
                <img
                  src={getStudentAvatarUrl(currentStudent.avatar)}
                  alt={currentStudent.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-[#29364D] bg-slate-100 dark:bg-slate-800"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                  }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {currentStudent.name}
                  </span>
                  {currentStudent.khmerName && (
                    <span className="font-siemreap text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      ({currentStudent.khmerName})
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#29364D]">
                    {getOfficialStudentId(currentStudent)}
                  </span>
                  <StatusBadge status={currentStudent.evaluationStatus} size="sm" />
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {currentStudent.recentScore || '96/100'}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-slate-400 text-xs">
                {t('common.no_data', 'No student selected')}
              </span>
            )}

            {/* Center: Previous / Next Student Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevStudent}
                disabled={currentStudentIndex <= 0}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#29364D] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('evaluations.prev_student', 'Previous Student')}
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">{t('evaluations.prev_student', 'Previous')}</span>
              </button>

              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#111C32] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-semibold border border-slate-200/60 dark:border-[#29364D]">
                {filteredStudents.length > 0
                  ? t('evaluations.student_counter', { current: currentStudentIndex + 1, total: filteredStudents.length })
                  : '0 / 0'}
              </span>

              <button
                type="button"
                onClick={handleNextStudent}
                disabled={currentStudentIndex >= filteredStudents.length - 1 || currentStudentIndex === -1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#29364D] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('evaluations.next_student', 'Next Student')}
              >
                <span className="hidden sm:inline">{t('evaluations.next_student', 'Next')}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Right: Zoom Controls & Fullscreen */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-white dark:bg-[#111C32] rounded-lg border border-slate-200 dark:border-[#29364D] p-0.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                  title={t('evaluations.zoom_out', 'Zoom Out')}
                >
                  <ZoomOut size={13} />
                </button>
                <span className="px-2 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 min-w-[42px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                  title={t('evaluations.zoom_in', 'Zoom In')}
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title={t('evaluations.zoom_reset', 'Reset Zoom (85%)')}
              >
                <RotateCcw size={13} />
              </button>

              <button
                type="button"
                onClick={() => setIsModalPreviewOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                title={t('evaluations.view_report', 'Full Screen Preview')}
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* Document Canvas Area with Clean Preview Backdrop */}
          <div
            ref={reportCanvasRef}
            className="p-4 sm:p-8 bg-slate-100/90 dark:bg-[#0B1120] min-h-[640px] max-h-[820px] overflow-auto flex items-start justify-center transition-colors"
          >
            {currentStudent ? (
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.12s ease-out'
                }}
                className="shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10 bg-white"
              >
                <EccEvaluationReport
                  student={currentStudent}
                  mode="screen"
                  academicYear={academicYear}
                  courseLevel={selectedCourse}
                  termName={evaluationPeriod}
                  reportDate={reportDate}
                  evaluationData={currentStudent.evaluationData}
                  teacherComments={currentStudent.teacherComments}
                  foreignTeacherComments={currentStudent.foreignTeacherComments}
                  leadTeacher={currentStudent.teacher || 'Teacher Sophea'}
                  foreignTeacherName=""
                  localTeacherName={currentStudent.teacher || 'Teacher Sophea'}
                />
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400">
                <FileText size={42} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  {t('evaluations.no_students_found', 'No enrolled students match the filter')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {t('evaluations.adjust_filters_hint', 'Try selecting another class or resetting search terms.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 4. STUDENT EVALUATION ROSTER TABLE ================= */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-[#111C32] rounded-xl border border-slate-200 dark:border-[#29364D] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-[#29364D] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('evaluations.roster_table', 'Class Student Evaluation Roster')}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                {t('evaluations.roster_subtitle', 'Detailed view of all enrolled students, score records, and evaluation statuses')}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
              {filteredStudents.length} {t('common.students', 'students')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-[#29364D] text-slate-500 dark:text-[#94A3B8] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade & Class</th>
                  <th className="py-3 px-4">Lead Teacher</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No students found matching your selection.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setActiveTab('preview');
                      }}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/60 transition-colors cursor-pointer ${
                        currentStudent?.id === st.id ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={st.avatar} 
                            alt={st.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#29364D]" 
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                              {st.name}
                              {st.khmerName && (
                                <span className="font-siemreap text-xs text-indigo-600 dark:text-indigo-400 font-normal">
                                  ({st.khmerName})
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono font-semibold">
                              {st.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-[#CBD5E1]">{st.grade}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{st.className}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-[#94A3B8]">
                        {st.teacher}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-800 text-xs">
                          {st.recentScore || '96/100'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={st.evaluationStatus} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Preview Report Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(st.id);
                              setActiveTab('preview');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-[#CBD5E1] hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                            title="Preview Official ECC Report"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit Record */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(st.id);
                              handleOpenEditModal();
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#29364D] text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                            title="Edit Evaluation Record"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 5. MODAL: FULL SCREEN OFFICIAL ECC REPORT PREVIEW ================= */}
      {isModalPreviewOpen && currentStudent && (
        <EvaluationPreviewModal
          isOpen={isModalPreviewOpen}
          onClose={() => setIsModalPreviewOpen(false)}
          student={currentStudent}
          academicYear={academicYear}
          courseLevel={selectedCourse}
          termName={evaluationPeriod}
          reportDate={reportDate}
          leadTeacher={currentStudent?.teacher || 'Teacher Sophea'}
          foreignTeacher=""
        />
      )}

      {/* ================= 6. MODAL: EDIT EVALUATION RECORD ================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`${t('evaluations.edit_modal_title', 'Edit Evaluation Record')}: ${currentStudent?.name || ''}`}
        description={`Record updated evaluation marks, competency criteria, and teacher comments for ${currentStudent?.className || ''}.`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
          {/* Criteria Breakdown Grid */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#151F32]/50 space-y-2.5">
            <h4 className="font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center justify-between">
              <span>{t('evaluations.criteria_breakdown', 'Evaluation Criteria Breakdown (100 Marks)')}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                {Number(criteriaScores.attendance) +
                  Number(criteriaScores.dailyObs) +
                  Number(criteriaScores.weeklyObs) +
                  Number(criteriaScores.nativeTest) +
                  Number(criteriaScores.finalExam)} / 100
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  {t('evaluations.criteria_attendance', '1. Attendance (វត្តមាន)')} / 10
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={criteriaScores.attendance}
                  onChange={(e) => setCriteriaScores({ ...criteriaScores, attendance: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  {t('evaluations.criteria_daily', '2. Daily Obs (ការសង្កេតប្រចាំថ្ងៃ)')} / 15
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  required
                  value={criteriaScores.dailyObs}
                  onChange={(e) => setCriteriaScores({ ...criteriaScores, dailyObs: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  {t('evaluations.criteria_weekly', '3. Weekly Obs (ការសង្កេតប្រចាំសប្តាហ៍)')} / 20
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  required
                  value={criteriaScores.weeklyObs}
                  onChange={(e) => setCriteriaScores({ ...criteriaScores, weeklyObs: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  {t('evaluations.criteria_native', '4. Native Test (តេស្តជាមួយបរទេស)')} / 30
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  required
                  value={criteriaScores.nativeTest}
                  onChange={(e) => setCriteriaScores({ ...criteriaScores, nativeTest: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  {t('evaluations.criteria_final', '5. Final Exam (ការប្រឡងបញ្ចប់)')} / 25
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  required
                  value={criteriaScores.finalExam}
                  onChange={(e) => setCriteriaScores({ ...criteriaScores, finalExam: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Course Level Template */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              Course Level / Template (Khmer)
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-siemreap text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="សន្ទនាសម្រាប់បឋមទូទៅ">សន្ទនាសម្រាប់បឋមទូទៅ (General Elementary Conversation)</option>
              <option value="ភាសាអង់គ្លេសទូទៅកម្រិតដំបូង">ភាសាអង់គ្លេសទូទៅកម្រិតដំបូង (Beginner English)</option>
              <option value="វេយ្យាករណ៍និងការសរសេរ">វេយ្យាករណ៍និងការសរសេរ (Grammar & Writing Focus)</option>
              <option value="ការត្រៀមប្រឡងបញ្ចប់វគ្គ">ការត្រៀមប្រឡងបញ្ចប់វគ្គ (Certificate Level Prep)</option>
            </select>
          </div>

          {/* Oral Rating */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('evaluations.oral_rating', 'Oral & Speaking Proficiency Rating')}
            </label>
            <select
              value={oralRating}
              onChange={(e) => setOralRating(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
            >
              <option value="Excellent">Excellent (A - 90-100%)</option>
              <option value="Good">Good (B - 80-89%)</option>
              <option value="Fair">Fair (C - 70-79%)</option>
              <option value="Needs Support">Needs Support (D/E)</option>
            </select>
          </div>

          {/* Local Teacher Comments (Khmer) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('evaluations.local_teacher_remarks', 'Local Teacher Comments (Khmer)')}
            </label>
            {localTeacherComments.map((cm, i) => (
              <input
                key={i}
                type="text"
                value={cm}
                onChange={(e) => {
                  const copy = [...localTeacherComments];
                  copy[i] = e.target.value;
                  setLocalTeacherComments(copy);
                }}
                className="w-full px-3 py-1.5 mb-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-siemreap"
              />
            ))}
          </div>

          {/* Teacher's Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('evaluations.remarks_and_goals', 'Teacher\'s Academic Remarks & Next Goals')}
            </label>
            <textarea
              rows={2}
              placeholder="Observations on vocabulary, pronunciation, classroom participation and homework habits..."
              value={evalNotes}
              onChange={(e) => setEvalNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-[#29364D]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-[#94A3B8] font-semibold hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer text-xs"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer text-xs"
            >
              {t('evaluations.save_evaluation', 'Save Evaluation')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= 7. OFF-SCREEN 1:1 RENDER TARGET FOR SINGLE PDF EXPORT (OFFICIAL TEMPLATE) ================= */}
      {currentStudent && (
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
            ref={singleExportRef}
            student={currentStudent}
            academicYear={academicYear}
            courseLevel={selectedCourse}
            termName={evaluationPeriod}
            reportDate={reportDate}
            evaluationData={currentStudent.evaluationData}
            teacherComments={currentStudent.teacherComments}
            foreignTeacherComments={currentStudent.foreignTeacherComments}
            leadTeacher={currentStudent.teacher || 'Teacher Sophea'}
            foreignTeacherName=""
            localTeacherName={currentStudent.teacher || 'Teacher Sophea'}
          />
        </div>
      )}

      {/* ================= 8. HIDDEN DOM CONTAINER FOR BULK MULTI-PAGE PDF GENERATION (OFFICIAL TEMPLATE) ================= */}
      {isBulkExporting && (
        <div
          ref={bulkContainerRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '210mm',
            background: '#ffffff',
            pointerEvents: 'none'
          }}
        >
          {filteredStudents.map((st, idx) => (
            <div key={`bulk-sheet-${st.id || idx}`} className="ecc-bulk-report-page mb-8">
              <EccOfficialPdfTemplate
                student={st}
                academicYear={academicYear}
                courseLevel={selectedCourse}
                termName={evaluationPeriod}
                reportDate={reportDate}
                evaluationData={st.evaluationData}
                teacherComments={st.teacherComments}
                foreignTeacherComments={st.foreignTeacherComments}
                leadTeacher={st.teacher || 'Teacher Sophea'}
                foreignTeacherName=""
                localTeacherName={st.teacher || 'Teacher Sophea'}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
