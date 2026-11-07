-- Migration: Complete Student Payment Status & Payments Module
-- Date: 2026-11-07
-- Description: Supports Paid, Partial, and Unpaid tuition payment tracking with permanent transaction records.

-- 1. Modify tuition_status on students table to support 'Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue'
ALTER TABLE `students` MODIFY COLUMN `tuition_status` ENUM('Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Unpaid';

-- 2. Add tuition_fee column to students table (default $100.00)
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `tuition_fee` DECIMAL(10,2) NOT NULL DEFAULT 100.00;

-- 3. Create student_payments table for transaction-based payment records
CREATE TABLE IF NOT EXISTS `student_payments` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `student_id` VARCHAR(32) NOT NULL,
    `receipt_no` VARCHAR(64) NOT NULL UNIQUE,
    `amount` DECIMAL(10,2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'ABA Pay / KHQR',
    `payment_date` DATE NOT NULL,
    `note` VARCHAR(255) NULL,
    `recorded_by` VARCHAR(100) NOT NULL DEFAULT 'Admin',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_student_payments_student` (`student_id`),
    INDEX `idx_student_payments_date` (`payment_date`),
    CONSTRAINT `fk_student_payments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

