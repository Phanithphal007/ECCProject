import { apiClient } from './apiClient';
import { mockTeachers } from '../mock/teachers';

export const teacherService = {
  async getTeachers() {
    return apiClient.request({
      endpoint: '/teachers/list.php',
      method: 'GET',
      mockFallback: () => mockTeachers
    });
  },

  async getTeacherById(teacherId) {
    return apiClient.request({
      endpoint: `/teachers/detail.php?id=${encodeURIComponent(teacherId)}`,
      method: 'GET',
      mockFallback: () => mockTeachers.find((t) => t.id === teacherId) || null
    });
  }
};

