import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Award,
  Plus,
  Trash2,
  Save,
  Printer,
  Calendar,
  User,
  GraduationCap,
  Clock,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Eye,
  Download,
  Loader2,
  X
} from 'lucide-react';

import { useApp } from '../context/useApp';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { EccScoreReport } from '../components/evaluation/EccScoreReport';
import { EccOfficialPdfTemplate } from '../components/evaluation/EccOfficialPdfTemplate';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';
import { getOfficialStudentId } from '../utils/studentId';
import { exportElementToPdf } from '../services/pdfGenerator';
import { scoreService, calculateScoreMetrics } from '../services/scoreService';
import { remarkGeneratorService } from '../services/remarkGeneratorService';
import { mockAssessmentPeriods, ASSESSMENT_PRESETS } from '../mock/scores';
import { formatGrade, formatStudentName, toKhmerDigits } from '../utils/formatters';

export const StudentScoresView = () => {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { students = [], classes = [], addToast } = useApp();

  const printAreaRef = useRef(null);
  const officialPdfExportRef = useRef(null);

  // Class lookup
  const currentClass = useMemo(() => {
    if (!classId) return null;
    return classes.find((c) => c.id === classId) || null;
  }, [classes, classId]);

  // Student lookup
  const student = useMemo(() => {
    return students.find((s) => s.id === studentId) || {
      id: studentId || 'STU-1020',
      name: 'Dara Sok',
      khmerName: 'សុខ ដារា',
      gender: 'Male',
      grade: 'Grade 5',
      className: currentClass?.name || 'ENG-G5-A (Junior Achievers)',
      teacher: currentClass?.teacher || 'Teacher Sovannary Long',
      guardianName: 'Sok Veasna (Father)',
      guardianPhone: '+855 12 888 999',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Active'
    };
  }, [students, studentId, currentClass]);

  // Assessment Periods state
  const [periods, setPeriods] = useState(mockAssessmentPeriods);
  const [selectedPeriodId, setSelectedPeriodId] = useState('T4-MID-2026');

  // Active Score Record state
  const [currentScoreId, setCurrentScoreId] = useState(null);
  const [items, setItems] = useState([]);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [teacherRemarksKhmer, setTeacherRemarksKhmer] = useState('');
  const [dateRecorded, setDateRecorded] = useState(new Date().toISOString().split('T')[0]);

  // History state
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modals & UI states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');

  // Fetch score record & history for selected student & class
  const loadStudentScores = async (periodId) => {
    setIsLoading(true);
    try {
      // 1. Fetch scores for specific period and class
      const response = await scoreService.getStudentScores(student.id, periodId, classId);
      if (response && response.data) {
        const record = response.data;
        setCurrentScoreId(record.id);
        setItems(Array.isArray(record.items) ? record.items.map((it) => ({ ...it })) : []);
        setTeacherRemarks(record.teacherRemarks || '');
        setTeacherRemarksKhmer(record.teacherRemarksKhmer || '');
        setDateRecorded(record.dateRecorded || new Date().toISOString().split('T')[0]);
      }

      // 2. Fetch history for this student & class
      const historyRes = await scoreService.getStudentScoreHistory(student.id, classId);
      if (historyRes && historyRes.data) {
        setScoreHistory(historyRes.data);
      }
    } catch (err) {
      console.error('Failed to load student scores:', err);
      addToast?.({
        type: 'error',
        title: 'Score Load Error',
        message: err.message || 'Could not retrieve student assessment scores.'
      });
    } finally {
      setIsLoading(false);
      setHasChanges(false);
    }
  };

  useEffect(() => {
    if (student.id) {
      loadStudentScores(selectedPeriodId);
    }
  }, [student.id, selectedPeriodId, classId]);

  // Automatic Real-Time Calculations
  const metrics = useMemo(() => {
    return calculateScoreMetrics(items);
  }, [items]);

  // Row validation errors tracker
  const rowErrors = useMemo(() => {
    const errors = {};
    items.forEach((item, idx) => {
      const err = [];
      const max = Number(item.maxScore);
      const obt = Number(item.obtainedScore);

      if (!item.name || !item.name.trim()) {
        err.push('Assessment name is required');
      }
      if (isNaN(max) || max <= 0) {
        err.push('Max score must be > 0');
      }
      if (isNaN(obt) || obt < 0) {
        err.push('Score cannot be negative');
      }
      if (!isNaN(max) && !isNaN(obt) && obt > max) {
        err.push(`Score (${obt}) exceeds max (${max})`);
      }

      if (err.length > 0) {
        errors[item.id || idx] = err;
      }
    });
    return errors;
  }, [items]);

  const hasValidationErrors = Object.keys(rowErrors).length > 0;

  // Row operations
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
    setHasChanges(true);
  };

  const handleAddItem = (preset = null) => {
    const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem = preset
      ? {
          id: newId,
          name: preset.name,
          nameKhmer: preset.nameKhmer || '',
          maxScore: preset.maxScore || 20,
          obtainedScore: 0
        }
      : {
          id: newId,
          name: 'New Assessment',
          nameKhmer: 'ការវាយតម្លៃថ្មី',
          maxScore: 20,
          obtainedScore: 0
        };

    setItems((prev) => [...prev, newItem]);
    setHasChanges(true);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      addToast?.({
        type: 'warning',
        title: 'Action Blocked',
        message: 'At least one assessment row must remain.'
      });
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setHasChanges(true);
  };

  // Save scores through scoreService
  const handleSaveScores = async () => {
    if (hasValidationErrors) {
      const firstError = Object.values(rowErrors)[0]?.[0] || 'Please fix invalid score values.';
      addToast?.({
        type: 'error',
        title: 'Validation Error',
        message: firstError
      });
      return;
    }

    if (items.length === 0) {
      addToast?.({
        type: 'error',
        title: 'Empty Assessment',
        message: 'Please add at least one assessment row.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const periodObj = periods.find((p) => p.id === selectedPeriodId) || periods[0];
      const payload = {
        studentId: student.id,
        periodId: selectedPeriodId,
        periodName: periodObj.name,
        periodNameKhmer: periodObj.nameKhmer,
        academicYear: periodObj.academicYear || '2026-2027',
        classId: classId || student.classId || 'CLS-G1-ALP',
        className: currentClass?.name || student.className || 'Grade 1 — Alphabet A',
        course: currentClass?.subjectName || currentClass?.name || student.course || 'Primary English Program',
        teacher: currentClass?.teacher || student.teacher || 'Teacher Sovannary Long',
        dateRecorded,
        items,
        teacherRemarks,
        teacherRemarksKhmer
      };

      let response;
      if (currentScoreId && !currentScoreId.startsWith('NEW-')) {
        response = await scoreService.updateStudentScores(currentScoreId, payload);
      } else {
        response = await scoreService.createStudentScores(student.id, payload);
      }

      if (response && response.data) {
        setCurrentScoreId(response.data.id);
        setHasChanges(false);
        addToast?.({
          type: 'success',
          title: 'Scores Saved Successfully',
          message: `Saved ${items.length} assessment scores for ${student.name}${currentClass ? ` in ${currentClass.name}` : ''}. Total: ${metrics.totalObtained}/${metrics.totalMax} (${metrics.grade})`
        });

        // Refresh score history
        const historyRes = await scoreService.getStudentScoreHistory(student.id, classId);
        if (historyRes && historyRes.data) {
          setScoreHistory(historyRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to save scores:', err);
      addToast?.({
        type: 'error',
        title: 'Failed to Save Scores',
        message: err.message || 'An error occurred while saving scores.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Grade color helper
  const getGradeBadgeStyle = (grade) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'B':
        return 'bg-blue-500 text-white shadow-blue-500/20';
      case 'C':
        return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'D':
        return 'bg-orange-500 text-white shadow-orange-500/20';
      case 'F':
        return 'bg-rose-500 text-white shadow-rose-500/20';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const activePeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

  const currentScoreRecord = {
    id: currentScoreId || `PREVIEW-${student.id}`,
    studentId: student.id,
    periodId: selectedPeriodId,
    periodName: activePeriod.name,
    periodNameKhmer: activePeriod.nameKhmer,
    academicYear: activePeriod.academicYear,
    classId: classId || student.classId || 'CLS-G1-ALP',
    className: currentClass?.name || student.className || 'Grade 1 — Alphabet A',
    course: currentClass?.subjectName || currentClass?.name || student.course || 'Primary English Program',
    teacher: currentClass?.teacher || student.teacher || 'Teacher Sovannary Long',
    dateRecorded,
    items,
    metrics,
    teacherRemarks,
    teacherRemarksKhmer
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    const target = officialPdfExportRef.current || printAreaRef.current;
    if (!target) return;
    try {
      setIsExportingPdf(true);
      const safeId = getOfficialStudentId(student);
      const safeName = (student.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `ECC_Assessment_${safeId}_${safeName}.pdf`;
      await exportElementToPdf(target, filename);
      addToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `${filename} saved successfully.`
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      addToast({
        type: 'warning',
        title: 'Opening Print Dialog',
        message: 'Direct PDF failed. Please select "Save as PDF" in the print window.'
      });
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Automatic Remark Generation Handlers (100% Local Rule-Based, No External AI Required)
  const handleAutoGenerateRemarks = () => {
    const generated = remarkGeneratorService.generateBothRemarks({
      student,
      items,
      metrics,
      options: {
        leadTeacher: currentClass?.teacher || student?.teacher,
        course: currentClass?.subjectName || currentClass?.name || student?.course
      }
    });

    setTeacherRemarks(generated.english);
    setTeacherRemarksKhmer(generated.khmer);
    setHasChanges(true);

    addToast({
      type: 'success',
      title: 'Remarks Auto-Generated',
      message: `Generated custom English & Khmer remarks for ${student.name} based on assessment score analysis.`
    });
  };

  const handleGenerateEnglishRemarkOnly = () => {
    const en = remarkGeneratorService.generateEnglishRemarks({
      student,
      items,
      metrics,
      options: {
        leadTeacher: currentClass?.teacher || student?.teacher,
        course: currentClass?.subjectName || currentClass?.name || student?.course
      }
    });
    setTeacherRemarks(en);
    setHasChanges(true);
    addToast({
      type: 'info',
      title: 'English Remarks Updated',
      message: 'Generated professional English evaluation remarks.'
    });
  };

  const handleGenerateKhmerRemarkOnly = () => {
    const km = remarkGeneratorService.generateKhmerRemarks({
      student,
      items,
      metrics,
      options: {
        leadTeacher: currentClass?.teacher || student?.teacher,
        course: currentClass?.subjectName || currentClass?.name || student?.course
      }
    });
    setTeacherRemarksKhmer(km);
    setHasChanges(true);
    addToast({
      type: 'info',
      title: 'Khmer Remarks Updated',
      message: 'បានបង្កើតមតិយោបល់គ្រូបង្រៀនជាភាសាខ្មែរស្របតាមពិន្ទុជាក់ស្តែង។'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* 1. Header with Breadcrumbs & Actions */}
      <PageHeader
        title={`Record Scores: ${student.name}`}
        subtitle={
          currentClass
            ? `Cohort: ${currentClass.name} • ${currentClass.code || ''} • Teacher: ${currentClass.teacher}`
            : "Record, calculate, and manage student competency assessments and term scores."
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => classId ? navigate(`/admin/classes/${classId}/students`) : navigate('/admin/students')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>{classId ? `Back to ${currentClass?.name || 'Class'}` : 'Back to Students'}</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleSaveScores}
            disabled={isSaving || hasValidationErrors}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Scores'}</span>
          </button>
        </div>
      </PageHeader>

      {/* 2. Student Information Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <img
            src={getStudentAvatarUrl(student.avatar)}
            alt={student.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900/60 shadow-xs shrink-0 bg-slate-100 dark:bg-slate-800"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {student.name}
              </h2>
              {student.khmerName && (
                <span className="font-siemreap text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  ({student.khmerName})
                </span>
              )}
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#29364D]">
                {getOfficialStudentId(student)}
              </span>
              <StatusBadge status={student.status || 'Active'} size="sm" />
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                <span>Gender: <strong>{student.gender}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Class: <strong className="text-slate-800 dark:text-white">{currentClass?.name || student.className || 'Grade 1 — Alphabet A'}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={13} className="text-slate-400" />
                <span>Course: <strong>{currentClass?.subjectName || currentClass?.name || student.course || 'Primary English'}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                <span>Teacher: <strong>{currentClass?.teacher || student.teacher || 'Teacher Sovannary Long'}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400" />
                <span>Guardian: <strong>{student.guardianName || 'Parent'}</strong> ({student.guardianPhone || 'N/A'})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Automatic Score Summary Cards (Real-Time Dynamic Calculations) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Max Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Total Max Score
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              {metrics.totalMax}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
              Sum of max points
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Award size={22} />
          </div>
        </div>

        {/* Total Obtained Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
              Total Obtained Score
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight font-heading">
              {metrics.totalObtained}
            </div>
            <span className="text-[11px] font-semibold text-indigo-500 mt-0.5 block">
              Earned by student
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Overall Percentage
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              {metrics.isValid ? `${metrics.percentage}%` : '0%'}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
              (Obtained / Max) × 100
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
        </div>

        {/* Final Grade Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Final Grade
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl font-black text-xl shadow-sm ${getGradeBadgeStyle(metrics.grade)}`}>
                {metrics.grade}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {metrics.grade === 'A' ? 'Excellent (90-100%)' :
                 metrics.grade === 'B' ? 'Good (80-89%)' :
                 metrics.grade === 'C' ? 'Satisfactory (70-79%)' :
                 metrics.grade === 'D' ? 'Needs Work (60-69%)' :
                 metrics.grade === 'F' ? 'Failing (<60%)' : 'No Data'}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* 4. Score Input Table & Assessment Management */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#29364D]">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Assessment Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter maximum and obtained scores. All totals and letter grades calculate automatically.
            </p>
          </div>

          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Add Preset:</span>
            {ASSESSMENT_PRESETS.slice(0, 4).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddItem(preset)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={12} className="text-indigo-600 dark:text-indigo-400" />
                <span>{preset.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Custom Row</span>
            </button>
          </div>
        </div>

        {/* Assessment Rows Table */}
        <div className="border border-slate-200/90 dark:border-[#29364D] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-[#1E293B]/80 border-b border-slate-200 dark:border-[#29364D] text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3 text-center w-12">No.</th>
                  <th className="py-3 px-4 min-w-[220px]">Assessment Name</th>
                  <th className="py-3 px-3 min-w-[130px]">Khmer Name</th>
                  <th className="py-3 px-3 text-center w-36">Maximum Score</th>
                  <th className="py-3 px-3 text-center w-36">Obtained Score</th>
                  <th className="py-3 px-3 text-center w-24">Grade</th>
                  <th className="py-3 px-3 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No assessment items. Click "+ Custom Row" or a preset to add one.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const rowKey = item.id || idx;
                    const errors = rowErrors[rowKey] || [];
                    const maxVal = Number(item.maxScore) || 0;
                    const obtVal = Number(item.obtainedScore) || 0;
                    const itemRatio = maxVal > 0 ? (obtVal / maxVal) * 100 : 0;
                    let itemGrade = 'F';
                    if (itemRatio >= 90) itemGrade = 'A';
                    else if (itemRatio >= 80) itemGrade = 'B';
                    else if (itemRatio >= 70) itemGrade = 'C';
                    else if (itemRatio >= 60) itemGrade = 'D';

                    return (
                      <tr
                        key={rowKey}
                        className={`transition-colors ${
                          errors.length > 0
                            ? 'bg-rose-50/40 dark:bg-rose-950/20'
                            : 'hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/50'
                        }`}
                      >
                        {/* No. */}
                        <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        {/* Assessment Name (English) */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Vocabulary, Reading, Speaking"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          />
                        </td>

                        {/* Assessment Name (Khmer) */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={item.nameKhmer || ''}
                            onChange={(e) => handleItemChange(idx, 'nameKhmer', e.target.value)}
                            placeholder="ឧ. វាក្យសព្ទ, អំណាន..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-siemreap text-xs focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </td>

                        {/* Maximum Score */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            value={item.maxScore}
                            onChange={(e) => handleItemChange(idx, 'maxScore', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`w-24 px-2 py-1.5 rounded-lg border text-center font-bold font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 ${
                              errors.some((e) => e.includes('Max'))
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC]'
                            }`}
                          />
                        </td>

                        {/* Obtained Score */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.maxScore}
                            step="0.5"
                            value={item.obtainedScore}
                            onChange={(e) => handleItemChange(idx, 'obtainedScore', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`w-24 px-2 py-1.5 rounded-lg border text-center font-bold font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 ${
                              errors.some((e) => e.includes('Score') || e.includes('negative'))
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0B1120] text-indigo-600 dark:text-indigo-400'
                            }`}
                          />
                          {errors.length > 0 && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1 leading-tight text-center">
                              {errors[0]}
                            </p>
                          )}
                        </td>

                        {/* Grade Badge */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs shadow-2xs ${getGradeBadgeStyle(itemGrade)}`}>
                            {itemGrade}
                          </span>
                        </td>

                        {/* Row Delete Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Remove Assessment Row"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Total Calculation Row at Bottom */}
              <tfoot className="bg-slate-50/90 dark:bg-[#1E293B]/90 border-t-2 border-slate-200 dark:border-[#29364D] font-bold text-xs text-slate-900 dark:text-white">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
                    Calculated Totals:
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    {metrics.totalMax}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                    {metrics.totalObtained}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs ${getGradeBadgeStyle(metrics.grade)}`}>
                      {metrics.grade} ({metrics.isValid ? `${metrics.percentage}%` : '0%'})
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 5. Teacher Evaluation Remarks */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Teacher Evaluation Remarks
              </span>
              <span className="text-[11px] text-slate-400">
                (Rule-based auto-generation from scores)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoGenerateRemarks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Automatically generate customized English & Khmer remarks based on student scores"
            >
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Auto-Generate Remarks (English & ខ្មែរ)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teacher Remarks (English)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateEnglishRemarkOnly}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={11} />
                  <span>Generate English</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={teacherRemarks}
                onChange={(e) => {
                  setTeacherRemarks(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Provide constructive feedback on English speaking, reading fluency, and writing skills..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0B1120] text-slate-800 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 font-siemreap">
                  មតិយោបល់របស់គ្រូបង្រៀន (Khmer Remarks)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateKhmerRemarkOnly}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-siemreap cursor-pointer transition-colors"
                >
                  <Sparkles size={11} />
                  <span>បង្កើតមតិខ្មែរ</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={teacherRemarksKhmer}
                onChange={(e) => {
                  setTeacherRemarksKhmer(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="មតិយោបល់ និងការលើកទឹកចិត្តជាភាសាខ្មែរ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0B1120] text-slate-800 dark:text-[#F8FAFC] text-xs font-siemreap focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#29364D]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Assessment</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Print / Export Report</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => classId ? navigate(`/admin/classes/${classId}/students`) : navigate('/admin/students')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveScores}
              disabled={isSaving || hasValidationErrors}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : 'Save Scores'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Score History Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Assessment History for {student.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review past term examinations, competencies, and progression. Select a record to view or update its marks.
            </p>
          </div>
        </div>

        {scoreHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No previous score records found for this student.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scoreHistory.map((hist) => {
              const isSelected = hist.periodId === selectedPeriodId;
              const histMetrics = hist.metrics || calculateScoreMetrics(hist.items);

              return (
                <div
                  key={hist.id}
                  onClick={() => setSelectedPeriodId(hist.periodId)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-[#1E293B]/60 border-slate-200 dark:border-[#29364D] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {hist.periodName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-siemreap mt-0.5">
                        {hist.periodNameKhmer || hist.className}
                      </p>
                    </div>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${getGradeBadgeStyle(histMetrics.grade)}`}>
                      {histMetrics.grade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-[#29364D] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Score</span>
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                        {histMetrics.totalObtained} / {histMetrics.totalMax}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Percentage</span>
                      <strong className="font-mono">{histMetrics.percentage}%</strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{hist.dateRecorded}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                      {isSelected ? 'Currently Editing' : 'Click to Load'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Printable Score Report Modal (Using Official ECC Bokor & Siemreap Fonts) */}
      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Official Student Assessment Score Report"
          description="Ministry-compliant Khmer score sheet layout ready for printing or PDF export."
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Modal Controls Toolbar */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-[#29364D] gap-3 flex-wrap">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Official Ministry-Compliant ECC Assessment Sheet (A4 Portrait)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isExportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Official Sheet</span>
                </button>
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="p-4 sm:p-6 bg-slate-200/80 dark:bg-[#0B1120] rounded-xl overflow-auto max-h-[70vh] flex justify-center">
              <div className="shadow-2xl ring-1 ring-slate-900/10 bg-white">
                <EccScoreReport
                  ref={printAreaRef}
                  student={student}
                  scoreRecord={currentScoreRecord}
                  mode="screen"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Hidden print container for direct browser window.print() */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <EccScoreReport
          student={student}
          scoreRecord={currentScoreRecord}
          mode="screen"
        />
      </div>

      {/* Off-screen 1:1 render target for Official Assessment PDF export */}
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
          ref={officialPdfExportRef}
          student={student}
          academicYear={currentScoreRecord.academicYear || "២០២៦- ២០២៧"}
          courseLevel={currentScoreRecord.course || currentClass?.subjectName || "សន្ទនាសម្រាប់បឋមទូទៅ"}
          termName={currentScoreRecord.periodNameKhmer || "វគ្គ/ខែ បញ្ចប់វគ្គសិក្សា"}
          reportDate={dateRecorded}
          evaluationData={currentScoreRecord.items && currentScoreRecord.items.length > 0 ? currentScoreRecord.items.map((it, idx) => ({
            no: it.noKhmer || ['១','២','៣','៤','៥','៦','៧','៨','៩','១០'][idx] || String(idx + 1),
            name: it.nameKhmer || it.name || it.categoryKhmer || it.category,
            max: Number(it.maxScore) || 0,
            score: Number(it.obtainedScore) || 0,
            grade: it.grade || 'A'
          })) : undefined}
          teacherComments={teacherRemarksKhmer ? teacherRemarksKhmer.split('\n').filter(Boolean) : undefined}
          foreignTeacherComments={teacherRemarks ? teacherRemarks.split('\n').filter(Boolean) : undefined}
          foreignTeacherName=""
          localTeacherName={currentScoreRecord.teacher || currentClass?.teacher || "Teacher Veasna"}
        />
      </div>
    </motion.div>
  );
};

