import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Clock, Check, Coffee, Sparkles } from 'lucide-react';
import { WEEKDAYS, timeTo24H, timeTo12H } from '../../utils/scheduleUtils';
import { useApp } from '../../context/useApp';

const TeacherAvailabilityForm = ({
  onClose,
  initialTeacherId = null,
  slot = null
}) => {
  const { t } = useTranslation();
  const { teachers, addTeacherAvailability, updateTeacherAvailability, saveBatchTeacherAvailability } = useApp();

  const isEditing = Boolean(slot?.id);

  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  const [selectedTeacherId, setSelectedTeacherId] = useState(() => slot?.teacherId || initialTeacherId || teachers[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState(() => slot?.dayOfWeek || 'Monday');
  const [batchDays, setBatchDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  // Native 24h clock inputs
  const [availableFrom24, setAvailableFrom24] = useState(() => timeTo24H(slot?.availableFrom || '08:00 AM'));
  const [availableUntil24, setAvailableUntil24] = useState(() => timeTo24H(slot?.availableUntil || '05:00 PM'));
  const [hasBreak, setHasBreak] = useState(() => Boolean(slot ? slot.breakStart && slot.breakEnd : true));
  const [breakStart24, setBreakStart24] = useState(() => timeTo24H(slot?.breakStart || '12:00 PM'));
  const [breakEnd24, setBreakEnd24] = useState(() => timeTo24H(slot?.breakEnd || '01:00 PM'));
  const [status, setStatus] = useState(() => slot?.status || 'Available');
  const [notes, setNotes] = useState(() => slot?.notes || '');

  const toggleBatchDay = (day) => {
    setBatchDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) return;

    const availableFrom = timeTo12H(availableFrom24);
    const availableUntil = timeTo12H(availableUntil24);
    const breakStart = hasBreak ? timeTo12H(breakStart24) : null;
    const breakEnd = hasBreak ? timeTo12H(breakEnd24) : null;

    if (mode === 'single' || isEditing) {
      const payload = {
        teacherId: selectedTeacherId,
        dayOfWeek,
        availableFrom,
        availableUntil,
        availableFrom24,
        availableUntil24,
        breakStart,
        breakEnd,
        status,
        notes: notes.trim()
      };

      if (isEditing) {
        await updateTeacherAvailability(slot.id, payload);
      } else {
        await addTeacherAvailability(payload);
      }
    } else {
      // Batch mode
      const slots = batchDays.map((d) => ({
        dayOfWeek: d,
        availableFrom,
        availableUntil,
        breakStart,
        breakEnd,
        status,
        notes: notes.trim()
      }));

      await saveBatchTeacherAvailability(selectedTeacherId, slots);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Teacher Selection */}
      <div>
        <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
          {t('common.teacher', 'Teacher')} *
        </label>
        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          disabled={isEditing}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs disabled:opacity-60"
        >
          {teachers.map((tch) => (
            <option key={tch.id} value={tch.id}>
              {tch.name} ({tch.role})
            </option>
          ))}
        </select>
      </div>

      {/* Mode Selector (Single Day vs Multi-Day Batch) - Only if creating */}
      {!isEditing && (
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-[#151F32] rounded-lg">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 px-3 rounded-md font-semibold text-xs transition-all ${
              mode === 'single'
                ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700'
            }`}
          >
            {t('schedules.single_day', 'Single Day')}
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex-1 py-1.5 px-3 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-1 ${
              mode === 'batch'
                ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700'
            }`}
          >
            <Sparkles size={13} />
            <span>{t('schedules.multi_day_batch', 'Multi-Day Schedule (Batch)')}</span>
          </button>
        </div>
      )}

      {/* Day selection */}
      {mode === 'single' || isEditing ? (
        <div>
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
            {t('schedules.day_of_week', 'Day of Week')} *
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
          >
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
            {t('schedules.select_days', 'Apply Hours to Days')} *
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => {
              const isSelected = batchDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleBatchDay(d)}
                  className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-[#29364D] text-slate-500 dark:text-[#94A3B8] hover:bg-slate-50'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setBatchDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t('schedules.mon_fri', 'Mon–Fri')}
            </button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button
              type="button"
              onClick={() => setBatchDays(['Saturday', 'Sunday'])}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t('schedules.sat_sun', 'Sat & Sun')}
            </button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button
              type="button"
              onClick={() => setBatchDays(WEEKDAYS)}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t('schedules.all_7_days', 'All 7 Days')}
            </button>
          </div>
        </div>
      )}

      {/* Working Hours: Native Clock Pickers Available From & Until */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1 mb-1">
            <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.available_from', 'Available From')} *</span>
          </label>
          <input
            type="time"
            required
            value={availableFrom24}
            onChange={(e) => setAvailableFrom24(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{t('schedules.preview_12h', '12-Hour')}:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {timeTo12H(availableFrom24) || '—'}
            </span>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1 mb-1">
            <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.available_until', 'Available Until')} *</span>
          </label>
          <input
            type="time"
            required
            value={availableUntil24}
            onChange={(e) => setAvailableUntil24(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{t('schedules.preview_12h', '12-Hour')}:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {timeTo12H(availableUntil24) || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Lunch Break Interval with Native Time Pickers */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/50 dark:bg-[#151F32]/50 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-[#CBD5E1]">
            <input
              type="checkbox"
              checked={hasBreak}
              onChange={(e) => setHasBreak(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <Coffee size={14} className="text-amber-500" />
            <span>{t('schedules.include_break', 'Include Break / Lunch Interval')}</span>
          </label>
        </div>

        {hasBreak && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-[#94A3B8] mb-1">
                {t('schedules.break_start', 'Break Start')}
              </label>
              <input
                type="time"
                value={breakStart24}
                onChange={(e) => setBreakStart24(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-mono font-semibold"
              />
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {timeTo12H(breakStart24)}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-[#94A3B8] mb-1">
                {t('schedules.break_end', 'Break End')}
              </label>
              <input
                type="time"
                value={breakEnd24}
                onChange={(e) => setBreakEnd24(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-mono font-semibold"
              />
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {timeTo12H(breakEnd24)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Availability Status */}
      <div>
        <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
          {t('schedules.status', 'Availability Status')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'Available', label: t('schedules.status_available', 'Available'), color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700' },
            { id: 'Preferred', label: t('schedules.status_preferred', 'Preferred Slot'), color: 'text-indigo-700 bg-indigo-50 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700' },
            { id: 'Unavailable', label: t('schedules.status_unavailable', 'Unavailable'), color: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatus(st.id)}
              className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all ${
                status === st.id ? st.color + ' ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-[#29364D] text-slate-500'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
          {t('common.notes', 'Notes & Special Conditions')}
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Part-time schedule, weekend IELTS cohort, afternoon only..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
        />
      </div>

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
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check size={14} />
          <span>{isEditing ? t('common.save', 'Save Changes') : t('schedules.save_availability', 'Save Availability')}</span>
        </button>
      </div>
    </form>
  );
};

export const TeacherAvailabilityModal = ({
  isOpen,
  onClose,
  teacherId: initialTeacherId = null,
  slot = null
}) => {
  const { t } = useTranslation();
  const isEditing = Boolean(slot?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('schedules.edit_availability', 'Update Teacher Availability') : t('schedules.configure_availability', 'Configure Teacher Availability')}
      description={t('schedules.availability_desc', 'Define weekly availability periods, working hours, and lunch breaks.')}
      maxWidth="max-w-xl"
    >
      {isOpen && (
        <TeacherAvailabilityForm
          key={slot?.id || initialTeacherId || 'new'}
          onClose={onClose}
          initialTeacherId={initialTeacherId}
          slot={slot}
        />
      )}
    </Modal>
  );
};
