import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Save, 
  Users 
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useApp } from '../context/useApp';

export const AttendanceView = () => {
  const { t } = useTranslation();
  const { students, addToast } = useApp();

  const [selectedClass, setSelectedClass] = useState('Grade 4 Discovery (ENG-G4-A)');
  const [selectedDate, setSelectedDate] = useState('2026-11-03');

  // Attendance status per student: 'present' | 'late' | 'absent'
  const [roster, setRoster] = useState(() => {
    const initial = {};
    students.forEach((s, idx) => {
      initial[s.id] = idx === 1 ? 'absent' : idx === 4 ? 'late' : 'present';
    });
    return initial;
  });

  const handleToggle = (id, status) => {
    setRoster((prev) => ({ ...prev, [id]: status }));
  };

  const presentCount = Object.values(roster).filter((s) => s === 'present').length;
  const lateCount = Object.values(roster).filter((s) => s === 'late').length;
  const absentCount = Object.values(roster).filter((s) => s === 'absent').length;
  const attendanceRate = Math.round(((presentCount + lateCount * 0.8) / students.length) * 100);

  const handleSave = () => {
    addToast({
      type: 'success',
      title: t('attendance.toast_saved_title'),
      message: `${t('attendance.toast_saved_msg')} (${presentCount} ${t('common.present')}, ${lateCount} ${t('common.late')}, ${absentCount} ${t('common.absent')}).`
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
        title={t('attendance.title')}
        subtitle={t('attendance.subtitle')}
      >
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Save size={15} />
          <span>{t('attendance.save_button')}</span>
        </button>
      </PageHeader>

      {/* Selector & Statistics bar */}
      <div className="bg-white dark:bg-[#111C32] p-4 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t('attendance.select_class')}</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-medium bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Grade 1 Phonics (ENG-G1-A)">Grade 1 Phonics (ENG-G1-A)</option>
              <option value="Grade 2 Explorers (ENG-G2-A)">Grade 2 Explorers (ENG-G2-A)</option>
              <option value="Grade 4 Discovery (ENG-G4-A)">Grade 4 Discovery (ENG-G4-A)</option>
              <option value="Grade 8 Pioneer (ENG-G8-B)">Grade 8 Pioneer (ENG-G8-B)</option>
              <option value="Grade 12 National Prep (ENG-G12-B)">Grade 12 National Prep (ENG-G12-B)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">{t('attendance.select_date')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('attendance.rate')}</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</p>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} /> {presentCount} <span className="hidden xs:inline">{t('common.present')}</span>
            </span>
            <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Clock size={13} /> {lateCount} <span className="hidden xs:inline">{t('common.late')}</span>
            </span>
            <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <XCircle size={13} /> {absentCount} <span className="hidden xs:inline">{t('common.absent')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
            {t('attendance.roster_title')} ({students.length} {t('common.student')})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('attendance.auto_sms_enabled')}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {students.map((st) => {
            const status = roster[st.id] || 'present';

            return (
              <div
                key={st.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {st.name} {st.khmerName && <span className="font-normal text-slate-500 dark:text-slate-400">({st.khmerName})</span>}
                    </p>
                    <p className="text-slate-400 text-[11px] truncate">
                      {st.id} • {st.grade} • {t('students.col_parent_guardian')}: {st.guardianPhone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => handleToggle(st.id, 'present')}
                    className={`min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-all ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>{t('attendance.mark_present')}</span>
                  </button>

                  <button
                    onClick={() => handleToggle(st.id, 'late')}
                    className={`min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-all ${
                      status === 'late'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700'
                    }`}
                  >
                    <Clock size={14} />
                    <span>{t('attendance.mark_late')}</span>
                  </button>

                  <button
                    onClick={() => handleToggle(st.id, 'absent')}
                    className={`min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-all ${
                      status === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700'
                    }`}
                  >
                    <XCircle size={14} />
                    <span>{t('attendance.mark_absent')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
};
