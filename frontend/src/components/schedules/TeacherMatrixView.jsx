import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Clock, 
  Calendar, 
  Coffee, 
  MapPin, 
  Mail, 
  Phone, 
  Plus, 
  Settings2
} from 'lucide-react';
import { 
  WEEKDAYS, 
  expandDays, 
  timeToMinutes, 
  calculateTeacherWeeklyHours
} from '../../utils/scheduleUtils';

export const TeacherMatrixView = ({
  teachers = [],
  classes = [],
  teacherAvailability = [],
  selectedTeacherId: initialSelectedTeacherId = null,
  onSelectSession = () => {},
  onOpenAvailability = () => {},
  onOpenSchedule = () => {},
  conflicts = []
}) => {
  const { t } = useTranslation();

  const [activeTeacherId, setActiveTeacherId] = useState(
    () => initialSelectedTeacherId || teachers[0]?.id || ''
  );

  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === activeTeacherId) || teachers[0];
  }, [teachers, activeTeacherId]);

  // Assigned classes for this teacher
  const assignedClasses = useMemo(() => {
    if (!selectedTeacher) return [];
    return classes.filter(
      (c) => (c.teacherId === selectedTeacher.id || c.teacher === selectedTeacher.name) && c.status === 'Active'
    );
  }, [classes, selectedTeacher]);

  // Total teaching hours
  const totalWeeklyHours = useMemo(() => {
    if (!selectedTeacher) return 0;
    return calculateTeacherWeeklyHours(selectedTeacher.id, classes);
  }, [selectedTeacher, classes]);

  // Availability slots for this teacher
  const availabilitySlots = useMemo(() => {
    if (!selectedTeacher) return [];
    return teacherAvailability.filter((a) => a.teacherId === selectedTeacher.id);
  }, [teacherAvailability, selectedTeacher]);

  const availableSlotsCount = useMemo(() => {
    return availabilitySlots.filter((a) => a.status === 'Available' || a.status === 'Preferred').length;
  }, [availabilitySlots]);

  // Teacher conflicts
  const teacherConflicts = useMemo(() => {
    if (!selectedTeacher) return [];
    return conflicts.filter(
      (c) => c.teacherId === selectedTeacher.id || assignedClasses.some((ac) => ac.id === c.classId || ac.id === c.conflictingClassId)
    );
  }, [conflicts, selectedTeacher, assignedClasses]);

  // Total weekly sessions count
  const weeklySessionsCount = useMemo(() => {
    let total = 0;
    assignedClasses.forEach((cls) => {
      const days = expandDays(cls.days);
      total += days.length;
    });
    return total;
  }, [assignedClasses]);

  // Map classes to each day of week for this teacher
  const scheduleByDay = useMemo(() => {
    const map = {};
    WEEKDAYS.forEach((day) => {
      map[day] = [];
    });

    assignedClasses.forEach((cls) => {
      const days = expandDays(cls.days);
      const times = (cls.time || '').split(/[-–]/).map((t) => t.trim());
      const sMin = timeToMinutes(times[0]) || 480;
      const eMin = timeToMinutes(times[1]) || (sMin + 90);

      days.forEach((day) => {
        if (map[day]) {
          map[day].push({
            ...cls,
            startMin: sMin,
            endMin: eMin,
            startTimeFormatted: times[0] || '08:00 AM',
            endTimeFormatted: times[1] || '09:30 AM'
          });
        }
      });
    });

    // Sort chronologically
    WEEKDAYS.forEach((day) => {
      map[day].sort((a, b) => a.startMin - b.startMin);
    });

    return map;
  }, [assignedClasses]);

  if (!selectedTeacher) return null;

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Teacher Selector Dropdown & Filter Ribbon */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-1.5">
            <Users size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.select_teacher_profile', 'Select Teacher')}:</span>
          </label>
          <select
            value={activeTeacherId}
            onChange={(e) => setActiveTeacherId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs min-w-[200px]"
          >
            {teachers.map((tch) => (
              <option key={tch.id} value={tch.id}>
                {tch.name} ({tch.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAvailability(selectedTeacher.id)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#29364D] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings2 size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.configure_hours', 'Availability Hours')}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSchedule(null, selectedTeacher.id)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>{t('schedules.assign_class', 'Assign Class')}</span>
          </button>
        </div>
      </div>

      {/* 2. Comprehensive Teacher Profile & Workload Card */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={selectedTeacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
            alt={selectedTeacher.name}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-[#29364D]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                {selectedTeacher.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {selectedTeacher.status || 'Active'}
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {selectedTeacher.role}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
              {selectedTeacher.email && (
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  <span>{selectedTeacher.email}</span>
                </span>
              )}
              {selectedTeacher.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} className="text-slate-400" />
                  <span>{selectedTeacher.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Quantitative Workload Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-[#29364D] pt-3 md:pt-0 md:pl-5">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1E293B]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{t('schedules.teaching_hours', 'Workload')}</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{totalWeeklyHours} <span className="text-[10px] font-normal text-slate-400">h/wk</span></span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1E293B]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{t('schedules.sessions', 'Sessions')}</span>
            <span className="text-base font-black text-slate-800 dark:text-[#F8FAFC]">{weeklySessionsCount}</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1E293B]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{t('schedules.available_days', 'Open Slots')}</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{availableSlotsCount} <span className="text-[10px] font-normal text-slate-400">days</span></span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1E293B]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">{t('schedules.conflicts', 'Conflicts')}</span>
            <span className={`text-base font-black ${teacherConflicts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
              {teacherConflicts.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Visual Legend: Available Time, Assigned Teaching, Break Time, Unavailable */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <h4 className="font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-1.5">
          <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t('schedules.complete_weekly_timetable', 'Complete Weekly Timetable & Availability')}</span>
        </h4>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400" />
            <span className="text-slate-600 dark:text-[#CBD5E1]">{t('schedules.legend_available', 'Available Time')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 border border-indigo-600" />
            <span className="text-slate-600 dark:text-[#CBD5E1]">{t('schedules.legend_teaching', 'Assigned Teaching')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-400" />
            <span className="text-slate-600 dark:text-[#CBD5E1]">{t('schedules.legend_break', 'Break Time')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700" />
            <span className="text-slate-400">{t('schedules.legend_unavailable', 'Unavailable Time')}</span>
          </div>
        </div>
      </div>

      {/* 4. Complete Weekly Timetable for Teacher */}
      <div className="rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#151F32] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[950px] grid grid-cols-7 divide-x divide-slate-200 dark:divide-[#29364D]">
            {WEEKDAYS.map((day) => {
              const slot = availabilitySlots.find((a) => a.dayOfWeek === day);
              const isAvailableDay = slot && slot.status !== 'Unavailable';
              const dayClasses = scheduleByDay[day] || [];
              const isWeekend = day === 'Saturday' || day === 'Sunday';

              return (
                <div
                  key={day}
                  className={`flex flex-col min-h-[400px] ${
                    isWeekend ? 'bg-slate-50/40 dark:bg-[#0E1626]/40' : ''
                  }`}
                >
                  {/* Day Column Header */}
                  <div className="p-3 border-b border-slate-200 dark:border-[#29364D] bg-slate-50/70 dark:bg-[#111A2E]/70 text-center">
                    <span className="font-bold text-xs text-slate-800 dark:text-[#F8FAFC]">
                      {day}
                    </span>
                    <div className="mt-1">
                      {isAvailableDay ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          {slot.availableFrom} – {slot.availableUntil}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#1E293B] text-slate-400">
                          {t('schedules.off_day', 'Off Day')}
                        </span>
                      )}
                    </div>

                    {slot?.breakStart && (
                      <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 font-medium">
                        <Coffee size={10} />
                        <span>{t('schedules.break', 'Break')}: {slot.breakStart}–{slot.breakEnd}</span>
                      </div>
                    )}
                  </div>

                  {/* Day Schedule Sessions / Empty Slots */}
                  <div className="p-2 space-y-2 flex-1">
                    {dayClasses.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-4 text-center">
                        <span className="text-[11px] text-slate-400 dark:text-slate-600 italic">
                          {isAvailableDay
                            ? t('schedules.open_for_teaching', 'Open for teaching')
                            : t('schedules.not_available', 'Not available')}
                        </span>
                      </div>
                    ) : (
                      dayClasses.map((cls) => {
                        const isConflicted = teacherConflicts.some(
                          (c) => c.classId === cls.id || c.conflictingClassId === cls.id
                        );

                        return (
                          <div
                            key={`${day}-${cls.id}`}
                            onClick={() => onSelectSession(cls)}
                            className={`p-2.5 rounded-lg border shadow-xs transition-all cursor-pointer hover:shadow-md ${
                              isConflicted
                                ? 'border-rose-400 bg-rose-50/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100'
                                : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 hover:border-indigo-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1 font-mono text-[10px] font-bold">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                <span>{cls.startTimeFormatted} – {cls.endTimeFormatted}</span>
                              </span>
                              {isConflicted && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100">
                                  {t('schedules.conflict_short', 'Conflict')}
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-xs line-clamp-1">{cls.name}</h5>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                              {cls.subjectName || cls.subject || 'English'}
                            </p>

                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate">{cls.studentLocation || cls.room}</span>
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
      </div>
    </div>
  );
};
