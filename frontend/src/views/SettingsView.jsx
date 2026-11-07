import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Building2, 
  Bell, 
  Save,
  Palette
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useApp } from '../context/useApp';

export const SettingsView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();

  const [centerData, setCenterData] = useState({
    name: 'ECC English Center Cambodia',
    code: 'ECC-PP-01',
    address: 'St. 271, Sangkat Boeung Tumpun, Khan Mean Chey, Phnom Penh, Cambodia',
    hotline: '+855 12 345 678',
    email: 'info@edumanage.kh',
    gradesCovered: 'Grade 1 through Grade 12',
    termFormat: 'Quarterly (3-Month Terms)',
    autoAbsenceSMS: true,
    weeklyDigestTelegram: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: t('settings.toast_saved'),
      message: t('settings.toast_saved_msg')
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      >
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Save size={14} />
          <span>{t('settings.save_settings')}</span>
        </button>
      </PageHeader>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Appearance & Interface Theme */}
        <div className="bg-white dark:bg-[#111C32] p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Palette size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('theme.title')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('theme.subtitle')}
              </p>
            </div>
          </div>

          <ThemeSwitcher variant="cards" />
        </div>

        {/* Center Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 size={16} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {t('settings.general_settings')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('settings.center_name')}</label>
              <input
                type="text"
                value={centerData.name}
                onChange={(e) => setCenterData({ ...centerData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('classes.cohort')}</label>
              <input
                type="text"
                value={centerData.code}
                onChange={(e) => setCenterData({ ...centerData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('settings.phone')}</label>
              <input
                type="text"
                value={centerData.hotline}
                onChange={(e) => setCenterData({ ...centerData, hotline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('settings.email')}</label>
              <input
                type="email"
                value={centerData.email}
                onChange={(e) => setCenterData({ ...centerData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">{t('settings.campus')}</label>
              <input
                type="text"
                value={centerData.address}
                onChange={(e) => setCenterData({ ...centerData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Parent Communication & Automated Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell size={16} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {t('settings.notifications_settings')}
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-start justify-between cursor-pointer gap-4">
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  {t('settings.auto_sms')}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Telegram & SMS
                </p>
              </div>
              <input
                type="checkbox"
                checked={centerData.autoAbsenceSMS}
                onChange={(e) => setCenterData({ ...centerData, autoAbsenceSMS: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded mt-1"
              />
            </label>
          </div>
        </div>
      </form>
    </motion.div>
  );
};
