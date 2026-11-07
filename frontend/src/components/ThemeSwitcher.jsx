import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeSwitcher = ({ variant = 'dropdown', className = '' }) => {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    {
      id: 'light',
      label: t('theme.light'),
      shortLabel: t('theme.light_short'),
      desc: t('theme.light_desc'),
      icon: Sun,
      iconColor: 'text-amber-500'
    },
    {
      id: 'dark',
      label: t('theme.dark'),
      shortLabel: t('theme.dark_short'),
      desc: t('theme.dark_desc'),
      icon: Moon,
      iconColor: 'text-indigo-400'
    },
    {
      id: 'system',
      label: t('theme.system'),
      shortLabel: t('theme.system_short'),
      desc: t('theme.system_desc'),
      icon: Monitor,
      iconColor: 'text-slate-400'
    }
  ];

  // Active icon based on user setting or resolved
  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  // Segmented card selector for Settings view
  if (variant === 'cards' || variant === 'segmented') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#151E34] hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-lg ${
                  isSelected 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <Icon size={18} />
                </div>
                {isSelected && (
                  <span className="p-1 rounded-full bg-indigo-600 text-white text-xs">
                    <Check size={12} className="stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{opt.label}</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {opt.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Header Dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer relative"
        title={`${t('theme.switch_theme')} (${t(`theme.${theme}_short`)})`}
        aria-label={t('theme.switch_theme')}
        aria-expanded={isOpen}
      >
        <CurrentIcon size={18} className="transition-transform duration-200 active:scale-90" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-[#111C32] rounded-xl shadow-xl border border-slate-200 dark:border-[#29364D] py-1.5 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-white">
              {t('theme.theme')}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {resolvedTheme}
            </span>
          </div>

          <div className="py-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 flex items-center justify-between transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={opt.iconColor} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;

