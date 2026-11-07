import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import {
  Search,
  Check,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { expandDays } from '../../utils/scheduleUtils';

const AssignPeriodTeachersForm = ({
  period,
  onClose
}) => {
  const { t } = useTranslation();
  const {
    teachers,
    classes,
    teacherAvailability,
    periodTeachers,
    assignTeachersToPeriod
  } = useApp();

  // Initially assigned teachers for this period
  const currentlyAssigned = useMemo(() => {
    return periodTeachers.filter((pt) => pt.periodId === period.id);
  }, [periodTeachers, period.id]);

  // Selected teacher IDs
  const [selectedTeacherIds, setSelectedTeacherIds] = useState(() => {
    return new Set(currentlyAssigned.map((pt) => pt.teacherId));
  });

  // Per-teacher assigned days mapping (teacherId -> days string)
  const [teacherDays, setTeacherDays] = useState(() => {
    const map = {};
    currentlyAssigned.forEach((pt) => {
      map[pt.teacherId] = pt.assignedDays || period.days || 'Monday – Friday';
    });
    return map;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute teacher stats (weekly scheduled hours, assigned classes count, availability match)
  const teacherStats = useMemo(() => {
    const stats = {};
    teachers.forEach((tch) => {
      // Find classes taught by this teacher
      const tchClasses = classes.filter((c) => c.teacherId === tch.id || c.teacher === tch.name);
      
      // Calculate total weekly sessions and approximate hours
      let totalSessions = 0;
      tchClasses.forEach((c) => {
        if (c.status === 'Active') {
          const days = expandDays(c.days);
          totalSessions += days.length;
        }
      });
      const approxHours = Math.round(totalSessions * 1.5); // ~1.5h per session average

      // Check availability against period days
      const availabilities = teacherAvailability.filter((a) => a.teacherId === tch.id);
      const isAvailableInPeriod = availabilities.length === 0 || availabilities.some(
        (a) => a.status === 'Available' || a.status === 'Preferred'
      );

      stats[tch.id] = {
        classesCount: tchClasses.length,
        weeklyHours: approxHours,
        isAvailableInPeriod,
        classes: tchClasses
      };
    });
    return stats;
  }, [teachers, classes, teacherAvailability]);

  // Filter teachers based on search query
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.specialization && t.specialization.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  // Toggle selection
  const handleToggleTeacher = (teacherId) => {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
        // Default days to period's days if not yet set
        if (!teacherDays[teacherId]) {
          setTeacherDays((d) => ({
            ...d,
            [teacherId]: period.days || 'Monday – Friday'
          }));
        }
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = new Set(teachers.map((t) => t.id));
    setSelectedTeacherIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedTeacherIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = Array.from(selectedTeacherIds).map((tId) => ({
        teacherId: tId,
        assignedDays: teacherDays[tId] || period.days || 'Monday – Friday'
      }));

      await assignTeachersToPeriod(period.id, payload, period.days);
      onClose();
    } catch {
      // Handled in context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
      {/* Header Info */}
      <div className="p-4 bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-[#29364D] rounded-t-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                {period.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {period.startTime} – {period.endTime}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-400" />
              <span>{period.days}</span>
              <span>•</span>
              <span>{period.description || t('schedules.period_assignment_desc', 'Assign qualified instructors to this teaching block')}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {selectedTeacherIds.size} {t('schedules.selected', 'Selected')}
            </span>
          </div>
        </div>

        {/* Search & Bulk selection bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('schedules.search_teachers_placeholder', 'Search instructors by name or specialization...')}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0F172A] text-slate-800 dark:text-[#F8FAFC] text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {t('common.select_all', 'Select All')}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {t('common.clear', 'Clear')}
          </button>
        </div>
      </div>

      {/* Teacher List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[260px] max-h-[380px]">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
            {t('schedules.no_teachers_found', 'No teachers found matching your criteria.')}
          </div>
        ) : (
          filteredTeachers.map((tch) => {
            const isSelected = selectedTeacherIds.has(tch.id);
            const stats = teacherStats[tch.id] || { classesCount: 0, weeklyHours: 0, isAvailableInPeriod: true };

            return (
              <div
                key={tch.id}
                onClick={() => handleToggleTeacher(tch.id)}
                className={`flex items-start sm:items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B]/70 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Selection Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0F172A]'
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>

                  {/* Teacher Avatar */}
                  <img
                    src={tch.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={tch.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />

                  {/* Teacher Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900 dark:text-[#F8FAFC] truncate">
                        {tch.name}
                      </span>
                      {tch.specialization && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium truncate">
                          {tch.specialization}
                        </span>
                      )}
                      {stats.isAvailableInPeriod ? (
                        <span className="text-[10px] inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 size={10} />
                          {t('schedules.available', 'Available')}
                        </span>
                      ) : (
                        <span className="text-[10px] inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle size={10} />
                          {t('schedules.availability_caution', 'Check Hours')}
                        </span>
                      )}
                    </div>

                    {/* Stats & Classes chips */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} className="text-slate-400" />
                        <span>{stats.classesCount} {t('common.classes', 'classes')}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        <span>~{stats.weeklyHours}h/wk</span>
                      </span>
                      {tch.email && (
                        <span className="hidden sm:inline text-slate-400 truncate max-w-[140px]">
                          {tch.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-teacher Days selector if selected */}
                {isSelected && (
                  <div
                    className="ml-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={teacherDays[tch.id] || period.days || 'Monday – Friday'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeacherDays((prev) => ({ ...prev, [tch.id]: val }));
                      }}
                      className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#0F172A] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={period.days}>{period.days} (Default)</option>
                      <option value="Monday - Friday">Mon – Fri</option>
                      <option value="Monday, Wednesday, Friday">Mon, Wed, Fri</option>
                      <option value="Tuesday, Thursday">Tue, Thu</option>
                      <option value="Saturday & Sunday">Sat & Sun</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#1E293B]/50 rounded-b-xl flex items-center justify-between">
        <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
          {t('schedules.assigned_teachers_notice', 'Instructors can teach multiple periods without conflict as long as their specific class hours do not overlap.')}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-500/20 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? t('common.saving', 'Saving...') : t('schedules.save_assignments', 'Save Assignments')}
          </button>
        </div>
      </div>
    </form>
  );
};

export const AssignPeriodTeachersModal = ({
  isOpen,
  onClose,
  period
}) => {
  const { t } = useTranslation();

  if (!isOpen || !period) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('schedules.assign_teachers_title', 'Assign Teachers to Period')}
      size="lg"
    >
      <AssignPeriodTeachersForm period={period} onClose={onClose} />
    </Modal>
  );
};

