import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, description, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`relative w-full ${maxWidth} max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#111C32] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#29364D] overflow-hidden z-10 text-slate-900 dark:text-[#F8FAFC]`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between shrink-0 bg-white dark:bg-[#111C32]">
            <div className="min-w-0 pr-2">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
