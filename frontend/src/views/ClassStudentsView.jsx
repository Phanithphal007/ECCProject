import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Check,
  ClipboardCheck,
  Eye,
  Edit2,
  FileText,
  UserCheck2,
  Download,
  Award
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { ClassStudentRegistrationModal } from '../components/classes/ClassStudentRegistrationModal';
import { ClassStudentEditModal } from '../components/classes/ClassStudentEditModal';
import { EvaluationPreviewModal } from '../components/evaluation/EvaluationPreviewModal';
import { useApp } from '../context/useApp';
import { classService } from '../services/classService';
import { scoreService } from '../services/scoreService';
import { formatGrade, formatStudentName, formatAttendanceRate, toKhmerDigits, formatSchedule } from '../utils/formatters';
import { getOfficialStudentId } from '../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';

export const ClassStudentsView = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const numDisplay = (v) => (lang === 'km' ? toKhmerDigits(v) : v);

  const { classId } = useParams();
  const navigate = useNavigate();

  const {
    classes = [],
    selectedClassId,
    setSelectedClassId,
    students = [],
    enrollStudentsInClass,
    removeStudentFromClass,
    setSelectedStudent,
    navigateToClasses,
    navigateToClassAttendance,
    addToast
  } = useApp();

  const activeClassId = classId || selectedClassId;

  // Sync selectedClassId in AppContext if URL param exists
  useEffect(() => {
    if (classId && setSelectedClassId && classId !== selectedClassId) {
      setSelectedClassId(classId);
    }
  }, [classId, selectedClassId, setSelectedClassId]);

  // Find currently targeted class
  const currentClass = useMemo(() => {
    if (activeClassId) {
      return classes.find((c) => c.id === activeClassId) || null;
    }
    return classes[0] || null;
  }, [classes, activeClassId]);

  // Table filter & search states
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'id', 'attendance-desc', 'attendance-asc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Direct Registration modal state
  const [isDirectRegisterOpen, setIsDirectRegisterOpen] = useState(false);

  // Edit Student modal state
  const [studentToEdit, setStudentToEdit] = useState(null);

  // Evaluation & Progress Report modal state
  const [studentForReport, setStudentForReport] = useState(null);

  // Enroll Modal states
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedStudentIdsToEnroll, setSelectedStudentIdsToEnroll] = useState([]);

  // Remove confirmation modal state
  const [studentToRemove, setStudentToRemove] = useState(null);

  // Enrolled students list
  const enrolledStudents = useMemo(() => {
    if (!currentClass || !Array.isArray(currentClass.enrolledStudentIds)) return [];
    return students.filter((s) => currentClass.enrolledStudentIds.includes(s.id));
  }, [currentClass, students]);

  // Real database-calculated statistics
  const stats = useMemo(() => {
    const total = enrolledStudents.length;
    const active = enrolledStudents.filter((s) => s.status === 'Active').length;
    const male = enrolledStudents.filter((s) => s.gender === 'Male').length;
    const female = enrolledStudents.filter((s) => s.gender === 'Female').length;
    const capacity = currentClass?.capacity || 25;
    const availableSeats = Math.max(0, capacity - total);

    const avgAttendance = total > 0
      ? (enrolledStudents.reduce((acc, s) => acc + (Number(s.attendanceRate) || 0), 0) / total).toFixed(1)
      : '100.0';

    return { total, active, male, female, capacity, availableSeats, avgAttendance };
  }, [enrolledStudents, currentClass]);

  // Filtered & Sorted Roster
  const filteredAndSortedRoster = useMemo(() => {
    let result = [...enrolledStudents];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.khmerName && s.khmerName.toLowerCase().includes(q)) ||
          s.id.toLowerCase().includes(q) ||
        getOfficialStudentId(s).includes(q) ||
          getOfficialStudentId(s).includes(q)
      );
    }

    // Gender filter
    if (genderFilter !== 'All') {
      result = result.filter((s) => s.gender === genderFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'id') return a.id.localeCompare(b.id);
      if (sortBy === 'attendance-desc') return (b.attendanceRate || 0) - (a.attendanceRate || 0);
      if (sortBy === 'attendance-asc') return (a.attendanceRate || 0) - (b.attendanceRate || 0);
      return 0;
    });

    return result;
  }, [enrolledStudents, searchTerm, genderFilter, statusFilter, sortBy]);

  // Pagination calculation
  const totalRecords = filteredAndSortedRoster.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedStudents = filteredAndSortedRoster.slice(startIndex, startIndex + recordsPerPage);

  // Eligible students for enrollment (excludes students already in this cohort)
  const eligibleStudents = useMemo(() => {
    if (!currentClass) return [];
    const enrolledSet = new Set(currentClass.enrolledStudentIds || []);
    return students.filter((s) => !enrolledSet.has(s.id));
  }, [currentClass, students]);

  const filteredEligibleStudents = useMemo(() => {
    if (!enrollSearch.trim()) return eligibleStudents;
    const q = enrollSearch.toLowerCase();
    return eligibleStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.khmerName && s.khmerName.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q) ||
        getOfficialStudentId(s).includes(q) ||
        s.grade.toLowerCase().includes(q)
    );
  }, [eligibleStudents, enrollSearch]);

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIdsToEnroll((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = () => {
    const allIds = filteredEligibleStudents.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedStudentIdsToEnroll.includes(id));
    if (allSelected) {
      setSelectedStudentIdsToEnroll((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedStudentIdsToEnroll((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleConfirmEnrollment = () => {
    if (selectedStudentIdsToEnroll.length === 0 || !currentClass) return;

    if (selectedStudentIdsToEnroll.length > stats.availableSeats) {
      addToast({
        type: 'warning',
        title: t('classes.capacity_exceeded', 'Class Capacity Warning'),
        message: t(
          'classes.capacity_exceeded_msg',
          'Enrolling {{count}} student(s) exceeds the remaining {{seats}} available seats for this cohort.',
          { count: selectedStudentIdsToEnroll.length, seats: stats.availableSeats }
        )
      });
    }

    enrollStudentsInClass(currentClass.id, selectedStudentIdsToEnroll);
    setSelectedStudentIdsToEnroll([]);
    setIsEnrollModalOpen(false);
  };

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove || !currentClass) return;
    try {
      await classService.removeStudent(currentClass.id, studentToRemove.id);
      removeStudentFromClass(currentClass.id, studentToRemove.id);
      addToast({
        type: 'success',
        title: 'Student Removed',
        message: `${studentToRemove.name} has been removed from ${currentClass.name}.`
      });
    } catch {
      removeStudentFromClass(currentClass.id, studentToRemove.id);
    } finally {
      setStudentToRemove(null);
    }
  };

  const handleExportCsv = () => {
    if (!currentClass || enrolledStudents.length === 0) return;
    const headers = ['Student ID', 'Name', 'Khmer Name', 'Gender', 'Grade', 'Parent Name', 'Parent Phone', 'Attendance Rate', 'Status'];
    const rows = filteredAndSortedRoster.map((s) => [
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.khmerName || ''}"`,
      `"${s.gender}"`,
      `"${s.grade}"`,
      `"${s.guardianName || ''}"`,
      `"${s.guardianPhone || ''}"`,
      `"${s.attendanceRate}%"`,
      `"${s.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentClass.code || currentClass.id}_Enrolled_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      type: 'success',
      title: 'Export Completed',
      message: `Exported ${filteredAndSortedRoster.length} student records for ${currentClass.name}.`
    });
  };

  if (!currentClass) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200 dark:border-[#29364D]">
        <Users size={36} className="mx-auto mb-2 text-slate-400" />
        <h3 className="font-bold text-slate-800 dark:text-white text-base">Class Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested class cohort could not be located.</p>
        <button
          onClick={() => navigate('/admin/classes')}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs cursor-pointer"
        >
          Return to English Classes
        </button>
      </div>
    );
  }

  const capacityPercent = Math.min(100, Math.round((stats.total / stats.capacity) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/admin/classes')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#CBD5E1] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group min-h-[44px] py-1"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('classes.back_to_classes', 'Back to English Classes')}</span>
        </button>

        <div className="grid grid-cols-1 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/admin/attendance?classId=${currentClass.id}`)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ClipboardCheck size={15} />
            <span>{t('attendance.track_attendance')}</span>
          </button>

          <button
            onClick={() => {
              setSelectedStudentIdsToEnroll([]);
              setEnrollSearch('');
              setIsEnrollModalOpen(true);
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck2 size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('classes.enroll_students_btn', 'Enroll Existing')}</span>
          </button>

          <button
            onClick={() => setIsDirectRegisterOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus size={15} />
            <span>{t('classes.register_new_student', 'Register New Student')}</span>
          </button>
        </div>
      </div>

      {/* A. Class Information Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#29364D]">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800">
                {currentClass.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-semibold">
                {currentClass.subjectName || currentClass.subjectId}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold">
                {formatGrade(currentClass.gradeLevel, lang)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-50 dark:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8] font-medium border border-slate-200 dark:border-[#29364D]">
                {currentClass.academicYear || '2026-2027'}
              </span>
              <StatusBadge status={currentClass.status} size="sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              {currentClass.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              {currentClass.description || t('classes.default_cohort_desc', 'Official student roster, real-time attendance performance, and enrollment controls.')}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#0E1729] p-3 rounded-xl border border-slate-200 dark:border-[#29364D] min-w-44 text-right">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block mb-1">
              {t('classes.capacity', 'Capacity Occupancy')}
            </span>
            <div className="text-lg font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              {numDisplay(stats.total)} / {numDisplay(stats.capacity)} ({numDisplay(capacityPercent)}%)
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#1E293B] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  capacityPercent >= 100
                    ? 'bg-rose-500'
                    : capacityPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Class Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600 dark:text-[#CBD5E1]">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 dark:text-[#94A3B8] block text-[10px] uppercase font-bold tracking-wider">
                {t('common.teacher', 'Assigned Teacher')}
              </span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{currentClass.teacher}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 dark:text-[#94A3B8] block text-[10px] uppercase font-bold tracking-wider">
                {t('classes.schedule', 'Schedule')}
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">{formatSchedule(currentClass)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 dark:text-[#94A3B8] block text-[10px] uppercase font-bold tracking-wider">
                {t('classes.student_location')}
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">{currentClass.studentLocation || currentClass.room}</span>
            </div>
          </div>
        </div>
      </div>

      {/* B. 6 Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block mb-1">
            {t('classes.stat_total_students')}
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">{numDisplay(stats.total)}</div>
          <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5 block">{t('classes.enrolled_in_cohort', 'Enrolled in cohort')}</span>
        </div>

        {/* Card 2: Active Students */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
            {t('classes.stat_active_students')}
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{numDisplay(stats.active)}</div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block flex items-center gap-0.5">
            <UserCheck size={11} />
            <span>{t('classes.attending_classes', 'Attending classes')}</span>
          </span>
        </div>

        {/* Card 3: Male Students */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block mb-1">
            {t('classes.stat_male_students')}
          </span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{numDisplay(stats.male)}</div>
          <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5 block">
            {numDisplay(stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0)}% {t('classes.of_cohort', 'of cohort')}
          </span>
        </div>

        {/* Card 4: Female Students */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-[#4338CA] dark:text-indigo-400 block mb-1">
            {t('classes.stat_female_students')}
          </span>
          <div className="text-2xl font-extrabold text-[#4338CA] dark:text-indigo-400">{numDisplay(stats.female)}</div>
          <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5 block">
            {numDisplay(stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0)}% {t('classes.of_cohort', 'of cohort')}
          </span>
        </div>

        {/* Card 5: Available Seats */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-1">
            {t('classes.stat_available_seats')}
          </span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{numDisplay(stats.availableSeats)}</div>
          <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5 block">{t('classes.of_max_limit', 'of {{max}} max limit', { max: numDisplay(stats.capacity) })}</span>
        </div>

        {/* Card 6: Average Attendance */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 block mb-1">
            {t('classes.stat_avg_attendance')}
          </span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{numDisplay(stats.avgAttendance)}%</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-0.5">
            <TrendingUp size={11} />
            <span>{t('classes.high_engagement', 'High engagement')}</span>
          </span>
        </div>
      </div>

      {/* C. Student Roster Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-4 transition-colors">
        {/* Roster Controls: Search, Filters, Sort, and Register Button */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('classes.search_roster_placeholder', 'Search enrolled students by name, ID...')}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Filter dropdowns & Quick Action */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Gender Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0E1729] border border-slate-200 dark:border-[#29364D] rounded-lg px-2.5 py-1.5">
              <Filter size={13} className="text-slate-400 dark:text-slate-500" />
              <span className="text-slate-500 dark:text-[#94A3B8] font-medium">{t('common.gender', 'Gender')}:</span>
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-700 dark:text-[#CBD5E1] focus:outline-hidden cursor-pointer"
              >
                <option value="All" className="dark:bg-[#111C32]">{t('common.all', 'All')}</option>
                <option value="Male" className="dark:bg-[#111C32]">{t('common.male', 'Male')}</option>
                <option value="Female" className="dark:bg-[#111C32]">{t('common.female', 'Female')}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0E1729] border border-slate-200 dark:border-[#29364D] rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 dark:text-[#94A3B8] font-medium">{t('common.status', 'Status')}:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-700 dark:text-[#CBD5E1] focus:outline-hidden cursor-pointer"
              >
                <option value="All" className="dark:bg-[#111C32]">{t('common.all', 'All')}</option>
                <option value="Active" className="dark:bg-[#111C32]">{t('common.active', 'Active')}</option>
                <option value="Probation" className="dark:bg-[#111C32]">{t('common.probation', 'Probation')}</option>
                <option value="Graduated" className="dark:bg-[#111C32]">{t('common.graduated', 'Graduated')}</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0E1729] border border-slate-200 dark:border-[#29364D] rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 dark:text-[#94A3B8] font-medium">{t('common.sort', 'Sort')}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 dark:text-[#CBD5E1] focus:outline-hidden cursor-pointer"
              >
                <option value="name-asc" className="dark:bg-[#111C32]">{t('classes.sort_name_asc', 'Name (A → Z)')}</option>
                <option value="name-desc" className="dark:bg-[#111C32]">{t('classes.sort_name_desc', 'Name (Z → A)')}</option>
                <option value="id" className="dark:bg-[#111C32]">{t('classes.sort_id', 'Student ID')}</option>
                <option value="attendance-desc" className="dark:bg-[#111C32]">{t('classes.sort_attendance_desc', 'Attendance (Highest)')}</option>
                <option value="attendance-asc" className="dark:bg-[#111C32]">{t('classes.sort_attendance_asc', 'Attendance (Lowest)')}</option>
              </select>
            </div>

            {/* Records per page */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0E1729] border border-slate-200 dark:border-[#29364D] rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 dark:text-[#94A3B8] font-medium">{t('common.show', 'Show')}:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-700 dark:text-[#CBD5E1] focus:outline-hidden cursor-pointer"
              >
                <option value={5} className="dark:bg-[#111C32]">5</option>
                <option value={10} className="dark:bg-[#111C32]">10</option>
                <option value={25} className="dark:bg-[#111C32]">25</option>
                <option value={50} className="dark:bg-[#111C32]">50</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Export Enrolled Students to CSV"
            >
              <Download size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Direct Register Button */}
            <button
              onClick={() => setIsDirectRegisterOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus size={13} />
              <span>{t('classes.register_new_student', 'Register New Student')}</span>
            </button>
          </div>
        </div>

        {/* Full-Width Student Management Table (Desktop: md+) */}
        <div className="border border-slate-200 dark:border-[#29364D] rounded-xl overflow-hidden bg-white dark:bg-[#111C32] transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D] text-slate-600 dark:text-[#94A3B8] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t('common.student', 'Student')}</th>
                  <th className="py-3 px-3">{t('common.id', 'Student ID')}</th>
                  <th className="py-3 px-3">{t('common.gender', 'Gender')}</th>
                  <th className="py-3 px-3">{t('students.col_parent_guardian', 'Parent / Guardian')}</th>
                  <th className="py-3 px-3">{t('students.col_parent_phone', 'Parent Phone')}</th>
                  <th className="py-3 px-3">{t('common.attendance', 'Attendance')}</th>
                  <th className="py-3 px-3">{t('classes.col_scores', 'Score / Grade')}</th>
                  <th className="py-3 px-3">{t('students.payment_status', 'Payment')}</th>
                  <th className="py-3 px-3">{t('common.status', 'Status')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-[#64748B]">
                      <Users size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-slate-700 dark:text-[#CBD5E1] text-xs">
                        {enrolledStudents.length === 0
                          ? t('classes.no_students_enrolled', 'No students enrolled in this cohort yet.')
                          : t('common.no_match', 'No students match your filter criteria.')}
                      </p>
                      {enrolledStudents.length === 0 && (
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setIsDirectRegisterOpen(true)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <UserPlus size={13} />
                            <span>{t('classes.register_new_student', 'Register New Student')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudentIdsToEnroll([]);
                              setEnrollSearch('');
                              setIsEnrollModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck2 size={13} />
                            <span>{t('classes.enroll_students_btn', 'Enroll Existing')}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/50 transition-colors">
                      {/* Photo + Localized Student Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getStudentAvatarUrl(student.avatar)}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight">
                              {formatStudentName(student, lang)}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-[#94A3B8] font-mono mt-0.5">
                              {getOfficialStudentId(student)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-[#CBD5E1]">
                        {getOfficialStudentId(student)}
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            student.gender === 'Male'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {student.gender === 'Male' ? t('common.male') : t('common.female')}
                        </span>
                      </td>

                      {/* Parent Name */}
                      <td className="py-3 px-3 text-slate-700 dark:text-[#CBD5E1] font-medium">
                        {student.guardianName || 'N/A'}
                      </td>

                      {/* Parent Phone */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-[#94A3B8]">
                        {student.guardianPhone || 'N/A'}
                      </td>

                      {/* Attendance % */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            student.attendanceRate >= 95
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : student.attendanceRate >= 85
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {formatAttendanceRate(student.attendanceRate, lang)}
                        </span>
                      </td>

                      {/* Score Indicator */}
                      <td className="py-3 px-3">
                        {(() => {
                          const summary = scoreService.getStudentScoresSummary(student.id, currentClass?.id);
                          if (!summary.hasScore) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#29364D]">
                                Not Recorded
                              </span>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                {summary.scoreText}
                              </span>
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-extrabold text-white shadow-2xs ${
                                  summary.grade === 'A'
                                    ? 'bg-emerald-500'
                                    : summary.grade === 'B'
                                    ? 'bg-blue-500'
                                    : summary.grade === 'C'
                                    ? 'bg-amber-500'
                                    : summary.grade === 'D'
                                    ? 'bg-orange-500'
                                    : 'bg-rose-500'
                                }`}
                              >
                                {summary.grade}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3">
                        <StatusBadge status={student.paymentStatus || student.tuitionStatus || 'Unpaid'} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusBadge status={student.status} size="sm" />
                      </td>

                      {/* Student Table Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. VIEW PROFILE */}
                          <button
                            onClick={() => setSelectedStudent(student)}
                            title={t('students.view_details', 'View Full Student Profile')}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          {/* 2. UPDATE STUDENT */}
                          <button
                            onClick={() => setStudentToEdit(student)}
                            title={t('classes.update_student', 'Update Student Information')}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* 3. RECORD SCORES */}
                          <button
                            onClick={() => navigate(`/admin/students/${student.id}/scores?classId=${currentClass.id}`)}
                            title={t('classes.record_scores', 'Record Student Scores')}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                          >
                            <Award size={15} />
                          </button>

                          {/* 4. REPORT (EVALUATION / PROGRESS) */}
                          <button
                            onClick={() => setStudentForReport(student)}
                            title={t('classes.student_report', 'Student Progress Report & PDF')}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                          >
                            <FileText size={15} />
                          </button>

                          {/* 5. REMOVE FROM COHORT (UNENROLL ONLY) */}
                          <button
                            onClick={() => setStudentToRemove(student)}
                            title={t('classes.remove_from_class', 'Remove Student from Class Cohort')}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (<md) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#29364D]">
            {paginatedStudents.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400 dark:text-[#64748B]">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-slate-700 dark:text-[#CBD5E1] text-xs">
                  {enrolledStudents.length === 0
                    ? t('classes.no_students_enrolled', 'No students enrolled in this cohort yet.')
                    : t('common.no_match', 'No students match your filter criteria.')}
                </p>
                {enrolledStudents.length === 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => setIsDirectRegisterOpen(true)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UserPlus size={15} />
                      <span>{t('classes.register_new_student', 'Register New Student')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudentIdsToEnroll([]);
                        setEnrollSearch('');
                        setIsEnrollModalOpen(true);
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck2 size={15} />
                      <span>{t('classes.enroll_students_btn', 'Enroll Existing')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              paginatedStudents.map((student) => (
                <div key={student.id} className="p-4 space-y-3 bg-white dark:bg-[#111C32]">
                  {/* Student Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getStudentAvatarUrl(student.avatar)}
                        alt={student.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] truncate">
                          {formatStudentName(student, lang)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8]">
                            {getOfficialStudentId(student)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              student.gender === 'Male'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {student.gender === 'Male' ? t('common.male') : t('common.female')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={student.status} size="sm" />
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-[#1E293B]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#94A3B8] block">
                        {t('common.attendance', 'Attendance')}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5 ${
                          student.attendanceRate >= 95
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : student.attendanceRate >= 85
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {formatAttendanceRate(student.attendanceRate, lang)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#94A3B8] block">
                        {t('classes.col_scores', 'Score / Grade')}
                      </span>
                      {(() => {
                        const summary = scoreService.getStudentScoresSummary(student.id, currentClass?.id);
                        if (!summary.hasScore) {
                          return (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#29364D] mt-0.5">
                              Not Recorded
                            </span>
                          );
                        }
                        return (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                              {summary.scoreText}
                            </span>
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-extrabold text-white ${
                                summary.grade === 'A'
                                  ? 'bg-emerald-500'
                                  : summary.grade === 'B'
                                  ? 'bg-blue-500'
                                  : summary.grade === 'C'
                                  ? 'bg-amber-500'
                                  : summary.grade === 'D'
                                  ? 'bg-orange-500'
                                  : 'bg-rose-500'
                              }`}
                            >
                              {summary.grade}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#94A3B8] block">
                        {t('classes.enroll_date', 'Enrollment')}
                      </span>
                      <span className="text-slate-700 dark:text-[#CBD5E1] font-medium flex items-center gap-1 mt-0.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{student.joinDate || '2026-01-10'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Student Mobile Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/70 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
                    >
                      <Eye size={15} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{t('students.view_details', 'Profile')}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/admin/students/${student.id}/scores?classId=${currentClass.id}`)}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
                    >
                      <Award size={15} />
                      <span>{t('classes.scores', 'Scores')}</span>
                    </button>

                    <button
                      onClick={() => setStudentToEdit(student)}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
                    >
                      <Edit2 size={15} />
                      <span>{t('common.edit', 'Edit')}</span>
                    </button>

                    <button
                      onClick={() => setStudentForReport(student)}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
                    >
                      <FileText size={15} />
                      <span>{t('classes.student_report', 'Report')}</span>
                    </button>

                    <button
                      onClick={() => setStudentToRemove(student)}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer col-span-2 sm:col-span-1"
                    >
                      <Trash2 size={15} />
                      <span>{t('classes.remove_from_class', 'Remove')}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0E1729] border-t border-slate-200 dark:border-[#29364D] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-[#94A3B8] transition-colors">
            <div>
              {t('common.showing', 'Showing')}{' '}
              <strong className="text-slate-800 dark:text-[#F8FAFC]">{numDisplay(totalRecords > 0 ? startIndex + 1 : 0)}</strong>{' '}
              {t('common.to', 'to')}{' '}
              <strong className="text-slate-800 dark:text-[#F8FAFC]">
                {numDisplay(Math.min(startIndex + recordsPerPage, totalRecords))}
              </strong>{' '}
              {t('common.of', 'of')}{' '}
              <strong className="text-slate-800 dark:text-[#F8FAFC]">{numDisplay(totalRecords)}</strong> {t('common.students', 'students')}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-800 dark:text-[#F8FAFC]">
                {numDisplay(currentPage)} / {numDisplay(totalPages)}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* D. Direct Student Registration Modal */}
      <ClassStudentRegistrationModal
        isOpen={isDirectRegisterOpen}
        onClose={() => setIsDirectRegisterOpen(false)}
        currentClass={currentClass}
        availableSeats={stats.availableSeats}
        capacity={stats.capacity}
        enrolledCount={stats.total}
      />

      {/* E. Edit Student Profile Modal */}
      <ClassStudentEditModal
        isOpen={Boolean(studentToEdit)}
        onClose={() => setStudentToEdit(null)}
        student={studentToEdit}
      />

      {/* F. Student Evaluation & Progress Report Preview Modal */}
      <EvaluationPreviewModal
        isOpen={Boolean(studentForReport)}
        onClose={() => setStudentForReport(null)}
        student={studentForReport}
        leadTeacher={currentClass?.teacher}
        courseLevel={currentClass?.name}
      />

      {/* G. Enroll Existing Students Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={t('classes.enroll_students_title', 'Enroll Students into Cohort')}
        description={t(
          'classes.enroll_students_desc',
          'Select eligible students to add to this class. Students already enrolled are hidden to prevent duplicate enrollment.'
        )}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Header warning / remaining seats */}
          <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>
                {t('classes.available_seats_left', 'Remaining capacity for this cohort')}:{' '}
                <strong className="font-bold text-indigo-700 dark:text-indigo-300">{numDisplay(stats.availableSeats)} {t('classes.seats', 'seats')}</strong>
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8]">
              {t('common.max', 'Max')}: {numDisplay(stats.capacity)}
            </span>
          </div>

          {/* Search bar & Select All */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                placeholder={t('classes.search_available_students', 'Search by name, ID, or grade...')}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            {filteredEligibleStudents.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllEligible}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                {filteredEligibleStudents.every((s) => selectedStudentIdsToEnroll.includes(s.id))
                  ? t('common.deselect_all', 'Deselect All')
                  : t('common.select_all', 'Select All')}
              </button>
            )}
          </div>

          {/* Student selection list */}
          <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-[#29364D] rounded-xl divide-y divide-slate-100 dark:divide-[#29364D] bg-white dark:bg-[#111C32]">
            {filteredEligibleStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-[#64748B]">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-slate-700 dark:text-[#CBD5E1] text-xs">
                  {eligibleStudents.length === 0
                    ? t('classes.all_students_enrolled', 'All registered students are already enrolled in this class!')
                    : t('common.no_match', 'No students match your search filter.')}
                </p>
              </div>
            ) : (
              filteredEligibleStudents.map((student) => {
                const isSelected = selectedStudentIdsToEnroll.includes(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => handleToggleSelectStudent(student.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1E293B]'
                        }`}
                      >
                        {isSelected && <Check size={11} />}
                      </div>
                      <img
                        src={getStudentAvatarUrl(student.avatar)}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                        }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC] leading-tight">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                          {student.khmerName && <span className="font-khmer mr-1.5">{student.khmerName} •</span>}
                          <span className="font-mono">{getOfficialStudentId(student)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1]">
                        {student.englishLevel || 'Grade Standard'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-[#94A3B8] font-semibold">
              {t('classes.selected_students', 'Selected: {{count}} student(s)', {
                count: numDisplay(selectedStudentIdsToEnroll.length)
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={selectedStudentIdsToEnroll.length === 0}
                onClick={handleConfirmEnrollment}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus size={14} />
                <span>
                  {t('classes.confirm_enroll_btn', 'Enroll ({{count}})', {
                    count: numDisplay(selectedStudentIdsToEnroll.length)
                  })}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* H. Remove Confirmation Dialog: Removes enrollment only! Never deletes student record */}
      <ConfirmDialog
        isOpen={Boolean(studentToRemove)}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemoveStudent}
        title={t('classes.unenroll_title', 'Remove Student from Cohort?')}
        description={t(
          'classes.unenroll_confirm_desc',
          'Are you sure you want to remove {{name}} from this cohort? This removes only their enrollment in this class; their master student profile and past records are completely preserved.',
          { name: studentToRemove?.name }
        )}
        confirmLabel={t('classes.remove_btn', 'Remove from Class')}
        confirmVariant="danger"
      />
    </motion.div>
  );
};

