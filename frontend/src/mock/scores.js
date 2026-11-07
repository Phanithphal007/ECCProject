/**
 * Mock data for Student Assessments and Score Input System
 */

export const mockAssessmentPeriods = [
  {
    id: 'T4-MID-2026',
    name: 'Term 4 Mid-Term Assessment 2026',
    nameKhmer: 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
    academicYear: '2026-2027',
    term: 'Term 4',
    isCurrent: true
  },
  {
    id: 'T4-FINAL-2026',
    name: 'Term 4 Final Examination 2026',
    nameKhmer: 'វគ្គទី ៤ ប្រឡងបញ្ចប់វគ្គ ២០២៦',
    academicYear: '2026-2027',
    term: 'Term 4',
    isCurrent: false
  },
  {
    id: 'T3-FINAL-2026',
    name: 'Term 3 Final Examination 2026',
    nameKhmer: 'វគ្គទី ៣ ប្រឡងបញ្ចប់វគ្គ ២០២៦',
    academicYear: '2025-2026',
    term: 'Term 3',
    isCurrent: false
  },
  {
    id: 'T3-MID-2026',
    name: 'Term 3 Mid-Term Assessment 2026',
    nameKhmer: 'វគ្គទី ៣ ប្រឡងឆមាស ២០២៦',
    academicYear: '2025-2026',
    term: 'Term 3',
    isCurrent: false
  }
];

export const DEFAULT_ASSESSMENT_ITEMS = [
  { id: 'item-1', name: 'Vocabulary', nameKhmer: 'វាក្យសព្ទ', maxScore: 10, obtainedScore: 10 },
  { id: 'item-2', name: 'Reading', nameKhmer: 'អំណាន', maxScore: 15, obtainedScore: 13 },
  { id: 'item-3', name: 'Writing', nameKhmer: 'សំណេរ', maxScore: 20, obtainedScore: 18 },
  { id: 'item-4', name: 'Speaking', nameKhmer: 'ការនិយាយ', maxScore: 30, obtainedScore: 30 },
  { id: 'item-5', name: 'Listening', nameKhmer: 'ការស្តាប់', maxScore: 25, obtainedScore: 25 }
];

export const ASSESSMENT_PRESETS = [
  { name: 'Vocabulary', nameKhmer: 'វាក្យសព្ទ', maxScore: 10 },
  { name: 'Reading', nameKhmer: 'អំណាន', maxScore: 15 },
  { name: 'Writing', nameKhmer: 'សំណេរ', maxScore: 20 },
  { name: 'Speaking', nameKhmer: 'ការនិយាយ', maxScore: 30 },
  { name: 'Listening', nameKhmer: 'ការស្តាប់', maxScore: 25 },
  { name: 'Grammar', nameKhmer: 'វេយ្យាករណ៍', maxScore: 15 },
  { name: 'Dictation', nameKhmer: 'តាមអាន', maxScore: 10 },
  { name: 'Attendance & Participation', nameKhmer: 'វត្តមាន និងការចូលរួម', maxScore: 10 }
];

export let mockScores = [
  // STU-1020 in Grade 1 - Phonics Starters (CLS-G1-PHO)
  {
    id: 'SCORE-STU-1020-CLS-G1-PHO-T4-MID',
    studentId: 'STU-1020',
    periodId: 'T4-MID-2026',
    periodName: 'Term 4 Mid-Term Assessment 2026',
    periodNameKhmer: 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
    academicYear: '2026-2027',
    classId: 'CLS-G1-PHO',
    className: 'Grade 1 — Phonics Starters',
    course: 'Elementary Phonics & Pronunciation',
    teacher: 'Teacher Sovannary Long',
    dateRecorded: '2026-11-05',
    items: [
      { id: 'item-1', name: 'Vocabulary', nameKhmer: 'វាក្យសព្ទ', maxScore: 10, obtainedScore: 10 },
      { id: 'item-2', name: 'Reading', nameKhmer: 'អំណាន', maxScore: 15, obtainedScore: 13 },
      { id: 'item-3', name: 'Writing', nameKhmer: 'សំណេរ', maxScore: 20, obtainedScore: 18 },
      { id: 'item-4', name: 'Speaking', nameKhmer: 'ការនិយាយ', maxScore: 30, obtainedScore: 30 },
      { id: 'item-5', name: 'Listening', nameKhmer: 'ការស្តាប់', maxScore: 25, obtainedScore: 25 }
    ],
    teacherRemarks: 'Excellent mastery of phonics and conversational vocabulary. Highly recommended for Level 2 advancement.',
    teacherRemarksKhmer: 'សិស្សមានការយល់ដឹងខ្ពស់លើការបញ្ចេញសម្លេង និងការប្រើប្រាស់ពាក្យពេចន៍។ ស្នើឱ្យឡើងកម្រិតបន្ទាប់។'
  },
  // STU-1020 in Grade 1 - Alphabet A (CLS-G1-ALP)
  {
    id: 'SCORE-STU-1020-CLS-G1-ALP-T4-MID',
    studentId: 'STU-1020',
    periodId: 'T4-MID-2026',
    periodName: 'Term 4 Mid-Term Assessment 2026',
    periodNameKhmer: 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
    academicYear: '2026-2027',
    classId: 'CLS-G1-ALP',
    className: 'Grade 1 — Alphabet A',
    course: 'Primary English Alphabet & Phonics',
    teacher: 'Teacher Sovannary Long',
    dateRecorded: '2026-11-05',
    items: [
      { id: 'item-1', name: 'Vocabulary', nameKhmer: 'វាក្យសព្ទ', maxScore: 10, obtainedScore: 10 },
      { id: 'item-2', name: 'Reading', nameKhmer: 'អំណាន', maxScore: 15, obtainedScore: 14 },
      { id: 'item-3', name: 'Writing', nameKhmer: 'សំណេរ', maxScore: 20, obtainedScore: 19 },
      { id: 'item-4', name: 'Speaking', nameKhmer: 'ការនិយាយ', maxScore: 30, obtainedScore: 29 },
      { id: 'item-5', name: 'Listening', nameKhmer: 'ការស្តាប់', maxScore: 25, obtainedScore: 25 }
    ],
    teacherRemarks: 'Strong comprehension and alphabet recognition.',
    teacherRemarksKhmer: 'ការចងចាំអក្សរ និងការអានបានយ៉ាងស្ទាត់ជំនាញ។'
  },
  // STU-1023 in Grade 1 - Phonics Starters (CLS-G1-PHO)
  {
    id: 'SCORE-STU-1023-CLS-G1-PHO-T4-MID',
    studentId: 'STU-1023',
    periodId: 'T4-MID-2026',
    periodName: 'Term 4 Mid-Term Assessment 2026',
    periodNameKhmer: 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
    academicYear: '2026-2027',
    classId: 'CLS-G1-PHO',
    className: 'Grade 1 — Phonics Starters',
    course: 'Elementary Phonics & Pronunciation',
    teacher: 'Teacher Sovannary Long',
    dateRecorded: '2026-11-04',
    items: [
      { id: 'item-1', name: 'Vocabulary', nameKhmer: 'វាក្យសព្ទ', maxScore: 10, obtainedScore: 8 },
      { id: 'item-2', name: 'Reading', nameKhmer: 'អំណាន', maxScore: 15, obtainedScore: 12 },
      { id: 'item-3', name: 'Writing', nameKhmer: 'សំណេរ', maxScore: 20, obtainedScore: 16 },
      { id: 'item-4', name: 'Speaking', nameKhmer: 'ការនិយាយ', maxScore: 30, obtainedScore: 27 },
      { id: 'item-5', name: 'Listening', nameKhmer: 'ការស្តាប់', maxScore: 25, obtainedScore: 23 }
    ],
    teacherRemarks: 'Great oral skills, continue practicing letter blends.',
    teacherRemarksKhmer: 'ការបញ្ចេញសម្លេងបានល្អ សូមបន្តហាត់សរសេរផ្សំអក្សរ។'
  },
  // STU-1021 in Grade 2 - Phonics Fun (CLS-G2-PHO)
  {
    id: 'SCORE-STU-1021-CLS-G2-PHO-T4-MID',
    studentId: 'STU-1021',
    periodId: 'T4-MID-2026',
    periodName: 'Term 4 Mid-Term Assessment 2026',
    periodNameKhmer: 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
    academicYear: '2026-2027',
    classId: 'CLS-G2-PHO',
    className: 'Grade 2 — Phonics Fun',
    course: 'Elementary Phonics & Pronunciation',
    teacher: 'Teacher Rathana Vong',
    dateRecorded: '2026-11-04',
    items: [
      { id: 'item-1', name: 'Vocabulary', nameKhmer: 'វាក្យសព្ទ', maxScore: 10, obtainedScore: 8 },
      { id: 'item-2', name: 'Reading', nameKhmer: 'អំណាន', maxScore: 15, obtainedScore: 12 },
      { id: 'item-3', name: 'Writing', nameKhmer: 'សំណេរ', maxScore: 20, obtainedScore: 16 },
      { id: 'item-4', name: 'Speaking', nameKhmer: 'ការនិយាយ', maxScore: 30, obtainedScore: 26 },
      { id: 'item-5', name: 'Listening', nameKhmer: 'ការស្តាប់', maxScore: 25, obtainedScore: 22 }
    ],
    teacherRemarks: 'Good comprehension skills, encourage more writing practice.',
    teacherRemarksKhmer: 'មានការយល់ដឹងល្អ សូមលើកទឹកចិត្តឱ្យអនុវត្តការសរសេរបន្ថែម។'
  }
];
