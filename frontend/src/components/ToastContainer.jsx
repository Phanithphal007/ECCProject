import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../context/useApp';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = "text-blue-600 bg-blue-50";

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = "text-emerald-600 bg-emerald-50";
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = "text-amber-600 bg-amber-50";
          } else if (toast.type === 'error') {
            Icon = XCircle;
            iconColor = "text-rose-600 bg-rose-50";
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="pointer-events-auto p-4 rounded-xl bg-white shadow-lg border border-slate-200 flex items-start gap-3 relative"
            >
              <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                {toast.title && (
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
