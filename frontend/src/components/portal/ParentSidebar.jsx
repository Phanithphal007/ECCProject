import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckCircle2, 
  Activity, 
  BookOpen, 
  FileCheck, 
  CreditCard, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Globe,
  X
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { getOfficialStudentId } from '../../utils/studentId';

export const ParentSidebar = () => {
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
    currentUser,
    parentSelectedChildId,
    setParentChild,
    switchRole,
    announcements = []
  } = useApp();

  // Lock body scroll on mobile when drawer is open
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

  // Find linked children
  const linkedChildren = students.filter(
    (s) => s.id === 'STU-1020' || s.id === 'STU-1021' || s.guardianName?.includes('Kalyan') || s.guardianName?.includes('Sok')
  );

  const selectedChild = students.find((s) => s.id === parentSelectedChildId) || linkedChildren[0] || students[0];

  const unreadAnnouncements = announcements.filter(
    (a) => a.unread && (a.audience === 'All' || a.audience === 'Parents')
  ).length;

  const navigationItems = [
    { 
      id: 'parent-overview', 
      label: t('portal.dashboard', 'Child Overview'), 
      icon: LayoutDashboard 
    },
    { 
      id: 'parent-timetable', 
      label: t('portal.my_classes', 'Class Timetable'), 
      icon: Calendar 
    },
    { 
      id: 'parent-attendance', 
      label: t('portal.my_attendance', 'Attendance Records'), 
      icon: CheckCircle2 
    },
    { 
      id: 'parent-activities', 
      label: t('portal.my_activities', 'Classroom Activities'), 
      icon: Activity 
    },
    { 
      id: 'parent-academics', 
      label: t('portal.my_homework', 'Homework & Tests'), 
      icon: BookOpen 
    },
    { 
      id: 'parent-evaluations', 
      label: t('portal.evaluation_reports', 'Official Evaluation'), 
      icon: FileCheck 
    },
    { 
      id: 'parent-tuition', 
      label: t('portal.payment_history', 'Tuition & Invoices'), 
      icon: CreditCard 
    },
    { 
      id: 'parent-announcements', 
      label: t('portal.announcements', 'Announcements'), 
      icon: Bell,
      badge: unreadAnnouncements > 0 ? unreadAnnouncements : null
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (mobileMenuOpen) setMobileMenuOpen(false);
    const sub = tabId.replace('parent-', '');
    navigate(`/parent/${sub}`);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0F172A] text-slate-300 border-r border-[#1E293B] transition-all duration-300 ease-in-out lg:static shrink-0 ${
          mobileMenuOpen ? 'w-80 max-w-[85vw] translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B] bg-[#0B1120]">
          {(!sidebarCollapsed || mobileMenuOpen) ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                <Users size={18} />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight font-heading">
                    EduManage
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PARENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Family Learning Portal</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <Users size={18} />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button (44px touch target) */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Experience Switcher Pill */}
        <div className="lg:hidden p-3 border-b border-slate-800/80 bg-slate-900/60">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
            Switch Portal:
          </p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => { switchRole('admin'); setMobileMenuOpen(false); }}
              className={`py-2 text-center text-xs font-bold rounded-lg transition-all ${
                userRole === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => { switchRole('parent'); setMobileMenuOpen(false); }}
              className={`py-2 text-center text-xs font-bold rounded-lg transition-all ${
                userRole === 'parent' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Parent
            </button>
            <button
              onClick={() => { switchRole('student'); setMobileMenuOpen(false); }}
              className={`py-2 text-center text-xs font-bold rounded-lg transition-all ${
                userRole === 'student' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student
            </button>
          </div>
        </div>

        {/* Selected Child Pill / Switcher */}
        {(!sidebarCollapsed || mobileMenuOpen) && selectedChild && (
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t('portal.my_children', 'Active Child')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                {selectedChild.grade}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <img
                src={selectedChild.avatar}
                alt={selectedChild.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{selectedChild.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{selectedChild.khmerName ? `${selectedChild.khmerName} (${getOfficialStudentId(selectedChild)})` : getOfficialStudentId(selectedChild)}</p>
              </div>
            </div>

            {/* Child switcher pills with touch friendly target */}
            {linkedChildren.length > 1 && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5">
                {linkedChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setParentChild(child.id)}
                    className={`flex-1 text-[11px] py-1.5 px-2 min-h-[36px] rounded-lg text-center font-semibold transition-all truncate ${
                      child.id === selectedChild.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {child.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            const showLabel = !sidebarCollapsed || mobileMenuOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all group relative ${
                  isSelected
                    ? 'bg-[#4338CA] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
                title={!showLabel ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {showLabel && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {item.badge && showLabel && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}

                {isSelected && (
                  <motion.div
                    layoutId="activePortalIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Switch to Admin Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0B1120] space-y-2">
          {(!sidebarCollapsed || mobileMenuOpen) ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500/30"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-emerald-400 truncate font-medium">Guardian Account</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500/30"
              />
            </div>
          )}

          {/* Public Website Link */}
          <button
            onClick={() => {
              if (mobileMenuOpen) setMobileMenuOpen(false);
              navigate('/');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-700/70"
            title="Visit Public Website"
          >
            <Globe size={14} className="text-emerald-400 shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">Public Website</span>}
          </button>
        </div>
      </aside>
    </>
  );
};


