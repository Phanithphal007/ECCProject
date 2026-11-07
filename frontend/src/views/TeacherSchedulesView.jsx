import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  Grid,
  ShieldAlert,
  Settings2,
  Layers,
  Edit2,
  Trash2,
  UserPlus,
  BookOpen,
  LayoutGrid
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatisticCard } from '../components/ui/StatisticCard';
import { WeeklyCalendarView } from '../components/schedules/WeeklyCalendarView';
import { DailyCalendarView } from '../components/schedules/DailyCalendarView';
import { TeacherMatrixView } from '../components/schedules/TeacherMatrixView';
import { PeriodTimetableView } from '../components/schedules/PeriodTimetableView';
import { TeacherAvailabilityModal } from '../components/schedules/TeacherAvailabilityModal';
import { TeachingScheduleModal } from '../components/schedules/TeachingScheduleModal';
import { TeacherScheduleDetailModal } from '../components/schedules/TeacherScheduleDetailModal';
import { SessionDetailModal } from '../components/schedules/SessionDetailModal';
import { PeriodModal } from '../components/schedules/PeriodModal';
import { AssignPeriodTeachersModal } from '../components/schedules/AssignPeriodTeachersModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { WEEKDAYS, expandDays, isClassActiveInPeriod, getPeriodStats, findScheduleConflicts } from '../utils/scheduleUtils';
import { formatScheduleDays, formatScheduleTime } from '../utils/formatters';
import { useApp } from '../context/useApp';

export const TeacherSchedulesView = () => {
  const { t } = useTranslation();
  const {
    teachers,
    classes,
    teacherAvailability,
    teacherSchedules,
    teachingPeriods = [],
    periodTeachers = [],
    deleteTeachingPeriod,
    removeTeacherFromPeriod,
    scheduleFilterTeacherId,
    setScheduleFilterTeacherId,
    addToast
  } = useApp();

  // Main Page Tabs: 'periods' (DEFAULT) or 'timetable'
  const [activeTab, setActiveTab] = useState('periods');

  // Timetable internal view mode: 'period' (default for timetable), 'weekly', 'daily', 'teacher'
  const [timetableMode, setTimetableMode] = useState('period');

  // Filter toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('ALL');

  // Periods Tab Search and Status filter
  const [periodSearchQuery, setPeriodSearchQuery] = useState('');
  const [periodStatusFilter, setPeriodStatusFilter] = useState('ALL');

  // Modal states for Teaching Periods
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPeriodForAssign, setSelectedPeriodForAssign] = useState(null);

  const [periodToDelete, setPeriodToDelete] = useState(null);

  // Modal states for Schedules / Availability
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [availabilityTeacherId, setAvailabilityTeacherId] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleTeacherId, setScheduleTeacherId] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTeacherId, setDetailTeacherId] = useState(null);

  // Session detail modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);

  // System-wide conflict evaluation
  const activeConflicts = useMemo(() => {
    return findScheduleConflicts({
      classes,
      teacherSchedules,
      teacherAvailability,
      teachers
    });
  }, [classes, teacherSchedules, teacherAvailability, teachers]);

  // Real database-backed statistics for Dashboard
  const totalPeriodsCount = teachingPeriods.length;

  // Distinct count of assigned teachers in teaching periods
  const assignedTeachersCount = useMemo(() => {
    const set = new Set(periodTeachers.map((pt) => pt.teacherId));
    return set.size;
  }, [periodTeachers]);

  // Available teachers (those with active configured availability or active status)
  const availableTeachersCount = useMemo(() => {
    const availableSlotTeacherIds = new Set(
      teacherAvailability
        .filter((a) => a.status === 'Available' || a.status === 'Preferred')
        .map((a) => a.teacherId)
    );
    return availableSlotTeacherIds.size || teachers.filter((t) => t.status === 'Active' || !t.status).length;
  }, [teacherAvailability, teachers]);

  const conflictsCount = activeConflicts.length;

  // Filtered Periods for Periods Tab
  const filteredTeachingPeriods = useMemo(() => {
    return teachingPeriods.filter((period) => {
      if (periodStatusFilter !== 'ALL' && period.status !== periodStatusFilter) {
        return false;
      }
      if (periodSearchQuery.trim()) {
        const q = periodSearchQuery.toLowerCase();
        const matchName = period.name?.toLowerCase().includes(q);
        const matchDays = period.days?.toLowerCase().includes(q);
        const matchDesc = period.description?.toLowerCase().includes(q);
        if (!matchName && !matchDays && !matchDesc) return false;
      }
      return true;
    });
  }, [teachingPeriods, periodStatusFilter, periodSearchQuery]);

  // Classes count and assigned teachers per period using strict period rules
  const periodMeta = useMemo(() => {
    const meta = {};
    teachingPeriods.forEach((period) => {
      meta[period.id] = getPeriodStats(
        period,
        classes,
        teacherSchedules,
        teachers,
        periodTeachers
      );
    });
    return meta;
  }, [teachingPeriods, classes, teacherSchedules, teachers, periodTeachers]);

  // Filtered classes matching toolbar filters for Timetable Tab
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (cls.status === 'Archived') return false;

      // Teacher filter
      if (scheduleFilterTeacherId !== 'ALL') {
        if (cls.teacherId !== scheduleFilterTeacherId && cls.teacher !== scheduleFilterTeacherId) {
          return false;
        }
      }

      // Class filter
      if (selectedClassId !== 'ALL' && cls.id !== selectedClassId) {
        return false;
      }

      // Day of Week filter
      if (selectedDay !== 'ALL') {
        const classDays = expandDays(cls.days);
        if (!classDays.includes(selectedDay)) {
          return false;
        }
      }

      // Schedule Status filter
      if (selectedStatus !== 'ALL' && cls.status !== selectedStatus) {
        return false;
      }

      // Period filter (strictly linked only, never arbitrary time overlap)
      if (selectedPeriodFilter !== 'ALL') {
        const periodObj = teachingPeriods.find((p) => p.id === selectedPeriodFilter);
        if (periodObj && !isClassActiveInPeriod(cls, periodObj, teacherSchedules, teachers)) {
          return false;
        }
      }

      // Search query (teacher, class, subject)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cls.name?.toLowerCase().includes(q);
        const matchCode = cls.code?.toLowerCase().includes(q);
        const matchTch = cls.teacher?.toLowerCase().includes(q);
        const matchSub = cls.subjectName?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTch && !matchSub) return false;
      }

      return true;
    });
  }, [classes, scheduleFilterTeacherId, selectedClassId, selectedDay, selectedStatus, selectedPeriodFilter, searchQuery, teachingPeriods, teacherSchedules, teachers]);

  // Modal Open Handlers
  const handleOpenDetailModal = (teacherId) => {
    setDetailTeacherId(teacherId);
    setIsDetailModalOpen(true);
  };

  const handleOpenAvailabilityModal = (teacherId = null) => {
    setAvailabilityTeacherId(teacherId);
    setIsAvailabilityOpen(true);
  };

  const handleOpenScheduleModal = (schedule = null, teacherId = null) => {
    setEditingSchedule(schedule);
    setScheduleTeacherId(teacherId);
    setIsScheduleModalOpen(true);
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setIsSessionDetailOpen(true);
  };

  const handleAssignSlot = (day) => {
    setSelectedDay(day);
    handleOpenScheduleModal(null, null);
  };

  const handleOpenPeriodModal = (period = null) => {
    setEditingPeriod(period);
    setIsPeriodModalOpen(true);
  };

  const handleOpenAssignTeachersModal = (period) => {
    setSelectedPeriodForAssign(period);
    setIsAssignModalOpen(true);
  };

  const handleDeletePeriodClick = (period) => {
    const meta = periodMeta[period.id];
    if (meta && meta.activeClasses.length > 0) {
      addToast({
        type: 'error',
        title: t('schedules.cannot_delete_period', 'Cannot Delete Period'),
        message: t(
          'schedules.period_has_active_classes',
          'This period cannot be deleted because it has active scheduled classes. Please reassign or archive those classes first.'
        )
      });
      return;
    }
    setPeriodToDelete(period);
  };

  const handleConfirmDeletePeriod = async () => {
    if (!periodToDelete) return;
    try {
      await deleteTeachingPeriod(periodToDelete.id);
    } catch {
      // Offline fallback
    } finally {
      setPeriodToDelete(null);
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
        title={t('schedules.title', 'Teacher Schedules')}
        subtitle={t('schedules.subtitle', 'Manage teaching periods, teacher availability, and class timetables.')}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAvailabilityModal(null)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#29364D] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings2 size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.configure_availability', 'Configure Availability')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPeriodModal(null)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('schedules.create_period', 'Create Period')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenScheduleModal(null, null)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('schedules.assign_teaching_schedule', 'Assign Schedule')}</span>
          </button>
        </div>
      </PageHeader>

      {/* PART 1: Top 4 Real-time Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatisticCard
          icon={Layers}
          title={t('schedules.stat_total_periods', 'Total Periods')}
          value={totalPeriodsCount}
          subtitle={t('schedules.stat_periods_sub', 'Configured teaching blocks')}
          color="indigo"
        />
        <StatisticCard
          icon={Users}
          title={t('schedules.stat_assigned_teachers', 'Assigned Teachers')}
          value={assignedTeachersCount}
          subtitle={t('schedules.stat_assigned_teachers_sub', 'Educators assigned to periods')}
          color="blue"
        />
        <StatisticCard
          icon={Clock}
          title={t('schedules.stat_available_teachers', 'Available Teachers')}
          value={availableTeachersCount}
          subtitle={t('schedules.stat_available_teachers_sub', 'Instructors with open hours')}
          color="emerald"
        />
        <StatisticCard
          icon={AlertTriangle}
          title={t('schedules.stat_schedule_conflicts', 'Schedule Conflicts')}
          value={conflictsCount}
          subtitle={
            conflictsCount > 0
              ? t('schedules.stat_conflicts_need_attention', 'Issues requiring resolution')
              : t('schedules.stat_no_conflicts', 'Zero timetable conflicts')
          }
          color={conflictsCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Active Conflict Banner if conflicts exist */}
      {activeConflicts.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-xs flex items-center gap-2">
                  <span>{t('schedules.active_conflicts_banner_title', 'Action Required: Schedule Conflicts Detected')}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100">
                    {activeConflicts.length}
                  </span>
                </h4>
                <div className="mt-2 space-y-2 text-[11px] text-rose-800 dark:text-rose-300">
                  {activeConflicts.slice(0, 3).map((c, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-rose-200/80 dark:border-rose-900/50 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 uppercase tracking-wider">
                          {c.conflictTypeLabel || c.conflictType}
                        </span>
                        <span className="font-bold text-rose-950 dark:text-rose-100">
                          {c.conflictingTeacherName || c.teacherName}
                        </span>
                        {c.conflictingClassName && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {c.className} ↔ {c.conflictingClassName}
                            </span>
                          </>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-rose-700 dark:text-rose-300">
                          {c.conflictingDay}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] opacity-90">
                        {c.existingTime && (
                          <span><strong>{t('schedules.existing_time', 'Existing')}:</strong> {c.existingTime}</span>
                        )}
                        {c.requestedTime && (
                          <span><strong>{t('schedules.requested_time', 'Requested')}:</strong> {c.requestedTime}</span>
                        )}
                      </div>
                      <p className="text-[11px] font-normal leading-relaxed">{c.message}</p>
                    </div>
                  ))}
                  {activeConflicts.length > 3 && (
                    <p className="text-[10px] italic pt-0.5">
                      +{activeConflicts.length - 3} {t('schedules.more_conflicts', 'more timetable conflicts')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeConflicts[0]?.teacherId) {
                  handleOpenDetailModal(activeConflicts[0].teacherId);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shrink-0 transition-colors cursor-pointer"
            >
              {t('schedules.resolve_conflict', 'Resolve Conflict')}
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Switcher: Teaching Periods (DEFAULT) vs Weekly Timetable */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#29364D] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
            activeTab === 'periods'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers size={15} />
          <span>{t('schedules.tab_teaching_periods', 'Teaching Periods')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {teachingPeriods.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timetable')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
            activeTab === 'timetable'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CalendarDays size={15} />
          <span>{t('schedules.tab_weekly_timetable', 'Weekly Timetable')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {classes.filter((c) => c.status === 'Active').length}
          </span>
        </button>
      </div>

      {/* TAB 1: TEACHING PERIODS (DEFAULT VIEW) */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          {/* Action Toolbar for Periods */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={periodSearchQuery}
                  onChange={(e) => setPeriodSearchQuery(e.target.value)}
                  placeholder={t('schedules.search_periods_placeholder', 'Search periods by name, days, or description...')}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <select
                value={periodStatusFilter}
                onChange={(e) => setPeriodStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium"
              >
                <option value="ALL">{t('schedules.all_statuses', 'All Statuses')}</option>
                <option value="Active">{t('common.active', 'Active')}</option>
                <option value="Inactive">{t('common.inactive', 'Inactive')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPeriodModal(null)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{t('schedules.create_period', 'Create Period')}</span>
              </button>
            </div>
          </div>

          {/* Period Cards Grid */}
          {filteredTeachingPeriods.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] text-slate-500">
              <Layers size={36} className="mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {t('schedules.no_periods_found', 'No teaching periods found')}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {t('schedules.create_first_period_hint', 'Create your first teaching period to structure your classes and assign instructors.')}
              </p>
              <button
                type="button"
                onClick={() => handleOpenPeriodModal(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>{t('schedules.create_period', 'Create Period')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {filteredTeachingPeriods.map((period) => {
                const meta = periodMeta[period.id] || { assignedTeachers: [], activeClasses: [], durationStr: '' };
                const assignedTeachers = meta.assignedTeachers;
                const activeClasses = meta.activeClasses;

                return (
                  <div
                    key={period.id}
                    className="rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#151F32] shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden"
                  >
                    {/* Period Card Top Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-[#29364D]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                              {period.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                period.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {period.status || 'Active'}
                            </span>
                          </div>
                          {period.description && (
                            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                              {period.description}
                            </p>
                          )}
                        </div>

                        {/* Timing badge */}
                        <div className="text-right shrink-0">
                          <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                            <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
                            <span>{formatScheduleTime(period.startTime, period.endTime)}</span>
                          </div>
                          {meta.durationStr && (
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 inline-block">
                              ({meta.durationStr})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Days of Week */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Calendar size={13} className="text-slate-400" />
                        <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
                          {t('schedules.teaching_days', 'Teaching Days')}:
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-medium">
                          {formatScheduleDays(period.days)}
                        </span>
                      </div>
                    </div>

                    {/* Period Card Middle: Assigned Teachers & Scheduled Classes */}
                    <div className="p-4 space-y-3.5 flex-1">
                      {/* Assigned Teachers Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                            <Users size={14} className="text-indigo-500" />
                            <span>{t('schedules.assigned_teachers', 'Assigned Teachers')}</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                              {assignedTeachers.length}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenAssignTeachersModal(period)}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus size={13} />
                            <span>{t('schedules.assign_teachers', 'Assign Teachers')}</span>
                          </button>
                        </div>

                        {assignedTeachers.length === 0 ? (
                          <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-[#29364D] text-center text-xs text-slate-400">
                            {t('schedules.no_teachers_assigned', 'No instructors assigned yet.')}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedTeachers.map((tch) => (
                              <div
                                key={tch.id}
                                className="group relative flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs"
                              >
                                <img
                                  src={tch.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                                  alt={tch.name}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                                <span className="font-medium text-[11px] truncate max-w-[120px]">
                                  {tch.name}
                                </span>
                                <button
                                  type="button"
                                  title={t('common.remove', 'Remove')}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await removeTeacherFromPeriod(period.id, tch.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-500 opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Scheduled Classes Section */}
                      <div className="pt-2 border-t border-slate-100 dark:border-[#29364D]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                            <BookOpen size={14} className="text-emerald-500" />
                            <span>{t('schedules.scheduled_classes', 'Scheduled Classes')}</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                            {activeClasses.length}
                          </span>
                        </div>

                        {activeClasses.length === 0 ? (
                          <div className="py-2 space-y-1.5">
                            <p className="text-[11px] text-slate-400 italic">
                              {t('schedules.no_classes_assigned_to_period', 'No classes assigned to this period yet.')}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal({ periodId: period.id }, null)}
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>{t('schedules.assign_teacher_and_schedule', 'Assign Teacher & Schedule')}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              {activeClasses.slice(0, 3).map((cls) => (
                                <span
                                  key={cls.id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#29364D]"
                                >
                                  {cls.name}
                                </span>
                              ))}
                              {activeClasses.length > 3 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{activeClasses.length - 3} {t('common.more', 'more')}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {meta.sessionsCount} {t('schedules.weekly_sessions', 'weekly sessions')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Period Card Actions Footer */}
                    <div className="p-3 bg-slate-50/70 dark:bg-[#1E293B]/70 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignTeachersModal(period)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserPlus size={13} />
                        <span>{t('schedules.assign_teachers', 'Assign Teachers')}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPeriodModal(period)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-white dark:hover:bg-[#151F32] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>{t('common.edit', 'Edit')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePeriodClick(period)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>{t('common.delete', 'Delete')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Timetable Filter and View Switcher Toolbar */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs space-y-3">
            {/* Top Toolbar: Search & Sub-view Switcher */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('schedules.search_placeholder', 'Search instructor, class code, or subject...')}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Sub-view switcher: Period View (default), Weekly View, Daily View, Teacher View */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1E293B] rounded-xl self-start md:self-center shrink-0 overflow-x-auto max-w-full pb-1 sm:pb-1">
                <button
                  type="button"
                  onClick={() => setTimetableMode('period')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    timetableMode === 'period'
                      ? 'bg-white dark:bg-[#151F32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid size={15} />
                  <span>{t('schedules.view_period', 'Period View')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimetableMode('weekly')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    timetableMode === 'weekly'
                      ? 'bg-white dark:bg-[#151F32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700'
                  }`}
                >
                  <CalendarDays size={15} />
                  <span>{t('schedules.view_weekly', 'Weekly View')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimetableMode('daily')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    timetableMode === 'daily'
                      ? 'bg-white dark:bg-[#151F32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700'
                  }`}
                >
                  <Calendar size={15} />
                  <span>{t('schedules.view_daily', 'Daily View')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimetableMode('teacher')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    timetableMode === 'teacher'
                      ? 'bg-white dark:bg-[#151F32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700'
                  }`}
                >
                  <Grid size={15} />
                  <span>{t('schedules.view_teacher', 'Teacher View')}</span>
                </button>
              </div>
            </div>

            {/* Timetable Filters Row: Teacher, Class, Day, Period, Status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-[#29364D] text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
                  {t('common.teacher', 'Teacher')}
                </label>
                <select
                  value={scheduleFilterTeacherId}
                  onChange={(e) => setScheduleFilterTeacherId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium"
                >
                  <option value="ALL">{t('schedules.all_teachers', 'All Teachers')}</option>
                  {teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
                  {t('classes.title', 'English Class')}
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium"
                >
                  <option value="ALL">{t('schedules.all_classes', 'All Classes')}</option>
                  {classes.filter((c) => c.status !== 'Archived').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
                  {t('schedules.day_of_week', 'Day of Week')}
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium"
                >
                  <option value="ALL">{t('schedules.all_days', 'All Days')}</option>
                  {WEEKDAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
                  {t('schedules.period', 'Teaching Period')}
                </label>
                <select
                  value={selectedPeriodFilter}
                  onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium"
                >
                  <option value="ALL">{t('schedules.all_periods', 'All Periods')}</option>
                  {teachingPeriods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.startTime} – {p.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
                  {t('schedules.status', 'Schedule Status')}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium"
                >
                  <option value="ALL">{t('schedules.all_statuses', 'All Statuses')}</option>
                  <option value="Active">{t('common.active', 'Active')}</option>
                  <option value="Scheduled">{t('schedules.status_scheduled', 'Scheduled')}</option>
                  <option value="Completed">{t('common.completed', 'Completed')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timetable Sub-views */}
          {timetableMode === 'period' && (
            <PeriodTimetableView
              periods={teachingPeriods}
              classes={filteredClasses}
              teachers={teachers}
              teacherSchedules={teacherSchedules}
              periodTeachers={periodTeachers}
              filterTeacherId={scheduleFilterTeacherId}
              selectedClassId={selectedClassId}
              selectedDay={selectedDay}
              selectedPeriodId={selectedPeriodFilter}
              onSelectSession={handleSelectSession}
              onAssignClass={(period) => handleOpenScheduleModal(period ? { periodId: period.id } : null, null)}
              conflicts={activeConflicts}
            />
          )}

          {timetableMode === 'weekly' && (
            <WeeklyCalendarView
              classes={filteredClasses}
              teachers={teachers}
              filterTeacherId={scheduleFilterTeacherId}
              onSelectSession={handleSelectSession}
              conflicts={activeConflicts}
            />
          )}

          {timetableMode === 'daily' && (
            <DailyCalendarView
              classes={filteredClasses}
              teachers={teachers}
              teacherAvailability={teacherAvailability}
              filterTeacherId={scheduleFilterTeacherId}
              onSelectSession={handleSelectSession}
              onAssignSlot={handleAssignSlot}
              conflicts={activeConflicts}
            />
          )}

          {timetableMode === 'teacher' && (
            <TeacherMatrixView
              teachers={teachers}
              classes={classes}
              teacherAvailability={teacherAvailability}
              selectedTeacherId={scheduleFilterTeacherId !== 'ALL' ? scheduleFilterTeacherId : teachers[0]?.id}
              onSelectSession={handleSelectSession}
              onOpenAvailability={handleOpenAvailabilityModal}
              onOpenSchedule={handleOpenScheduleModal}
              conflicts={activeConflicts}
            />
          )}
        </div>
      )}

      {/* MODALS */}

      {/* 1. Period Create/Edit Modal */}
      <PeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        period={editingPeriod}
      />

      {/* 2. Assign Teachers to Period Modal */}
      <AssignPeriodTeachersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        period={selectedPeriodForAssign}
      />

      {/* 3. Confirm Delete Period Dialog */}
      <ConfirmDialog
        isOpen={Boolean(periodToDelete)}
        onClose={() => setPeriodToDelete(null)}
        onConfirm={handleConfirmDeletePeriod}
        title={t('schedules.delete_period_title', 'Delete Teaching Period')}
        description={t(
          'schedules.delete_period_desc',
          'Are you sure you want to delete this teaching period? This will remove teacher assignments for this period.'
        )}
        confirmLabel={t('common.delete', 'Delete')}
        confirmVariant="danger"
      />

      {/* 4. Session Detail Modal */}
      <SessionDetailModal
        isOpen={isSessionDetailOpen}
        onClose={() => setIsSessionDetailOpen(false)}
        session={selectedSession}
        onEdit={(session) => {
          setIsSessionDetailOpen(false);
          handleOpenScheduleModal(session, session.teacherId);
        }}
        isConflicted={Boolean(
          selectedSession &&
            activeConflicts.some((c) => c.classId === selectedSession.id || c.conflictingClassId === selectedSession.id)
        )}
        conflictReason={
          selectedSession
            ? activeConflicts.find(
                (c) => c.classId === selectedSession.id || c.conflictingClassId === selectedSession.id
              )?.message
            : null
        }
        conflictData={
          selectedSession
            ? activeConflicts.find(
                (c) => c.classId === selectedSession.id || c.conflictingClassId === selectedSession.id
              )
            : null
        }
      />

      {/* 5. Create / Edit Schedule Modal */}
      <TeachingScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        schedule={editingSchedule}
        initialTeacherId={scheduleTeacherId}
      />

      {/* 6. Teacher Availability Modal */}
      <TeacherAvailabilityModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        teacherId={availabilityTeacherId}
      />

      {/* 7. Teacher Profile Detail Modal */}
      <TeacherScheduleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        teacherId={detailTeacherId}
        onOpenAvailabilityModal={handleOpenAvailabilityModal}
        onOpenScheduleModal={handleOpenScheduleModal}
      />
    </motion.div>
  );
};
