import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Save,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarCheck,
  MapPin,
  AlertCircle,
  History,
  Lock,
  CalendarOff
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { attendanceService } from '../services/attendanceService';
import {
  formatGrade,
  formatStudentName,
  formatAttendanceRate,
  toKhmerDigits,
  formatSubjectName,
  formatSchedule,
  formatScheduleDays,
  formatScheduleTime
} from '../utils/formatters';
import { getOfficialStudentId } from '../utils/studentId';
import {
  evaluateAttendanceStatus,
  getCambodiaTime,
  CAMBODIA_TIMEZONE
} from '../utils/attendanceSchedule';

export const ClassAttendanceView = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { classId: routeClassId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClassId = searchParams.get('classId');

  const {
    classes = [],
    selectedClassId,
    setSelectedClassId,
    students = [],
    subjects = [],
    teachers = [],
    attendanceRecords = [],
    saveClassAttendance,
    addToast
  } = useApp();

  const activeClassId = routeClassId || queryClassId || selectedClassId;

  // Sync selectedClassId in context if URL has a classId
  useEffect(() => {
    if (activeClassId && activeClassId !== selectedClassId && setSelectedClassId) {
      setSelectedClassId(activeClassId);
    }
  }, [activeClassId, selectedClassId, setSelectedClassId]);

  // Active Class Resolution
  const currentClass = useMemo(() => {
    if (activeClassId) {
      const found = classes.find((c) => c.id === activeClassId);
      if (found) return found;
    }
    return (
      classes.find((c) => c.id === selectedClassId) ||
      classes[0] ||
      null
    );
  }, [classes, activeClassId, selectedClassId]);

  const handleClassChange = (newClassId) => {
    if (setSelectedClassId) {
      setSelectedClassId(newClassId);
    }
    if (routeClassId) {
      navigate(`/admin/classes/${newClassId}/attendance`);
    } else {
      navigate(`/admin/attendance?classId=${newClassId}`);
    }
  };

  const handleBackToClasses = () => {
    navigate('/admin/classes');
  };

  const handleGoToClassStudents = () => {
    if (currentClass) {
      navigate(`/admin/classes/${currentClass.id}/students`);
    }
  };

  // English Subject resolution
  const currentSubject = useMemo(() => {
    if (!currentClass) return null;
    return subjects.find((s) => s.id === currentClass.subjectId) || null;
  }, [currentClass, subjects]);

  // Assigned Teacher resolution
  const currentTeacher = useMemo(() => {
    if (!currentClass) return null;
    return teachers.find((t) => t.id === currentClass.teacherId || t.name === currentClass.teacher) || null;
  }, [currentClass, teachers]);

  // Enrolled students in THIS class only (Requirement 2 & 8)
  const enrolledStudents = useMemo(() => {
    if (!currentClass || !Array.isArray(currentClass.enrolledStudentIds)) return [];
    return students.filter((s) => currentClass.enrolledStudentIds.includes(s.id));
  }, [currentClass, students]);

  // View mode: 'sheet' (Daily Marking) vs 'history' (History & Summaries)
  const [activeTab, setActiveTab] = useState('sheet');

  // Selected Date state: defaults strictly to today in Cambodia (YYYY-MM-DD)
  const getTodayString = () => getCambodiaTime().dateString;
  const cambodiaToday = useMemo(() => getCambodiaTime().dateString, []);
  const [selectedDate, setSelectedDate] = useState(() => getCambodiaTime().dateString);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Evaluate intelligent schedule status and daily lock for currentClass on selectedDate
  const attStatus = useMemo(() => {
    if (!currentClass) return null;
    return evaluateAttendanceStatus(currentClass, selectedDate, null, attendanceRecords);
  }, [currentClass, selectedDate, attendanceRecords]);

  // Daily roster state: map studentId -> { status: 'Present'|'Absent'|'Late'|'Excused', remarks: '' }
  const [sheetData, setSheetData] = useState({});

  // Initialize or reload sheetData when class or date changes
  useEffect(() => {
    if (!currentClass) return;

    const initial = {};
    enrolledStudents.forEach((st) => {
      // Find existing saved record for this student + class + date
      const existing = attendanceRecords.find(
        (a) => a.classId === currentClass.id && a.studentId === st.id && a.date === selectedDate
      );

      if (existing) {
        initial[st.id] = {
          status: existing.status || 'Present',
          remarks: existing.remarks || ''
        };
      } else {
        // Default to Present
        initial[st.id] = {
          status: 'Present',
          remarks: ''
        };
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheetData(initial);
    setHasUnsavedChanges(false);
  }, [currentClass, selectedDate, enrolledStudents, attendanceRecords]);

  // Quick Date Navigation
  const isNextDateDisabled = selectedDate >= cambodiaToday;
  const isTodaySelected = selectedDate === cambodiaToday;

  const shiftDate = (days) => {
    if (days > 0 && selectedDate >= cambodiaToday) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const nextStr = `${yyyy}-${mm}-${dd}`;
    if (days > 0 && nextStr > cambodiaToday) return;
    setSelectedDate(nextStr);
    if (activeTab === 'history') setActiveTab('sheet');
  };

  const setDateToToday = () => {
    setSelectedDate(getTodayString());
    if (activeTab === 'history') setActiveTab('sheet');
  };

  // Status updates
  const handleStatusChange = (studentId, newStatus) => {
    setSheetData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status: newStatus
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleRemarksChange = (studentId, remarks) => {
    setSheetData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Present' }),
        remarks
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Bulk actions
  const handleMarkAll = (status) => {
    setSheetData((prev) => {
      const next = { ...prev };
      enrolledStudents.forEach((st) => {
        next[st.id] = {
          ...(next[st.id] || { remarks: '' }),
          status
        };
      });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Requirement 3: Attendance Statistics Calculation
  const stats = useMemo(() => {
    const total = enrolledStudents.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    enrolledStudents.forEach((st) => {
      const s = sheetData[st.id]?.status || 'Present';
      if (s === 'Present') present++;
      else if (s === 'Absent') absent++;
      else if (s === 'Late') late++;
      else if (s === 'Excused') excused++;
    });

    const effectiveAttended = present + (late * 0.8) + (excused * 0.9);
    const rate = total > 0 ? ((effectiveAttended / total) * 100).toFixed(1) : '100.0';

    return {
      total,
      present,
      absent,
      late,
      excused,
      rate
    };
  }, [enrolledStudents, sheetData]);

  // Check if current date already has saved records
  const existingRecordsForDate = useMemo(() => {
    if (!currentClass) return [];
    return attendanceRecords.filter(
      (a) => a.classId === currentClass.id && a.date === selectedDate
    );
  }, [currentClass, attendanceRecords, selectedDate]);

  const isEditingExisting = existingRecordsForDate.length > 0;

  // Filtered student list for table
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((st) => {
      const record = sheetData[st.id] || { status: 'Present', remarks: '' };
      
      // Status filter
      if (statusFilter !== 'All' && record.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = st.name.toLowerCase().includes(q);
        const matchesKhmer = st.khmerName ? st.khmerName.includes(q) : false;
        const matchesId = st.id.toLowerCase().includes(q);
        return matchesName || matchesKhmer || matchesId;
      }

      return true;
    });
  }, [enrolledStudents, sheetData, statusFilter, searchTerm]);

  // Requirement 4 & 7: Save Attendance with Schedule Validation & Duplicate Prevention
  const handleSaveAttendance = async () => {
    if (!currentClass || enrolledStudents.length === 0 || isSaving) return;

    // 1. Validate schedule status and daily lock
    const evaluation = evaluateAttendanceStatus(currentClass, selectedDate, null, attendanceRecords);

    // If attempting to record brand new attendance outside window or on non-teaching day:
    if (!evaluation.hasExistingRecord && !evaluation.canTrack) {
      addToast({
        type: 'error',
        title: 'Attendance Unavailable',
        message: evaluation.message
      });
      return;
    }

    try {
      setIsSaving(true);

      const recordsToSave = enrolledStudents.map((st) => ({
        studentId: st.id,
        status: sheetData[st.id]?.status || 'Present',
        remarks: sheetData[st.id]?.remarks || ''
      }));

      const teacherName = currentTeacher?.name || currentClass.teacher || 'Teacher Sophea';

      // 2. Save via AppContext (updates state and prevents duplicates)
      await saveClassAttendance(
        currentClass.id,
        selectedDate,
        recordsToSave,
        teacherName
      );

      // 3. Keep mock service layer in sync
      await attendanceService.saveClassAttendance(
        currentClass.id,
        selectedDate,
        recordsToSave,
        teacherName
      );

      setHasUnsavedChanges(false);

      addToast({
        type: 'success',
        title: evaluation.hasExistingRecord ? 'Attendance Updated' : t('attendance.toast_saved_title'),
        message: evaluation.hasExistingRecord
          ? `Existing attendance record for ${currentClass.name} on ${selectedDate} was successfully updated.`
          : t('attendance.toast_saved_msg', {
              class: currentClass.name,
              date: lang === 'km' ? toKhmerDigits(selectedDate) : selectedDate
            })
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not record attendance. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Requirement 5: Attendance History Data
  const classHistorySessions = useMemo(() => {
    if (!currentClass) return [];
    
    // Group records by date
    const dateMap = {};
    attendanceRecords
      .filter((a) => a.classId === currentClass.id)
      .forEach((rec) => {
        if (!dateMap[rec.date]) {
          dateMap[rec.date] = {
            date: rec.date,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            recordedBy: rec.recordedBy || 'Teacher Sophea',
            lastUpdated: rec.updatedAt || rec.date
          };
        }
        dateMap[rec.date].total++;
        if (rec.status === 'Present') dateMap[rec.date].present++;
        else if (rec.status === 'Absent') dateMap[rec.date].absent++;
        else if (rec.status === 'Late') dateMap[rec.date].late++;
        else if (rec.status === 'Excused') dateMap[rec.date].excused++;
      });

    const list = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
    list.forEach((item) => {
      const eff = item.present + (item.late * 0.8) + (item.excused * 0.9);
      item.rate = item.total > 0 ? ((eff / item.total) * 100).toFixed(1) : '100.0';
    });

    return list;
  }, [currentClass, attendanceRecords]);

  // Student historical performance in this class
  const studentHistoryStats = useMemo(() => {
    if (!currentClass) return [];

    return enrolledStudents.map((st) => {
      const studentRecords = attendanceRecords.filter(
        (a) => a.classId === currentClass.id && a.studentId === st.id
      );

      const totalSessions = studentRecords.length;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      studentRecords.forEach((r) => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'Late') late++;
        else if (r.status === 'Excused') excused++;
      });

      const eff = present + (late * 0.8) + (excused * 0.9);
      const rate = totalSessions > 0 ? ((eff / totalSessions) * 100).toFixed(1) : '100.0';

      return {
        student: st,
        totalSessions,
        present,
        absent,
        late,
        excused,
        rate
      };
    });
  }, [currentClass, enrolledStudents, attendanceRecords]);

  // Export CSV
  const handleExportCsv = () => {
    if (!currentClass || enrolledStudents.length === 0) return;

    const headers = ['Student ID', 'Student Name', 'Grade', 'Date', 'Status', 'Remarks', 'Class Code', 'Class Name'];
    const rows = enrolledStudents.map((st) => [
      st.id,
      `"${st.name}"`,
      `"${st.grade}"`,
      selectedDate,
      sheetData[st.id]?.status || 'Present',
      `"${sheetData[st.id]?.remarks || ''}"`,
      currentClass.code,
      `"${currentClass.name}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECC_Attendance_${currentClass.code}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Export Completed',
      message: `Exported attendance sheet for ${currentClass.name}.`
    });
  };

  // Direct print
  const handlePrint = () => {
    window.print();
  };

  const numDisplay = (val) => (lang === 'km' ? toKhmerDigits(val) : val);

  if (!currentClass) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle size={40} className="mx-auto text-amber-500 mb-2" />
        <h3 className="text-base font-bold text-slate-800">Class Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested class could not be found or has been removed.</p>
        <button
          onClick={handleBackToClasses}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          {t('attendance.back_to_classes')}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-16"
    >
      {/* ================= A. TOP HEADER & BREADCRUMBS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
            <button
              onClick={handleBackToClasses}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>{t('attendance.back_to_classes')}</span>
            </button>
            <span>/</span>
            <span className="text-slate-700 font-semibold truncate max-w-xs">{currentClass.name}</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold">{t('attendance.track_attendance')}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
              <Calendar size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
                <span>{currentClass.name}</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentClass.code}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-100 text-slate-700">
                  {formatGrade(currentClass.gradeLevel, lang)}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {currentSubject ? formatSubjectName(currentSubject, lang) : currentClass.subjectName}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-800 dark:text-slate-300">
                  {currentTeacher?.name || currentClass.teacher}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Clock size={12} className="text-indigo-600 shrink-0" />
                  <span>{formatScheduleDays(currentClass.days)} ({formatScheduleTime(currentClass.time || currentClass.schedule)})</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span>{currentClass.studentLocation || currentClass.room}</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={handleGoToClassStudents}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Users size={14} />
            <span>{t('attendance.view_students')} ({numDisplay(enrolledStudents.length)})</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('attendance.export_csv')}
          >
            <Download size={14} />
            <span>{t('attendance.export_csv')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition-colors cursor-pointer print:hidden"
            title={t('attendance.print_sheet')}
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* ================= B. ATTENDANCE MANAGEMENT CONTROL TOOLBAR ================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 flex-wrap xl:flex-nowrap">
          {/* SECTION A — Class Selection */}
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <label htmlFor="attendance-class-select" className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
              Class:
            </label>
            <div className="relative flex-1 sm:flex-initial w-full sm:w-[220px] md:w-[240px]">
              <select
                id="attendance-class-select"
                value={currentClass.id}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#29364D] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA] cursor-pointer shadow-2xs appearance-none truncate"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id} className="dark:bg-[#111C32]">
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* SECTION B — Attendance View */}
          <div className="flex items-center justify-start sm:justify-center w-full sm:w-auto shrink-0 overflow-x-auto">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#29364D] shadow-2xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('sheet')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'sheet'
                    ? 'bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4338CA] dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <CalendarCheck size={14} className={activeTab === 'sheet' ? 'text-[#4338CA] dark:text-indigo-400' : ''} />
                <span>{lang === 'km' ? t('attendance.tab_daily_sheet') : 'Daily Attendance'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4338CA] dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <History size={14} className={activeTab === 'history' ? 'text-[#4338CA] dark:text-indigo-400' : ''} />
                <span>{lang === 'km' ? t('attendance.tab_history') : 'Attendance History & Summaries'}</span>
              </button>
            </div>
          </div>

          {/* SECTION C — Attendance Date */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start lg:justify-end w-full sm:w-auto shrink-0">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
              {t('attendance.attendance_date', 'Attendance Date:')}
            </span>

            {/* Date Control Group with Today Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#111C32] rounded-lg transition-colors cursor-pointer"
                  title={t('attendance.prev_day', 'Previous Day')}
                  aria-label="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="relative flex items-center px-2 py-1 gap-1.5 bg-white dark:bg-[#111C32] rounded-lg border border-slate-200/80 dark:border-[#29364D] mx-0.5 shadow-2xs">
                  <Calendar size={13} className="text-[#4338CA] dark:text-indigo-400 shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    max={cambodiaToday}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        if (activeTab === 'history') setActiveTab('sheet');
                      }
                    }}
                    className="text-xs font-bold text-slate-800 dark:text-white bg-transparent border-0 focus:outline-hidden cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  disabled={isNextDateDisabled}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    isNextDateDisabled
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                      : 'text-slate-500 dark:text-slate-400 hover:text-[#4338CA] dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#111C32] cursor-pointer'
                  }`}
                  title={isNextDateDisabled ? 'Future attendance is not allowed' : t('attendance.next_day', 'Next Day')}
                  aria-label="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Compact Today Button */}
              <button
                type="button"
                onClick={setDateToToday}
                className={`px-3 h-8.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isTodaySelected
                    ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
                    : 'bg-white dark:bg-[#111C32] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#29364D] hover:bg-slate-50 dark:hover:bg-[#1E293B] hover:border-slate-300'
                }`}
                title={t('attendance.today', 'Today')}
              >
                <span>{t('attendance.today', 'Today')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= C. ATTENDANCE STATISTICS (REQUIREMENT 3) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Enrolled */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            {t('attendance.stat_total_students')}
          </span>
          <div className="text-2xl font-extrabold text-slate-900">{numDisplay(stats.total)}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t('attendance.overall_class_rate')}</span>
        </div>

        {/* Card 2: Present */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block mb-1">
            {t('attendance.stat_present')}
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{numDisplay(stats.present)}</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-700/80 font-medium mt-0.5 block">
            {stats.total > 0 ? numDisplay(Math.round((stats.present / stats.total) * 100)) : 100}% of roster
          </span>
        </div>

        {/* Card 3: Late */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block mb-1">
            {t('attendance.stat_late')}
          </span>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{numDisplay(stats.late)}</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-700/80 font-medium mt-0.5 block">
            {stats.total > 0 ? numDisplay(Math.round((stats.late / stats.total) * 100)) : 0}% of roster
          </span>
        </div>

        {/* Card 4: Excused */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-sky-700 block mb-1">
            {t('attendance.stat_excused')}
          </span>
          <div className="text-2xl font-extrabold text-sky-600 flex items-center justify-between">
            <span>{numDisplay(stats.excused)}</span>
            <ShieldCheck size={18} className="text-sky-500" />
          </div>
          <span className="text-[10px] text-sky-700/80 font-medium mt-0.5 block">
            Approved leaves
          </span>
        </div>

        {/* Card 5: Absent */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 block mb-1">
            {t('attendance.stat_absent')}
          </span>
          <div className="text-2xl font-extrabold text-rose-600 flex items-center justify-between">
            <span>{numDisplay(stats.absent)}</span>
            <XCircle size={18} className="text-rose-500" />
          </div>
          <span className="text-[10px] text-rose-700/80 font-medium mt-0.5 block">
            SMS notification
          </span>
        </div>

        {/* Card 6: Effective Rate */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-100 block mb-1">
            {t('attendance.stat_rate')}
          </span>
          <div className="text-2xl font-black">{formatAttendanceRate(stats.rate, lang)}</div>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, stats.rate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= D. TAB 1: DAILY ATTENDANCE SHEET (REQUIREMENT 4) ================= */}
      {activeTab === 'sheet' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          {/* Audit banner & schedule status notification */}
          {attStatus?.hasExistingRecord ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>You are editing an existing attendance record for this date.</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                      Editing Existing Record
                    </span>
                  </div>
                  <span className="text-amber-700 dark:text-amber-300 block text-[11px] mt-0.5">
                    Originally recorded by <strong>{attStatus.recordedBy}</strong> ({attStatus.recordedAt}). Saving will update this record without creating duplicates.
                  </span>
                </div>
              </div>

              <span className="text-amber-850 dark:text-amber-300 font-semibold text-[11px] shrink-0 self-start sm:self-auto bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg">
                Record Locked for Today
              </span>
            </div>
          ) : attStatus?.status === 'NO_CLASS_TODAY' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs">
              <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
                <CalendarOff size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold">No Scheduled Class Today ({attStatus.schedule?.weekday}).</div>
                  <span className="text-rose-700 dark:text-rose-300 block text-[11px] mt-0.5">
                    {currentClass.name} is scheduled on <strong>{attStatus.schedule?.days}</strong>. Attendance tracking is disabled for non-teaching days.
                  </span>
                </div>
              </div>
              <span className="text-rose-700 dark:text-rose-300 font-bold text-[11px] shrink-0">
                Non-Teaching Day
              </span>
            </div>
          ) : attStatus?.status === 'NOT_STARTED' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs">
              <div className="flex items-center gap-2.5 text-sky-900 dark:text-sky-200">
                <Clock size={18} className="text-sky-600 dark:text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold">Class Has Not Started Yet.</div>
                  <span className="text-sky-700 dark:text-sky-300 block text-[11px] mt-0.5">
                    Class starts at {attStatus.schedule?.startTime}. Attendance window opens at {attStatus.schedule?.windowStartStr} (Cambodia time).
                  </span>
                </div>
              </div>
              <span className="text-sky-700 dark:text-sky-300 font-bold text-[11px] shrink-0">
                Opens at {attStatus.schedule?.startTime}
              </span>
            </div>
          ) : attStatus?.status === 'EXPIRED' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#29364D] text-xs">
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                <Lock size={18} className="text-slate-500 shrink-0" />
                <div>
                  <div className="font-bold">Attendance Window Closed for this date.</div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                    Attendance window ended at {attStatus.schedule?.windowEndStr} (60-minute grace period expired). New attendance creation is locked.
                  </span>
                </div>
              </div>
              <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px] shrink-0">
                Closed at {attStatus.schedule?.windowEndStr}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong>Attendance Window Open:</strong> Active until {attStatus?.schedule?.windowEndStr} (Cambodia Time: {getCambodiaTime().timeString})
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-300">
                  Assigned Teacher: {currentTeacher?.name || currentClass.teacher}
                </span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                Duplicate-Safe Lock Enabled
              </span>
            </div>
          )}

          {/* Roster Controls: Bulk Mark, Search, Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('attendance.search_student_placeholder')}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={13} />
                <span>{t('attendance.mark_all_present')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <XCircle size={13} />
                <span>{t('attendance.mark_all_absent')}</span>
              </button>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white font-medium focus:outline-hidden"
                >
                  <option value="All">{t('attendance.filter_all')}</option>
                  <option value="Present">{t('attendance.status_present')}</option>
                  <option value="Late">{t('attendance.status_late')}</option>
                  <option value="Excused">{t('attendance.status_excused')}</option>
                  <option value="Absent">{t('attendance.status_absent')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container (Desktop: md+) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-[#29364D]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D] text-slate-600 dark:text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 w-12 text-center">{t('attendance.col_photo')}</th>
                  <th className="py-3 px-3.5">{t('attendance.col_student_name')}</th>
                  <th className="py-3 px-3.5">{t('attendance.col_student_id')}</th>
                  <th className="py-3 px-3.5 min-w-[280px]">{t('attendance.col_status')}</th>
                  <th className="py-3 px-3.5 min-w-[200px]">{t('attendance.col_remarks')}</th>
                  <th className="py-3 px-3.5 text-right">{t('attendance.col_attendance_rate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#29364D] text-slate-800 dark:text-[#CBD5E1]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-[#64748B]">
                      <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-xs">No students match current search/filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const studentRecord = sheetData[st.id] || { status: 'Present', remarks: '' };
                    const currentStatus = studentRecord.status;

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/60 transition-colors ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-50/30 dark:bg-rose-950/20'
                            : currentStatus === 'Late'
                            ? 'bg-amber-50/20 dark:bg-amber-950/20'
                            : currentStatus === 'Excused'
                            ? 'bg-sky-50/20 dark:bg-sky-950/20'
                            : ''
                        }`}
                      >
                        {/* 1. Photo */}
                        <td className="py-3 px-3.5 text-center">
                          <img
                            src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=e0e7ff&color=4338ca`}
                            alt={st.name}
                            className="w-9 h-9 rounded-full object-cover mx-auto ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs"
                          />
                        </td>

                        {/* 2. Student Name */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                            {formatStudentName(st, lang)}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
                            <span>{formatGrade(st.grade, lang)}</span>
                            <span>•</span>
                            <span>{st.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}</span>
                          </div>
                        </td>

                        {/* 3. Student ID */}
                        <td className="py-3 px-3.5">
                          <span className="font-mono text-slate-600 dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#1E293B] px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200 dark:border-[#29364D]">
                            {st.id}
                          </span>
                        </td>

                        {/* 4. Interactive Attendance Controls */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'Present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                                  : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              <span>{t('attendance.status_present')}</span>
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'Late')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'Late'
                                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                                  : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              <Clock size={13} />
                              <span>{t('attendance.status_late')}</span>
                            </button>

                            {/* Excused */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'Excused')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'Excused'
                                  ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-500/20'
                                  : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-sky-50 hover:text-sky-700'
                              }`}
                            >
                              <ShieldCheck size={13} />
                              <span>{t('attendance.status_excused')}</span>
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'Absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/20'
                                  : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              <XCircle size={13} />
                              <span>{t('attendance.status_absent')}</span>
                            </button>
                          </div>
                        </td>

                        {/* 5. Remarks */}
                        <td className="py-3 px-3.5">
                          <input
                            type="text"
                            value={studentRecord.remarks}
                            onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                            placeholder={t('attendance.remarks_placeholder')}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* 6. Running Attendance Rate */}
                        <td className="py-3 px-3.5 text-right font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              (st.attendanceRate || 100) >= 90
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : (st.attendanceRate || 100) >= 80
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {formatAttendanceRate(st.attendanceRate || 100, lang)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Attendance Roll-Call Card List (<md) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#29364D]">
            {filteredStudents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-[#64748B]">
                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-xs">No students match current search/filter.</p>
              </div>
            ) : (
              filteredStudents.map((st) => {
                const studentRecord = sheetData[st.id] || { status: 'Present', remarks: '' };
                const currentStatus = studentRecord.status;

                return (
                  <div
                    key={st.id}
                    className={`p-4 space-y-3 transition-colors ${
                      currentStatus === 'Absent'
                        ? 'bg-rose-50/20 dark:bg-rose-950/20'
                        : currentStatus === 'Late'
                        ? 'bg-amber-50/15 dark:bg-amber-950/20'
                        : currentStatus === 'Excused'
                        ? 'bg-sky-50/15 dark:bg-sky-950/20'
                        : 'bg-white dark:bg-[#111C32]'
                    }`}
                  >
                    {/* Student Top Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=e0e7ff&color=4338ca`}
                          alt={st.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] truncate">
                            {formatStudentName(st, lang)}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#94A3B8]">
                            <span className="font-mono">{st.id}</span>
                            <span>•</span>
                            <span>{st.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          (st.attendanceRate || 100) >= 90
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : (st.attendanceRate || 100) >= 80
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {formatAttendanceRate(st.attendanceRate || 100, lang)}
                      </span>
                    </div>

                    {/* 4 Interactive Status Buttons with 44px Touch Target */}
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'Present')}
                        className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={15} />
                        <span>{t('attendance.status_present')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'Late')}
                        className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'Late'
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        <Clock size={15} />
                        <span>{t('attendance.status_late')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'Excused')}
                        className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'Excused'
                            ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-500/30'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-sky-50 hover:text-sky-700'
                        }`}
                      >
                        <ShieldCheck size={15} />
                        <span>{t('attendance.status_excused')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'Absent')}
                        className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <XCircle size={15} />
                        <span>{t('attendance.status_absent')}</span>
                      </button>
                    </div>

                    {/* Remarks Input */}
                    <input
                      type="text"
                      value={studentRecord.remarks}
                      onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                      placeholder={t('attendance.remarks_placeholder')}
                      className="w-full min-h-[40px] px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-50 dark:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Floating/Sticky Save Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#29364D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-[#94A3B8] flex-wrap">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={14} /> {numDisplay(stats.present)} {t('attendance.status_present')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                <Clock size={14} /> {numDisplay(stats.late)} {t('attendance.status_late')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 font-bold">
                <ShieldCheck size={14} /> {numDisplay(stats.excused)} {t('attendance.status_excused')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold">
                <XCircle size={14} /> {numDisplay(stats.absent)} {t('attendance.status_absent')}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                  Unsaved changes
                </span>
              )}

              <button
                type="button"
                disabled={isSaving || (!attStatus?.canTrack && !attStatus?.canEdit)}
                onClick={handleSaveAttendance}
                className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  attStatus?.hasExistingRecord
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                <Save size={15} />
                <span>
                  {isSaving
                    ? t('attendance.saving')
                    : attStatus?.hasExistingRecord
                    ? 'Update Existing Record'
                    : attStatus?.status === 'NO_CLASS_TODAY'
                    ? 'No Class Today'
                    : attStatus?.status === 'NOT_STARTED'
                    ? 'Class Not Started'
                    : attStatus?.status === 'EXPIRED'
                    ? 'Attendance Closed'
                    : t('attendance.save_attendance_btn')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= E. TAB 2: ATTENDANCE HISTORY & SUMMARIES (REQUIREMENT 5) ================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Daily Sessions Log */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History size={16} className="text-indigo-600" />
                  <span>{t('attendance.history_title')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('attendance.history_subtitle')}</p>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                {t('attendance.sessions_held')}: <strong>{numDisplay(classHistorySessions.length)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Roster Total</th>
                    <th className="py-3 px-4 text-emerald-700">Present</th>
                    <th className="py-3 px-4 text-amber-700">Late</th>
                    <th className="py-3 px-4 text-sky-700">Excused</th>
                    <th className="py-3 px-4 text-rose-700">Absent</th>
                    <th className="py-3 px-4">Attendance Rate</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {classHistorySessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        {t('attendance.no_history_records')}
                      </td>
                    </tr>
                  ) : (
                    classHistorySessions.map((session) => (
                      <tr key={session.date} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {lang === 'km' ? toKhmerDigits(session.date) : session.date}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">{numDisplay(session.total)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{numDisplay(session.present)}</td>
                        <td className="py-3 px-4 font-bold text-amber-600">{numDisplay(session.late)}</td>
                        <td className="py-3 px-4 font-bold text-sky-600">{numDisplay(session.excused)}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">{numDisplay(session.absent)}</td>
                        <td className="py-3 px-4 font-extrabold text-indigo-700">
                          {formatAttendanceRate(session.rate, lang)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{session.recordedBy}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(session.date);
                              setActiveTab('sheet');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Load / Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Breakdown Table (Requirement 5: Student attendance percentage) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-emerald-600" />
                <span>Student Cohort Attendance Percentage</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed record of present, absent, and excused sessions for each enrolled student.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Sessions Held</th>
                    <th className="py-3 px-4 text-emerald-700">Present</th>
                    <th className="py-3 px-4 text-amber-700">Late</th>
                    <th className="py-3 px-4 text-sky-700">Excused</th>
                    <th className="py-3 px-4 text-rose-700">Absent</th>
                    <th className="py-3 px-4">Cohort Rate</th>
                    <th className="py-3 px-4 text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {studentHistoryStats.map((item) => {
                    const isGood = Number(item.rate) >= 80;
                    return (
                      <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatStudentName(item.student, lang)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{getOfficialStudentId(item.student)}</td>
                        <td className="py-3 px-4 font-medium text-slate-600">{numDisplay(item.totalSessions)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{numDisplay(item.present)}</td>
                        <td className="py-3 px-4 font-bold text-amber-600">{numDisplay(item.late)}</td>
                        <td className="py-3 px-4 font-bold text-sky-600">{numDisplay(item.excused)}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">{numDisplay(item.absent)}</td>
                        <td className="py-3 px-4 font-extrabold text-indigo-700">
                          {formatAttendanceRate(item.rate, lang)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isGood
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isGood ? t('attendance.good_standing') : t('attendance.attendance_warning')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
