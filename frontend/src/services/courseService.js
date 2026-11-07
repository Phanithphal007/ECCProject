import { apiClient } from './apiClient';
import { mockCourses } from '../mock/courses';

export const courseService = {
  /**
   * Get all English Courses with prices
   */
  async getCourses() {
    return apiClient.request({
      endpoint: '/courses/list.php',
      method: 'GET',
      mockFallback: () => mockCourses
    });
  },

  /**
   * Get Course by ID or Slug
   */
  async getCourseById(idOrSlug) {
    return apiClient.request({
      endpoint: `/courses/detail.php?id=${encodeURIComponent(idOrSlug)}`,
      method: 'GET',
      mockFallback: () => {
        return mockCourses.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null;
      }
    });
  },

  /**
   * Get Featured Courses for Home Landing Page
   */
  async getFeaturedCourses() {
    return apiClient.request({
      endpoint: '/courses/featured.php',
      method: 'GET',
      mockFallback: () => mockCourses.filter((c) => c.featured)
    });
  },

  /**
   * Submit an Enrollment Inquiry for a Course
   */
  async submitEnrollmentInquiry(inquiryData) {
    return apiClient.request({
      endpoint: '/courses/inquiry.php',
      method: 'POST',
      data: inquiryData,
      mockFallback: () => {
        return {
          success: true,
          inquiryId: `INQ-${Date.now().toString().slice(-4)}`,
          message: `Thank you, ${inquiryData.parentName}! Your inquiry for ${inquiryData.childName} has been received. Our ECC Academic team will contact you at ${inquiryData.phone} shortly.`
        };
      }
    });
  }
};

