import { useTranslation } from 'react-i18next';

export const StatusBadge = ({ status, size = "md" }) => {
  const { t } = useTranslation();
  const rawStatus = String(status || '').trim();
  const normalized = rawStatus.toLowerCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  if (normalized.includes('active') || normalized === 'paid' || normalized.includes('present') || normalized.includes('completed') || normalized.includes('evaluated') || normalized.includes('graduated')) {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  } else if (normalized.includes('partial') || normalized.includes('pending') || normalized.includes('scheduled') || normalized.includes('late') || normalized.includes('probation') || normalized.includes('excused')) {
    styles = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  } else if (normalized === 'unpaid' || normalized.includes('overdue') || normalized.includes('absent') || normalized.includes('attention') || normalized.includes('needs evaluation') || normalized.includes('risk') || normalized.includes('withdrawn')) {
    styles = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  } else if (normalized.includes('progress')) {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (normalized.includes('archived') || normalized.includes('inactive')) {
    styles = "bg-slate-100 text-slate-600 border-slate-300";
  }

  const getLabel = () => {
    switch (normalized) {
      case 'active':
        return t('common.active', 'Active');
      case 'inactive':
        return t('common.inactive', 'Inactive');
      case 'archived':
        return t('common.archived', 'Archived');
      case 'probation':
        return t('common.probation', 'Probation');
      case 'graduated':
        return t('common.graduated', 'Graduated');
      case 'withdrawn':
        return t('common.withdrawn', 'Withdrawn');
      case 'paid':
        return t('common.paid', 'Paid');
      case 'partial':
        return t('common.partial', 'Partial');
      case 'unpaid':
        return t('common.unpaid', 'Unpaid');
      case 'pending':
        return t('common.pending', 'Pending');
      case 'overdue':
        return t('common.overdue', 'Overdue');
      case 'evaluated':
        return t('common.evaluated', 'Evaluated');
      case 'needs evaluation':
      case 'needs_evaluation':
        return t('common.needs_evaluation', 'Needs Evaluation');
      case 'completed':
        return t('common.completed', 'Completed');
      case 'in progress':
      case 'in_progress':
        return t('common.in_progress', 'In Progress');
      case 'scheduled':
        return t('common.scheduled', 'Scheduled');
      case 'present':
        return t('common.present', 'Present');
      case 'late':
        return t('common.late', 'Late');
      case 'absent':
        return t('common.absent', 'Absent');
      case 'excused':
        return t('common.excused', 'Excused');
      default:
        return rawStatus;
    }
  };

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${sizeClass} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {getLabel()}
    </span>
  );
};
