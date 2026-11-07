import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, Calendar, Users, Award, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/useApp';

export const AssessmentsView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const [assessments, setAssessments] = useState([
    {
      id: "ASM-01",
      title: "Grade 4 Mid-Term Phonics & Reading Test",
      grade: "Grade 4",
      date: "Oct 28, 2026",
      avgScore: "88.4 / 100",
      testedStudents: 24,
      status: "Completed"
    },
    {
      id: "ASM-02",
      title: "Grade 8 Oral Speaking & Dialogue Assessment",
      grade: "Grade 8",
      date: "Nov 02, 2026",
      avgScore: "81.2 / 100",
      testedStudents: 26,
      status: "Completed"
    },
    {
      id: "ASM-03",
      title: "Grade 12 National English Mock Examination",
      grade: "Grade 12",
      date: "Nov 08, 2026",
      avgScore: "Pending",
      testedStudents: 28,
      status: "Scheduled"
    },
    {
      id: "ASM-04",
      title: "Grade 2 Oxford Vocabulary & Spelling Quiz",
      grade: "Grade 2",
      date: "Nov 12, 2026",
      avgScore: "Pending",
      testedStudents: 22,
      status: "Scheduled"
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('Grade 4');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item = {
      id: `ASM-${Date.now().toString().slice(-2)}`,
      title: newTitle,
      grade: newGrade,
      date: "Upcoming",
      avgScore: "Pending",
      testedStudents: 24,
      status: "Scheduled"
    };

    setAssessments([item, ...assessments]);
    setIsOpen(false);
    setNewTitle('');
    addToast({
      type: 'success',
      title: t('assessments.toast_created_title'),
      message: `${item.title} ${t('assessments.toast_created_msg')}`
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
        title={t('assessments.title')}
        subtitle={t('assessments.subtitle')}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus size={15} />
          <span>{t('assessments.record_button')}</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((asm) => (
          <div
            key={asm.id}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                    {asm.grade}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] mt-2 leading-snug">
                    {asm.title}
                  </h3>
                </div>
                <StatusBadge status={asm.status} size="sm" />
              </div>

              <div className="py-2 text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                <p className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>{t('common.date')}: {asm.date}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  <span>{t('assessments.tested_students')}: {asm.testedStudents} {t('common.student')}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                <Award size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  {t('assessments.avg_score')}: <strong className="text-slate-800 dark:text-[#F8FAFC]">{asm.avgScore}</strong>
                </span>
              </span>
              <button
                onClick={() => addToast({ type: 'info', title: t('assessments.title'), message: `Opening gradebook entry for ${asm.title}` })}
                className="min-h-[44px] px-3 py-1.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('common.edit')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('assessments.modal_record_title')}
        description={t('assessments.modal_record_sub')}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('assessments.asm_title_label')}
            </label>
            <input
              type="text"
              required
              placeholder={t('assessments.asm_title_placeholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              {t('assessments.target_grade_label')}
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
              {t('assessments.schedule_button')}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
