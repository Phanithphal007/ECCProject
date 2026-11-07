import { useState, useEffect, useCallback } from 'react';
import { AppContext } from './context';
import { 
  initialStudents, 
  tuitionInvoices, 
  initialClasses, 
  initialSubjects, 
  teachersList, 
  initialAttendanceRecords,
  initialTeacherAvailability,
  initialTeacherSchedules,
  initialTeachingPeriods,
  initialPeriodTeachers
} from '../data/mockData';
import { AttendanceService, StudentService, EnrollmentService, ScheduleService, SubjectService, ClassService } from '../services/api';
import { generateSixDigitStudentId, getOfficialStudentId } from '../utils/studentId';
import { subjectService } from '../services/subjectService';
import { detectScheduleConflict } from '../utils/scheduleUtils';

let toastCounter = 1000;
let studentCounter = 9000;
let classCounter = 500;
let subjectCounter = 100;
let availabilityCounter = 200;
let scheduleCounter = 200;

const getInitialRouteState = () => {
  if (typeof window === 'undefined') return { tab: 'dashboard', classId: 'CLS-G1-ALP' };
  const path = window.location.pathname;
  const matchClassAttendance = path.match(/\/admin\/classes\/([^/]+)\/attendance/);
  if (matchClassAttendance) {
    return { tab: 'class-attendance', classId: matchClassAttendance[1] };
  }
  const matchClassStudents = path.match(/\/admin\/classes\/([^/]+)\/students/);
  if (matchClassStudents) {
    return { tab: 'class-students', classId: matchClassStudents[1] };
  }
  if (path.includes('/admin/subjects') || path.includes('/subjects')) {
    return { tab: 'subjects', classId: 'CLS-G1-ALP' };
  }
  if (path.includes('/admin/schedules') || path.includes('/teacher-schedules')) {
    return { tab: 'teacher-schedules', classId: 'CLS-G1-ALP' };
  }
  if (path.includes('/admin/classes') || path.includes('/classes')) {
    return { tab: 'classes', classId: 'CLS-G1-ALP' };
  }
  return { tab: 'dashboard', classId: 'CLS-G1-ALP' };
};

export const AppProvider = ({ children }) => {
  const initialRoute = getInitialRouteState();
  const [activeTab, setActiveTabState] = useState(initialRoute.tab);
  const [selectedClassId, setSelectedClassId] = useState(initialRoute.classId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data states
  const [students, setStudents] = useState(initialStudents);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [classes, setClasses] = useState(initialClasses);
  const [attendanceRecords, setAttendanceRecords] = useState(initialAttendanceRecords);
  const [teachers] = useState(teachersList);
  const [teacherAvailability, setTeacherAvailability] = useState(initialTeacherAvailability);
  const [teacherSchedules, setTeacherSchedules] = useState(initialTeacherSchedules);
  const [teachingPeriods, setTeachingPeriods] = useState(initialTeachingPeriods);
  const [periodTeachers, setPeriodTeachers] = useState(initialPeriodTeachers);
  const [scheduleFilterTeacherId, setScheduleFilterTeacherId] = useState('ALL');
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Attendance Warning",
      desc: "Vicheka Meas (Grade 8) marked Absent 2 days this week. SMS alert sent to guardian.",
      time: "25m ago",
      type: "warning",
      unread: true
    },
    {
      id: "notif-2",
      title: "New Student Enrolled",
      desc: "Dara Sok successfully registered to Grade 1 Phonics Starters.",
      time: "1h ago",
      type: "success",
      unread: true
    },
    {
      id: "notif-3",
      title: "Assessment Completed",
      desc: "Teacher Sophea recorded Grade 4 Mid-Term Reading scores.",
      time: "3h ago",
      type: "info",
      unread: false
    }
  ]);
  const [invoices] = useState(tuitionInvoices);
  
  // Interactive modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Toasts
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    toastCounter += 1;
    const id = `toast-${toastCounter}`;
    const newToast = { id, type: 'info', duration: 4000, ...toast };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, newToast.duration || 4000);
  }, [removeToast]);

  // Role-based portal states (admin | parent | student)
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('edumanage-role') || 'admin';
    }
    return 'admin';
  });

  const [parentSelectedChildId, setParentSelectedChildId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('edumanage-parent-child') || 'STU-1020';
    }
    return 'STU-1020';
  });

  const portalUsers = {
    admin: {
      id: 'USR-ADMIN-01',
      name: 'Sophea Heng',
      khmerName: 'ហេង សុភា',
      email: 'sophea.heng@edumanage.kh',
      role: 'admin',
      title: 'Academic Director / Administrator',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    parent: {
      id: 'USR-PARENT-01',
      name: 'Kalyan Meas',
      khmerName: 'ម៉ាស កល្យាណ',
      email: 'kalyan.meas@gmail.com',
      phone: '+855 17 889 001',
      role: 'parent',
      title: 'Parent / Guardian',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      linkedChildrenIds: ['STU-1020', 'STU-1021']
    },
    student: {
      id: 'STU-1020',
      studentId: '201020',
      studentCode: '201020',
      name: 'Dara Sok',
      khmerName: 'សុខ ដារ៉ា',
      email: 'dara.sok@student.ecc.edu.kh',
      role: 'student',
      title: 'Grade 5 Primary Student',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
    }
  };

  const [announcements] = useState([
    {
      id: 'ANN-001',
      title: 'ECC Term 4 Mid-Term Examination Schedule',
      titleKh: 'កាលវិភាគប្រឡងឆមាសទី៤ នៃមជ្ឈមណ្ឌល ECC',
      content: 'The Term 4 Mid-Term English evaluations will be held starting November 10, 2026. Please check your child\'s timetable and revision guide.',
      contentKh: 'ការប្រឡងពាក់កណ្ដាលវគ្គទី៤ នឹងប្រព្រឹត្តទៅចាប់ពីថ្ងៃទី ១០ ខែវិច្ឆិកា ឆ្នាំ ២០២៦។ សូមពិនិត្យកាលវិភាគ និងមេរៀនរំលឹករបស់បុត្រធីតា។',
      category: 'Exam',
      audience: 'All',
      date: '2026-11-04',
      author: 'Academic Office',
      unread: true
    },
    {
      id: 'ANN-002',
      title: 'Water Festival Holiday Notice (Nov 15 - Nov 17)',
      titleKh: 'សេចក្តីជូនដំណឹងអំពីការឈប់សម្រាកបុណ្យអុំទូក (១៥-១៧ វិច្ឆិកា)',
      content: 'The English Center will be closed for the National Water Festival from Nov 15 through Nov 17. Regular classes resume Monday, Nov 18.',
      contentKh: 'មជ្ឈមណ្ឌលនឹងឈប់សម្រាកក្នុងឱកាសព្រះរាជពិធីបុណ្យអុំទូក ចាប់ពីថ្ងៃទី ១៥ ដល់ ១៧ ខែវិច្ឆិកា។ ថ្នាក់រៀននឹងបើកដំណើរការឡើងវិញនៅថ្ងៃចន្ទ ទី ១៨។',
      category: 'Holiday',
      audience: 'All',
      date: '2026-11-02',
      author: 'Administration',
      unread: false
    },
    {
      id: 'ANN-003',
      title: 'Term 1 2027 Early Registration & Tuition Discount',
      titleKh: 'ការចុះឈ្មោះចូលរៀនវគ្គថ្មី ឆ្នាំ ២០២៧ និងការបញ្ចុះតម្លៃសិក្សា',
      content: 'Early enrollment for Term 1 2027 is now open for parents. Receive a 10% fee waiver when completing registration before November 30.',
      contentKh: 'ការចុះឈ្មោះចូលរៀនមុនសម្រាប់វគ្គទី១ ឆ្នាំ២០២៧ បានចាប់ផ្ដើមហើយ។ ទទួលបានការបញ្ចុះតម្លៃ ១០% សម្រាប់ការបង់ថ្លៃសិក្សាមុនថ្ងៃទី៣០ វិច្ឆិកា។',
      category: 'Payment',
      audience: 'Parents',
      date: '2026-10-28',
      author: 'Finance Department',
      unread: false
    },
    {
      id: 'ANN-004',
      title: 'Annual English Spelling Bee & Speech Competition',
      titleKh: 'ការប្រកួតប្រជែងនិយាយភាសាអង់គ្លេស និងអក្ខរាវិរុទ្ធប្រចាំឆ្នាំ',
      content: 'All Grade 1 to 12 students are invited to register for the annual Spelling Bee. Certificates and prizes awarded to top 3 winners per tier!',
      contentKh: 'សិស្សានុសិស្សទាំងអស់ត្រូវបានលើកទឹកចិត្តឱ្យចូលរួមការប្រកួតប្រជែង។ រង្វាន់ និងវិញ្ញាបនបត្រនឹងត្រូវផ្ដល់ជូនជ័យលាភីលេខ១ ដល់លេខ៣!',
      category: 'Academic',
      audience: 'Students',
      date: '2026-10-25',
      author: 'English Faculty',
      unread: false
    }
  ]);

  const [portalHomework, setPortalHomework] = useState([
    {
      id: 'HW-101',
      studentId: 'STU-1020',
      title: 'Unit 4: Past Simple Irregular Verbs Worksheet',
      subject: 'Grammar & Vocabulary',
      classCode: 'ENG-G5-A',
      assignedDate: '2026-11-03',
      dueDate: '2026-11-08',
      status: 'Pending',
      maxScore: 20,
      score: null,
      teacher: 'Teacher Sophea Heng',
      instructions: 'Complete exercises 1 to 5 on irregular verb forms. Upload your handwritten sheet or type answers.'
    },
    {
      id: 'HW-102',
      studentId: 'STU-1020',
      title: 'Reading Log: "The Secret Garden" Chapter 3',
      subject: 'Reading & Comprehension',
      classCode: 'ENG-G1-PHO',
      assignedDate: '2026-11-01',
      dueDate: '2026-11-06',
      status: 'Submitted',
      maxScore: 25,
      score: 24,
      teacher: 'Teacher Sovannary Long',
      instructions: 'Write a 4-sentence summary describing the character Mary Lennox.'
    },
    {
      id: 'HW-103',
      studentId: 'STU-1020',
      title: 'Speaking Voice Recording: My Daily Routine',
      subject: 'Speaking & Pronunciation',
      classCode: 'ENG-G5-A',
      assignedDate: '2026-10-27',
      dueDate: '2026-11-02',
      status: 'Graded',
      maxScore: 20,
      score: 19,
      teacher: 'Teacher Michael Davies',
      instructions: 'Record 1 minute describing what you do from 7:00 AM to 5:00 PM.'
    },
    {
      id: 'HW-104',
      studentId: 'STU-1021',
      title: 'Grade 4 Phonics & Short Vowel Sounds',
      subject: 'Phonics & Reading',
      classCode: 'ENG-G4-A',
      assignedDate: '2026-11-02',
      dueDate: '2026-11-07',
      status: 'Pending',
      maxScore: 20,
      score: null,
      teacher: 'Teacher Sophea Heng',
      instructions: 'Identify words containing short vowels /a/ and /e/ from page 28.'
    },
    {
      id: 'HW-105',
      studentId: 'STU-1021',
      title: 'Family Members Vocabulary Writing',
      subject: 'Writing',
      classCode: 'ENG-G4-A',
      assignedDate: '2026-10-29',
      dueDate: '2026-11-03',
      status: 'Graded',
      maxScore: 20,
      score: 20,
      teacher: 'Teacher Sophea Heng',
      instructions: 'Write sentences using: grandmother, cousin, nephew, uncle.'
    }
  ]);

  const switchRole = useCallback((newRole) => {
    setUserRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edumanage-role', newRole);
    }
    if (newRole === 'admin') {
      setActiveTabState('dashboard');
    } else if (newRole === 'parent') {
      setActiveTabState('parent-overview');
    } else if (newRole === 'student') {
      setActiveTabState('student-overview');
    }
  }, []);

  const setParentChild = useCallback((childId) => {
    setParentSelectedChildId(childId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edumanage-parent-child', childId);
    }
  }, []);

  const submitStudentHomework = useCallback((homeworkId, submissionData) => {
    setPortalHomework((prev) =>
      prev.map((hw) => {
        if (hw.id === homeworkId) {
          return {
            ...hw,
            status: 'Submitted',
            submittedAt: new Date().toISOString(),
            submissionText: submissionData?.text || 'Submitted online',
            submissionFileName: submissionData?.fileName || 'assignment_submission.pdf'
          };
        }
        return hw;
      })
    );
    addToast({
      type: 'success',
      title: 'Assignment Submitted',
      message: 'Your work has been submitted to your teacher for review.'
    });
  }, [addToast]);


  // Global keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    addToast({
      type: 'success',
      title: 'Notifications Cleared',
      message: 'All notifications marked as read'
    });
  };

  const addStudent = (studentData) => {
    studentCounter += 1;
    const newId = `STU-${studentCounter}`;
    const numericCode = studentData.studentId || generateSixDigitStudentId(students);
    const student = {
      id: newId,
      studentId: numericCode,
      studentCode: numericCode,
      student_code: numericCode,
      status: 'Active',
      joinDate: '2026-11-03',
      attendanceRate: 100,
      tuitionStatus: 'Paid',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      ...studentData
    };
    setStudents((prev) => [student, ...prev]);
    setIsAddStudentOpen(false);
    addToast({
      type: 'success',
      title: 'Student Registered',
      message: `${student.name} enrolled into ${student.grade}.`
    });
  };

  const updateStudentStatus = (id, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    addToast({
      type: 'info',
      title: 'Status Updated',
      message: `Student status changed to ${newStatus}`
    });
  };

  const updateStudent = (id, studentData) => {
    const paymentStatus = studentData.paymentStatus || studentData.tuitionStatus;
    const normalizedData = {
      ...studentData,
      ...(paymentStatus ? { tuitionStatus: paymentStatus, paymentStatus } : {})
    };
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...normalizedData } : s))
    );
    try {
      StudentService.update(id, normalizedData).catch(() => {});
    } catch {
      // offline fallback
    }
    addToast({
      type: 'success',
      title: 'Student Updated',
      message: 'Student details have been saved.'
    });
  };

  const registerAndEnrollStudent = (studentData, classId) => {
    studentCounter += 1;
    const newId = studentData.id || `STU-${studentCounter}`;
    const numericCode = studentData.studentId || studentData.studentCode || generateSixDigitStudentId(students);
    const resolvedPayment = studentData.paymentStatus || studentData.tuitionStatus || 'Unpaid';
    const student = {
      id: newId,
      studentId: numericCode,
      studentCode: numericCode,
      student_code: numericCode,
      status: studentData.status || 'Active',
      joinDate: studentData.joinDate || new Date().toISOString().slice(0, 10),
      attendanceRate: 100,
      tuitionStatus: resolvedPayment,
      paymentStatus: resolvedPayment,
      avatar: studentData.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      ...studentData
    };

    setStudents((prev) => [student, ...prev]);

    if (classId) {
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== classId) return c;
          const currentList = Array.isArray(c.enrolledStudentIds) ? c.enrolledStudentIds : [];
          if (currentList.includes(newId)) return c;
          const combined = [...currentList, newId];
          return {
            ...c,
            enrolledStudentIds: combined,
            enrolled: combined.length
          };
        })
      );
    }

    try {
      StudentService.create({ ...student, classId, tuitionStatus: resolvedPayment, paymentStatus: resolvedPayment }).catch(() => {});
    } catch {
      // offline fallback
    }

    addToast({
      type: 'success',
      title: 'Student Registered',
      message: `${student.name} registered and enrolled successfully.`
    });

    return student;
  };

  const archiveStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Archived' } : s))
    );
    addToast({
      type: 'info',
      title: 'Student Archived',
      message: 'Student has been safely archived. Historical records are preserved.'
    });
  };

  const deleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    // Also remove from any class enrollments
    setClasses((prev) =>
      prev.map((c) => ({
        ...c,
        enrolledStudentIds: Array.isArray(c.enrolledStudentIds)
          ? c.enrolledStudentIds.filter((sid) => sid !== id)
          : []
      }))
    );
    addToast({
      type: 'warning',
      title: 'Student Deleted',
      message: 'Student record has been permanently removed.'
    });
  };

  // Bulk Operations
  const bulkUpdateStudentStatus = (studentIds, newStatus) => {
    if (!studentIds || studentIds.length === 0) return;
    setStudents((prev) =>
      prev.map((s) => (studentIds.includes(s.id) ? { ...s, status: newStatus } : s))
    );
    addToast({
      type: 'success',
      title: 'Bulk Status Updated',
      message: `Updated status for ${studentIds.length} student(s) to ${newStatus}.`
    });
  };

  const bulkAssignStudentClass = (studentIds, targetClass) => {
    if (!studentIds || studentIds.length === 0 || !targetClass) return;
    // Update student's className & teacher
    setStudents((prev) =>
      prev.map((s) =>
        studentIds.includes(s.id)
          ? {
              ...s,
              className: targetClass.name,
              teacher: targetClass.teacher,
              grade: targetClass.gradeLevel || s.grade
            }
          : s
      )
    );
    // Update target class enrollments
    enrollStudentsInClass(targetClass.id, studentIds);
  };

  const bulkArchiveStudents = (studentIds) => {
    if (!studentIds || studentIds.length === 0) return;
    setStudents((prev) =>
      prev.map((s) => (studentIds.includes(s.id) ? { ...s, status: 'Archived' } : s))
    );
    addToast({
      type: 'info',
      title: 'Bulk Students Archived',
      message: `Archived ${studentIds.length} student(s). Historical records are preserved.`
    });
  };

  const bulkDeleteStudents = (studentIds) => {
    if (!studentIds || studentIds.length === 0) return;
    setStudents((prev) => prev.filter((s) => !studentIds.includes(s.id)));
    setClasses((prev) =>
      prev.map((c) => ({
        ...c,
        enrolledStudentIds: Array.isArray(c.enrolledStudentIds)
          ? c.enrolledStudentIds.filter((sid) => !studentIds.includes(sid))
          : []
      }))
    );
    addToast({
      type: 'warning',
      title: 'Bulk Students Deleted',
      message: `Permanently removed ${studentIds.length} student record(s).`
    });
  };

  // Subject Management
  const addSubject = async (subjectData) => {
    let createdSubject = null;
    try {
      const res = await SubjectService.create(subjectData);
      if (res && res.data) {
        createdSubject = res.data;
      }
    } catch (err) {
      console.warn('Backend subject creation failed or offline, falling back:', err?.message);
    }

    if (!createdSubject) {
      subjectCounter += 1;
      createdSubject = {
        id: `SUB-${Date.now().toString().slice(-4)}`,
        code: subjectData.code || `ENG-${String(subjectCounter).padStart(3, '0')}`,
        status: subjectData.status || 'Active',
        skills: Array.isArray(subjectData.skills) ? subjectData.skills : [],
        grades: subjectData.grades || 'Grade 1 - 12',
        ...subjectData
      };
    }

    setSubjects((prev) => [createdSubject, ...prev.filter((s) => s.id !== createdSubject.id)]);

    addToast({
      type: 'success',
      title: 'Subject Created',
      message: `${createdSubject.name} (${createdSubject.code}) has been added successfully.`
    });
    return createdSubject;
  };

  const updateSubject = async (id, updatedData) => {
    // Preserve existing subject code strictly
    const { code: _ignoredCode, ...safeUpdateData } = updatedData;

    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...safeUpdateData } : s))
    );

    try {
      await SubjectService.update(id, safeUpdateData);
    } catch {
      // Local state already updated
    }

    addToast({
      type: 'info',
      title: 'Subject Updated',
      message: 'Subject details have been saved.'
    });
    return true;
  };

  // Navigation & URL Routing sync
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (tab === 'dashboard') {
      window.history.pushState(null, '', '/');
    } else if (tab === 'subjects') {
      window.history.pushState(null, '', '/admin/subjects');
    } else if (tab === 'classes') {
      window.history.pushState(null, '', '/admin/classes');
    } else if (tab !== 'class-students' && tab !== 'class-attendance') {
      window.history.pushState(null, '', `/admin/${tab}`);
    }
  };

  const navigateToClassStudents = (classId) => {
    setSelectedClassId(classId);
    setActiveTabState('class-students');
    window.history.pushState(null, '', `/admin/classes/${classId}/students`);
  };

  const navigateToClassAttendance = (classId) => {
    setSelectedClassId(classId);
    setActiveTabState('class-attendance');
    window.history.pushState(null, '', `/admin/classes/${classId}/attendance`);
  };

  const navigateToSubjects = () => {
    setActiveTabState('subjects');
    window.history.pushState(null, '', '/admin/subjects');
  };

  const navigateToClasses = () => {
    setActiveTabState('classes');
    window.history.pushState(null, '', '/admin/classes');
  };

  const saveClassAttendance = useCallback(async (classId, date, records, recordedBy = 'Teacher Sophea') => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sessionId = `SESS-${classId}-${date}`;
    const attendanceKey = `${classId}_${date}`;
    
    // Strict duplicate prevention for (classId, studentId, date)
    setAttendanceRecords((prev) => {
      const updated = [...prev];
      records.forEach((rec) => {
        const studentId = rec.studentId || rec.id;
        const status = rec.status || rec.attendanceStatus || 'Present';
        const remarks = rec.remarks || '';
        
        const existingIdx = updated.findIndex(
          (a) => a.classId === classId && a.studentId === studentId && a.date === date
        );
        
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            sessionId,
            attendanceKey,
            status,
            remarks,
            recordedBy,
            updatedAt: now,
          };
        } else {
          updated.push({
            id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sessionId,
            attendanceKey,
            classId,
            studentId,
            date,
            status,
            remarks,
            recordedBy,
            recordedAt: now,
            updatedAt: now,
          });
        }
      });
      return updated;
    });

    // Also call backend API to sync with MySQL
    try {
      await AttendanceService.saveBatch({
        class_id: classId,
        attendance_date: date,
        records: records.map(r => ({
          student_id: r.studentId || r.id,
          status: r.status,
          remarks: r.remarks || ''
        })),
        recorded_by: recordedBy
      });
    } catch {
      // Local state fallback already updated
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRouteState();
      setActiveTabState(route.tab);
      if (route.classId) setSelectedClassId(route.classId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const deleteSubject = (id) => {
    // Check if any classes reference this subject
    const associatedClasses = classes.filter((c) => c.subjectId === id);
    if (associatedClasses.length > 0) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Subject',
        message: `Subject is currently associated with ${associatedClasses.length} class(es). Please reassign or remove affected classes first.`
      });
      return false;
    }

    setSubjects((prev) => prev.filter((s) => s.id !== id));
    try {
      SubjectService.delete(id).catch(() => {});
      subjectService.deleteSubject(id);
    } catch {
      // Local state already updated
    }

    addToast({
      type: 'warning',
      title: 'Subject Deleted',
      message: 'Subject has been safely removed.'
    });
    return true;
  };

  // Class Management
  const addClass = async (classData) => {
    let createdFromApi = null;
    try {
      const res = await ClassService.create(classData);
      if (res && res.data) {
        createdFromApi = res.data;
      }
    } catch (e) {
      console.warn('Backend class creation API fallback:', e);
    }

    classCounter += 1;
    const finalCode = createdFromApi?.code || classData.code || `CLS-${String(classCounter).padStart(3, '0')}`;
    const finalId = createdFromApi?.id || classData.id || `CLS-${Date.now().toString().slice(-4)}`;

    const newClass = {
      id: finalId,
      code: finalCode,
      enrolledStudentIds: [],
      enrolled: 0,
      presentToday: 0,
      capacity: 25,
      status: 'Active',
      academicYear: '2026-2027',
      ...classData,
      ...(createdFromApi || {}),
      code: finalCode,
      id: finalId
    };

    setClasses((prev) => [newClass, ...prev]);

    // If a valid teacher assignment is provided, automatically record the teaching schedule
    const tId = (newClass.teacherId || '').trim();
    if (tId && tId !== 'TCH-NONE') {
      const newSch = {
        id: `SCH-${newClass.id}`,
        classId: newClass.id,
        className: newClass.name,
        teacherId: tId,
        teacherName: newClass.teacher,
        periodId: newClass.periodId || '',
        days: newClass.days,
        startTime: newClass.startTime,
        endTime: newClass.endTime,
        effectiveStartDate: '2026-09-01',
        effectiveEndDate: '2027-06-30',
        academicYear: newClass.academicYear || '2026-2027',
        location: newClass.studentLocation,
        status: 'Scheduled'
      };
      setTeacherSchedules((prev) => [newSch, ...prev]);
    }

    addToast({
      type: 'success',
      title: 'Class Created',
      message: `${newClass.name} has been created successfully with code ${newClass.code}.`
    });
    return newClass;
  };

  const updateClass = (id, updatedData) => {
    // Preserve original class code permanently
    const existingClass = classes.find((c) => c.id === id);
    const safeData = {
      ...updatedData,
      code: existingClass?.code || updatedData.code
    };

    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...safeData } : c))
    );

    try {
      ClassService.update(id, safeData).catch(() => {});
    } catch {
      // Local state already updated
    }

    // Keep teacher schedule synchronized with class changes
    setTeacherSchedules((prev) => {
      const exists = prev.some((s) => s.classId === id);
      const tId = (updatedData.teacherId || '').trim();

      if (exists) {
        return prev.map((sch) => {
          if (sch.classId === id) {
            return {
              ...sch,
              teacherId: updatedData.teacherId !== undefined ? tId : sch.teacherId,
              teacherName: updatedData.teacher !== undefined ? updatedData.teacher : sch.teacherName,
              periodId: updatedData.periodId !== undefined ? updatedData.periodId : sch.periodId,
              days: updatedData.days !== undefined ? updatedData.days : sch.days,
              startTime: updatedData.startTime !== undefined ? updatedData.startTime : sch.startTime,
              endTime: updatedData.endTime !== undefined ? updatedData.endTime : sch.endTime,
              location: updatedData.studentLocation !== undefined ? updatedData.studentLocation : sch.location,
              status: updatedData.status === 'Archived' ? 'Cancelled' : sch.status
            };
          }
          return sch;
        });
      } else if (tId && tId !== 'TCH-NONE') {
        // Create new schedule entry if not previously present
        const clsObj = classes.find((c) => c.id === id);
        const newSch = {
          id: `SCH-${id}`,
          classId: id,
          className: updatedData.name || clsObj?.name || 'Class',
          teacherId: tId,
          teacherName: updatedData.teacher || '',
          periodId: updatedData.periodId || clsObj?.periodId || '',
          days: updatedData.days || clsObj?.days || 'Monday – Friday',
          startTime: updatedData.startTime || clsObj?.startTime || '08:00 AM',
          endTime: updatedData.endTime || clsObj?.endTime || '09:30 AM',
          effectiveStartDate: '2026-09-01',
          effectiveEndDate: '2027-06-30',
          academicYear: updatedData.academicYear || clsObj?.academicYear || '2026-2027',
          location: updatedData.studentLocation || clsObj?.studentLocation || "Student's Home",
          status: 'Scheduled'
        };
        return [newSch, ...prev];
      }
      return prev;
    });

    addToast({
      type: 'info',
      title: 'Class Updated',
      message: 'Class details have been saved.'
    });
  };

  const deleteClass = (id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    try {
      ClassService.delete(id).catch(() => {});
    } catch {
      // Local state already updated
    }
    addToast({
      type: 'warning',
      title: 'Class Deleted',
      message: 'Class cohort has been removed.'
    });
  };

  const archiveClass = (id) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Archived' } : c))
    );
    try {
      ClassService.update(id, { status: 'Archived' }).catch(() => {});
    } catch {
      // Local state already updated
    }
    addToast({
      type: 'info',
      title: 'Class Archived',
      message: 'Class cohort has been safely moved to archives. Student records and grades are preserved.'
    });
  };

  const archiveSubject = (id) => {
    let nextStatus = 'Archived';
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          nextStatus = s.status === 'Archived' ? 'Active' : 'Archived';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );

    try {
      subjectService.archiveSubject(id);
    } catch {
      // Local state already updated
    }

    addToast({
      type: nextStatus === 'Archived' ? 'info' : 'success',
      title: nextStatus === 'Archived' ? 'Subject Archived' : 'Subject Restored',
      message: nextStatus === 'Archived' 
        ? 'Subject has been safely moved to archives.' 
        : 'Subject status has been restored to Active.'
    });
  };

  // Enrollment Management (with duplicate prevention)
  const enrollStudentsInClass = (classId, studentIdsToEnroll) => {
    if (!classId || !studentIdsToEnroll || studentIdsToEnroll.length === 0) return;
    
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const currentList = Array.isArray(c.enrolledStudentIds) ? c.enrolledStudentIds : [];
        // Deduplicate using Set
        const combined = Array.from(new Set([...currentList, ...studentIdsToEnroll]));
        return {
          ...c,
          enrolledStudentIds: combined,
          enrolled: combined.length
        };
      })
    );

    addToast({
      type: 'success',
      title: 'Enrollment Updated',
      message: `Enrolled ${studentIdsToEnroll.length} student(s) successfully.`
    });
  };

  const removeStudentFromClass = (classId, studentIdToRemove) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const currentList = Array.isArray(c.enrolledStudentIds) ? c.enrolledStudentIds : [];
        const filtered = currentList.filter((id) => id !== studentIdToRemove);
        return {
          ...c,
          enrolledStudentIds: filtered,
          enrolled: filtered.length
        };
      })
    );

    try {
      EnrollmentService.removeStudent(classId, studentIdToRemove).catch(() => {});
    } catch {
      // offline fallback
    }

    addToast({
      type: 'info',
      title: 'Student Unenrolled',
      message: 'Student has been removed from this class cohort.'
    });
  };

  // Initial fetch for teacher availability & schedules
  useEffect(() => {
    ScheduleService.getAvailability()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setTeacherAvailability(res.data);
        }
      })
      .catch(() => {});

    ScheduleService.getTeachingSchedules()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setTeacherSchedules(res.data);
        }
      })
      .catch(() => {});

    SubjectService.getAll()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSubjects(res.data);
        }
      })
      .catch(() => {});

    ClassService.getAll()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setClasses((prev) => {
            const apiClasses = res.data;
            const apiMap = new Map(apiClasses.map((c) => [c.id, c]));
            const merged = prev.map((local) => {
              const fromApi = apiMap.get(local.id);
              if (fromApi) {
                apiMap.delete(local.id);
                return {
                  ...local,
                  ...fromApi,
                  enrolledStudentIds: (fromApi.enrolledStudentIds && fromApi.enrolledStudentIds.length > 0)
                    ? fromApi.enrolledStudentIds
                    : local.enrolledStudentIds
                };
              }
              return local;
            });
            for (const newApiClass of apiMap.values()) {
              merged.push(newApiClass);
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const navigateToTeacherSchedules = (teacherId = null) => {
    if (teacherId) setScheduleFilterTeacherId(teacherId);
    setActiveTab('teacher-schedules');
  };

  const checkScheduleConflict = useCallback((params) => {
    return detectScheduleConflict({
      ...params,
      teacherAvailability,
      teacherSchedules,
      classes,
      teachers
    });
  }, [teacherAvailability, teacherSchedules, classes, teachers]);

  const addTeacherAvailability = async (data) => {
    availabilityCounter += 1;
    const newSlot = {
      id: `AVL-${availabilityCounter}`,
      ...data
    };
    setTeacherAvailability((prev) => [...prev, newSlot]);
    try {
      await ScheduleService.saveAvailability(newSlot);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'success',
      title: 'Availability Added',
      message: `Availability slot saved for ${data.dayOfWeek}.`
    });
    return newSlot;
  };

  const updateTeacherAvailability = async (id, data) => {
    setTeacherAvailability((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, ...data } : slot))
    );
    try {
      await ScheduleService.updateAvailability(id, data);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'info',
      title: 'Availability Updated',
      message: 'Teacher availability hours updated.'
    });
  };

  const deleteTeacherAvailability = async (id) => {
    setTeacherAvailability((prev) => prev.filter((slot) => slot.id !== id));
    try {
      await ScheduleService.deleteAvailability(id);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'warning',
      title: 'Availability Slot Removed',
      message: 'Availability slot deleted successfully.'
    });
  };

  const saveBatchTeacherAvailability = async (teacherId, slots) => {
    setTeacherAvailability((prev) => {
      const otherTeachers = prev.filter((s) => s.teacherId !== teacherId);
      const newSlotsWithIds = slots.map((s, idx) => ({
        id: s.id || `AVL-B-${Date.now()}-${idx}`,
        teacherId,
        ...s
      }));
      return [...otherTeachers, ...newSlotsWithIds];
    });

    try {
      await ScheduleService.saveBatchAvailability({ teacher_id: teacherId, slots });
    } catch {
      // offline fallback
    }

    addToast({
      type: 'success',
      title: 'Weekly Availability Configured',
      message: `Updated weekly availability for teacher.`
    });
  };

  const addTeachingSchedule = async (scheduleData) => {
    scheduleCounter += 1;
    const newSchedule = {
      id: `SCH-${scheduleCounter}`,
      ...scheduleData
    };
    setTeacherSchedules((prev) => [newSchedule, ...prev]);

    // Synchronize class assignment if classId is specified
    if (scheduleData.classId) {
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== scheduleData.classId) return c;
          return {
            ...c,
            teacherId: scheduleData.teacherId || c.teacherId,
            periodId: scheduleData.periodId !== undefined ? scheduleData.periodId : c.periodId
          };
        })
      );
    }

    try {
      await ScheduleService.assignSchedule(newSchedule);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'success',
      title: 'Schedule Assigned',
      message: `Teaching schedule assigned successfully.`
    });
    return newSchedule;
  };

  const updateTeachingSchedule = async (id, updatedData) => {
    setTeacherSchedules((prev) =>
      prev.map((sch) => (sch.id === id ? { ...sch, ...updatedData } : sch))
    );

    if (updatedData.classId) {
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== updatedData.classId) return c;
          return {
            ...c,
            teacherId: updatedData.teacherId !== undefined ? updatedData.teacherId : c.teacherId,
            periodId: updatedData.periodId !== undefined ? updatedData.periodId : c.periodId
          };
        })
      );
    }

    try {
      await ScheduleService.updateSchedule(id, updatedData);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'info',
      title: 'Schedule Updated',
      message: 'Teaching schedule updated successfully.'
    });
  };

  const deleteTeachingSchedule = async (id) => {
    setTeacherSchedules((prev) => prev.filter((sch) => sch.id !== id));
    try {
      await ScheduleService.deleteSchedule(id);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'warning',
      title: 'Schedule Deleted',
      message: 'Teaching schedule assignment has been removed.'
    });
  };

  const addTeachingPeriod = async (periodData) => {
    const newPeriod = {
      id: periodData.id || `PRD-${Date.now()}`,
      status: 'Active',
      days: 'Monday – Friday',
      ...periodData
    };
    setTeachingPeriods((prev) => [...prev, newPeriod]);
    try {
      await ScheduleService.createPeriod(newPeriod);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'success',
      title: 'Teaching Period Created',
      message: `Period '${newPeriod.name}' added successfully.`
    });
    return newPeriod;
  };

  const updateTeachingPeriod = async (id, updatedData) => {
    setTeachingPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedData } : p))
    );
    try {
      await ScheduleService.updatePeriod(id, updatedData);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'info',
      title: 'Teaching Period Updated',
      message: 'Teaching period settings updated.'
    });
  };

  const deleteTeachingPeriod = async (id) => {
    setTeachingPeriods((prev) => prev.filter((p) => p.id !== id));
    setPeriodTeachers((prev) => prev.filter((pt) => pt.periodId !== id));
    try {
      await ScheduleService.deletePeriod(id);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'warning',
      title: 'Period Deleted',
      message: 'Teaching period removed successfully.'
    });
  };

  const assignTeachersToPeriod = async (periodId, teachersData, assignedDays = 'Monday – Friday') => {
    const added = [];
    setPeriodTeachers((prev) => {
      const otherPeriods = prev.filter((pt) => pt.periodId !== periodId);
      const newItems = teachersData.map((item, idx) => {
        const tId = typeof item === 'string' ? item : (item.teacherId || item.id);
        const days = typeof item === 'object' && item.assignedDays ? item.assignedDays : assignedDays;
        const record = {
          id: `PT-${periodId}-${tId}-${idx}`,
          periodId,
          teacherId: tId,
          assignedDays: days,
          status: 'Active'
        };
        added.push(record);
        return record;
      });
      return [...otherPeriods, ...newItems];
    });

    try {
      await ScheduleService.assignPeriodTeachers({
        periodId,
        teachers: teachersData,
        assignedDays
      });
    } catch {
      // offline fallback
    }

    addToast({
      type: 'success',
      title: 'Teachers Assigned',
      message: `Updated teacher assignments for this period.`
    });
    return added;
  };

  const removeTeacherFromPeriod = async (periodId, teacherId) => {
    setPeriodTeachers((prev) =>
      prev.filter((pt) => !(pt.periodId === periodId && pt.teacherId === teacherId))
    );
    try {
      await ScheduleService.removePeriodTeacher(periodId, teacherId);
    } catch {
      // offline fallback
    }
    addToast({
      type: 'info',
      title: 'Teacher Assignment Removed',
      message: 'Teacher unassigned from period.'
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        students,
        setStudents,
        subjects,
        setSubjects,
        classes,
        setClasses,
        teachers,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        invoices,
        selectedStudent,
        setSelectedStudent,
        selectedClassId,
        setSelectedClassId,
        navigateToClassStudents,
        navigateToClassAttendance,
        navigateToSubjects,
        navigateToClasses,
        attendanceRecords,
        saveClassAttendance,
        isAddStudentOpen,
        setIsAddStudentOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toasts,
        addToast,
        removeToast,
        addStudent,
        updateStudent,
        archiveStudent,
        deleteStudent,
        bulkUpdateStudentStatus,
        bulkAssignStudentClass,
        bulkArchiveStudents,
        bulkDeleteStudents,
        updateStudentStatus,
        addSubject,
        updateSubject,
        deleteSubject,
        addClass,
        updateClass,
        archiveClass,
        deleteClass,
        archiveSubject,
        enrollStudentsInClass,
        removeStudentFromClass,
        registerAndEnrollStudent,
        teacherAvailability,
        setTeacherAvailability,
        teacherSchedules,
        setTeacherSchedules,
        teachingPeriods,
        setTeachingPeriods,
        periodTeachers,
        setPeriodTeachers,
        scheduleFilterTeacherId,
        setScheduleFilterTeacherId,
        navigateToTeacherSchedules,
        checkScheduleConflict,
        addTeacherAvailability,
        updateTeacherAvailability,
        deleteTeacherAvailability,
        saveBatchTeacherAvailability,
        addTeachingSchedule,
        updateTeachingSchedule,
        deleteTeachingSchedule,
        addTeachingPeriod,
        updateTeachingPeriod,
        deleteTeachingPeriod,
        assignTeachersToPeriod,
        removeTeacherFromPeriod,
        // Role-based portal features
        userRole,
        switchRole,
        portalUsers,
        currentUser: portalUsers[userRole] || portalUsers.admin,
        parentSelectedChildId,
        setParentChild,
        announcements,
        portalHomework,
        submitStudentHomework
      }}
    >

      {children}
    </AppContext.Provider>
  );
};
