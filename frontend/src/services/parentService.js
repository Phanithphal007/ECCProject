import { apiClient } from './apiClient';
import { mockParents } from '../mock/parents';
import { mockStudents } from '../mock/students';
import { mockClasses } from '../mock/classes';
import { mockPayments } from '../mock/payments';
import { mockAnnouncements } from '../mock/announcements';

export const parentService = {
  async getParentProfile(parentId = 'USR-PARENT-01') {
    return apiClient.request({
      endpoint: `/parents/profile.php?id=${encodeURIComponent(parentId)}`,
      method: 'GET',
      mockFallback: () => mockParents.find((p) => p.id === parentId) || mockParents[0]
    });
  },

  async getChildren(parentId = 'USR-PARENT-01') {
    return apiClient.request({
      endpoint: `/parents/children.php?id=${encodeURIComponent(parentId)}`,
      method: 'GET',
      mockFallback: () => {
        const parent = mockParents.find((p) => p.id === parentId) || mockParents[0];
        const childIds = parent.linkedChildrenIds || ['STU-1020', 'STU-1021'];
        return mockStudents.filter((s) => childIds.includes(s.id));
      }
    });
  },

  async getChildDetails(childId) {
    return apiClient.request({
      endpoint: `/parents/child-details.php?id=${encodeURIComponent(childId)}`,
      method: 'GET',
      mockFallback: () => {
        const child = mockStudents.find((s) => s.id === childId) || mockStudents[0];
        const enrolledClasses = mockClasses.filter(
          (c) => c.enrolledStudentIds?.includes(childId) || c.id === 'CLS-G1-ALP'
        );
        const payments = mockPayments.filter((p) => p.studentId === childId);

        return {
          child,
          enrolledClasses,
          payments
        };
      }
    });
  },

  async getParentDashboard(parentId = 'USR-PARENT-01') {
    return apiClient.request({
      endpoint: `/parents/dashboard.php?id=${encodeURIComponent(parentId)}`,
      method: 'GET',
      mockFallback: () => {
        const parent = mockParents.find((p) => p.id === parentId) || mockParents[0];
        const childIds = parent.linkedChildrenIds || ['STU-1020', 'STU-1021'];
        const children = mockStudents.filter((s) => childIds.includes(s.id));
        const invoices = mockPayments.filter((p) => p.parentId === parentId);
        const outstandingTotal = invoices
          .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
          .reduce((sum, i) => sum + i.amount, 0);

        return {
          parent,
          children,
          totalChildren: children.length,
          outstandingBalance: outstandingTotal,
          recentInvoices: invoices.slice(0, 3),
          announcements: mockAnnouncements.slice(0, 3)
        };
      }
    });
  }
};

