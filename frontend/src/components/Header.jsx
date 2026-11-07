import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  UserPlus, 
  ChevronDown, 
  LogOut, 
  Settings as SettingsIcon,
  Globe,
  User
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { NotificationDropdown } from './NotificationDropdown';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    activeTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    setIsAddStudentOpen,
    setIsCommandPaletteOpen,
    notifications,
    addToast,
    userRole,
    currentUser,
    parentSelectedChildId,
    students = [],
    logout
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const currentLocale = i18n.language === 'km' ? 'km-KH' : 'en-US';

  const today = new Intl.DateTimeFormat(currentLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getHeaderTitle = () => {
    if (userRole === 'parent') {
      const child = students.find(s => s.id === parentSelectedChildId);
      return child ? `Parent Portal: ${child.name}` : 'Parent Learning Portal';
    }
    if (userRole === 'student') {
      return 'Student Learning Space';
    }
    return t(`header.${activeTab}`, t(`nav.${activeTab}`, 'Dashboard'));
  };

  const tabTitle = getHeaderTitle();

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    if (logout) {
      logout();
    }
    addToast({
      type: 'info',
      title: t('header.sign_out', 'Signed Out'),
      message: 'You have been securely signed out.'
    });
    navigate('/login');
  };

  const handleGoToProfile = () => {
    setIsUserMenuOpen(false);
    if (userRole === 'parent') navigate('/parent/profile');
    else if (userRole === 'student') navigate('/student/profile');
    else navigate('/admin/settings');
  };

  const handleGoToSettings = () => {
    setIsUserMenuOpen(false);
    if (userRole === 'parent') navigate('/parent/settings');
    else if (userRole === 'student') navigate('/student/settings');
    else navigate('/admin/settings');
  };

  return (
    <header className="shrink-0 sticky top-0 z-30 h-16 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-[#29364D] px-2.5 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Clean Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Toggle mobile menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 max-w-[160px] xs:max-w-[200px] sm:max-w-sm md:max-w-md">
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {tabTitle}
          </h1>
          <p className="text-xs text-slate-500 hidden md:block truncate">
            {today} • {t('header.system_title', 'ECC English Learning Center')}
          </p>
        </div>
      </div>

      {/* Middle: Command Search shortcut (Clean input, NO role switcher) */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4 lg:mx-8">
        {userRole === 'admin' ? (
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
          >
            <span className="flex items-center gap-2 truncate">
              <Search size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{t('header.search_placeholder', 'Search classes, students, schedules...')}</span>
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 shrink-0">
              ⌘K
            </kbd>
          </button>
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic hidden lg:block">
            ECC Learning Management System
          </div>
        )}
      </div>

      {/* Right: Actions, Language Switcher, Theme Switcher, Notifications, User */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button (Admin mode) */}
        {userRole === 'admin' && (
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="md:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Search"
            aria-label="Search"
          >
            <Search size={17} />
          </button>
        )}

        {/* Public Website Shortcut */}
        <button
          onClick={() => navigate('/')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          title="Visit Public Website"
        >
          <Globe size={13} className="text-indigo-600 dark:text-indigo-400" />
          <span className="hidden lg:inline">{t('nav.public_website', 'Public Website')}</span>
        </button>

        {/* Theme Switcher (Light / Dark / System) */}
        <ThemeSwitcher />

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Register Student Quick Action (Admin mode on sm+ screens) */}
        {userRole === 'admin' && (
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#4338CA] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <UserPlus size={14} />
            <span>{t('header.register_student')}</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            aria-label={t('header.notifications')}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
          <NotificationDropdown isOpen={isNotifOpen} />
        </div>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="User account menu"
          >
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
            />
            <div className="hidden xl:block text-left text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-none">
                {currentUser?.name || 'Sophea Heng'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentUser?.title || t('header.academic_head')}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden xl:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 max-w-[calc(100vw-24px)] bg-white dark:bg-[#111C32] rounded-xl shadow-xl border border-slate-200 dark:border-[#29364D] py-1.5 text-xs">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-[#1E293B]">
                <p className="font-semibold text-slate-800 dark:text-white">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {currentUser?.email}
                </p>
              </div>

              {/* Navigation links inside profile menu */}
              <div className="py-1">
                <button
                  onClick={handleGoToProfile}
                  className="w-full px-3.5 py-2 min-h-[40px] flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <User size={14} className="text-slate-400" />
                  <span>{t('nav.my_profile', 'My Profile')}</span>
                </button>

                <button
                  onClick={handleGoToSettings}
                  className="w-full px-3.5 py-2 min-h-[40px] flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <SettingsIcon size={14} className="text-slate-400" />
                  <span>{t('nav.settings', 'Settings')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full px-3.5 py-2 min-h-[40px] flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <Globe size={14} className="text-indigo-500" />
                  <span>{t('nav.public_website', 'Public Website')}</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-[#1E293B] pt-1 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 min-h-[40px] flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left font-medium transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{t('header.sign_out', 'Sign Out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
