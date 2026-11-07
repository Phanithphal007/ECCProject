import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, Calendar, ClipboardCheck, Award, CreditCard, Activity, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/useApp';
import { getOfficialStudentId } from '../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';

export const CommandPalette = () => {
  const { t } = useTranslation();
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    students,
    setSelectedStudent,
    setActiveTab,
    setIsAddStudentOpen
  } = useApp();

  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const handleClose = () => {
    setQuery('');
    setIsCommandPaletteOpen(false);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.khmerName && s.khmerName.includes(query)) ||
      s.grade.toLowerCase().includes(query.toLowerCase()) ||
      s.id.toLowerCase().includes(query.toLowerCase()) ||
      getOfficialStudentId(s).includes(query)
  );

  const quickActions = [
    {
      id: 'act-new-stu',
      title: t('dashboard.action_register_student', 'Register Student'),
      subtitle: t('dashboard.action_register_sub', 'Open student intake modal (Gr. 1 - 12)'),
      icon: Users,
      action: () => {
        handleClose();
        setIsAddStudentOpen(true);
      }
    },
    {
      id: 'act-attendance',
      title: t('dashboard.action_attendance', 'Take Daily Attendance'),
      subtitle: t('dashboard.action_attendance_sub', 'Mark present, late, absent for today'),
      icon: ClipboardCheck,
      action: () => {
        handleClose();
        setActiveTab('attendance');
      }
    },
    {
      id: 'act-classes',
      title: t('nav.classes', 'English Classes'),
      subtitle: t('dashboard.action_activity_sub', 'Check room & teacher assignments'),
      icon: Calendar,
      action: () => {
        handleClose();
        setActiveTab('classes');
      }
    },
    {
      id: 'act-activity',
      title: t('dashboard.action_activity', 'Classroom Activities'),
      subtitle: t('dashboard.action_activity_sub', 'Phonics, vocabulary, and speaking tasks'),
      icon: Activity,
      action: () => {
        handleClose();
        setActiveTab('activities');
      }
    },
    {
      id: 'act-scores',
      title: t('dashboard.action_assessment', 'Assessments & Scores'),
      subtitle: t('dashboard.action_assessment_sub', 'Enter quiz and exam results'),
      icon: Award,
      action: () => {
        handleClose();
        setActiveTab('assessments');
      }
    },
    {
      id: 'act-fees',
      title: t('nav.financials', 'Fees & Payments'),
      subtitle: t('financials.subtitle', 'View term invoices and overdue accounts'),
      icon: CreditCard,
      action: () => {
        handleClose();
        setActiveTab('financials');
      }
    }
  ].filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -15 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200 dark:border-[#29364D] overflow-hidden z-10 transition-colors"
        >
          {/* Search bar input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-[#29364D]">
            <Search className="text-slate-400 dark:text-slate-500 mr-3" size={18} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('header.search_placeholder', 'Search students, classes, or jump to section...')}
              className="w-full bg-transparent text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none"
            />
            <button
              onClick={handleClose}
              className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8]"
            >
              ESC
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-3">
            {quickActions.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-[#94A3B8] uppercase tracking-wider">
                  {t('dashboard.quick_actions_title', 'Quick Actions')}
                </p>
                <div className="space-y-0.5">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.action}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">
                              {action.title}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-[#94A3B8]">
                              {action.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredStudents.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-[#94A3B8] uppercase tracking-wider">
                  {t('students.title', 'Students')} ({filteredStudents.length})
                </p>
                <div className="space-y-0.5">
                  {filteredStudents.slice(0, 5).map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student);
                        handleClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getStudentAvatarUrl(student.avatar)}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#29364D] bg-slate-100 dark:bg-slate-800"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                            {student.name}
                            {student.khmerName && <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-normal">({student.khmerName})</span>}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] font-mono border border-slate-200 dark:border-[#29364D]">
                              {getOfficialStudentId(student)}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 dark:text-[#94A3B8]">
                            {student.grade} • {student.className}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {t('common.view_details', 'View profile')} →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickActions.length === 0 && filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.no_data', 'No results found')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
