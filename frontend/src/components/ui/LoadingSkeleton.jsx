export const LoadingSkeleton = ({ count = 3, className = "" }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl w-full" />
      ))}
    </div>
  );
};

