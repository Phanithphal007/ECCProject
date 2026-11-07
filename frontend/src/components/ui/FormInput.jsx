export const FormInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
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
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs ${
          error
            ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
            : 'border-slate-300 bg-white hover:border-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
      />
      {error && (
        <p className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

