import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  BookOpen,
  Plus,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  BookMarked,
  Archive,
  RotateCcw,
  Users,
  Type,
  Volume2,
  Sparkles,
  PenTool,
  Headphones,
  MessageSquare,
  GraduationCap
} from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { SubjectModal } from '../components/classes/SubjectModal';
import { useApp } from '../context/useApp';
import { 
  formatGradeRange, 
  formatSubjectName, 
  toKhmerDigits 
} from '../utils/formatters';

const getCourseIcon = (code = '', name = '') => {
  const query = `${code} ${name}`.toUpperCase();
  if (query.includes('ALP') || query.includes('ABC') || query.includes('ALPHABET')) return Type;
  if (query.includes('PHO') || query.includes('SOUND')) return Volume2;
  if (query.includes('VOC') || query.includes('WORD')) return BookMarked;
  if (query.includes('GRM') || query.includes('GRAMMAR')) return Sparkles;
  if (query.includes('RED') || query.includes('READ')) return BookOpen;
  if (query.includes('WRT') || query.includes('WRITE')) return PenTool;
  if (query.includes('LIS') || query.includes('LISTEN')) return Headphones;
  if (query.includes('SPK') || query.includes('SPEAK') || query.includes('CONVERSATION')) return MessageSquare;
  return GraduationCap;
};

export const SubjectsView = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();

  const {
    subjects = [],
    addSubject,
    updateSubject,
    archiveSubject,
    deleteSubject,
    classes = [],
    navigateToClasses
  } = useApp();

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'classes-desc', 'students-desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [viewingSubject, setViewingSubject] = useState(null);
  const [subjectToArchive, setSubjectToArchive] = useState(null);

  // Delete & Safety validation states
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [blockedDeleteSubject, setBlockedDeleteSubject] = useState(null);

  const numDisplay = (val) => (lang === 'km' ? toKhmerDigits(val) : val);

  // Helper to compute live metrics for each subject
  const getSubjectMetrics = (subjectId) => {
    const matchedClasses = classes.filter((c) => c.subjectId === subjectId);
    const activeClasses = matchedClasses.filter((c) => c.status === 'Active');
    const enrolledStudentsCount = matchedClasses.reduce((sum, c) => {
      const count = Array.isArray(c.enrolledStudentIds)
        ? c.enrolledStudentIds.length
        : c.enrolled || 0;
      return sum + count;
    }, 0);

    return {
      totalClasses: matchedClasses.length,
      activeClasses: activeClasses.length,
      enrolledStudents: enrolledStudentsCount,
      classes: matchedClasses
    };
  };

  // A. Subject Statistics
  const stats = useMemo(() => {
    const total = subjects.length;
    const active = subjects.filter((s) => s.status === 'Active').length;
    const inactive = subjects.filter((s) => s.status === 'Inactive' || s.status === 'Archived').length;

    // Active classes assigned to any subject
    const activeClasses = classes.filter((c) => c.status === 'Active' && c.subjectId);

    return { total, active, inactive, classesUsingSubjects: activeClasses.length };
  }, [subjects, classes]);

  // Filtered & Sorted Subjects
  const filteredSubjects = useMemo(() => {
    let result = [...subjects];

    // 1. Status filter
    if (statusFilter !== 'All') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // 2. Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((s) => s.category === categoryFilter);
    }

    // 3. Search: by English Name, Khmer Name, Code, or Category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.nameKhmer && s.nameKhmer.toLowerCase().includes(q)) ||
          (s.code || '').toLowerCase().includes(q) ||
          (s.category && s.category.toLowerCase().includes(q))
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      const nameA = formatSubjectName(a, lang);
      const nameB = formatSubjectName(b, lang);

      if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
      if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
      if (sortBy === 'classes-desc') {
        const countA = classes.filter((c) => c.subjectId === a.id).length;
        const countB = classes.filter((c) => c.subjectId === b.id).length;
        return countB - countA;
      }
      if (sortBy === 'students-desc') {
        const getEnrolled = (subId) =>
          classes
            .filter((c) => c.subjectId === subId)
            .reduce((sum, c) => sum + (Array.isArray(c.enrolledStudentIds) ? c.enrolledStudentIds.length : c.enrolled || 0), 0);
        return getEnrolled(b.id) - getEnrolled(a.id);
      }
      return 0;
    });

    return result;
  }, [subjects, classes, searchQuery, statusFilter, categoryFilter, sortBy, lang]);

  // Handle Save
  const handleSaveSubject = (formData) => {
    if (editingSubject?.id) {
      updateSubject(editingSubject.id, formData);
    } else {
      addSubject(formData);
    }
    setEditingSubject(null);
  };

  // Archive Confirm
  const handleArchiveConfirm = () => {
    if (subjectToArchive) {
      archiveSubject(subjectToArchive.id);
      setSubjectToArchive(null);
    }
  };

  // Attempt Delete with Safety Check
  const handleInitiateDelete = (subject) => {
    const activeClasses = classes.filter(
      (c) => c.subjectId === subject.id && c.status !== 'Archived'
    );

    if (activeClasses.length > 0) {
      // Block unsafe deletion
      setBlockedDeleteSubject({
        subject,
        activeClasses
      });
    } else {
      // Safe to delete
      setSubjectToDelete(subject);
    }
  };

  const handleConfirmDelete = () => {
    if (subjectToDelete) {
      deleteSubject(subjectToDelete.id);
      setSubjectToDelete(null);
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'All' || categoryFilter !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <PageHeader
        title={t('subjects.page_title')}
        subtitle={t('subjects.page_subtitle')}
      >
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={navigateToClasses}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('classes.tab_classes')}</span>
          </button>

          <button
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('subjects.create_btn')}</span>
          </button>
        </div>
      </PageHeader>

      {/* A. 4 Subject Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Subjects */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              {t('subjects.stat_total')}
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
              {numDisplay(stats.total)}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Curriculum catalog
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
        </div>

        {/* Card 2: Active Subjects */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 block mb-1">
              {t('subjects.stat_active')}
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight font-heading">
              {numDisplay(stats.active)}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
              <CheckCircle2 size={12} />
              <span>Available for classes</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 3: Inactive Subjects */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              {t('subjects.stat_inactive')}
            </span>
            <div className="text-2xl font-extrabold text-slate-700 tracking-tight font-heading">
              {numDisplay(stats.inactive)}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Draft / Archived
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <BookMarked size={22} />
          </div>
        </div>

        {/* Card 4: Classes Using Subjects */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-700 block mb-1">
              {t('subjects.stat_classes_using')}
            </span>
            <div className="text-2xl font-extrabold text-blue-600 tracking-tight font-heading">
              {numDisplay(stats.classesUsingSubjects)}
            </div>
            <span className="text-[11px] font-semibold text-blue-600 mt-1 block">
              Active student cohorts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* B. Subject Management Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search by English name, Khmer name, or code */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('subjects.search_placeholder')}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              title="Filter by Category"
            >
              <option value="All">{t('common.all_categories', 'All Categories')}</option>
              <option value="Foundational English">Foundational English</option>
              <option value="Core Skills">Core Skills</option>
              <option value="Applied Communication">Applied Communication</option>
              <option value="Exam Preparation">Exam Preparation</option>
              <option value="Electives">Electives</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">{t('common.all')}</option>
              <option value="Active">{t('common.active')}</option>
              <option value="Inactive">{t('common.inactive')}</option>
              <option value="Archived">{t('common.archived', 'Archived')}</option>
            </select>

            {/* Sort Control */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="name-asc">Subject Name (A → Z)</option>
              <option value="name-desc">Subject Name (Z → A)</option>
              <option value="classes-desc">Number of Classes (Most)</option>
              <option value="students-desc">Enrolled Students (Most)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Cards"
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

        {/* Results Counter & Active Filter Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span>{t('subjects.showing_count', { count: numDisplay(filteredSubjects.length), total: numDisplay(subjects.length) })}</span>
            </span>
            <button
              onClick={handleResetFilters}
              className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>{t('common.reset_filters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* PART 7: REDESIGNED SUBJECT CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full py-14 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">
                {t('subjects.no_subjects_found')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('subjects.adjust_search_prompt')}
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
            filteredSubjects.map((subject) => {
              const metrics = getSubjectMetrics(subject.id);
              const displayName = formatSubjectName(subject, lang);
              const CourseIcon = getCourseIcon(subject.code, subject.name);

              return (
                <div
                  key={subject.id}
                  className="group p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md hover:border-indigo-300/80 dark:hover:border-indigo-800/60 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* 1. Header: Course Icon + Name & Badges + Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          <CourseIcon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-bold text-base text-slate-900 dark:text-[#F8FAFC] leading-snug truncate group-hover:text-[#4338CA] dark:group-hover:text-indigo-400 transition-colors"
                            title={displayName}
                          >
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40">
                              {subject.code}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 truncate max-w-[130px]">
                              {subject.category || 'Core Skills'}
                            </span>
                            {subject.grades && (
                              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                • {subject.grades}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <StatusBadge status={subject.status} size="sm" />
                      </div>
                    </div>

                    {/* 2. Description (Max 2 lines) */}
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2 leading-relaxed mt-3">
                      {subject.description || 'Comprehensive curriculum designed for Cambodian learners to build natural English fluency.'}
                    </p>

                    {/* Skills Tags (Cleanly styled) */}
                    {subject.skills && subject.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-2.5">
                        {subject.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {subject.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                            +{subject.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Attractive Compact Statistics + 4. Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#29364D]">
                    {/* 2 Compact Statistics Cards */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Total Classes */}
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Layers size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700/80 dark:text-indigo-400/80 block leading-tight truncate">
                            {t('subjects.classes_label', 'Classes')}
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-[#F8FAFC] leading-none block mt-0.5">
                            {numDisplay(metrics.totalClasses)}
                          </span>
                        </div>
                      </div>

                      {/* Enrolled Students */}
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Users size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700/80 dark:text-indigo-400/80 block leading-tight truncate">
                            {t('subjects.enrolled_label', 'Students')}
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-[#F8FAFC] leading-none block mt-0.5">
                            {numDisplay(metrics.enrolledStudents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions: Primary + Secondary */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Primary Action: View Classes / Manage Course */}
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/subjects/${subject.id}/classes`)}
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#4338CA] hover:bg-[#4F46E5] active:bg-[#3730A3] text-white font-semibold text-xs transition-colors shadow-xs hover:shadow-sm cursor-pointer"
                        title={t('subjects.view_classes_btn', 'View Classes / Manage Course')}
                      >
                        <span>{t('subjects.manage_course', 'Manage Course')}</span>
                        <ArrowRight size={13} className="shrink-0" />
                      </button>

                      {/* Secondary Actions Group */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setViewingSubject(subject)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center"
                          title={t('subjects.view_subject_details', 'View Details')}
                          aria-label="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubject(subject);
                            setIsSubjectModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center"
                          title={t('common.edit', 'Edit Course')}
                          aria-label="Edit Course"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Archive */}
                        <button
                          type="button"
                          onClick={() => setSubjectToArchive(subject)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center"
                          title={t('subjects.archive_subject', 'Archive Course')}
                          aria-label="Archive Course"
                        >
                          <Archive size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleInitiateDelete(subject)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center"
                          title={t('common.delete', 'Delete Course')}
                          aria-label="Delete Course"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View Mode */}
      {viewMode === 'table' && (
        <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">{t('subjects.subject_name')}</th>
                  <th className="py-3 px-3">{t('subjects.subject_code')}</th>
                  <th className="py-3 px-3">{t('subjects.category')}</th>
                  <th className="py-3 px-3">{t('subjects.classes_count')}</th>
                  <th className="py-3 px-3">{t('subjects.enrolled_count')}</th>
                  <th className="py-3 px-3">{t('common.status')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {t('subjects.no_subjects_found')}
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((s) => {
                    const metrics = getSubjectMetrics(s.id);
                    const displayName = formatSubjectName(s, lang);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {displayName}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">
                          {s.code}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {s.category || 'Core Skills'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {numDisplay(metrics.totalClasses)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-indigo-600">
                          {numDisplay(metrics.enrolledStudents)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/admin/subjects/${s.id}/classes`)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                              title="View Classes"
                            >
                              <Layers size={14} />
                            </button>
                            <button
                              onClick={() => setViewingSubject(s)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                              title={t('subjects.view_subject_details')}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSubject(s);
                                setIsSubjectModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                              title={t('common.edit')}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setSubjectToArchive(s)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              title={t('subjects.archive_subject')}
                            >
                              <Archive size={14} />
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(s)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title={t('common.delete')}
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* D. Subject Create / Edit Modal */}
      <SubjectModal
        key={editingSubject?.id || (isSubjectModalOpen ? 'open-new' : 'closed')}
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        onSave={handleSaveSubject}
        subject={editingSubject}
        subjects={subjects}
      />

      {/* Subject Details Modal */}
      {viewingSubject && (
        <Modal
          isOpen={Boolean(viewingSubject)}
          onClose={() => setViewingSubject(null)}
          title={formatSubjectName(viewingSubject, lang)}
          description={`${viewingSubject.code} • ${viewingSubject.category || 'Core Skills'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  {t('subjects.grade_eligibility')}
                </span>
                <span className="font-semibold text-slate-800">
                  {formatGradeRange(viewingSubject.grades, lang)}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  {t('common.status')}
                </span>
                <StatusBadge status={viewingSubject.status} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                {t('classes.description')}
              </span>
              <p className="text-slate-700 leading-relaxed text-xs">
                {viewingSubject.description || 'Comprehensive syllabus overview.'}
              </p>
            </div>

            {viewingSubject.skills && viewingSubject.skills.length > 0 && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-2">
                  {t('classes.targeted_skills')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingSubject.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Classes using this subject */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  {t('subjects.classes_label')} ({getSubjectMetrics(viewingSubject.id).totalClasses})
                </span>
                {getSubjectMetrics(viewingSubject.id).totalClasses > 0 && (
                  <button
                    onClick={() => {
                      const id = viewingSubject.id;
                      setViewingSubject(null);
                      navigate(`/admin/subjects/${id}/classes`);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Classes</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {getSubjectMetrics(viewingSubject.id).classes.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">
                    {t('classes.no_classes_match')}
                  </p>
                ) : (
                  getSubjectMetrics(viewingSubject.id).classes.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({c.teacher})</span>
                        <span className="text-[10px] text-indigo-600 ml-2 font-semibold">
                          {c.studentLocation || c.room}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {c.code}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const id = viewingSubject.id;
                  setViewingSubject(null);
                  navigate(`/admin/subjects/${id}/classes`);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={13} />
                <span>{t('subjects.view_classes_btn')} ({getSubjectMetrics(viewingSubject.id).totalClasses})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSubject(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Subject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(subjectToArchive)}
        onClose={() => setSubjectToArchive(null)}
        onConfirm={handleArchiveConfirm}
        title={t('subjects.archive_subject_title')}
        description={
          subjectToArchive
            ? t('subjects.archive_subject_desc', { 
                name: formatSubjectName(subjectToArchive, lang), 
                code: subjectToArchive.code 
              })
            : ''
        }
        confirmLabel={t('subjects.archive_subject')}
        confirmVariant="primary"
      />

      {/* Safety Dialog: Blocks Deletion of Subject Used by Active Classes */}
      {blockedDeleteSubject && (
        <Modal
          isOpen={Boolean(blockedDeleteSubject)}
          onClose={() => setBlockedDeleteSubject(null)}
          title={t('subjects.delete_blocked_title')}
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {t(
                    'subjects.delete_blocked_msg',
                    { count: blockedDeleteSubject.activeClasses.length }
                  )}
                </p>
                <p className="text-amber-800 mt-1 leading-relaxed">
                  {t('subjects.delete_blocked_instruction')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 max-h-40 overflow-y-auto">
              {blockedDeleteSubject.activeClasses.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{c.code}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const subjectId = blockedDeleteSubject.subject?.id;
                  setBlockedDeleteSubject(null);
                  if (subjectId) {
                    navigate(`/admin/subjects/${subjectId}/classes`);
                  } else {
                    navigateToClasses();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Layers size={13} />
                <span>View Subject Classes</span>
              </button>
              <button
                onClick={() => setBlockedDeleteSubject(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Safe Delete Confirmation Dialog (for unused subjects) */}
      <ConfirmDialog
        isOpen={Boolean(subjectToDelete)}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('subjects.confirm_delete_title')}
        description={
          subjectToDelete
            ? t('subjects.confirm_delete_desc', { 
                name: formatSubjectName(subjectToDelete, lang), 
                code: subjectToDelete.code 
              })
            : ''
        }
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
      />
    </motion.div>
  );
};
