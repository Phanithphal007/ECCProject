import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  Layers,
  Users,
  Clock,
  MapPin,
  Plus,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  ClipboardCheck,
  Archive,
  RotateCcw,
  Lock,
  CalendarOff
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ClassModal } from '../components/classes/ClassModal';
import { ClassDetailsModal } from '../components/classes/ClassDetailsModal';
import { useApp } from '../context/useApp';
import { 
  formatSubjectName, 
  toKhmerDigits,
  formatSchedule,
  formatScheduleDays,
  formatScheduleTime
} from '../utils/formatters';
import { 
  evaluateAttendanceStatus, 
  getCambodiaTime 
} from '../utils/attendanceSchedule';

export const ClassesView = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();

  const {
    subjects = [],
    classes = [],
    attendanceRecords = [],
    addClass,
    updateClass,
    archiveClass,
    deleteClass,
    students = [],
    teachers = [],
    setSelectedClassId,
    navigateToClassStudents,
    navigateToClassAttendance,
    navigateToSubjects
  } = useApp();

  const handleViewStudents = (classId) => {
    if (setSelectedClassId) setSelectedClassId(classId);
    navigate(`/admin/classes/${classId}/students`);
  };

  const handleTrackAttendance = (classId) => {
    if (setSelectedClassId) setSelectedClassId(classId);
    navigate(`/admin/attendance?classId=${classId}`);
  };

  // Secondary Filter States
  const [classSearch, setClassSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classToArchive, setClassToArchive] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [detailsClass, setDetailsClass] = useState(null);

  const numDisplay = (val) => (lang === 'km' ? toKhmerDigits(val) : val);

  // Dynamic Summary Metrics
  const summaryMetrics = useMemo(() => {
    const activeClasses = classes.filter((c) => c.status === 'Active');
    const totalEnrollments = classes.reduce((sum, c) => {
      const count = Array.isArray(c.enrolledStudentIds)
        ? c.enrolledStudentIds.length
        : c.enrolled || 0;
      return sum + count;
    }, 0);

    return {
      totalSubjects: subjects.length,
      activeClassesCount: activeClasses.length,
      totalEnrollments
    };
  }, [subjects, classes]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // 1. Subject filter
      if (selectedSubjectFilter !== 'All' && c.subjectId !== selectedSubjectFilter) {
        return false;
      }

      // 2. Teacher filter
      if (selectedTeacherFilter !== 'All' && c.teacherId !== selectedTeacherFilter) {
        return false;
      }

      // 3. Status filter
      if (selectedStatusFilter !== 'All' && c.status !== selectedStatusFilter) {
        return false;
      }

      // 4. Search query (search name, code, subject, teacher, studentLocation)
      if (classSearch.trim()) {
        const q = classSearch.toLowerCase();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchCode = (c.code || '').toLowerCase().includes(q);
        const matchSubject = (c.subjectName || '').toLowerCase().includes(q);
        const matchTeacher = (c.teacher || '').toLowerCase().includes(q);
        const matchLocation = (c.studentLocation || c.room || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSubject && !matchTeacher && !matchLocation) {
          return false;
        }
      }

      return true;
    });
  }, [classes, selectedSubjectFilter, selectedTeacherFilter, selectedStatusFilter, classSearch]);

  const hasActiveFilters = 
    selectedSubjectFilter !== 'All' ||
    selectedTeacherFilter !== 'All' ||
    selectedStatusFilter !== 'All' ||
    classSearch.trim() !== '';

  const handleResetFilters = () => {
    setSelectedSubjectFilter('All');
    setSelectedTeacherFilter('All');
    setSelectedStatusFilter('All');
    setClassSearch('');
  };

  const handleSaveClass = (classData) => {
    if (editingClass?.id) {
      updateClass(editingClass.id, classData);
    } else {
      addClass(classData);
    }
    setEditingClass(null);
  };

  const handleArchiveConfirm = () => {
    if (classToArchive) {
      archiveClass(classToArchive.id);
      setClassToArchive(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (classToDelete) {
      deleteClass(classToDelete.id);
      setClassToDelete(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Page Header */}
      <PageHeader
        title={t('classes.title')}
        subtitle={t('classes.subtitle')}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={navigateToSubjects}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen size={14} className="text-indigo-600" />
            <span>{t('subjects.page_title')}</span>
          </button>

          <button
            data-testid="create-class-btn"
            onClick={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('classes.create_button')}</span>
          </button>
        </div>
      </PageHeader>

      {/* 3 Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total English Subjects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] block mb-1">
              {t('classes.total_subjects')}
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight font-heading">
              {numDisplay(summaryMetrics.totalSubjects)}
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1">
              <BookOpen size={12} />
              <span>{t('classes.foundational_and_core')}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
        </div>

        {/* Card 2: Active Classes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] block mb-1">
              {t('classes.active_classes_card')}
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight font-heading">
              {numDisplay(summaryMetrics.activeClassesCount)}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} />
              <span>{t('classes.cohorts_in_session')}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
        </div>

        {/* Card 3: Total Student Enrollments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] block mb-1">
              {t('classes.total_enrollments')}
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight font-heading">
              {numDisplay(summaryMetrics.totalEnrollments)}
            </div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
              <Users size={12} />
              <span>{t('classes.enrolled_learners')}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* Secondary Search & Filter Bar */}
      <div className="bg-white dark:bg-[#111C32] p-4 rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder={t('classes.search_classes_placeholder')}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Subject Filter */}
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="All">{t('classes.all_subjects')}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatSubjectName(s, lang)} ({s.code})
                </option>
              ))}
            </select>

            {/* Teacher Filter */}
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="All">{t('classes.all_teachers')}</option>
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="All">{t('classes.all_statuses')}</option>
              <option value="Active">{t('common.active')}</option>
              <option value="Scheduled">{t('common.scheduled')}</option>
              <option value="Completed">{t('common.completed')}</option>
              <option value="Archived">{t('common.archived')}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Pill Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span>{t('classes.active_filters')}</span>
              <strong className="text-indigo-600">
                ({numDisplay(filteredClasses.length)} {t('classes.tab_classes')})
              </strong>
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>{t('common.reset_filters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* PART 3: REDESIGNED CLASS CARDS (5 CLEAR SECTIONS) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-14 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <Layers size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">
                {t('classes.no_classes_match')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('classes.adjust_filter_prompt')}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-semibold text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t('common.reset_filters')}</span>
                </button>
              )}
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const enrolledCount = Array.isArray(cls.enrolledStudentIds)
                ? cls.enrolledStudentIds.length
                : cls.enrolled || 0;
              const capacity = cls.capacity || 25;
              const availableSeats = Math.max(0, capacity - enrolledCount);
              const capacityPercent = Math.min(
                100,
                Math.round((enrolledCount / capacity) * 100)
              );

              // Teacher initials
              const teacherInitials = (cls.teacher || 'T')
                .replace('Teacher ', '')
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              // Subject display name
              const subjectObj = subjects.find(s => s.id === cls.subjectId);
              const subjectDisplayName = formatSubjectName(subjectObj, lang) || cls.subjectName || cls.subjectId;

              // Schedule and Attendance status evaluation
              const attStatus = evaluateAttendanceStatus(cls, null, null, attendanceRecords);

              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* A. CLASS HEADER */}
                    <div className="pb-3 border-b border-slate-100 dark:border-[#29364D] flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Class Branding Icon */}
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Layers size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-bold border border-transparent dark:border-[#29364D]">
                              {cls.code}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100/70 dark:border-indigo-900/50 truncate max-w-44">
                              {subjectDisplayName}
                            </span>
                          </div>
                          {/* Prominent Class Name */}
                          <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 leading-snug truncate">
                            {cls.name}
                          </h3>
                        </div>
                      </div>
                      <StatusBadge status={cls.status} size="sm" />
                    </div>

                    {/* B. CLASS SCHEDULE & C. STUDENT LOCATION (NO CLASSROOM/ROOM LABELS) */}
                    <div className="py-3.5 space-y-2 border-b border-slate-100 dark:border-[#29364D] text-xs text-slate-600 dark:text-[#CBD5E1]">
                      {/* Schedule */}
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">{formatScheduleDays(cls.days)}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-slate-600 dark:text-[#CBD5E1]">{formatScheduleTime(cls.time || cls.schedule)}</span>
                        </div>
                      </div>

                      {/* Student Location (Directly from class record) */}
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-[#94A3B8] shrink-0 uppercase tracking-wider">
                            {t('classes.student_location')}:
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                            {cls.studentLocation || cls.room || "Student's Home"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* D. ASSIGNED TEACHER */}
                    <div className="py-3 border-b border-slate-100 dark:border-[#29364D] flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-[#29364D]">
                          {teacherInitials}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] block">
                            {t('common.teacher')}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] truncate block">
                            {cls.teacher}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium shrink-0 bg-slate-50 dark:bg-[#1E293B] px-2 py-0.5 rounded border border-slate-200 dark:border-[#29364D]">
                        {cls.academicYear || '2026-2027'}
                      </span>
                    </div>

                    {/* E. STUDENT ENROLLMENT */}
                    <div className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {numDisplay(enrolledCount)} / {numDisplay(capacity)} {t('common.students', 'នាក់')}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {numDisplay(capacityPercent)}% {t('classes.capacity_used', { percent: '' }).trim()}
                        </span>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-[#1E293B] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            capacityPercent >= 100
                              ? 'bg-rose-500'
                              : capacityPercent >= 80
                              ? 'bg-amber-500'
                              : 'bg-indigo-600 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-slate-500 pt-0.5">
                        <span className="font-medium text-slate-600 dark:text-[#94A3B8]">
                          {t('classes.seats_available', { count: numDisplay(availableSeats) })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* F. CLASS ACTIONS FOOTER */}
                  <div className="pt-3.5 mt-auto border-t border-slate-100 dark:border-[#29364D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    {/* Left Side: View Students + Attendance Status + Schedule Subtext */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {/* Primary Action: View Students */}
                      <button
                        type="button"
                        onClick={() => handleViewStudents(cls.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#4F46E5] active:bg-[#3730A3] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                        title={t('classes.view_students_btn')}
                      >
                        <Users size={14} />
                        <span>{t('classes.view_students_btn')}</span>
                      </button>

                      {/* Attendance Status Action / Badge with 5 Intelligent States */}
                      {attStatus.status === 'AVAILABLE' ? (
                        <button
                          type="button"
                          onClick={() => handleTrackAttendance(cls.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                          title={`Track Attendance (Window open until ${attStatus.schedule?.windowEndStr})`}
                        >
                          <ClipboardCheck size={14} />
                          <span>{t('attendance.track_attendance')}</span>
                        </button>
                      ) : attStatus.status === 'ATTENDANCE_RECORDED' ? (
                        <div className="inline-flex items-center gap-1 shrink-0">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold"
                            title={`Attendance recorded today by ${attStatus.recordedBy || 'Teacher'}`}
                          >
                            <CheckCircle2 size={14} className="text-[#4338CA] dark:text-indigo-400" />
                            <span>Recorded</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTrackAttendance(cls.id)}
                            className="p-1.5 rounded-lg text-[#4338CA] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="View or edit today's recorded attendance"
                            aria-label="View or edit today's recorded attendance"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      ) : attStatus.status === 'NOT_STARTED' ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#29364D] text-xs font-semibold shrink-0 cursor-default"
                          title={`Class starts at ${attStatus.schedule?.startTime}. Attendance opens then.`}
                        >
                          <Clock size={13} />
                          <span>Not Started</span>
                        </span>
                      ) : attStatus.status === 'EXPIRED' ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#29364D] text-xs font-semibold shrink-0 cursor-default"
                          title={`Attendance window closed at ${attStatus.schedule?.windowEndStr}`}
                        >
                          <Lock size={13} />
                          <span>Closed</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-[#29364D]/60 text-xs font-semibold shrink-0 cursor-default"
                          title={`No scheduled session today (${attStatus.schedule?.weekday || 'today'})`}
                        >
                          <CalendarOff size={13} />
                          <span>No Class</span>
                        </span>
                      )}

                      {/* Schedule status subtext / Closing time label pill (when applicable) */}
                      {attStatus.subtext && (attStatus.status === 'AVAILABLE' || attStatus.status === 'EXPIRED') && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                            attStatus.status === 'AVAILABLE'
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'text-slate-500 bg-slate-100 dark:bg-[#1E293B] dark:text-slate-400'
                          }`}
                        >
                          {attStatus.subtext}
                        </span>
                      )}
                    </div>

                    {/* Right Side: Secondary Actions (View Details, Edit, Archive, Delete) */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => setDetailsClass(cls)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title={t('classes.view_class_details')}
                        aria-label={t('classes.view_class_details')}
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit Class */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingClass(cls);
                          setIsClassModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Archive Class */}
                      <button
                        type="button"
                        onClick={() => setClassToArchive(cls)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title={t('classes.archive_class')}
                        aria-label={t('classes.archive_class')}
                      >
                        <Archive size={14} />
                      </button>

                      {/* Delete Class */}
                      <button
                        type="button"
                        onClick={() => setClassToDelete(cls)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABLE VIEW (Alternative view mode) */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs overflow-hidden transition-colors w-full">
          <div className="overflow-x-auto scrollbar-thin w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[980px]">
              <thead className="bg-slate-50/80 dark:bg-[#1E293B]/80 border-b border-slate-200 dark:border-[#29364D] text-slate-500 dark:text-[#94A3B8] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">{t('classes.class_name')}</th>
                  <th className="py-2.5 px-2 whitespace-nowrap min-w-[90px]">
                    <span className="truncate block" title={t('classes.subject')}>
                      {lang === 'km' ? t('classes.subject') : 'Subject'}
                    </span>
                  </th>
                  <th className="py-2.5 px-2 whitespace-nowrap min-w-[90px]">{t('common.teacher')}</th>
                  <th className="py-2.5 px-2 whitespace-nowrap min-w-[105px]">{t('classes.student_location')}</th>
                  <th className="py-2.5 px-2 whitespace-nowrap min-w-[115px]">{t('classes.schedule')}</th>
                  <th className="py-2.5 px-1.5 text-center whitespace-nowrap min-w-[55px]">{t('classes.capacity')}</th>
                  <th className="py-2.5 px-1.5 text-center whitespace-nowrap min-w-[65px]">{t('common.status')}</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[285px] sticky right-0 bg-slate-50 dark:bg-[#1E293B] z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                      {t('classes.no_classes_match')}
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
                    const enrolledCount = Array.isArray(cls.enrolledStudentIds)
                      ? cls.enrolledStudentIds.length
                      : cls.enrolled || 0;
                    const subjectObj = subjects.find(s => s.id === cls.subjectId);
                    const subjectName = formatSubjectName(subjectObj, lang) || cls.subjectName || cls.subjectId;
                    const attStatus = evaluateAttendanceStatus(cls, null, null, attendanceRecords);

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/60 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block leading-tight truncate max-w-[130px]" title={cls.name}>
                            {cls.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-[#94A3B8] block">{cls.code}</span>
                        </td>
                        <td className="py-2 px-2 text-slate-700 dark:text-[#CBD5E1] whitespace-nowrap">
                          <span className="truncate max-w-[90px] block" title={subjectName}>
                            {subjectName}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-medium text-slate-800 dark:text-[#F8FAFC] whitespace-nowrap">
                          <span className="truncate max-w-[90px] block" title={cls.teacher}>
                            {cls.teacher || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-600 dark:text-[#CBD5E1] whitespace-nowrap">
                          <span className="flex items-center gap-1 truncate max-w-[100px]" title={cls.studentLocation || cls.room}>
                            <MapPin size={11} className="text-[#4338CA] dark:text-indigo-400 shrink-0" />
                            <span className="truncate">{cls.studentLocation || cls.room || "Student's Home"}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-600 dark:text-[#CBD5E1] whitespace-nowrap">
                          <div className="leading-tight">
                            <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] text-[11px] block truncate max-w-[110px]" title={formatScheduleDays(cls.days)}>
                              {formatScheduleDays(cls.days)}
                            </span>
                            <span className="text-slate-500 dark:text-[#94A3B8] text-[10px] block truncate max-w-[110px]" title={formatScheduleTime(cls.time || cls.schedule)}>
                              {formatScheduleTime(cls.time || cls.schedule)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-1.5 font-semibold text-slate-900 dark:text-[#F8FAFC] text-center whitespace-nowrap text-[11px]">
                          {numDisplay(enrolledCount)} / {numDisplay(cls.capacity || 25)}
                        </td>
                        <td className="py-2 px-1.5 text-center whitespace-nowrap">
                          <StatusBadge status={cls.status} size="sm" />
                        </td>
                        <td className="py-2 px-3 text-right align-middle whitespace-nowrap min-w-[285px] sticky right-0 bg-white dark:bg-[#111C32] z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap shrink-0 whitespace-nowrap">
                            {/* 1. View Students Primary Button */}
                            <button
                              type="button"
                              onClick={() => handleViewStudents(cls.id)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#4338CA] hover:bg-[#4F46E5] active:bg-[#3730A3] text-white font-semibold text-xs transition-colors shadow-2xs hover:shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                              title={t('classes.view_students_btn')}
                            >
                              <Users size={12} />
                              <span>{t('classes.view_students_btn')}</span>
                            </button>

                            {/* 2. Attendance Status / Action with 5 Intelligent States */}
                            {attStatus.status === 'AVAILABLE' ? (
                              <button
                                type="button"
                                onClick={() => handleTrackAttendance(cls.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                                title={`Track Attendance (Window open until ${attStatus.schedule?.windowEndStr})`}
                              >
                                <ClipboardCheck size={12} />
                                <span>{t('attendance.track_attendance')}</span>
                              </button>
                            ) : attStatus.status === 'ATTENDANCE_RECORDED' ? (
                              <div className="inline-flex items-center gap-1 shrink-0">
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold"
                                  title={`Attendance recorded today by ${attStatus.recordedBy || 'Teacher'}`}
                                >
                                  <CheckCircle2 size={12} className="text-[#4338CA] dark:text-indigo-400" />
                                  <span>Recorded</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTrackAttendance(cls.id)}
                                  className="p-1 rounded-md text-[#4338CA] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                                  title="View or edit recorded attendance"
                                  aria-label="View or edit recorded attendance"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            ) : attStatus.status === 'NOT_STARTED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#29364D] text-[11px] font-semibold shrink-0 cursor-default"
                                title={`Available at ${attStatus.schedule?.startTime}`}
                              >
                                <Clock size={11} />
                                <span>Not Started</span>
                              </span>
                            ) : attStatus.status === 'EXPIRED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#29364D] text-[11px] font-semibold shrink-0 cursor-default"
                                title={`Closed at ${attStatus.schedule?.windowEndStr}`}
                              >
                                <Lock size={11} />
                                <span>Closed</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-50 dark:bg-[#1E293B]/60 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-[#29364D]/60 text-[11px] font-semibold shrink-0 cursor-default"
                                title="No scheduled session today"
                              >
                                <CalendarOff size={11} />
                                <span>No Class</span>
                              </span>
                            )}

                            {/* 3. Secondary Action Icons: Unified compact group */}
                            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#1E293B] shadow-2xs divide-x divide-slate-100 dark:divide-slate-700/60 overflow-hidden shrink-0 ml-0.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setDetailsClass(cls)}
                                className="p-1.5 text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={t('classes.view_class_details')}
                                aria-label={t('classes.view_class_details')}
                              >
                                <Eye size={13} />
                              </button>

                              {/* Edit Class */}
                              <button
                                type="button"
                                onClick={() => { setEditingClass(cls); setIsClassModalOpen(true); }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={t('common.edit')}
                                aria-label={t('common.edit')}
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Archive Class */}
                              <button
                                type="button"
                                onClick={() => setClassToArchive(cls)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={t('classes.archive_class')}
                                aria-label={t('classes.archive_class')}
                              >
                                <Archive size={13} />
                              </button>

                              {/* Delete Class */}
                              <button
                                type="button"
                                onClick={() => setClassToDelete(cls)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={t('common.delete')}
                                aria-label={t('common.delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Create & Edit Modal */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClass(null);
        }}
        onSave={handleSaveClass}
        cls={editingClass}
        subjects={subjects}
        teachers={teachers}
      />

      {/* Class Details Modal */}
      <ClassDetailsModal
        isOpen={Boolean(detailsClass)}
        onClose={() => setDetailsClass(null)}
        cls={detailsClass}
        subject={subjects.find((s) => s.id === detailsClass?.subjectId)}
        allStudents={students}
        onOpenRoster={() => {
          if (detailsClass) {
            navigateToClassStudents(detailsClass.id);
            setDetailsClass(null);
          }
        }}
      />

      {/* Archive Class Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(classToArchive)}
        onClose={() => setClassToArchive(null)}
        onConfirm={handleArchiveConfirm}
        title={t('classes.archive_class_title')}
        description={
          classToArchive 
            ? t('classes.archive_class_desc', { name: classToArchive.name, code: classToArchive.code })
            : ''
        }
        confirmLabel={t('classes.archive_class')}
        confirmVariant="primary"
      />

      {/* Delete Class Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(classToDelete)}
        onClose={() => setClassToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('classes.delete_class_title')}
        description={
          classToDelete 
            ? t('classes.delete_class_desc', { name: classToDelete.name, code: classToDelete.code })
            : ''
        }
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
      />
    </motion.div>
  );
};
