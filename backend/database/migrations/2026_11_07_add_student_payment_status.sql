-- Migration: Add Unpaid option to students.tuition_status and set default to Unpaid
-- Date: 2026-11-07

USE `edumanage_db`;

ALTER TABLE `students` 
MODIFY COLUMN `tuition_status` ENUM('Paid', 'Unpaid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Unpaid';

