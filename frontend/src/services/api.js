import axios from 'axios';

// Base API URL pointing to PHP OOP Backend / InfinityFree deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/ECCProjec/backend/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend endpoint is offline or returning 404, log warning gracefully
    console.warn('API request failed, utilizing local state fallback:', error?.message);
    return Promise.reject(error);
  }
);

export const StudentService = {
  getAll: (params) => apiClient.get('/students.php', { params }),
  getById: (id) => apiClient.get(`/students.php?id=${id}`),
  create: (data) => apiClient.post('/students.php', data),
  update: (id, data) => apiClient.put(`/students.php?id=${id}`, data),
  archive: (id) => apiClient.put(`/students.php?id=${id}&action=archive`),
  delete: (id) => apiClient.delete(`/students.php?id=${id}`),
  bulkUpdateStatus: (studentIds, status) => apiClient.put('/students.php?action=bulk-status', { studentIds, status }),
  bulkAssignClass: (studentIds, classId) => apiClient.put('/students.php?action=bulk-assign', { studentIds, classId }),
};

export const AttendanceService = {
  getByClassAndDate: (classId, date) => apiClient.get(`/attendance.php?class_id=${classId}&date=${date}`),
  getHistory: (classId, startDate, endDate) => 
    apiClient.get(`/attendance.php?class_id=${classId}&action=history${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`),
  saveBatch: (data) => apiClient.post('/attendance.php', data),
};

export const ClassService = {
  getAll: () => apiClient.get('/classes.php'),
  getById: (id) => apiClient.get(`/classes.php?id=${id}`),
  getNextCode: () => apiClient.get('/classes.php?action=next-code'),
  create: (data) => apiClient.post('/classes.php', data),
  update: (id, data) => apiClient.put(`/classes.php?id=${id}`, data),
  delete: (id) => apiClient.delete(`/classes.php?id=${id}`),
  getScheduleToday: () => apiClient.get('/classes.php?today=1'),
};

export const SubjectService = {
  getAll: () => apiClient.get('/subjects.php'),
  getById: (id) => apiClient.get(`/subjects.php?id=${id}`),
  getNextCode: () => apiClient.get('/subjects.php?action=next-code'),
  create: (data) => apiClient.post('/subjects.php', data),
  update: (id, data) => apiClient.put(`/subjects.php?id=${id}`, data),
  delete: (id) => apiClient.delete(`/subjects.php?id=${id}`),
};

export const EnrollmentService = {
  getByClassId: (classId) => apiClient.get(`/enrollments.php?class_id=${classId}`),
  getByStudentId: (studentId) => apiClient.get(`/enrollments.php?student_id=${studentId}`),
  enrollStudents: (classId, studentIds) => apiClient.post('/enrollments.php', { classId, studentIds }),
  removeStudent: (classId, studentId) => apiClient.delete(`/enrollments.php?class_id=${classId}&student_id=${studentId}`),
};

export const PaymentService = {
  getAll: (params) => apiClient.get('/payments.php', { params }),
  getStudentPayments: (studentId) => apiClient.get(`/payments.php?student_id=${studentId}`),
  recordPayment: (data) => apiClient.post('/payments.php', data),
  getSummary: () => apiClient.get('/payments.php?action=summary'),
  deletePayment: (id) => apiClient.delete(`/payments.php?id=${id}`),
  getInvoices: () => apiClient.get('/payments.php'),
  sendReminder: (invoiceId) => apiClient.post('/payments.php?action=remind', { invoiceId }),
};

export const EvaluationService = {
  getEvaluationHtmlUrl: (studentId) => `${API_BASE_URL}/evaluation-pdf.php?student_id=${studentId}`,
  getReportData: (studentId) => apiClient.get(`/evaluation-pdf.php?student_id=${studentId}&format=json`),
  saveEvaluation: (data) => apiClient.post('/evaluation-pdf.php', data),
};

export const ScheduleService = {
  getStats: () => apiClient.get('/schedules.php?action=stats'),
  getPeriods: () => apiClient.get('/schedules.php?action=periods'),
  createPeriod: (data) => apiClient.post('/schedules.php?action=create-period', data),
  updatePeriod: (id, data) => apiClient.put(`/schedules.php?id=${id}&action=update-period`, data),
  deletePeriod: (id) => apiClient.delete(`/schedules.php?id=${id}&action=delete-period`),
  assignPeriodTeachers: (data) => apiClient.post('/schedules.php?action=assign-period-teachers', data),
  removePeriodTeacher: (periodId, teacherId) => apiClient.delete(`/schedules.php?period_id=${periodId}&teacher_id=${teacherId}&action=remove-period-teacher`),
  getAvailability: (teacherId) => apiClient.get(`/schedules.php?action=availability${teacherId ? `&teacher_id=${teacherId}` : ''}`),
  saveAvailability: (data) => apiClient.post('/schedules.php?action=availability', data),
  saveBatchAvailability: (data) => apiClient.post('/schedules.php?action=batch-availability', data),
  updateAvailability: (id, data) => apiClient.put(`/schedules.php?id=${id}&action=availability`, data),
  deleteAvailability: (id) => apiClient.delete(`/schedules.php?id=${id}&action=availability`),
  getTeachingSchedules: (params) => apiClient.get('/schedules.php?action=teaching-schedules', { params }),
  getWeekly: (teacherId) => apiClient.get(`/schedules.php?action=weekly${teacherId ? `&teacher_id=${teacherId}` : ''}`),
  assignSchedule: (data) => apiClient.post('/schedules.php?action=schedule', data),
  updateSchedule: (id, data) => apiClient.put(`/schedules.php?id=${id}&action=schedule`, data),
  deleteSchedule: (id) => apiClient.delete(`/schedules.php?id=${id}&action=schedule`),
  checkConflict: (params) => apiClient.get('/schedules.php?action=check-conflict', { params }),
};

export const PortalService = {
  getParentData: (parentId, studentId) => 
    apiClient.get(`/portal.php?action=parent${parentId ? `&parent_id=${parentId}` : ''}${studentId ? `&student_id=${studentId}` : ''}`),
  getStudentData: (studentId) => 
    apiClient.get(`/portal.php?action=student${studentId ? `&student_id=${studentId}` : ''}`),
  getAnnouncements: (role) => 
    apiClient.get(`/portal.php?action=announcements${role ? `&role=${role}` : ''}`),
  submitHomework: (data) => 
    apiClient.post('/portal.php?action=submit-homework', data),
  getUsers: () => 
    apiClient.get('/portal.php?action=users'),
};



