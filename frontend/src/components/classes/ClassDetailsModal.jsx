import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import {
  Clock,
  MapPin,
  Sparkles,
  FileText,
  UserPlus,
  ClipboardCheck,
  Award
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { scoreService } from '../../services/scoreService';
import { classroomActivities } from '../../data/mockData';
import { formatStudentName, formatAttendanceRate, formatSchedule, formatScheduleDays } from '../../utils/formatters';

export const ClassDetailsModal = ({
  isOpen,
  onClose,
  cls,
  subject,
  allStudents = [],
  onOpenRoster
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { navigateToClassAttendance, teachingPeriods = [] } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const linkedPeriod = useMemo(() => {
    if (!cls?.periodId) return null;
    return teachingPeriods.find((p) => p.id === cls.periodId) || null;
  }, [cls, teachingPeriods]);

  const enrolledStudents = useMemo(() => {
    if (!cls || !Array.isArray(cls.enrolledStudentIds)) return [];
    return allStudents.filter((stu) => cls.enrolledStudentIds.includes(stu.id));
  }, [cls, allStudents]);

  if (!cls) return null;

  const capacityPercent = Math.min(
    100,
    Math.round(((cls.enrolledStudentIds?.length || 0) / (cls.capacity || 25)) * 100)
  );

  const tabs = [
    { id: 'overview', label: t('classes.tab_overview', 'Overview') },
    { id: 'students', label: `${t('classes.tab_students', 'Students')} (${enrolledStudents.length})` },
    { id: 'schedule', label: t('classes.tab_schedule', 'Schedule') },
    { id: 'activities', label: t('classes.tab_activities', 'Activities') },
    { id: 'attendance', label: t('classes.tab_attendance', 'Attendance') },
    { id: 'assessments', label: t('classes.tab_assessments', 'Assessments') }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cls.name}
      description={`${cls.code} • ${cls.academicYear || '2026-2027'}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 font-semibold rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  {t('classes.subject', 'English Subject')}
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {cls.subjectName || subject?.name || 'English Subject'}
                </div>
                <div className="text-[11px] text-indigo-600 font-mono mt-0.5">
                  {subject?.code || cls.subjectId}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  {t('common.teacher')}
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {cls.teacher || <span className="text-amber-600 italic font-normal">{t('schedules.select_teacher_optional', 'Unassigned')}</span>}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin size={11} className="text-indigo-600" />
                  <span>{cls.studentLocation || cls.room}</span>
                </div>
                {linkedPeriod && (
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {linkedPeriod.name} ({linkedPeriod.startTime} – {linkedPeriod.endTime})
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  {t('classes.capacity_enrolled', 'Enrollment & Capacity')}
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {enrolledStudents.length} / {cls.capacity || 25}
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900">
                {t('classes.cohort_description', 'Cohort Overview & Learning Focus')}
              </h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                {cls.description || subject?.description || t('classes.default_cohort_desc', 'This class cohort focuses on mastering English competencies aligned with the curriculum standard.')}
              </p>
            </div>

            {subject && subject.skills && subject.skills.length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 mb-2">
                  {t('classes.targeted_skills', 'Targeted English Skills')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {subject.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Students */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">
                {t('classes.enrolled_count', '{{count}} student(s) currently registered', { count: enrolledStudents.length })}
              </span>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenRoster) onOpenRoster(cls);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus size={13} />
                <span>{t('classes.manage_roster_btn', 'Manage Roster & Enroll')}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">{t('common.student', 'Student')}</th>
                    <th className="py-2 px-3">{t('common.id', 'ID')}</th>
                    <th className="py-2 px-3">{t('common.gender', 'Gender')}</th>
                    <th className="py-2 px-3">{t('common.attendance', 'Attendance')}</th>
                    <th className="py-2 px-3">{t('classes.col_scores', 'Score / Grade')}</th>
                    <th className="py-2 px-3">{t('common.status', 'Status')}</th>
                    <th className="py-2 px-3 text-right">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        {t('classes.no_students_enrolled', 'No students enrolled.')}
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((s) => {
                      const summary = scoreService.getStudentScoresSummary(s.id, cls.id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 flex items-center gap-2">
                            <img
                              src={s.avatar}
                              alt={s.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <span className="font-semibold text-slate-800">{formatStudentName(s, lang)}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">{s.id}</td>
                          <td className="py-2 px-3 text-slate-600">{s.gender === 'Male' ? t('common.male') : t('common.female')}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-emerald-600">{formatAttendanceRate(s.attendanceRate, lang)}</span>
                          </td>
                          <td className="py-2 px-3">
                            {!summary.hasScore ? (
                              <span className="text-[10px] text-slate-400">Not Recorded</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-indigo-600">{summary.scoreText}</span>
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-white ${
                                  summary.grade === 'A' ? 'bg-emerald-500' :
                                  summary.grade === 'B' ? 'bg-blue-500' :
                                  summary.grade === 'C' ? 'bg-amber-500' : 'bg-rose-500'
                                }`}>
                                  {summary.grade}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <StatusBadge status={s.status} size="sm" />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                onClose();
                                navigate(`/admin/students/${s.id}/scores?classId=${cls.id}`);
                              }}
                              title="Record Scores"
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Award size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider mb-1">
                  {t('classes.meeting_times', 'Meeting Times')}
                </span>
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <Clock size={16} className="text-indigo-600" />
                  <span>{formatSchedule(cls)}</span>
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  {formatScheduleDays(cls.days) || 'Monday – Friday'}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider mb-1">
                  {t('classes.student_location')}
                </span>
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <MapPin size={16} className="text-indigo-600" />
                  <span>{cls.studentLocation || cls.room}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 className="font-bold text-slate-900 mb-1">
                {t('classes.attendance_policy', 'Attendance & Session Policy')}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Attendance is marked at the start of every session. Three consecutive unexcused absences trigger an automated guardian notification via SMS and Telegram.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Activities */}
        {activeTab === 'activities' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {classroomActivities.slice(0, 3).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {act.subject} • {act.teacher} • {act.date}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {act.completedRate}% done
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Attendance */}
        {activeTab === 'attendance' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-800">
                  {t('classes.avg_attendance', 'Average Attendance')}
                </span>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">97.4%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-[11px] font-semibold text-indigo-800">
                  {t('classes.present_today', 'Present Today')}
                </span>
                <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
                  {cls.presentToday || enrolledStudents.length} / {enrolledStudents.length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600">
                  {t('classes.sessions_held', 'Sessions Held')}
                </span>
                <div className="text-xl font-extrabold text-slate-800 mt-0.5">42</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigateToClassAttendance(cls.id);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ClipboardCheck size={14} />
                <span>{t('attendance.track_attendance')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Assessments */}
        {activeTab === 'assessments' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-indigo-600" />
                  <span className="font-bold text-slate-800">Mid-Term Oral & Written Exam</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Completed</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Class Average: <strong className="text-slate-800">88.5 / 100</strong></span>
                <span>Pass Rate: <strong className="text-emerald-600">96%</strong></span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
