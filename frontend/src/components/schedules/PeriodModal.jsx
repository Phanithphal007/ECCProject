import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { 
  Clock, 
  Layers, 
  Calendar, 
  AlertTriangle, 
  FileText,
  Check
} from 'lucide-react';
import { 
  SCHEDULE_DAYS_PRESETS, 
  timeTo24H, 
  timeTo12H, 
  timeToMinutes 
} from '../../utils/scheduleUtils';
import { useApp } from '../../context/useApp';

const PeriodForm = ({
  onClose,
  period = null
}) => {
  const { t } = useTranslation();
  const { addTeachingPeriod, updateTeachingPeriod } = useApp();

  const isEditing = Boolean(period?.id);

  const [name, setName] = useState(() => period?.name || '');
  const [startTime24, setStartTime24] = useState(() => timeTo24H(period?.startTime || '08:00 AM'));
  const [endTime24, setEndTime24] = useState(() => timeTo24H(period?.endTime || '12:00 PM'));
  const [days, setDays] = useState(() => period?.days || 'Monday – Friday');
  const [status, setStatus] = useState(() => period?.status || 'Active');
  const [description, setDescription] = useState(() => period?.description || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time duration and validation calculation
  const timeInfo = useMemo(() => {
    const sMin = timeToMinutes(startTime24);
    const eMin = timeToMinutes(endTime24);
    if (sMin === null || eMin === null) return { valid: false, error: null };
    if (eMin <= sMin) {
      return {
        valid: false,
        error: t('schedules.end_time_must_be_later', 'Period end time must be later than start time.')
      };
    }
    const durationMin = eMin - sMin;
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const durationStr = `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim() || '0m';
    return {
      valid: true,
      error: null,
      durationStr,
      startTime12: timeTo12H(startTime24),
      endTime12: timeTo12H(endTime24)
    };
  }, [startTime24, endTime24, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!timeInfo.valid) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        startTime: timeInfo.startTime12,
        endTime: timeInfo.endTime12,
        days,
        status,
        description: description.trim()
      };

      if (isEditing) {
        await updateTeachingPeriod(period.id, payload);
      } else {
        await addTeachingPeriod(payload);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* 1. Period Name & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1]">
            {t('schedules.period_name', 'Period Name')} *
          </label>
          <div className="relative">
            <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Period, Afternoon Intensive, Evening Block"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1]">
            {t('common.status', 'Status')}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all cursor-pointer"
          >
            <option value="Active">{t('common.active', 'Active')}</option>
            <option value="Inactive">{t('common.inactive', 'Inactive')}</option>
          </select>
        </div>
      </div>

      {/* 2. Start Time & End Time with Native Clock Pickers */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50/70 dark:bg-[#151F32] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-1.5">
            <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.period_hours', 'Period Time Range')}</span>
          </label>
          {timeInfo.valid && (
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {timeInfo.startTime12} – {timeInfo.endTime12} ({timeInfo.durationStr})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Start Time Native Clock Input */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
              {t('schedules.start_time', 'Start Time')} *
            </span>
            <input
              type="time"
              required
              value={startTime24}
              onChange={(e) => setStartTime24(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] font-mono font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
            />
          </div>

          {/* End Time Native Clock Input */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
              {t('schedules.end_time', 'End Time')} *
            </span>
            <input
              type="time"
              required
              value={endTime24}
              onChange={(e) => setEndTime24(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] font-mono font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all ${
                timeInfo.error
                  ? 'border-rose-400 dark:border-rose-600 focus:border-rose-600'
                  : 'border-slate-200 dark:border-[#29364D] focus:border-indigo-600'
              }`}
            />
          </div>
        </div>

        {timeInfo.error && (
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5 font-medium">
            <AlertTriangle size={13} className="shrink-0" />
            <span>{timeInfo.error}</span>
          </div>
        )}
      </div>

      {/* 3. Days of the Week */}
      <div className="space-y-1">
        <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1]">
          {t('schedules.teaching_days', 'Applicable Teaching Days')}
        </label>
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all cursor-pointer"
          >
            {SCHEDULE_DAYS_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Description / Notes */}
      <div className="space-y-1">
        <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1]">
          {t('common.description', 'Description / Academic Focus')}
        </label>
        <div className="relative">
          <FileText size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Primary cohort literacy foundational classes, upper-secondary IELTS focus..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] font-medium text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all resize-none"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="pt-3 border-t border-slate-200 dark:border-[#29364D] flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#29364D] hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs transition-colors cursor-pointer"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !timeInfo.valid || isSubmitting}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Check size={14} />
          <span>{isEditing ? t('common.save_changes', 'Save Changes') : t('schedules.create_period', 'Create Period')}</span>
        </button>
      </div>
    </form>
  );
};

export const PeriodModal = ({
  isOpen,
  onClose,
  period = null
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={period ? t('schedules.edit_period_title', 'Edit Teaching Period') : t('schedules.create_period_title', 'Create Teaching Period')}
      description={t('schedules.period_modal_desc', 'Define schedule category time boundaries and operating days for teacher allocations.')}
      maxWidth="max-w-md"
    >
      <PeriodForm
        key={period?.id || 'new-period'}
        onClose={onClose}
        period={period}
      />
    </Modal>
  );
};

