-- =============================================================================
-- Migration: Add Monthly Student Evaluation Status Tracking
-- Date: 2026-11-07
-- Database: edumanage_db
-- =============================================================================

USE `edumanage_db`;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure students exist with full records matching frontend rosters
INSERT INTO `students` (`id`, `student_id`, `name`, `khmer_name`, `gender`, `grade`, `english_level`, `guardian_name`, `guardian_phone`, `student_phone`, `attendance_rate`, `tuition_status`, `status`, `avatar`, `join_date`) VALUES
('STU-1020', '201020', 'Dara Sok', 'ដារា សុខ', 'Male', 'Grade 5', 'Beginner', 'Sok Veasna (Father)', '+855 12 888 999', '+855 98 777 666', 100.00, 'Paid', 'Active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', '2026-01-05'),
('STU-1021', '201021', 'Sothea Chan', 'ចាន់ សុធា', 'Male', 'Grade 4', 'Beginner', 'Borey Chan (Father)', '+855 12 345 678', '+855 96 112 334', 98.00, 'Paid', 'Active', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80', '2026-01-10'),
('STU-1022', '201022', 'Vicheka Meas', 'មាស វិច្ឆិកា', 'Female', 'Grade 8', 'Intermediate', 'Kalyan Meas (Mother)', '+855 17 889 001', '+855 70 889 001', 74.00, 'Overdue', 'Active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '2026-01-15'),
('STU-1023', '201023', 'Bopha Keo', 'កែវ បុប្ផា', 'Female', 'Grade 2', 'Beginner', 'Rithy Keo (Father)', '+855 77 445 566', 'N/A', 100.00, 'Paid', 'Active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '2026-02-01'),
('STU-1024', '201024', 'Piseth Seng', 'សេង ពិសិដ្ឋ', 'Male', 'Grade 11', 'Advanced', 'Somaly Seng (Mother)', '+855 12 998 776', '+855 81 223 344', 94.00, 'Paid', 'Active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '2026-01-08'),
('STU-1025', '201025', 'Rattana Lim', 'លឹម រតនា', 'Male', 'Grade 6', 'Intermediate', 'Channa Lim (Mother)', '+855 16 332 211', '+855 98 445 566', 88.00, 'Pending', 'Active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '2026-02-12'),
('STU-1026', '201026', 'Kolab Pich', 'ពេជ្រ គុលាប', 'Female', 'Grade 12', 'Advanced', 'Thida Pich (Mother)', '+855 12 778 899', '+855 89 556 677', 96.00, 'Paid', 'Active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '2026-01-05'),
('STU-1027', '201027', 'Dara Sok (Young)', 'សុខ ដារ៉ា', 'Male', 'Grade 1', 'Beginner', 'Vanna Sok (Father)', '+855 10 990 011', 'N/A', 78.00, 'Overdue', 'Active', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', '2026-02-20'),
('STU-1028', '201028', 'Chantrea Sam', 'សំ ចន្ទ្រា', 'Female', 'Grade 9', 'Intermediate', 'Vuthy Sam (Father)', '+855 78 123 456', '+855 93 221 100', 95.00, 'Paid', 'Active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', '2026-01-18')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `khmer_name` = VALUES(`khmer_name`),
  `student_id` = VALUES(`student_id`),
  `grade` = VALUES(`grade`);

-- 2. Seed English Classes
INSERT INTO `classes` (`id`, `code`, `name`, `subject_id`, `teacher_id`, `grade_level`, `student_location`, `room`, `days`, `time`, `schedule`, `academic_year`, `capacity`, `description`, `status`) VALUES
('CLS-G1-ALP', 'ENG-G1-ALP', 'Grade 1 — Alphabet A', 'SUB-ALPHABET', 'TCH-03', 'Grade 1', 'ECC Centre, Phnom Penh', 'ECC Centre, Phnom Penh', 'Monday – Friday', '08:00 AM – 09:30 AM', 'Monday – Friday • 08:00 AM – 09:30 AM', '2026-2027', 25, 'Foundational letter recognition and phoneme awareness for Grade 1 beginners.', 'Active'),
('CLS-G1-PHO', 'ENG-G1-PHO', 'Grade 1 — Phonics Starters', 'SUB-PHONICS', 'TCH-03', 'Grade 1', "Student's Home, Phnom Penh", "Student's Home, Phnom Penh", 'Monday, Wednesday, Friday', '10:00 AM – 11:30 AM', 'Monday, Wednesday, Friday • 10:00 AM – 11:30 AM', '2026-2027', 24, 'Sound blending, short vowels, and consonant digraphs.', 'Active'),
('CLS-G2-VOC', 'ENG-G2-VOC', 'Grade 2 — Word Explorers', 'SUB-VOCABULARY', 'TCH-03', 'Grade 2', "Teacher's Home, Siem Reap", "Teacher's Home, Siem Reap", 'Monday, Wednesday, Friday', '01:30 PM – 03:00 PM', 'Monday, Wednesday, Friday • 01:30 PM – 03:00 PM', '2026-2027', 25, 'Thematic vocabulary building with interactive flashcards and storytelling.', 'Active'),
('CLS-G4-RED', 'ENG-G4-RED', 'Grade 4 — Discovery Reading', 'SUB-READING', 'TCH-01', 'Grade 4', 'ECC Centre, Room 203', 'ECC Centre, Room 203', 'Tuesday, Thursday', '10:00 AM – 11:30 AM', 'Tuesday, Thursday • 10:00 AM – 11:30 AM', '2026-2027', 26, 'Intermediate reading comprehension, gist finding and contextual vocabulary.', 'Active'),
('CLS-G5-GRM', 'ENG-G5-GRM', 'Grade 5 — Junior Achievers', 'SUB-GRAMMAR', 'TCH-01', 'Grade 5', "Student's Home, Phnom Penh", "Student's Home, Phnom Penh", 'Monday – Friday', '08:00 AM – 09:30 AM', 'Monday – Friday • 08:00 AM – 09:30 AM', '2026-2027', 25, 'Essential grammar rules, verb tenses, and sentence building.', 'Active'),
('CLS-G8-SPK', 'ENG-G8-SPK', 'Grade 8 — Pioneer Speaking', 'SUB-SPEAKING', 'TCH-02', 'Grade 8', "Student's Home, Tuol Kork", "Student's Home, Tuol Kork", 'Monday, Wednesday, Friday', '09:45 AM – 11:15 AM', 'Monday, Wednesday, Friday • 09:45 AM – 11:15 AM', '2026-2027', 26, 'Interactive conversational dialogues and real-world English communication.', 'Active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Enhance `student_scores` table for Monthly Evaluation Tracking
ALTER TABLE `student_scores`
  ADD COLUMN IF NOT EXISTS `evaluation_month` VARCHAR(7) NULL COMMENT 'Format: YYYY-MM e.g. 2026-11' AFTER `period_id`,
  ADD COLUMN IF NOT EXISTS `status` ENUM('Evaluated', 'In Progress', 'Pending') NOT NULL DEFAULT 'In Progress' AFTER `date_recorded`,
  ADD COLUMN IF NOT EXISTS `submission_date` DATE NULL COMMENT 'Date when evaluation was officially submitted' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `total_score` DECIMAL(6,2) NULL AFTER `submission_date`,
  ADD COLUMN IF NOT EXISTS `max_score` DECIMAL(6,2) NULL DEFAULT 100.00 AFTER `total_score`,
  ADD COLUMN IF NOT EXISTS `percentage` DECIMAL(5,2) NULL AFTER `max_score`,
  ADD COLUMN IF NOT EXISTS `grade` VARCHAR(10) NULL AFTER `percentage`;

-- Add indexes for fast monthly queries
ALTER TABLE `student_scores`
  ADD INDEX IF NOT EXISTS `idx_student_eval_month` (`student_id`, `evaluation_month`),
  ADD INDEX IF NOT EXISTS `idx_eval_month` (`evaluation_month`);

-- Auto-fill evaluation_month for any existing records
UPDATE `student_scores`
SET `evaluation_month` = DATE_FORMAT(`date_recorded`, '%Y-%m')
WHERE `evaluation_month` IS NULL OR `evaluation_month` = '';

-- 4. Seed Canonical Monthly Evaluation Test Records

-- Case 1: STU-1020 (Dara Sok) -> Evaluated in November 2026 (Submitted on 2026-11-05)
INSERT INTO `student_scores` (
  `id`, `student_id`, `class_id`, `period_id`, `evaluation_month`,
  `period_name`, `period_name_khmer`, `academic_year`, `class_name`, `course`, `teacher`,
  `date_recorded`, `status`, `submission_date`, `total_score`, `max_score`, `percentage`, `grade`,
  `teacher_remarks`, `teacher_remarks_khmer`
) VALUES (
  'SCORE-STU-1020-CLS-G5-GRM-2026-11',
  'STU-1020',
  'CLS-G5-GRM',
  'T4-MID-2026',
  '2026-11',
  'Term 4 Mid-Term Assessment 2026',
  'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
  '2026-2027',
  'Grade 5 — Junior Achievers',
  'Grammar & Sentence Structure',
  'Teacher Sophea Heng',
  '2026-11-05',
  'Evaluated',
  '2026-11-05',
  96.00,
  100.00,
  96.00,
  'A',
  '1. Demonstrates an exceptionally positive attitude toward English learning.\n2. Pronunciation is clear and confident during speaking discussions.\n3. Outstanding homework completion and active participation.',
  '- ជាសិស្សសកម្មក្នុងការសិក្សា និងចូលចិត្តឆ្លើយសំនួរ\n- មានភាពអត់ធ្មត់ខ្ពស់ក្នុងការហាត់សរសេរអក្សរផ្ចិតផ្ចង់\n- គោរពវិន័យថ្នាក់រៀន និងរួសរាយរាក់ទាក់ជាមួយមិត្តភក្តិ'
) ON DUPLICATE KEY UPDATE 
  `status` = VALUES(`status`),
  `submission_date` = VALUES(`submission_date`),
  `total_score` = VALUES(`total_score`),
  `grade` = VALUES(`grade`);

-- Clear & insert criteria items for STU-1020
DELETE FROM `score_items` WHERE `score_id` = 'SCORE-STU-1020-CLS-G5-GRM-2026-11';
INSERT INTO `score_items` (`score_id`, `name`, `name_khmer`, `max_score`, `obtained_score`, `grade`, `sort_order`) VALUES
('SCORE-STU-1020-CLS-G5-GRM-2026-11', 'Attendance', 'វត្តមាន', 10.00, 10.00, 'A', 0),
('SCORE-STU-1020-CLS-G5-GRM-2026-11', 'Daily Observation', 'ការសង្កេតប្រចាំថ្ងៃ', 15.00, 14.00, 'A', 1),
('SCORE-STU-1020-CLS-G5-GRM-2026-11', 'Weekly Observation', 'ការសង្កេតប្រចាំសប្តាហ៍', 20.00, 19.00, 'A', 2),
('SCORE-STU-1020-CLS-G5-GRM-2026-11', 'Speaking & Oral Test', 'ការធ្វើតេស្តជាមួយបរទេស', 30.00, 28.00, 'A', 3),
('SCORE-STU-1020-CLS-G5-GRM-2026-11', 'Final Term Exam', 'ការប្រឡងបញ្ចប់', 25.00, 25.00, 'A', 4);

-- Case 2: STU-1021 (Sothea Chan) -> In Progress for November 2026 (Started, not yet submitted)
INSERT INTO `student_scores` (
  `id`, `student_id`, `class_id`, `period_id`, `evaluation_month`,
  `period_name`, `period_name_khmer`, `academic_year`, `class_name`, `course`, `teacher`,
  `date_recorded`, `status`, `submission_date`, `total_score`, `max_score`, `percentage`, `grade`,
  `teacher_remarks`, `teacher_remarks_khmer`
) VALUES (
  'SCORE-STU-1021-CLS-G4-RED-2026-11',
  'STU-1021',
  'CLS-G4-RED',
  'T4-MID-2026',
  '2026-11',
  'Term 4 Mid-Term Assessment 2026',
  'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
  '2026-2027',
  'Grade 4 — Discovery Reading',
  'Reading & Comprehension',
  'Teacher Sophea Heng',
  '2026-11-04',
  'In Progress',
  NULL,
  45.00,
  100.00,
  45.00,
  'In Progress',
  'Preliminary reading scores entered. Oral speaking assessment pending completion with foreign teacher.',
  'ពិន្ទុអំណានបឋមត្រូវបានបញ្ចូល។ កំពុងរង់ចាំការវាយតម្លៃផ្ទាល់មាត់ជាមួយគ្រូបរទេស។'
) ON DUPLICATE KEY UPDATE 
  `status` = VALUES(`status`),
  `submission_date` = VALUES(`submission_date`);

DELETE FROM `score_items` WHERE `score_id` = 'SCORE-STU-1021-CLS-G4-RED-2026-11';
INSERT INTO `score_items` (`score_id`, `name`, `name_khmer`, `max_score`, `obtained_score`, `grade`, `sort_order`) VALUES
('SCORE-STU-1021-CLS-G4-RED-2026-11', 'Attendance', 'វត្តមាន', 10.00, 10.00, 'A', 0),
('SCORE-STU-1021-CLS-G4-RED-2026-11', 'Daily Observation', 'ការសង្កេតប្រចាំថ្ងៃ', 15.00, 13.00, 'B', 1),
('SCORE-STU-1021-CLS-G4-RED-2026-11', 'Weekly Observation', 'ការសង្កេតប្រចាំសប្តាហ៍', 20.00, 18.00, 'B', 2),
('SCORE-STU-1021-CLS-G4-RED-2026-11', 'Speaking & Oral Test', 'ការធ្វើតេស្តជាមួយបរទេស', 30.00, 0.00, NULL, 3),
('SCORE-STU-1021-CLS-G4-RED-2026-11', 'Final Term Exam', 'ការប្រឡងបញ្ចប់', 25.00, 0.00, NULL, 4);

-- Case 4: STU-1023 (Bopha Keo) -> Evaluated in November 2026 (Submitted on 2026-11-03)
INSERT INTO `student_scores` (
  `id`, `student_id`, `class_id`, `period_id`, `evaluation_month`,
  `period_name`, `period_name_khmer`, `academic_year`, `class_name`, `course`, `teacher`,
  `date_recorded`, `status`, `submission_date`, `total_score`, `max_score`, `percentage`, `grade`,
  `teacher_remarks`, `teacher_remarks_khmer`
) VALUES (
  'SCORE-STU-1023-CLS-G2-VOC-2026-11',
  'STU-1023',
  'CLS-G2-VOC',
  'T4-MID-2026',
  '2026-11',
  'Term 4 Mid-Term Assessment 2026',
  'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦',
  '2026-2027',
  'Grade 2 — Word Explorers',
  'Vocabulary Building',
  'Teacher Sovannary Long',
  '2026-11-03',
  'Evaluated',
  '2026-11-03',
  98.00,
  100.00,
  98.00,
  'A',
  'Outstanding vocabulary retention and creative storytelling performance.',
  '- ចងចាំពាក្យបានល្អប្រសើរ និងមានភាពក្លាហានក្នុងការនិយាយ\n- យកចិត្តទុកដាក់ស្តាប់ការពន្យល់របស់គ្រូ'
) ON DUPLICATE KEY UPDATE 
  `status` = VALUES(`status`),
  `submission_date` = VALUES(`submission_date`),
  `total_score` = VALUES(`total_score`),
  `grade` = VALUES(`grade`);

DELETE FROM `score_items` WHERE `score_id` = 'SCORE-STU-1023-CLS-G2-VOC-2026-11';
INSERT INTO `score_items` (`score_id`, `name`, `name_khmer`, `max_score`, `obtained_score`, `grade`, `sort_order`) VALUES
('SCORE-STU-1023-CLS-G2-VOC-2026-11', 'Attendance', 'វត្តមាន', 10.00, 10.00, 'A', 0),
('SCORE-STU-1023-CLS-G2-VOC-2026-11', 'Daily Observation', 'ការសង្កេតប្រចាំថ្ងៃ', 15.00, 15.00, 'A', 1),
('SCORE-STU-1023-CLS-G2-VOC-2026-11', 'Weekly Observation', 'ការសង្កេតប្រចាំសប្តាហ៍', 20.00, 20.00, 'A', 2),
('SCORE-STU-1023-CLS-G2-VOC-2026-11', 'Speaking & Oral Test', 'ការធ្វើតេស្តជាមួយបរទេស', 30.00, 29.00, 'A', 3),
('SCORE-STU-1023-CLS-G2-VOC-2026-11', 'Final Term Exam', 'ការប្រឡងបញ្ចប់', 25.00, 24.00, 'A', 4);

-- Notice: STU-1022 (Vicheka Meas) has NO record for November 2026 -> Case 3: Pending
-- Notice: STU-1023 (Bopha Keo) has NO record for December 2026 -> Case 4: Evaluated in Nov, Pending in Dec

SET FOREIGN_KEY_CHECKS = 1;

