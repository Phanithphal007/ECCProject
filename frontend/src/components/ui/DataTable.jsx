import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DataTable = ({
  columns,
  data,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  pageSize = 10,
  onRowClick,
  emptyMessage
}) => {
  const { t } = useTranslation();
  const displayEmptyMessage = emptyMessage || t('common.no_data', 'No data available');

  return (
    <div className="bg-white dark:bg-[#111C32] rounded-xl border border-slate-200 dark:border-[#29364D] shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-[#1E293B]/80 border-b border-slate-200 dark:border-[#29364D] text-slate-500 dark:text-[#94A3B8] font-semibold text-xs tracking-wider uppercase">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 ${col.className || ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#29364D]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                  {displayEmptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/60 cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-3.5 px-4 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 bg-slate-50/60 dark:bg-[#0E1729] border-t border-slate-200 dark:border-[#29364D] flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
          <div>
            {t('common.showing', 'Showing')}{' '}
            <strong className="text-slate-800 dark:text-[#F8FAFC]">{(currentPage - 1) * pageSize + 1}</strong>{' '}
            {t('common.to', 'to')}{' '}
            <strong className="text-slate-800 dark:text-[#F8FAFC]">{Math.min(currentPage * pageSize, totalItems)}</strong>{' '}
            {t('common.of', 'of')}{' '}
            <strong className="text-slate-800 dark:text-[#F8FAFC]">{totalItems}</strong>{' '}
            {t('common.entries', 'entries')}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#F8FAFC]"
              aria-label={t('common.previous', 'Previous')}
              title={t('common.previous', 'Previous')}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={`w-7 h-7 rounded-md font-semibold text-xs transition-colors ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-[#29364D] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#29364D]'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-700 dark:text-[#F8FAFC]"
              aria-label={t('common.next', 'Next')}
              title={t('common.next', 'Next')}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
