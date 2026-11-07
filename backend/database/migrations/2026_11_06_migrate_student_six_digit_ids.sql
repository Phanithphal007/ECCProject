-- Migration: Migrate official student IDs to 6-digit numeric format
-- Preserves internal primary keys (`id`) and existing foreign key relationships.

ALTER TABLE `students` 
  ADD COLUMN IF NOT EXISTS `student_id` VARCHAR(6) NULL COMMENT 'Official 6-digit numeric Student ID e.g. 201020' AFTER `id`;

-- Safely assign 6-digit IDs for legacy students
UPDATE `students` SET `student_id` = '201020' WHERE `id` = 'STU-1020' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201021' WHERE `id` = 'STU-1021' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201022' WHERE `id` = 'STU-1022' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201023' WHERE `id` = 'STU-1023' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201024' WHERE `id` = 'STU-1024' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201025' WHERE `id` = 'STU-1025' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201026' WHERE `id` = 'STU-1026' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201027' WHERE `id` = 'STU-1027' AND (`student_id` IS NULL OR `student_id` = '');
UPDATE `students` SET `student_id` = '201028' WHERE `id` = 'STU-1028' AND (`student_id` IS NULL OR `student_id` = '');

-- Fallback for any other legacy records: extract digits and pad to 6 digits
UPDATE `students` 
SET `student_id` = LPAD(REGEXP_REPLACE(`id`, '[^0-9]', ''), 6, '0')
WHERE `student_id` IS NULL OR `student_id` = '';

-- Add uniqueness constraint
ALTER TABLE `students`
  ADD UNIQUE KEY IF NOT EXISTS `uq_student_numeric_id` (`student_id`);

