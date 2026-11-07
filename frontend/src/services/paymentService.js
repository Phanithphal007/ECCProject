import { apiClient } from './apiClient';
import { mockPayments } from '../mock/payments';

export const paymentService = {
  async getPaymentHistory(parentId = 'USR-PARENT-01') {
    return apiClient.request({
      endpoint: `/payments/history.php?parentId=${encodeURIComponent(parentId)}`,
      method: 'GET',
      mockFallback: () => mockPayments.filter((p) => !parentId || p.parentId === parentId)
    });
  },

  async getTuitionFees(parentId = 'USR-PARENT-01') {
    return apiClient.request({
      endpoint: `/payments/tuition-fees.php?parentId=${encodeURIComponent(parentId)}`,
      method: 'GET',
      mockFallback: () => mockPayments
    });
  }
};

