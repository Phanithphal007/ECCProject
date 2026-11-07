import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  Clock, 
  FileText, 
  Star, 
  Flame, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Upload, 
  Send, 
  Activity, 
  Bell, 
  Check, 
  TrendingUp, 
  MapPin, 
  GraduationCap, 
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { EccEvaluationReport } from '../components/evaluation/EccEvaluationReport';
import { getOfficialStudentId } from '../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';
import { formatSchedule, formatScheduleDays, formatScheduleTime } from '../utils/formatters';

export const StudentPortalView = () => {
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
    submitStudentHomework,
    addToast 
  } = useApp();

  // Student is strictly Dara Sok STU-1020
  const student = useMemo(() => {
    return students.find((s) => s.id === 'STU-1020') || students[0];
  }, [students]);

  // Student's enrolled classes
  const myClasses = useMemo(() => {
    if (!student) return [];
    return classes.filter(
      (c) => c.enrolledStudentIds?.includes(student.id) || c.id === 'CLS-G1-ALP' || c.name === student.className
    );
  }, [student, classes]);

  // Student's personal attendance history
  const myAttendance = useMemo(() => {
    if (!student) return [];
    const records = attendanceRecords.filter((r) => r.studentId === student.id);
    if (records.length > 0) return records;
    return [
      { id: 'att-1', date: '2026-11-04', classId: 'ENG-G5-A', status: 'Present', remarks: 'Arrived early and engaged' },
      { id: 'att-2', date: '2026-11-03', classId: 'ENG-G5-A', status: 'Present', remarks: 'Participated in reading circles' },
      { id: 'att-3', date: '2026-11-02', classId: 'ENG-G5-A', status: 'Present', remarks: 'Active learner' },
      { id: 'att-4', date: '2026-10-31', classId: 'ENG-G5-A', status: 'Late', remarks: '5 min traffic delay' },
      { id: 'att-5', date: '2026-10-30', classId: 'ENG-G5-A', status: 'Present', remarks: 'Mastered spelling test' }
    ];
  }, [student, attendanceRecords]);

  // Attendance Rate
  const attendanceRate = useMemo(() => {
    if (student?.attendanceRate) return student.attendanceRate;
    if (myAttendance.length === 0) return 98;
    const presentCount = myAttendance.filter((a) => a.status === 'Present').length;
    return Math.round((presentCount / myAttendance.length) * 100);
  }, [student, myAttendance]);

  // Student's personal homework tasks
  const myHomework = useMemo(() => {
    return portalHomework.filter((h) => h.studentId === 'STU-1020');
  }, [portalHomework]);

  // Student announcements
  const studentAnnouncements = useMemo(() => {
    return announcements.filter((a) => a.audience === 'All' || a.audience === 'Students');
  }, [announcements]);

  // Interactive Homework Submission Modal State
  const [selectedHwToSubmit, setSelectedHwToSubmit] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');

  const handleOpenSubmitModal = (hw) => {
    setSelectedHwToSubmit(hw);
    setSubmissionText('');
    setSubmissionFileName('');
  };

  const handleCloseSubmitModal = () => {
    setSelectedHwToSubmit(null);
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!selectedHwToSubmit) return;

    submitStudentHomework(selectedHwToSubmit.id, {
      text: submissionText || 'Completed assignment',
      fileName: submissionFileName || 'homework_solution.pdf'
    });

    handleCloseSubmitModal();
  };

  // Determine current active subview
  const [internalTab, setInternalTab] = useState('overview');
  const currentSubTab = activeTab.startsWith('student-') ? activeTab.replace('student-', '') : internalTab;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. STUDENT HERO BANNER */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#1E293B] text-white overflow-hidden shadow-xl border border-indigo-500/20">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={getStudentAvatarUrl(student.avatar)}
                alt={student.name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-indigo-400/30 shadow-xl bg-slate-800"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                }}
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 rounded-lg text-slate-950 font-bold shadow-md">
                <Flame size={14} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-indigo-100">
                  {getOfficialStudentId(student)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Active Learner
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/30 text-indigo-200">
                  {student.grade}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-2">
                {student.name}
                {student.khmerName && (
                  <span className="text-lg font-medium text-indigo-200 font-khmer">
                    ({student.khmerName})
                  </span>
                )}
              </h2>
              <p className="text-sm text-indigo-200 mt-0.5">
                Class: <strong className="text-white">{student.className || "Junior Achievers"}</strong> • Teacher: <strong className="text-white">{student.teacher}</strong>
              </p>
            </div>
          </div>

          {/* English Proficiency Journey Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-white/15">
            <div className="text-center">
              <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Current Level</span>
              <p className="text-xl sm:text-2xl font-black text-white">{student.englishLevel || 'Level 2'}</p>
            </div>
            <div className="text-indigo-300 font-bold text-xl px-1">→</div>
            <div className="text-center">
              <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Target Goal</span>
              <p className="text-xl sm:text-2xl font-black text-amber-300">Level 4</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOUR STATISTIC CARDS */}
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
            <span>5 consecutive days present</span>
          </div>
        </div>

        {/* Pending Homework */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Homework Due</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {myHomework.filter((h) => h.status === 'Pending').length}
          </p>
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Due this week
          </p>
        </div>

        {/* Latest Test Score */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Test Score</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {student.recentScore || "95/100"}
          </p>
          <p className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            Grade A • Top 5% in Cohort
          </p>
        </div>

        {/* Learning Streak */}
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#29364D] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Learning Streak</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Flame size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            14 Days
          </p>
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <Sparkles size={12} /> Super Student Badge
          </p>
        </div>
      </div>

      {/* 3. NAVIGATION TAB PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: t('portal.dashboard', 'My Learning') },
          { id: 'timetable', label: t('portal.my_classes', 'My Timetable & Classes') },
          { id: 'attendance', label: t('portal.my_attendance', 'My Attendance') },
          { id: 'activities', label: t('portal.my_activities', 'Class Activities') },
          { id: 'homework', label: t('portal.my_homework', 'Homework & Submit') },
          { id: 'assessments', label: t('portal.my_assessments', 'Test Scores') },
          { id: 'evaluations', label: t('portal.evaluation_reports', 'Teacher Evaluations') },
          { id: 'tuition', label: t('portal.payment_history', 'Tuition & Fees') },
          { id: 'announcements', label: t('portal.announcements', 'Announcements') }
        ].map((tab) => {
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setInternalTab(tab.id);
                setActiveTab(`student-${tab.id}`);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
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
            {/* Left 2 Cols: Today's English Schedule & Skill Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* English Schedule */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-500" />
                    My Enrolled Classes & Schedule
                  </h3>
                  <button
                    onClick={() => setActiveTab('student-timetable')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    View Timetable <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {myClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                            {cls.code || cls.id}
                          </span>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {cls.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <Clock size={12} /> {formatSchedule(cls) || "Monday – Friday • 08:00 AM – 09:30 AM"}
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Teacher</span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {cls.teacher || student.teacher}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Four Skills Mastery Radar */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Award size={16} className="text-indigo-500" />
                    English 4-Skills Mastery
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                    Overall: Level 2+
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { skill: 'Reading & Comprehension', score: 92, target: 100, trend: '+4 pts' },
                    { skill: 'Grammar & Writing', score: 88, target: 100, trend: '+6 pts' },
                    { skill: 'Listening & Pronunciation', score: 95, target: 100, trend: '+2 pts' },
                    { skill: 'Speaking & Fluency', score: 90, target: 100, trend: '+5 pts' },
                  ].map((s, idx) => (
                    <div key={s.skill} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.skill}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">{s.score}%</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                            {s.trend}
                          </span>
                        </div>
                      </div>

                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Homework Quick Actions & Announcements */}
            <div className="space-y-6">
              {/* Upcoming Homework */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-500" />
                    Homework Tasks
                  </h3>
                  <button
                    onClick={() => setActiveTab('student-homework')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {myHomework.slice(0, 3).map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {hw.subject}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hw.status === 'Submitted'
                            ? 'bg-blue-50 text-blue-600'
                            : hw.status === 'Graded'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {hw.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {hw.title}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">Due: {hw.dueDate}</span>
                        {hw.status === 'Pending' && (
                          <button
                            onClick={() => handleOpenSubmitModal(hw)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Upload size={12} /> Submit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Announcements */}
              <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Bell size={16} className="text-indigo-500" />
                  School Notices
                </h3>

                <div className="space-y-3">
                  {studentAnnouncements.slice(0, 2).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60"
                    >
                      <span className="text-[10px] font-bold text-indigo-500">{ann.category} • {ann.date}</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {i18n.language === 'km' && ann.titleKh ? ann.titleKh : ann.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TIMETABLE SUBVIEW */}
      {currentSubTab === 'timetable' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              My Class Schedule & Timetable
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Weekly class timetable, teacher contact, and classroom locations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
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
                    <Calendar size={14} className="text-indigo-500 shrink-0" />
                    <span><strong>Days:</strong> {formatScheduleDays(cls.days) || "Monday – Friday"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500 shrink-0" />
                    <span><strong>Time:</strong> {formatScheduleTime(cls.time) || "08:00 AM – 09:30 AM"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-500 shrink-0" />
                    <span><strong>Room:</strong> {cls.studentLocation || cls.room || "Classroom 101"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-indigo-500 shrink-0" />
                    <span><strong>Teacher:</strong> {cls.teacher || student.teacher}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ATTENDANCE SUBVIEW */}
      {currentSubTab === 'attendance' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                My Attendance History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check daily records of attendance and punctuality.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Rate:</span>
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
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myAttendance.map((rec, i) => (
                  <tr key={rec.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {rec.classId || student.className}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-600'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {rec.status === 'Present' && <CheckCircle2 size={12} />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {rec.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CLASSROOM ACTIVITIES */}
      {currentSubTab === 'activities' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              My Classroom Activities & Quizzes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review games, team exercises, and daily classroom challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Vocabulary Spelling Relay Game",
                subject: "Vocabulary & Spelling",
                date: "Nov 04, 2026",
                score: "100%",
                feedback: "Fastest response time and zero spelling mistakes!"
              },
              {
                title: "Reading Circle: 'The Secret Garden'",
                subject: "Reading Fluency",
                date: "Nov 02, 2026",
                score: "95%",
                feedback: "Expressive reading and good phonics pronunciation."
              },
              {
                title: "Past Tense Action Cards Challenge",
                subject: "Grammar",
                date: "Oct 28, 2026",
                score: "92%",
                feedback: "Accurately converted 15 irregular verbs into past tense."
              },
              {
                title: "English Dialogue: Introduce Your Favorite Hobby",
                subject: "Speaking Practice",
                date: "Oct 25, 2026",
                score: "98%",
                feedback: "Confident body language and clear sentences."
              }
            ].map((act, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
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
                  {act.feedback}
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400">
                  Date: {act.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. HOMEWORK & SUBMISSION SUBVIEW */}
      {currentSubTab === 'homework' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Assigned Homework & Online Submission
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete your English homework and submit directly for teacher feedback.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {myHomework.filter((h) => h.status === 'Submitted' || h.status === 'Graded').length} of {myHomework.length} Completed
            </span>
          </div>

          <div className="space-y-4">
            {myHomework.map((hw) => (
              <div
                key={hw.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {hw.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{hw.classCode || hw.id}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {hw.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {hw.instructions}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Assigned: {hw.assignedDate}</span>
                    <span>•</span>
                    <span>Due: <strong className="text-rose-500 font-semibold">{hw.dueDate}</strong></span>
                    <span>•</span>
                    <span>Teacher: {hw.teacher}</span>
                  </div>

                  {hw.status === 'Submitted' && hw.submittedAt && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      ✓ Submitted on {new Date(hw.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center md:flex-col items-end gap-3 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      hw.status === 'Graded'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : hw.status === 'Submitted'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {hw.status} {hw.score ? `(${hw.score}/${hw.maxScore})` : ''}
                  </span>

                  {hw.status === 'Pending' ? (
                    <button
                      onClick={() => handleOpenSubmitModal(hw)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      <span>{t('portal.submit_work', 'Submit Work')}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Turned In
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. ASSESSMENTS SUBVIEW */}
      {currentSubTab === 'assessments' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Assessment Results & Test Scores
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official quiz marks, mid-term evaluations and speaking exams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Mid-Term Reading Exam", date: "Oct 20, 2026", score: 96, max: 100, grade: "A", teacher: "Teacher Sophea" },
              { title: "Foreign Teacher Speaking Test", date: "Oct 15, 2026", score: 30, max: 30, grade: "A", teacher: "Teacher Jaden" },
              { title: "Spelling & Phonics Quiz", date: "Oct 05, 2026", score: 19, max: 20, grade: "A", teacher: "Teacher Sovannary" },
              { title: "Grammar Tenses Assessment", date: "Sep 25, 2026", score: 28, max: 30, grade: "A", teacher: "Teacher Michael" },
              { title: "Listening Comprehension", date: "Sep 15, 2026", score: 24, max: 25, grade: "A", teacher: "Teacher Sophea" },
              { title: "Weekly Observation Review", date: "Sep 08, 2026", score: 18, max: 20, grade: "B", teacher: "Teacher Sophea" }
            ].map((test, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">{test.date}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    Grade {test.grade}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {test.title}
                </h4>
                <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{test.score}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ {test.max}</span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5">
                  Examiner: {test.teacher}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. TEACHER EVALUATIONS SUBVIEW */}
      {currentSubTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" />
              Official ECC Progress Evaluation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official Cambodian English Learning Center evaluation sheet and teacher commentary.
            </p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 p-4 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-x-auto">
            <div className="w-full max-w-[850px] shadow-lg rounded-xl overflow-hidden bg-white">
              <EccEvaluationReport
                student={student}
                academicYear="២០២៦- ២០២៧"
                courseLevel={student.gradeKhmer || "សន្ទនាសម្រាប់បឋមទូទៅ"}
                termName="វគ្គទី ៤ បញ្ចប់វគ្គសិក្សា"
                reportDate="07/09/2026"
                mode="screen"
              />
            </div>
          </div>
        </div>
      )}

      {/* 11. TUITION & FEES SUBVIEW */}
      {currentSubTab === 'tuition' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              My Course Tuition & Term Fees
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Information on course tuition prices and payment status.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Term 4 Tuition Fully Settled</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">All classroom materials and exam vouchers are unlocked.</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
              Paid in Full ($95)
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Schedule</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Primary English (Grades 1-6)</span>
                <span className="font-bold text-slate-900 dark:text-white">$85 - $95 / term</span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Secondary English (Grades 7-9)</span>
                <span className="font-bold text-slate-900 dark:text-white">$100 - $110 / term</span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">High School & IELTS Prep (Grades 10-12)</span>
                <span className="font-bold text-slate-900 dark:text-white">$120 / term</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. ANNOUNCEMENTS SUBVIEW */}
      {currentSubTab === 'announcements' && (
        <div className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-[#29364D] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Student Announcements & Activities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Notices, holiday advisories and competition registrations.
            </p>
          </div>

          <div className="space-y-4">
            {studentAnnouncements.map((ann) => (
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
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    Target: Students
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. INTERACTIVE HOMEWORK SUBMISSION MODAL */}
      {selectedHwToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white dark:bg-[#111C32] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#29364D] overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  {selectedHwToSubmit.subject}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit: {selectedHwToSubmit.title}
                </h3>
              </div>
              <button
                onClick={handleCloseSubmitModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Instructions:</p>
                <p>{selectedHwToSubmit.instructions}</p>
                <p className="mt-2 text-rose-500 font-medium">Due Date: {selectedHwToSubmit.dueDate}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type Your Answer / Reflection:
                </label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your homework answers, essay sentences, or questions for your teacher here..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Homework File (Optional):
                </label>
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                  <Upload size={20} className="mx-auto text-indigo-500 mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {submissionFileName || "Click to browse or drop homework sheet (PDF, Word, or Image)"}
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    id="hw-upload-input"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSubmissionFileName(e.target.files[0].name);
                      }
                    }}
                  />
                  <label
                    htmlFor="hw-upload-input"
                    className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Select File
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseSubmitModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <Send size={14} /> Turn In Homework
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
