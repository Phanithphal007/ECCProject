import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Users,
  Clock,
  MapPin,
  Search,
  Grid,
  List,
  Eye,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react';

import { StatusBadge } from '../components/ui/StatusBadge';
import { ClassDetailsModal } from '../components/classes/ClassDetailsModal';
import { useApp } from '../context/useApp';
import {
  formatSubjectName,
  formatGrade,
  toKhmerDigits,
  formatScheduleDays,
  formatScheduleTime
} from '../utils/formatters';

export const SubjectClassesView = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const {
    subjects = [],
    classes = [],
    setSelectedClassId
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);

  const numDisplay = (val) => (lang === 'km' ? toKhmerDigits(val) : val);

  // 1. Resolve Target Subject
  const subject = useMemo(() => {
    return subjects.find((s) => s.id === subjectId) || null;
  }, [subjects, subjectId]);

  // 2. Filter ONLY classes associated with this subject
  const subjectClasses = useMemo(() => {
    if (!subject) return [];
    return classes.filter((c) => c.subjectId === subject.id);
  }, [classes, subject]);

  // 3. Compute Subject Metrics
  const metrics = useMemo(() => {
    const total = subjectClasses.length;
    const active = subjectClasses.filter((c) => c.status === 'Active').length;
    const enrolled = subjectClasses.reduce((sum, c) => {
      const count = Array.isArray(c.enrolledStudentIds)
        ? c.enrolledStudentIds.length
        : c.enrolled || 0;
      return sum + count;
    }, 0);
    const capacityTotal = subjectClasses.reduce((sum, c) => sum + (c.capacity || 25), 0);
    const capacityRate = capacityTotal > 0 ? Math.round((enrolled / capacityTotal) * 100) : 0;

    return { total, active, enrolled, capacityTotal, capacityRate };
  }, [subjectClasses]);

  // 4. Search and Status Filtering for the Associated Classes
  const filteredClasses = useMemo(() => {
    let result = [...subjectClasses];

    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.code || '').toLowerCase().includes(q) ||
          (c.teacher || '').toLowerCase().includes(q) ||
          (c.studentLocation || c.room || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [subjectClasses, statusFilter, searchQuery]);

  const handleViewStudents = (classId) => {
    if (setSelectedClassId) setSelectedClassId(classId);
    navigate(`/admin/classes/${classId}/students`);
  };

  const handleTrackAttendance = (classId) => {
    if (setSelectedClassId) setSelectedClassId(classId);
    navigate(`/admin/attendance?classId=${classId}`);
  };

  // If subject not found
  if (!subject) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
        <AlertCircle size={44} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Subject Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
          The requested English subject with ID "{subjectId}" does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/admin/subjects')}
          className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
        >
          Back to English Subjects
        </button>
      </div>
    );
  }

  const subjectDisplayName = formatSubjectName(subject, lang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* ================= A. TOP HEADER & BREADCRUMBS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8] mb-1.5 font-medium">
            <button
              onClick={() => navigate('/admin/subjects')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>{t('subjects.page_title', 'English Subjects')}</span>
            </button>
            <span>/</span>
            <span className="text-slate-700 dark:text-[#CBD5E1] font-semibold truncate max-w-xs">
              {subjectDisplayName}
            </span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {t('subjects.classes_label', 'Classes')}
            </span>
          </div>

          {/* Title and Badges */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs">
              <BookOpen size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5 flex-wrap">
                <span>{subjectDisplayName}</span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {subject.code}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1]">
                  {subject.category || 'Core Skills'}
                </span>
                <StatusBadge status={subject.status} size="sm" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 flex items-center gap-2 flex-wrap">
                <span>{subject.description || 'Comprehensive syllabus overview.'}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  Target: {subject.grades || 'Grade 1 - 12'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/admin/subjects')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-[#29364D] text-slate-700 dark:text-[#CBD5E1] hover:text-indigo-600 font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>All Subjects</span>
          </button>
          <button
            onClick={() => navigate('/admin/classes')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers size={14} />
            <span>Manage All Classes</span>
          </button>
        </div>
      </div>

      {/* ================= B. 4 STATISTIC CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Associated Classes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] block mb-1">
            Associated Classes
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
            {numDisplay(metrics.total)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Cohorts teaching {subject.code}
          </span>
        </div>

        {/* Card 2: Active Classes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
            Active Classes
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {numDisplay(metrics.active)}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Currently running</span>
          </span>
        </div>

        {/* Card 3: Enrolled Students */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
            Enrolled Students
          </span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {numDisplay(metrics.enrolled)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {subject.code} cohorts
          </span>
        </div>

        {/* Card 4: Enrollment Capacity Utilization */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xs">
          <span className="text-xs font-semibold text-indigo-100 block mb-1">
            Capacity Utilization
          </span>
          <div className="text-2xl font-black">
            {numDisplay(metrics.capacityRate)}%
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.capacityRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= C. SEARCH, FILTER & VIEW CONTROLS ================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search class by name, code, teacher, or location..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        {/* Status Filter & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Statuses ({numDisplay(metrics.total)})</option>
              <option value="Active">Active ({numDisplay(metrics.active)})</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#29364D]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= D. CLASS LIST: ONLY ASSOCIATED CLASSES ================= */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-3">
          <Layers size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
            No Classes Found for {subject.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto">
            {searchQuery || statusFilter !== 'All'
              ? 'No classes match your current filter query. Try resetting filters.'
              : `There are currently no classes associated with ${subject.name} (${subject.code}). You can create a new class linked to this subject.`}
          </p>
          {(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const enrolledCount = Array.isArray(cls.enrolledStudentIds)
              ? cls.enrolledStudentIds.length
              : cls.enrolled || 0;
            const capacity = cls.capacity || 25;
            const capacityPercent = Math.min(100, Math.round((enrolledCount / capacity) * 100));

            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top: Name & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-bold">
                          {cls.code}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900/50">
                          {subject.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1]">
                          {formatGrade(cls.gradeLevel, lang)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-1.5 truncate">
                        {cls.name}
                      </h3>
                    </div>
                    <StatusBadge status={cls.status} size="sm" />
                  </div>

                  {/* Teacher, Schedule, Location */}
                  <div className="space-y-2 py-2.5 border-y border-slate-100 dark:border-[#29364D] text-xs text-slate-600 dark:text-[#CBD5E1]">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                        {cls.teacher || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{cls.days} • {cls.time || cls.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">{cls.studentLocation || cls.room}</span>
                    </div>
                  </div>

                  {/* Capacity Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {numDisplay(enrolledCount)} / {numDisplay(capacity)} Students
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {numDisplay(capacityPercent)}% capacity
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3.5 mt-auto border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <button
                      type="button"
                      onClick={() => handleViewStudents(cls.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#4F46E5] active:bg-[#3730A3] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <Users size={13} />
                      <span>{t('classes.view_students_btn', 'View Students')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrackAttendance(cls.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <ClipboardCheck size={13} />
                      <span>{t('attendance.track_attendance', 'Attendance')}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedClassDetails(cls)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="View Class Details"
                    aria-label="View Class Details"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs overflow-hidden w-full">
          <div className="overflow-x-auto scrollbar-thin w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[800px] lg:min-w-0">
              <thead className="bg-slate-50/80 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D] text-slate-600 dark:text-[#94A3B8] font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[130px]">Class</th>
                  <th className="py-2.5 px-2 min-w-[100px]">Subject</th>
                  <th className="py-2.5 px-2 min-w-[95px]">Teacher</th>
                  <th className="py-2.5 px-2 min-w-[110px]">Location</th>
                  <th className="py-2.5 px-2 min-w-[115px]">Schedule</th>
                  <th className="py-2.5 px-1.5 text-center w-[60px] whitespace-nowrap">Enrolled</th>
                  <th className="py-2.5 px-1.5 text-center w-[70px] whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-right min-w-[180px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#29364D] text-slate-800 dark:text-[#CBD5E1]">
                {filteredClasses.map((cls) => {
                  const enrolledCount = Array.isArray(cls.enrolledStudentIds)
                    ? cls.enrolledStudentIds.length
                    : cls.enrolled || 0;

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block leading-tight truncate max-w-[145px]" title={cls.name}>{cls.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{cls.code}</span>
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-700 dark:text-[#CBD5E1]">
                        <span className="truncate max-w-[105px] block" title={subject.name}>{subject.name}</span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-[#F8FAFC]">
                        <span className="truncate max-w-[100px] block" title={cls.teacher}>{cls.teacher || 'Unassigned'}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-[#CBD5E1]">
                        <span className="flex items-center gap-1 truncate max-w-[115px]" title={cls.studentLocation || cls.room}>
                          <MapPin size={11} className="text-[#4338CA] dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{cls.studentLocation || cls.room || "Student's Home"}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-[#CBD5E1]">
                        <div className="leading-tight">
                          <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] text-[11px] block truncate max-w-[125px]" title={formatScheduleDays(cls.days)}>{formatScheduleDays(cls.days)}</span>
                          <span className="text-slate-500 dark:text-[#94A3B8] text-[10px] block truncate max-w-[125px]" title={formatScheduleTime(cls.time || cls.schedule)}>{formatScheduleTime(cls.time || cls.schedule)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-1.5 font-bold text-slate-900 dark:text-[#F8FAFC] text-center whitespace-nowrap text-[11px]">
                        {numDisplay(enrolledCount)} / {numDisplay(cls.capacity || 25)}
                      </td>
                      <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        <StatusBadge status={cls.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleViewStudents(cls.id)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#4F46E5] active:bg-[#3730A3] text-white font-semibold text-xs transition-colors shadow-xs hover:shadow-sm cursor-pointer shrink-0"
                          >
                            <Users size={12} />
                            <span>Students</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrackAttendance(cls.id)}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
                          >
                            <ClipboardCheck size={12} />
                            <span>Track</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedClassDetails(cls)}
                            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                            title="View Class Details"
                            aria-label="View Class Details"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClassDetails && (
        <ClassDetailsModal
          isOpen={Boolean(selectedClassDetails)}
          onClose={() => setSelectedClassDetails(null)}
          classItem={selectedClassDetails}
          subject={subject}
        />
      )}
    </motion.div>
  );
};

