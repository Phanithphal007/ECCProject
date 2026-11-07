import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, Clock, UserCheck, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/useApp';

export const HomeworkView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const [homeworkList, setHomeworkList] = useState([
    {
      id: "HW-01",
      title: "Grade 4 Reading Comprehension Passage: The Mekong Dolphin",
      grade: "Grade 4",
      dueDate: "Tomorrow at 05:00 PM",
      assignedBy: "Teacher Sophea Heng",
      submittedCount: 21,
      totalCount: 24,
      status: "In Progress"
    },
    {
      id: "HW-02",
      title: "Grade 8 English Essay: My Community in Phnom Penh",
      grade: "Grade 8",
      dueDate: "Friday, Nov 07",
      assignedBy: "Teacher Michael Davies",
      submittedCount: 18,
      totalCount: 26,
      status: "In Progress"
    },
    {
      id: "HW-03",
      title: "Grade 2 Phonics Letter Sound Tracing & Matching",
      grade: "Grade 2",
      dueDate: "Completed",
      assignedBy: "Teacher Sovannary Long",
      submittedCount: 22,
      totalCount: 22,
      status: "Completed"
    },
    {
      id: "HW-04",
      title: "Grade 11 Past Continuous vs Past Simple Drills",
      grade: "Grade 11",
      dueDate: "Monday, Nov 10",
      assignedBy: "Teacher David Miller",
      submittedCount: 8,
      totalCount: 25,
      status: "Scheduled"
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('Grade 4');
  const [newDueDate, setNewDueDate] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item = {
      id: `HW-${Date.now().toString().slice(-2)}`,
      title: newTitle,
      grade: newGrade,
      dueDate: newDueDate || "Next Class",
      assignedBy: "Teacher Sophea Heng",
      submittedCount: 0,
      totalCount: 24,
      status: "Scheduled"
    };

    setHomeworkList([item, ...homeworkList]);
    setIsOpen(false);
    setNewTitle('');
    addToast({
      type: 'success',
      title: t('homework.toast_assigned_title'),
      message: `"${item.title}" ${t('homework.toast_assigned_msg')}`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <PageHeader
        title={t('homework.title')}
        subtitle={t('homework.subtitle')}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus size={15} />
          <span>{t('homework.assign_button')}</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {homeworkList.map((hw) => (
          <div
            key={hw.id}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                    {hw.grade}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] mt-2 leading-snug">
                    {hw.title}
                  </h3>
                </div>
                <StatusBadge status={hw.status} size="sm" />
              </div>

              <div className="py-2 text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                <p>
                  {t('homework.assigned_by')}: <strong className="text-slate-700 dark:text-[#CBD5E1]">{hw.assignedBy}</strong>
                </p>
                <p className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>{t('homework.due_date')}: {hw.dueDate}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                <UserCheck size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  {t('homework.submissions')}: <strong className="text-slate-800 dark:text-[#F8FAFC]">{hw.submittedCount} / {hw.totalCount}</strong>
                </span>
              </span>
              <button
                onClick={() => addToast({ type: 'info', title: t('homework.submissions'), message: `Showing submission list for ${hw.title}` })}
                className="min-h-[44px] px-3 py-1.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('common.view_details')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('homework.modal_assign_title')}
        description={t('homework.modal_assign_sub')}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('homework.hw_title_label')}
            </label>
            <input
              type="text"
              required
              placeholder={t('homework.hw_title_placeholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                {t('homework.target_grade_label')}
              </label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                {t('homework.due_date_label')}
              </label>
              <input
                type="text"
                placeholder={t('homework.due_date_placeholder')}
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 dark:border-[#29364D]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-slate-500 dark:text-[#94A3B8] font-semibold hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
            >
              {t('homework.dispatch_button')}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
