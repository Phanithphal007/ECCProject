-- =============================================================================
-- EduManage ECC — English Learning Management System Database Schema
-- Focus: Grade 1 to Grade 12 English Subjects, Classes, & Student Enrollments
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `edumanage_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `edumanage_db`;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Teachers Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `khmer_name` VARCHAR(150) NULL,
  `role` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NULL,
  `specialization` VARCHAR(150) NULL,
  `office` VARCHAR(80) NULL,
  `status` ENUM('Active', 'On Leave', 'Inactive') NOT NULL DEFAULT 'Active',
  `avatar` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. English Subjects Table (What students learn)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(32) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `khmer_name` VARCHAR(150) NULL,
  `category` ENUM('Foundational English', 'Core Skills', 'Applied Communication', 'Exam Preparation', 'Electives') NOT NULL DEFAULT 'Core Skills',
  `description` TEXT NULL,
  `skills` JSON NULL COMMENT 'Array of English skills e.g. ["Reading", "Vocabulary"]',
  `grades` VARCHAR(60) NOT NULL DEFAULT 'Grade 1 - 12',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2b. Subject Code Monotonic Sequence Table (Thread-safe atomic generation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subject_sequences` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. English Classes Table (Cohorts enrolled in subjects)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(32) NOT NULL,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `subject_id` VARCHAR(32) NOT NULL,
  `teacher_id` VARCHAR(32) NULL,
  `period_id` VARCHAR(32) NULL,
  `grade_level` VARCHAR(50) NOT NULL COMMENT 'e.g. Grade 1, Grade 5',
  `student_location` VARCHAR(500) NULL DEFAULT "Student's Home" COMMENT 'Replaces physical classroom; editable text location e.g. Student\'s Home, Teacher\'s Home, ECC Centre, Online Class',
  `room` VARCHAR(80) NULL DEFAULT 'Room 101' COMMENT 'Preserved for historical data backward compatibility',
  `days` VARCHAR(100) NOT NULL DEFAULT 'Monday – Friday',
  `time` VARCHAR(60) NOT NULL DEFAULT '08:00 AM – 09:30 AM',
  `schedule` VARCHAR(180) NULL,
  `academic_year` VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  `capacity` INT UNSIGNED NOT NULL DEFAULT 25,
  `description` TEXT NULL,
  `status` ENUM('Active', 'Scheduled', 'Completed', 'Archived') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_classes_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_classes_period` FOREIGN KEY (`period_id`) REFERENCES `teaching_periods` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration statements to ensure existing database upgrades safely:
-- ALTER TABLE `classes` MODIFY COLUMN `teacher_id` VARCHAR(32) NULL;
-- ALTER TABLE `classes` ADD COLUMN IF NOT EXISTS `period_id` VARCHAR(32) NULL;
-- ALTER TABLE `classes` ADD COLUMN IF NOT EXISTS `student_location` VARCHAR(500) NULL;
-- ALTER TABLE `teacher_schedules` ADD COLUMN IF NOT EXISTS `period_id` VARCHAR(32) NULL;
-- UPDATE `classes` SET `student_location` = COALESCE(`student_location`, `room`, "Student's Home");

-- -----------------------------------------------------------------------------
-- 4. Students Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(32) NOT NULL,
  `student_id` VARCHAR(6) NULL COMMENT 'Official 6-digit numeric Student ID e.g. 201020',
  `name` VARCHAR(120) NOT NULL,
  `khmer_name` VARCHAR(150) NULL,
  `gender` ENUM('Male', 'Female') NOT NULL,
  `grade` VARCHAR(50) NOT NULL,
  `english_level` VARCHAR(50) NOT NULL DEFAULT 'Beginner',
  `guardian_name` VARCHAR(120) NULL,
  `guardian_phone` VARCHAR(50) NULL,
  `student_phone` VARCHAR(50) NULL,
  `attendance_rate` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  `tuition_status` ENUM('Paid', 'Unpaid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Unpaid',
  `status` ENUM('Active', 'Probation', 'Graduated', 'Withdrawn') NOT NULL DEFAULT 'Active',
  `avatar` VARCHAR(255) NULL,
  `join_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_numeric_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Class Enrollments Table (Many-to-Many: Class <-> Student with duplicate prevention)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` VARCHAR(32) NOT NULL,
  `student_id` VARCHAR(32) NOT NULL,
  `enrolled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Active', 'Completed', 'Dropped') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_student` (`class_id`, `student_id`), -- Strictly prevents duplicate enrollment!
  CONSTRAINT `fk_enrollments_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Class-Based Attendance Table (Historical & daily student tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` VARCHAR(32) NOT NULL,
  `class_id` VARCHAR(32) NOT NULL,
  `attendance_date` DATE NOT NULL,
  `status` ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL DEFAULT 'Present',
  `remarks` VARCHAR(255) NULL,
  `recorded_by` VARCHAR(100) NOT NULL DEFAULT 'Admin Sophea',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_class_date` (`student_id`, `class_id`, `attendance_date`), -- Prevents duplicate attendance records!
  KEY `idx_attendance_class_date` (`class_id`, `attendance_date`),
  KEY `idx_attendance_student` (`student_id`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Teacher Availability Table (Configurable weekly slots & part-time days)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teacher_availability` (
  `id` VARCHAR(32) NOT NULL,
  `teacher_id` VARCHAR(32) NOT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  `available_from` VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
  `available_until` VARCHAR(20) NOT NULL DEFAULT '05:00 PM',
  `break_start` VARCHAR(20) NULL DEFAULT '12:00 PM',
  `break_end` VARCHAR(20) NULL DEFAULT '01:00 PM',
  `status` ENUM('Available', 'Unavailable', 'Preferred') NOT NULL DEFAULT 'Available',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_availability_teacher_day` (`teacher_id`, `day_of_week`),
  CONSTRAINT `fk_availability_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Teaching Schedules Table (Class teaching assignments & sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teacher_schedules` (
  `id` VARCHAR(32) NOT NULL,
  `teacher_id` VARCHAR(32) NOT NULL,
  `class_id` VARCHAR(32) NOT NULL,
  `period_id` VARCHAR(32) NULL,
  `days` VARCHAR(100) NOT NULL DEFAULT 'Monday – Friday',
  `start_time` VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
  `end_time` VARCHAR(20) NOT NULL DEFAULT '09:30 AM',
  `effective_start_date` DATE NOT NULL,
  `effective_end_date` DATE NULL,
  `academic_year` VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  `status` ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_teacher` (`teacher_id`),
  KEY `idx_schedules_class` (`class_id`),
  KEY `idx_schedules_period` (`period_id`),
  CONSTRAINT `fk_schedules_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_period` FOREIGN KEY (`period_id`) REFERENCES `teaching_periods` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Teaching Periods Table (Manageable Scheduling Period Blocks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teaching_periods` (
  `id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `start_time` VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
  `end_time` VARCHAR(20) NOT NULL DEFAULT '12:00 PM',
  `days` VARCHAR(100) NOT NULL DEFAULT 'Monday – Friday',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2b. Subject Code Monotonic Sequence Table (Thread-safe atomic generation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subject_sequences` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Period Teachers Table (Many-to-Many Period to Teacher Assignments)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `period_teachers` (
  `id` VARCHAR(32) NOT NULL,
  `period_id` VARCHAR(32) NOT NULL,
  `teacher_id` VARCHAR(32) NOT NULL,
  `assigned_days` VARCHAR(100) NULL DEFAULT 'Monday – Friday',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_period_teacher` (`period_id`, `teacher_id`),
  KEY `idx_pt_period` (`period_id`),
  KEY `idx_pt_teacher` (`teacher_id`),
  CONSTRAINT `fk_period_teachers_period` FOREIGN KEY (`period_id`) REFERENCES `teaching_periods` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_period_teachers_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed Initial Data
-- -----------------------------------------------------------------------------
INSERT INTO `teachers` (`id`, `name`, `khmer_name`, `role`, `email`, `phone`, `specialization`, `office`, `status`) VALUES
('TCH-01', 'Teacher Sophea Heng', 'ហេង សុភា', 'Head of Primary English', 'sophea.heng@edumanage.kh', '+855 12 888 123', 'Primary Pedagogy & Phonics', 'Room 201-A', 'Active'),
('TCH-02', 'Teacher Michael Davies', 'ម៉ៃឃើល ដាវីស', 'Lower Secondary Lead', 'm.davies@edumanage.kh', '+855 17 444 890', 'Grammar & Spoken Fluency', 'Room 304-B', 'Active'),
('TCH-03', 'Teacher Sovannary Long', 'ឡុង សុវណ្ណារី', 'Young Learners Specialist', 'sovannary.long@edumanage.kh', '+855 70 333 912', 'Early Childhood Literacy', 'Room 102-A', 'Active'),
('TCH-04', 'Teacher David Miller', 'ដេវីដ មីល័រ', 'Upper Secondary & Exam Lead', 'david.miller@edumanage.kh', '+855 11 222 555', 'Academic Writing & IELTS Prep', 'Room 401-C', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `subjects` (`id`, `code`, `name`, `khmer_name`, `category`, `description`, `skills`, `grades`, `status`) VALUES
('SUB-ALPHABET', 'ENG-ALP', 'English Alphabet', 'អក្ខរក្រមអង់គ្លេស', 'Foundational English', 'Letter recognition, stroke formation, upper and lower case fundamentals for young learners.', '["Alphabet Recognition", "Handwriting", "Sound Association"]', 'Grade 1 - 2', 'Active'),
('SUB-PHONICS', 'ENG-PHO', 'Phonics', 'សូរស័ព្ទភាសាអង់គ្លេស', 'Foundational English', 'Phonemic awareness, blended sounds, digraphs, and decoding techniques.', '["Phonemic Awareness", "Decoding", "Pronunciation", "Spelling"]', 'Grade 1 - 3', 'Active'),
('SUB-VOCABULARY', 'ENG-VOC', 'Vocabulary', 'វាក្យសព្ទភាសាអង់គ្លេស', 'Core Skills', 'Thematic word banks, contextual usage, prefixes/suffixes, and high-frequency word mastery.', '["Word Recognition", "Context Clues", "Idioms", "Collocations"]', 'Grade 1 - 12', 'Active'),
('SUB-GRAMMAR', 'ENG-GRM', 'Grammar', 'វេយ្យាករណ៍ភាសាអង់គ្លេស', 'Core Skills', 'Sentence patterns, tenses, parts of speech, syntax, and error correction.', '["Sentence Structure", "Verb Tenses", "Punctuation", "Syntax"]', 'Grade 3 - 12', 'Active'),
('SUB-READING', 'ENG-RED', 'Reading', 'ការអាននិងការយល់ដឹង', 'Core Skills', 'Reading comprehension, inference, scanning, skimming, and critical textual analysis.', '["Comprehension", "Fluency", "Inference", "Critical Analysis"]', 'Grade 2 - 12', 'Active'),
('SUB-WRITING', 'ENG-WRT', 'Writing', 'ការសរសេរភាសាអង់គ្លេស', 'Applied Communication', 'Paragraph formulation, narrative drafting, formal letters, and academic essay construction.', '["Paragraph Building", "Essay Drafting", "Cohesion", "Creative Writing"]', 'Grade 3 - 12', 'Active'),
('SUB-LISTENING', 'ENG-LIS', 'Listening', 'ការស្តាប់ភាសាអង់គ្លេស', 'Core Skills', 'Auditory comprehension, listening for gist and detail, dialogue processing, and accent familiarity.', '["Auditory Comprehension", "Note Taking", "Accent Recognition"]', 'Grade 1 - 12', 'Active'),
('SUB-SPEAKING', 'ENG-SPK', 'Speaking', 'ការនិយាយនិងការបញ្ចេញសំឡេង', 'Applied Communication', 'Oral presentation, pronunciation, intonation, conversational dialogues, and public speaking.', '["Conversational Fluency", "Pronunciation", "Public Speaking", "Roleplay"]', 'Grade 1 - 12', 'Active'),
('SUB-COMMUNICATION', 'ENG-COM', 'English Communication', 'ការប្រាស្រ័យទាក់ទងភាសាអង់គ្លេស', 'Applied Communication', 'Real-world dialogues, interpersonal discussion, interview skills, debate, and pragmatic fluency.', '["Interpersonal Interaction", "Pragmatics", "Debate & Discourse", "Presentations"]', 'Grade 6 - 12', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed Teacher Availability (Full-time & Part-time profiles)
INSERT INTO `teacher_availability` (`id`, `teacher_id`, `day_of_week`, `available_from`, `available_until`, `break_start`, `break_end`, `status`, `notes`) VALUES
('AVL-01', 'TCH-01', 'Monday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full-time primary cohort availability'),
('AVL-02', 'TCH-01', 'Tuesday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full-time primary cohort availability'),
('AVL-03', 'TCH-01', 'Wednesday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full-time primary cohort availability'),
('AVL-04', 'TCH-01', 'Thursday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full-time primary cohort availability'),
('AVL-05', 'TCH-01', 'Friday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full-time primary cohort availability'),
('AVL-06', 'TCH-02', 'Monday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full day teaching schedule'),
('AVL-07', 'TCH-02', 'Wednesday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full day teaching schedule'),
('AVL-08', 'TCH-02', 'Friday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Full day teaching schedule'),
('AVL-09', 'TCH-02', 'Tuesday', '08:00 AM', '05:00 PM', NULL, NULL, 'Unavailable', 'Non-teaching research day'),
('AVL-10', 'TCH-02', 'Thursday', '08:00 AM', '05:00 PM', NULL, NULL, 'Unavailable', 'Non-teaching research day'),
('AVL-11', 'TCH-03', 'Monday', '07:30 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Early learners and primary sessions'),
('AVL-12', 'TCH-03', 'Tuesday', '07:30 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Early learners and primary sessions'),
('AVL-13', 'TCH-03', 'Wednesday', '07:30 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Early learners and primary sessions'),
('AVL-14', 'TCH-03', 'Thursday', '07:30 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Early learners and primary sessions'),
('AVL-15', 'TCH-03', 'Friday', '07:30 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Early learners and primary sessions'),
('AVL-16', 'TCH-03', 'Saturday', '08:00 AM', '04:30 PM', '12:00 PM', '01:00 PM', 'Preferred', 'Weekend literacy club leader'),
('AVL-17', 'TCH-04', 'Monday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Upper secondary cohort availability'),
('AVL-18', 'TCH-04', 'Tuesday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Upper secondary cohort availability'),
('AVL-19', 'TCH-04', 'Wednesday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Upper secondary cohort availability'),
('AVL-20', 'TCH-04', 'Thursday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Upper secondary cohort availability'),
('AVL-21', 'TCH-04', 'Friday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'Upper secondary cohort availability'),
('AVL-22', 'TCH-04', 'Saturday', '08:00 AM', '05:00 PM', '12:00 PM', '01:00 PM', 'Available', 'IELTS intensive training')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- Seed Teaching Periods
INSERT INTO `teaching_periods` (`id`, `name`, `start_time`, `end_time`, `days`, `status`, `description`) VALUES
('PRD-MORN', 'Morning Period', '08:00 AM', '12:00 PM', 'Monday – Friday', 'Active', 'Primary and foundational morning curriculum block'),
('PRD-AFTN', 'Afternoon Period', '01:00 PM', '05:00 PM', 'Monday – Friday', 'Active', 'Core secondary and writing development block'),
('PRD-EVEN', 'Evening Period', '05:00 PM', '08:00 PM', 'Monday – Friday', 'Active', 'Adult conversational and exam prep classes'),
('PRD-WKND', 'Weekend Literacy Period', '08:00 AM', '04:30 PM', 'Saturday & Sunday', 'Active', 'Weekend intensive literacy club and IELTS coaching')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- -----------------------------------------------------------------------------
-- 11. System Users Table (Admin, Teacher, Parent, Student Accounts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(32) NOT NULL,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NULL,
  `role` ENUM('admin', 'teacher', 'parent', 'student') NOT NULL DEFAULT 'student',
  `student_id` VARCHAR(32) NULL COMMENT 'Set if user is a student',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `avatar` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_student` (`student_id`),
  CONSTRAINT `fk_users_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Parent-to-Students Relationship Table (Strict Parent Portal Authorization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `parent_students` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_user_id` VARCHAR(32) NOT NULL,
  `student_id` VARCHAR(32) NOT NULL,
  `relationship` ENUM('Mother', 'Father', 'Guardian', 'Other') NOT NULL DEFAULT 'Guardian',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parent_student` (`parent_user_id`, `student_id`),
  KEY `idx_ps_parent` (`parent_user_id`),
  KEY `idx_ps_student` (`student_id`),
  CONSTRAINT `fk_ps_parent` FOREIGN KEY (`parent_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_ps_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. School Announcements Table (Announcements for Parents and Students)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(32) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `title_khmer` VARCHAR(255) NULL,
  `content` TEXT NOT NULL,
  `content_khmer` TEXT NULL,
  `category` ENUM('Academic', 'Holiday', 'Exam', 'Payment', 'General') NOT NULL DEFAULT 'General',
  `target_audience` ENUM('All', 'Parents', 'Students', 'Teachers') NOT NULL DEFAULT 'All',
  `publish_date` DATE NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `author` VARCHAR(100) NOT NULL DEFAULT 'Academic Administration',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed Users, Parent-Student Links, and Announcements
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `name`, `email`, `phone`, `role`, `student_id`, `status`, `avatar`) VALUES
('USR-ADMIN-01', 'sophea.admin', 'Sophea Heng', 'sophea.heng@edumanage.kh', '+855 12 888 123', 'admin', NULL, 'Active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
('USR-PARENT-01', 'kalyan.parent', 'Kalyan Meas (ម៉ាស កល្យាណ)', 'kalyan.meas@gmail.com', '+855 17 889 001', 'parent', NULL, 'Active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'),
('USR-STUDENT-01', 'dara.student', 'Dara Sok (ដារា សុខ)', 'dara.sok@student.edumanage.kh', '+855 70 889 001', 'student', 'STU-1020', 'Active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `announcements` (`id`, `title`, `title_khmer`, `content`, `content_khmer`, `category`, `target_audience`, `publish_date`, `is_pinned`, `author`) VALUES
('ANN-01', 'Term 4 Final Examination & Speaking Test Schedule', 'កាលវិភាគប្រឡងបញ្ចប់វគ្គ និងតេស្តសន្ទនាផ្ទាល់មាត់ វគ្គទី ៤', 'Final examinations for Term 4 will take place from November 18 to 22. Local and foreign teacher evaluation speaking sessions will be scheduled during regular class hours.', 'ការប្រឡងបញ្ចប់វគ្គទី ៤ នឹងប្រព្រឹត្តទៅចាប់ពីថ្ងៃទី ១៨ ដល់ ២២ ខែវិច្ឆិកា។ ការធ្វើតេស្តសន្ទនាផ្ទាល់មាត់ជាមួយគ្រូបរទេសនឹងធ្វើឡើងក្នុងម៉ោងសិក្សាធម្មតា។', 'Exam', 'All', '2026-11-01', 1, 'Academic Directorate'),
('ANN-02', 'Cambodian Water Festival Center Break Notice', 'សេចក្តីជូនដំណឹងអំពីការឈប់សម្រាកព្រះរាជពិធីបុណ្យអុំទូក', 'EduManage ECC Centre will be closed from November 25 to 27 in observance of the Water Festival. Classes resume normally on Monday.', 'មជ្ឈមណ្ឌល ECC នឹងឈប់សម្រាកពីថ្ងៃទី ២៥ ដល់ ២៧ ខែវិច្ឆិកា ក្នុងឱកាសព្រះរាជពិធីបុណ្យអុំទូក។ ការសិក្សានឹងចាប់ផ្តើមឡើងវិញធម្មតានៅថ្ងៃចន្ទ។', 'Holiday', 'All', '2026-11-02', 1, 'ECC Administration'),
('ANN-03', 'Term 4 Tuition Payment & Early Bird Re-enrollment', 'ការបង់ថ្លៃសិក្សាវគ្គទី ៤ និងការចុះឈ្មោះបន្តសម្រាប់វគ្គថ្មី', 'Parents are encouraged to complete Term 4 tuition payment by November 15. Invoices and receipts can be reviewed directly in your Parent Portal.', 'សូមអាណាព្យាបាលមេត្តាបំពេញការទូទាត់ថ្លៃសិក្សាវគ្គទី ៤ ត្រឹមថ្ងៃទី ១៥ ខែវិច្ឆិកា។ វិក្កយបត្រ និងបង្កាន់ដៃអាចពិនិត្យមើលបានតាមរយៈ Parent Portal។', 'Payment', 'Parents', '2026-11-03', 0, 'Finance Department')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- -----------------------------------------------------------------------------
-- Assessment Periods, Student Scores, Remarks, and Items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessment_periods` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `name_khmer` VARCHAR(150) NOT NULL,
  `academic_year` VARCHAR(50) NOT NULL,
  `is_current` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_scores` (
  `id` VARCHAR(64) NOT NULL,
  `student_id` VARCHAR(20) NOT NULL,
  `class_id` VARCHAR(50) NOT NULL,
  `period_id` VARCHAR(50) NOT NULL,
  `evaluation_month` VARCHAR(7) NULL COMMENT 'Format: YYYY-MM e.g. 2026-11',
  `period_name` VARCHAR(150) NOT NULL,
  `period_name_khmer` VARCHAR(150) NULL,
  `academic_year` VARCHAR(50) NOT NULL,
  `class_name` VARCHAR(150) NULL,
  `course` VARCHAR(150) NULL,
  `teacher` VARCHAR(150) NULL,
  `date_recorded` DATE NOT NULL,
  `status` ENUM('Evaluated', 'In Progress', 'Pending') NOT NULL DEFAULT 'In Progress',
  `submission_date` DATE NULL,
  `total_score` DECIMAL(6,2) NULL,
  `max_score` DECIMAL(6,2) NULL DEFAULT 100.00,
  `percentage` DECIMAL(5,2) NULL,
  `grade` VARCHAR(20) NULL,
  `teacher_remarks` TEXT NULL,
  `teacher_remarks_khmer` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_student_period` (`student_id`, `period_id`),
  INDEX `idx_class_period` (`class_id`, `period_id`),
  INDEX `idx_student_eval_month` (`student_id`, `evaluation_month`),
  INDEX `idx_eval_month` (`evaluation_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `score_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `score_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `name_khmer` VARCHAR(150) NULL,
  `max_score` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `obtained_score` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `grade` VARCHAR(10) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  INDEX `idx_score_id` (`score_id`),
  FOREIGN KEY (`score_id`) REFERENCES `student_scores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `assessment_periods` (`id`, `name`, `name_khmer`, `academic_year`, `is_current`) VALUES
('T4-MID-2026', 'Term 4 Mid-Term Assessment 2026', 'វគ្គទី ៤ ប្រឡងឆមាស ២០២៦', '2026-2027', 1),
('T3-FIN-2026', 'Term 3 Final Comprehensive Assessment 2026', 'វគ្គទី ៣ ប្រឡងបញ្ចប់ ២០២៦', '2025-2026', 0),
('T2-MID-2026', 'Term 2 Progress Assessment 2026', 'វគ្គទី ២ ប្រឡងឆមាស ២០២៦', '2025-2026', 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;


