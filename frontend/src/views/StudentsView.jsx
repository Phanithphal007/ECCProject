import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  User, 
  GraduationCap, 
  Search, 
  Download, 
  Upload, 
  Printer, 
  Plus, 
  Edit2, 
  Archive, 
  Trash2, 
  Eye, 
  Award,
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  MinusSquare,
  AlertCircle,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import StudentAvatarPicker from '../components/StudentAvatarPicker';
import { getStudentAvatarUrl, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';
import { formatGrade, formatStudentName, formatAttendanceRate, toKhmerDigits } from '../utils/formatters';
import { getOfficialStudentId } from '../utils/studentId';

const ALL_GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

export const StudentsView = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { 
    students, 
    setStudents, 
    classes, 
    subjects,
    setSelectedStudent, 
    setIsAddStudentOpen, 
    updateStudent,
    archiveStudent,
    deleteStudent,
    bulkUpdateStudentStatus,
    bulkAssignStudentClass,
    bulkArchiveStudents,
    addToast 
  } = useApp();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [tuitionFilter, setTuitionFilter] = useState('All');
  const [evalFilter, setEvalFilter] = useState('All');

  // Sorting state
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isBulkArchiveConfirmOpen, setIsBulkArchiveConfirmOpen] = useState(false);
  const [targetClassId, setTargetClassId] = useState('');
  const [targetStatus, setTargetStatus] = useState('Active');

  // Single Item Modals
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [showCustomEditAvatar, setShowCustomEditAvatar] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDataText, setImportDataText] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const printRef = useRef(null);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'Active').length;
    const inactive = students.filter(s => s.status === 'Inactive' || s.status === 'Archived' || s.status === 'Withdrawn').length;
    const male = students.filter(s => s.gender === 'Male').length;
    const female = students.filter(s => s.gender === 'Female').length;
    const primary = students.filter(s => {
      const match = s.grade && s.grade.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return num >= 1 && num <= 6;
    }).length;
    const secondary = total - primary;
    return { total, active, inactive, male, female, primary, secondary };
  }, [students]);

  // Check if any filter is active
  const isFiltered = useMemo(() => {
    return (
      search.trim() !== '' ||
      classFilter !== 'All' ||
      subjectFilter !== 'All' ||
      genderFilter !== 'All' ||
      statusFilter !== 'All' ||
      attendanceFilter !== 'All' ||
      tuitionFilter !== 'All' ||
      evalFilter !== 'All'
    );
  }, [search, classFilter, subjectFilter, genderFilter, statusFilter, attendanceFilter, tuitionFilter, evalFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setClassFilter('All');
    setSubjectFilter('All');
    setGenderFilter('All');
    setStatusFilter('All');
    setAttendanceFilter('All');
    setTuitionFilter('All');
    setEvalFilter('All');
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const officialId = getOfficialStudentId(s);
        const matchName = s.name && s.name.toLowerCase().includes(q);
        const matchKhmer = s.khmerName && s.khmerName.includes(q);
        const matchId = (s.id && s.id.toLowerCase().includes(q)) || (s.studentId && s.studentId.includes(q)) || officialId.includes(q);
        const matchGuardian = s.guardianName && s.guardianName.toLowerCase().includes(q);
        const matchPhone = s.guardianPhone && s.guardianPhone.includes(q);
        if (!matchName && !matchKhmer && !matchId && !matchGuardian && !matchPhone) {
          return false;
        }
      }

      if (classFilter !== 'All' && s.className !== classFilter) return false;
      if (subjectFilter !== 'All') {
        const matchesSubj = (s.subject && s.subject === subjectFilter) || 
                            (s.className && s.className.toLowerCase().includes(subjectFilter.toLowerCase()));
        if (!matchesSubj) return false;
      }
      if (genderFilter !== 'All' && s.gender !== genderFilter) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      
      if (attendanceFilter !== 'All') {
        const rate = s.attendanceRate || 0;
        if (attendanceFilter === 'Present' && rate < 90) return false;
        if (attendanceFilter === 'Late' && (rate < 80 || rate >= 90)) return false;
        if (attendanceFilter === 'Absent' && rate >= 80) return false;
        if (attendanceFilter === 'Excused' && s.attendanceStatus !== 'Excused') return false;
      }

      const currentPayment = s.paymentStatus || s.tuitionStatus || 'Unpaid';
      if (tuitionFilter !== 'All' && currentPayment !== tuitionFilter) return false;
      if (evalFilter !== 'All' && s.evaluationStatus !== evalFilter) return false;

      return true;
    });
  }, [students, search, classFilter, subjectFilter, genderFilter, statusFilter, attendanceFilter, tuitionFilter, evalFilter]);

  // Sorting
  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'name') {
        valA = lang === 'km' ? (a.khmerName || a.name) : a.name;
        valB = lang === 'km' ? (b.khmerName || b.name) : b.name;
      } else if (sortField === 'grade') {
        const matchA = (a.grade || '').match(/\d+/);
        const matchB = (b.grade || '').match(/\d+/);
        valA = matchA ? parseInt(matchA[0], 10) : 0;
        valB = matchB ? parseInt(matchB[0], 10) : 0;
      } else if (sortField === 'attendanceRate') {
        valA = a.attendanceRate || 0;
        valB = b.attendanceRate || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredStudents, sortField, sortDirection, lang]);

  // Pagination
  const totalItems = sortedStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  // Sort toggle handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection handlers
  const handleToggleSelectAllOnPage = () => {
    if (isAllOnPageSelected) {
      const pageIds = new Set(paginatedStudents.map(s => s.id));
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const pageIds = paginatedStudents.map(s => s.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllOnPageSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedIds.includes(s.id));
  const isSomeOnPageSelected = paginatedStudents.some(s => selectedIds.includes(s.id)) && !isAllOnPageSelected;

  // CSV Export (UTF-8 with BOM for Khmer Excel compatibility)
  const exportStudentsToCSV = (studentsToExport, filename = 'ECC_Student_Roster.csv') => {
    const headers = [
      'Student ID',
      'English Name',
      'Khmer Name',
      'Gender',
      'Grade',
      'Class',
      'Teacher',
      'Parent/Guardian',
      'Guardian Phone',
      'Attendance Rate (%)',
      'Tuition Status',
      'Evaluation Status',
      'Status'
    ];

    const rows = studentsToExport.map(s => [
      `"${getOfficialStudentId(s)}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.khmerName || '').replace(/"/g, '""')}"`,
      `"${s.gender || ''}"`,
      `"${s.grade || ''}"`,
      `"${(s.className || '').replace(/"/g, '""')}"`,
      `"${(s.teacher || '').replace(/"/g, '""')}"`,
      `"${(s.guardianName || '').replace(/"/g, '""')}"`,
      `"${s.guardianPhone || ''}"`,
      `"${s.attendanceRate || 0}"`,
      `"${s.tuitionStatus || ''}"`,
      `"${s.evaluationStatus || ''}"`,
      `"${s.status || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: t('students.export_toast_title'),
      message: t('students.export_toast_msg')
    });
  };

  // Print Handlers
  const handlePrint = () => {
    window.print();
  };

  // Delete Confirm
  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;
    deleteStudent(studentToDelete.id);
    setSelectedIds(prev => prev.filter(id => id !== studentToDelete.id));
    setStudentToDelete(null);
  };

  // Archive Confirm
  const handleArchiveConfirm = () => {
    if (!studentToArchive) return;
    archiveStudent(studentToArchive.id);
    setSelectedIds(prev => prev.filter(id => id !== studentToArchive.id));
    setStudentToArchive(null);
  };

  // Bulk Archive Confirm
  const handleBulkArchiveConfirm = () => {
    bulkArchiveStudents(selectedIds);
    setSelectedIds([]);
    setIsBulkArchiveConfirmOpen(false);
  };

  // Bulk Assign Submit
  const handleBulkAssignSubmit = (e) => {
    e.preventDefault();
    const target = classes.find(c => c.id === targetClassId);
    if (!target) return;
    bulkAssignStudentClass(selectedIds, target);
    setIsBulkAssignOpen(false);
    setSelectedIds([]);
  };

  // Bulk Status Submit
  const handleBulkStatusSubmit = (e) => {
    e.preventDefault();
    bulkUpdateStudentStatus(selectedIds, targetStatus);
    setIsBulkStatusOpen(false);
    setSelectedIds([]);
  };

  // CSV/JSON Data Import Handler
  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importDataText.trim()) return;

    try {
      const lines = importDataText.trim().split('\n');
      const newLearners = [];

      lines.forEach((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const name = parts[0];
          const khmerName = parts[1] || '';
          const gender = parts[2] === 'Female' ? 'Female' : 'Male';
          const grade = parts[3] || 'Grade 4';
          const className = parts[4] || `${grade} Cohort`;
          const guardianName = parts[5] || 'Guardian';
          const guardianPhone = parts[6] || '+855 12 000 000';

          newLearners.push({
            id: `STU-IMP-${Date.now().toString().slice(-4)}${idx}`,
            name,
            khmerName,
            gender,
            grade,
            className,
            guardianName,
            guardianPhone,
            teacher: 'Teacher Sophea Heng',
            attendanceRate: 100,
            tuitionStatus: 'Paid',
            evaluationStatus: 'Needs Evaluation',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'
          });
        }
      });

      if (newLearners.length > 0) {
        setStudents(prev => [...newLearners, ...prev]);
        addToast({
          type: 'success',
          title: t('students.import_modal_title'),
          message: `Successfully imported ${newLearners.length} student(s).`
        });
        setIsImportModalOpen(false);
        setImportDataText('');
      } else {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: 'Please follow the format: Name, Khmer Name, Gender, Grade, Class, Guardian, Phone'
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Import Error',
        message: 'Could not parse the pasted student records.'
      });
    }
  };

  // Format numbers for display
  const numDisplay = (val) => (lang === 'km' ? toKhmerDigits(val) : val);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0">
      {/* Printable Document Header (visible only on @media print) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              English for Communication Centre (ECC)
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Official Student Enrollment & Performance Roster (Grade 1–12)
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>Total Records: {filteredStudents.length}</p>
          </div>
        </div>
      </div>

      {/* Screen Page Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('students.title')}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {t('students.grade_badge')}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {t('students.roster_badge')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
            {t('students.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportStudentsToCSV(filteredStudents, `ECC_Students_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('students.export_csv')}
          >
            <Download size={14} className="text-slate-500" />
            <span>{t('students.export_csv')}</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('students.import_students')}
          >
            <Upload size={14} className="text-slate-500" />
            <span>{t('students.import_students')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('students.print_roster')}
          >
            <Printer size={14} className="text-slate-500" />
            <span>{t('students.print_roster')}</span>
          </button>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('students.register_student')}</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard Cards (6 Top Cards) */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('students.stat_total')}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
              {numDisplay(stats.total)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">100%</span>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('students.stat_active')}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
              {numDisplay(stats.active)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {numDisplay(stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0)}%
            </span>
          </div>
        </div>

        {/* Inactive Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('students.stat_inactive')}
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <UserMinus size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
              {numDisplay(stats.inactive)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {numDisplay(stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0)}%
            </span>
          </div>
        </div>

        {/* Male Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('students.stat_male')}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <User size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
              {numDisplay(stats.male)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {numDisplay(stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0)}%
            </span>
          </div>
        </div>

        {/* Female Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('students.stat_female')}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-[#4338CA]">
              <User size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
              {numDisplay(stats.female)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {numDisplay(stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0)}%
            </span>
          </div>
        </div>

        {/* Students by Grade (Primary vs Secondary) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('students.stat_by_grade')}
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                {numDisplay(stats.primary)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                P: {numDisplay(stats.primary)} • S: {numDisplay(stats.secondary)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Controls */}
      <div className="print:hidden bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Top search & Reset button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('students.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 flex items-center gap-1.5 transition-colors self-start md:self-auto cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{t('students.reset_filters_btn')}</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid: 7 Focused Filters (Class, Subject, Gender, Status, Attendance, Tuition, Evaluation) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100">
          {/* 1. Class */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.filter_class')}
            </label>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_classes')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Subject */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.filter_subject')}
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_subjects')}</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 4. Gender */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.filter_gender')}
            </label>
            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_genders')}</option>
              <option value="Male">{t('common.male')}</option>
              <option value="Female">{t('common.female')}</option>
            </select>
          </div>

          {/* 5. Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.filter_status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_statuses')}</option>
              <option value="Active">{t('common.active')}</option>
              <option value="Inactive">{t('common.inactive')}</option>
              <option value="Archived">{t('common.archived')}</option>
              <option value="Probation">{t('common.probation')}</option>
              <option value="Graduated">{t('common.graduated')}</option>
              <option value="Withdrawn">{t('common.withdrawn')}</option>
            </select>
          </div>

          {/* 6. Attendance */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.filter_attendance')}
            </label>
            <select
              value={attendanceFilter}
              onChange={(e) => { setAttendanceFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_attendance')}</option>
              <option value="Present">{t('common.present')} (&ge;90%)</option>
              <option value="Late">{t('common.late')} (80-89%)</option>
              <option value="Absent">{t('common.absent')} (&lt;80%)</option>
              <option value="Excused">{t('common.excused')}</option>
            </select>
          </div>

          {/* 7. Tuition / Payment Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.payment_status', 'Payment Status')}
            </label>
            <select
              value={tuitionFilter}
              onChange={(e) => { setTuitionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_tuition', 'All Payments')}</option>
              <option value="Paid">{t('common.paid', 'Paid')}</option>
              <option value="Partial">{t('common.partial', 'Partial')}</option>
              <option value="Unpaid">{t('common.unpaid', 'Unpaid')}</option>
            </select>
          </div>

          {/* 8. Evaluation */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('students.filter_eval')}
            </label>
            <select
              value={evalFilter}
              onChange={(e) => { setEvalFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">{t('students.filter_all_eval')}</option>
              <option value="Evaluated">{t('common.evaluated')}</option>
              <option value="Needs Evaluation">{t('common.needs_evaluation')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating / Docked Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.15 }}
            className="print:hidden sticky top-4 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 flex-wrap border border-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-300">
                <CheckSquare size={16} />
              </span>
              <span className="text-xs font-semibold">
                {t('students.bulk_selected_count', { count: numDisplay(selectedIds.length) })}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => setIsBulkAssignOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers size={13} />
                <span>{t('students.bulk_assign_class')}</span>
              </button>

              <button
                onClick={() => setIsBulkStatusOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles size={13} />
                <span>{t('students.bulk_change_status')}</span>
              </button>

              <button
                onClick={() => {
                  const selectedStudents = students.filter(s => selectedIds.includes(s.id));
                  exportStudentsToCSV(selectedStudents, `ECC_Selected_Students_${selectedIds.length}.csv`);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>{t('students.bulk_export')}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>{t('students.bulk_print')}</span>
              </button>

              <button
                onClick={() => setIsBulkArchiveConfirmOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Archive size={13} />
                <span>{t('students.bulk_archive')}</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={t('common.deselect_all')}
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Student Table Container */}
      <div className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/80 dark:border-[#29364D] shadow-xs overflow-hidden" ref={printRef}>
        {/* Desktop & Tablet Table (Hidden on mobile phones) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {/* Select All Checkbox */}
                <th className="py-3.5 px-4 w-10 text-center print:hidden">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllOnPage}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                  >
                    {isAllOnPageSelected ? (
                      <CheckSquare size={17} className="text-indigo-600" />
                    ) : isSomeOnPageSelected ? (
                      <MinusSquare size={17} className="text-indigo-600" />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>

                {/* Student Info */}
                <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('students.col_student_info')}</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>

                {/* Grade & Class */}
                <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('grade')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('students.col_grade_class')}</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>

                {/* Teacher */}
                <th className="py-3.5 px-4">
                  {t('students.col_teacher')}
                </th>

                {/* Parent / Guardian */}
                <th className="py-3.5 px-4">
                  {t('students.col_parent_guardian')}
                </th>

                {/* Attendance */}
                <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('attendanceRate')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('students.col_attendance')}</span>
                    <ArrowUpDown size={12} className="opacity-60" />
                  </div>
                </th>

                {/* Payment Status */}
                <th className="py-3.5 px-4">
                  {t('students.payment_status', 'Payment Status')}
                </th>

                {/* Evaluation */}
                <th className="py-3.5 px-4">
                  {t('students.col_evaluation')}
                </th>

                {/* Actions */}
                <th className="py-3.5 px-4 text-right print:hidden">
                  {t('students.col_action')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {t('students.no_students_found')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t('students.adjust_search_hint')}
                      </p>
                      {isFiltered && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          {t('students.reset_filters_btn')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  const displayName = formatStudentName(student, lang);
                  const displayGrade = formatGrade(student.grade, lang);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleSelectRow(student.id)}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td 
                        className="py-3 px-4 text-center print:hidden"
                        onClick={(e) => { e.stopPropagation(); handleSelectRow(student.id); }}
                      >
                        <button type="button" className="text-slate-400 hover:text-indigo-600 p-0.5">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getStudentAvatarUrl(student.avatar)}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ID: {getOfficialStudentId(student)} • {student.gender === 'Male' ? t('common.male') : t('common.female')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Grade & Class */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {displayGrade}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {student.className}
                        </p>
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {student.teacher}
                      </td>

                      {/* Parent / Guardian */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{student.guardianName}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{student.guardianPhone}</p>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {formatAttendanceRate(student.attendanceRate, lang)}
                            </span>
                            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  student.attendanceRate >= 90
                                    ? 'bg-emerald-500'
                                    : student.attendanceRate >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${student.attendanceRate || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {student.attendanceRate >= 90 
                              ? t('common.present') 
                              : student.attendanceRate >= 80 
                              ? t('common.late') 
                              : t('common.absent')}
                          </span>
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={student.paymentStatus || student.tuitionStatus || 'Unpaid'} size="sm" />
                      </td>

                      {/* Evaluation */}
                      <td className="py-3 px-4">
                        <StatusBadge status={student.evaluationStatus} size="sm" />
                      </td>

                      {/* Actions */}
                      <td 
                        className="py-3 px-4 text-right print:hidden" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t('students.action_view_profile')}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => setStudentToEdit(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t('students.action_edit')}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => navigate(`/admin/students/${student.id}/scores`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Record Scores"
                          >
                            <Award size={15} />
                          </button>

                          <button
                            onClick={() => setStudentToArchive(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title={t('students.action_archive')}
                          >
                            <Archive size={15} />
                          </button>

                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={t('students.action_delete')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Dedicated Responsive Cards (<md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-3 space-y-3">
          {paginatedStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {t('students.no_students_found')}
            </div>
          ) : (
            paginatedStudents.map((student) => {
              const isSelected = selectedIds.includes(student.id);
              const displayName = formatStudentName(student, lang);
              const displayGrade = formatGrade(student.grade, lang);

              return (
                <div
                  key={`mobile-${student.id}`}
                  onClick={() => handleSelectRow(student.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                  }`}
                >
                  {/* Card Top: Checkbox, Avatar, Name & ID, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRow(student.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center -ml-2 text-slate-400 hover:text-indigo-600 shrink-0"
                        aria-label={`Select ${displayName}`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                      <img
                        src={getStudentAvatarUrl(student.avatar)}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {displayName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {getOfficialStudentId(student)} • {student.gender === 'Male' ? t('common.male') : t('common.female')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={student.tuitionStatus || student.paymentStatus || 'Unpaid'} size="sm" />
                      <StatusBadge status={student.status} size="sm" />
                    </div>
                  </div>

                  {/* Card Middle: Grade, Class, Teacher */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Grade & Class</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {displayGrade} — {student.className}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Teacher</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {student.teacher}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom: Parent Phone & Attendance Rate */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs gap-2 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Parent / Phone</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        {student.guardianName} •{' '}
                        <a
                          href={`tel:${student.guardianPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 dark:text-indigo-400 font-mono underline"
                        >
                          {student.guardianPhone}
                        </a>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Attendance</span>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatAttendanceRate(student.attendanceRate, lang)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                          {student.attendanceRate >= 90 ? 'Present' : 'Late'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Toolbar with min 44px tap targets */}
                  <div
                    className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="min-h-[44px] py-2 px-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye size={15} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setStudentToEdit(student)}
                      className="min-h-[44px] py-2 px-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Edit2 size={15} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => navigate(`/admin/students/${student.id}/scores`)}
                      className="min-h-[44px] py-2 px-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Award size={15} />
                      <span>Scores</span>
                    </button>
                    <button
                      onClick={() => setStudentToArchive(student)}
                      className="min-h-[44px] py-2 px-1 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Archive size={15} />
                      <span>Archive</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student)}
                      className="min-h-[44px] py-2 px-1 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1 transition-colors col-span-2 xs:col-span-1"
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>


        {/* Pagination & Rows-Per-Page Footer */}
        <div className="print:hidden p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          {/* Rows Per Page & Showing count */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">{t('students.rows_per_page')}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div>
              {t('students.showing_range', {
                start: numDisplay(totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1),
                end: numDisplay(Math.min(currentPage * pageSize, totalItems)),
                total: numDisplay(totalItems)
              })}
            </div>
          </div>

          {/* Page Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 transition-colors"
                aria-label={t('common.previous')}
                title={t('common.previous')}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Render condensed pagination if many pages
                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-semibold text-xs transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {numDisplay(pageNum)}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 transition-colors"
                aria-label={t('common.next')}
                title={t('common.next')}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {studentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToEdit(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 my-8"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {t('students.modal_edit_title')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t('students.modal_edit_sub')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStudentToEdit(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateStudent(studentToEdit.id, studentToEdit);
                  setStudentToEdit(null);
                }}
                className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.form_english_name')}
                    </label>
                    <input
                      type="text"
                      value={studentToEdit.name}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.form_khmer_name')}
                    </label>
                    <input
                      type="text"
                      value={studentToEdit.khmerName || ''}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, khmerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.form_gender')}
                    </label>
                    <select
                      value={studentToEdit.gender}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Male">{t('common.male')}</option>
                      <option value="Female">{t('common.female')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.form_grade_level')}
                    </label>
                    <select
                      value={studentToEdit.grade}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, grade: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {ALL_GRADES.map(g => (
                        <option key={g} value={g}>{formatGrade(g, lang)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.enrollment_status', 'Enrollment Status')}
                    </label>
                    <select
                      value={studentToEdit.status}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Active">{t('common.active')}</option>
                      <option value="Inactive">{t('common.inactive')}</option>
                      <option value="Archived">{t('common.archived')}</option>
                      <option value="Probation">{t('common.probation')}</option>
                      <option value="Graduated">{t('common.graduated')}</option>
                      <option value="Withdrawn">{t('common.withdrawn')}</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        {t('students.payment_status', 'Payment Status')}
                      </label>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                        (studentToEdit.tuitionStatus || studentToEdit.paymentStatus) === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : (studentToEdit.tuitionStatus || studentToEdit.paymentStatus) === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {(studentToEdit.tuitionStatus || studentToEdit.paymentStatus) || 'Unpaid'}
                      </span>
                    </div>
                    <select
                      value={studentToEdit.tuitionStatus || studentToEdit.paymentStatus || 'Unpaid'}
                      onChange={(e) => setStudentToEdit({ 
                        ...studentToEdit, 
                        tuitionStatus: e.target.value,
                        paymentStatus: e.target.value 
                      })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                        (studentToEdit.tuitionStatus || studentToEdit.paymentStatus) === 'Paid'
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800'
                          : (studentToEdit.tuitionStatus || studentToEdit.paymentStatus) === 'Partial'
                          ? 'border-amber-300 bg-amber-50/50 text-amber-800'
                          : 'border-rose-300 bg-rose-50/50 text-rose-800'
                      }`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>

                {/* Student Avatar Gallery in Edit Student Modal */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <StudentAvatarPicker
                    value={studentToEdit.avatar || ''}
                    onChange={(newAvatar) => setStudentToEdit({ ...studentToEdit, avatar: newAvatar })}
                    customAvatar={studentToEdit.avatar || ''}
                    onCustomAvatarChange={(newCustom) => setStudentToEdit({ ...studentToEdit, avatar: newCustom })}
                    showCustomInput={showCustomEditAvatar}
                    onToggleCustomInput={setShowCustomEditAvatar}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.col_grade_class')}
                    </label>
                    <input
                      type="text"
                      value={studentToEdit.className}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, className: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('students.col_teacher')}
                    </label>
                    <input
                      type="text"
                      value={studentToEdit.teacher}
                      onChange={(e) => setStudentToEdit({ ...studentToEdit, teacher: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                    {t('students.form_guardian_section')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">{t('students.form_guardian_name')}</label>
                      <input
                        type="text"
                        value={studentToEdit.guardianName}
                        onChange={(e) => setStudentToEdit({ ...studentToEdit, guardianName: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">{t('students.form_guardian_phone')}</label>
                      <input
                        type="text"
                        value={studentToEdit.guardianPhone}
                        onChange={(e) => setStudentToEdit({ ...studentToEdit, guardianPhone: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStudentToEdit(null)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Students Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 my-8"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {t('students.import_modal_title')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t('students.import_modal_sub')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      {t('students.import_paste_label')}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {t('students.import_help')}
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={importDataText}
                    onChange={(e) => setImportDataText(e.target.value)}
                    placeholder={t('students.import_paste_placeholder')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                  <p className="text-[11px] leading-relaxed">
                    Lines must be comma-separated: <strong>Name, Khmer Name, Gender, Grade, Class, Guardian Name, Phone</strong>.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    {t('students.import_btn')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Assign to Class Modal */}
      <AnimatePresence>
        {isBulkAssignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkAssignOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10 space-y-4"
            >
              <h3 className="font-bold text-base text-slate-900">
                {t('students.bulk_assign_title')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('students.bulk_assign_desc', { count: numDisplay(selectedIds.length) })}
              </p>

              <form onSubmit={handleBulkAssignSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('students.select_target_class')}
                  </label>
                  <select
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- {t('students.select_target_class')} --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatGrade(c.gradeLevel, lang)} - {c.teacher})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkAssignOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!targetClassId}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Change Status Modal */}
      <AnimatePresence>
        {isBulkStatusOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkStatusOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10 space-y-4"
            >
              <h3 className="font-bold text-base text-slate-900">
                {t('students.bulk_change_status_title')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('students.bulk_selected_count', { count: numDisplay(selectedIds.length) })}
              </p>

              <form onSubmit={handleBulkStatusSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('students.select_target_status')}
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Active">{t('common.active')}</option>
                    <option value="Inactive">{t('common.inactive')}</option>
                    <option value="Archived">{t('common.archived')}</option>
                    <option value="Probation">{t('common.probation')}</option>
                    <option value="Graduated">{t('common.graduated')}</option>
                    <option value="Withdrawn">{t('common.withdrawn')}</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkStatusOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!studentToArchive}
        onClose={() => setStudentToArchive(null)}
        onConfirm={handleArchiveConfirm}
        title={t('students.archive_confirm_title')}
        description={
          studentToArchive 
            ? t('students.archive_confirm_msg', { name: formatStudentName(studentToArchive, lang) })
            : ''
        }
        confirmLabel={t('students.archive_btn')}
        confirmVariant="primary"
      />

      {/* Bulk Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={isBulkArchiveConfirmOpen}
        onClose={() => setIsBulkArchiveConfirmOpen(false)}
        onConfirm={handleBulkArchiveConfirm}
        title={t('students.bulk_archive_confirm_title')}
        description={t('students.bulk_archive_confirm_msg', { count: numDisplay(selectedIds.length) })}
        confirmLabel={t('students.bulk_archive')}
        confirmVariant="primary"
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('students.delete_confirm_title')}
        description={
          studentToDelete 
            ? t('students.delete_confirm_msg', { 
                name: formatStudentName(studentToDelete, lang),
                id: studentToDelete.id 
              })
            : ''
        }
        confirmLabel={t('students.delete_btn')}
        confirmVariant="danger"
      />
    </div>
  );
};
