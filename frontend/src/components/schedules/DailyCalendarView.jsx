import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  AlertTriangle, 
  Users, 
  Plus
} from 'lucide-react';
import { 
  expandDays, 
  timeToMinutes,
  TIMETABLE_HOURS 
} from '../../utils/scheduleUtils';
import { cleanScheduleText, normalizeTimePart, formatScheduleDays } from '../../utils/formatters';

export const DailyCalendarView = ({
  classes = [],
  teachers = [],
  teacherAvailability = [],
  filterTeacherId = 'ALL',
  onSelectSession = () => {},
  onAssignSlot = () => {},
  conflicts = []
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Selected date state (default to Monday Nov 2, 2026)
  const [selectedDate, setSelectedDate] = useState(() => new Date('2026-11-02'));

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date('2026-11-02'));
  };

  // Convert selectedDate day of week to WEEKDAYS name
  const currentWeekday = useMemo(() => {
    const dayIdx = selectedDate.getDay(); // 0 is Sun, 1 is Mon
    // Map to WEEKDAYS ['Monday', 'Tuesday', ..., 'Sunday']
    const weekdayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdayMap[dayIdx];
  }, [selectedDate]);

  const formattedDateString = useMemo(() => {
    return selectedDate.toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDate, lang]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (cls.status !== 'Active') return false;
      if (filterTeacherId !== 'ALL') {
        return cls.teacherId === filterTeacherId || cls.teacher === filterTeacherId;
      }
      return true;
    });
  }, [classes, filterTeacherId]);

  // Sessions occurring on this day
  const daySessions = useMemo(() => {
    const list = [];
    filteredClasses.forEach((cls) => {
      const days = expandDays(formatScheduleDays(cls.days));
      if (days.includes(currentWeekday)) {
        const cleanedTime = cleanScheduleText(cls.time || '');
        const times = cleanedTime.split(/\s*(?:–|-|to)\s*/i).map((t) => t.trim());
        const startFormatted = normalizeTimePart(times[0]) || '08:00 AM';
        const endFormatted = normalizeTimePart(times[1]) || '09:30 AM';
        const sMin = timeToMinutes(startFormatted) || 480;
        const eMin = timeToMinutes(endFormatted) || (sMin + 90);
        list.push({
          ...cls,
          startMin: sMin,
          endMin: eMin,
          startTimeFormatted: startFormatted,
          endTimeFormatted: endFormatted
        });
      }
    });

    list.sort((a, b) => a.startMin - b.startMin);
    return list;
  }, [filteredClasses, currentWeekday]);

  // Teachers available on this day
  const availableTeachersCount = useMemo(() => {
    const available = teacherAvailability.filter(
      (a) => a.dayOfWeek === currentWeekday && a.status !== 'Unavailable'
    );
    const uniqueIds = new Set(available.map((a) => a.teacherId));
    return uniqueIds.size;
  }, [teacherAvailability, currentWeekday]);

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

  return (
    <div className="space-y-4">
      {/* Date Navigation Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 dark:border-[#29364D] rounded-lg overflow-hidden bg-white dark:bg-[#1E293B]">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#29364D] text-slate-600 dark:text-[#CBD5E1] transition-colors cursor-pointer"
              title={t('schedules.prev_day', 'Previous Day')}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#29364D] text-slate-600 dark:text-[#CBD5E1] transition-colors cursor-pointer border-l border-slate-200 dark:border-[#29364D]"
              title={t('schedules.next_day', 'Next Day')}
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
          <CalendarIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
            {formattedDateString}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-[#94A3B8]">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {daySessions.length} {t('schedules.sessions', 'Sessions')}
          </span>
          <span>•</span>
          <span>
            {availableTeachersCount} {t('schedules.instructors_available', 'Instructors Available')}
          </span>
        </div>
      </div>

      {/* Vertical Timeline Timetable */}
      <div className="rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#151F32] shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-[#22314E]/60">
          {TIMETABLE_HOURS.map((hourStr) => {
            const hourMin = timeToMinutes(hourStr);
            const nextHourMin = hourMin + 60;

            const matchingSessions = daySessions.filter((cls) => {
              return cls.startMin >= hourMin && cls.startMin < nextHourMin;
            });

            return (
              <div
                key={hourStr}
                className="grid grid-cols-[100px_1fr] min-h-[76px] transition-colors hover:bg-slate-50/40 dark:hover:bg-[#182338]/40"
              >
                {/* Time Slot Label Column */}
                <div className="p-3 border-r border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#111A2E]/50 flex items-start justify-center pt-3 select-none">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                    {hourStr}
                  </span>
                </div>

                {/* Slot Content Area */}
                <div className="p-2.5 flex flex-col justify-center">
                  {matchingSessions.length === 0 ? (
                    <div className="h-full flex items-center justify-between text-slate-400 dark:text-slate-600 px-3 py-1 text-xs">
                      <span className="italic font-normal text-[11px]">
                        {t('schedules.empty_slot', 'No teaching sessions scheduled')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAssignSlot(currentWeekday, hourStr)}
                        className="opacity-0 hover:opacity-100 focus:opacity-100 px-2.5 py-1 rounded-md text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={11} />
                        <span>{t('schedules.assign_button', 'Assign')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matchingSessions.map((cls) => {
                        const tch = teacherMap[cls.teacherId] || teacherMap[cls.teacher];
                        const isConflicted = conflictClassIds.has(cls.id);

                        return (
                          <div
                            key={cls.id}
                            onClick={() => onSelectSession(cls)}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all cursor-pointer hover:shadow-xs ${
                              isConflicted
                                ? 'border-rose-300 dark:border-rose-700/60 bg-rose-50/70 dark:bg-rose-950/30'
                                : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:border-indigo-400'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              {/* Session Time Badge */}
                              <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-center shrink-0">
                                <span className="font-bold text-xs">{cls.startTimeFormatted}</span>
                                <span className="text-[10px] text-slate-400 mx-1">–</span>
                                <span className="font-bold text-xs">{cls.endTimeFormatted}</span>
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC]">
                                    {cls.name}
                                  </h4>
                                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-[#151F32] text-slate-600 dark:text-[#94A3B8]">
                                    {cls.code}
                                  </span>
                                  {isConflicted && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                                      <AlertTriangle size={11} />
                                      <span>{t('schedules.conflict_badge', 'Conflict')}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {cls.subjectName || cls.subject || 'English'}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    <span>{cls.studentLocation || cls.room}</span>
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="flex items-center gap-1">
                                    <Users size={12} className="text-slate-400" />
                                    <span>{cls.enrolled || 0} / {cls.capacity || 25} {t('students.title', 'Students')}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Assigned Teacher Pill */}
                            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                              {tch?.avatar && (
                                <img
                                  src={tch.avatar}
                                  alt={tch.name}
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-[#29364D]"
                                />
                              )}
                              <div className="text-right">
                                <div className="font-bold text-xs text-slate-800 dark:text-[#F8FAFC]">
                                  {tch?.name || cls.teacher}
                                </div>
                                <div className="text-[10px] text-slate-400">{tch?.role || 'Instructor'}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
