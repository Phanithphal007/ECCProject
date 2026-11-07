import { motion } from 'motion/react';
import { Award, Target } from 'lucide-react';

export const PerformanceChart = () => {
  const bands = [
    { band: 'Band 5.5 - 6.0', level: 'B2 Lower', count: 184, percent: 18, color: 'bg-slate-400 dark:bg-slate-600' },
    { band: 'Band 6.5', level: 'B2 Upper', count: 412, percent: 36, color: 'bg-blue-500' },
    { band: 'Band 7.0', level: 'C1 Effective', count: 358, percent: 28, color: 'bg-indigo-600' },
    { band: 'Band 7.5 - 8.0', level: 'C1 Advanced', count: 215, percent: 15, color: 'bg-emerald-500' },
    { band: 'Band 8.5+', level: 'C2 Mastery', count: 43, percent: 3, color: 'bg-amber-500' }
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-indigo-500" />
              IELTS & CEFR Performance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current proficiency distribution across active enrolled cohorts
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            Avg: Band 6.85
          </span>
        </div>

        {/* Bar breakdown list */}
        <div className="space-y-3.5 mt-5">
          {bands.map((item, idx) => (
            <div
              key={item.band}
              className="group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.band}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({item.level})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {item.count} students
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                    {item.percent}%
                  </span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent * 2.5}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-full ${item.color} group-hover:brightness-110 transition-all`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Benchmark Footer */}
      <div className="mt-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-300">
            Center Q4 Target: <strong className="text-slate-900 dark:text-white">82% at Band 7.0+</strong>
          </span>
        </div>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          On Track (82.4%)
        </span>
      </div>
    </div>
  );
};
