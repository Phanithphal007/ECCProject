import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Edit2,
  AlertCircle,
  Save,
  Camera,
  Users
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import StudentAvatarPicker from '../StudentAvatarPicker';

const parseNames = (student) => {
  let first = '';
  let last = '';
  if (student?.firstName && student?.lastName) {
    first = student.firstName;
    last = student.lastName;
  } else if (student?.name) {
    const parts = student.name.trim().split(' ');
    if (parts.length > 1) {
      first = parts.slice(0, -1).join(' ');
      last = parts[parts.length - 1];
    } else {
      first = student.name;
    }
  }

  let khmerFirst = '';
  let khmerLast = '';
  if (student?.khmerFirstName || student?.khmerLastName) {
    khmerFirst = student.khmerFirstName || '';
    khmerLast = student.khmerLastName || '';
  } else if (student?.khmerName) {
    const parts = student.khmerName.trim().split(' ');
    if (parts.length > 1) {
      khmerLast = parts[0];
      khmerFirst = parts.slice(1).join(' ');
    } else {
      khmerFirst = student.khmerName;
    }
  }

  return { first, last, khmerFirst, khmerLast };
};

const ClassStudentEditModalContent = ({ student, onClose }) => {
  const { t } = useTranslation();
  const { updateStudent } = useApp();
  const formKeyPrefix = useId();

  const initialNames = parseNames(student);

  const [firstName, setFirstName] = useState(initialNames.first);
  const [lastName, setLastName] = useState(initialNames.last);
  const [khmerFirstName, setKhmerFirstName] = useState(initialNames.khmerFirst);
  const [khmerLastName, setKhmerLastName] = useState(initialNames.khmerLast);
  const [gender, setGender] = useState(student?.gender || 'Male');
  const [dob, setDob] = useState(student?.dob || student?.dateOfBirth || '');
  const [studentPhone, setStudentPhone] = useState(student?.studentPhone || student?.phone || '');
  const [email, setEmail] = useState(student?.email || '');
  const [guardianName, setGuardianName] = useState(student?.guardianName || '');
  const [guardianPhone, setGuardianPhone] = useState(student?.guardianPhone || '');
  const [address, setAddress] = useState(student?.address || '');
  const [academicRemarks, setAcademicRemarks] = useState(student?.academicRemarks || student?.notes || '');
  const [status, setStatus] = useState(student?.status || 'Active');
  const [paymentStatus, setPaymentStatus] = useState(student?.paymentStatus || student?.tuitionStatus || 'Unpaid');
  const [avatar, setAvatar] = useState(student?.avatar || '');
  const [customAvatar, setCustomAvatar] = useState(student?.avatar || '');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!firstName.trim() && !lastName.trim()) {
      errs.firstName = t('classes.val_first_name_req', 'English Name is required');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const khmerFullName = `${khmerLastName.trim()} ${khmerFirstName.trim()}`.trim();

    const updatedData = {
      name: fullName || student.name,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      khmerName: khmerFullName || student.khmerName || null,
      khmerFirstName: khmerFirstName.trim(),
      khmerLastName: khmerLastName.trim(),
      gender,
      dob: dob || null,
      studentPhone: studentPhone.trim() || null,
      phone: studentPhone.trim() || null,
      email: email.trim() || null,
      guardianName: guardianName.trim() || student.guardianName,
      guardianPhone: guardianPhone.trim() || student.guardianPhone,
      address: address.trim() || null,
      notes: academicRemarks.trim() || null,
      academicRemarks: academicRemarks.trim() || null,
      status,
      tuitionStatus: paymentStatus,
      paymentStatus: paymentStatus,
      avatar: showCustomAvatarInput && customAvatar.trim() ? customAvatar.trim() : (avatar && avatar.trim() ? avatar.trim() : null)
    };

    updateStudent(student.id, updatedData);
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
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              <Edit2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                {t('classes.edit_student_modal_title', 'Update Student Information')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {t('classes.edit_student_modal_sub', 'Modify profile, contact information, and enrollment status for')} <strong className="text-indigo-600 dark:text-indigo-400">{student.name}</strong> ({student.id}).
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs bg-white dark:bg-[#111C32] flex-1">
          {/* Student ID & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-[#29364D]">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                {t('students.form_student_id', 'Student ID')}
              </label>
              <input
                type="text"
                disabled
                value={student.id}
                className="w-full font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0E1729] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#29364D] text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                {t('common.status', 'Status')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">{t('common.active', 'Active')}</option>
                <option value="Probation">{t('common.probation', 'Probation')}</option>
                <option value="Archived">{t('common.archived', 'Archived')}</option>
                <option value="Graduated">{t('common.graduated', 'Graduated')}</option>
              </select>
            </div>

            {/* Payment Status */}
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
                  {t('students.last_name', 'Last Name')}
                </label>
                <input
                  id={`${formKeyPrefix}-lastName`}
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
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
                {t('students.phone', 'Student Phone')}
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
                {t('students.email', 'Email Address')}
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
              <span>{t('students.form_guardian_section', 'Parent / Guardian Information')}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formKeyPrefix}-guardianName`} className="block text-slate-600 dark:text-[#CBD5E1] mb-1 font-semibold">
                  {t('students.form_guardian_name', 'Guardian Full Name')}
                </label>
                <input
                  id={`${formKeyPrefix}-guardianName`}
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor={`${formKeyPrefix}-guardianPhone`} className="block text-slate-600 dark:text-[#CBD5E1] mb-1 font-semibold">
                  {t('students.form_guardian_phone', 'Guardian Phone')}
                </label>
                <input
                  id={`${formKeyPrefix}-guardianPhone`}
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111C32] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden"
                />
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
          <div className="pt-3 border-t border-slate-100 dark:border-[#29364D] flex items-center justify-end gap-2">
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
              <Save size={14} />
              <span>{t('common.save_changes', 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const ClassStudentEditModal = ({ isOpen, onClose, student }) => {
  return (
    <AnimatePresence>
      {isOpen && student && (
        <ClassStudentEditModalContent
          key={student.id}
          student={student}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
};
