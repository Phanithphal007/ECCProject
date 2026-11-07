import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  Users,
  UserPlus,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { getOfficialStudentId } from '../../utils/studentId';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../../constants/avatars';
import { formatSchedule } from '../../utils/formatters';

export const ClassStudentRosterModal = ({
  isOpen,
  onClose,
  cls,
  allStudents = [],
  onEnrollStudents,
  onRemoveStudent,
  onViewStudentProfile
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedStudentIdsToEnroll, setSelectedStudentIdsToEnroll] = useState([]);
  const [studentToRemove, setStudentToRemove] = useState(null);

  // List of student objects enrolled in this class
  const enrolledStudents = useMemo(() => {
    if (!cls || !Array.isArray(cls.enrolledStudentIds)) return [];
    return allStudents.filter((stu) => cls.enrolledStudentIds.includes(stu.id));
  }, [cls, allStudents]);

  // Filtered enrolled students for search
  const filteredEnrolled = useMemo(() => {
    if (!searchQuery.trim()) return enrolledStudents;
    const q = searchQuery.toLowerCase();
    return enrolledStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.khmerName && s.khmerName.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q)
    );
  }, [enrolledStudents, searchQuery]);

  // Eligible students who are NOT already enrolled in this class (prevents duplicates)
  const availableStudentsToEnroll = useMemo(() => {
    if (!cls) return [];
    const enrolledSet = new Set(cls.enrolledStudentIds || []);
    return allStudents.filter((stu) => !enrolledSet.has(stu.id));
  }, [cls, allStudents]);

  // Filtered available students for the enrollment selector
  const filteredAvailable = useMemo(() => {
    if (!enrollSearch.trim()) return availableStudentsToEnroll;
    const q = enrollSearch.toLowerCase();
    return availableStudentsToEnroll.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.khmerName && s.khmerName.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q)
    );
  }, [availableStudentsToEnroll, enrollSearch]);

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIdsToEnroll((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredAvailable.map((s) => s.id);
    const areAllSelected = allFilteredIds.every((id) =>
      selectedStudentIdsToEnroll.includes(id)
    );
    if (areAllSelected) {
      setSelectedStudentIdsToEnroll((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      setSelectedStudentIdsToEnroll((prev) =>
        Array.from(new Set([...prev, ...allFilteredIds]))
      );
    }
  };

  const handleConfirmEnroll = () => {
    if (selectedStudentIdsToEnroll.length === 0 || !cls) return;
    onEnrollStudents(cls.id, selectedStudentIdsToEnroll);
    setSelectedStudentIdsToEnroll([]);
    setIsEnrollModalOpen(false);
  };

  const handleConfirmRemove = () => {
    if (!studentToRemove || !cls) return;
    onRemoveStudent(cls.id, studentToRemove.id);
    setStudentToRemove(null);
  };

  if (!cls) return null;

  const capacityPercent = Math.min(
    100,
    Math.round(((cls.enrolledStudentIds?.length || 0) / (cls.capacity || 25)) * 100)
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={cls.name}
        description={t('classes.roster_modal_desc', 'Official cohort roster, student attendance rates, and active enrollment.')}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Class Summary Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  {cls.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {cls.subjectName || cls.subjectId}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {cls.gradeLevel}
                </span>
                <StatusBadge status={cls.status} size="sm" />
              </div>

              {/* Enroll Student CTA */}
              <button
                onClick={() => {
                  setSelectedStudentIdsToEnroll([]);
                  setEnrollSearch('');
                  setIsEnrollModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus size={14} />
                <span>{t('classes.enroll_students_btn', 'Enroll Students')}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-indigo-600 shrink-0" />
                <span className="truncate">
                  {t('common.teacher')}: <strong className="text-slate-800">{cls.teacher}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-indigo-600 shrink-0" />
                <span className="truncate">{cls.studentLocation || cls.room}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-indigo-600 shrink-0" />
                <span className="truncate">{formatSchedule(cls)}</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">{t('classes.capacity', 'Capacity')}:</span>
                  <span className="font-bold text-slate-800">
                    {cls.enrolledStudentIds?.length || 0} / {cls.capacity || 25} ({capacityPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      capacityPercent >= 100
                        ? 'bg-rose-500'
                        : capacityPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Search & Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('classes.search_roster_placeholder', 'Search enrolled students by name, ID...')}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {t('classes.showing_students_count', 'Showing {{count}} student(s)', {
                count: filteredEnrolled.length
              })}
            </div>
          </div>

          {/* Enrolled Students Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">{t('common.student', 'Student')}</th>
                    <th className="py-2.5 px-3">{t('common.id', 'ID')}</th>
                    <th className="py-2.5 px-3">{t('common.gender', 'Gender')}</th>
                    <th className="py-2.5 px-3">{t('common.attendance', 'Attendance')}</th>
                    <th className="py-2.5 px-3">{t('classes.enroll_date', 'Join Date')}</th>
                    <th className="py-2.5 px-3">{t('common.status', 'Status')}</th>
                    <th className="py-2.5 px-4 text-right">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrolled.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Users size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-600">
                          {t('classes.no_students_enrolled', 'No students enrolled in this cohort yet.')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t('classes.enroll_students_hint', 'Click "Enroll Students" above to add learners.')}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEnrolled.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getStudentAvatarUrl(student.avatar)}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                              }}
                            />
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">
                                {student.name}
                              </div>
                              {student.khmerName && (
                                <div className="text-[11px] text-slate-500 font-khmer">
                                  {student.khmerName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                          {getOfficialStudentId(student)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {student.gender}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              student.attendanceRate >= 95
                                ? 'bg-emerald-50 text-emerald-700'
                                : student.attendanceRate >= 85
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {student.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{student.joinDate || '2026-01-10'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={student.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onViewStudentProfile && (
                              <button
                                onClick={() => onViewStudentProfile(student)}
                                title={t('students.view_details', 'View Profile')}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <ExternalLink size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setStudentToRemove(student)}
                              title={t('classes.remove_from_class', 'Remove from Class')}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Enroll Students Sub-Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={t('classes.enroll_students_title', 'Enroll Students into Cohort')}
        description={t('classes.enroll_students_desc', 'Select eligible students to add to this class. Students already enrolled are hidden.')}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                placeholder={t('classes.search_available_students', 'Search by name, ID, or grade...')}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            {filteredAvailable.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs whitespace-nowrap transition-colors"
              >
                {filteredAvailable.every((s) => selectedStudentIdsToEnroll.includes(s.id))
                  ? t('common.deselect_all', 'Deselect All')
                  : t('common.select_all', 'Select All')}
              </button>
            )}
          </div>

          {/* Student selection list */}
          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
            {filteredAvailable.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-slate-700 text-xs">
                  {availableStudentsToEnroll.length === 0
                    ? t('classes.all_students_enrolled', 'All registered students are already enrolled in this class!')
                    : t('common.no_match', 'No students match your search filter.')}
                </p>
              </div>
            ) : (
              filteredAvailable.map((student) => {
                const isSelected = selectedStudentIdsToEnroll.includes(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => handleToggleSelectStudent(student.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div click
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <img
                        src={getStudentAvatarUrl(student.avatar)}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                        }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 leading-tight">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {student.khmerName && <span className="font-khmer mr-1.5">{student.khmerName} •</span>}
                          <span className="font-mono">{getOfficialStudentId(student)}</span> • {student.grade}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {student.englishLevel || 'Grade Standard'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-semibold">
              {t('classes.selected_students', 'Selected: {{count}} student(s)', {
                count: selectedStudentIdsToEnroll.length
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={selectedStudentIdsToEnroll.length === 0}
                onClick={handleConfirmEnroll}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <UserPlus size={14} />
                <span>
                  {t('classes.confirm_enroll_btn', 'Enroll ({{count}})', {
                    count: selectedStudentIdsToEnroll.length
                  })}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Unenroll Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(studentToRemove)}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={t('classes.unenroll_title', 'Remove Student from Cohort?')}
        description={t(
          'classes.unenroll_confirm_desc',
          'Are you sure you want to remove {{name}} from this cohort? Their past attendance and scores will remain in the academic archives.',
          { name: studentToRemove?.name }
        )}
        confirmLabel={t('classes.remove_btn', 'Remove Student')}
        confirmVariant="danger"
      />
    </>
  );
};

