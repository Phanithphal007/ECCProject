import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  AlertTriangle
} from 'lucide-react';
import { 
  WEEKDAYS, 
  expandDays, 
  timeToMinutes,
  getMondayOfWeek,
  getWeekDays,
  formatWeekRange,
  TIMETABLE_HOURS
} from '../../utils/scheduleUtils';
import { cleanScheduleText, normalizeTimePart, formatScheduleDays } from '../../utils/formatters';

export const WeeklyCalendarView = ({
  classes = [],
  teachers = [],
  filterTeacherId = 'ALL',
  onSelectSession = () => {},
  conflicts = []
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Week navigation state
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfWeek(new Date('2026-11-02')));

  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentMonday(getMondayOfWeek(new Date('2026-11-02')));
  };

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);

  // Filter classes according to selected teacher
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (cls.status !== 'Active') return false;
      if (filterTeacherId !== 'ALL') {
        return cls.teacherId === filterTeacherId || cls.teacher === filterTeacherId;
      }
      return true;
    });
  }, [classes, filterTeacherId]);

  // Map classes to each day of the week
  const scheduleByDay = useMemo(() => {
    const map = {};
    WEEKDAYS.forEach((day) => {
      map[day] = [];
    });

    filteredClasses.forEach((cls) => {
      const days = expandDays(formatScheduleDays(cls.days));
      const cleanedTime = cleanScheduleText(cls.time || '');
      const times = cleanedTime.split(/\s*(?:–|-|to)\s*/i).map((t) => t.trim());
      const startFormatted = normalizeTimePart(times[0]) || '08:00 AM';
      const endFormatted = normalizeTimePart(times[1]) || '09:30 AM';
      const sMin = timeToMinutes(startFormatted) || 480; // default 08:00 AM
      const eMin = timeToMinutes(endFormatted) || (sMin + 90);

      days.forEach((day) => {
        if (map[day]) {
          map[day].push({
            ...cls,
            startMin: sMin,
            endMin: eMin,
            startTimeFormatted: startFormatted,
            endTimeFormatted: endFormatted
          });
        }
      });
    });

    // Sort chronologically
    WEEKDAYS.forEach((day) => {
      map[day].sort((a, b) => a.startMin - b.startMin);
    });

    return map;
  }, [filteredClasses]);

  const teacherMap = useMemo(() => {
    const map = {};
    teachers.forEach((tch) => {
      map[tch.id] = tch;
      map[tch.name] = tch;
    });
    return map;
  }, [teachers]);

  const conflictClassIds = useMemo(() => {
    const ids = new Set();
    conflicts.forEach((c) => {
      if (c.classId) ids.add(c.classId);
      if (c.conflictingClassId) ids.add(c.conflictingClassId);
    });
    return ids;
  }, [conflicts]);

  // Color theme generator for subject badges
  const getSubjectColor = (subject = '') => {
    const s = String(subject).toLowerCase();
    if (s.includes('alphabet') || s.includes('starter') || s.includes('phonics')) {
      return 'border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200';
    }
    if (s.includes('grammar') || s.includes('reading')) {
      return 'border-l-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200';
    }
    if (s.includes('speaking') || s.includes('communication') || s.includes('ielts')) {
      return 'border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200';
    }
    return 'border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200';
  };

  return (
    <div className="space-y-3">
      {/* Timetable Header Toolbar: Previous Week, Date Range, Next Week, Today */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 dark:border-[#29364D] rounded-lg overflow-hidden bg-white dark:bg-[#1E293B]">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#29364D] text-slate-600 dark:text-[#CBD5E1] transition-colors cursor-pointer"
              title={t('schedules.prev_week', 'Previous Week')}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#29364D] text-slate-600 dark:text-[#CBD5E1] transition-colors cursor-pointer border-l border-slate-200 dark:border-[#29364D]"
              title={t('schedules.next_week', 'Next Week')}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#29364D] text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('schedules.today', 'Today')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC]">
            {formatWeekRange(currentMonday, lang)}
          </span>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          {filteredClasses.length} {t('schedules.active_cohorts', 'active classes running this term')}
        </div>
      </div>

      {/* Modern Timetable Grid Container */}
      <div className="rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#151F32] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header row: Time label column + 7 Day Columns */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 dark:border-[#29364D] bg-slate-50/70 dark:bg-[#111A2E]/70 text-xs">
              <div className="p-3 text-center font-bold text-slate-400 border-r border-slate-200 dark:border-[#29364D] flex items-center justify-center">
                <Clock size={13} />
              </div>

              {weekDays.map((date, idx) => {
                const dayName = WEEKDAYS[idx];
                const dayNumber = date.getDate();
                const isWeekend = idx >= 5;
                const isToday = date.toDateString() === new Date('2026-11-02').toDateString();

                return (
                  <div
                    key={dayName}
                    className={`p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-[#29364D] transition-colors ${
                      isToday
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40'
                        : isWeekend
                        ? 'bg-slate-100/40 dark:bg-[#0E1626]/40'
                        : ''
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider block">
                      {dayName.slice(0, 3)}
                    </span>
                    <span className={`inline-block mt-0.5 text-sm font-black w-7 h-7 leading-7 rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-800 dark:text-[#F8FAFC]'
                    }`}>
                      {dayNumber}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timetable Body Grid */}
            <div className="divide-y divide-slate-100 dark:divide-[#22314E]/60 text-xs">
              {TIMETABLE_HOURS.map((hourStr, hourIdx) => {
                const hourMin = timeToMinutes(hourStr);
                const nextHourMin = hourMin + 60;

                return (
                  <div
                    key={hourStr}
                    className={`grid grid-cols-[80px_repeat(7,1fr)] min-h-[96px] ${
                      hourIdx % 2 === 0
                        ? 'bg-white dark:bg-[#151F32]'
                        : 'bg-slate-50/30 dark:bg-[#131D30]/40'
                    }`}
                  >
                    {/* Time Label on left */}
                    <div className="p-2.5 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 text-center border-r border-slate-200 dark:border-[#29364D] select-none flex items-start justify-center pt-3">
                      {hourStr}
                    </div>

                    {/* 7 Days Grid Cells */}
                    {WEEKDAYS.map((dayName, dayIdx) => {
                      const dayClasses = scheduleByDay[dayName] || [];
                      // Match sessions that start in this hour interval or overlap
                      const cellSessions = dayClasses.filter((cls) => {
                        return cls.startMin >= hourMin && cls.startMin < nextHourMin;
                      });

                      const isWeekend = dayIdx >= 5;

                      return (
                        <div
                          key={`${dayName}-${hourStr}`}
                          className={`p-1.5 border-r last:border-r-0 border-slate-200/70 dark:border-[#29364D]/60 flex flex-col gap-1.5 ${
                            isWeekend ? 'bg-slate-50/20 dark:bg-[#0B1120]/20' : ''
                          }`}
                        >
                          {cellSessions.map((cls) => {
                            const tch = teacherMap[cls.teacherId] || teacherMap[cls.teacher];
                            const isConflicted = conflictClassIds.has(cls.id);
                            const subjectColor = getSubjectColor(cls.subjectName || cls.subject);

                            return (
                              <div
                                key={`${cls.id}-${cls.startMin}`}
                                onClick={() => onSelectSession(cls)}
                                className={`p-2 rounded-lg border-l-4 border shadow-xs transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] ${
                                  isConflicted
                                    ? 'border-l-rose-500 border-rose-300 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100'
                                    : `${subjectColor} border-slate-200/80 dark:border-[#29364D]`
                                }`}
                              >
                                {/* Time & Conflict Alert Badge */}
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono text-[10px] font-bold flex items-center gap-1 opacity-90">
                                    <Clock size={10} />
                                    <span>{cls.startTimeFormatted} – {cls.endTimeFormatted}</span>
                                  </span>

                                  {isConflicted && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100 flex items-center gap-0.5">
                                      <AlertTriangle size={9} />
                                      <span>{t('schedules.conflict_short', 'Conflict')}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Class Title */}
                                <h4 className="font-bold text-xs leading-snug line-clamp-1">
                                  {cls.name}
                                </h4>

                                {/* Subject & Teacher */}
                                <div className="mt-1 flex items-center justify-between gap-1 text-[10px] opacity-80 truncate">
                                  <span className="font-semibold truncate">
                                    {cls.subjectName || cls.subject || 'English'}
                                  </span>
                                  <span className="truncate shrink-0 font-medium">
                                    {tch?.name || cls.teacher}
                                  </span>
                                </div>

                                {/* Location */}
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  <MapPin size={9} className="shrink-0" />
                                  <span className="truncate">{cls.studentLocation || cls.room}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
