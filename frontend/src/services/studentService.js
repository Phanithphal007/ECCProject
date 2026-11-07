import { apiClient } from './apiClient';
import { mockStudents } from '../mock/students';
import { mockClasses } from '../mock/classes';
import { mockAttendanceRecords } from '../mock/attendance';
import { mockHomework } from '../mock/homework';
import { mockEvaluations } from '../mock/evaluations';
import { mockAnnouncements } from '../mock/announcements';

export const studentService = {
  async getStudentProfile(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/students/profile.php?id=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => mockStudents.find((s) => s.id === studentId) || mockStudents[0]
    });
  },

  async getStudentDashboard(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/students/dashboard.php?id=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => {
        const student = mockStudents.find((s) => s.id === studentId) || mockStudents[0];
        const enrolledClasses = mockClasses.filter(
          (c) => c.enrolledStudentIds?.includes(studentId) || c.id === 'CLS-G1-ALP'
        );
        const attendance = mockAttendanceRecords.filter((a) => a.studentId === studentId);
        const pendingHomework = mockHomework.filter((h) => h.studentId === studentId && h.status === 'Pending');
        const evaluations = mockEvaluations.filter((e) => e.studentId === studentId);

        return {
          student,
          enrolledClasses,
          attendanceRate: student.attendanceRate || 98,
          pendingHomeworkCount: pendingHomework.length,
          pendingHomework,
          recentScore: student.recentScore || '95/100',
          announcements: mockAnnouncements.slice(0, 3)
        };
      }
    });
  },

  async getStudentClasses(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/students/classes.php?id=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => {
        return mockClasses.filter(
          (c) => c.enrolledStudentIds?.includes(studentId) || c.id === 'CLS-G1-ALP'
        );
      }
    });
  },

  async getStudentTimetable(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/students/timetable.php?id=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => {
        return mockClasses.filter(
          (c) => c.enrolledStudentIds?.includes(studentId) || c.id === 'CLS-G1-ALP'
        );
      }
    });
  }
};

