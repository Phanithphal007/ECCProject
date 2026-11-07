/**
 * EduManage ECC — Cambodia Attendance Schedule & Daily Lock Engine
 * Timezone: Asia/Phnom_Penh
 * 
 * Enforces strict schedule matching, Cambodia local time evaluation,
 * attendance windows with 60-minute grace period, per-class daily locks,
 * and duplicate prevention.
 */

import { expandDays, timeToMinutes, minutesToTime } from './scheduleUtils.js';
import { mockAttendanceRecords } from '../mock/attendance.js';
import { mockClasses } from '../mock/classes.js';

/**
 * Official Cambodia Timezone Identifier
 */
export const CAMBODIA_TIMEZONE = 'Asia/Phnom_Penh';

/**
 * Central Attendance Policy Configuration
 * - earlyOpenMinutes: 0 (Attendance opens strictly at class start time)
 * - gracePeriodMinutes: 60 (Attendance closes 60 minutes after class end time)
 * - allowEditExisting: true (Authorized updating of existing records without duplication)
 */
export const ATTENDANCE_POLICY = {
  timeZone: CAMBODIA_TIMEZONE,
  earlyOpenMinutes: 0,
  gracePeriodMinutes: 60,
  allowEditExisting: true
};

/**
 * Gets the current or specified date/time strictly in Cambodia (Asia/Phnom_Penh).
 * Never relies on raw browser UTC or local offset.
 *
 * @param {string|Date|null} dateInput
 * @returns {object} Cambodia date & time details
 */
export const getCambodiaTime = (dateInput = null) => {
  // If dateInput is a plain date string "YYYY-MM-DD"
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    // Parse as noon UTC to safely extract Cambodia date and weekday without boundary slippage
    const middayUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: CAMBODIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    });
    const parts = formatter.formatToParts(middayUtc);
    const map = {};
    parts.forEach((p) => { map[p.type] = p.value; });

    return {
      year: map.year,
      month: map.month,
      day: map.day,
      hour: 12,
      minute: 0,
      second: 0,
      weekday: map.weekday,
      dateString: `${map.year}-${map.month}-${map.day}`,
      timeString: '12:00',
      totalMinutes: 720,
      timeZone: CAMBODIA_TIMEZONE
    };
  }

  const d = dateInput
    ? (dateInput instanceof Date ? dateInput : new Date(dateInput))
    : new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMBODIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long'
  });

  const parts = formatter.formatToParts(d);
  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });

  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);
  const weekday = map.weekday;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday,
    dateString: `${year}-${month}-${day}`,
    timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    totalMinutes: hour * 60 + minute,
    timeZone: CAMBODIA_TIMEZONE
  };
};

/**
 * Extracts class schedule and calculates the Cambodia attendance window
 *
 * @param {object} cls Class object
 * @param {string|Date|null} dateInput Target date
 * @returns {object} Normalized schedule & window metadata
 */
export const extractClassSchedule = (cls, dateInput = null) => {
  if (!cls) return null;

  const cambodiaNow = getCambodiaTime(dateInput);

  // Extract and expand teaching days
  const rawDays = cls.days || cls.schedule || '';
  const scheduledDays = expandDays(rawDays);
  const isScheduledDay = scheduledDays.includes(cambodiaNow.weekday);

  // Extract start and end times
  let startStr = cls.startTime || cls.start_time;
  let endStr = cls.endTime || cls.end_time;

  if (!startStr || !endStr) {
    const timeSource = cls.time || cls.schedule || '';
    const match = timeSource.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\s*[-–—to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    if (match) {
      startStr = match[1].trim();
      endStr = match[2].trim();
    }
  }

  // Safe defaults
  startStr = startStr || '08:00 AM';
  endStr = endStr || '09:30 AM';

  const startMinutes = timeToMinutes(startStr) ?? 480;
  const endMinutes = timeToMinutes(endStr) ?? 570;

  // Window calculation with central policy
  const windowStartMinutes = Math.max(0, startMinutes - ATTENDANCE_POLICY.earlyOpenMinutes);
  const windowEndMinutes = Math.min(1439, endMinutes + ATTENDANCE_POLICY.gracePeriodMinutes);

  return {
    classId: cls.id,
    className: cls.name,
    code: cls.code,
    teacher: cls.teacher,
    teacherId: cls.teacherId,
    location: cls.studentLocation || cls.room || 'ECC Centre',
    date: cambodiaNow.dateString,
    weekday: cambodiaNow.weekday,
    scheduledDays,
    isScheduledDay,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
    startMinutes,
    endMinutes,
    windowStartMinutes,
    windowEndMinutes,
    windowStartStr: minutesToTime(windowStartMinutes),
    windowEndStr: minutesToTime(windowEndMinutes),
    days: cls.days || cls.schedule
  };
};

/**
 * Generates unique attendance key based on classId and date
 */
export const getUniqueAttendanceKey = (classId, date) => {
  return `${classId}_${date}`;
};

/**
 * Checks whether an attendance record exists for the given class and date
 */
export const hasAttendanceRecord = (classId, date, attendanceRecords = null) => {
  const records = attendanceRecords || mockAttendanceRecords;
  return records.some((a) => a.classId === classId && a.date === date);
};

/**
 * Retrieves the grouped attendance session for a class on a date
 */
export const getExistingAttendanceRecord = (classId, date, attendanceRecords = null) => {
  const records = attendanceRecords || mockAttendanceRecords;
  const matches = records.filter((a) => a.classId === classId && a.date === date);
  if (matches.length === 0) return null;

  const first = matches[0];
  return {
    id: first.sessionId || `SESS-${classId}-${date}`,
    classId,
    date,
    teacherId: first.teacherId || '',
    teacherName: first.recordedBy || first.teacherName || 'Teacher',
    recordedBy: first.recordedBy || 'Teacher',
    recordedAt: first.recordedAt || first.updatedAt || `${date} 08:00:00`,
    updatedAt: first.updatedAt || first.recordedAt || `${date} 08:00:00`,
    status: 'Completed',
    studentRecords: matches.map((r) => ({
      studentId: r.studentId,
      status: r.status || 'Present',
      remarks: r.remarks || ''
    }))
  };
};

/**
 * Evaluates the attendance state for a class based on schedule, Cambodia time, and existing records.
 * 
 * Returns one of 5 distinct states:
 * - AVAILABLE: Class scheduled today, within window, no record yet -> Track Attendance
 * - NOT_STARTED: Class scheduled today, before start time -> Not Started
 * - ATTENDANCE_RECORDED: Already saved for today -> Attendance Recorded (Locked)
 * - EXPIRED: Window has closed (grace period expired) -> Attendance Closed
 * - NO_CLASS_TODAY: Not a scheduled teaching day -> No Class Today
 * - FUTURE_DATE: Future calendar date -> Future Date
 * 
 * @param {object} cls
 * @param {string|null} dateInput Optional date override
 * @param {string|number|null} timeInput Optional time override
 * @param {Array|null} attendanceRecords Optional state records
 * @returns {object} Status evaluation result
 */
export const evaluateAttendanceStatus = (cls, dateInput = null, timeInput = null, attendanceRecords = null, nowOverride = null) => {
  if (!cls) {
    return {
      classId: '',
      date: '',
      status: 'INVALID_CLASS',
      canTrack: false,
      canEdit: false,
      isLocked: true,
      hasExistingRecord: false,
      existingRecord: null,
      label: 'Invalid Class',
      subtext: 'Class not found',
      message: 'Class not found',
      schedule: null
    };
  }

  const cambodiaNow = nowOverride ? getCambodiaTime(nowOverride) : getCambodiaTime();
  const targetCambodia = dateInput ? getCambodiaTime(dateInput) : cambodiaNow;
  const targetDateStr = targetCambodia.dateString;
  const schedule = extractClassSchedule(cls, targetDateStr);

  const isToday = (targetDateStr === cambodiaNow.dateString);
  const isFuture = (targetDateStr > cambodiaNow.dateString);
  const isPast = (targetDateStr < cambodiaNow.dateString);

  // Check if attendance record already exists for this (classId, date)
  const existingRecord = getExistingAttendanceRecord(cls.id, targetDateStr, attendanceRecords);
  const hasExisting = Boolean(existingRecord);

  // State C: Attendance Recorded
  if (hasExisting) {
    return {
      classId: cls.id,
      date: targetDateStr,
      status: 'ATTENDANCE_RECORDED',
      canTrack: false, // Locked from creating new records
      canEdit: ATTENDANCE_POLICY.allowEditExisting, // Allowed to view/edit existing record
      isLocked: true,
      hasExistingRecord: true,
      existingRecord,
      label: 'Attendance Recorded',
      subtext: isToday ? 'Recorded today' : `Recorded on ${targetDateStr}`,
      message: `Attendance was recorded by ${existingRecord.recordedBy} on ${targetDateStr}.`,
      recordedBy: existingRecord.recordedBy,
      recordedAt: existingRecord.updatedAt || existingRecord.recordedAt,
      schedule
    };
  }

  // Future Date Check
  if (isFuture) {
    return {
      classId: cls.id,
      date: targetDateStr,
      status: 'FUTURE_DATE',
      canTrack: false,
      canEdit: false,
      isLocked: true,
      hasExistingRecord: false,
      existingRecord: null,
      label: 'Future Date',
      subtext: 'Not available yet',
      message: 'Attendance tracking is not permitted for future dates.',
      schedule
    };
  }

  // State E: No Class Today
  if (!schedule.isScheduledDay) {
    return {
      classId: cls.id,
      date: targetDateStr,
      status: 'NO_CLASS_TODAY',
      canTrack: false,
      canEdit: false,
      isLocked: true,
      hasExistingRecord: false,
      existingRecord: null,
      label: 'No Class Today',
      subtext: schedule.days ? `${schedule.days}` : 'No class scheduled',
      message: `No class session scheduled for ${cls.name} on ${schedule.weekday}.`,
      schedule
    };
  }

  // Past date with NO record is expired
  if (isPast) {
    return {
      classId: cls.id,
      date: targetDateStr,
      status: 'EXPIRED',
      canTrack: false,
      canEdit: false,
      isLocked: true,
      hasExistingRecord: false,
      existingRecord: null,
      label: 'Attendance Closed',
      subtext: 'Past date expired',
      message: 'The attendance window for this past date has expired.',
      schedule
    };
  }

  // Evaluated for TODAY: Compare current Cambodia time with window
  const currentMinutes = timeInput !== null
    ? (typeof timeInput === 'number' ? timeInput : timeToMinutes(timeInput))
    : cambodiaNow.totalMinutes;

  // State B: Not Started (Before class starts)
  if (currentMinutes < schedule.windowStartMinutes) {
    return {
      classId: cls.id,
      date: targetDateStr,
      status: 'NOT_STARTED',
      canTrack: false,
      canEdit: false,
      isLocked: true,
      hasExistingRecord: false,
      existingRecord: null,
      label: 'Not Started',
      subtext: `Available at ${schedule.startTime}`,
      message: `Class starts at ${schedule.startTime}. Attendance opens at ${schedule.windowStartStr}.`,
      schedule
    };
  }

  // State A: Available (During class + 60 min grace period)
  if (currentMinutes >= schedule.windowStartMinutes && currentMinutes <= schedule.windowEndMinutes) {
    return {
      classId: cls.id,
      date: targetDateStr,
      status: 'AVAILABLE',
      canTrack: true,
      canEdit: false,
      isLocked: false,
      hasExistingRecord: false,
      existingRecord: null,
      label: 'Track Attendance',
      subtext: `Window open until ${schedule.windowEndStr}`,
      message: `Attendance tracking is currently open (closes at ${schedule.windowEndStr}).`,
      schedule
    };
  }

  // State D: Expired (After grace period ends)
  return {
    classId: cls.id,
    date: targetDateStr,
    status: 'EXPIRED',
    canTrack: false,
    canEdit: false,
    isLocked: true,
    hasExistingRecord: false,
    existingRecord: null,
    label: 'Attendance Closed',
    subtext: `Closed at ${schedule.windowEndStr}`,
    message: `Attendance window closed at ${schedule.windowEndStr} (60 min grace period ended).`,
    schedule
  };
};
