import { apiClient } from './apiClient';
import { mockClasses } from '../mock/classes';
import { mockStudents } from '../mock/students';
import { extractClassSchedule } from '../utils/attendanceSchedule';

export const classService = {
  /**
   * Get next unique auto-generated class code (CLS-001, CLS-002, ...)
   */
  async getNextCode() {
    return apiClient.request({
      endpoint: '/classes.php?action=next-code',
      method: 'GET',
      mockFallback: () => {
        let maxSeq = 0;
        mockClasses.forEach((c) => {
          const match = c.code?.match(/^CLS-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSeq) maxSeq = num;
          }
        });
        const nextNum = maxSeq + 1;
        return {
          success: true,
          code: `CLS-${String(nextNum).padStart(3, '0')}`,
          next_sequence: nextNum
        };
      }
    });
  },

  /**
   * Get all classes
   */
  async getClasses() {
    return apiClient.request({
      endpoint: '/classes/list.php',
      method: 'GET',
      mockFallback: () => mockClasses
    });
  },

  /**
   * Get a class by its ID
   */
  async getClassById(classId) {
    return apiClient.request({
      endpoint: `/classes/detail.php?id=${encodeURIComponent(classId)}`,
      method: 'GET',
      mockFallback: () => mockClasses.find((c) => c.id === classId) || null
    });
  },

  /**
   * Get today's class schedule and attendance window in Cambodia time
   */
  async getTodayClassSchedule(classId, date = null) {
    return apiClient.request({
      endpoint: `/classes/today-schedule.php?id=${encodeURIComponent(classId)}&date=${encodeURIComponent(date || '')}`,
      method: 'GET',
      mockFallback: () => {
        const cls = mockClasses.find((c) => c.id === classId);
        if (!cls) return null;
        return extractClassSchedule(cls, date);
      }
    });
  },

  /**
   * Get all students enrolled in a specific class
   */
  async getClassStudents(classId) {
    return apiClient.request({
      endpoint: `/classes/students.php?classId=${encodeURIComponent(classId)}`,
      method: 'GET',
      mockFallback: () => {
        const cls = mockClasses.find((c) => c.id === classId);
        if (!cls || !Array.isArray(cls.enrolledStudentIds)) return [];
        return mockStudents.filter((s) => cls.enrolledStudentIds.includes(s.id));
      }
    });
  },

  /**
   * Get classes by course / subject ID
   */
  async getClassesByCourse(courseId) {
    return apiClient.request({
      endpoint: `/classes/by-course.php?courseId=${encodeURIComponent(courseId)}`,
      method: 'GET',
      mockFallback: () => mockClasses.filter((c) => c.subjectId === courseId || c.courseId === courseId)
    });
  },

  /**
   * Enroll students into a class
   */
  async enrollStudents(classId, studentIds) {
    return apiClient.request({
      endpoint: '/classes/enroll.php',
      method: 'POST',
      data: { classId, studentIds },
      mockFallback: () => {
        const cls = mockClasses.find((c) => c.id === classId);
        if (cls) {
          if (!Array.isArray(cls.enrolledStudentIds)) cls.enrolledStudentIds = [];
          studentIds.forEach((id) => {
            if (!cls.enrolledStudentIds.includes(id)) cls.enrolledStudentIds.push(id);
          });
          cls.enrolled = cls.enrolledStudentIds.length;
        }
        return { success: true, classId, enrolledCount: studentIds.length };
      }
    });
  },

  /**
   * Remove a student from a class
   */
  async removeStudent(classId, studentId) {
    return apiClient.request({
      endpoint: '/classes/remove-student.php',
      method: 'POST',
      data: { classId, studentId },
      mockFallback: () => {
        const cls = mockClasses.find((c) => c.id === classId);
        if (cls && Array.isArray(cls.enrolledStudentIds)) {
          cls.enrolledStudentIds = cls.enrolledStudentIds.filter((id) => id !== studentId);
          cls.enrolled = cls.enrolledStudentIds.length;
        }
        return { success: true, classId, studentId };
      }
    });
  },

  /**
   * Archive a class
   */
  async archiveClass(classId) {
    return apiClient.request({
      endpoint: '/classes/archive.php',
      method: 'POST',
      data: { classId },
      mockFallback: () => {
        const cls = mockClasses.find((c) => c.id === classId);
        if (cls) cls.status = 'Archived';
        return { success: true, classId, status: 'Archived' };
      }
    });
  },

  /**
   * Delete a class
   */
  async deleteClass(classId) {
    return apiClient.request({
      endpoint: '/classes/delete.php',
      method: 'POST',
      data: { classId },
      mockFallback: () => {
        const idx = mockClasses.findIndex((c) => c.id === classId);
        if (idx >= 0) mockClasses.splice(idx, 1);
        return { success: true, classId };
      }
    });
  }
};
