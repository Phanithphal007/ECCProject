import { apiClient } from './apiClient';
import { mockAttendanceRecords } from '../mock/attendance';
import { mockClasses } from '../mock/classes';
import {
  evaluateAttendanceStatus,
  hasAttendanceRecord as checkHasRecord,
  getExistingAttendanceRecord,
  getUniqueAttendanceKey,
  getCambodiaTime
} from '../utils/attendanceSchedule';

export const attendanceService = {
  /**
   * Get attendance for a single student
   */
  async getAttendance(studentId = 'STU-1020') {
    return apiClient.request({
      endpoint: `/attendance/student.php?id=${encodeURIComponent(studentId)}`,
      method: 'GET',
      mockFallback: () => mockAttendanceRecords.filter((a) => !studentId || a.studentId === studentId)
    });
  },

  /**
   * Get attendance records or structured session for a specific class (optional date filter)
   */
  async getClassAttendance(classId, date = null) {
    return apiClient.request({
      endpoint: `/attendance/class.php?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date || '')}`,
      method: 'GET',
      mockFallback: () => {
        if (date) {
          return getExistingAttendanceRecord(classId, date, mockAttendanceRecords);
        }
        return mockAttendanceRecords.filter((a) => a.classId === classId);
      }
    });
  },

  /**
   * Check whether an attendance record already exists for class on date
   */
  async hasAttendanceRecord(classId, date = null) {
    const targetDate = date || getCambodiaTime().dateString;
    return apiClient.request({
      endpoint: `/attendance/check.php?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(targetDate)}`,
      method: 'GET',
      mockFallback: () => checkHasRecord(classId, targetDate, mockAttendanceRecords)
    });
  },

  /**
   * Evaluates if attendance can currently be tracked based on schedule & Cambodia time
   */
  async canTrackAttendance(classId, date = null, currentTime = null) {
    const cls = mockClasses.find((c) => c.id === classId);
    if (!cls) return { canTrack: false, reason: 'Class not found', status: 'INVALID_CLASS' };

    const evaluation = evaluateAttendanceStatus(cls, date, currentTime, mockAttendanceRecords);
    return {
      canTrack: evaluation.canTrack,
      canEdit: evaluation.canEdit,
      status: evaluation.status,
      reason: evaluation.message,
      isLocked: evaluation.isLocked,
      evaluation
    };
  },

  /**
   * Evaluates the complete attendance status for a class on a date
   */
  async getAttendanceStatus(classId, date = null, currentTime = null) {
    const cls = mockClasses.find((c) => c.id === classId);
    if (!cls) return null;
    return evaluateAttendanceStatus(cls, date, currentTime, mockAttendanceRecords);
  },

  /**
   * Save attendance records for a class on a specific date with duplicate prevention.
   * If a record already exists, it delegates to updateClassAttendance to preserve original ID.
   */
  async saveClassAttendance(classId, date, records, recordedBy = 'Teacher Sophea') {
    return apiClient.request({
      endpoint: '/attendance/save.php',
      method: 'POST',
      data: { classId, date, records, recordedBy },
      mockFallback: () => {
        const cambodiaNow = getCambodiaTime();
        const timestamp = `${cambodiaNow.dateString} ${cambodiaNow.timeString}:${String(cambodiaNow.second).padStart(2, '0')}`;
        const attendanceKey = getUniqueAttendanceKey(classId, date);
        const sessionId = `SESS-${classId}-${date}`;

        const cls = mockClasses.find((c) => c.id === classId);
        const teacherId = cls ? cls.teacherId : '';
        const teacherName = recordedBy || (cls ? cls.teacher : 'Teacher');

        // Check if an existing session already exists for (classId, date)
        const hasExisting = checkHasRecord(classId, date, mockAttendanceRecords);

        // Update or Insert student attendance rows
        records.forEach((rec) => {
          const studentId = rec.studentId || rec.id;
          const status = rec.status || rec.attendanceStatus || 'Present';
          const remarks = rec.remarks || '';

          const existingIdx = mockAttendanceRecords.findIndex(
            (a) => a.classId === classId && a.studentId === studentId && a.date === date
          );

          if (existingIdx >= 0) {
            mockAttendanceRecords[existingIdx] = {
              ...mockAttendanceRecords[existingIdx],
              status,
              remarks,
              recordedBy: teacherName,
              teacherId,
              updatedAt: timestamp
            };
          } else {
            mockAttendanceRecords.push({
              id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              sessionId,
              attendanceKey,
              classId,
              studentId,
              date,
              status,
              remarks,
              recordedBy: teacherName,
              teacherId,
              recordedAt: timestamp,
              updatedAt: timestamp
            });
          }
        });

        const studentRecords = records.map((r) => ({
          studentId: r.studentId || r.id,
          studentName: r.name || r.studentName || '',
          attendanceStatus: r.status || r.attendanceStatus || 'Present',
          remarks: r.remarks || ''
        }));

        const structuredSession = {
          id: sessionId,
          attendanceKey,
          classId,
          date,
          teacherId,
          teacherName,
          recordedBy: teacherName,
          recordedAt: timestamp,
          updatedAt: timestamp,
          status: 'Completed',
          studentRecords
        };

        return {
          success: true,
          isUpdate: hasExisting,
          message: hasExisting
            ? `Attendance successfully updated for ${records.length} student(s).`
            : `Attendance successfully saved for ${records.length} student(s).`,
          record: structuredSession,
          classId,
          date,
          recordsCount: records.length
        };
      }
    });
  },

  /**
   * Update existing attendance record preserving original record/session ID
   */
  async updateClassAttendance(recordIdOrKey, records, updatedBy = 'Teacher Sophea') {
    return apiClient.request({
      endpoint: '/attendance/update.php',
      method: 'POST',
      data: { recordIdOrKey, records, updatedBy },
      mockFallback: () => {
        const cambodiaNow = getCambodiaTime();
        const timestamp = `${cambodiaNow.dateString} ${cambodiaNow.timeString}:${String(cambodiaNow.second).padStart(2, '0')}`;

        records.forEach((rec) => {
          const studentId = rec.studentId || rec.id;
          const status = rec.status || rec.attendanceStatus || 'Present';
          const remarks = rec.remarks || '';

          const existingIdx = mockAttendanceRecords.findIndex(
            (a) => (a.sessionId === recordIdOrKey || a.attendanceKey === recordIdOrKey || a.id === recordIdOrKey) &&
                   a.studentId === studentId
          );

          if (existingIdx >= 0) {
            mockAttendanceRecords[existingIdx] = {
              ...mockAttendanceRecords[existingIdx],
              status,
              remarks,
              recordedBy: updatedBy,
              updatedAt: timestamp
            };
          }
        });

        return {
          success: true,
          message: `Attendance record updated successfully.`,
          recordId: recordIdOrKey,
          updatedAt: timestamp
        };
      }
    });
  }
};
