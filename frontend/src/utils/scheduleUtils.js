/**
 * EduManage ECC — Teaching Schedule & Availability Utilities
 * Handles day expansion, time-to-minutes arithmetic, conflict detection, and calendar formatting.
 */

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const SCHEDULE_DAYS_PRESETS = [
  'Monday – Friday',
  'Monday, Wednesday, Friday',
  'Tuesday, Thursday, Saturday',
  'Saturday & Sunday',
  'Monday – Saturday'
];

/**
 * Expands a day range or list into an array of individual day names.
 * e.g. "Monday – Friday" -> ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
 */
export const expandDays = (daysStr = '') => {
  if (!daysStr) return [];
  const str = String(daysStr).toLowerCase().trim();

  if (str.includes('mon') && str.includes('fri') && (str.includes('–') || str.includes('-'))) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }
  if (str.includes('mon') && str.includes('sat') && (str.includes('–') || str.includes('-'))) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }
  if (str.includes('sat') && str.includes('sun')) {
    return ['Saturday', 'Sunday'];
  }

  const matched = [];
  WEEKDAYS.forEach((d) => {
    const short = d.slice(0, 3).toLowerCase();
    if (str.includes(d.toLowerCase()) || str.includes(short)) {
      matched.push(d);
    }
  });

  return matched.length > 0 ? Array.from(new Set(matched)) : [];
};

/**
 * Validates whether a class qualifies as an active scheduled session inside a teaching period.
 * 
 * Strict Period Rules:
 * 1. The class must have an actual, valid assigned teacher (not empty, not unassigned).
 * 2. The class status must be 'Active'.
 * 3. The class or its active schedule must be explicitly linked to the selected period.
 * 4. The schedule must be within its effective date range.
 * 5. The schedule must not be cancelled or inactive.
 * 
 * Never uses arbitrary time-overlap as a fallback.
 */
export const isClassActiveInPeriod = (cls, period, teacherSchedules = [], teachers = []) => {
  if (!cls || !period) return false;

  // Rule 1: Must have an actual, non-empty assigned teacher
  const teacherId = (cls.teacherId || cls.teacher_id || '').trim();
  if (!teacherId || teacherId === 'TCH-NONE' || teacherId.toLowerCase() === 'unassigned') {
    return false;
  }

  // Teacher must be an active teacher in faculty
  if (teachers && teachers.length > 0) {
    const teacherObj = teachers.find((t) => t.id === teacherId);
    if (!teacherObj || (teacherObj.status && teacherObj.status !== 'Active')) {
      return false;
    }
  }

  // Rule 2: Class status must be Active (not Archived, Completed, or Inactive)
  if (cls.status !== 'Active') {
    return false;
  }

  // Rule 3: Check explicit link to period (either on class or on schedule)
  const isClassLinked = (cls.periodId === period.id || cls.period_id === period.id);

  // Check matching schedules for this class
  const classSchedules = teacherSchedules.filter(
    (sch) => (sch.classId === cls.id || sch.class_id === cls.id)
  );

  const today = new Date().toISOString().split('T')[0];

  if (classSchedules.length > 0) {
    // If the class has schedules specifically for this period, at least one must be active and valid
    const periodSchedules = classSchedules.filter(
      (sch) => (sch.periodId === period.id || sch.period_id === period.id || isClassLinked)
    );

    if (periodSchedules.length > 0) {
      const hasValidSchedule = periodSchedules.some((sch) => {
        // Schedule status must not be Cancelled or Inactive
        if (sch.status === 'Cancelled' || sch.status === 'Inactive') return false;

        // Effective date range check
        if (sch.effectiveStartDate && sch.effectiveStartDate > today) return false;
        if (sch.effectiveEndDate && sch.effectiveEndDate < today) return false;

        // If schedule has a specific teacher assigned, it must match
        if (sch.teacherId && sch.teacherId !== teacherId) return false;

        return true;
      });

      return hasValidSchedule;
    }
  }

  // If no schedules exist in teacher_schedules yet, check if class itself is explicitly linked to period
  return isClassLinked;
};

/**
 * Calculates real period statistics from actual class and teacher assignments.
 */
export const getPeriodStats = (period, classes = [], teacherSchedules = [], teachers = [], periodTeachers = []) => {
  if (!period) {
    return {
      activeClasses: [],
      classesCount: 0,
      assignedTeachers: [],
      instructorsCount: 0,
      sessionsCount: 0,
      durationStr: ''
    };
  }

  // 1. Find all active classes that strictly qualify for this period
  const activeClasses = classes.filter((cls) =>
    isClassActiveInPeriod(cls, period, teacherSchedules, teachers)
  );

  // 2. Instructors: distinct active teachers assigned to this period
  // Either assigned via period_teachers OR actively teaching a class in this period
  const distinctTeacherIds = new Set();

  // From period_teachers table
  periodTeachers.forEach((pt) => {
    if (pt.periodId === period.id && pt.status === 'Active' && pt.teacherId) {
      distinctTeacherIds.add(pt.teacherId);
    }
  });

  // From active classes scheduled in this period
  activeClasses.forEach((cls) => {
    const tId = (cls.teacherId || cls.teacher_id || '').trim();
    if (tId) distinctTeacherIds.add(tId);
  });

  const assignedTeachers = Array.from(distinctTeacherIds)
    .map((tId) => teachers.find((t) => t.id === tId))
    .filter(Boolean);

  // 3. Count total active sessions across all weekdays
  let sessionsCount = 0;
  activeClasses.forEach((cls) => {
    const days = expandDays(cls.days);
    sessionsCount += days.length;
  });

  // Duration string
  const sMin = timeToMinutes(period.startTime);
  const eMin = timeToMinutes(period.endTime);
  let durationStr = '';
  if (sMin !== null && eMin !== null && eMin > sMin) {
    const dur = eMin - sMin;
    const h = Math.floor(dur / 60);
    const m = dur % 60;
    durationStr = `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`.trim();
  }

  return {
    activeClasses,
    classesCount: activeClasses.length,
    assignedTeachers,
    instructorsCount: assignedTeachers.length,
    sessionsCount,
    durationStr
  };
};

/**
 * Converts time strings like "08:00 AM", "8:00 AM", "14:30" to minutes from midnight (0 to 1440).
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const clean = String(timeStr).trim();

  // If already standard 24h format e.g. "14:30" or "08:00"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const min = parseInt(match24[2], 10);
    return hour * 60 + min;
  }

  const match = clean.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toLowerCase() : null;

  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;

  return hour * 60 + min;
};

/**
 * Converts any time representation ("08:00 AM", "2:30 PM", "8:00") into standard 24-hour "HH:mm" for native <input type="time" />.
 */
export const timeTo24H = (timeStr) => {
  if (!timeStr) return '';
  const clean = String(timeStr).trim();
  if (/^\d{2}:\d{2}$/.test(clean)) return clean;
  if (/^\d{1}:\d{2}$/.test(clean)) return `0${clean}`;

  const minutes = timeToMinutes(clean);
  if (minutes === null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Converts standard 24-hour "HH:mm" to 12-hour AM/PM presentation ("08:00 AM", "02:30 PM").
 */
export const timeTo12H = (timeStr) => {
  if (!timeStr) return '';
  const clean = String(timeStr).trim();
  if (/am|pm/i.test(clean)) return clean;
  const minutes = timeToMinutes(clean);
  if (minutes === null) return clean;
  return minutesToTime(minutes);
};

/**
 * Converts minutes from midnight (e.g. 480) back to 12-hour formatted time ("08:00 AM").
 */
export const minutesToTime = (minutes) => {
  if (minutes === null || minutes === undefined) return '';
  const total = Math.max(0, Math.min(1439, minutes));
  const hour24 = Math.floor(total / 60);
  const mins = total % 60;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
};

/**
 * Returns the Monday date of the week containing the given date.
 */
export const getMondayOfWeek = (inputDate) => {
  const d = new Date(inputDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns an array of 7 Date objects (Monday to Sunday) for the given Monday.
 */
export const getWeekDays = (mondayDate) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(mondayDate);
    next.setDate(mondayDate.getDate() + i);
    days.push(next);
  }
  return days;
};

/**
 * Formats a week range e.g. "Nov 2 – Nov 8, 2026"
 */
export const formatWeekRange = (mondayDate, lang = 'en') => {
  if (!mondayDate) return '';
  const sunday = new Date(mondayDate);
  sunday.setDate(mondayDate.getDate() + 6);

  const mYear = mondayDate.getFullYear();
  const sYear = sunday.getFullYear();

  const optionsShort = { month: 'short', day: 'numeric' };
  const mStr = mondayDate.toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', optionsShort);
  const sStr = sunday.toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', optionsShort);

  if (mYear === sYear) {
    return `${mStr} – ${sStr}, ${mYear}`;
  }
  return `${mStr}, ${mYear} – ${sStr}, ${sYear}`;
};

/**
 * Standard hourly timetable slots from 07:00 AM to 06:00 PM.
 */
export const TIMETABLE_HOURS = [
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM'
];

/**
 * Checks two time ranges for overlap: [startA, endA] and [startB, endB].
 * Strict inequality: existingStart < newEnd AND existingEnd > newStart
 * Consecutive sessions (e.g. 1:30-3:00 and 3:00-4:30) do NOT overlap.
 */
export const doTimeRangesOverlap = (startA, endA, startB, endB) => {
  if (startA === null || endA === null || startB === null || endB === null) return false;
  return startA < endB && endA > startB;
};

/**
 * Checks two date ranges for overlap: [startA, endA] and [startB, endB].
 * Null/empty end date is treated as open-ended (indefinite / far future).
 */
export const doDateRangesOverlap = (startA, endA, startB, endB) => {
  const sA = startA ? String(startA).slice(0, 10) : '1970-01-01';
  const eA = endA ? String(endA).slice(0, 10) : '9999-12-31';
  const sB = startB ? String(startB).slice(0, 10) : '1970-01-01';
  const eB = endB ? String(endB).slice(0, 10) : '9999-12-31';

  return sA <= eB && eA >= sB;
};

/**
 * Calculate weekly teaching hours from a list of class cohorts or schedules.
 */
export const calculateTeacherWeeklyHours = (teacherId, classes = []) => {
  if (!teacherId || !Array.isArray(classes)) return 0;
  let totalMinutes = 0;

  classes.forEach((cls) => {
    if (cls.teacherId !== teacherId && cls.teacher !== teacherId) return;
    if (cls.status !== 'Active') return;

    const days = expandDays(cls.days);
    const times = (cls.time || '').split(/[-–]/).map((t) => t.trim());
    const sMin = timeToMinutes(times[0]);
    const eMin = timeToMinutes(times[1]);

    if (sMin !== null && eMin !== null && eMin > sMin) {
      const durationPerSession = eMin - sMin;
      totalMinutes += durationPerSession * days.length;
    }
  });

  return (totalMinutes / 60).toFixed(1);
};

/**
 * Core Schedule & Availability Conflict Detector
 * Compares: Teacher ID, Class ID, Teaching days, Start time, End time,
 * Effective start date, Effective end date, and Schedule status.
 *
 * Rules:
 * 1. Different teachers teaching different classes simultaneously -> NO CONFLICT.
 * 2. Same teacher assigned to two classes at overlapping times -> CONFLICT (Teacher Double-Booking).
 * 3. Same class has two overlapping sessions or duplicate schedule -> CONFLICT (Class Double-Booking).
 * 4. Consecutive sessions (e.g. 1:30-3:00 and 3:00-4:30) -> NO CONFLICT (Strict inequality).
 * 5. Session falls outside teacher's configured availability on that day -> CONFLICT.
 * 6. Session overlaps with teacher's configured break time -> CONFLICT.
 * 7. Teacher is explicitly marked Unavailable on that day -> CONFLICT.
 * 8. If teacher has no availability record configured on that day -> NO CONFLICT (unrestricted).
 */
export const detectScheduleConflict = ({
  teacherId,
  classId = null,
  days = 'Monday – Friday',
  startTime = '08:00 AM',
  endTime = '09:30 AM',
  effectiveStartDate = null,
  effectiveEndDate = null,
  status = 'Scheduled',
  excludeClassId = null,
  excludeScheduleId = null,
  teacherAvailability = [],
  teacherSchedules = [],
  classes = [],
  teachers = []
}) => {
  // If the schedule itself is cancelled or inactive, do not report conflicts
  if (status === 'Cancelled' || status === 'Inactive' || status === 'Archived') {
    return { hasConflict: false, conflicts: [] };
  }

  const conflicts = [];
  const targetDays = expandDays(days);
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // 1. Validate Time Bounds
  if (startMin === null || endMin === null || startMin >= endMin) {
    return {
      hasConflict: true,
      conflicts: [
        {
          type: 'invalid_time',
          conflictTypeLabel: 'Invalid Time Range',
          conflictingTeacher: null,
          conflictingClass: null,
          conflictingDay: days,
          existingTime: null,
          requestedTime: `${startTime} – ${endTime}`,
          message: 'End time must be strictly later than start time.'
        }
      ]
    };
  }

  // Teacher name lookup
  const currentTeacher = teachers.find((t) => t.id === teacherId);
  const teacherName = currentTeacher?.name || teacherId || 'Teacher';

  // Current class lookup
  const currentClass = classes.find((c) => c.id === classId);
  const currentClassName = currentClass?.name || classId || 'Class';

  // 2. Teacher Availability Rules
  const teacherAvail = teacherAvailability.filter((a) => a.teacherId === teacherId);
  const availByDay = {};
  teacherAvail.forEach((a) => {
    if (!availByDay[a.dayOfWeek]) availByDay[a.dayOfWeek] = [];
    availByDay[a.dayOfWeek].push(a);
  });

  targetDays.forEach((day) => {
    const daySlots = availByDay[day];

    // If teacher has NO configured availability on this day, they are unrestricted (NOT a conflict)
    if (!daySlots || daySlots.length === 0) {
      return;
    }

    let covered = false;

    daySlots.forEach((slot) => {
      // Teacher explicitly marked Unavailable
      if (slot.status === 'Unavailable') {
        conflicts.push({
          type: 'teacher_unavailable',
          conflictTypeLabel: 'Teacher Unavailable',
          conflictingTeacher: teacherName,
          conflictingClass: null,
          conflictingDay: day,
          existingTime: slot.notes || 'Unavailable All Day',
          requestedTime: `${startTime} – ${endTime}`,
          message: `Teacher ${teacherName} is marked as Unavailable on ${day}.`
        });
        covered = true;
        return;
      }

      const slotStart = timeToMinutes(slot.availableFrom);
      const slotEnd = timeToMinutes(slot.availableUntil);

      if (slotStart !== null && slotEnd !== null) {
        if (startMin >= slotStart && endMin <= slotEnd) {
          // Inside available window! Now check break overlap
          const breakStart = timeToMinutes(slot.breakStart);
          const breakEnd = timeToMinutes(slot.breakEnd);
          if (breakStart !== null && breakEnd !== null) {
            if (doTimeRangesOverlap(startMin, endMin, breakStart, breakEnd)) {
              conflicts.push({
                type: 'break_overlap',
                conflictTypeLabel: 'Break Time Overlap',
                conflictingTeacher: teacherName,
                conflictingClass: null,
                conflictingDay: day,
                existingTime: `${slot.breakStart} – ${slot.breakEnd}`,
                requestedTime: `${startTime} – ${endTime}`,
                message: `Class time (${startTime} – ${endTime}) overlaps with teacher ${teacherName}'s break (${slot.breakStart} – ${slot.breakEnd}) on ${day}.`
              });
            }
          }
          covered = true;
        }
      }
    });

    if (!covered && daySlots.length > 0) {
      const firstSlot = daySlots[0];
      conflicts.push({
        type: 'outside_availability',
        conflictTypeLabel: 'Outside Teacher Availability',
        conflictingTeacher: teacherName,
        conflictingClass: null,
        conflictingDay: day,
        existingTime: `${firstSlot.availableFrom} – ${firstSlot.availableUntil}`,
        requestedTime: `${startTime} – ${endTime}`,
        message: `Class time (${startTime} – ${endTime}) falls outside ${teacherName}'s available hours on ${day} (${firstSlot.availableFrom} – ${firstSlot.availableUntil}).`
      });
    }
  });

  // Collect all existing active assignments to compare against
  // Merge teacherSchedules and classes, ensuring no double counting
  const scheduleCandidates = [];
  const registeredKeys = new Set();

  teacherSchedules.forEach((sch) => {
    if (sch.status === 'Cancelled' || sch.status === 'Inactive') return;
    if (excludeScheduleId && sch.id === excludeScheduleId) return;

    registeredKeys.add(`${sch.classId}_${sch.teacherId}`);
    scheduleCandidates.push({
      id: sch.id,
      scheduleId: sch.id,
      classId: sch.classId,
      className: sch.className,
      teacherId: sch.teacherId,
      teacherName: sch.teacherName,
      days: sch.days,
      startTime: sch.startTime,
      endTime: sch.endTime,
      effectiveStartDate: sch.effectiveStartDate,
      effectiveEndDate: sch.effectiveEndDate,
      status: sch.status
    });
  });

  classes.forEach((cls) => {
    if (cls.status !== 'Active') return;
    const tchId = cls.teacherId || cls.teacher;
    if (!tchId) return;
    const key = `${cls.id}_${tchId}`;
    if (registeredKeys.has(key)) return; // already included from teacherSchedules

    const times = (cls.time || '').split(/[-–]/).map((t) => t.trim());
    if (times[0] && times[1]) {
      scheduleCandidates.push({
        id: `cls-${cls.id}`,
        scheduleId: null,
        classId: cls.id,
        className: cls.name,
        teacherId: tchId,
        teacherName: cls.teacher,
        days: cls.days,
        startTime: times[0],
        endTime: times[1],
        effectiveStartDate: null,
        effectiveEndDate: null,
        status: cls.status
      });
    }
  });

  // 3. Teacher Conflict Rules (Same Teacher, Different Classes at Overlapping Times)
  // NOTE: Different teachers teaching different classes simultaneously MUST NOT be marked as conflicts.
  scheduleCandidates.forEach((cand) => {
    // Only check if SAME teacher
    const isSameTeacher = cand.teacherId === teacherId;
    if (!isSameTeacher) return;

    // Must be a different class/schedule
    if (cand.scheduleId && excludeScheduleId && cand.scheduleId === excludeScheduleId) return;
    if (cand.classId && excludeClassId && cand.classId === excludeClassId) return;
    if (classId && cand.classId === classId) return; // handled by class double-booking

    // Date range overlap check
    if (!doDateRangesOverlap(effectiveStartDate, effectiveEndDate, cand.effectiveStartDate, cand.effectiveEndDate)) {
      return;
    }

    // Days overlap check
    const candDays = expandDays(cand.days);
    const commonDays = targetDays.filter((d) => candDays.includes(d));
    if (commonDays.length === 0) return;

    // Time overlap check: existingStart < newEnd AND existingEnd > newStart
    const candStart = timeToMinutes(cand.startTime);
    const candEnd = timeToMinutes(cand.endTime);

    if (candStart !== null && candEnd !== null) {
      if (doTimeRangesOverlap(startMin, endMin, candStart, candEnd)) {
        const daysList = commonDays.join(', ');
        conflicts.push({
          type: 'teacher_double_booking',
          conflictTypeLabel: 'Teacher Double-Booking',
          conflictingTeacher: cand.teacherName || teacherName,
          conflictingTeacherId: cand.teacherId,
          conflictingClass: cand.className,
          conflictingClassId: cand.classId,
          conflictingDay: daysList,
          existingTime: `${cand.startTime} – ${cand.endTime}`,
          requestedTime: `${startTime} – ${endTime}`,
          message: `Teacher ${teacherName} is already assigned to '${cand.className}' on ${daysList} (${cand.startTime} – ${cand.endTime}).`
        });
      }
    }
  });

  // 4. Class Conflict Rules (Same Class, Overlapping Teaching Sessions / Duplicate Schedule)
  // NOTE: Different classes can operate simultaneously.
  if (classId) {
    scheduleCandidates.forEach((cand) => {
      // Only check if SAME class
      if (cand.classId !== classId) return;
      if (cand.scheduleId && excludeScheduleId && cand.scheduleId === excludeScheduleId) return;

      // Date range overlap check
      if (!doDateRangesOverlap(effectiveStartDate, effectiveEndDate, cand.effectiveStartDate, cand.effectiveEndDate)) {
        return;
      }

      // Days overlap check
      const candDays = expandDays(cand.days);
      const commonDays = targetDays.filter((d) => candDays.includes(d));
      if (commonDays.length === 0) return;

      // Time overlap check
      const candStart = timeToMinutes(cand.startTime);
      const candEnd = timeToMinutes(cand.endTime);

      if (candStart !== null && candEnd !== null) {
        if (doTimeRangesOverlap(startMin, endMin, candStart, candEnd) || (startMin === candStart && endMin === candEnd)) {
          const daysList = commonDays.join(', ');
          conflicts.push({
            type: 'class_double_booking',
            conflictTypeLabel: 'Class Double-Booking',
            conflictingTeacher: cand.teacherName,
            conflictingTeacherId: cand.teacherId,
            conflictingClass: currentClassName,
            conflictingClassId: classId,
            conflictingDay: daysList,
            existingTime: `${cand.startTime} – ${cand.endTime}`,
            requestedTime: `${startTime} – ${endTime}`,
            message: `Class '${currentClassName}' already has a session scheduled on ${daysList} (${cand.startTime} – ${cand.endTime}).`
          });
        }
      }
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
};

/**
 * System-Wide Conflict Evaluator
 * Cross-evaluates all active classes and schedules across the entire system.
 * Only genuine conflicts are identified and de-duplicated.
 * Different teachers teaching simultaneously are completely ignored.
 */
export const findScheduleConflicts = ({
  classes = [],
  teacherSchedules = [],
  teacherAvailability = [],
  teachers = []
}) => {
  const list = [];
  const seenPairKeys = new Set();

  // Normalize all active schedule items
  const items = [];
  const registeredClassKeys = new Set();

  teacherSchedules.forEach((sch) => {
    if (sch.status === 'Cancelled' || sch.status === 'Inactive') return;
    registeredClassKeys.add(`${sch.classId}_${sch.teacherId}`);
    items.push({
      source: 'schedule',
      id: sch.id,
      scheduleId: sch.id,
      classId: sch.classId,
      className: sch.className,
      teacherId: sch.teacherId,
      teacherName: sch.teacherName,
      days: sch.days,
      startTime: sch.startTime,
      endTime: sch.endTime,
      effectiveStartDate: sch.effectiveStartDate,
      effectiveEndDate: sch.effectiveEndDate,
      status: sch.status
    });
  });

  classes.forEach((cls) => {
    if (cls.status !== 'Active') return;
    const tch = teachers.find((t) => t.id === cls.teacherId || t.name === cls.teacher);
    const tchId = tch?.id || cls.teacherId || cls.teacher;
    if (!tchId) return;

    const key = `${cls.id}_${tchId}`;
    if (registeredClassKeys.has(key)) return;

    const times = (cls.time || '').split(/[-–]/).map((t) => t.trim());
    if (times[0] && times[1]) {
      items.push({
        source: 'class',
        id: cls.id,
        scheduleId: null,
        classId: cls.id,
        className: cls.name,
        teacherId: tchId,
        teacherName: tch?.name || cls.teacher,
        days: cls.days,
        startTime: times[0],
        endTime: times[1],
        effectiveStartDate: null,
        effectiveEndDate: null,
        status: cls.status
      });
    }
  });

  // 1. Cross-compare item pairs (Teacher double-booking & Class double-booking)
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // RULE: Different teachers teaching different classes simultaneously MUST NOT be marked as conflicts
      const sameTeacher = a.teacherId === b.teacherId;
      const sameClass = a.classId === b.classId;

      if (!sameTeacher && !sameClass) {
        continue;
      }

      // Check date range overlap
      if (!doDateRangesOverlap(a.effectiveStartDate, a.effectiveEndDate, b.effectiveStartDate, b.effectiveEndDate)) {
        continue;
      }

      // Check days overlap
      const daysA = expandDays(a.days);
      const daysB = expandDays(b.days);
      const commonDays = daysA.filter((d) => daysB.includes(d));
      if (commonDays.length === 0) continue;

      // Check time overlap: existingStart < newEnd AND existingEnd > newStart
      const sA = timeToMinutes(a.startTime);
      const eA = timeToMinutes(a.endTime);
      const sB = timeToMinutes(b.startTime);
      const eB = timeToMinutes(b.endTime);

      if (sA !== null && eA !== null && sB !== null && eB !== null) {
        if (doTimeRangesOverlap(sA, eA, sB, eB)) {
          const pairKey = [a.id, b.id].sort().join(':::');
          if (seenPairKeys.has(pairKey)) continue;
          seenPairKeys.add(pairKey);

          const daysList = commonDays.join(', ');

          if (sameTeacher) {
            list.push({
              id: `CONF-TCH-${pairKey}`,
              classId: a.classId,
              className: a.className,
              teacherId: a.teacherId,
              teacherName: a.teacherName,
              conflictingClassId: b.classId,
              conflictingClassName: b.className,
              conflictingTeacherId: b.teacherId,
              conflictingTeacherName: b.teacherName,
              conflictType: 'teacher_double_booking',
              conflictTypeLabel: 'Teacher Double-Booking',
              conflictingDay: daysList,
              existingTime: `${b.startTime} – ${b.endTime}`,
              requestedTime: `${a.startTime} – ${a.endTime}`,
              message: `Teacher ${a.teacherName} is double-booked: '${a.className}' (${a.startTime} – ${a.endTime}) overlaps with '${b.className}' (${b.startTime} – ${b.endTime}) on ${daysList}.`
            });
          } else if (sameClass) {
            list.push({
              id: `CONF-CLS-${pairKey}`,
              classId: a.classId,
              className: a.className,
              teacherId: a.teacherId,
              teacherName: a.teacherName,
              conflictingClassId: b.classId,
              conflictingClassName: b.className,
              conflictingTeacherId: b.teacherId,
              conflictingTeacherName: b.teacherName,
              conflictType: 'class_double_booking',
              conflictTypeLabel: 'Class Double-Booking',
              conflictingDay: daysList,
              existingTime: `${b.startTime} – ${b.endTime}`,
              requestedTime: `${a.startTime} – ${a.endTime}`,
              message: `Class '${a.className}' has overlapping schedule sessions on ${daysList} (${a.startTime} – ${a.endTime} vs ${b.startTime} – ${b.endTime}).`
            });
          }
        }
      }
    }
  }

  // 2. Check each item against teacher availability restrictions
  items.forEach((item) => {
    const tAvail = teacherAvailability.filter((a) => a.teacherId === item.teacherId);
    if (tAvail.length === 0) return;

    const availByDay = {};
    tAvail.forEach((a) => {
      if (!availByDay[a.dayOfWeek]) availByDay[a.dayOfWeek] = [];
      availByDay[a.dayOfWeek].push(a);
    });

    const itemDays = expandDays(item.days);
    const sMin = timeToMinutes(item.startTime);
    const eMin = timeToMinutes(item.endTime);
    if (sMin === null || eMin === null) return;

    itemDays.forEach((day) => {
      const daySlots = availByDay[day];
      // Unconfigured days are unrestricted
      if (!daySlots || daySlots.length === 0) return;

      daySlots.forEach((slot) => {
        if (slot.status === 'Unavailable') {
          const key = `CONF-UNAVAIL-${item.id}-${day}`;
          if (!seenPairKeys.has(key)) {
            seenPairKeys.add(key);
            list.push({
              id: key,
              classId: item.classId,
              className: item.className,
              teacherId: item.teacherId,
              teacherName: item.teacherName,
              conflictingClassId: null,
              conflictingClassName: null,
              conflictingTeacherId: item.teacherId,
              conflictingTeacherName: item.teacherName,
              conflictType: 'teacher_unavailable',
              conflictTypeLabel: 'Teacher Unavailable',
              conflictingDay: day,
              existingTime: slot.notes || 'Unavailable All Day',
              requestedTime: `${item.startTime} – ${item.endTime}`,
              message: `Teacher ${item.teacherName} is marked Unavailable on ${day}. Session '${item.className}' falls on this day.`
            });
          }
          return;
        }

        const slotStart = timeToMinutes(slot.availableFrom);
        const slotEnd = timeToMinutes(slot.availableUntil);

        if (slotStart !== null && slotEnd !== null) {
          if (sMin < slotStart || eMin > slotEnd) {
            const key = `CONF-OUTSIDE-${item.id}-${day}`;
            if (!seenPairKeys.has(key)) {
              seenPairKeys.add(key);
              list.push({
                id: key,
                classId: item.classId,
                className: item.className,
                teacherId: item.teacherId,
                teacherName: item.teacherName,
                conflictingClassId: null,
                conflictingClassName: null,
                conflictingTeacherId: item.teacherId,
                conflictingTeacherName: item.teacherName,
                conflictType: 'outside_availability',
                conflictTypeLabel: 'Outside Teacher Availability',
                conflictingDay: day,
                existingTime: `${slot.availableFrom} – ${slot.availableUntil}`,
                requestedTime: `${item.startTime} – ${item.endTime}`,
                message: `'${item.className}' (${item.startTime} – ${item.endTime}) falls outside teacher ${item.teacherName}'s available hours on ${day} (${slot.availableFrom} – ${slot.availableUntil}).`
              });
            }
          } else {
            // Check break overlap
            const bStart = timeToMinutes(slot.breakStart);
            const bEnd = timeToMinutes(slot.breakEnd);
            if (bStart !== null && bEnd !== null && doTimeRangesOverlap(sMin, eMin, bStart, bEnd)) {
              const key = `CONF-BREAK-${item.id}-${day}`;
              if (!seenPairKeys.has(key)) {
                seenPairKeys.add(key);
                list.push({
                  id: key,
                  classId: item.classId,
                  className: item.className,
                  teacherId: item.teacherId,
                  teacherName: item.teacherName,
                  conflictingClassId: null,
                  conflictingClassName: null,
                  conflictingTeacherId: item.teacherId,
                  conflictingTeacherName: item.teacherName,
                  conflictType: 'break_overlap',
                  conflictTypeLabel: 'Break Time Overlap',
                  conflictingDay: day,
                  existingTime: `${slot.breakStart} – ${slot.breakEnd}`,
                  requestedTime: `${item.startTime} – ${item.endTime}`,
                  message: `'${item.className}' (${item.startTime} – ${item.endTime}) overlaps with teacher ${item.teacherName}'s break (${slot.breakStart} – ${slot.breakEnd}) on ${day}.`
                });
              }
            }
          }
        }
      });
    });
  });

  return list;
};

