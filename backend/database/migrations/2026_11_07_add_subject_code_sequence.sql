-- Migration: Add atomic Subject Code sequence table and enforce unique subject codes
-- Created: 2026-11-07

USE `edumanage_db`;

-- 1. Create atomic sequence table for Subject Codes (ENG-001, ENG-002, ...)
CREATE TABLE IF NOT EXISTS `subject_sequences` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Drop temporary test sequences table if exists
DROP TABLE IF EXISTS `sequences`;

-- 3. Ensure UNIQUE index on subjects.code
SET @dbname = DATABASE();
SET @tablename = 'subjects';
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
    'ALTER TABLE `subjects` ADD UNIQUE INDEX `idx_subject_code_unique` (`code`)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

