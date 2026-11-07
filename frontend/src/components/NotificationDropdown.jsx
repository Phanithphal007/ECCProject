import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { CheckCheck, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useApp } from '../context/useApp';

export const NotificationDropdown = ({ isOpen }) => {
  const { t } = useTranslation();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <AnimatePresence>
      <div className="absolute right-0 sm:right-0 top-12 z-50 w-[calc(100vw-24px)] max-w-xs sm:max-w-sm sm:w-96">
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-[#111C32] rounded-xl shadow-xl border border-slate-200 dark:border-[#29364D] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-white">
                {t('header.notifications')}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 font-semibold"
              >
                <CheckCheck size={14} />
                {t('header.mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1E293B]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {t('header.no_unread')}
              </div>
            ) : (
              notifications.map((item) => {
                let Icon = Info;
                let iconColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400';

                if (item.type === 'warning') {
                  Icon = AlertTriangle;
                  iconColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
                } else if (item.type === 'success') {
                  Icon = CheckCircle;
                  iconColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => markNotificationRead(item.id)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                      item.unread ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    {item.unread && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 text-center bg-slate-50 dark:bg-[#151E34] border-t border-slate-100 dark:border-[#1E293B]">
            <span className="text-xs text-slate-400">
              {t('header.system_title')}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
