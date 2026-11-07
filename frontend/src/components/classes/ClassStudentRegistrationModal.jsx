import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  AlertCircle,
  Sparkles,
  Camera,
  RefreshCw,
  GraduationCap,
  Users
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { generateSixDigitStudentId, isValidStudentId, getOfficialStudentId } from '../../utils/studentId';
import StudentAvatarPicker from '../StudentAvatarPicker';

export const ClassStudentRegistrationModal = ({
  isOpen,
  onClose,
  currentClass,
  availableSeats = 10,
  capacity = 25,
  enrolledCount = 0
}) => {
  const { t } = useTranslation();
  const { registerAndEnrollStudent, students = [] } = useApp();
  const formKeyPrefix = useId();

  const [studentId] = useState(() => generateSixDigitStudentId(students));
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [khmerFirstName, setKhmerFirstName] = useState('');
  const [khmerLastName, setKhmerLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [academicRemarks, setAcademicRemarks] = useState('');
  const [status, setStatus] = useState('Active');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paidAmount, setPaidAmount] = useState('50');
  const [avatar, setAvatar] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  const [errors, setErrors] = useState({});

  if (!isOpen || !currentClass) return null;

  const isFull = availableSeats <= 0;

  const handleRegenerateId = () => {
    setStudentId(generateStudentId());
  };

  const validate = () => {
    const errs = {};
    if (!firstName.trim()) errs.firstName = t('classes.val_first_name_req', 'English First Name is required');
    if (!lastName.trim()) errs.lastName = t('classes.val_last_name_req', 'English Last Name is required');
    if (!guardianName.trim()) errs.guardianName = t('students.val_guardian_name_req', 'Guardian Name is required');
    if (!guardianPhone.trim()) errs.guardianPhone = t('students.val_guardian_phone_req', 'Guardian Phone is required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const khmerFullName = `${khmerLastName.trim()} ${khmerFirstName.trim()}`.trim();

    const newStudent = {
      studentId,
      studentCode: studentId,
      student_code: studentId,
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      khmerName: khmerFullName || null,
      khmerFirstName: khmerFirstName.trim(),
      khmerLastName: khmerLastName.trim(),
      gender,
      dob: dob || null,
      studentPhone: studentPhone.trim() || null,
      phone: studentPhone.trim() || null,
      email: email.trim() || null,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      address: address.trim() || null,
      notes: academicRemarks.trim() || null,
      academicRemarks: academicRemarks.trim() || null,
      status,
      avatar: (showCustomAvatarInput && customAvatar.trim()) ? customAvatar.trim() : (avatar && avatar.trim() ? avatar.trim() : null),
      grade: currentClass.gradeLevel || 'Grade 1',
      className: currentClass.name,
      teacher: currentClass.teacher,
      englishLevel: currentClass.subjectName || 'Beginner',
      joinDate: new Date().toISOString().slice(0, 10),
      attendanceRate: 100,
      tuitionStatus: paymentStatus,
      paymentStatus: paymentStatus,
      paidAmount: paymentStatus === 'Partial' ? (parseFloat(paidAmount) || 50) : (paymentStatus === 'Paid' ? 100 : 0)
    };

    registerAndEnrollStudent(newStudent, currentClass.id);
    onClose();
  };

  return (
    <AnimatePresence>
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
                  {t('classes.register_student_modal_title', 'Register New Student to Class')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  {t('classes.register_student_modal_sub', 'Enter student details to create their profile and auto-enroll them into this cohort.')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Class Target & Capacity Indicator Strip */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-[#0E1729] border-b border-slate-100 dark:border-[#29364D] shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800 text-[11px]">
                  {currentClass.code}
                </span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {currentClass.name}
                </span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-600 dark:text-[#CBD5E1] flex items-center gap-1">
                  <GraduationCap size={13} className="text-indigo-500" />
                  {currentClass.teacher}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-[#94A3B8] text-[11px]">
                  {t('classes.capacity', 'Cohort Capacity')}:
                </span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isFull
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {enrolledCount} / {capacity} ({availableSeats} {t('classes.seats_left', 'seats left')})
                </span>
              </div>
            </div>

            {/* Capacity Warning Banner */}
            {isFull && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  {t('classes.capacity_full_warning', 'Notice: This class has reached its maximum enrollment capacity ({{capacity}} students). Proceeding will over-enroll.', { capacity })}
                </span>
              </div>
            )}
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs bg-white dark:bg-[#111C32] flex-1">
            {/* Student ID & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-[#29364D]">
              <div>
                <label className="block font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.form_student_id', 'Generated Student ID')}
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
                  {t('common.status', 'Initial Status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">{t('common.active', 'Active')}</option>
                  <option value="Probation">{t('common.probation', 'Probation')}</option>
                </select>
              </div>

              {/* Payment Status Segmented Control */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-[#29364D]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 dark:text-[#CBD5E1]">
                    {t('students.payment_status', 'Tuition Payment Status')}
                  </label>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
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

            {/* English Names */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {t('students.english_name_section', 'English Legal Name')} *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formKeyPrefix}-firstName`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {t('students.first_name', 'First Name')} *
                  </label>
                  <input
                    id={`${formKeyPrefix}-firstName`}
                    type="text"
                    placeholder="e.g. Sothea"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border ${
                      errors.firstName ? 'border-rose-400' : 'border-slate-300 dark:border-[#29364D]'
                    } text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.firstName && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`${formKeyPrefix}-lastName`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {t('students.last_name', 'Last Name')} *
                  </label>
                  <input
                    id={`${formKeyPrefix}-lastName`}
                    type="text"
                    placeholder="e.g. Chan"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border ${
                      errors.lastName ? 'border-rose-400' : 'border-slate-300 dark:border-[#29364D]'
                    } text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.lastName && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Khmer Names */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-khmer">
                {t('students.khmer_name_section', 'ឈ្មោះជាភាសាខ្មែរ (Khmer Name)')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formKeyPrefix}-khmerLastName`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1 font-khmer">
                    {t('students.khmer_last_name', 'គោត្តនាម (Family Name)')}
                  </label>
                  <input
                    id={`${formKeyPrefix}-khmerLastName`}
                    type="text"
                    placeholder="e.g. ចាន់"
                    value={khmerLastName}
                    onChange={(e) => setKhmerLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-khmer"
                  />
                </div>

                <div>
                  <label htmlFor={`${formKeyPrefix}-khmerFirstName`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1 font-khmer">
                    {t('students.khmer_first_name', 'នាមខ្លួន (Given Name)')}
                  </label>
                  <input
                    id={`${formKeyPrefix}-khmerFirstName`}
                    type="text"
                    placeholder="e.g. សុធា"
                    value={khmerFirstName}
                    onChange={(e) => setKhmerFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-khmer"
                  />
                </div>
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
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

            {/* Contact Details: Phone & Email */}
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
                <label htmlFor={`${formKeyPrefix}-email`} className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {t('students.email', 'Email Address (Optional)')}
                </label>
                <input
                  id={`${formKeyPrefix}-email`}
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

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

            {/* Address */}
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

            {/* Student Avatar / Photo Selection */}
            <StudentAvatarPicker
              value={avatar}
              onChange={setAvatar}
              customAvatar={customAvatar}
              onCustomAvatarChange={setCustomAvatar}
              showCustomInput={showCustomAvatarInput}
              onToggleCustomInput={setShowCustomAvatarInput}
            />

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500" />
                <span>{t('classes.auto_enrolled_note', 'Auto-enrolling into {{class}}', { class: currentClass.name })}</span>
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
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>{t('classes.register_and_enroll_btn', 'Register & Enroll')}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

