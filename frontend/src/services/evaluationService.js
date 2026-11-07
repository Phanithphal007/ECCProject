import { apiClient } from './apiClient';
import { mockEvaluations } from '../mock/evaluations';

export const evaluationService = {
  async getEvaluations(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/evaluations/list.php?studentId=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => mockEvaluations.filter((e) => !studentId || e.studentId === studentId)
    });
  },

  async getEvaluationById(evaluationId) {
    return apiClient.request({
      endpoint: `/evaluations/detail.php?id=${encodeURIComponent(evaluationId)}`,
      method: 'GET',
      mockFallback: () => mockEvaluations.find((e) => e.id === evaluationId) || mockEvaluations[0]
    });
  }
};

