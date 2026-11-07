import { apiClient } from './apiClient.js';
import { mockScores, mockAssessmentPeriods, DEFAULT_ASSESSMENT_ITEMS } from '../mock/scores.js';

export const calculateScoreMetrics = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalMax: 0,
      totalObtained: 0,
      percentage: 0,
      grade: '-',
      isValid: false,
      itemCount: 0
    };
  }

  let totalMax = 0;
  let totalObtained = 0;
  let hasValidRows = false;

  items.forEach((item) => {
    const max = Number(item.maxScore);
    const obt = Number(item.obtainedScore);
    if (!isNaN(max) && max > 0 && !isNaN(obt) && obt >= 0) {
      totalMax += max;
      totalObtained += obt;
      hasValidRows = true;
    }
  });

  if (!hasValidRows || totalMax <= 0) {
    return {
      totalMax: 0,
      totalObtained: 0,
      percentage: 0,
      grade: '-',
      isValid: false,
      itemCount: items.length
    };
  }

  const percentage = Number(((totalObtained / totalMax) * 100).toFixed(1));
  let grade = 'F';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';

  return {
    totalMax,
    totalObtained,
    percentage,
    grade,
    isValid: true,
    itemCount: items.length
  };
};

export const scoreService = {
  /**
   * Get all assessment periods
   */
  async getAssessmentPeriods() {
    return apiClient.request({
      endpoint: '/scores/periods.php',
      method: 'GET',
      mockFallback: () => ({
        success: true,
        data: [...mockAssessmentPeriods]
      })
    });
  },

  /**
   * Get the active or specific period score record for a student (optionally class-specific)
   */
  async getStudentScores(studentId, periodId = null, classId = null) {
    const params = new URLSearchParams({ studentId });
    if (periodId) params.append('periodId', periodId);
    if (classId) params.append('classId', classId);

    return apiClient.request({
      endpoint: `/scores/student.php?${params.toString()}`,
      method: 'GET',
      mockFallback: () => {
        let record;

        // 1. If both periodId and classId are given, exact match first
        if (periodId && classId) {
          record = mockScores.find((s) => s.studentId === studentId && s.periodId === periodId && s.classId === classId);
        } else if (classId) {
          // If only classId is given, find latest record for that class
          const currentPeriod = mockAssessmentPeriods.find((p) => p.isCurrent)?.id || mockAssessmentPeriods[0]?.id;
          record = mockScores.find((s) => s.studentId === studentId && s.classId === classId && s.periodId === currentPeriod) ||
                   mockScores.find((s) => s.studentId === studentId && s.classId === classId);
        } else if (periodId) {
          // If only periodId is given, find record for that period
          record = mockScores.find((s) => s.studentId === studentId && s.periodId === periodId);
        } else {
          // Find current/latest period score or any score for student
          const currentPeriod = mockAssessmentPeriods.find((p) => p.isCurrent)?.id || mockAssessmentPeriods[0]?.id;
          record = mockScores.find((s) => s.studentId === studentId && s.periodId === currentPeriod) ||
                   mockScores.find((s) => s.studentId === studentId);
        }

        if (record) {
          return {
            success: true,
            data: {
              ...record,
              metrics: calculateScoreMetrics(record.items)
            }
          };
        }

        // Return a clean default new template if no record exists yet
        const defaultPeriod = mockAssessmentPeriods.find((p) => (periodId ? p.id === periodId : p.isCurrent)) || mockAssessmentPeriods[0];
        const newTemplate = {
          id: `NEW-${studentId}-${classId || 'GEN'}-${defaultPeriod.id}`,
          isNew: true,
          studentId,
          classId: classId || '',
          periodId: defaultPeriod.id,
          periodName: defaultPeriod.name,
          periodNameKhmer: defaultPeriod.nameKhmer,
          academicYear: defaultPeriod.academicYear,
          dateRecorded: new Date().toISOString().split('T')[0],
          items: DEFAULT_ASSESSMENT_ITEMS.map((item) => ({ ...item })),
          teacherRemarks: '',
          teacherRemarksKhmer: ''
        };

        return {
          success: true,
          data: {
            ...newTemplate,
            metrics: calculateScoreMetrics(newTemplate.items)
          }
        };
      }
    });
  },

  /**
   * Fast summary indicator lookup for student roster table
   */
  getStudentScoresSummary(studentId, classId = null) {
    const matching = mockScores.filter(
      (s) => s.studentId === studentId && (!classId || s.classId === classId)
    );
    if (matching.length === 0) {
      return {
        hasScore: false,
        scoreText: 'Not Recorded',
        grade: null,
        percentage: 0
      };
    }

    const latest = matching.sort((a, b) => new Date(b.dateRecorded || 0) - new Date(a.dateRecorded || 0))[0];
    const metrics = latest.metrics || calculateScoreMetrics(latest.items);
    return {
      hasScore: metrics.isValid,
      scoreText: `${metrics.totalObtained}/${metrics.totalMax}`,
      grade: metrics.grade,
      percentage: metrics.percentage,
      periodName: latest.periodName,
      periodId: latest.periodId
    };
  },

  /**
   * Get score by scoreId
   */
  async getScoreById(scoreId) {
    return apiClient.request({
      endpoint: `/scores/detail.php?id=${encodeURIComponent(scoreId)}`,
      method: 'GET',
      mockFallback: () => {
        const record = mockScores.find((s) => s.id === scoreId);
        if (!record) {
          throw new Error(`Score record with ID "${scoreId}" not found.`);
        }
        return {
          success: true,
          data: {
            ...record,
            metrics: calculateScoreMetrics(record.items)
          }
        };
      }
    });
  },

  /**
   * Get complete assessment score history for a student (optionally class-specific)
   */
  async getStudentScoreHistory(studentId, classId = null) {
    return apiClient.request({
      endpoint: `/scores/history.php?studentId=${encodeURIComponent(studentId)}${classId ? `&classId=${encodeURIComponent(classId)}` : ''}`,
      method: 'GET',
      mockFallback: () => {
        const history = mockScores
          .filter((s) => s.studentId === studentId && (!classId || s.classId === classId))
          .map((record) => ({
            ...record,
            metrics: calculateScoreMetrics(record.items)
          }))
          .sort((a, b) => new Date(b.dateRecorded || 0) - new Date(a.dateRecorded || 0));

        return {
          success: true,
          data: history
        };
      }
    });
  },

  /**
   * Create student scores record
   */
  async createStudentScores(studentId, scoreData) {
    return apiClient.request({
      endpoint: '/scores/create.php',
      method: 'POST',
      data: { studentId, ...scoreData },
      mockFallback: () => {
        if (!scoreData.items || scoreData.items.length === 0) {
          throw new Error('At least one assessment row is required.');
        }

        // Validate items
        for (const item of scoreData.items) {
          const max = Number(item.maxScore);
          const obt = Number(item.obtainedScore);
          if (isNaN(max) || max <= 0) {
            throw new Error(`Maximum score for "${item.name || 'Assessment'}" must be greater than zero.`);
          }
          if (isNaN(obt) || obt < 0) {
            throw new Error(`Obtained score for "${item.name || 'Assessment'}" cannot be negative.`);
          }
          if (obt > max) {
            throw new Error(`Obtained score (${obt}) cannot exceed maximum score (${max}) for "${item.name}".`);
          }
        }

        // Check if a record already exists for this student, period, and class to prevent duplicates
        const existingIndex = mockScores.findIndex(
          (s) => s.studentId === studentId && 
                 s.periodId === scoreData.periodId &&
                 (!scoreData.classId || s.classId === scoreData.classId)
        );

        const newId = existingIndex >= 0 
          ? mockScores[existingIndex].id 
          : `SCORE-${studentId}-${scoreData.classId || 'GEN'}-${scoreData.periodId || Date.now()}`;

        const newRecord = {
          id: newId,
          studentId,
          periodId: scoreData.periodId || 'T4-MID-2026',
          periodName: scoreData.periodName || 'Term 4 Mid-Term Assessment 2026',
          periodNameKhmer: scoreData.periodNameKhmer || 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
          academicYear: scoreData.academicYear || '2026-2027',
          classId: scoreData.classId || 'CLS-G1-ALP',
          className: scoreData.className || 'Grade 1 — Alphabet A',
          course: scoreData.course || 'Primary English Alphabet & Phonics',
          teacher: scoreData.teacher || 'Teacher Sovannary Long',
          dateRecorded: scoreData.dateRecorded || new Date().toISOString().split('T')[0],
          items: scoreData.items.map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            name: it.name?.trim() || `Assessment ${idx + 1}`,
            nameKhmer: it.nameKhmer?.trim() || '',
            maxScore: Number(it.maxScore),
            obtainedScore: Number(it.obtainedScore)
          })),
          teacherRemarks: scoreData.teacherRemarks || '',
          teacherRemarksKhmer: scoreData.teacherRemarksKhmer || ''
        };

        if (existingIndex >= 0) {
          mockScores[existingIndex] = newRecord;
        } else {
          mockScores.unshift(newRecord);
        }

        return {
          success: true,
          data: {
            ...newRecord,
            metrics: calculateScoreMetrics(newRecord.items)
          }
        };
      }
    });
  },

  /**
   * Update student scores record
   */
  async updateStudentScores(scoreId, scoreData) {
    return apiClient.request({
      endpoint: `/scores/update.php?id=${encodeURIComponent(scoreId)}`,
      method: 'PUT',
      data: scoreData,
      mockFallback: () => {
        const index = mockScores.findIndex((s) => s.id === scoreId);
        
        // If it's a transient ID (e.g. NEW-...), look up by studentId, classId, and periodId
        let targetIndex = index;
        if (targetIndex === -1 && scoreData.studentId && scoreData.periodId) {
          targetIndex = mockScores.findIndex(
            (s) => s.studentId === scoreData.studentId && 
                   s.periodId === scoreData.periodId &&
                   (!scoreData.classId || s.classId === scoreData.classId)
          );
        }

        // Validate items
        if (!scoreData.items || scoreData.items.length === 0) {
          throw new Error('At least one assessment row is required.');
        }

        for (const item of scoreData.items) {
          const max = Number(item.maxScore);
          const obt = Number(item.obtainedScore);
          if (isNaN(max) || max <= 0) {
            throw new Error(`Maximum score for "${item.name || 'Assessment'}" must be greater than zero.`);
          }
          if (isNaN(obt) || obt < 0) {
            throw new Error(`Obtained score for "${item.name || 'Assessment'}" cannot be negative.`);
          }
          if (obt > max) {
            throw new Error(`Obtained score (${obt}) cannot exceed maximum score (${max}) for "${item.name}".`);
          }
        }

        const updatedRecord = {
          id: targetIndex >= 0 ? mockScores[targetIndex].id : scoreId.startsWith('NEW-') ? `SCORE-${scoreData.studentId}-${scoreData.classId || 'GEN'}-${scoreData.periodId || Date.now()}` : scoreId,
          studentId: scoreData.studentId,
          periodId: scoreData.periodId || 'T4-MID-2026',
          periodName: scoreData.periodName || 'Term 4 Mid-Term Assessment 2026',
          periodNameKhmer: scoreData.periodNameKhmer || 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
          academicYear: scoreData.academicYear || '2026-2027',
          classId: scoreData.classId || 'CLS-G1-ALP',
          className: scoreData.className || 'Grade 1 — Alphabet A',
          course: scoreData.course || 'Primary English Alphabet & Phonics',
          teacher: scoreData.teacher || 'Teacher Sovannary Long',
          dateRecorded: scoreData.dateRecorded || new Date().toISOString().split('T')[0],
          items: scoreData.items.map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            name: it.name?.trim() || `Assessment ${idx + 1}`,
            nameKhmer: it.nameKhmer?.trim() || '',
            maxScore: Number(it.maxScore),
            obtainedScore: Number(it.obtainedScore)
          })),
          teacherRemarks: scoreData.teacherRemarks || '',
          teacherRemarksKhmer: scoreData.teacherRemarksKhmer || ''
        };

        if (targetIndex >= 0) {
          mockScores[targetIndex] = updatedRecord;
        } else {
          mockScores.unshift(updatedRecord);
        }

        return {
          success: true,
          data: {
            ...updatedRecord,
            metrics: calculateScoreMetrics(updatedRecord.items)
          }
        };
      }
    });
  }
};
