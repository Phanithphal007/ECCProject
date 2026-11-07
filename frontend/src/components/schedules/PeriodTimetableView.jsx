import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Calendar,
  MapPin,
  Users,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { timeToMinutes, expandDays, WEEKDAYS, isClassActiveInPeriod } from '../../utils/scheduleUtils';
import { formatScheduleTime, formatScheduleDays } from '../../utils/formatters';

export const PeriodTimetableView = ({
  periods = [],
  classes = [],
  teachers = [],
  teacherSchedules = [],
  periodTeachers = [],
  filterTeacherId = 'ALL',
  selectedClassId = 'ALL',
  selectedDay = 'ALL',
  selectedPeriodId = 'ALL',
  onSelectSession = () => {},
  onAssignClass = null,
  conflicts = []
}) => {
  const { t } = useTranslation();

  // Set of class IDs with conflicts
  const conflictClassIds = useMemo(() => {
    const set = new Set();
    conflicts.forEach((c) => {
      if (c.classId) set.add(c.classId);
      if (c.conflictingClassId) set.add(c.conflictingClassId);
    });
    return set;
  }, [conflicts]);

  // Teachers lookup map
  const teacherMap = useMemo(() => {
    const map = {};
    teachers.forEach((tch) => {
      map[tch.id] = tch;
      map[tch.name] = tch;
    });
    return map;
  }, [teachers]);

  // Group classes strictly by teaching period
  const periodData = useMemo(() => {
    return periods
      .filter((p) => selectedPeriodId === 'ALL' || p.id === selectedPeriodId)
      .map((period) => {
        // Active classes strictly qualifying for this period
        const periodClasses = classes.filter((cls) => {
          // Strict validation: must have valid teacher, active status, and explicit period link
          if (!isClassActiveInPeriod(cls, period, teacherSchedules, teachers)) {
            return false;
          }

          // Toolbar Teacher filter
          if (filterTeacherId !== 'ALL' && cls.teacherId !== filterTeacherId && cls.teacher !== filterTeacherId) {
            return false;
          }

          // Toolbar Class filter
          if (selectedClassId !== 'ALL' && cls.id !== selectedClassId) {
            return false;
          }

          // Toolbar Day filter
          if (selectedDay !== 'ALL') {
            const days = expandDays(cls.days);
            if (!days.includes(selectedDay)) return false;
          }

          return true;
        });

        // Instructors: distinct active teachers assigned via period_teachers OR teaching a class in this period
        const distinctTeacherIds = new Set();
        periodTeachers.forEach((pt) => {
          if (pt.periodId === period.id && pt.status === 'Active' && pt.teacherId) {
            distinctTeacherIds.add(pt.teacherId);
          }
        });
        periodClasses.forEach((cls) => {
          const tId = (cls.teacherId || cls.teacher_id || '').trim();
          if (tId) distinctTeacherIds.add(tId);
        });

        const assignedTeachers = Array.from(distinctTeacherIds)
          .map((id) => teacherMap[id])
          .filter(Boolean);

        // Group sessions by day within this period (only on the specific days scheduled)
        const sessionsByDay = {};
        WEEKDAYS.forEach((d) => {
          sessionsByDay[d] = [];
        });

        periodClasses.forEach((cls) => {
          const classDays = expandDays(cls.days);
          classDays.forEach((day) => {
            if (sessionsByDay[day]) {
              sessionsByDay[day].push(cls);
            }
          });
        });

        // Sort each day chronologically
        Object.keys(sessionsByDay).forEach((d) => {
          sessionsByDay[d].sort((a, b) => {
            const aStart = (a.time || '').split(/[-–]/)[0]?.trim();
            const bStart = (b.time || '').split(/[-–]/)[0]?.trim();
            return (timeToMinutes(aStart) || 0) - (timeToMinutes(bStart) || 0);
          });
        });

        return {
          period,
          assignedTeachers,
          periodClasses,
          sessionsByDay
        };
      });
  }, [periods, classes, teacherSchedules, teachers, periodTeachers, teacherMap, filterTeacherId, selectedClassId, selectedDay, selectedPeriodId]);

  return (
    <div className="space-y-6">
      {periodData.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] text-slate-500">
          <Calendar size={36} className="mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            {t('schedules.no_periods_found', 'No periods or matching classes found')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t('schedules.adjust_filters_hint', 'Try adjusting your filters or create a new teaching period.')}
          </p>
        </div>
      ) : (
        periodData.map(({ period, assignedTeachers, periodClasses, sessionsByDay }) => {
          const hasAnySessions = periodClasses.length > 0;

          return (
            <div
              key={period.id}
              className="rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#151F32] shadow-xs overflow-hidden"
            >
              {/* Period Header */}
              <div className="p-4 bg-slate-50/70 dark:bg-[#1E293B]/70 border-b border-slate-200 dark:border-[#29364D] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                        {period.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {formatScheduleTime(period.startTime, period.endTime)}
                      </span>
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
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{period.days}</span>
                      {period.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[280px] sm:max-w-md">{period.description}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Assigned Instructors Chips & Session Count */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {t('schedules.instructors', 'Instructors')}:
                    </span>
                    {assignedTeachers.length === 0 ? (
                      <span className="text-xs text-slate-400">0</span>
                    ) : (
                      <>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {assignedTeachers.slice(0, 4).map((tch) => (
                            <img
                              key={tch.id}
                              title={tch.name}
                              src={tch.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                              alt={tch.name}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1E293B] object-cover"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] ml-1">
                          {assignedTeachers.length}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/80 dark:border-[#29364D]">
                    {periodClasses.length} {t('common.classes', 'Classes')}
                  </span>
                </div>
              </div>

              {/* Sessions Grid by Day */}
              {!hasAnySessions ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {t('schedules.no_classes_assigned_to_period', 'No classes assigned to this period yet.')}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    {t(
                      'schedules.period_empty_hint',
                      'Classes will only appear here when they have a valid assigned teacher and an active schedule linked to this period.'
                    )}
                  </p>
                  {onAssignClass && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onAssignClass(period)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>{t('schedules.assign_teacher_and_schedule', 'Assign Teacher & Schedule')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                    {WEEKDAYS.slice(0, 5).map((day) => {
                      const daySessions = sessionsByDay[day] || [];
                      const isHighlightedDay = selectedDay === day || selectedDay === 'ALL';

                      if (selectedDay !== 'ALL' && selectedDay !== day) return null;

                      return (
                        <div
                          key={day}
                          className={`rounded-xl border p-3 flex flex-col transition-all ${
                            isHighlightedDay
                              ? 'border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#1E293B]/40'
                              : 'opacity-40 border-dashed border-slate-200'
                          }`}
                        >
                          {/* Day Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#29364D] mb-2.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-[#F8FAFC]">
                              {day}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {daySessions.length}
                            </span>
                          </div>

                          {/* Sessions in this Day */}
                          <div className="space-y-2 flex-1">
                            {daySessions.length === 0 ? (
                              <div className="py-6 text-center text-[11px] text-slate-400 italic">
                                {t('schedules.no_sessions', 'Free slot')}
                              </div>
                            ) : (
                              daySessions.map((cls) => {
                                const hasConflict = conflictClassIds.has(cls.id);
                                const teacher = teacherMap[cls.teacherId] || teacherMap[cls.teacher] || {
                                  name: cls.teacher || 'Assigned Instructor',
                                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                                };

                                return (
                                  <div
                                    key={cls.id + day}
                                    onClick={() => onSelectSession(cls)}
                                    className={`p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-xs group ${
                                      hasConflict
                                        ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30'
                                        : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:border-indigo-400 dark:hover:border-indigo-500'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1 mb-1">
                                      <div className="font-bold text-xs text-slate-900 dark:text-[#F8FAFC] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {cls.name}
                                      </div>
                                      {hasConflict && (
                                        <ShieldAlert size={14} className="text-rose-500 shrink-0" title="Schedule Conflict" />
                                      )}
                                    </div>

                                    {/* Subject badge & Code */}
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50 truncate">
                                        {cls.subjectName || cls.subject || 'English'}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {cls.code}
                                      </span>
                                    </div>

                                    {/* Time and Location */}
                                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold">
                                        <Clock size={11} className="text-indigo-500" />
                                        <span>{formatScheduleTime(cls.time || `${period.startTime} – ${period.endTime}`)}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] truncate">
                                        <MapPin size={10} className="text-slate-400" />
                                        <span className="truncate">{cls.studentLocation || cls.room || "Student's Home"}</span>
                                      </div>
                                    </div>

                                    {/* Teacher footer */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <img
                                          src={teacher.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                                          alt={teacher.name}
                                          className="w-4 h-4 rounded-full object-cover shrink-0"
                                        />
                                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                          {teacher.name}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                                        <Users size={9} />
                                        <span>{cls.enrolledStudents || cls.enrolled || 0}/{cls.maxCapacity || cls.capacity || 25}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
