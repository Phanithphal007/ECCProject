import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { MapPin, AlertTriangle, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { formatSubjectName, cleanScheduleText, normalizeTimePart, formatScheduleTime, formatScheduleDays } from '../../utils/formatters';
import { useApp } from '../../context/useApp';
import { timeTo24H, timeTo12H, timeToMinutes } from '../../utils/scheduleUtils';
import { classService } from '../../services/classService';

const SCHEDULE_DAYS_OPTIONS = [
  'Monday – Friday',
  'Monday, Wednesday, Friday',
  'Tuesday, Thursday, Saturday',
  'Saturday & Sunday',
  'Monday – Saturday'
];

const parseTimeRange = (timeStr) => {
  if (!timeStr) return { startTime: '08:00 AM', endTime: '09:30 AM' };
  const cleaned = cleanScheduleText(timeStr);
  const parts = cleaned.split(/\s*(?:–|-|to)\s*/i).map(p => p.trim());
  return {
    startTime: normalizeTimePart(parts[0]) || '08:00 AM',
    endTime: normalizeTimePart(parts[1]) || '09:30 AM'
  };
};

const getInitialState = (cls, subjects) => {
  if (cls) {
    const { startTime, endTime } = parseTimeRange(cls.time);
    return {
      name: cls.name || '',
      code: cls.code || '',
      periodId: cls.periodId || '',
      subjectId: cls.subjectId || (subjects[0]?.id || ''),
      subjectName: cls.subjectName || (subjects[0]?.name || ''),
      gradeLevel: cls.gradeLevel || 'General',
      teacherId: cls.teacherId || '',
      teacher: cls.teacher || '',
      studentLocation: cls.studentLocation || cls.room || "Student's Home",
      days: cls.days || 'Monday – Friday',
      startTime,
      endTime,
      capacity: cls.capacity || 25,
      academicYear: cls.academicYear || '2026-2027',
      status: cls.status || 'Active',
      description: cls.description || ''
    };
  }

  const defaultSub = subjects.find(s => s.status === 'Active') || subjects[0];

  return {
    name: '',
    code: '',
    periodId: '',
    subjectId: defaultSub?.id || '',
    subjectName: defaultSub?.name || '',
    gradeLevel: 'General',
    teacherId: '',
    teacher: '',
    studentLocation: "Student's Home",
    days: 'Monday – Friday',
    startTime: '08:00 AM',
    endTime: '09:30 AM',
    capacity: 25,
    academicYear: '2026-2027',
    status: 'Active',
    description: ''
  };
};

export const ClassModal = ({
  isOpen,
  onClose,
  onSave,
  cls = null,
  subjects = [],
  teachers = []
}) => {
  const { t, i18n } = useTranslation();
  const { checkScheduleConflict, addToast, teachingPeriods = [], periodTeachers = [] } = useApp();
  const lang = i18n.language;
  const isEditing = Boolean(cls?.id);

  const [formData, setFormData] = useState(() => getInitialState(cls, subjects, teachers));
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Sync state whenever modal opens or cls changes
  useEffect(() => {
    if (!isOpen) return;

    if (cls) {
      setFormData(getInitialState(cls, subjects, teachers));
      setOverrideConflict(false);
      setIsLoadingCode(false);
    } else {
      setFormData(getInitialState(null, subjects, teachers));
      setOverrideConflict(false);
      setIsLoadingCode(true);

      classService.getNextCode()
        .then((res) => {
          if (res && res.code) {
            setFormData((prev) => ({ ...prev, code: res.code }));
          } else {
            setFormData((prev) => ({ ...prev, code: 'CLS-001' }));
          }
        })
        .catch(() => {
          setFormData((prev) => ({ ...prev, code: 'CLS-001' }));
        })
        .finally(() => {
          setIsLoadingCode(false);
        });
    }
  }, [isOpen, cls, subjects, teachers]);

  // Reactive conflict checking
  const conflictResult = useMemo(() => {
    if (!formData.teacherId || !formData.days || !formData.startTime || !formData.endTime) {
      return { hasConflict: false, conflicts: [] };
    }
    return checkScheduleConflict({
      teacherId: formData.teacherId,
      days: formData.days,
      startTime: formData.startTime,
      endTime: formData.endTime,
      excludeClassId: cls?.id || null
    });
  }, [checkScheduleConflict, formData.teacherId, formData.days, formData.startTime, formData.endTime, cls?.id]);

  // Display all active subjects (fallback to all subjects if none active)
  const availableSubjects = useMemo(() => {
    const active = subjects.filter((s) => s.status === 'Active');
    return active.length > 0 ? active : subjects;
  }, [subjects]);

  // Selected Period Object (if any)
  const selectedPeriod = useMemo(() => {
    if (!formData.periodId) return null;
    return teachingPeriods.find((p) => p.id === formData.periodId) || null;
  }, [formData.periodId, teachingPeriods]);

  // Teacher groupings: Assigned to selected period vs Other teachers
  const { periodAssignedTeachers, otherTeachers } = useMemo(() => {
    if (!formData.periodId) {
      return { periodAssignedTeachers: [], otherTeachers: teachers };
    }
    const assignedIds = new Set(
      periodTeachers
        .filter((pt) => pt.periodId === formData.periodId)
        .map((pt) => pt.teacherId)
    );

    const assigned = [];
    const others = [];
    teachers.forEach((t) => {
      if (assignedIds.has(t.id)) {
        assigned.push(t);
      } else {
        others.push(t);
      }
    });

    return { periodAssignedTeachers: assigned, otherTeachers: others };
  }, [teachers, formData.periodId, periodTeachers]);

  const handleSubjectChange = (subjectId) => {
    const found = subjects.find((s) => s.id === subjectId);
    setFormData((prev) => ({
      ...prev,
      subjectId,
      subjectName: found ? found.name : ''
    }));
  };

  const handleTeacherChange = (teacherId) => {
    const found = teachers.find((t) => t.id === teacherId);
    setFormData((prev) => ({
      ...prev,
      teacherId,
      teacher: found ? found.name : ''
    }));
  };

  const handlePeriodChange = (periodId) => {
    if (!periodId) {
      setFormData((prev) => ({ ...prev, periodId: '' }));
      return;
    }

    const periodObj = teachingPeriods.find((p) => p.id === periodId);
    if (!periodObj) return;

    // Adjust class times to fit within period window if currently outside
    const pStartMin = timeToMinutes(periodObj.startTime) || 480;
    const pEndMin = timeToMinutes(periodObj.endTime) || 720;
    const currStartMin = timeToMinutes(formData.startTime) || 480;

    let newStartTime = formData.startTime;
    let newEndTime = formData.endTime;
    if (currStartMin < pStartMin || currStartMin >= pEndMin) {
      newStartTime = periodObj.startTime;
      const targetEndMin = Math.min(pStartMin + 90, pEndMin);
      const endH = Math.floor(targetEndMin / 60);
      const endM = targetEndMin % 60;
      const end24 = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      newEndTime = timeTo12H(end24);
    }

    setFormData((prev) => ({
      ...prev,
      periodId,
      days: periodObj.days || prev.days,
      startTime: newStartTime,
      endTime: newEndTime
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (conflictResult.hasConflict && !overrideConflict) {
      addToast({
        type: 'error',
        title: t('schedules.conflict_detected', 'Schedule Conflict Detected'),
        message: t('schedules.override_required', 'Please resolve the teacher schedule conflict or authorize override.')
      });
      return;
    }

    const formattedTime = formatScheduleTime(formData.startTime, formData.endTime);
    const cleanDays = formatScheduleDays(formData.days);
    const schedule = `${cleanDays} • ${formattedTime}`;

    onSave({
      ...formData,
      days: cleanDays,
      gradeLevel: cls?.gradeLevel || formData.gradeLevel || 'General',
      time: formattedTime,
      room: formData.studentLocation, // for backward compatibility
      code: isEditing ? (cls?.code || formData.code) : (formData.code.trim() || 'CLS-001'),
      schedule
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('classes.edit_class_title') : t('classes.create_class_title')}
      description={t('classes.class_modal_desc')}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* 1. Class Name & Class Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.class_name')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={lang === 'km' ? 'ឧ. ថ្នាក់ទំនាក់ទំនងកម្រិតដំបូង A' : 'e.g. Communication & Fluency Cohort A'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1]">
                {t('classes.class_code')} *
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                isEditing
                  ? 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              }`}>
                {isEditing ? (
                  <>
                    <Lock size={10} />
                    <span>Preserved</span>
                  </>
                ) : isLoadingCode ? (
                  <>
                    <Sparkles size={10} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} />
                    <span>Auto-Generated</span>
                  </>
                )}
              </span>
            </div>
            <input
              type="text"
              readOnly
              aria-readonly="true"
              data-testid="class-modal-code-input"
              value={formData.code || (isLoadingCode ? 'Generating...' : 'CLS-001')}
              title={isEditing ? 'Original class code is preserved and cannot be edited.' : 'Unique official class code automatically assigned by backend sequence.'}
              className="w-full font-mono font-bold px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden cursor-not-allowed select-all"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {isEditing
                ? 'Original class code permanently preserved by system.'
                : 'Unique code (CLS-001, CLS-002...) auto-generated by backend.'}
            </p>
          </div>
        </div>

        {/* 2. English Subject & Teaching Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.subject')} *
            </label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            >
              {availableSubjects.length === 0 ? (
                <option value="">-- No subjects available --</option>
              ) : (
                availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSubjectName(s, lang)} ({s.code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('schedules.period', 'Teaching Period')}
            </label>
            <select
              value={formData.periodId}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            >
              <option value="">{t('schedules.no_period_custom', '-- Select Teaching Period (Optional) --')}</option>
              {teachingPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.startTime} – {p.endTime})
                </option>
              ))}
            </select>
            {selectedPeriod && (
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                {selectedPeriod.days} • {selectedPeriod.startTime} – {selectedPeriod.endTime}
              </p>
            )}
          </div>
        </div>

        {/* 3. Assigned Teacher (Grouped / Filtered by Period) */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
            {t('common.teacher')}
          </label>
          <select
            value={formData.teacherId}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
          >
            <option value="">{t('schedules.select_teacher_optional', '-- No Teacher Assigned (Unassigned) --')}</option>
            {formData.periodId && periodAssignedTeachers.length > 0 ? (
              <>
                <optgroup label={`${t('schedules.assigned_to_period', 'Assigned to this Period')} (${periodAssignedTeachers.length})`}>
                  {periodAssignedTeachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      ⭐ {tch.name} ({tch.role || 'Teacher'})
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('schedules.other_teachers', 'Other Faculty Teachers')}>
                  {otherTeachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.name} ({tch.role || 'Teacher'})
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.name} ({tch.role || 'Teacher'})
                </option>
              ))
            )}
          </select>
          {!formData.teacherId && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} className="shrink-0" />
              <span>{t('schedules.unassigned_teacher_notice', 'Without an assigned teacher, this class will not appear as an active scheduled period session.')}</span>
            </p>
          )}
        </div>

        {/* 4. Student Location */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1 mb-1">
            <MapPin size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('classes.student_location')} *</span>
          </label>
          <input
            type="text"
            required
            value={formData.studentLocation}
            onChange={(e) => setFormData({ ...formData, studentLocation: e.target.value })}
            placeholder={t('classes.student_location_placeholder')}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {t('classes.student_location_hint')}
          </p>
        </div>

        {/* 5. Class Days, Start Time & End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.class_days')}
            </label>
            <select
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            >
              {SCHEDULE_DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.start_time')} *
            </label>
            <input
              type="time"
              required
              value={timeTo24H(formData.startTime)}
              onChange={(e) => setFormData({ ...formData, startTime: timeTo12H(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
            />
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              {formData.startTime}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.end_time')} *
            </label>
            <input
              type="time"
              required
              value={timeTo24H(formData.endTime)}
              onChange={(e) => setFormData({ ...formData, endTime: timeTo12H(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
            />
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              {formData.endTime}
            </span>
          </div>
        </div>

        {/* 6. Max Capacity, Academic Year & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.max_capacity')}
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 25 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('classes.academic_year')}
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('common.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            >
              <option value="Active">{t('common.active')}</option>
              <option value="Scheduled">{t('common.scheduled')}</option>
              <option value="Completed">{t('common.completed')}</option>
            </select>
          </div>
        </div>

        {/* 7. Description / Remarks */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
            {t('classes.description')}
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('classes.class_desc_placeholder')}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
          />
        </div>

        {/* Schedule & Availability Conflict Warning Banner */}
        {conflictResult.hasConflict && (
          <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-xs">
                  {t('schedules.conflict_warning_title', 'Teacher Schedule Conflict / Availability Alert')}
                </h4>
                <ul className="mt-1 space-y-1 text-[11px] list-disc list-inside">
                  {conflictResult.conflicts.map((c, i) => (
                    <li key={i}>{c.message}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/50 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                <input
                  type="checkbox"
                  checked={overrideConflict}
                  onChange={(e) => setOverrideConflict(e.target.checked)}
                  className="rounded-sm border-amber-400 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-amber-600 dark:text-amber-400" />
                  {t('schedules.authorize_override', 'Authorize schedule conflict override (Admin permission)')}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#29364D]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs shadow-indigo-500/20 cursor-pointer"
          >
            {isEditing ? t('classes.save_changes') : t('classes.create_class')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
