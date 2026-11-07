import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Award, 
  FileCheck, 
  CreditCard, 
  Bell, 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle, 
  Download, 
  Printer, 
  Sparkles, 
  Check, 
  ChevronRight,
  TrendingUp,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { EccEvaluationReport } from '../components/evaluation/EccEvaluationReport';
import { getOfficialStudentId } from '../utils/studentId';
import { formatSchedule, formatScheduleDays, formatScheduleTime } from '../utils/formatters';

export const ParentPortalView = () => {
  const { t, i18n } = useTranslation();
  const { 
    activeTab, 
    setActiveTab, 
    students = [], 
    classes = [], 
    attendanceRecords = [], 
    invoices = [], 
    announcements = [], 
    portalHomework = [],
    parentSelectedChildId, 
    setParentChild,
    currentUser,
    addToast
  } = useApp();

  const printRef = useRef(null);

  // Filter linked children strictly for this parent
  const linkedChildren = useMemo(() => {
    return students.filter(
      (s) => s.id === 'STU-1020' || s.id === 'STU-1021' || s.guardianName?.includes('Kalyan') || s.guardianName?.includes('Sok')
    );
  }, [students]);

  // Active selected child
  const activeChild = useMemo(() => {
    return linkedChildren.find((s) => s.id === parentSelectedChildId) || linkedChildren[0] || students[0];
  }, [linkedChildren, parentSelectedChildId, students]);

  // Child's enrolled classes
  const childClasses = useMemo(() => {
    if (!activeChild) return [];
    return classes.filter(
      (c) => c.enrolledStudentIds?.includes(activeChild.id) || c.id === 'CLS-G1-ALP' || c.name === activeChild.className
    );
  }, [activeChild, classes]);

  // Child's attendance history
  const childAttendance = useMemo(() => {
    if (!activeChild) return [];
    const records = attendanceRecords.filter((r) => r.studentId === activeChild.id);
    if (records.length > 0) return records;
    // Fallback recent attendance log if empty
    return [
      { id: 'att-1', date: '2026-11-04', classId: 'ENG-G5-A', status: 'Present', remarks: 'Active engagement in class' },
      { id: 'att-2', date: '2026-11-03', classId: 'ENG-G5-A', status: 'Present', remarks: 'Arrived on time' },
      { id: 'att-3', date: '2026-11-02', classId: 'ENG-G5-A', status: 'Present', remarks: 'Completed morning warm-up' },
      { id: 'att-4', date: '2026-10-31', classId: 'ENG-G5-A', status: 'Late', remarks: '10 min traffic delay' },
      { id: 'att-5', date: '2026-10-30', classId: 'ENG-G5-A', status: 'Present', remarks: 'Great reading pronunciation' }
    ];
  }, [activeChild, attendanceRecords]);

  // Calculate attendance percentage
  const attendanceRate = useMemo(() => {
    if (activeChild?.attendanceRate) return activeChild.attendanceRate;
    if (childAttendance.length === 0) return 96;
    const presentCount = childAttendance.filter((a) => a.status === 'Present').length;
    return Math.round((presentCount / childAttendance.length) * 100);
  }, [activeChild, childAttendance]);

  // Child's homework
  const childHomework = useMemo(() => {
    if (!activeChild) return [];
    const hw = portalHomework.filter((h) => h.studentId === activeChild.id);
    return hw.length > 0 ? hw : portalHomework;
  }, [activeChild, portalHomework]);

  // Child's invoices & fees
  const childInvoices = useMemo(() => {
    if (!activeChild) return [];
    const inv = invoices.filter((i) => i.studentId === activeChild.id || i.studentName === activeChild.name);
    if (inv.length > 0) return inv;
    return [
      {
        id: `INV-2026-${activeChild.id}`,
        studentId: activeChild.id,
        studentName: activeChild.name,
        term: 'Term 4 (Nov - Jan 2026)',
        amount: 95,
        dueDate: '2026-10-15',
        status: 'Paid',
        paidAt: '2026-10-12',
        method: 'ABA Bank Transfer'
      },
      {
        id: `INV-2027-${activeChild.id}-T1`,
        studentId: activeChild.id,
        studentName: activeChild.name,
        term: 'Term 1 (Feb - Apr 2027)',
        amount: 95,
        dueDate: '2026-11-30',
        status: 'Pending',
        method: 'Early Bird Rate'
      }
    ];
  }, [activeChild, invoices]);

  // Announcements targeted for parents
  const parentAnnouncements = useMemo(() => {
    return announcements.filter((a) => a.audience === 'All' || a.audience === 'Parents');
  }, [announcements]);

  // Print evaluation handler
  const handlePrintEvaluation = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    addToast({
      type: 'info',
      title: 'Preparing PDF Export',
      message: `Generating official ECC evaluation report for ${activeChild?.name}...`
    });
    setTimeout(() => {
      window.print();
    }, 600);
  };

  // Determine current active subview from activeTab or local tab
  const [internalTab, setInternalTab] = useState('overview');
  const currentSubTab = activeTab.startsWith('parent-') ? activeTab.replace('parent-', '') : internalTab;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & LINKED CHILDREN SWITCHER */}
      <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-[#29364D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {t('portal.parent_portal', 'Parent Learning Portal')}
              </span>
              <span className="text-xs text-slate-400">
                • {currentUser?.name || "Kalyan Meas"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('portal.family_dashboard', 'Family Learning Hub')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor academic attendance, classroom activities, evaluations and tuition for your linked children.
            </p>
          </div>

          {/* Linked Children Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 hidden sm:inline">
              {t('portal.select_child', 'Child')}:
            </span>
            {linkedChildren.map((child) => {
              const isSelected = child.id === activeChild?.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setParentChild(child.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <img
                    src={child.avatar}
                    alt={child.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{child.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {child.grade}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Child Hero Details Banner */}
        {activeChild && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-3.5">
              <img
                src={activeChild.avatar}
                alt={activeChild.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {activeChild.name}
                  </h3>
                  {activeChild.khmerName && (
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 font-khmer">
                      ({activeChild.khmerName})
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    {getOfficialStudentId(activeChild)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Class: <strong className="text-slate-700 dark:text-slate-200">{activeChild.className || "Junior Achievers"}</strong> • Teacher: <strong className="text-slate-700 dark:text-slate-200">{activeChild.teacher || "Teacher Sophea Heng"}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Academic Year</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">2026 - 2027</p>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">English Level</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{activeChild.englishLevel || 'Elementary'}</p>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tuition Status</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {activeChild.tuitionStatus || 'Paid'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. FOUR STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {attendanceRate}%
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp size={12} />
            <span>Excellent attendance standing</span>
          </div>
        </div>

        {/* Enrolled Classes */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Classes</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {childClasses.length || 2}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {childClasses[0]?.name || "English Primary"}
          </p>
        </div>

        {/* Recent Score / Evaluation */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Latest Assessment</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {activeChild?.recentScore || "95/100"}
          </p>
          <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Grade A • Passing Standard Met
          </p>
        </div>

        {/* Tuition Outstanding */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tuition Balance</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <CreditCard size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            $0.00
          </p>
          <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check size={12} /> Term 4 Fully Settled
          </p>
        </div>
      </div>

      {/* 3. NAVIGATION TAB PILLS (for in-page navigation if desired) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: t('portal.dashboard', 'Overview') },
          { id: 'timetable', label: t('portal.my_classes', 'Timetable & Teachers') },
          { id: 'attendance', label: t('portal.my_attendance', 'Attendance Records') },
          { id: 'activities', label: t('portal.my_activities', 'Activities') },
          { id: 'academics', label: t('portal.my_homework', 'Homework & Tests') },
          { id: 'evaluations', label: t('portal.evaluation_reports', 'Official Evaluation') },
          { id: 'tuition', label: t('portal.payment_history', 'Tuition & Invoices') },
          { id: 'announcements', label: t('portal.announcements', 'Announcements') }
        ].map((tab) => {
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setInternalTab(tab.id);
                setActiveTab(`parent-${tab.id}`);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. SUBVIEW CONTENT */}
      {currentSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Schedule Today & Homework Snapshot */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enrolled Classes Card */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-500" />
                    Enrolled English Classes
                  </h3>
                  <button
                    onClick={() => setActiveTab('parent-timetable')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    View Timetable <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {childClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            {cls.code || cls.id}
                          </span>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {cls.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {formatSchedule(cls) || "Monday – Friday • 08:00 AM – 09:30 AM"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {cls.studentLocation || cls.room || "Main Campus"}
                          </span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Teacher</span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {cls.teacher || activeChild.teacher}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Homework */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-500" />
                    Homework & Assignments
                  </h3>
                  <button
                    onClick={() => setActiveTab('parent-academics')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    All Tasks <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {childHomework.slice(0, 3).map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {hw.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {hw.subject} • Due: <strong>{hw.dueDate}</strong>
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          hw.status === 'Graded'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : hw.status === 'Submitted'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {hw.status} {hw.score ? `(${hw.score}/${hw.maxScore})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Announcements & Teacher Contact */}
            <div className="space-y-6">
              {/* School Announcements */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell size={16} className="text-amber-500" />
                    School Notices
                  </h3>
                  <button
                    onClick={() => setActiveTab('parent-announcements')}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {parentAnnouncements.slice(0, 3).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {ann.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{ann.date}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {i18n.language === 'km' && ann.titleKh ? ann.titleKh : ann.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {i18n.language === 'km' && ann.contentKh ? ann.contentKh : ann.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead Teacher Contact Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-indigo-800 shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Assigned Educator
                </span>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-white ring-2 ring-white/20">
                    SH
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {activeChild.teacher || "Teacher Sophea Heng"}
                    </h4>
                    <p className="text-xs text-indigo-200">Lead English Specialist</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-700/60 space-y-2 text-xs text-indigo-200">
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-indigo-400" />
                    <span>sophea.heng@ecc.edu.kh</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-indigo-400" />
                    <span>+855 12 888 777</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TIMETABLE & TEACHERS SUBVIEW */}
      {currentSubTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Weekly Timetable for {activeChild.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Official schedule of English class cohorts, days of study, lesson time, and instructors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {childClasses.map((cls, idx) => (
                <div
                  key={cls.id || idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {cls.code || cls.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {cls.academicYear || "2026-2027"}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {cls.name}
                  </h4>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>Days:</strong> {formatScheduleDays(cls.days) || "Monday – Friday"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>Time:</strong> {formatScheduleTime(cls.time) || "08:00 AM – 09:30 AM"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>Location:</strong> {cls.studentLocation || cls.room || "Classroom A-102"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>Assigned Teacher:</strong> {cls.teacher || activeChild.teacher}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. ATTENDANCE SUBVIEW */}
      {currentSubTab === 'attendance' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Attendance Records: {activeChild.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily classroom roll call logs recorded by English teachers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Rate:</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl">
                {attendanceRate}%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks / Notes</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {childAttendance.map((rec, i) => (
                  <tr key={rec.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {rec.classId || activeChild.className}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : rec.status === 'Excused'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {rec.status === 'Present' && <CheckCircle2 size={12} />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {rec.remarks || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {rec.recordedBy || activeChild.teacher}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CLASSROOM ACTIVITIES SUBVIEW */}
      {currentSubTab === 'activities' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Classroom Activities & Participation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hands-on interactive learning sessions, vocabulary games and reading circles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Grade 4 Vocabulary Spelling Relay",
                subject: "Vocabulary & Spelling",
                date: "Nov 04, 2026",
                participation: "Active",
                score: "100%",
                comment: "Demonstrated great speed and correct spelling of target words."
              },
              {
                title: "Oral Reading Circle: Short Stories",
                subject: "Reading Fluency",
                date: "Nov 02, 2026",
                participation: "Active",
                score: "95%",
                comment: "Good voice projection and correct punctuation pauses."
              },
              {
                title: "Interactive Grammar Puzzle: Verb Tenses",
                subject: "Grammar in Context",
                date: "Oct 28, 2026",
                participation: "Completed",
                score: "90%",
                comment: "Understood the difference between past simple and continuous."
              },
              {
                title: "Pair Dialogue Roleplay: At the Market",
                subject: "Speaking & Pronunciation",
                date: "Oct 25, 2026",
                participation: "Outstanding",
                score: "98%",
                comment: "Natural conversational replies and excellent tone."
              }
            ].map((act, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    {act.subject}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Score: {act.score}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {act.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {act.comment}
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Date: {act.date}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Participation: {act.participation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. HOMEWORK & ACADEMICS SUBVIEW */}
      {currentSubTab === 'academics' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Homework, Tasks & Assessment Results
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review assigned English exercises, due dates, scores and teacher feedback.
            </p>
          </div>

          <div className="space-y-3">
            {childHomework.map((hw) => (
              <div
                key={hw.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {hw.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{hw.classCode || hw.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {hw.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hw.instructions}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Assigned: {hw.assignedDate} • Due: <strong className="text-rose-500">{hw.dueDate}</strong>
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      hw.status === 'Graded'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                        : hw.status === 'Submitted'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200'
                    }`}
                  >
                    {hw.status}
                  </span>
                  {hw.score !== null && (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Score: {hw.score} / {hw.maxScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. OFFICIAL EVALUATION SUBVIEW */}
      {currentSubTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-500" />
                Official ECC Student Evaluation Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Cambodian English Learning Center progress report with teacher feedback.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrintEvaluation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Printer size={15} />
                <span>{t('evaluations.print_action', 'Print')}</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Download size={15} />
                <span>{t('evaluations.export_pdf', 'Export PDF')}</span>
              </button>
            </div>
          </div>

          {/* Render Official ECC Evaluation Report */}
          <div className="bg-slate-100 dark:bg-slate-900 p-4 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-x-auto">
            <div ref={printRef} className="w-full max-w-[850px] shadow-lg rounded-xl overflow-hidden bg-white">
              <EccEvaluationReport
                student={activeChild}
                academicYear="២០២៦- ២០២៧"
                courseLevel={activeChild.gradeKhmer || "សន្ទនាសម្រាប់បឋមទូទៅ"}
                termName="វគ្គទី ៤ បញ្ចប់វគ្គសិក្សា"
                reportDate="07/09/2026"
                mode="screen"
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. TUITION & INVOICES SUBVIEW */}
      {currentSubTab === 'tuition' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Course Tuition & Invoices
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official billing statement and payment receipts for {activeChild.name}.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Standard Course Fee</span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">$95.00 / Term</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Academic Term</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {childInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.id}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {inv.term}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      ${inv.amount}.00
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : inv.status === 'Pending'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {inv.status === 'Paid' && <Check size={12} />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.status === 'Paid' ? (
                        <button
                          onClick={() => {
                            addToast({
                              type: 'success',
                              title: 'Receipt Downloaded',
                              message: `Official receipt for ${inv.id} has been saved.`
                            });
                          }}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Due Soon</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. ANNOUNCEMENTS SUBVIEW */}
      {currentSubTab === 'announcements' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Official School Announcements
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official notifications, holiday advisories and academic notices from the center.
            </p>
          </div>

          <div className="space-y-4">
            {parentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {ann.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {i18n.language === 'km' && ann.titleKh ? ann.titleKh : ann.title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-khmer">
                  {i18n.language === 'km' && ann.contentKh ? ann.contentKh : ann.content}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Issued by: {ann.author}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Target: Parents & Guardians
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

