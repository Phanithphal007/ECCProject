import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatisticCard = ({ title, value, subtitle, trend, isPositive = true, icon: Icon, color = "indigo" }) => {
  const colorMap = {
    indigo: {
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
      accent: "border-l-indigo-600 dark:border-l-indigo-400"
    },
    blue: {
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
      accent: "border-l-blue-600 dark:border-l-blue-400"
    },
    emerald: {
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
      accent: "border-l-emerald-600 dark:border-l-emerald-400"
    },
    amber: {
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
      accent: "border-l-amber-600 dark:border-l-amber-400"
    }
  };

  const theme = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`p-5 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-[#29364D] shadow-xs border-l-4 ${theme.accent} flex items-start justify-between gap-4 transition-colors`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider truncate">
          {title}
        </p>
        <p className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight mt-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">vs last term</span>
          </div>
        )}
      </div>

      <div className={`p-3 rounded-lg border ${theme.iconBg} shrink-0`}>
        <Icon size={22} className="stroke-[2.2]" />
      </div>
    </motion.div>
  );
};

