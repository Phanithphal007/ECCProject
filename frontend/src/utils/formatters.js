// Utility formatters for Khmer and English localization

export const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export const toKhmerDigits = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (digit) => KHMER_DIGITS[parseInt(digit, 10)]);
};

export const formatGrade = (gradeStr, lang) => {
  if (!gradeStr) return '';
  const match = String(gradeStr).match(/\d+/);
  if (!match) return gradeStr;
  const gradeNum = parseInt(match[0], 10);
  if (lang === 'km') {
    return `ថ្នាក់ទី ${toKhmerDigits(gradeNum)}`;
  }
  return `Grade ${gradeNum}`;
};

export const formatStudentName = (student, lang) => {
  if (!student) return '';
  if (lang === 'km') {
    return student.khmerName || student.name;
  }
  return student.name;
};

export const formatAttendanceRate = (rate, lang) => {
  if (rate === null || rate === undefined) return '0%';
  if (lang === 'km') {
    return `${toKhmerDigits(rate)}%`;
  }
  return `${rate}%`;
};

/**
 * Check whether an English subject is eligible for a specific grade (e.g. 'Grade 1').
 * A subject may be eligible for multiple grades (e.g. 'Grade 1 - 2' or 'Grade 3 - 12').
 */
export const isSubjectEligibleForGrade = (subject, targetGrade) => {
  if (!targetGrade || targetGrade === 'All') return true;
  if (!subject) return false;

  const matchTarget = String(targetGrade).match(/\d+/);
  if (!matchTarget) return true;
  const targetNum = parseInt(matchTarget[0], 10);

  // If subject has grades property as an array
  if (Array.isArray(subject.grades)) {
    return subject.grades.some((g) => {
      const m = String(g).match(/\d+/);
      return m && parseInt(m[0], 10) === targetNum;
    });
  }

  // If subject has string like 'Grade 1 - 2', 'Grade 3 - 12', 'Grade 1 - 12'
  const gradeStr = subject.grades || subject.gradeEligibility || '';
  if (!gradeStr) return true;

  // Split by comma if multiple ranges exist (e.g. 'Grade 1 - 2, Grade 4')
  const segments = String(gradeStr).split(',');
  for (const seg of segments) {
    const rangeMatch = seg.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1], 10);
      const max = parseInt(rangeMatch[2], 10);
      if (targetNum >= min && targetNum <= max) {
        return true;
      }
    } else {
      const singleMatch = seg.match(/\d+/);
      if (singleMatch && parseInt(singleMatch[0], 10) === targetNum) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Format grade ranges into pure localized string (e.g. 'Grade 1 - 2' -> 'ថ្នាក់ទី ១ - ២' in Khmer).
 */
export const formatGradeRange = (rangeStr, lang) => {
  if (!rangeStr) return '';
  if (lang === 'km') {
    return String(rangeStr)
      .replace(/Grade\s*(\d+)/g, (_, d) => `ថ្នាក់ទី ${toKhmerDigits(d)}`)
      .replace(/(\d+)/g, (d) => toKhmerDigits(d));
  }
  return String(rangeStr);
};

/**
 * Format subject name according to current language without bilingual mixing.
 */
export const formatSubjectName = (subject, lang) => {
  if (!subject) return '';
  if (lang === 'km') {
    return subject.nameKhmer || subject.khmerName || subject.name;
  }
  return subject.name;
};

import { getOfficialStudentId } from './studentId';

/**
 * Returns a strict 6-digit numeric Student ID string (e.g. "201020", "201023", "202607").
 * Strictly numbers only, no prefix, no hyphens, preserving leading zeros.
 */
export const getSixDigitStudentId = (st) => {
  return getOfficialStudentId(st);
};

/**
 * Strips mojibake, double-encoded UTF-8 artifacts, and normalizes delimiters.
 */
export const cleanScheduleText = (str) => {
  if (!str) return '';
  let s = String(str);
  // Replace double-encoded or corrupted bullet variants
  s = s.replace(/├óÔé¼┬ó|â€¢|\|ôôé¼Tó/g, ' • ');
  // Replace double-encoded or corrupted dash variants with standard en-dash (–)
  s = s.replace(/├óÔé¼ÔÇ£|â€“|\|ôôé¼ÔÇØ|├óÔé¼ÔÇ¥|â€”|—/g, ' – ');
  // Collapse multiple spaces
  return s.replace(/\s+/g, ' ').trim();
};

/**
 * Normalizes an individual 12-hour or 24-hour time component to strict 'HH:MM AM/PM'.
 * Preserves the exact hour/minute without timezone shifting.
 */
export const normalizeTimePart = (part) => {
  if (!part) return '';
  const trimmed = cleanScheduleText(part);
  // Matches 12h: e.g. 08:00 AM, 8:00 am, 01:30 PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    const hh = match12[1].padStart(2, '0');
    const mm = match12[2];
    const ampm = match12[3].toUpperCase();
    return `${hh}:${mm} ${ampm}`;
  }
  // Matches 24h: e.g. 08:00, 13:30, 08:00:00
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const mm = match24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm} ${ampm}`;
  }
  return trimmed;
};

/**
 * Formats time range strictly as 'HH:MM AM – HH:MM PM' using clean en-dash (–).
 */
export const formatScheduleTime = (timeStr, endTimeStr) => {
  if (!timeStr) return '';
  if (endTimeStr) {
    const start = normalizeTimePart(timeStr);
    const end = normalizeTimePart(endTimeStr);
    return `${start} – ${end}`;
  }
  const cleaned = cleanScheduleText(timeStr);
  // Split on en-dash, hyphen or 'to'
  const parts = cleaned.split(/\s*(?:–|-|to)\s*/i);
  if (parts.length === 2) {
    const start = normalizeTimePart(parts[0]);
    const end = normalizeTimePart(parts[1]);
    if (start && end) {
      return `${start} – ${end}`;
    }
  }
  return cleaned;
};

/**
 * Normalizes days string, preserving clean en-dash (–) for day ranges.
 * e.g. 'Monday – Friday', 'Monday, Wednesday, Friday', 'Saturday & Sunday'.
 */
export const formatScheduleDays = (daysStr) => {
  if (!daysStr) return '';
  let cleaned = cleanScheduleText(daysStr);
  cleaned = cleaned.replace(/Monday\s*[-–—]\s*Friday/gi, 'Monday – Friday');
  cleaned = cleaned.replace(/Saturday\s*(?:&|and)\s*Sunday/gi, 'Saturday & Sunday');
  return cleaned;
};

/**
 * Master shared schedule formatter for ECC EduManage.
 * Standard output format:
 * 'Monday, Wednesday, Friday • 10:00 AM – 11:30 AM'
 * 'Monday – Friday • 08:00 AM – 09:30 AM'
 * 
 * Supports:
 * - formatSchedule(classObject)
 * - formatSchedule(daysString, timeString)
 * - formatSchedule(fullScheduleString)
 */
export const formatSchedule = (clsOrSchedule, timeStr) => {
  if (!clsOrSchedule) return '';

  // Object input (class cohort or schedule session)
  if (typeof clsOrSchedule === 'object') {
    const cls = clsOrSchedule;
    const rawDays = cls.days;
    const rawTime = cls.time || (cls.startTime && cls.endTime ? `${cls.startTime} – ${cls.endTime}` : '');
    const rawSched = cls.schedule;

    if (rawDays && rawTime) {
      const cleanDays = formatScheduleDays(rawDays);
      const cleanTime = formatScheduleTime(rawTime);
      return `${cleanDays} • ${cleanTime}`;
    }
    if (rawSched) {
      return formatSchedule(rawSched);
    }
    if (rawTime) {
      return formatScheduleTime(rawTime);
    }
    if (rawDays) {
      return formatScheduleDays(rawDays);
    }
    return '';
  }

  // Two strings passed: formatSchedule(days, time)
  if (typeof clsOrSchedule === 'string' && timeStr) {
    const cleanDays = formatScheduleDays(clsOrSchedule);
    const cleanTime = formatScheduleTime(timeStr);
    return `${cleanDays} • ${cleanTime}`;
  }

  // Single string schedule (e.g. 'Monday – Friday • 08:00 AM – 09:30 AM')
  const cleaned = cleanScheduleText(clsOrSchedule);
  if (cleaned.includes('•')) {
    const [daysPart, ...timeParts] = cleaned.split('•');
    const cleanDays = formatScheduleDays(daysPart);
    const cleanTime = formatScheduleTime(timeParts.join('•'));
    return `${cleanDays} • ${cleanTime}`;
  }

  // Check if string is a time range
  if (/(\d{1,2}:\d{2})/i.test(cleaned)) {
    return formatScheduleTime(cleaned);
  }

  return formatScheduleDays(cleaned);
};




