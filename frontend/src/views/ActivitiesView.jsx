import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, Calendar, UserCheck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { classroomActivities } from '../data/mockData';
import { useApp } from '../context/useApp';

export const ActivitiesView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const [activities, setActivities] = useState(classroomActivities);
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('Grade 4 Discovery');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = {
      id: `ACT-${Date.now().toString().slice(-3)}`,
      title: newTitle,
      subject: 'Conversational English',
      classTarget: newTarget,
      date: 'Today',
      status: 'Active Now',
      teacher: 'Teacher Sophea Heng',
      completedRate: 20
    };

    setActivities([created, ...activities]);
    setIsOpen(false);
    setNewTitle('');
    addToast({
      type: 'success',
      title: t('dashboard.toast_activity_created'),
      message: `"${created.title}" launched.`
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
        title={t('activities.title')}
        subtitle={t('activities.subtitle')}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus size={15} />
          <span>{t('activities.create_button')}</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 pr-2">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                    {act.subject}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] mt-2 leading-snug">
                    {act.title}
                  </h3>
                </div>
                <StatusBadge status={act.status} size="sm" />
              </div>

              <div className="py-2 text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                <p>
                  {t('activities.cohort')}: <strong className="text-slate-700 dark:text-[#CBD5E1]">{act.classTarget}</strong>
                </p>
                <p>
                  {t('activities.teacher')}: <strong className="text-slate-700 dark:text-[#CBD5E1]">{act.teacher}</strong>
                </p>
                <p className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{t('common.date')}: {act.date}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between text-xs">
              <span className="text-slate-400 dark:text-[#94A3B8]">{t('activities.completed_rate')}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{act.completedRate}%</span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('dashboard.modal_create_act_title')}
        description={t('dashboard.modal_create_act_desc')}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('dashboard.activity_title_label')}
            </label>
            <input
              type="text"
              required
              placeholder={t('dashboard.activity_title_placeholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('activities.cohort')}
            </label>
            <input
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
