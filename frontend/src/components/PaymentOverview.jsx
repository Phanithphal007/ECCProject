import { DollarSign, AlertCircle, Send, FileText } from 'lucide-react';
import { useApp } from '../context/useApp';

export const PaymentOverview = () => {
  const { invoices, sendPaymentReminder, setActiveTab } = useApp();

  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const pendingInvoices = invoices.filter((i) => i.status === 'Pending');
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" />
              Tuition & Fee Oversight
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Outstanding receivables & installment reminders
            </p>
          </div>
          <button
            onClick={() => setActiveTab('financials')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            All Invoices →
          </button>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                Overdue Total
              </span>
              <AlertCircle size={14} className="text-rose-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ${overdueInvoices.reduce((acc, i) => acc + i.amount, 0)}
            </p>
            <p className="text-[10px] text-rose-600 dark:text-rose-400">
              {overdueInvoices.length} student accounts
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Due This Week
              </span>
              <FileText size={14} className="text-amber-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ${pendingInvoices.reduce((acc, i) => acc + i.amount, 0)}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {pendingInvoices.length} invoices scheduled
            </p>
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-2.5">
          {invoices.filter((i) => i.status !== 'Paid').map((inv) => (
            <div
              key={inv.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {inv.studentName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {inv.course} • Due {inv.dueDate}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white">
                  ${inv.amount}
                </span>

                <button
                  onClick={() => sendPaymentReminder(inv.id, inv.studentName)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 transition-colors"
                  title="Send Automated Reminder"
                >
                  <Send size={11} />
                  <span>Remind</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Total Outstanding:</span>
        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
          ${totalOutstanding.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
