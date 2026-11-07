import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Globe } from 'lucide-react';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] flex flex-col justify-between transition-colors duration-200">
      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200/80 dark:border-[#1E293B] bg-white/80 dark:bg-[#111C32]/80 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4338CA] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-heading block">
              ECC EduManage
            </span>
            <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
              English Learning Center
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
          >
            <ArrowLeft size={14} />
            <span>Public Website</span>
          </Link>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/90 dark:border-[#29364D] shadow-xl p-6 sm:p-8">
          {title && (
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-[#1E293B]">
        <p>© 2026 ECC English Learning Center. All rights reserved.</p>
      </footer>
    </div>
  );
};

