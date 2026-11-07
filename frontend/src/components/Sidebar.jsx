import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  Activity, 
  ClipboardCheck,
  Award,
  CreditCard, 
  BarChart3, 
  UserCog, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  BookMarked,
  ChevronDown,
  CalendarClock,
  X,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useApp } from '../context/useApp';

export const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    students,
    subjects = [],
    invoices,
    userRole
  } = useApp();

  // Lock body scroll on mobile when drawer is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // Collapsible groups state
  const [collapsedGroups, setCollapsedGroups] = useState({
    academics: false,
    admin: false
  });

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

  const navigationSections = [
    {
      id: 'core',
      title: null,
      items: [
        { 
          id: 'dashboard', 
          label: t('nav.dashboard'), 
          icon: LayoutDashboard 
        }
      ]
    },
    {
      id: 'academics',
      title: t('nav.academics_section'),
      items: [
        { 
          id: 'students', 
          label: t('nav.students'), 
          icon: Users, 
          badge: students.length 
        },
        { 
          id: 'teachers', 
          label: t('nav.teachers'), 
          icon: GraduationCap, 
          badge: `18 ${t('nav.active_badge')}` 
        },
        { 
          id: 'teacher-schedules', 
          label: t('nav.teacher_schedules', 'Teacher Schedules'), 
          icon: CalendarClock 
        },
        { 
          id: 'classes', 
          label: t('nav.classes'), 
          icon: Calendar, 
          badge: `26 ${t('nav.classes_badge')}` 
        },
        { 
          id: 'attendance', 
          label: t('nav.attendance', 'Attendance'), 
          icon: ClipboardCheck 
        },
        { 
          id: 'subjects', 
          label: t('nav.subjects', 'English Subjects'), 
          icon: BookMarked, 
          badge: `${subjects.length} ${t('common.subjects', 'Subjects')}` 
        },
        { 
          id: 'activities', 
          label: t('nav.activities'), 
          icon: Activity 
        },
        { 
          id: 'assessments', 
          label: t('nav.assessments', 'Assessments & Scores'), 
          icon: Award 
        }
      ]
    },
    {
      id: 'admin',
      title: t('nav.admin_section'),
      items: [
        { 
          id: 'financials', 
          label: t('nav.financials'), 
          icon: CreditCard, 
          badge: overdueCount > 0 ? `${overdueCount} ${t('nav.overdue_badge')}` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        },
        { 
          id: 'reports', 
          label: t('nav.reports'), 
          icon: BarChart3 
        },
        { 
          id: 'users', 
          label: t('nav.users'), 
          icon: UserCog 
        },
        { 
          id: 'settings', 
          label: t('nav.settings'), 
          icon: Settings 
        }
      ]
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (mobileMenuOpen) setMobileMenuOpen(false);
    navigate(`/admin/${tabId}`);
  };

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-[#0F172A] dark:bg-[#080E1C] text-slate-300 select-none transition-colors duration-200">
        {/* Brand Header */}
        <div className="shrink-0 p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800/80 dark:border-[#1E293B]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0 border border-slate-700/50">
              <img src="/assets/ecc-logo.png" alt="ECC Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">
                    EduManage
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Cambodia
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal truncate">{t('nav.brand_sub')}</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button (44px touch target) */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-4">
            {navigationSections.filter((sec) => sec.items && sec.items.length > 0).map((sec) => (
              <div key={sec.id} className="space-y-1">
                {!isCollapsed && sec.title && (
                  <button
                    onClick={() => toggleGroup(sec.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 shrink-0 ${
                        collapsedGroups[sec.id] ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>
                )}

                {/* Items */}
                <AnimatePresence initial={false}>
                  {(!collapsedGroups[sec.id] || isCollapsed) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-0.5"
                    >
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full relative flex items-center justify-between px-3 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-sm transition-all group ${
                              isActive
                                ? 'text-white bg-[#4338CA] shadow-sm font-semibold'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium'
                            }`}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <Icon
                                size={18}
                                className={`shrink-0 transition-colors ${
                                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                                }`}
                              />
                              {!isCollapsed && (
                                <span
                                  className={`truncate text-xs ${
                                    isActive
                                      ? 'font-semibold text-white'
                                      : 'font-medium text-slate-400 group-hover:text-slate-100'
                                  }`}
                                >
                                  {item.label}
                                </span>
                              )}
                            </div>

                            {!isCollapsed && item.badge && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ml-2 ${
                                  item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        {/* Footer Profile & Public Link */}
        <div className="shrink-0 p-3 border-t border-slate-800/80 dark:border-[#1E293B] bg-[#0B1329] dark:bg-[#060B17] transition-colors duration-200 space-y-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-[#4338CA] flex items-center justify-center font-bold text-white text-xs shrink-0 ring-2 ring-indigo-400/30">
                SH
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  Sophea Hang
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {t('header.academic_head', 'Center Academic Head')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-[#4338CA] flex items-center justify-center font-bold text-white text-xs">
                SH
              </div>
            </div>
          )}

          {/* Public Website Link */}
          <button
            onClick={() => {
              if (mobileMenuOpen) setMobileMenuOpen(false);
              navigate('/');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 min-h-[38px] rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-700/70 cursor-pointer"
            title="Visit Public Website"
          >
            <Globe size={14} className="text-indigo-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Public Website</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-full transition-all duration-300 z-20 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#0b1329] z-50 shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

};
