import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No records found",
  description = "There are currently no items matching your criteria.",
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <Icon size={24} />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">
        {title}
      </h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

