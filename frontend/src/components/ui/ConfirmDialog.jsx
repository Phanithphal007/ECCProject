import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger" // 'danger' | 'primary'
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('common.confirm', 'Confirm');
  const displayDescription = description || t('common.action_cannot_be_undone', 'This action cannot be undone.');
  const displayConfirmLabel = confirmLabel || t('common.confirm', 'Confirm');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={displayTitle} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5 py-1">
        <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {displayDescription}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ${
            confirmVariant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {displayConfirmLabel}
        </button>
      </div>
    </Modal>
  );
};
