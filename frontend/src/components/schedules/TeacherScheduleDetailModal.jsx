import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Plus, 
  Coffee, 
  BookOpen, 
  Phone, 
  Mail
} from 'lucide-react';
import { WEEKDAYS, calculateTeacherWeeklyHours } from '../../utils/scheduleUtils';
import { formatScheduleDays, formatScheduleTime, cleanScheduleText } from '../../utils/formatters';
import { useApp } from '../../context/useApp';

export const TeacherScheduleDetailModal = ({
  isOpen,
  onClose,
  teacherId,
  onOpenAvailabilityModal,
  onOpenScheduleModal
}) => {
  const { t } = useTranslation();
  const {
    teachers,
    classes,
    teacherAvailability,
    checkScheduleConflict
  } = useApp();

  const teacher = useMemo(() => {
    return teachers.find((t) => t.id === teacherId) || teachers[0];
  }, [teachers, teacherId]);

  // Assigned classes for this teacher
  const assignedClasses = useMemo(() => {
    if (!teacher) return [];
    return classes.filter(
      (c) => (c.teacherId === teacher.id || c.teacher === teacher.name) && c.status === 'Active'
    );
  }, [classes, teacher]);

  // Availability slots for this teacher
  const availabilitySlots = useMemo(() => {
    if (!teacher) return [];
    return teacherAvailability.filter((a) => a.teacherId === teacher.id);
  }, [teacherAvailability, teacher]);

  // Calculate total weekly hours
  const weeklyHours = useMemo(() => {
    if (!teacher) return 0;
    return calculateTeacherWeeklyHours(teacher.id, classes);
  }, [teacher, classes]);

  // Evaluate if any assigned class has a conflict
  const teacherConflicts = useMemo(() => {
    if (!teacher) return [];
    const detected = [];
    assignedClasses.forEach((cls) => {
      const cleanedTime = cleanScheduleText(cls.time || '');
      const times = cleanedTime.split(/\s*(?:–|-|to)\s*/i).map((t) => t.trim());
      if (times[0] && times[1]) {
        const check = checkScheduleConflict({
          teacherId: teacher.id,
          days: formatScheduleDays(cls.days),
          startTime: times[0],
          endTime: times[1],
          excludeClassId: cls.id
        });
        if (check.hasConflict) {
          detected.push({ classId: cls.id, className: cls.name, conflicts: check.conflicts });
        }
      }
    });
    return detected;
  }, [teacher, assignedClasses, checkScheduleConflict]);

  if (!teacher) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('schedules.teacher_schedule_profile', 'Teacher Schedule & Availability Profile')}
      description={t('schedules.profile_desc', 'Weekly teaching assignments, availability windows, and workload hours.')}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-xs">
        {/* Header Profile Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={teacher.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-[#29364D]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">{teacher.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {teacher.status || 'Active'}
                </span>
              </div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{teacher.role}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                {teacher.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    <span>{teacher.email}</span>
                  </span>
                )}
                {teacher.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    <span className="font-mono">{teacher.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Workload metric badge */}
          <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-[#29364D] sm:pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {t('schedules.weekly_workload', 'Weekly Workload')}
            </span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {weeklyHours} <span className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">{t('schedules.hours_per_week', 'hrs/week')}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
              {assignedClasses.length} {t('classes.title', 'Classes')} • {availabilitySlots.length} {t('schedules.active_days', 'Active Days')}
            </p>
          </div>
        </div>

        {/* Conflict Alert Banner if any conflict detected */}
        {teacherConflicts.length > 0 && (
          <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{t('schedules.teacher_conflicts_detected', 'Attention: Schedule Conflicts Detected for this Teacher')}</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 dark:text-rose-300">
              {teacherConflicts.map((tc, idx) => (
                <li key={idx}>
                  <strong>{tc.className}:</strong> {tc.conflicts.map((c) => c.message).join('; ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Weekly Availability Windows */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t('schedules.weekly_availability_schedule', 'Configured Weekly Availability')}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAvailabilityModal(teacher.id);
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Plus size={13} />
              <span>{t('schedules.edit_or_add_hours', 'Edit / Add Hours')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {WEEKDAYS.map((day) => {
              const slot = availabilitySlots.find((a) => a.dayOfWeek === day);
              const isAvailable = slot && slot.status !== 'Unavailable';

              return (
                <div
                  key={day}
                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                    isAvailable
                      ? 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B]'
                      : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{day}</span>
                    {slot ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          slot.status === 'Preferred'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : slot.status === 'Unavailable'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {slot.status}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {t('schedules.off_day', 'Off Day')}
                      </span>
                    )}
                  </div>

                  {slot && isAvailable ? (
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-[#CBD5E1]">
                      <div className="font-mono flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <Clock size={11} />
                        <span>{slot.availableFrom} – {slot.availableUntil}</span>
                      </div>
                      {slot.breakStart && (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Coffee size={10} className="text-amber-500" />
                          <span>{t('schedules.break', 'Break')}: {formatScheduleTime(slot.breakStart, slot.breakEnd)}</span>
                        </div>
                      )}
                      {slot.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate">
                          "{slot.notes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      {t('schedules.not_available', 'Not available')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Assigned English Classes & Schedules */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#29364D]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t('schedules.assigned_classes_and_schedules', 'Assigned English Classes')}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                {assignedClasses.length}
              </span>
            </h4>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScheduleModal(null, teacher.id);
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Plus size={13} />
              <span>{t('schedules.assign_new_class', 'Assign Schedule')}</span>
            </button>
          </div>

          {assignedClasses.length === 0 ? (
            <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#29364D] text-slate-400">
              {t('schedules.no_classes_assigned', 'No active classes currently assigned to this instructor.')}
            </div>
          ) : (
            <div className="space-y-2">
              {assignedClasses.map((cls) => {
                const isConflicted = teacherConflicts.some((c) => c.classId === cls.id);
                return (
                  <div
                    key={cls.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isConflicted
                        ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-[#F8FAFC]">
                          {cls.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-[#151F32] text-slate-600 dark:text-[#94A3B8]">
                          {cls.code}
                        </span>
                        {isConflicted && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {t('schedules.conflict_badge', 'Conflict')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {cls.subjectName || cls.subject || 'English'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={11} />
                          <span>{formatScheduleDays(cls.days)}</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          <span>{formatScheduleTime(cls.time)}</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          <span>{cls.studentLocation || cls.room}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1]">
                        {cls.enrolled || 0} / {cls.capacity || 25} {t('students.title', 'Students')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-200 dark:hover:bg-[#29364D] transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
