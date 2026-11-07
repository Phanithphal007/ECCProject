/**
 * Centralized Student ID Validation & Management Utility
 * Official Format: Exactly 6 numeric digits (string), e.g. "104050", "201020", "008810"
 */

export const STUDENT_ID_REGEX = /^[0-9]{6}$/;

export const isValidStudentId = (id) => {
  if (typeof id !== 'string') return false;
  return STUDENT_ID_REGEX.test(id.trim());
};

// Stable one-to-one legacy ID mapping
export const LEGACY_STUDENT_ID_MAP = {
  'STU-1020': '201020',
  'STU-1021': '201021',
  'STU-1022': '201022',
  'STU-1023': '201023',
  'STU-1024': '201024',
  'STU-1025': '201025',
  'STU-1026': '201026',
  'STU-1027': '201027',
  'STU-1028': '201028',
  'STU-1593': '104050'
};

/**
 * Returns the official 6-digit Student ID for any student object or ID string.
 * Strictly numbers only, exactly 6 digits, preserving leading zeros.
 */
export const getOfficialStudentId = (studentOrId) => {
  if (!studentOrId) return '201020';

  // If passed an object
  if (typeof studentOrId === 'object') {
    const candidate = String(
      studentOrId.studentId ||
      studentOrId.studentCode ||
      studentOrId.student_code ||
      studentOrId.numericId ||
      ''
    ).trim();
    if (STUDENT_ID_REGEX.test(candidate)) {
      return candidate;
    }
    const internalId = String(studentOrId.id || '').trim();
    if (LEGACY_STUDENT_ID_MAP[internalId]) {
      return LEGACY_STUDENT_ID_MAP[internalId];
    }
    if (STUDENT_ID_REGEX.test(internalId)) {
      return internalId;
    }
    const digitsOnly = internalId.replace(/\D/g, '');
    if (digitsOnly.length === 6) return digitsOnly;
    if (digitsOnly.length === 4) return `20${digitsOnly}`;
    if (digitsOnly.length > 0) return digitsOnly.padStart(6, '0').slice(-6);
    return '201020';
  }

  // If passed a string/number ID directly
  const str = String(studentOrId).trim();
  if (STUDENT_ID_REGEX.test(str)) {
    return str;
  }
  if (LEGACY_STUDENT_ID_MAP[str]) {
    return LEGACY_STUDENT_ID_MAP[str];
  }
  const digits = str.replace(/\D/g, '');
  if (digits.length === 6) return digits;
  if (digits.length === 4) return `20${digits}`;
  if (digits.length > 0) return digits.padStart(6, '0').slice(-6);
  return '201020';
};

/**
 * Generates a unique 6-digit numeric Student ID string.
 * Ensures no collision with existing students.
 */
export const generateSixDigitStudentId = (existingStudents = []) => {
  const existingSet = new Set(
    existingStudents.map((s) => getOfficialStudentId(s))
  );

  // Try sequential starting from 201029 or random 6-digit until unique
  let candidateNumber = 201029;
  while (candidateNumber <= 999999) {
    const candidateStr = String(candidateNumber);
    if (!existingSet.has(candidateStr)) {
      return candidateStr;
    }
    candidateNumber++;
  }

  // Fallback generation
  let attempts = 0;
  while (attempts < 1000) {
    const rnd = String(Math.floor(100000 + Math.random() * 900000));
    if (!existingSet.has(rnd)) return rnd;
    attempts++;
  }
  return '209999';
};

