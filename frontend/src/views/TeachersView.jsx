import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Phone, BookOpen, Plus, CalendarClock, Clock } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { TeacherScheduleDetailModal } from '../components/schedules/TeacherScheduleDetailModal';
import { TeacherAvailabilityModal } from '../components/schedules/TeacherAvailabilityModal';
import { TeachingScheduleModal } from '../components/schedules/TeachingScheduleModal';
import { calculateTeacherWeeklyHours } from '../utils/scheduleUtils';
import { useApp } from '../context/useApp';

export const TeachersView = () => {
  const { t } = useTranslation();
  const { 
    teachers: contextTeachers, 
    classes, 
    addToast, 
    navigateToTeacherSchedules 
  } = useApp();
  const [teachers, setTeachers] = useState(contextTeachers);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    role: 'Primary English Teacher',
    email: '',
    phone: '',
    grades: 'Grade 3, 4'
  });

  // Schedule modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [availabilityTeacherId, setAvailabilityTeacherId] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTeacherId, setScheduleTeacherId] = useState(null);

  const handleOpenDetailModal = (teacherId) => {
    setSelectedTeacherId(teacherId);
    setIsDetailModalOpen(true);
  };

  const handleOpenAvailabilityModal = (teacherId) => {
    setAvailabilityTeacherId(teacherId);
    setIsAvailabilityOpen(true);
  };

  const handleOpenScheduleModal = (_schedule = null, teacherId = null) => {
    const targetId = teacherId || (typeof _schedule === 'string' ? _schedule : null);
    setScheduleTeacherId(targetId);
    setIsScheduleModalOpen(true);
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.name.trim()) return;

    const teacherObj = {
      id: `TCH-0${teachers.length + 1}`,
      ...newTeacher,
      assignedClasses: 3,
      activeStudents: 65,
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };

    setTeachers([...teachers, teacherObj]);
    setIsAddTeacherOpen(false);
    addToast({
      type: 'success',
      title: t('teachers.add_button'),
      message: `${teacherObj.name} registered.`
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
        title={t('teachers.title')}
        subtitle={t('teachers.subtitle')}
      >
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => navigateToTeacherSchedules()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#29364D] text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <CalendarClock size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('schedules.title', 'Teacher Schedules')}</span>
          </button>
          <button
            onClick={() => setIsAddTeacherOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('teachers.add_button')}</span>
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {teachers.map((tch) => {
          const weeklyHours = calculateTeacherWeeklyHours(tch.id, classes);
          const assignedCohortCount = classes.filter(
            (c) => (c.teacherId === tch.id || c.teacher === tch.name) && c.status === 'Active'
          ).length;

          return (
            <div
              key={tch.id}
              className="p-5 rounded-xl bg-white dark:bg-[#151F32] border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={tch.avatar}
                      alt={tch.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-[#29364D]"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-[#F8FAFC]">{tch.name}</h3>
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{tch.role}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {t('classes.level')}: <strong className="text-slate-600 dark:text-[#CBD5E1]">{tch.grades}</strong>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={tch.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-[#29364D] text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-[#CBD5E1]">
                    <Mail size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{tch.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-[#CBD5E1]">
                    <Phone size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-mono">{tch.phone}</span>
                  </div>
                </div>
              </div>

              {/* Teaching Workload & Schedule Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#29364D] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#CBD5E1]">
                    <BookOpen size={13} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{assignedCohortCount} {t('teachers.active_classes')}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                    <Clock size={13} />
                    <span>{weeklyHours} hrs/wk</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(tch.id)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#29364D] text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <CalendarClock size={14} />
                  <span>{t('schedules.schedule_and_availability', 'Schedule & Hours')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        title={t('teachers.add_button')}
        description={t('teachers.subtitle')}
      >
        <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">{t('users.name')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Teacher Vanna Rath"
              value={newTeacher.name}
              onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">{t('users.email')}</label>
              <input
                type="email"
                placeholder="teacher@edumanage.kh"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">{t('users.phone')}</label>
              <input
                type="text"
                placeholder="+855 12 000 000"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">{t('classes.level')}</label>
            <input
              type="text"
              placeholder="e.g. Grade 4, Grade 5, Grade 6"
              value={newTeacher.grades}
              onChange={(e) => setNewTeacher({ ...newTeacher, grades: e.target.value })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 dark:border-[#29364D]">
            <button
              type="button"
              onClick={() => setIsAddTeacherOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-slate-500 dark:text-[#94A3B8] font-semibold hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule & Availability Modals */}
      <TeacherScheduleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        teacherId={selectedTeacherId}
        onOpenAvailabilityModal={handleOpenAvailabilityModal}
        onOpenScheduleModal={handleOpenScheduleModal}
      />

      <TeacherAvailabilityModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        teacherId={availabilityTeacherId}
      />

      <TeachingScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        initialTeacherId={scheduleTeacherId}
      />
    </motion.div>
  );
};

