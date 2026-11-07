import { motion } from 'motion/react';

export const QuickActionCard = ({ title, description, icon: Icon, onClick, color = "indigo" }) => {
  const colors = {
    indigo: "hover:border-indigo-300 dark:hover:border-indigo-500/60 text-[#4338CA] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
    blue: "hover:border-blue-300 dark:hover:border-blue-500/60 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
    emerald: "hover:border-emerald-300 dark:hover:border-emerald-500/60 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
    amber: "hover:border-amber-300 dark:hover:border-amber-500/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
  };

  const current = colors[color] || colors.indigo;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-[#29364D] shadow-xs flex items-center gap-3.5 text-left w-full transition-all group cursor-pointer select-none`}
      aria-label={typeof title === 'string' ? title : 'Quick Action'}
    >
      <div className={`p-2.5 rounded-lg shrink-0 group-hover:scale-105 transition-transform pointer-events-none ${current}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 pointer-events-none flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC] group-hover:text-[#4338CA] dark:group-hover:text-indigo-400 transition-colors truncate">
          {title}
        </p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-[#94A3B8] truncate mt-0.5">
            {description}
          </p>
        )}
      </div>
    </motion.button>
  );
};

