import { apiClient } from './apiClient';
import { mockHomework } from '../mock/homework';

export const homeworkService = {
  async getHomework(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/homework/list.php?studentId=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => mockHomework.filter((h) => !studentId || h.studentId === studentId)
    });
  },

  async submitHomework(submissionData) {
    const { homeworkId, studentId, notes, fileName } = submissionData;
    return apiClient.request({
      endpoint: '/homework/submit.php',
      method: 'POST',
      data: submissionData,
      mockFallback: () => {
        return {
          success: true,
          submissionId: `SUB-${Date.now().toString().slice(-4)}`,
          homeworkId,
          submittedAt: new Date().toISOString(),
          fileName: fileName || 'homework_solution.pdf',
          notes,
          message: 'Homework task submitted successfully to teacher.'
        };
      }
    });
  }
};

