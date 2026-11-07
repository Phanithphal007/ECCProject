import { apiClient } from './apiClient';
import { mockStudents } from '../mock/students';
import { mockClasses } from '../mock/classes';
import { mockTeachers } from '../mock/teachers';
import { mockCourses } from '../mock/courses';

export const dashboardService = {
  async getAdminStats() {
    return apiClient.request({
      endpoint: '/dashboard/stats.php',
      method: 'GET',
      mockFallback: () => {
        return {
          totalStudents: mockStudents.length,
          activeClasses: mockClasses.filter((c) => c.status === 'Active').length,
          totalTeachers: mockTeachers.length,
          totalCourses: mockCourses.length,
          averageAttendance: 97.4,
          collectedTuitionUSD: 36800,
          pendingTuitionUSD: 195
        };
      }
    });
  }
};

