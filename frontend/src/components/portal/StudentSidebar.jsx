import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckCircle2, 
  Activity, 
  BookOpen, 
  Award,
  FileCheck, 
  CreditCard, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Globe,
  Flame,
  X
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { getOfficialStudentId } from '../../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../../constants/avatars';

export const StudentSidebar = () => {
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
    portalHomework = [],
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

  const currentStudent = students.find((s) => s.id === 'STU-1020') || students[0];

  const pendingHomeworkCount = portalHomework.filter(
    (h) => h.studentId === currentStudent?.id && h.status === 'Pending'
  ).length;

  const unreadAnnouncements = announcements.filter(
    (a) => a.unread && (a.audience === 'All' || a.audience === 'Students')
  ).length;

  const navigationItems = [
    { 
      id: 'student-overview', 
      label: t('portal.dashboard', 'My Learning Space'), 
      icon: LayoutDashboard 
    },
    { 
      id: 'student-timetable', 
      label: t('portal.my_classes', 'My Timetable & Classes'), 
      icon: Calendar 
    },
    { 
      id: 'student-attendance', 
      label: t('portal.my_attendance', 'My Attendance'), 
      icon: CheckCircle2 
    },
    { 
      id: 'student-activities', 
      label: t('portal.my_activities', 'Classroom Activities'), 
      icon: Activity 
    },
    { 
      id: 'student-homework', 
      label: t('portal.my_homework', 'Homework & Assignments'), 
      icon: BookOpen,
      badge: pendingHomeworkCount > 0 ? pendingHomeworkCount : null,
      badgeColor: 'bg-amber-500'
    },
    { 
      id: 'student-assessments', 
      label: t('portal.my_assessments', 'Test Scores & Skills'), 
      icon: Award 
    },
    { 
      id: 'student-evaluations', 
      label: t('portal.evaluation_reports', 'Teacher Evaluations'), 
      icon: FileCheck 
    },
    { 
      id: 'student-tuition', 
      label: t('portal.payment_history', 'Tuition & Fees'), 
      icon: CreditCard 
    },
    { 
      id: 'student-announcements', 
      label: t('portal.announcements', 'Announcements'), 
      icon: Bell,
      badge: unreadAnnouncements > 0 ? unreadAnnouncements : null
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (mobileMenuOpen) setMobileMenuOpen(false);
    const sub = tabId.replace('student-', '');
    navigate(`/student/${sub}`);
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B132B] text-slate-300 border-r border-[#1C2541] transition-all duration-300 ease-in-out lg:static shrink-0 ${
          mobileMenuOpen ? 'w-80 max-w-[85vw] translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1C2541] bg-[#070B19]">
          {(!sidebarCollapsed || mobileMenuOpen) ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                <GraduationCap size={18} />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight font-heading">
                    EduManage
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    STUDENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Personal Student Portal</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <GraduationCap size={18} />
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

        {/* Student Profile Card in Sidebar */}
        {(!sidebarCollapsed || mobileMenuOpen) && currentStudent && (
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={getStudentAvatarUrl(currentStudent.avatar)}
                  alt={currentStudent.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/50 bg-slate-800"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-400 rounded-md text-slate-950 font-bold shadow-xs">
                  <Flame size={10} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{currentStudent.name}</p>
                </div>
                <p className="text-[10px] text-indigo-300 truncate font-mono">{getOfficialStudentId(currentStudent)} • {currentStudent.grade}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Learner
                </p>
              </div>
            </div>
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
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-rose-500'}`}>
                    {item.badge}
                  </span>
                )}

                {isSelected && (
                  <motion.div
                    layoutId="activeStudentPortalIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Switch to Admin Footer */}
        <div className="p-3 border-t border-[#1C2541] bg-[#070B19] space-y-2">
          {(!sidebarCollapsed || mobileMenuOpen) ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/40">
                DS
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || "Dara Sok"}</p>
                <p className="text-[10px] text-indigo-300 truncate">Student Access Mode</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/40">
                DS
              </div>
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
            <Globe size={14} className="text-indigo-400 shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">Public Website</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

