import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Phone, 
  FileText,
  Send,
  DollarSign,
  Receipt,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { StatusBadge } from './ui/StatusBadge';
import { formatGrade, formatStudentName, formatAttendanceRate } from '../utils/formatters';
import { getOfficialStudentId } from '../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';
import { PaymentService, EnrollmentService } from '../services/api';
import { scoreService, calculateScoreMetrics } from '../services/scoreService';

export const StudentDetailModal = () => {
  const { t, i18n } = useTranslation();
  const { selectedStudent, setSelectedStudent, updateStudentStatus, addToast, classes = [] } = useApp();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tuition' | 'academic' | 'guardian'

  // Real Database Payment State
  const [paymentData, setPaymentData] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('ABA Pay / KHQR');
  const [payNote, setPayNote] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Real Database Score / Assessment State
  const [scoreRecord, setScoreRecord] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);

  // Real Database Class Enrollments State
  const [studentEnrollments, setStudentEnrollments] = useState(null);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  useEffect(() => {
    if (!selectedStudent?.id) {
      setPaymentData(null);
      setScoreRecord(null);
      setStudentEnrollments(null);
      return;
    }
    let isMounted = true;
    setLoadingPayment(true);
    setLoadingScores(true);
    setLoadingEnrollments(true);

    EnrollmentService.getByStudentId(selectedStudent.id)
      .then((res) => {
        if (isMounted && res?.data) {
          setStudentEnrollments(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load student enrollments:', err);
        if (isMounted) setStudentEnrollments(null);
      })
      .finally(() => {
        if (isMounted) setLoadingEnrollments(false);
      });

    PaymentService.getStudentPayments(selectedStudent.id)
      .then((res) => {
        if (isMounted && res?.data) {
          setPaymentData(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load student payments:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingPayment(false);
      });

    scoreService.getStudentScores(selectedStudent.id)
      .then((res) => {
        if (isMounted) {
          setScoreRecord(res?.data || null);
        }
      })
      .catch((err) => {
        console.warn('Could not load student scores:', err);
        if (isMounted) setScoreRecord(null);
      })
      .finally(() => {
        if (isMounted) setLoadingScores(false);
      });

    return () => { isMounted = false; };
  }, [selectedStudent?.id]);

  // Dynamically resolve student's active enrolled class(es)
  const enrolledClassesList = useMemo(() => {
    if (!selectedStudent) return [];

    // 1. From real database enrollments if available
    if (Array.isArray(studentEnrollments) && studentEnrollments.length > 0) {
      const dbClasses = studentEnrollments
        .map((e) => e.class_name || e.className || e.name)
        .filter(Boolean);
      if (dbClasses.length > 0) return [...new Set(dbClasses)];
    }

    // 2. From AppContext active classes
    if (Array.isArray(classes) && classes.length > 0) {
      const activeEnrolled = classes
        .filter((c) => {
          if (c.status === 'Archived') return false;
          const ids = Array.isArray(c.enrolledStudentIds) ? c.enrolledStudentIds : [];
          return ids.includes(selectedStudent.id) || ids.includes(selectedStudent.studentId);
        })
        .map((c) => c.name)
        .filter(Boolean);
      if (activeEnrolled.length > 0) return [...new Set(activeEnrolled)];
    }

    // 3. Fallback: check if student has classId
    if (selectedStudent.classId && Array.isArray(classes)) {
      const cls = classes.find((c) => c.id === selectedStudent.classId);
      if (cls?.name) return [cls.name];
    }

    // 4. Fallback: check if student has className
    if (selectedStudent.className) {
      return [selectedStudent.className];
    }

    return [];
  }, [selectedStudent, studentEnrollments, classes]);

  const assessmentItems = useMemo(() => {
    if (scoreRecord && Array.isArray(scoreRecord.items) && scoreRecord.items.length > 0) {
      return scoreRecord.items;
    }
    return [];
  }, [scoreRecord]);

  const scoreMetrics = useMemo(() => {
    if (assessmentItems.length === 0) {
      return { totalMax: 0, totalObtained: 0, percentage: 0, grade: '-' };
    }
    return calculateScoreMetrics(assessmentItems);
  }, [assessmentItems]);

  const totalMax = scoreRecord?.max_score ? Number(scoreRecord.max_score) : scoreMetrics.totalMax;
  const totalEarned = scoreRecord?.total_score ? Number(scoreRecord.total_score) : scoreMetrics.totalObtained;
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(1)) : 0;
  const finalGrade = (scoreRecord?.grade && scoreRecord.grade !== '-' && scoreRecord.grade !== 'In Progress')
    ? scoreRecord.grade
    : (scoreMetrics.grade && scoreMetrics.grade !== '-')
      ? scoreMetrics.grade
      : (percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : percentage >= 50 ? 'E' : 'F');

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', message: 'Please enter a valid payment amount.' });
      return;
    }
    setSubmittingPay(true);
    try {
      const res = await PaymentService.recordPayment({
        studentId: selectedStudent.id,
        amount: amt,
        paymentMethod: payMethod,
        note: payNote || 'Tuition payment',
        recordedBy: 'Sophea Heng'
      });
      if (res?.success) {
        addToast({ type: 'success', title: 'Payment Recorded', message: res.message || 'Payment successfully recorded.' });
        const updated = await PaymentService.getStudentPayments(selectedStudent.id);
        if (updated?.data) {
          setPaymentData(updated.data);
          setSelectedStudent({
            ...selectedStudent,
            tuitionStatus: updated.data.paymentStatus,
            paymentStatus: updated.data.paymentStatus
          });
        }
        setIsRecordModalOpen(false);
        setPayAmount('');
        setPayNote('');
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Payment Failed', message: err?.response?.data?.error || err.message });
    } finally {
      setSubmittingPay(false);
    }
  };

  if (!selectedStudent) return null;

  const handleStatusChange = (newStatus) => {
    updateStudentStatus(selectedStudent.id, newStatus);
    setSelectedStudent({ ...selectedStudent, status: newStatus });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedStudent(null)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200 dark:border-[#29364D] overflow-hidden z-10 my-8 transition-colors"
        >
          {/* Header Profile Banner */}
          <div className="p-6 bg-slate-50 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D]">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1E293B] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={getStudentAvatarUrl(selectedStudent.avatar)}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white dark:border-[#29364D] shadow-xs bg-slate-100 dark:bg-slate-800"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {formatStudentName(selectedStudent, i18n.language)}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-bold border border-transparent dark:border-[#29364D]">
                    {getOfficialStudentId(selectedStudent)}
                  </span>
                  <StatusBadge status={selectedStudent.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                  {formatGrade(selectedStudent.grade, i18n.language)} • {selectedStudent.className} • {t('common.lead_teacher')}: <strong className="text-slate-700 dark:text-[#F8FAFC]">{selectedStudent.teacher}</strong>
                </p>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-[#29364D] text-center">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] uppercase font-bold tracking-wider">
                  {t('students.detail_label_grade')}
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                  {formatGrade(selectedStudent.grade, i18n.language)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] uppercase font-bold tracking-wider">
                  {t('common.score')}
                </p>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedStudent.recentScore || '90/100'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] uppercase font-bold tracking-wider">
                  {t('students.detail_label_attendance')}
                </p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatAttendanceRate(selectedStudent.attendanceRate, i18n.language)}
                </p>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-[#29364D] px-6 bg-white dark:bg-[#111C32] overflow-x-auto scrollbar-thin">
            {[
              { id: 'overview', label: t('students.detail_profile_tab', 'Overview') },
              { id: 'tuition', label: t('financials.title', 'Tuition & Payments') },
              { id: 'academic', label: t('students.detail_academic_tab', 'Academic') },
              { id: 'guardian', label: t('students.detail_guardian_tab', 'Guardian') }
            ].map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#4338CA] text-[#4338CA] dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-xs bg-white dark:bg-[#111C32]">
            {activeTab === 'overview' && (
              <>
                {/* Student Profile Header Summary */}
                <div data-testid="student-summary-row" className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-3 leading-relaxed">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{t('students.detail_label_name')}: </span>
                    <span className="font-bold text-indigo-900 dark:text-indigo-300">
                      {i18n.language === 'km' ? (selectedStudent.khmerName || selectedStudent.name) : selectedStudent.name}
                    </span>
                  </div>
                  <div className="text-xs flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
                      {t('students.detail_label_class', 'Class')}:{' '}
                    </span>
                    {enrolledClassesList.length === 0 ? (
                      <span className="font-bold text-slate-400 dark:text-slate-500 italic">
                        {t('classes.not_assigned', 'Not Assigned')}
                      </span>
                    ) : enrolledClassesList.length === 1 ? (
                      <span className="font-bold text-indigo-900 dark:text-indigo-300">
                        {enrolledClassesList[0]}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 flex-wrap">
                        {enrolledClassesList.map((clsName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100/90 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/60"
                          >
                            {clsName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{t('students.detail_label_level')}: </span>
                    <span className="font-bold text-indigo-900 dark:text-indigo-300">{selectedStudent.englishLevel || 'Beginner'}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{t('students.detail_label_attendance')}: </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedStudent.attendanceRate >= 80 ? t('common.present') : t('common.absent')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-[#94A3B8] uppercase">{t('students.detail_contact_info')}</p>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-[#CBD5E1]">
                      <Phone size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{selectedStudent.studentPhone || selectedStudent.guardianPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-[#CBD5E1]">
                      <Mail size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{selectedStudent.email || `${getOfficialStudentId(selectedStudent)}@edumanage.kh`}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-[#94A3B8] uppercase">{t('students.detail_enrollment')}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-[#CBD5E1]">{t('students.payment_status', 'Payment Status')}:</span>
                      <StatusBadge status={paymentData?.paymentStatus || selectedStudent.paymentStatus || selectedStudent.tuitionStatus || 'Unpaid'} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-[#CBD5E1]">
                      <span>{t('financials.total_tuition', 'Total Tuition')}:</span>
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">${paymentData?.totalTuition ?? 100}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-[#CBD5E1]">
                      <span>{t('financials.total_paid', 'Total Paid')}:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">${paymentData?.totalPaid ?? 0}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-[#CBD5E1]">
                      <span>{t('financials.balance_due', 'Outstanding Balance')}:</span>
                      <span className={`font-bold ${paymentData?.outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                        ${paymentData?.outstandingBalance ?? 0}.00
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-[#CBD5E1] pt-1 border-t border-slate-200 dark:border-[#29364D]">
                      <span>{t('students.detail_registered_date')}:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400">{selectedStudent.joinDate}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D]">
                  <p className="font-semibold text-slate-800 dark:text-[#F8FAFC] mb-1 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                    {t('students.detail_academic_remarks')}
                  </p>
                  <p className="text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    {selectedStudent.notes || `Student is progressing well in ${selectedStudent.grade} English.`}
                  </p>
                </div>

                {/* Status Toggle */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-[#94A3B8]">{t('students.detail_roster_status')}:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange('Active')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        selectedStudent.status === 'Active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-200 dark:hover:bg-[#29364D]'
                      }`}
                    >
                      {t('common.active')}
                    </button>
                    <button
                      onClick={() => handleStatusChange('At-Risk')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        selectedStudent.status === 'At-Risk'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-200 dark:hover:bg-[#29364D]'
                      }`}
                    >
                      {t('common.at_risk')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tuition' && (
              <div className="space-y-4">
                {/* 4 Financial KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#94A3B8] tracking-wider block">
                      {t('financials.total_tuition', 'Total Tuition')}
                    </span>
                    <p className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                      ${paymentData?.totalTuition ?? 100}.00
                    </p>
                    <span className="text-[10px] text-slate-400">Academic Term 1</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#94A3B8] tracking-wider block">
                      {t('financials.total_paid', 'Total Paid')}
                    </span>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      ${paymentData?.totalPaid ?? 0}.00
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {paymentData?.totalTuition > 0 ? Math.round(((paymentData?.totalPaid || 0) / paymentData.totalTuition) * 100) : 0}% Paid
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#94A3B8] tracking-wider block">
                      {t('financials.balance_due', 'Balance Due')}
                    </span>
                    <p className={`text-lg font-bold mt-1 ${
                      (paymentData?.outstandingBalance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-[#CBD5E1]'
                    }`}>
                      ${paymentData?.outstandingBalance ?? 0}.00
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {(paymentData?.outstandingBalance ?? 0) === 0 ? 'Fully settled' : 'Outstanding'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#94A3B8] tracking-wider block">
                      {t('students.payment_status', 'Payment Status')}
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={paymentData?.paymentStatus || selectedStudent.paymentStatus || selectedStudent.tuitionStatus || 'Unpaid'} size="md" />
                    </div>
                  </div>
                </div>

                {/* Last Payment Date & Record Action Header */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-[#CBD5E1]">
                    <Clock size={15} className="text-[#4338CA] dark:text-indigo-400" />
                    <span>
                      <strong>Last Payment Date:</strong> {paymentData?.lastPaymentDate || 'No payments recorded yet'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRecordModalOpen(!isRecordModalOpen);
                      if (!payAmount) setPayAmount(String(paymentData?.outstandingBalance || 50));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#4F46E5] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <PlusCircle size={13} />
                    <span>{isRecordModalOpen ? 'Cancel Payment' : 'Record Payment'}</span>
                  </button>
                </div>

                {/* Inline Record Payment Form */}
                {isRecordModalOpen && (
                  <form onSubmit={handleRecordPayment} className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border-2 border-indigo-200 dark:border-indigo-800 space-y-3 shadow-md">
                    <p className="font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-1.5">
                      <CreditCard size={14} className="text-[#4338CA] dark:text-indigo-400" />
                      <span>Record Tuition Payment for {selectedStudent.name}</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          Amount ($ USD) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111C32] text-slate-900 dark:text-white font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          Payment Method
                        </label>
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111C32] text-slate-900 dark:text-white text-xs cursor-pointer"
                        >
                          <option value="ABA Pay / KHQR">ABA Pay / KHQR</option>
                          <option value="Wing Bank">Wing Bank</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          Note / Reference
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Term 1 Balance settlement"
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111C32] text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsRecordModalOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingPay}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 size={13} />
                        <span>{submittingPay ? 'Recording...' : 'Submit Payment'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Payment History Table */}
                <div className="rounded-xl border border-slate-200 dark:border-[#29364D] overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D] font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Receipt size={14} className="text-[#4338CA] dark:text-indigo-400" />
                      <span>Permanent Payment History (MySQL Database)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {paymentData?.history?.length || 0} Transactions
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 dark:bg-[#1E293B]/80 border-b border-slate-200 dark:border-[#29364D] text-slate-500 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Receipt No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Note</th>
                          <th className="py-2.5 px-3">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
                        {!paymentData?.history || paymentData.history.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                              No payment transactions recorded for this student yet.
                            </td>
                          </tr>
                        ) : (
                          paymentData.history.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/50 transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                                {tx.receiptNo}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-[#CBD5E1]">
                                {tx.paymentDate}
                              </td>
                              <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                ${parseFloat(tx.amount).toFixed(2)} USD
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-[#94A3B8]">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0E1729] border border-slate-200 dark:border-[#29364D] text-[10px] font-medium">
                                  {tx.paymentMethod}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-[#94A3B8]">
                                {tx.note || '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-500 dark:text-[#94A3B8]">
                                {tx.recordedBy}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-[#F8FAFC]">{t('students.detail_eval_status')}</p>
                    <p className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5">{t('students.detail_eval_sub')}</p>
                  </div>
                  <StatusBadge status={scoreRecord?.status || selectedStudent.evaluationStatus} />
                </div>

                {/* Compact Score Breakdown Table */}
                <div className="rounded-xl border border-slate-200 dark:border-[#29364D] overflow-hidden shadow-2xs bg-white dark:bg-[#111C32]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-[#29364D] text-slate-600 dark:text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-[#29364D]">
                            {i18n.language === 'km' ? 'ល.រ' : 'No.'}
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-200 dark:border-[#29364D]">
                            {i18n.language === 'km' ? 'មុខវិជ្ជា / ការវាយតម្លៃ' : 'Assessment / Subject Name'}
                          </th>
                          <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 dark:border-[#29364D]">
                            {i18n.language === 'km' ? 'ពិន្ទុអតិបរមា' : 'Maximum Score'}
                          </th>
                          <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 dark:border-[#29364D]">
                            {i18n.language === 'km' ? 'ពិន្ទុទទួលបាន' : 'Student Score'}
                          </th>
                          <th className="py-2.5 px-3 text-center w-20">
                            {i18n.language === 'km' ? 'និទ្ទេស' : 'Grade'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
                        {loadingScores ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                              {i18n.language === 'km' ? 'កំពុងផ្ទុកពិន្ទុ...' : 'Loading assessment scores...'}
                            </td>
                          </tr>
                        ) : assessmentItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                              {i18n.language === 'km' ? 'មិនមានទិន្នន័យពិន្ទុវាយតម្លៃទេ' : 'No assessment records found for this student.'}
                            </td>
                          </tr>
                        ) : (
                          assessmentItems.map((item, idx) => {
                            const max = Number(item.maxScore ?? item.max_score ?? 0);
                            const obt = Number(item.obtainedScore ?? item.obtained_score ?? 0);
                            const ratio = max > 0 ? (obt / max) * 100 : 0;
                            const itemGrade = item.grade || (ratio >= 90 ? 'A' : ratio >= 80 ? 'B' : ratio >= 70 ? 'C' : ratio >= 60 ? 'D' : ratio >= 50 ? 'E' : 'F');
                            const noDisplay = i18n.language === 'km'
                              ? (['១','២','៣','៤','៥','៦','៧','៨','៩','១០'][idx] || (idx + 1))
                              : (idx + 1);
                            const displayName = i18n.language === 'km'
                              ? (item.nameKhmer || item.name_khmer || item.name)
                              : (item.name || item.nameKhmer || item.name_khmer);

                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-[#1E293B]/50 transition-colors">
                                <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-[#CBD5E1] border-r border-slate-100 dark:border-[#29364D]">
                                  {noDisplay}
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-[#F8FAFC] border-r border-slate-100 dark:border-[#29364D]">
                                  {displayName}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-[#CBD5E1] border-r border-slate-100 dark:border-[#29364D]">
                                  {max}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-[#4338CA] dark:text-indigo-400 border-r border-slate-100 dark:border-[#29364D]">
                                  {obt}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                                    itemGrade === 'A' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                                    itemGrade === 'B' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                                    itemGrade === 'C' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                                    'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  }`}>
                                    {itemGrade}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {assessmentItems.length > 0 && (
                        <tfoot className="bg-slate-50 dark:bg-[#0E1729] border-t-2 border-slate-200 dark:border-[#29364D] font-bold">
                          <tr>
                            <td colSpan={2} className="py-3 px-4 text-right text-slate-700 dark:text-[#CBD5E1] border-r border-slate-200 dark:border-[#29364D]">
                              <span className="uppercase text-[11px] tracking-wider">
                                {i18n.language === 'km' ? 'ពិន្ទុសរុប និងនិទ្ទេស' : 'Total Score & Grade'}:
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-800 dark:text-white border-r border-slate-200 dark:border-[#29364D] text-xs">
                              <span className="text-[10px] text-slate-400 block font-normal">{i18n.language === 'km' ? 'អតិបរមា' : 'Max'}</span>
                              <span>{totalMax}</span>
                            </td>
                            <td className="py-3 px-3 text-center text-[#4338CA] dark:text-indigo-400 border-r border-slate-200 dark:border-[#29364D] text-sm font-extrabold">
                              <span className="text-[10px] text-slate-400 block font-normal">{i18n.language === 'km' ? 'ទទួលបាន' : 'Earned'}</span>
                              <span>{totalEarned}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-[10px] text-slate-400 block font-normal">{i18n.language === 'km' ? 'និទ្ទេស' : 'Grade'}</span>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                                {finalGrade}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Calculated Summary Below Table */}
                {assessmentItems.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-500 dark:text-[#94A3B8]">
                        {i18n.language === 'km' ? 'ពិន្ទុអតិបរមាសរុប' : 'Total Maximum Score'}:
                      </span>
                      <strong className="text-slate-800 dark:text-[#F8FAFC]">{totalMax}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-500 dark:text-[#94A3B8]">
                        {i18n.language === 'km' ? 'ពិន្ទុទទួលបានសរុប' : 'Total Earned Score'}:
                      </span>
                      <strong className="text-[#4338CA] dark:text-indigo-400 text-sm">
                        {totalEarned} / {totalMax}
                      </strong>
                      <span className="text-slate-400 font-medium">({percentage}%)</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-500 dark:text-[#94A3B8]">
                        {i18n.language === 'km' ? 'និទ្ទេសចុងក្រោយ' : 'Final Grade'}:
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        {finalGrade}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'guardian' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">
                      {selectedStudent.guardianName}
                    </p>
                    <p className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5">
                      {t('common.phone')}: <span className="font-mono text-slate-800 dark:text-[#CBD5E1]">{selectedStudent.guardianPhone}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addToast({
                        type: 'success',
                        title: t('students.sms_dispatched_title'),
                        message: t('students.sms_dispatched_msg')
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#4F46E5] text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send size={12} />
                    <span>{t('students.send_sms')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-[#0E1729] border-t border-slate-200 dark:border-[#29364D] flex items-center justify-end">
            <button
              onClick={() => setSelectedStudent(null)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-[#1E293B] hover:bg-slate-300 dark:hover:bg-[#29364D] text-slate-800 dark:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
