-- Migration: Add atomic Class Code sequence table and enforce unique class codes
-- Created: 2026-11-07

USE `edumanage_db`;

-- 1. Create atomic sequence table for Class Codes (CLS-001, CLS-002, ...)
CREATE TABLE IF NOT EXISTS `class_sequences` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ensure UNIQUE index on classes.code
SET @dbname = DATABASE();
SET @tablename = 'classes';
SET @columnname = 'code';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
        AND NON_UNIQUE = 0
    ) > 0,
    'SELECT 1',
    'ALTER TABLE `classes` ADD UNIQUE INDEX `idx_class_code_unique` (`code`)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Seed initial enrollments for active students if table is empty
INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G2-VOC', 'STU-1023', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G2-VOC' AND `student_id` = 'STU-1023');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G1-ALP', 'STU-1020', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G1-ALP' AND `student_id` = 'STU-1020');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G1-PHO', 'STU-1020', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G1-PHO' AND `student_id` = 'STU-1020');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G1-ALP', 'STU-1021', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G1-ALP' AND `student_id` = 'STU-1021');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G4-RED', 'STU-1021', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G4-RED' AND `student_id` = 'STU-1021');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G8-SPK', 'STU-1022', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G8-SPK' AND `student_id` = 'STU-1022');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G4-RED', 'STU-1024', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G4-RED' AND `student_id` = 'STU-1024');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G5-GRM', 'STU-1025', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G5-GRM' AND `student_id` = 'STU-1025');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G2-VOC', 'STU-1026', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G2-VOC' AND `student_id` = 'STU-1026');

INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
SELECT 'CLS-G1-PHO', 'STU-1027', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM `enrollments` WHERE `class_id` = 'CLS-G1-PHO' AND `student_id` = 'STU-1027');

