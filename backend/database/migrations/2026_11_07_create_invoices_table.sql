-- Migration: Complete Invoices and Tuition Payments System
-- Date: 2026-11-07
-- Description: Creates official invoices table and connects with student_payments for full production tracking.

USE `edumanage_db`;
SET NAMES utf8mb4;

-- 1. Create invoices table
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `invoice_no` VARCHAR(64) NOT NULL UNIQUE,
    `student_id` VARCHAR(32) NOT NULL,
    `fee_type` VARCHAR(50) NOT NULL DEFAULT 'Tuition Fee',
    `term` VARCHAR(100) NOT NULL DEFAULT 'Term 4 (Nov - Jan 2026)',
    `academic_year` VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    `amount_due` DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `balance` DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    `due_date` DATE NOT NULL,
    `status` ENUM('Paid', 'Partial', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_invoices_student` (`student_id`),
    INDEX `idx_invoices_due_date` (`due_date`),
    INDEX `idx_invoices_status` (`status`),
    CONSTRAINT `fk_invoices_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add invoice_id and reference_no to student_payments if not exists
ALTER TABLE `student_payments` ADD COLUMN IF NOT EXISTS `invoice_id` VARCHAR(36) NULL AFTER `student_id`;
ALTER TABLE `student_payments` ADD COLUMN IF NOT EXISTS `reference_no` VARCHAR(64) NULL AFTER `payment_method`;

-- 3. Seed real invoices for existing students based on their enrolled tuition
INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-01', 'INV-2026-001', 'STU-1020', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 100.00, 0.00, '2026-10-15', 'Paid', 'Term 4 English Tuition Fee')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-02', 'INV-2026-002', 'STU-1021', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 100.00, 0.00, '2026-10-15', 'Paid', 'Term 4 English Tuition Fee')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-03', 'INV-2026-003', 'STU-1022', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 0.00, 100.00, '2026-10-30', 'Unpaid', 'Term 4 English Tuition Fee - Overdue')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-04', 'INV-2026-004', 'STU-1023', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 100.00, 0.00, '2026-10-15', 'Paid', 'Term 4 English Tuition Fee')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-05', 'INV-2026-005', 'STU-1024', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 100.00, 0.00, '2026-10-15', 'Paid', 'Term 4 English Tuition Fee')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-06', 'INV-2026-006', 'STU-1025', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 50.00, 50.00, '2026-11-20', 'Partial', 'Term 4 English Tuition Fee - 50% paid')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-07', 'INV-2026-007', 'STU-1026', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 100.00, 0.00, '2026-10-15', 'Paid', 'Term 4 English Tuition Fee')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-08', 'INV-2026-008', 'STU-1027', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 0.00, 100.00, '2026-10-25', 'Unpaid', 'Term 4 English Tuition Fee - Overdue')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `fee_type`, `term`, `academic_year`, `amount_due`, `amount_paid`, `balance`, `due_date`, `status`, `notes`)
VALUES
('INV-CAM-2026-09', 'INV-2026-009', 'STU-1028', 'Tuition Fee', 'Term 4 (Nov - Jan 2026)', '2026-2027', 100.00, 100.00, 0.00, '2026-10-15', 'Paid', 'Term 4 English Tuition Fee')
ON DUPLICATE KEY UPDATE `amount_paid` = VALUES(`amount_paid`), `balance` = VALUES(`balance`), `status` = VALUES(`status`);

-- 4. Associate existing payments with corresponding invoices
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-01' WHERE `student_id` = 'STU-1020' AND `invoice_id` IS NULL;
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-02' WHERE `student_id` = 'STU-1021' AND `invoice_id` IS NULL;
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-04' WHERE `student_id` = 'STU-1023' AND `invoice_id` IS NULL;
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-05' WHERE `student_id` = 'STU-1024' AND `invoice_id` IS NULL;
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-06' WHERE `student_id` = 'STU-1025' AND `invoice_id` IS NULL;
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-07' WHERE `student_id` = 'STU-1026' AND `invoice_id` IS NULL;
UPDATE `student_payments` SET `invoice_id` = 'INV-CAM-2026-09' WHERE `student_id` = 'STU-1028' AND `invoice_id` IS NULL;

