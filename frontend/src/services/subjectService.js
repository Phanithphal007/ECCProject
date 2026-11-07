import { apiClient } from './apiClient.js';
import { mockSubjects } from '../mock/subjects.js';
import { mockClasses } from '../mock/classes.js';

export const subjectService = {
  /**
   * Get all English subjects
   */
  async getSubjects() {
    return apiClient.request({
      endpoint: '/subjects.php',
      method: 'GET',
      mockFallback: () => mockSubjects
    });
  },

  /**
   * Get subject by ID
   */
  async getSubjectById(subjectId) {
    return apiClient.request({
      endpoint: `/subjects.php?id=${encodeURIComponent(subjectId)}`,
      method: 'GET',
      mockFallback: () => mockSubjects.find((s) => s.id === subjectId) || null
    });
  },

  /**
   * Get next auto-generated subject code from backend API
   */
  async getNextCode() {
    return apiClient.request({
      endpoint: '/subjects.php?action=next-code',
      method: 'GET',
      mockFallback: () => {
        // Calculate next sequence based on existing subjects
        const numericCodes = mockSubjects
          .map((s) => {
            const m = (s.code || '').match(/^ENG-(\d+)$/i);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter((n) => n > 0);
        const maxSeq = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;
        const nextSeq = maxSeq + 1;
        return {
          success: true,
          code: `ENG-${String(nextSeq).padStart(3, '0')}`,
          next_sequence: nextSeq
        };
      }
    });
  },

  /**
   * Create a new subject with duplicate code validation
   */
  async createSubject(subjectData) {
    return apiClient.request({
      endpoint: '/subjects.php',
      method: 'POST',
      data: subjectData,
      mockFallback: () => {
        // Validate code uniqueness
        const codeExists = mockSubjects.some(
          (s) => (s.code || '').trim().toUpperCase() === (subjectData.code || '').trim().toUpperCase()
        );
        if (codeExists) {
          throw new Error(`Subject code "${subjectData.code}" already exists.`);
        }

        const newSubject = {
          id: subjectData.id || `SUB-${Date.now().toString().slice(-4)}`,
          code: subjectData.code || `ENG-${Date.now().toString().slice(-3)}`,
          name: subjectData.name || '',
          nameKhmer: subjectData.nameKhmer || '',
          category: subjectData.category || 'Core Skills',
          description: subjectData.description || '',
          grades: subjectData.grades || 'Grade 1 - 12',
          skills: Array.isArray(subjectData.skills) ? [...subjectData.skills] : [],
          status: subjectData.status || 'Active'
        };

        mockSubjects.unshift(newSubject);
        return { success: true, subject: newSubject };
      }
    });
  },

  /**
   * Update an existing subject with duplicate code validation
   */
  async updateSubject(subjectId, updatedData) {
    return apiClient.request({
      endpoint: `/subjects.php?id=${encodeURIComponent(subjectId)}`,
      method: 'PUT',
      data: { id: subjectId, ...updatedData },
      mockFallback: () => {
        // Validate code uniqueness if code is changed
        if (updatedData.code) {
          const duplicate = mockSubjects.some(
            (s) => s.id !== subjectId && (s.code || '').trim().toUpperCase() === updatedData.code.trim().toUpperCase()
          );
          if (duplicate) {
            throw new Error(`Subject code "${updatedData.code}" is already in use by another subject.`);
          }
        }

        const idx = mockSubjects.findIndex((s) => s.id === subjectId);
        if (idx >= 0) {
          mockSubjects[idx] = {
            ...mockSubjects[idx],
            ...updatedData
          };
          return { success: true, subject: mockSubjects[idx] };
        }
        throw new Error(`Subject with ID ${subjectId} not found.`);
      }
    });
  },

  /**
   * Archive subject (changes status to Archived)
   */
  async archiveSubject(subjectId) {
    return apiClient.request({
      endpoint: `/subjects.php?id=${encodeURIComponent(subjectId)}`,
      method: 'PUT',
      data: { id: subjectId, status: 'Archived' },
      mockFallback: () => {
        const subject = mockSubjects.find((s) => s.id === subjectId);
        if (subject) {
          subject.status = subject.status === 'Archived' ? 'Active' : 'Archived';
          return { success: true, subjectId, status: subject.status };
        }
        throw new Error(`Subject with ID ${subjectId} not found.`);
      }
    });
  },

  /**
   * Delete subject only if no associated classes exist
   */
  async deleteSubject(subjectId) {
    return apiClient.request({
      endpoint: `/subjects.php?id=${encodeURIComponent(subjectId)}`,
      method: 'DELETE',
      mockFallback: () => {
        // Check relationship constraint: must have 0 associated classes
        const associatedClasses = mockClasses.filter((c) => c.subjectId === subjectId);
        if (associatedClasses.length > 0) {
          throw new Error(
            `Cannot delete subject: ${associatedClasses.length} class(es) are currently associated with it.`
          );
        }

        const idx = mockSubjects.findIndex((s) => s.id === subjectId);
        if (idx >= 0) {
          mockSubjects.splice(idx, 1);
          return { success: true, subjectId };
        }
        throw new Error(`Subject with ID ${subjectId} not found.`);
      }
    });
  },

  /**
   * Get all classes associated with a specific subject
   */
  async getSubjectClasses(subjectId) {
    return apiClient.request({
      endpoint: `/subjects/classes.php?subjectId=${encodeURIComponent(subjectId)}`,
      method: 'GET',
      mockFallback: () => {
        return mockClasses.filter((c) => c.subjectId === subjectId);
      }
    });
  }
};
