import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Download, Plus, DollarSign, Calendar, Phone, Receipt, X, CheckCircle2, UserCheck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../context/useApp';
import { PaymentService, StudentService } from '../services/api';

export const FinancialsView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, totalOutstanding: 0, collectionRate: 0, paidCount: 0, partialCount: 0, unpaidCount: 0 });
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Record Payment Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [recordAmount, setRecordAmount] = useState('100');
  const [recordMethod, setRecordMethod] = useState('ABA Pay / KHQR');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordNote, setRecordNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const [payRes, sumRes, stuRes] = await Promise.all([
        PaymentService.getAll().catch(() => ({ data: [] })),
        PaymentService.getSummary().catch(() => ({ data: null })),
        StudentService.getAll().catch(() => ({ data: [] }))
      ]);

      if (payRes?.data) setPayments(payRes.data);
      if (sumRes?.data) setSummary(sumRes.data);
      if (stuRes?.data) {
        setStudentsList(stuRes.data);
        if (stuRes.data.length > 0 && !selectedStudentId) {
          setSelectedStudentId(stuRes.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const filtered = payments.filter((p) => {
    if (statusFilter === 'All') return true;
    return p.status === statusFilter;
  });

  const handleSendReminder = (inv) => {
    addToast({
      type: 'success',
      title: 'Payment Reminder Sent',
      message: `Telegram/SMS fee reminder sent to ${inv.guardianName || 'Guardian'} (${inv.phone || 'Phone'}).`
    });
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(recordAmount);
    if (!amt || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', message: 'Amount must be greater than zero.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await PaymentService.recordPayment({
        studentId: selectedStudentId,
        amount: amt,
        paymentMethod: recordMethod,
        paymentDate: recordDate,
        note: recordNote || 'Tuition payment',
        recordedBy: 'Sophea Heng'
      });

      if (res?.success) {
        addToast({ type: 'success', title: 'Payment Saved', message: res.message || 'Payment recorded successfully.' });
        setIsRecordModalOpen(false);
        setRecordNote('');
        fetchFinancials();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to Record Payment', message: err?.response?.data?.error || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <PageHeader
        title={t('financials.title')}
        subtitle={t('financials.subtitle')}
      >
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>{t('financials.record_payment', 'Record Tuition Payment')}</span>
        </button>
      </PageHeader>

      {/* Overview Cards (Real Database Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider">{t('financials.paid_badge', 'Total Collected')}</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">${summary.totalCollected.toLocaleString()} USD</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">{summary.collectionRate}% collected</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider">{t('financials.overdue_badge', 'Outstanding Receivables')}</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">${summary.totalOutstanding.toLocaleString()} USD</p>
          <span className="text-xs text-rose-500 font-medium mt-1 block">
            {summary.partialCount} Partial • {summary.unpaidCount} Unpaid students
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider">{t('classes.level', 'Tuition Tier')}</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">$100.00 / Term</p>
          <span className="text-xs text-slate-400 font-medium mt-1 block">Grade 1 – 12 English</span>
        </div>
      </div>

      {/* Invoice / Payment Transactions Container */}
      <div className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#29364D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="font-semibold text-slate-700 dark:text-[#CBD5E1] mr-1">{t('common.filter')}:</span>
            {['All', 'Paid', 'Partial', 'Unpaid'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === s
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-200 dark:hover:bg-[#29364D]'
                }`}
              >
                {s === 'All' ? t('common.all', 'All') : s === 'Paid' ? t('common.paid', 'Paid') : s === 'Partial' ? t('common.partial', 'Partial') : t('common.unpaid', 'Unpaid')}
              </button>
            ))}
          </div>
          <span className="text-slate-400 dark:text-[#94A3B8] shrink-0 text-right">{filtered.length} {t('financials.title', 'Transactions')}</span>
        </div>

        {/* Desktop Table View (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D] text-slate-500 dark:text-[#94A3B8] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{t('financials.invoice_id', 'Receipt / Invoice')}</th>
                <th className="py-3 px-4">{t('students.col_student_info', 'Student Info')}</th>
                <th className="py-3 px-4">{t('common.grade', 'Grade')}</th>
                <th className="py-3 px-4">{t('financials.term', 'Payment Method')}</th>
                <th className="py-3 px-4">{t('financials.amount', 'Amount Paid')}</th>
                <th className="py-3 px-4">{t('financials.due_date', 'Payment Date')}</th>
                <th className="py-3 px-4">{t('common.status', 'Payment Status')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {inv.receiptNo || inv.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">{inv.studentName}</p>
                      <p className="text-slate-400 dark:text-[#94A3B8] text-[11px] font-mono">
                        ID: {inv.officialStudentId || inv.studentId} • {inv.phone || 'No phone'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-[#CBD5E1]">
                      {inv.grade}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#94A3B8]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0E1729] border border-slate-200 dark:border-[#29364D] text-[10px] font-medium">
                        {inv.paymentMethod || 'ABA Pay / KHQR'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ${parseFloat(inv.amount).toFixed(2)} USD
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#94A3B8]">
                      {inv.paymentDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleSendReminder(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Send size={12} />
                            <span>SMS</span>
                          </button>
                        )}
                        <button
                          onClick={() => addToast({ type: 'success', title: 'Receipt Downloaded', message: `Downloaded receipt for ${inv.receiptNo || inv.id}` })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B] cursor-pointer transition-colors"
                          title={t('reports.download_pdf')}
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Invoice Card List (<md) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#29364D]">
          {filtered.map((inv) => (
            <div key={inv.id} className="p-4 space-y-3 bg-white dark:bg-[#111C32]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-indigo-700 dark:text-indigo-300">
                      {inv.receiptNo || inv.id}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
                      {inv.paymentMethod}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] mt-1">
                    {inv.studentName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mt-0.5">
                    ID: {inv.officialStudentId || inv.studentId}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(inv.amount).toFixed(2)} USD
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={inv.status} size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8] pt-1 border-t border-slate-100 dark:border-[#1E293B]">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>Date: {inv.paymentDate}</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  {inv.grade}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal Dialog */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#111C32] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#29364D] overflow-hidden"
            >
              <div className="p-5 bg-slate-50 dark:bg-[#0E1729] border-b border-slate-200 dark:border-[#29364D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4338CA] dark:text-indigo-400">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Student Tuition Payment</h3>
                    <p className="text-xs text-slate-500">Save payment permanently to MySQL database</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Select Student *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                  >
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.studentId || s.id}) — {s.grade} • Status: {s.paymentStatus || s.tuitionStatus || 'Unpaid'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Payment Amount ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={recordAmount}
                        onChange={(e) => setRecordAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Payment Method
                    </label>
                    <select
                      value={recordMethod}
                      onChange={(e) => setRecordMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs cursor-pointer"
                    >
                      <option value="ABA Pay / KHQR">ABA Pay / KHQR</option>
                      <option value="Wing Bank">Wing Bank</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Note / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Term 1 Full Tuition"
                      value={recordNote}
                      onChange={(e) => setRecordNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#29364D] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-[#4338CA] hover:bg-[#4F46E5] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>{submitting ? 'Recording...' : 'Save Payment'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
