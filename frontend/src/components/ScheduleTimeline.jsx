import { motion } from 'motion/react';
import { Clock, MapPin, Users, Calendar } from 'lucide-react';
import { useApp } from '../context/useApp';

export const ScheduleTimeline = () => {
  const { classes, markAttendance, setActiveTab } = useApp();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" />
            Today's Class Schedule
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time classroom occupancy & active instructor sessions
          </p>
        </div>
        <button
          onClick={() => setActiveTab('classes')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
        >
          Full Timetable →
        </button>
      </div>

      <div className="space-y-3">
        {classes.map((cls, idx) => {
          const isLive = cls.status === 'In Progress';
          const isUpcoming = cls.status === 'Starting Soon';

          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`p-4 rounded-xl border transition-all ${
                isLive
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
              } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
            >
              <div className="flex items-start gap-3.5">
                <div className="relative">
                  <img
                    src={cls.teacherAvatar}
                    alt={cls.teacher}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shrink-0"
                  />
                  {isLive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {cls.title}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {cls.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Clock size={13} className="text-indigo-500" />
                      {cls.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {cls.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-slate-400" />
                      {cls.enrolled}/{cls.capacity} students
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action button */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    isLive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : isUpcoming
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cls.status}
                </span>

                <button
                  onClick={() => markAttendance(cls.id, 'Present count logged')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  Roster & Log
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
