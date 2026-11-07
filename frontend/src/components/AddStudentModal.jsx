import { useState, useMemo, useRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  AlertCircle,
  Search,
  Check,
  ChevronDown,
  GraduationCap,
  Clock,
  MapPin,
  BookOpen,
  Camera,
  RefreshCw,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { toKhmerDigits, formatSchedule } from '../utils/formatters';
import { generateSixDigitStudentId, isValidStudentId, getOfficialStudentId } from '../utils/studentId';
import StudentAvatarPicker from './StudentAvatarPicker';

const AddStudentModalContent = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const numDisplay = (v) => (lang === 'km' ? toKhmerDigits(v) : v);
  const formKeyPrefix = useId();

  const {
    students = [],
    classes = [],
    registerAndEnrollStudent,
    addToast
  } = useApp();

  // Form states initialized freshly on mount with a unique 6-digit numeric Student ID
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const [studentId] = useState(() => generateSixDigitStudentId(students));
  const [name, setName] = useState('');
  const [khmerName, setKhmerName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [academicRemarks, setAcademicRemarks] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [status, setStatus] = useState('Active');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paidAmount, setPaidAmount] = useState('50');

  const [errors, setErrors] = useState({});

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setClassDropdownOpen(false);
      }
    };
    if (classDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [classDropdownOpen]);

  // Filter only active classes from MySQL/API state
  const activeClasses = useMemo(() => {
    return classes.filter((c) => c.status === 'Active');
  }, [classes]);

  // Searchable classes filter
  const filteredClasses = useMemo(() => {
    if (!classSearchTerm.trim()) return activeClasses;
    const q = classSearchTerm.toLowerCase();
    return activeClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.teacher && c.teacher.toLowerCase().includes(q)) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q))
    );
  }, [activeClasses, classSearchTerm]);

  // Currently selected class object
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Calculated metrics for selected class
  const classMetrics = useMemo(() => {
    if (!selectedClass) return null;
    const currentEnrollment = Array.isArray(selectedClass.enrolledStudentIds)
      ? selectedClass.enrolledStudentIds.length
      : (Number(selectedClass.enrolled) || 0);
    const maxCapacity = Number(selectedClass.capacity) || 25;
    const availableSeats = Math.max(0, maxCapacity - currentEnrollment);
    const capacityPercent = Math.min(100, Math.round((currentEnrollment / maxCapacity) * 100));

    return {
      currentEnrollment,
      maxCapacity,
      availableSeats,
      capacityPercent,
      isFull: availableSeats <= 0
    };
  }, [selectedClass]);

  const handleRegenerateId = () => {
    setStudentId(generateStudentId());
  };

  const validate = () => {
    const errs = {};
    if (!selectedClassId) {
      errs.classId = t('classes.class_selection_required', 'An English Class must be selected before registering a student.');
    }
    if (!name.trim()) {
      errs.name = t('students.val_english_name_req', 'English Full Name is required');
    }
    if (!guardianName.trim()) {
      errs.guardianName = t('students.val_guardian_name_req', 'Guardian Name is required');
    }
    if (!guardianPhone.trim()) {
      errs.guardianPhone = t('students.val_guardian_phone_req', 'Guardian Phone is required');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!selectedClass) {
      addToast({
        type: 'error',
        title: t('common.error', 'Validation Error'),
        message: t('classes.class_selection_required', 'An English Class must be selected before registering a student.')
      });
      return;
    }

    if (classMetrics?.isFull) {
      addToast({
        type: 'warning',
        title: t('classes.capacity_exceeded', 'Class Full Warning'),
        message: t(
          'classes.capacity_full_warning',
          'Notice: This class has reached its maximum enrollment capacity ({{capacity}} students).',
          { capacity: classMetrics.maxCapacity }
        )
      });
    }

    // Uniqueness validation check
    if (!isValidStudentId(studentId)) {
      addToast({
        type: 'error',
        title: 'Invalid Student ID',
        message: 'Official Student ID must be exactly 6 numeric digits.'
      });
      return;
    }

    if (students.some((s) => getOfficialStudentId(s) === studentId)) {
      addToast({
        type: 'error',
        title: 'Duplicate Student ID',
        message: 'This 6-digit Student ID is already assigned. Please close and re-open to generate a new one.'
      });
      return;
    }

    const studentData = {
      studentId,
      studentCode: studentId,
      student_code: studentId,
      name: name.trim(),
      khmerName: khmerName.trim() || null,
      gender,
      dob: dob || null,
      avatar: (showCustomAvatarInput && customAvatar.trim()) ? customAvatar.trim() : (avatar && avatar.trim() ? avatar.trim() : null),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      studentPhone: studentPhone.trim() || null,
      address: address.trim() || null,
      notes: academicRemarks.trim() || null,
      academicRemarks: academicRemarks.trim() || null,
      status,
      className: selectedClass.name,
      grade: selectedClass.gradeLevel || 'Grade 1',
      englishLevel: selectedClass.subjectName || 'Beginner',
      teacher: selectedClass.teacher,
      joinDate: new Date().toISOString().slice(0, 10),
      attendanceRate: 100,
      tuitionStatus: paymentStatus,
      paymentStatus: paymentStatus,
      paidAmount: paymentStatus === 'Partial' ? (parseFloat(paidAmount) || 50) : (paymentStatus === 'Paid' ? 100 : 0)
    };

    registerAndEnrollStudent(studentData, selectedClass.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#111C32] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#29364D] overflow-hidden z-10 my-6 transition-colors flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#29364D] flex items-center justify-between shrink-0 bg-white dark:bg-[#111C32]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                {t('students.modal_register_title', 'Register New Student')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {t('students.modal_register_sub', 'Select an active English class to enroll the student directly into that cohort.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs bg-white dark:bg-[#111C32] flex-1">
          {/* STEP 1: ONLY ONE SELECTION OPTION: SELECT ENGLISH CLASS */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-[#F8FAFC] text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('classes.select_english_class', 'Select English Class')} *</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {numDisplay(activeClasses.length)} {t('classes.active_classes_available', 'active cohorts')}
              </span>
            </label>

            {/* Searchable Class Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border text-left flex items-center justify-between transition-all cursor-pointer ${
                  errors.classId
                    ? 'border-rose-400 ring-2 ring-rose-400/20'
                    : selectedClass
                    ? 'border-indigo-500/80 ring-1 ring-indigo-500/30 text-slate-900 dark:text-[#F8FAFC]'
                    : 'border-slate-300 dark:border-[#29364D] text-slate-400 dark:text-[#94A3B8] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedClass ? (
                    <>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800 shrink-0">
                        {selectedClass.code}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
                        {selectedClass.name}
                      </span>
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="text-slate-500 dark:text-[#94A3B8] text-[11px] hidden sm:inline truncate">
                        {selectedClass.subjectName || selectedClass.subjectId}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      {t('classes.select_class_placeholder', 'Search and select an active English class...')}
                    </span>
                  )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${classDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {classDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#29364D] rounded-xl shadow-2xl overflow-hidden max-h-64 flex flex-col">
                  {/* Search Input */}
                  <div className="p-2 border-b border-slate-100 dark:border-[#29364D] bg-slate-50 dark:bg-[#0E1729]">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={classSearchTerm}
                        onChange={(e) => setClassSearchTerm(e.target.value)}
                        placeholder={t('classes.search_class_filter', 'Filter classes by name, code, teacher...')}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#111C32] border border-slate-200 dark:border-[#29364D] text-slate-800 dark:text-[#F8FAFC] text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Class Options List */}
                  <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-[#29364D]">
                    {filteredClasses.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        {t('common.no_match', 'No active classes match your search.')}
                      </div>
                    ) : (
                      filteredClasses.map((cls) => {
                        const isSelected = cls.id === selectedClassId;
                        const currentEnrolled = Array.isArray(cls.enrolledStudentIds)
                          ? cls.enrolledStudentIds.length
                          : (Number(cls.enrolled) || 0);
                        const cap = Number(cls.capacity) || 25;
                        const remaining = Math.max(0, cap - currentEnrolled);
                        const full = remaining <= 0;

                        return (
                          <div
                            key={cls.id}
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              setClassDropdownOpen(false);
                              setErrors((prev) => ({ ...prev, classId: null }));
                            }}
                            className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/60'
                                : 'hover:bg-slate-50 dark:hover:bg-[#111C32]/60'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#0E1729] text-indigo-700 dark:text-indigo-300 font-bold border border-slate-200 dark:border-[#29364D]">
                                  {cls.code}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-xs truncate">
                                  {cls.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-2 truncate">
                                <span>{cls.subjectName || cls.subjectId}</span>
                                <span>•</span>
                                <span>{cls.teacher}</span>
                                <span>•</span>
                                <span>{formatSchedule(cls)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  full
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {full
                                  ? t('classes.capacity_full', 'Full')
                                  : `${numDisplay(remaining)} ${t('classes.seats_left', 'seats')}`}
                              </span>
                              {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.classId && (
              <p className="text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.classId}
              </p>
            )}
          </div>

          {/* AUTOMATICALLY DISPLAYED CLASS INFORMATION (8 METRICS) */}
          {selectedClass && classMetrics && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="p-4 rounded-xl bg-slate-50/90 dark:bg-[#0E1729] border border-indigo-100 dark:border-indigo-950/80 shadow-xs space-y-3"
            >
              {/* Header: Class Name, Subject & Capacity Percentage */}
              <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-[#29364D]">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                      {selectedClass.code}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-[#F8FAFC]">
                      {selectedClass.name}
                    </h4>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <BookOpen size={13} />
                    <span>{selectedClass.subjectName || selectedClass.subjectId}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    classMetrics.isFull
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {numDisplay(classMetrics.availableSeats)} {t('classes.available_seats', 'Available Seats')}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {numDisplay(classMetrics.currentEnrollment)} / {numDisplay(classMetrics.maxCapacity)} ({numDisplay(classMetrics.capacityPercent)}%)
                  </div>
                </div>
              </div>

              {/* 5-Column Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-600 dark:text-[#CBD5E1]">
                {/* Assigned Teacher */}
                <div className="flex items-start gap-1.5">
                  <GraduationCap size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('common.teacher', 'Assigned Teacher')}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {selectedClass.teacher}
                    </span>
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex items-start gap-1.5">
                  <Clock size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('classes.schedule', 'Schedule')}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-[#CBD5E1]">
                      {formatSchedule(selectedClass)}
                    </span>
                  </div>
                </div>

                {/* Student Location */}
                <div className="flex items-start gap-1.5">
                  <MapPin size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('classes.student_location', 'Student Location')}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-[#CBD5E1]">
                      {selectedClass.studentLocation || selectedClass.room || "Student's Home"}
                    </span>
                  </div>
                </div>

                {/* Enrollment / Capacity */}
                <div className="flex items-start gap-1.5">
                  <Users size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t('classes.capacity_enrolled', 'Enrollment / Max')}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {numDisplay(classMetrics.currentEnrollment)} / {numDisplay(classMetrics.maxCapacity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    classMetrics.isFull
                      ? 'bg-rose-500'
                      : classMetrics.capacityPercent >= 80
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${classMetrics.capacityPercent}%` }}
                />
              </div>

              {/* Warning if capacity full */}
              {classMetrics.isFull && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[11px] font-medium">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>{t('classes.capacity_full_warning', 'Notice: This class has reached its maximum enrollment capacity.')}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: STUDENT REGISTRATION FIELDS */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#29364D] space-y-4">
            {/* Student ID, Enrollment Status & Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-[#29364D]">
              <div>
                <label className="block font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.form_student_id', 'Student ID')}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={studentId}
                    readOnly
                    aria-readonly="true"
                    title={t('students.official_id_readonly', 'Official 6-digit numeric Student ID (system-generated)')}
                    className="flex-1 font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden cursor-not-allowed select-all"
                  />
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                    6-digit
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.enrollment_status', 'Enrollment Status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="Active">{t('common.active', 'Active')}</option>
                  <option value="Probation">{t('common.probation', 'Probation')}</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-[#CBD5E1]">
                    {t('students.payment_status', 'Payment Status')}
                  </label>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border inline-flex items-center gap-1 ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : paymentStatus === 'Partial'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {paymentStatus}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Unpaid')}
                    className={`py-1 px-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentStatus === 'Unpaid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Unpaid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Partial')}
                    className={`py-1 px-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentStatus === 'Partial'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Partial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Paid')}
                    className={`py-1 px-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentStatus === 'Paid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Paid</span>
                  </button>
                </div>

                {paymentStatus === 'Partial' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">Initial Deposit ($):</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-20 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs font-semibold focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400">Balance: ${Math.max(0, 100 - (parseFloat(paidAmount) || 0))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* English Full Name & Khmer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formKeyPrefix}-name`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.form_english_name', 'English Full Name')} *
                </label>
                <input
                  id={`${formKeyPrefix}-name`}
                  type="text"
                  placeholder="e.g. Sothea Chan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border ${
                    errors.name ? 'border-rose-400' : 'border-slate-300 dark:border-[#29364D]'
                  } text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.name && (
                  <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={`${formKeyPrefix}-khmerName`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1 font-khmer">
                  {t('students.form_khmer_name', 'ឈ្មោះជាភាសាខ្មែរ (Khmer Name)')}
                </label>
                <input
                  id={`${formKeyPrefix}-khmerName`}
                  type="text"
                  placeholder={t('students.form_khmer_name_placeholder', 'ចាន់ សុធា')}
                  value={khmerName}
                  onChange={(e) => setKhmerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-khmer"
                />
              </div>
            </div>

            {/* Gender & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.form_gender', 'Gender')}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="Male">{t('common.male', 'Male')}</option>
                  <option value="Female">{t('common.female', 'Female')}</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${formKeyPrefix}-dob`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.dob', 'Date of Birth')}
                </label>
                <input
                  id={`${formKeyPrefix}-dob`}
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Student Avatar / Photo Selection */}
            <StudentAvatarPicker
              value={avatar}
              onChange={setAvatar}
              customAvatar={customAvatar}
              onCustomAvatarChange={setCustomAvatar}
              showCustomInput={showCustomAvatarInput}
              onToggleCustomInput={setShowCustomAvatarInput}
            />

            {/* Parent / Guardian Information */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] space-y-3">
              <p className="font-bold text-slate-800 dark:text-[#F8FAFC] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('students.form_guardian_section', 'Parent / Guardian Information')} *</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formKeyPrefix}-guardianName`} className="block text-slate-600 dark:text-[#CBD5E1] mb-1 font-semibold">
                    {t('students.form_guardian_name', 'Guardian Full Name')} *
                  </label>
                  <input
                    id={`${formKeyPrefix}-guardianName`}
                    type="text"
                    placeholder="e.g. Borey Chan"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border ${
                      errors.guardianName ? 'border-rose-400' : 'border-slate-300 dark:border-[#29364D]'
                    } text-xs focus:outline-hidden`}
                  />
                  {errors.guardianName && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1">{errors.guardianName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor={`${formKeyPrefix}-guardianPhone`} className="block text-slate-600 dark:text-[#CBD5E1] mb-1 font-semibold">
                    {t('students.form_guardian_phone', 'Guardian Phone')} *
                  </label>
                  <input
                    id={`${formKeyPrefix}-guardianPhone`}
                    type="tel"
                    placeholder="+855 12 000 000"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border ${
                      errors.guardianPhone ? 'border-rose-400' : 'border-slate-300 dark:border-[#29364D]'
                    } text-xs focus:outline-hidden`}
                  />
                  {errors.guardianPhone && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1">{errors.guardianPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact (Student Phone / Email) & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formKeyPrefix}-studentPhone`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.phone', 'Student Phone (Optional)')}
                </label>
                <input
                  id={`${formKeyPrefix}-studentPhone`}
                  type="tel"
                  placeholder="+855 12 345 678"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor={`${formKeyPrefix}-address`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.address', 'Residential Address / Location')}
                </label>
                <input
                  id={`${formKeyPrefix}-address`}
                  type="text"
                  placeholder="e.g. Khan Chamkarmon, Phnom Penh"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Academic Remarks */}
            <div>
              <label htmlFor={`${formKeyPrefix}-academicRemarks`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                {t('classes.academic_remarks', 'Academic Remarks')}
              </label>
              <textarea
                id={`${formKeyPrefix}-academicRemarks`}
                rows={2}
                placeholder={t('classes.academic_remarks_placeholder', 'Prior English background, phonics foundation, learning objectives...')}
                value={academicRemarks}
                onChange={(e) => setAcademicRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {selectedClass ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ {t('classes.enrolling_into', 'Enrolling into {{name}}', { name: selectedClass.name })}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {t('classes.select_class_to_enable', 'Select a class above to register')}
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={!selectedClassId}
                className="px-5 py-2 rounded-lg bg-[#4338CA] hover:bg-[#4F46E5] disabled:opacity-50 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus size={14} />
                <span>{t('students.register_student', 'Register Student')}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const AddStudentModal = () => {
  const { isAddStudentOpen, setIsAddStudentOpen } = useApp();

  return (
    <AnimatePresence>
      {isAddStudentOpen && (
        <AddStudentModalContent onClose={() => setIsAddStudentOpen(false)} />
      )}
    </AnimatePresence>
  );
};
