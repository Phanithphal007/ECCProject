import { ArrowUpRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../context/useApp';
import { getOfficialStudentId } from '../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';

export const RecentStudentsTable = () => {
  const { students, setSelectedStudent, setActiveTab } = useApp();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Recent Enrolled Students
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Latest student admissions and target band assignments
          </p>
        </div>
        <button
          onClick={() => setActiveTab('students')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          View All Roster
          <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3 font-medium">Student</th>
              <th className="pb-3 font-medium hidden sm:table-cell">Enrolled Course</th>
              <th className="pb-3 font-medium">Target</th>
              <th className="pb-3 font-medium hidden md:table-cell">Attendance</th>
              <th className="pb-3 font-medium">Tuition</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {students.slice(0, 5).map((student) => (
              <tr
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getStudentAvatarUrl(student.avatar)}
                      alt={student.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                      }}
                    />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {getOfficialStudentId(student)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3 hidden sm:table-cell">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {student.course}
                  </span>
                  <p className="text-[10px] text-slate-400">{student.level}</p>
                </td>

                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {student.targetBand}
                  </span>
                </td>

                <td className="py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {student.attendanceRate}%
                    </span>
                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          student.attendanceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${student.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      (student.tuitionStatus || student.paymentStatus) === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : ((student.tuitionStatus || student.paymentStatus) === 'Pending' || (student.tuitionStatus || student.paymentStatus) === 'Unpaid')
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {(student.tuitionStatus || student.paymentStatus) === 'Paid' && <CheckCircle2 size={10} />}
                    {((student.tuitionStatus || student.paymentStatus) === 'Pending' || (student.tuitionStatus || student.paymentStatus) === 'Unpaid') && <Clock size={10} />}
                    {(student.tuitionStatus || student.paymentStatus) === 'Overdue' && <AlertCircle size={10} />}
                    {student.paymentStatus || student.tuitionStatus || 'Unpaid'}
                  </span>
                </td>

                <td className="py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudent(student);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 group-hover:underline"
                  >
                    Details →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
