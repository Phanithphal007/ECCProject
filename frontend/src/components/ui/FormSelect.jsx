export const FormSelect = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error,
  name,
  className = ""
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 focus:outline-none transition-all shadow-xs ${
          error
            ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
            : 'border-slate-300 bg-white hover:border-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
      >
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

