import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

export const EnrollmentChart = () => {
  const [metric, setMetric] = useState('enrollment'); // 'enrollment' | 'revenue'
  const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d' | '90d' | '1y'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const dataset = {
    '7d': {
      enrollment: [12, 18, 15, 24, 20, 28, 32],
      revenue: [3200, 4800, 3900, 5600, 5100, 6800, 7400],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      dates: ['Oct 28', 'Oct 29', 'Oct 30', 'Oct 31', 'Nov 01', 'Nov 02', 'Nov 03']
    },
    '30d': {
      enrollment: [24, 32, 28, 42, 38, 49, 58, 64, 59, 72, 85, 94],
      revenue: [12400, 15800, 14200, 19500, 18200, 23400, 27600, 31000, 29400, 35600, 42000, 48250],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
      dates: ['Aug W1', 'Aug W3', 'Sep W1', 'Sep W3', 'Oct W1', 'Oct W2', 'Oct W3', 'Oct W4', 'Nov W1', 'Nov W2', 'Nov W3', 'Current']
    },
    '90d': {
      enrollment: [45, 62, 78, 92, 110, 134],
      revenue: [22000, 29000, 36000, 41000, 49000, 58000],
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      dates: ['June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026']
    },
    '1y': {
      enrollment: [310, 420, 580, 790, 1020, 1284],
      revenue: [145000, 189000, 240000, 310000, 420000, 520000],
      labels: ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26'],
      dates: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026']
    }
  };

  const currentData = dataset[timeframe];
  const values = metric === 'enrollment' ? currentData.enrollment : currentData.revenue;
  const labels = currentData.labels;
  const dates = currentData.dates;

  const maxValue = Math.max(...values) * 1.15;
  const minValue = Math.min(...values) * 0.85;

  // Chart coordinate calculation for responsive SVG
  const width = 600;
  const height = 220;
  const paddingX = 35;
  const paddingY = 25;

  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (values.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minValue) / (maxValue - minValue || 1)) * (height - paddingY * 2);
    return { x, y, val, label: labels[idx], date: dates[idx] };
  });

  // Generate smooth SVG curve path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {metric === 'enrollment' ? 'Enrollment Momentum' : 'Tuition Revenue Trajectory'}
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} />
              +14.8%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time enrollment trends and Cambridge accreditation cohorts
          </p>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setMetric('enrollment')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                metric === 'enrollment'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users size={13} />
              <span>Students</span>
            </button>
            <button
              onClick={() => setMetric('revenue')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                metric === 'revenue'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign size={13} />
              <span>Revenue</span>
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            {['7d', '30d', '90d', '1y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-slate-100 dark:text-slate-800"
              />
            );
          })}

          {/* Filled Area with Entrance Animation */}
          <motion.path
            key={`area-${metric}-${timeframe}`}
            d={areaD}
            fill="url(#chartGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Smooth Line Curve */}
          <motion.path
            key={`line-${metric}-${timeframe}`}
            d={pathD}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible larger hover target */}
              <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />

              {/* Point circle */}
              <motion.circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 6 : 4}
                className={`transition-all duration-150 ${
                  hoveredIndex === idx
                    ? 'fill-white stroke-indigo-600 stroke-[3]'
                    : 'fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 stroke-2'
                }`}
              />

              {/* Hover guide line */}
              {hoveredIndex === idx && (
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2={height - paddingY}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* X Axis Labels */}
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-xl text-xs z-10 border border-slate-700"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 35}%`
            }}
          >
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>{metric === 'enrollment' ? 'Students:' : 'Revenue:'}</span>
              <span className="text-indigo-300 font-bold">
                {metric === 'enrollment'
                  ? points[hoveredIndex].val
                  : `$${points[hoveredIndex].val.toLocaleString()}`}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {points[hoveredIndex].date}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
