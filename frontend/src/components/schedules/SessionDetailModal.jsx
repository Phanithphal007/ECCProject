import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { formatScheduleTime, formatScheduleDays } from '../../utils/formatters';

export const SessionDetailModal = ({
  isOpen,
  onClose,
  session = null,
  onEdit = () => {},
  isConflicted = false,
  conflictReason = null,
  conflictData = null
}) => {
  const { t } = useTranslation();
  const { 
    teachers, 
    navigateToClassStudents, 
    deleteTeachingSchedule,
    addToast
  } = useApp();

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  if (!session) return null;

  const teacher = teachers.find(
    (tch) => tch.id === session.teacherId || tch.name === session.teacher || tch.name === session.teacherName
  );

  const handleCancelSession = async () => {
    setIsCancelConfirmOpen(false);
    if (session.scheduleId) {
      // It's a recorded schedule assignment
      await deleteTeachingSchedule(session.scheduleId);
    } else {
      // If it's linked to class directly
      addToast({
        type: 'info',
        title: t('schedules.session_cancelled_title', 'Session Cancelled'),
        message: t('schedules.session_cancelled_msg', 'Teaching session has been marked as cancelled.')
      });
    }
    onClose();
  };

  const handleViewClass = () => {
    onClose();
    if (session.classId || session.id) {
      navigateToClassStudents(session.classId || session.id);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('schedules.session_details_title', 'Teaching Session Details')}
        description={t('schedules.session_details_sub', 'Review class schedule, instructor assignment, and classroom location.')}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          {/* Conflict Alert Banner if flagged */}
          {isConflicted && (
            <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{t('schedules.conflict_badge', 'Schedule Conflict Alert')}</span>
                </div>
                {conflictData?.conflictTypeLabel && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100 uppercase tracking-wider">
                    {conflictData.conflictTypeLabel}
                  </span>
                )}
              </div>

              {conflictData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  {(conflictData.conflictingTeacher || conflictData.teacherName) && (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-rose-200/80 dark:border-rose-900/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('common.teacher', 'Teacher')}</span>
                      <span className="font-semibold text-rose-950 dark:text-rose-100">{conflictData.conflictingTeacher || conflictData.teacherName}</span>
                    </div>
                  )}
                  {conflictData.conflictingDay && (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-rose-200/80 dark:border-rose-900/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('schedules.day_of_week', 'Conflicting Day')}</span>
                      <span className="font-semibold text-rose-950 dark:text-rose-100">{conflictData.conflictingDay}</span>
                    </div>
                  )}
                  {conflictData.existingTime && (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-rose-200/80 dark:border-rose-900/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('schedules.existing_time', 'Existing Time')}</span>
                      <span className="font-semibold font-mono text-rose-950 dark:text-rose-100">{conflictData.existingTime}</span>
                    </div>
                  )}
                  {conflictData.requestedTime && (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-rose-200/80 dark:border-rose-900/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('schedules.requested_time', 'Requested Time')}</span>
                      <span className="font-semibold font-mono text-rose-950 dark:text-rose-100">{conflictData.requestedTime}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                {conflictReason || conflictData?.message || t('schedules.conflict_alert_notice', 'This session overlaps with another active cohort or occurs outside teacher availability.')}
              </p>
            </div>
          )}

          {/* Class Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {session.code || session.classCode || 'ENG-CLS'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  session.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : session.status === 'Cancelled'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                }`}>
                  {session.status || 'Active'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] mt-1.5">
                {session.className || session.name}
              </h3>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {session.subjectName || session.subject || 'English Curriculum'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {t('schedules.enrolled_count', 'Enrollment')}
              </span>
              <span className="text-base font-black text-slate-800 dark:text-[#F8FAFC]">
                {session.enrolled || 0}
                <span className="text-xs font-normal text-slate-400"> / {session.capacity || 25}</span>
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Instructor */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {t('common.teacher', 'Assigned Instructor')}
              </span>
              <div className="flex items-center gap-2.5">
                {teacher?.avatar && (
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-[#29364D]"
                  />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
                    {teacher?.name || session.teacherName || session.teacher}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {teacher?.role || 'English Teacher'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {t('classes.start_time', 'Session Time')}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Clock size={14} />
                <span>{formatScheduleTime(session.startTimeFormatted || session.time || '08:00 AM – 09:30 AM')}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
                <Calendar size={11} />
                <span>{formatScheduleDays(session.days) || 'Monday – Friday'}</span>
              </div>
            </div>

            {/* Location */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {t('classes.student_location', 'Teaching Location / Address')}
              </span>
              <div className="flex items-center gap-2 text-slate-800 dark:text-[#F8FAFC] font-medium">
                <MapPin size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{session.location || session.studentLocation || session.room || 'ECC Centre, Phnom Penh'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>{t('schedules.cancel_session', 'Cancel Session')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(session);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#29364D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('common.edit', 'Edit Schedule')}</span>
              </button>

              <button
                type="button"
                onClick={handleViewClass}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{t('classes.view_students', 'View Class')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelSession}
        title={t('schedules.cancel_session_title', 'Cancel Teaching Session?')}
        message={t('schedules.cancel_session_confirm', 'Are you sure you want to cancel this scheduled session for {{name}}? Students and instructor will be notified.', {
          name: session.className || session.name
        })}
        confirmText={t('schedules.confirm_cancel', 'Confirm Cancellation')}
        cancelText={t('common.cancel', 'Keep Session')}
        type="danger"
      />
    </>
  );
};
