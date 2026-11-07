-- Migration: Repair schedule and time encoding across classes and teaching periods
-- Created: 2026-11-07

USE `edumanage_db`;

-- Set connection charset to utf8mb4
SET NAMES utf8mb4;

-- 1. Repair classes schedule, days, time
UPDATE `classes`
SET 
    `days` = 'Monday – Friday',
    `time` = '08:00 AM – 09:30 AM',
    `schedule` = 'Monday – Friday • 08:00 AM – 09:30 AM'
WHERE `id` = 'CLS-G1-ALP';

UPDATE `classes`
SET 
    `days` = 'Monday, Wednesday, Friday',
    `time` = '10:00 AM – 11:30 AM',
    `schedule` = 'Monday, Wednesday, Friday • 10:00 AM – 11:30 AM'
WHERE `id` = 'CLS-G1-PHO';

UPDATE `classes`
SET 
    `days` = 'Monday, Wednesday, Friday',
    `time` = '01:30 PM – 03:00 PM',
    `schedule` = 'Monday, Wednesday, Friday • 01:30 PM – 03:00 PM'
WHERE `id` = 'CLS-G2-VOC';

UPDATE `classes`
SET 
    `days` = 'Tuesday, Thursday',
    `time` = '10:00 AM – 11:30 AM',
    `schedule` = 'Tuesday, Thursday • 10:00 AM – 11:30 AM'
WHERE `id` = 'CLS-G4-RED';

UPDATE `classes`
SET 
    `days` = 'Monday – Friday',
    `time` = '08:00 AM – 09:30 AM',
    `schedule` = 'Monday – Friday • 08:00 AM – 09:30 AM'
WHERE `id` = 'CLS-G5-GRM';

UPDATE `classes`
SET 
    `days` = 'Monday, Wednesday, Friday',
    `time` = '09:45 AM – 11:15 AM',
    `schedule` = 'Monday, Wednesday, Friday • 09:45 AM – 11:15 AM'
WHERE `id` = 'CLS-G8-SPK';

-- 2. Repair teaching_periods
UPDATE `teaching_periods`
SET `days` = 'Monday – Friday'
WHERE `id` IN ('PRD-MORN', 'PRD-AFTN', 'PRD-EVEN');

UPDATE `teaching_periods`
SET `days` = 'Saturday & Sunday'
WHERE `id` = 'PRD-WKND';

-- 3. Clean up any corrupted double-encoded sequences across all classes
UPDATE `classes`
SET 
    `days` = REPLACE(REPLACE(REPLACE(`days`, '├óÔé¼ÔÇ£', '–'), 'â€“', '–'), '—', '–'),
    `time` = REPLACE(REPLACE(REPLACE(`time`, '├óÔé¼ÔÇ£', '–'), 'â€“', '–'), '—', '–'),
    `schedule` = REPLACE(REPLACE(REPLACE(REPLACE(`schedule`, '├óÔé¼ÔÇ£', '–'), 'â€“', '–'), '├óÔé¼┬ó', '•'), 'â€¢', '•');

