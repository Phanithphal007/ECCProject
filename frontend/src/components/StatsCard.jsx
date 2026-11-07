import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatsCard = ({ title, value, prefix = "", suffix = "", change, isPositive = true, timeframe = "vs last month", icon: Icon, color = "indigo" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter effect
  useEffect(() => {
    let start = 0;
    const end = parseFloat(String(value).replace(/,/g, ''));
    if (isNaN(end)) return;

    const duration = 800;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const colorVariants = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-950/60",
      text: "text-[#4338CA] dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/40"
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/60",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/40"
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/60",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/40"
    },
    violet: {
      bg: "bg-indigo-50 dark:bg-indigo-950/60",
      text: "text-[#4338CA] dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/40"
    }
  };

  const currentTheme = colorVariants[color] || colorVariants.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {prefix}
              {typeof value === 'number' || !isNaN(Number(value))
                ? displayValue.toLocaleString()
                : value}
              {suffix}
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-xl ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
            isPositive
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          {timeframe}
        </span>
      </div>
    </motion.div>
  );
};
