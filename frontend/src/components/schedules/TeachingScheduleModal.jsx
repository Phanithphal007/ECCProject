import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  Clock, 
  MapPin, 
  BookOpen, 
  UserCheck, 
  FileText
} from 'lucide-react';
import { 
  SCHEDULE_DAYS_PRESETS, 
  timeTo24H, 
  timeTo12H, 
  timeToMinutes 
} from '../../utils/scheduleUtils';
import { useApp } from '../../context/useApp';

const TeachingScheduleForm = ({
  onClose,
  schedule = null,
  initialTeacherId = null
}) => {
  const { t } = useTranslation();
  const {
    teachers,
    classes,
    teachingPeriods = [],
    addTeachingSchedule,
    updateTeachingSchedule,
    checkScheduleConflict,
    addToast
  } = useApp();

  const isEditing = Boolean(schedule?.id);

  const activeClasses = useMemo(() => {
    return classes.filter((c) => c.status === 'Active' || c.status === 'Scheduled');
  }, [classes]);

  const [teacherId, setTeacherId] = useState(() => schedule?.teacherId || initialTeacherId || teachers[0]?.id || '');
  const [classId, setClassId] = useState(() => schedule?.classId || activeClasses[0]?.id || '');
  const [periodId, setPeriodId] = useState(() => schedule?.periodId || activeClasses[0]?.periodId || '');
  const [days, setDays] = useState(() => schedule?.days || activeClasses[0]?.days || 'Monday – Friday');

  // Time stored in 24-hour HH:mm for native <input type="time" />
  const [startTime24, setStartTime24] = useState(() => {
    if (schedule?.startTime) return timeTo24H(schedule.startTime);
    const times = (activeClasses[0]?.time || '').split(/[-–]/).map((t) => t.trim());
    return timeTo24H(times[0] || '08:00 AM');
  });

  const [endTime24, setEndTime24] = useState(() => {
    if (schedule?.endTime) return timeTo24H(schedule.endTime);
    const times = (activeClasses[0]?.time || '').split(/[-–]/).map((t) => t.trim());
    return timeTo24H(times[1] || '09:30 AM');
  });

  const [effectiveStartDate, setEffectiveStartDate] = useState(() => schedule?.effectiveStartDate || '2026-09-01');
  const [effectiveEndDate, setEffectiveEndDate] = useState(() => schedule?.effectiveEndDate || '2027-06-30');
  const [academicYear, setAcademicYear] = useState(() => schedule?.academicYear || '2026-2027');
  const [location, setLocation] = useState(() => {
    return schedule?.location || activeClasses[0]?.studentLocation || activeClasses[0]?.room || 'ECC Centre, Phnom Penh';
  });
  const [status, setStatus] = useState(() => schedule?.status || 'Scheduled');
  const [notes, setNotes] = useState(() => schedule?.notes || '');
  const [overrideConflict, setOverrideConflict] = useState(false);

  // Time validation: End Time must be later than Start Time
  const timeValidationError = useMemo(() => {
    const sMin = timeToMinutes(startTime24);
    const eMin = timeToMinutes(endTime24);
    if (sMin === null || eMin === null) {
      return t('schedules.time_required_error', 'Both Start Time and End Time are required.');
    }
    if (sMin >= eMin) {
      return t('schedules.invalid_time_range_error', 'End Time must be later than Start Time.');
    }
    return null;
  }, [startTime24, endTime24, t]);

  const durationText = useMemo(() => {
    const sMin = timeToMinutes(startTime24);
    const eMin = timeToMinutes(endTime24);
    if (sMin !== null && eMin !== null && eMin > sMin) {
      const diff = eMin - sMin;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (hours > 0 && mins > 0) return `${hours} hr ${mins} mins`;
      if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
      return `${mins} mins`;
    }
    return null;
  }, [startTime24, endTime24]);

  // Selected Class details preview
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === classId);
  }, [classes, classId]);

  // When class changes, pre-fill days and location
  const handleClassChange = (selectedId) => {
    setClassId(selectedId);
    const foundCls = classes.find((c) => c.id === selectedId);
    if (foundCls) {
      if (foundCls.periodId) setPeriodId(foundCls.periodId);
      if (foundCls.teacherId) setTeacherId(foundCls.teacherId);
      if (foundCls.days) setDays(foundCls.days);
      const times = (foundCls.time || '').split(/[-–]/).map((t) => t.trim());
      if (times[0]) setStartTime24(timeTo24H(times[0]));
      if (times[1]) setEndTime24(timeTo24H(times[1]));
      if (foundCls.studentLocation || foundCls.room) {
        setLocation(foundCls.studentLocation || foundCls.room);
      }
    }
  };

  // Real-time conflict evaluation
  const conflictResult = useMemo(() => {
    if (!teacherId || !days || !startTime24 || !endTime24 || timeValidationError) {
      return { hasConflict: false, conflicts: [] };
    }
    return checkScheduleConflict({
      teacherId,
      classId,
      days,
      startTime: timeTo12H(startTime24),
      endTime: timeTo12H(endTime24),
      effectiveStartDate,
      effectiveEndDate,
      status,
      excludeScheduleId: schedule?.id,
      excludeClassId: schedule ? schedule.classId : null
    });
  }, [
    checkScheduleConflict, 
    teacherId, 
    classId, 
    days, 
    startTime24, 
    endTime24, 
    effectiveStartDate, 
    effectiveEndDate, 
    status, 
    schedule, 
    timeValidationError
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId || !classId) return;

    if (timeValidationError) {
      addToast({
        type: 'error',
        title: t('schedules.invalid_time', 'Invalid Time Selection'),
        message: timeValidationError
      });
      return;
    }

    if (conflictResult.hasConflict && !overrideConflict) {
      addToast({
        type: 'error',
        title: t('schedules.conflict_detected', 'Schedule Conflict Detected'),
        message: t('schedules.override_required', 'Please resolve schedule conflict or check Admin Override to proceed.')
      });
      return;
    }

    const selectedTeacher = teachers.find((t) => t.id === teacherId);

    const payload = {
      periodId: periodId || null,
      teacherId,
      teacherName: selectedTeacher ? selectedTeacher.name : '',
      classId,
      className: selectedClass ? selectedClass.name : '',
      subjectName: selectedClass ? selectedClass.subjectName : '',
      days,
      startTime: timeTo12H(startTime24),
      endTime: timeTo12H(endTime24),
      startTime24,
      endTime24,
      effectiveStartDate,
      effectiveEndDate,
      academicYear,
      location,
      status,
      notes: notes.trim(),
      overrideConflict
    };

    if (isEditing) {
      await updateTeachingSchedule(schedule.id, payload);
    } else {
      await addTeachingSchedule(payload);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* SECTION A: Teacher & Class Assignment */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#151F32]/50 space-y-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#F8FAFC]">
          <UserCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t('schedules.section_a_title', 'A. Teacher & Class Assignment')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.title', 'English Class')} *
            </label>
            <select
              required
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            >
              {activeClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('common.teacher', 'Assigned Teacher')} *
            </label>
            <select
              required
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            >
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.name} ({tch.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('schedules.teaching_period', 'Teaching Period')}
            </label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            >
              <option value="">{t('schedules.no_period_assigned', '-- No Specific Period --')}</option>
              {teachingPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.startTime} – {p.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Class Meta Information Banner */}
        {selectedClass && (
          <div className="p-2.5 rounded-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#29364D] flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-[#CBD5E1]">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <BookOpen size={12} />
              <span>{selectedClass.subjectName || selectedClass.subject || 'English'}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{t('schedules.capacity', 'Capacity')}: <strong>{selectedClass.enrolled || 0} / {selectedClass.capacity || 25}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="truncate max-w-[200px]">{t('classes.student_location', 'Location')}: <strong>{selectedClass.studentLocation || selectedClass.room}</strong></span>
          </div>
        )}
      </div>

      {/* SECTION B: Teaching Days & Time with NATIVE CLOCK TIME PICKERS */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#151F32]/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#F8FAFC]">
            <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.section_b_title', 'B. Teaching Days & Time')}</span>
          </div>
          {durationText && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {durationText}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Days Preset Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.class_days', 'Teaching Days')} *
            </label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            >
              {SCHEDULE_DAYS_PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Native Clock Start Time Picker */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.start_time', 'Start Time')} *
            </label>
            <div className="relative">
              <input
                type="time"
                required
                value={startTime24}
                onChange={(e) => setStartTime24(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono font-semibold text-xs"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>{t('schedules.preview_12h', '12-Hour')}:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {timeTo12H(startTime24) || '—'}
              </span>
            </div>
          </div>

          {/* Native Clock End Time Picker */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.end_time', 'End Time')} *
            </label>
            <div className="relative">
              <input
                type="time"
                required
                value={endTime24}
                onChange={(e) => setEndTime24(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 transition-all font-mono font-semibold text-xs ${
                  timeValidationError
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-600'
                    : 'border-slate-200 dark:border-[#29364D] focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>{t('schedules.preview_12h', '12-Hour')}:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {timeTo12H(endTime24) || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Time Range Validation Alert */}
        {timeValidationError && (
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
            <AlertTriangle size={13} className="shrink-0" />
            <span>{timeValidationError}</span>
          </div>
        )}
      </div>

      {/* SECTION C: Location & Academic Period */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#151F32]/50 space-y-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#F8FAFC]">
          <MapPin size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t('schedules.section_c_title', 'C. Location & Academic Period')}</span>
        </div>

        {/* Editable Student Location text field */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
            {t('classes.student_location', 'Student Location / Classroom')} *
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. ECC Centre, Phnom Penh or Student's Home, Siem Reap..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {t('schedules.location_hint', 'Enter custom teaching venue, centre room, student residence, or private learning location.')}
          </p>
        </div>

        {/* Effective Dates & Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('schedules.start_date', 'Effective Start Date')}
            </label>
            <input
              type="date"
              value={effectiveStartDate}
              onChange={(e) => setEffectiveStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('schedules.end_date', 'Effective End Date')}
            </label>
            <input
              type="date"
              value={effectiveEndDate}
              onChange={(e) => setEffectiveEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.academic_year', 'Academic Year')}
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2026-2027"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION D: Assignment Details */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#151F32]/50 space-y-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#F8FAFC]">
          <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t('schedules.section_d_title', 'D. Assignment Details')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('schedules.status', 'Schedule Status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            >
              <option value="Scheduled">{t('schedules.status_scheduled', 'Scheduled')}</option>
              <option value="Active">{t('common.active', 'Active')}</option>
              <option value="Completed">{t('common.completed', 'Completed')}</option>
              <option value="Cancelled">{t('common.cancelled', 'Cancelled')}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('common.notes', 'Assignment Remarks / Curriculum Focus')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primary grammar block, IELTS speaking prep, or special syllabus focus..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>
        </div>
      </div>

      {/* Live Conflict Warning Banner */}
      {conflictResult.hasConflict && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-xs flex items-center gap-2">
                <span>{t('schedules.conflict_warning_title', 'Teacher Schedule Conflict / Availability Alert')}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-100">
                  {conflictResult.conflicts.length}
                </span>
              </h4>

              <div className="mt-2 space-y-2">
                {conflictResult.conflicts.map((c, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-amber-200/80 dark:border-amber-900/50 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                        {c.conflictTypeLabel || c.type}
                      </span>
                      {c.conflictingTeacher && (
                        <span className="font-bold text-amber-950 dark:text-amber-100">
                          {c.conflictingTeacher}
                        </span>
                      )}
                      {c.conflictingClass && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {c.conflictingClass}
                          </span>
                        </>
                      )}
                      {c.conflictingDay && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-amber-800 dark:text-amber-300">
                            {c.conflictingDay}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] opacity-90">
                      {c.existingTime && (
                        <span><strong>{t('schedules.existing_time', 'Existing')}:</strong> {c.existingTime}</span>
                      )}
                      {c.requestedTime && (
                        <span><strong>{t('schedules.requested_time', 'Requested')}:</strong> {c.requestedTime}</span>
                      )}
                    </div>

                    <p className="text-[11px] font-normal leading-relaxed text-amber-900 dark:text-amber-200">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overrideConflict}
                onChange={(e) => setOverrideConflict(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 border-amber-300 focus:ring-amber-500"
              />
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <ShieldCheck size={13} className="text-amber-600 dark:text-amber-400" />
                {t('schedules.authorize_override', 'Authorize schedule conflict override (Admin permission)')}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          type="submit"
          disabled={Boolean(timeValidationError)}
          className={`px-5 py-2 rounded-lg text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            conflictResult.hasConflict && !overrideConflict
              ? 'bg-amber-600 hover:bg-amber-700 opacity-90'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Check size={14} />
          <span>{isEditing ? t('common.save', 'Save Changes') : t('schedules.assign_button', 'Assign Schedule')}</span>
        </button>
      </div>
    </form>
  );
};

export const TeachingScheduleModal = ({
  isOpen,
  onClose,
  schedule = null,
  initialTeacherId = null
}) => {
  const { t } = useTranslation();
  const isEditing = Boolean(schedule?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('schedules.edit_teaching_schedule', 'Update Teaching Schedule') : t('schedules.assign_teaching_schedule', 'Assign Teaching Schedule')}
      description={t('schedules.assign_schedule_desc', 'Assign an English class cohort and weekly teaching hours to an instructor.')}
      maxWidth="max-w-2xl"
    >
      {isOpen && (
        <TeachingScheduleForm
          key={schedule?.id || initialTeacherId || 'new'}
          onClose={onClose}
          schedule={schedule}
          initialTeacherId={initialTeacherId}
        />
      )}
    </Modal>
  );
};
