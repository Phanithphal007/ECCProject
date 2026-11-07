<?php
/**
 * EduManage ECC — Teacher Availability & Teaching Schedules API Endpoint
 * Handles CRUD operations, weekly calendar retrieval, statistics, and conflict detection.
 */

declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class ScheduleController {
    private ?PDO $db;

    public static function sanitizeSchedule(?string $str): string {
        if ($str === null || $str === '') return '';
        $str = str_replace(
            ['├óÔé¼┬ó', 'â€¢', '|ôôé¼Tó', "\xE2\x80\xA2"],
            '•',
            $str
        );
        $str = str_replace(
            ['├óÔé¼ÔÇ£', 'â€“', '|ôôé¼ÔÇØ', '├óÔé¼ÔÇ¥', 'â€”', '—', "\xE2\x80\x93", "\xC2\x96"],
            '–',
            $str
        );
        return trim((string)preg_replace('/\s+/', ' ', $str));
    }

    public function __construct() {
        $host = getenv('DB_HOST') ?: 'localhost';
        $dbname = getenv('DB_NAME') ?: 'edumanage_db';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';

        try {
            $this->db = new PDO(
                "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
                $user,
                $pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (Throwable $e) {
            $this->db = null;
        }
    }

    public function handleRequest(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? 'all';
        $id = $_GET['id'] ?? null;

        try {
            switch ($method) {
                case 'GET':
                    if ($action === 'periods') {
                        $this->getTeachingPeriods();
                    } elseif ($action === 'stats') {
                        $this->getScheduleStats();
                    } elseif ($action === 'check-conflict') {
                        $this->checkScheduleConflict();
                    } elseif ($action === 'availability') {
                        $this->getTeacherAvailability();
                    } elseif ($action === 'teaching-schedules') {
                        $this->getTeachingSchedules();
                    } elseif ($action === 'weekly') {
                        $this->getWeeklySchedule();
                    } else {
                        $this->getAllScheduleData();
                    }
                    break;

                case 'POST':
                    if ($action === 'create-period' || $action === 'period' || $action === 'periods') {
                        $this->createTeachingPeriod();
                    } elseif ($action === 'assign-period-teachers') {
                        $this->assignPeriodTeachers();
                    } elseif ($action === 'availability') {
                        $this->saveTeacherAvailability();
                    } elseif ($action === 'batch-availability') {
                        $this->saveBatchAvailability();
                    } elseif ($action === 'schedule') {
                        $this->createTeachingSchedule();
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Unknown POST action']);
                    }
                    break;

                case 'PUT':
                    if ($action === 'update-period' || $action === 'period' || $action === 'periods') {
                        $this->updateTeachingPeriod($id);
                    } elseif ($action === 'availability') {
                        $this->updateTeacherAvailability($id);
                    } elseif ($action === 'schedule') {
                        $this->updateTeachingSchedule($id);
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Unknown PUT action']);
                    }
                    break;

                case 'DELETE':
                    if ($action === 'delete-period' || $action === 'period' || $action === 'periods') {
                        $this->deleteTeachingPeriod($id);
                    } elseif ($action === 'remove-period-teacher') {
                        $this->removePeriodTeacher();
                    } elseif ($action === 'availability') {
                        $this->deleteTeacherAvailability($id);
                    } elseif ($action === 'schedule') {
                        $this->deleteTeachingSchedule($id);
                    } else {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Unknown DELETE action']);
                    }
                    break;

                default:
                    http_response_code(405);
                    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Parse day strings into array of individual day names.
     */
    public static function expandDays(string $daysStr): array {
        $str = strtolower(trim($daysStr));
        if (empty($str)) return [];

        if (str_contains($str, 'mon') && str_contains($str, 'fri') && (str_contains($str, '–') || str_contains($str, '-'))) {
            return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        }
        if (str_contains($str, 'mon') && str_contains($str, 'sat') && (str_contains($str, '–') || str_contains($str, '-'))) {
            return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        }
        if (str_contains($str, 'sat') && str_contains($str, 'sun')) {
            return ['Saturday', 'Sunday'];
        }

        $allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $matched = [];
        foreach ($allDays as $d) {
            $short = strtolower(substr($d, 0, 3));
            if (str_contains($str, strtolower($d)) || str_contains($str, $short)) {
                $matched[] = $d;
            }
        }

        return !empty($matched) ? array_values(array_unique($matched)) : ['Monday', 'Wednesday', 'Friday'];
    }

    /**
     * Convert time string (e.g. "08:00 AM", "14:30") to minutes from midnight.
     */
    public static function timeToMinutes(?string $timeStr): ?int {
        if (!$timeStr) return null;
        $clean = trim($timeStr);
        $time = strtotime($clean);
        if ($time === false) {
            // Try fallback parsing
            if (preg_match('/(\d{1,2}):(\d{2})\s*(am|pm)?/i', $clean, $m)) {
                $hour = (int)$m[1];
                $min = (int)$m[2];
                $ampm = strtolower($m[3] ?? '');
                if ($ampm === 'pm' && $hour < 12) $hour += 12;
                if ($ampm === 'am' && $hour === 12) $hour = 0;
                return ($hour * 60) + $min;
            }
            return null;
        }
        $parts = getdate($time);
        return ($parts['hours'] * 60) + $parts['minutes'];
    }

    /**
     * Checks two time ranges for overlap: [startA, endA] and [startB, endB].
     * Strict inequality: existingStart < newEnd AND existingEnd > newStart
     * Consecutive sessions (e.g. 1:30-3:00 and 3:00-4:30) do NOT overlap.
     */
    public static function doTimeRangesOverlap(?int $startA, ?int $endA, ?int $startB, ?int $endB): bool {
        if ($startA === null || $endA === null || $startB === null || $endB === null) {
            return false;
        }
        return $startA < $endB && $endA > $startB;
    }

    /**
     * Checks two date ranges for overlap: [startA, endA] and [startB, endB].
     * Null/empty end date is treated as open-ended (indefinite / far future).
     */
    public static function doDateRangesOverlap(?string $startA, ?string $endA, ?string $startB, ?string $endB): bool {
        $sA = !empty($startA) ? substr($startA, 0, 10) : '1970-01-01';
        $eA = !empty($endA) ? substr($endA, 0, 10) : '9999-12-31';
        $sB = !empty($startB) ? substr($startB, 0, 10) : '1970-01-01';
        $eB = !empty($endB) ? substr($endB, 0, 10) : '9999-12-31';

        return $sA <= $eB && $eA >= $sB;
    }

    /**
     * Comprehensive Conflict Detector Logic
     *
     * Rules:
     * 1. Different teachers teaching different classes simultaneously MUST NOT be marked as conflicts.
     * 2. Same teacher assigned to two classes at overlapping times -> CONFLICT (Teacher Double-Booking).
     * 3. Same class has two overlapping teaching sessions or duplicate assignment -> CONFLICT (Class Double-Booking).
     * 4. Consecutive sessions (e.g. 1:30-3:00 and 3:00-4:30) -> NO CONFLICT (Strict inequality).
     * 5. Session falls outside teacher's configured availability on that day -> CONFLICT.
     * 6. Session overlaps with teacher's configured break time -> CONFLICT.
     * 7. Teacher is explicitly marked Unavailable on that day -> CONFLICT.
     * 8. Teacher with no configured availability record on that day -> NO CONFLICT (unrestricted).
     * 9. Cancelled or inactive schedules are ignored.
     */
    public function detectConflicts(
        string $teacherId,
        string $daysStr,
        string $startTimeStr,
        string $endTimeStr,
        ?string $classId = null,
        ?string $effectiveStartDate = null,
        ?string $effectiveEndDate = null,
        ?string $excludeClassId = null,
        ?string $excludeScheduleId = null,
        string $status = 'Scheduled'
    ): array {
        if ($status === 'Cancelled' || $status === 'Inactive' || $status === 'Archived') {
            return ['hasConflict' => false, 'conflicts' => []];
        }

        $conflicts = [];
        $targetDays = self::expandDays($daysStr);
        $startMin = self::timeToMinutes($startTimeStr);
        $endMin = self::timeToMinutes($endTimeStr);

        // 1. Validate Time Range
        if ($startMin === null || $endMin === null || $startMin >= $endMin) {
            return [
                'hasConflict' => true,
                'conflicts' => [[
                    'type' => 'invalid_time',
                    'conflictTypeLabel' => 'Invalid Time Range',
                    'conflictingTeacher' => null,
                    'conflictingClass' => null,
                    'conflictingDay' => $daysStr,
                    'existingTime' => null,
                    'requestedTime' => "{$startTimeStr} – {$endTimeStr}",
                    'message' => 'End time must be strictly later than start time.'
                ]]
            ];
        }

        // Teacher and Class names
        $teacherName = $teacherId;
        $className = $classId ?: 'English Class';

        if ($this->db) {
            try {
                $tStmt = $this->db->prepare("SELECT name FROM `teachers` WHERE id = ?");
                $tStmt->execute([$teacherId]);
                $tRow = $tStmt->fetch();
                if ($tRow && !empty($tRow['name'])) $teacherName = $tRow['name'];

                if ($classId) {
                    $cStmt = $this->db->prepare("SELECT name FROM `classes` WHERE id = ?");
                    $cStmt->execute([$classId]);
                    $cRow = $cStmt->fetch();
                    if ($cRow && !empty($cRow['name'])) $className = $cRow['name'];
                }
            } catch (Throwable $e) {
                // Keep default names
            }
        }

        // 2. Check Teacher Availability
        $availabilities = [];
        if ($this->db) {
            try {
                $availStmt = $this->db->prepare("SELECT * FROM `teacher_availability` WHERE `teacher_id` = ?");
                $availStmt->execute([$teacherId]);
                $availabilities = $availStmt->fetchAll();
            } catch (Throwable $e) {
                $availabilities = [];
            }
        }

        $availByDay = [];
        foreach ($availabilities as $a) {
            $availByDay[$a['day_of_week']][] = $a;
        }

        foreach ($targetDays as $day) {
            // If teacher has NO configured availability on this day, they are unrestricted (NOT a conflict)
            if (!isset($availByDay[$day]) || empty($availByDay[$day])) {
                continue;
            }

            $daySlots = $availByDay[$day];
            $covered = false;

            foreach ($daySlots as $slot) {
                if ($slot['status'] === 'Unavailable') {
                    $conflicts[] = [
                        'type' => 'teacher_unavailable',
                        'conflictTypeLabel' => 'Teacher Unavailable',
                        'conflictingTeacher' => $teacherName,
                        'conflictingClass' => null,
                        'conflictingDay' => $day,
                        'existingTime' => $slot['notes'] ?? 'Unavailable All Day',
                        'requestedTime' => "{$startTimeStr} – {$endTimeStr}",
                        'message' => "Teacher {$teacherName} is marked as Unavailable on {$day}."
                    ];
                    $covered = true;
                    break;
                }

                $slotStart = self::timeToMinutes($slot['available_from']);
                $slotEnd = self::timeToMinutes($slot['available_until']);

                if ($slotStart !== null && $slotEnd !== null) {
                    if ($startMin >= $slotStart && $endMin <= $slotEnd) {
                        // Inside slot! Check break overlap
                        $breakStart = self::timeToMinutes($slot['break_start'] ?? null);
                        $breakEnd = self::timeToMinutes($slot['break_end'] ?? null);
                        if ($breakStart !== null && $breakEnd !== null) {
                            if (self::doTimeRangesOverlap($startMin, $endMin, $breakStart, $breakEnd)) {
                                $conflicts[] = [
                                    'type' => 'break_overlap',
                                    'conflictTypeLabel' => 'Break Time Overlap',
                                    'conflictingTeacher' => $teacherName,
                                    'conflictingClass' => null,
                                    'conflictingDay' => $day,
                                    'existingTime' => "{$slot['break_start']} – {$slot['break_end']}",
                                    'requestedTime' => "{$startTimeStr} – {$endTimeStr}",
                                    'message' => "Requested time ({$startTimeStr} – {$endTimeStr}) overlaps with {$teacherName}'s break ({$slot['break_start']} – {$slot['break_end']}) on {$day}."
                                ];
                            }
                        }
                        $covered = true;
                        break;
                    }
                }
            }

            if (!$covered && !empty($daySlots)) {
                $firstSlot = $daySlots[0];
                $conflicts[] = [
                    'type' => 'outside_availability',
                    'conflictTypeLabel' => 'Outside Teacher Availability',
                    'conflictingTeacher' => $teacherName,
                    'conflictingClass' => null,
                    'conflictingDay' => $day,
                    'existingTime' => "{$firstSlot['available_from']} – {$firstSlot['available_until']}",
                    'requestedTime' => "{$startTimeStr} – {$endTimeStr}",
                    'message' => "Requested time ({$startTimeStr} – {$endTimeStr}) falls outside {$teacherName}'s available hours on {$day} ({$firstSlot['available_from']} – {$firstSlot['available_until']})."
                ];
            }
        }

        // 3. Collect active schedules to test for Teacher & Class double booking
        $activeAssignments = [];
        if ($this->db) {
            try {
                // Teacher's other active schedules
                $q1 = "
                    SELECT s.id AS scheduleId, s.class_id AS classId, c.name AS className,
                           s.teacher_id AS teacherId, t.name AS teacherName, s.days,
                           s.start_time AS startTime, s.end_time AS endTime,
                           s.effective_start_date AS effectiveStartDate,
                           s.effective_end_date AS effectiveEndDate, s.status
                    FROM `teacher_schedules` s
                    LEFT JOIN `classes` c ON s.class_id = c.id
                    LEFT JOIN `teachers` t ON s.teacher_id = t.id
                    WHERE (s.teacher_id = ? OR (? IS NOT NULL AND s.class_id = ?))
                      AND s.status NOT IN ('Cancelled', 'Inactive', 'Archived')
                ";
                $st1 = $this->db->prepare($q1);
                $st1->execute([$teacherId, $classId, $classId]);
                $activeAssignments = $st1->fetchAll();

                // Also check classes table
                $q2 = "
                    SELECT NULL AS scheduleId, c.id AS classId, c.name AS className,
                           c.teacher_id AS teacherId, t.name AS teacherName, c.days,
                           c.time, NULL AS effectiveStartDate, NULL AS effectiveEndDate, c.status
                    FROM `classes` c
                    LEFT JOIN `teachers` t ON c.teacher_id = t.id
                    WHERE (c.teacher_id = ? OR (? IS NOT NULL AND c.id = ?))
                      AND c.status = 'Active'
                ";
                $st2 = $this->db->prepare($q2);
                $st2->execute([$teacherId, $classId, $classId]);
                $clsRows = $st2->fetchAll();

                $registeredKeys = [];
                foreach ($activeAssignments as $a) {
                    $registeredKeys[$a['classId'] . '_' . $a['teacherId']] = true;
                }

                foreach ($clsRows as $cr) {
                    $k = $cr['classId'] . '_' . $cr['teacherId'];
                    if (isset($registeredKeys[$k])) continue;

                    $tRange = explode('-', str_replace('–', '-', $cr['time'] ?? ''));
                    $cr['startTime'] = trim($tRange[0] ?? '');
                    $cr['endTime'] = trim($tRange[1] ?? '');
                    $activeAssignments[] = $cr;
                }
            } catch (Throwable $e) {
                // Ignore DB error
            }
        }

        // 4. Check Teacher Double-Booking (Same Teacher, Different Classes, Overlapping Time)
        // RULE: Different teachers teaching different classes simultaneously MUST NOT be marked as conflicts.
        foreach ($activeAssignments as $cand) {
            if ($cand['teacherId'] !== $teacherId) continue;
            if ($excludeScheduleId && !empty($cand['scheduleId']) && $cand['scheduleId'] === $excludeScheduleId) continue;
            if ($excludeClassId && !empty($cand['classId']) && $cand['classId'] === $excludeClassId) continue;
            if ($classId && !empty($cand['classId']) && $cand['classId'] === $classId) continue;

            // Date range overlap check
            if (!self::doDateRangesOverlap($effectiveStartDate, $effectiveEndDate, $cand['effectiveStartDate'] ?? null, $cand['effectiveEndDate'] ?? null)) {
                continue;
            }

            // Days overlap check
            $candDays = self::expandDays($cand['days'] ?? '');
            $commonDays = array_intersect($targetDays, $candDays);
            if (empty($commonDays)) continue;

            // Time overlap check: existingStart < newEnd AND existingEnd > newStart
            $candStart = self::timeToMinutes($cand['startTime'] ?? null);
            $candEnd = self::timeToMinutes($cand['endTime'] ?? null);

            if ($candStart !== null && $candEnd !== null) {
                if (self::doTimeRangesOverlap($startMin, $endMin, $candStart, $candEnd)) {
                    $daysList = implode(', ', $commonDays);
                    $conflicts[] = [
                        'type' => 'teacher_double_booking',
                        'conflictTypeLabel' => 'Teacher Double-Booking',
                        'conflictingTeacher' => $cand['teacherName'] ?? $teacherName,
                        'conflictingTeacherId' => $cand['teacherId'],
                        'conflictingClass' => $cand['className'] ?? $cand['classId'],
                        'conflictingClassId' => $cand['classId'],
                        'conflictingDay' => $daysList,
                        'existingTime' => "{$cand['startTime']} – {$cand['endTime']}",
                        'requestedTime' => "{$startTimeStr} – {$endTimeStr}",
                        'message' => "Teacher {$teacherName} is already assigned to '{$cand['className']}' on {$daysList} ({$cand['startTime']} – {$cand['endTime']})."
                    ];
                }
            }
        }

        // 5. Check Class Double-Booking (Same Class, Overlapping Sessions)
        // RULE: Different classes can operate simultaneously.
        if ($classId) {
            foreach ($activeAssignments as $cand) {
                if ($cand['classId'] !== $classId) continue;
                if ($excludeScheduleId && !empty($cand['scheduleId']) && $cand['scheduleId'] === $excludeScheduleId) continue;

                // Date range overlap check
                if (!self::doDateRangesOverlap($effectiveStartDate, $effectiveEndDate, $cand['effectiveStartDate'] ?? null, $cand['effectiveEndDate'] ?? null)) {
                    continue;
                }

                // Days overlap check
                $candDays = self::expandDays($cand['days'] ?? '');
                $commonDays = array_intersect($targetDays, $candDays);
                if (empty($commonDays)) continue;

                // Time overlap check
                $candStart = self::timeToMinutes($cand['startTime'] ?? null);
                $candEnd = self::timeToMinutes($cand['endTime'] ?? null);

                if ($candStart !== null && $candEnd !== null) {
                    if (self::doTimeRangesOverlap($startMin, $endMin, $candStart, $candEnd) || ($startMin === $candStart && $endMin === $candEnd)) {
                        $daysList = implode(', ', $commonDays);
                        $conflicts[] = [
                            'type' => 'class_double_booking',
                            'conflictTypeLabel' => 'Class Double-Booking',
                            'conflictingTeacher' => $cand['teacherName'] ?? 'Assigned Teacher',
                            'conflictingTeacherId' => $cand['teacherId'] ?? null,
                            'conflictingClass' => $className,
                            'conflictingClassId' => $classId,
                            'conflictingDay' => $daysList,
                            'existingTime' => "{$cand['startTime']} – {$cand['endTime']}",
                            'requestedTime' => "{$startTimeStr} – {$endTimeStr}",
                            'message' => "Class '{$className}' already has a session scheduled on {$daysList} ({$cand['startTime']} – {$cand['endTime']})."
                        ];
                    }
                }
            }
        }

        return [
            'hasConflict' => count($conflicts) > 0,
            'conflicts' => $conflicts
        ];
    }

    private function getScheduleStats(): void {
        if (!$this->db) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'totalActiveTeachers' => 4,
                    'totalScheduledClasses' => 26,
                    'availableTeachingSlots' => 18,
                    'scheduleConflicts' => 0
                ]
            ]);
            return;
        }

        $tchCount = (int)$this->db->query("SELECT COUNT(*) FROM `teachers` WHERE `status` = 'Active'")->fetchColumn();
        $clsCount = (int)$this->db->query("SELECT COUNT(*) FROM `classes` WHERE `status` = 'Active' AND `teacher_id` IS NOT NULL")->fetchColumn();
        $slotCount = (int)$this->db->query("SELECT COUNT(*) FROM `teacher_availability` WHERE `status` IN ('Available', 'Preferred')")->fetchColumn();

        // Count genuine conflicts across active classes and schedules
        $allActiveClasses = $this->db->query("SELECT id, teacher_id, name, days, time FROM `classes` WHERE `status` = 'Active' AND `teacher_id` IS NOT NULL")->fetchAll();
        $conflictsCount = 0;
        $seen = [];

        foreach ($allActiveClasses as $i => $cA) {
            foreach ($allActiveClasses as $j => $cB) {
                if ($i >= $j) continue;

                $sameTeacher = ($cA['teacher_id'] === $cB['teacher_id']);
                $sameClass = ($cA['id'] === $cB['id']);

                // RULE: Different teachers teaching different classes simultaneously MUST NOT be counted
                if (!$sameTeacher && !$sameClass) continue;

                $pairKey = $cA['id'] . '_' . $cB['id'];
                if (isset($seen[$pairKey])) continue;

                $common = array_intersect(self::expandDays($cA['days']), self::expandDays($cB['days']));
                if (!empty($common)) {
                    $tA = explode('-', str_replace('–', '-', $cA['time'] ?? ''));
                    $tB = explode('-', str_replace('–', '-', $cB['time'] ?? ''));
                    $sA = self::timeToMinutes($tA[0] ?? null);
                    $eA = self::timeToMinutes($tA[1] ?? null);
                    $sB = self::timeToMinutes($tB[0] ?? null);
                    $eB = self::timeToMinutes($tB[1] ?? null);
                    if ($sA && $eA && $sB && $eB && self::doTimeRangesOverlap($sA, $eA, $sB, $eB)) {
                        $conflictsCount++;
                        $seen[$pairKey] = true;
                    }
                }
            }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'totalActiveTeachers' => $tchCount,
                'totalScheduledClasses' => $clsCount,
                'availableTeachingSlots' => $slotCount,
                'scheduleConflicts' => $conflictsCount
            ]
        ]);
    }

    private function checkScheduleConflict(): void {
        $teacherId = $_GET['teacher_id'] ?? '';
        $days = $_GET['days'] ?? '';
        $startTime = $_GET['start_time'] ?? '';
        $endTime = $_GET['end_time'] ?? '';
        $classId = $_GET['class_id'] ?? null;
        $effectiveStartDate = $_GET['effective_start_date'] ?? null;
        $effectiveEndDate = $_GET['effective_end_date'] ?? null;
        $excludeClassId = $_GET['exclude_class_id'] ?? null;
        $excludeScheduleId = $_GET['exclude_schedule_id'] ?? null;
        $status = $_GET['status'] ?? 'Scheduled';

        if (empty($teacherId) || empty($days) || empty($startTime) || empty($endTime)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'teacher_id, days, start_time, and end_time are required']);
            return;
        }

        $result = $this->detectConflicts(
            $teacherId,
            $days,
            $startTime,
            $endTime,
            $classId,
            $effectiveStartDate,
            $effectiveEndDate,
            $excludeClassId,
            $excludeScheduleId,
            $status
        );
        echo json_encode(['success' => true, 'data' => $result]);
    }

    private function getTeacherAvailability(): void {
        $teacherId = $_GET['teacher_id'] ?? null;

        if (!$this->db) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }

        $query = "SELECT a.*, t.name AS teacherName, t.role AS teacherRole, t.avatar AS teacherAvatar FROM `teacher_availability` a INNER JOIN `teachers` t ON a.teacher_id = t.id";
        $params = [];
        if ($teacherId) {
            $query .= " WHERE a.teacher_id = ?";
            $params[] = $teacherId;
        }
        $query .= " ORDER BY FIELD(a.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), a.available_from ASC";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $rows]);
    }

    private function getTeachingSchedules(): void {
        $teacherId = $_GET['teacher_id'] ?? null;
        $status = $_GET['status'] ?? null;

        if (!$this->db) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }

        $query = "
            SELECT 
                c.id AS classId,
                c.code AS classCode,
                c.name AS className,
                c.teacher_id AS teacherId,
                t.name AS teacherName,
                t.avatar AS teacherAvatar,
                s.name AS subjectName,
                COALESCE(c.student_location, c.room, 'Student\'s Home') AS studentLocation,
                c.days,
                c.time,
                c.schedule,
                c.academic_year AS academicYear,
                c.capacity,
                c.status,
                COUNT(e.student_id) AS enrolledCount
            FROM `classes` c
            LEFT JOIN `teachers` t ON c.teacher_id = t.id
            LEFT JOIN `subjects` s ON c.subject_id = s.id
            LEFT JOIN `enrollments` e ON c.id = e.class_id AND e.status = 'Active'
            WHERE 1=1
        ";
        $params = [];

        if ($teacherId) {
            $query .= " AND c.teacher_id = ?";
            $params[] = $teacherId;
        }
        if ($status && $status !== 'All') {
            $query .= " AND c.status = ?";
            $params[] = $status;
        }

        $query .= " GROUP BY c.id ORDER BY c.days ASC, c.time ASC";
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $classes = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $classes]);
    }

    private function getWeeklySchedule(): void {
        $teacherId = $_GET['teacher_id'] ?? null;

        if (!$this->db) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }

        // Retrieve active classes with teachers
        $query = "
            SELECT 
                c.id,
                c.code,
                c.name,
                c.days,
                c.time,
                c.schedule,
                COALESCE(c.student_location, c.room, 'Student\'s Home') AS location,
                c.teacher_id AS teacherId,
                t.name AS teacherName,
                t.avatar AS teacherAvatar,
                s.name AS subjectName,
                COUNT(e.student_id) AS enrolledCount
            FROM `classes` c
            INNER JOIN `teachers` t ON c.teacher_id = t.id
            LEFT JOIN `subjects` s ON c.subject_id = s.id
            LEFT JOIN `enrollments` e ON c.id = e.class_id AND e.status = 'Active'
            WHERE c.status = 'Active'
        ";
        $params = [];
        if ($teacherId) {
            $query .= " AND c.teacher_id = ?";
            $params[] = $teacherId;
        }
        $query .= " GROUP BY c.id";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $weekMap = [
            'Monday' => [],
            'Tuesday' => [],
            'Wednesday' => [],
            'Thursday' => [],
            'Friday' => [],
            'Saturday' => [],
            'Sunday' => []
        ];

        foreach ($rows as $cls) {
            $expanded = self::expandDays($cls['days'] ?? '');
            $timeParts = explode('-', str_replace('–', '-', $cls['time'] ?? ''));
            $startTime = trim($timeParts[0] ?? '08:00 AM');
            $endTime = trim($timeParts[1] ?? '09:30 AM');

            foreach ($expanded as $day) {
                if (isset($weekMap[$day])) {
                    $weekMap[$day][] = [
                        'classId' => $cls['id'],
                        'classCode' => $cls['code'],
                        'className' => $cls['name'],
                        'subjectName' => $cls['subjectName'],
                        'teacherId' => $cls['teacherId'],
                        'teacherName' => $cls['teacherName'],
                        'teacherAvatar' => $cls['teacherAvatar'],
                        'startTime' => $startTime,
                        'endTime' => $endTime,
                        'location' => $cls['location'],
                        'enrolledCount' => (int)$cls['enrolledCount']
                    ];
                }
            }
        }

        // Sort sessions by start time
        foreach ($weekMap as $day => &$sessions) {
            usort($sessions, function($a, $b) {
                return (ScheduleController::timeToMinutes($a['startTime']) ?? 0) - (ScheduleController::timeToMinutes($b['startTime']) ?? 0);
            });
        }

        echo json_encode(['success' => true, 'data' => $weekMap]);
    }

    private function getAllScheduleData(): void {
        $this->getScheduleStats();
    }

    private function saveTeacherAvailability(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['teacherId']) || empty($input['dayOfWeek'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'teacherId and dayOfWeek are required']);
            return;
        }

        $id = $input['id'] ?? ('AVL-' . rand(1000, 9999));
        $teacherId = $input['teacherId'];
        $dayOfWeek = $input['dayOfWeek'];
        $availFrom = $input['availableFrom'] ?? '08:00 AM';
        $availUntil = $input['availableUntil'] ?? '05:00 PM';
        $breakStart = !empty($input['breakStart']) ? $input['breakStart'] : null;
        $breakEnd = !empty($input['breakEnd']) ? $input['breakEnd'] : null;
        $status = $input['status'] ?? 'Available';
        $notes = $input['notes'] ?? null;

        if ($this->db) {
            $stmt = $this->db->prepare("
                INSERT INTO `teacher_availability` (
                    `id`, `teacher_id`, `day_of_week`, `available_from`, `available_until`,
                    `break_start`, `break_end`, `status`, `notes`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `available_from` = VALUES(`available_from`),
                    `available_until` = VALUES(`available_until`),
                    `break_start` = VALUES(`break_start`),
                    `break_end` = VALUES(`break_end`),
                    `status` = VALUES(`status`),
                    `notes` = VALUES(`notes`)
            ");
            $stmt->execute([
                $id, $teacherId, $dayOfWeek, $availFrom, $availUntil,
                $breakStart, $breakEnd, $status, $notes
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Teacher availability slot saved successfully',
            'data' => array_merge($input, ['id' => $id])
        ]);
    }

    private function saveBatchAvailability(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $teacherId = $input['teacherId'] ?? null;
        $slots = $input['slots'] ?? [];

        if (!$teacherId || !is_array($slots)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'teacherId and slots array are required']);
            return;
        }

        if ($this->db) {
            $this->db->beginTransaction();
            try {
                // Delete existing availability for this teacher
                $del = $this->db->prepare("DELETE FROM `teacher_availability` WHERE `teacher_id` = ?");
                $del->execute([$teacherId]);

                $insert = $this->db->prepare("
                    INSERT INTO `teacher_availability` (
                        `id`, `teacher_id`, `day_of_week`, `available_from`, `available_until`,
                        `break_start`, `break_end`, `status`, `notes`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                foreach ($slots as $idx => $s) {
                    $id = $s['id'] ?? ('AVL-' . $teacherId . '-' . $idx . '-' . rand(100, 999));
                    $insert->execute([
                        $id,
                        $teacherId,
                        $s['dayOfWeek'],
                        $s['availableFrom'] ?? '08:00 AM',
                        $s['availableUntil'] ?? '05:00 PM',
                        !empty($s['breakStart']) ? $s['breakStart'] : null,
                        !empty($s['breakEnd']) ? $s['breakEnd'] : null,
                        $s['status'] ?? 'Available',
                        $s['notes'] ?? null
                    ]);
                }

                $this->db->commit();
            } catch (Throwable $e) {
                $this->db->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                return;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Teacher weekly availability updated successfully',
            'data' => $slots
        ]);
    }

    private function createTeachingSchedule(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['teacherId']) || empty($input['classId'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'teacherId and classId are required']);
            return;
        }

        $teacherId = $input['teacherId'];
        $classId = $input['classId'];
        $days = $input['days'] ?? 'Monday – Friday';
        $startTime = $input['startTime'] ?? '08:00 AM';
        $endTime = $input['endTime'] ?? '09:30 AM';
        $effectiveStart = $input['effectiveStartDate'] ?? date('Y-m-d');
        $effectiveEnd = !empty($input['effectiveEndDate']) ? $input['effectiveEndDate'] : null;
        $academicYear = $input['academicYear'] ?? '2026-2027';
        $status = $input['status'] ?? 'Scheduled';
        $notes = $input['notes'] ?? null;
        $override = !empty($input['overrideConflict']);

        // Check conflicts unless explicitly overridden by authorized Admin
        if (!$override) {
            $conflictCheck = $this->detectConflicts(
                $teacherId,
                $days,
                $startTime,
                $endTime,
                $classId,
                $effectiveStart,
                $effectiveEnd,
                $classId,
                $input['id'] ?? null,
                $status
            );
            if ($conflictCheck['hasConflict']) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'hasConflict' => true,
                    'error' => 'Schedule conflict detected. Please resolve conflicts or check Admin Override.',
                    'conflicts' => $conflictCheck['conflicts']
                ]);
                return;
            }
        }

        $id = $input['id'] ?? ('SCH-' . rand(1000, 9999));

        if ($this->db) {
            $this->db->beginTransaction();
            try {
                // Update class assigned teacher and schedule
                $formattedTime = "{$startTime} – {$endTime}";
                $scheduleStr = "{$days} • {$formattedTime}";
                $periodId = !empty($input['periodId']) ? $input['periodId'] : null;
                $upCls = $this->db->prepare("
                    UPDATE `classes`
                    SET `teacher_id` = ?,
                        `period_id` = COALESCE(?, `period_id`),
                        `days` = ?,
                        `time` = ?,
                        `schedule` = ?
                    WHERE `id` = ?
                ");
                $upCls->execute([$teacherId, $periodId, $days, $formattedTime, $scheduleStr, $classId]);

                // Insert into teacher_schedules table
                $ins = $this->db->prepare("
                    INSERT INTO `teacher_schedules` (
                        `id`, `teacher_id`, `class_id`, `period_id`, `days`, `start_time`, `end_time`,
                        `effective_start_date`, `effective_end_date`, `academic_year`, `status`, `notes`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $ins->execute([
                    $id, $teacherId, $classId, $periodId, $days, $startTime, $endTime,
                    $effectiveStart, $effectiveEnd, $academicYear, $status, $notes
                ]);

                $this->db->commit();
            } catch (Throwable $e) {
                $this->db->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                return;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Teaching schedule assigned successfully',
            'data' => array_merge($input, ['id' => $id])
        ]);
    }

    private function updateTeacherAvailability(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $slotId = $id ?? ($input['id'] ?? null);

        if (!$slotId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Availability ID is required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("
                UPDATE `teacher_availability`
                SET `available_from` = COALESCE(?, `available_from`),
                    `available_until` = COALESCE(?, `available_until`),
                    `break_start` = ?,
                    `break_end` = ?,
                    `status` = COALESCE(?, `status`),
                    `notes` = COALESCE(?, `notes`)
                WHERE `id` = ?
            ");
            $stmt->execute([
                $input['availableFrom'] ?? null,
                $input['availableUntil'] ?? null,
                !empty($input['breakStart']) ? $input['breakStart'] : null,
                !empty($input['breakEnd']) ? $input['breakEnd'] : null,
                $input['status'] ?? null,
                $input['notes'] ?? null,
                $slotId
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Availability slot updated successfully']);
    }

    private function updateTeachingSchedule(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $schId = $id ?? ($input['id'] ?? null);

        if (!$schId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Schedule ID is required']);
            return;
        }

        $override = !empty($input['overrideConflict']);

        if (!$override && (!empty($input['teacherId']) || !empty($input['days']) || !empty($input['startTime']))) {
            $curSch = null;
            if ($this->db) {
                try {
                    $cStmt = $this->db->prepare("SELECT * FROM `teacher_schedules` WHERE id = ?");
                    $cStmt->execute([$schId]);
                    $curSch = $cStmt->fetch();
                } catch (Throwable $e) {}
            }

            $tId = $input['teacherId'] ?? ($curSch['teacher_id'] ?? '');
            $cId = $input['classId'] ?? ($curSch['class_id'] ?? null);
            $dStr = $input['days'] ?? ($curSch['days'] ?? '');
            $sTime = $input['startTime'] ?? ($curSch['start_time'] ?? '');
            $eTime = $input['endTime'] ?? ($curSch['end_time'] ?? '');
            $effStart = $input['effectiveStartDate'] ?? ($curSch['effective_start_date'] ?? null);
            $effEnd = $input['effectiveEndDate'] ?? ($curSch['effective_end_date'] ?? null);
            $st = $input['status'] ?? ($curSch['status'] ?? 'Scheduled');

            if (!empty($tId) && !empty($dStr) && !empty($sTime) && !empty($eTime)) {
                $check = $this->detectConflicts($tId, $dStr, $sTime, $eTime, $cId, $effStart, $effEnd, null, $schId, $st);
                if ($check['hasConflict']) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'hasConflict' => true,
                        'error' => 'Schedule conflict detected. Please resolve conflicts or check Admin Override.',
                        'conflicts' => $check['conflicts']
                    ]);
                    return;
                }
            }
        }

        if ($this->db) {
            $stmt = $this->db->prepare("
                UPDATE `teacher_schedules`
                SET `days` = COALESCE(?, `days`),
                    `start_time` = COALESCE(?, `start_time`),
                    `end_time` = COALESCE(?, `end_time`),
                    `status` = COALESCE(?, `status`),
                    `notes` = COALESCE(?, `notes`)
                WHERE `id` = ?
            ");
            $stmt->execute([
                $input['days'] ?? null,
                $input['startTime'] ?? null,
                $input['endTime'] ?? null,
                $input['status'] ?? null,
                $input['notes'] ?? null,
                $schId
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Teaching schedule updated successfully']);
    }

    private function deleteTeacherAvailability(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Availability ID is required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("DELETE FROM `teacher_availability` WHERE `id` = ?");
            $stmt->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Availability slot deleted successfully']);
    }

    private function deleteTeachingSchedule(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Schedule ID is required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("DELETE FROM `teacher_schedules` WHERE `id` = ?");
            $stmt->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Teaching schedule removed successfully']);
    }

    /**
     * Teaching Period Management Methods
     */
    private function getTeachingPeriods(): void {
        if (!$this->db) {
            // Fallback periods for development / offline MySQL
            $fallbackPeriods = [
                [
                    'id' => 'PRD-MORN',
                    'name' => 'Morning Period',
                    'startTime' => '08:00 AM',
                    'endTime' => '12:00 PM',
                    'days' => 'Monday – Friday',
                    'status' => 'Active',
                    'description' => 'Primary and foundational morning curriculum block',
                    'assignedTeachers' => [
                        ['id' => 'TCH-01', 'name' => 'Teacher Sophea Heng', 'role' => 'Head of Primary English', 'avatar' => 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', 'assignedDays' => 'Monday – Friday'],
                        ['id' => 'TCH-02', 'name' => 'Teacher Michael Davies', 'role' => 'Lower Secondary Lead', 'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'assignedDays' => 'Monday, Wednesday, Friday'],
                        ['id' => 'TCH-03', 'name' => 'Teacher Sovannary Long', 'role' => 'Young Learners Specialist', 'avatar' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'assignedDays' => 'Monday – Friday']
                    ],
                    'activeClassesCount' => 3
                ],
                [
                    'id' => 'PRD-AFTN',
                    'name' => 'Afternoon Period',
                    'startTime' => '01:00 PM',
                    'endTime' => '05:00 PM',
                    'days' => 'Monday – Friday',
                    'status' => 'Active',
                    'description' => 'Core secondary and writing development block',
                    'assignedTeachers' => [
                        ['id' => 'TCH-01', 'name' => 'Teacher Sophea Heng', 'role' => 'Head of Primary English', 'avatar' => 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', 'assignedDays' => 'Monday – Friday'],
                        ['id' => 'TCH-02', 'name' => 'Teacher Michael Davies', 'role' => 'Lower Secondary Lead', 'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'assignedDays' => 'Monday, Wednesday, Friday'],
                        ['id' => 'TCH-03', 'name' => 'Teacher Sovannary Long', 'role' => 'Young Learners Specialist', 'avatar' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'assignedDays' => 'Monday – Friday'],
                        ['id' => 'TCH-04', 'name' => 'Teacher David Miller', 'role' => 'Upper Secondary & Exam Lead', 'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'assignedDays' => 'Monday – Friday']
                    ],
                    'activeClassesCount' => 4
                ],
                [
                    'id' => 'PRD-EVEN',
                    'name' => 'Evening Period',
                    'startTime' => '05:00 PM',
                    'endTime' => '08:00 PM',
                    'days' => 'Monday – Friday',
                    'status' => 'Active',
                    'description' => 'Adult conversational and exam prep classes',
                    'assignedTeachers' => [
                        ['id' => 'TCH-04', 'name' => 'Teacher David Miller', 'role' => 'Upper Secondary & Exam Lead', 'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'assignedDays' => 'Monday – Friday']
                    ],
                    'activeClassesCount' => 0
                ],
                [
                    'id' => 'PRD-WKND',
                    'name' => 'Weekend Literacy Period',
                    'startTime' => '08:00 AM',
                    'endTime' => '04:30 PM',
                    'days' => 'Saturday & Sunday',
                    'status' => 'Active',
                    'description' => 'Weekend intensive literacy club and IELTS coaching',
                    'assignedTeachers' => [
                        ['id' => 'TCH-03', 'name' => 'Teacher Sovannary Long', 'role' => 'Young Learners Specialist', 'avatar' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'assignedDays' => 'Saturday & Sunday'],
                        ['id' => 'TCH-04', 'name' => 'Teacher David Miller', 'role' => 'Upper Secondary & Exam Lead', 'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'assignedDays' => 'Saturday & Sunday']
                    ],
                    'activeClassesCount' => 0
                ]
            ];
            echo json_encode(['success' => true, 'data' => $fallbackPeriods]);
            return;
        }

        try {
            $pStmt = $this->db->query("SELECT * FROM `teaching_periods` ORDER BY FIELD(status, 'Active', 'Inactive'), start_time ASC");
            $periods = $pStmt->fetchAll();

            $result = [];
            foreach ($periods as $p) {
                // 1. Query active classes strictly assigned to this period with a valid teacher and active schedule
                $clsStmt = $this->db->prepare("
                    SELECT DISTINCT 
                        c.id, c.code, c.name, c.days, c.time, c.student_location, c.capacity,
                        t.id AS teacher_id, t.name AS teacher_name, t.avatar AS teacher_avatar,
                        s.name AS subject_name
                    FROM `classes` c
                    INNER JOIN `teachers` t ON c.teacher_id = t.id AND t.id != '' AND t.status = 'Active'
                    LEFT JOIN `subjects` s ON c.subject_id = s.id
                    LEFT JOIN `teacher_schedules` ts ON ts.class_id = c.id AND ts.teacher_id = t.id
                    WHERE c.status = 'Active'
                      AND (c.period_id = :p_id OR ts.period_id = :p_id_2)
                      AND (
                          ts.id IS NULL 
                          OR (
                              ts.status NOT IN ('Cancelled', 'Inactive')
                              AND ts.effective_start_date <= CURDATE()
                              AND (ts.effective_end_date IS NULL OR ts.effective_end_date >= CURDATE())
                          )
                      )
                    ORDER BY c.name ASC
                ");
                $clsStmt->execute([
                    ':p_id' => $p['id'],
                    ':p_id_2' => $p['id']
                ]);
                $periodClasses = $clsStmt->fetchAll();

                // 2. Query distinct instructors assigned via period_teachers OR assigned to active classes in this period
                $tStmt = $this->db->prepare("
                    SELECT DISTINCT t.id, t.name, t.role, t.avatar, t.phone, t.email, t.specialization,
                           COALESCE(pt.assigned_days, p.days) AS assignedDays,
                           COALESCE(pt.status, 'Active') AS assignmentStatus
                    FROM `teachers` t
                    LEFT JOIN `period_teachers` pt ON pt.teacher_id = t.id AND pt.period_id = :p_id AND pt.status = 'Active'
                    LEFT JOIN `classes` c ON c.teacher_id = t.id AND c.period_id = :p_id_2 AND c.status = 'Active'
                    LEFT JOIN `teacher_schedules` ts ON ts.teacher_id = t.id AND ts.period_id = :p_id_3 AND ts.status NOT IN ('Cancelled', 'Inactive')
                    JOIN `teaching_periods` p ON p.id = :p_id_4
                    WHERE t.status = 'Active' AND t.id != ''
                      AND (pt.id IS NOT NULL OR c.id IS NOT NULL OR ts.id IS NOT NULL)
                    ORDER BY t.name ASC
                ");
                $tStmt->execute([
                    ':p_id' => $p['id'],
                    ':p_id_2' => $p['id'],
                    ':p_id_3' => $p['id'],
                    ':p_id_4' => $p['id']
                ]);
                $assignedTeachers = $tStmt->fetchAll();

                // 3. Count sessions across active classes in this period
                $sessionsCount = 0;
                foreach ($periodClasses as $cls) {
                    $cDays = self::expandDays($cls['days'] ?? '');
                    $sessionsCount += count($cDays);
                }

                $result[] = [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'startTime' => self::sanitizeSchedule($p['start_time']),
                    'endTime' => self::sanitizeSchedule($p['end_time']),
                    'days' => self::sanitizeSchedule($p['days']),
                    'status' => $p['status'],
                    'description' => $p['description'],
                    'assignedTeachers' => $assignedTeachers,
                    'assignedTeachersCount' => count($assignedTeachers),
                    'activeClassesCount' => count($periodClasses),
                    'sessionsCount' => $sessionsCount,
                    'classes' => array_map(function($c) {
                        $c['days'] = self::sanitizeSchedule($c['days'] ?? '');
                        $c['time'] = self::sanitizeSchedule($c['time'] ?? '');
                        return $c;
                    }, $periodClasses)
                ];
            }

            echo json_encode(['success' => true, 'data' => $result]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function createTeachingPeriod(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['name']) || empty($input['startTime']) || empty($input['endTime'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Period name, start time, and end time are required']);
            return;
        }

        $startMin = self::timeToMinutes($input['startTime']);
        $endMin = self::timeToMinutes($input['endTime']);
        if ($startMin === null || $endMin === null || $startMin >= $endMin) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'End time must be strictly later than start time']);
            return;
        }

        $id = $input['id'] ?? ('PRD-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $input['name']), 0, 4)) . '-' . rand(100, 999));
        $name = trim($input['name']);
        $startTime = $input['startTime'];
        $endTime = $input['endTime'];
        $days = $input['days'] ?? 'Monday – Friday';
        $status = $input['status'] ?? 'Active';
        $description = $input['description'] ?? null;

        if ($this->db) {
            $stmt = $this->db->prepare("
                INSERT INTO `teaching_periods` (`id`, `name`, `start_time`, `end_time`, `days`, `status`, `description`)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$id, $name, $startTime, $endTime, $days, $status, $description]);

            // If teachers were selected during creation
            if (!empty($input['teacherIds']) && is_array($input['teacherIds'])) {
                $ptStmt = $this->db->prepare("
                    INSERT INTO `period_teachers` (`id`, `period_id`, `teacher_id`, `assigned_days`, `status`)
                    VALUES (?, ?, ?, ?, 'Active')
                    ON DUPLICATE KEY UPDATE `assigned_days` = VALUES(`assigned_days`), `status` = 'Active'
                ");
                foreach ($input['teacherIds'] as $tId) {
                    $ptId = 'PT-' . $id . '-' . $tId;
                    $ptStmt->execute([$ptId, $id, $tId, $days]);
                }
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Teaching period created successfully',
            'data' => array_merge($input, ['id' => $id])
        ]);
    }

    private function updateTeachingPeriod(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $periodId = $id ?? ($input['id'] ?? null);

        if (!$periodId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Period ID is required']);
            return;
        }

        if (!empty($input['startTime']) && !empty($input['endTime'])) {
            $startMin = self::timeToMinutes($input['startTime']);
            $endMin = self::timeToMinutes($input['endTime']);
            if ($startMin === null || $endMin === null || $startMin >= $endMin) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'End time must be strictly later than start time']);
                return;
            }
        }

        if ($this->db) {
            $stmt = $this->db->prepare("
                UPDATE `teaching_periods`
                SET `name` = COALESCE(?, `name`),
                    `start_time` = COALESCE(?, `start_time`),
                    `end_time` = COALESCE(?, `end_time`),
                    `days` = COALESCE(?, `days`),
                    `status` = COALESCE(?, `status`),
                    `description` = COALESCE(?, `description`)
                WHERE `id` = ?
            ");
            $stmt->execute([
                $input['name'] ?? null,
                $input['startTime'] ?? null,
                $input['endTime'] ?? null,
                $input['days'] ?? null,
                $input['status'] ?? null,
                $input['description'] ?? null,
                $periodId
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Teaching period updated successfully']);
    }

    private function deleteTeachingPeriod(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $periodId = $id ?? ($input['id'] ?? ($_GET['id'] ?? null));

        if (!$periodId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Period ID is required']);
            return;
        }

        if ($this->db) {
            // Check if active classes depend on this period
            $checkCls = $this->db->prepare("SELECT COUNT(*) FROM `classes` WHERE `period_id` = ? AND `status` = 'Active'");
            try {
                $checkCls->execute([$periodId]);
                $count = (int)$checkCls->fetchColumn();
                if ($count > 0) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'error' => "Cannot delete period because {$count} active class(es) are currently assigned to it."
                    ]);
                    return;
                }
            } catch (Throwable $e) {
                // Column might not exist yet
            }

            $stmt = $this->db->prepare("DELETE FROM `teaching_periods` WHERE `id` = ?");
            $stmt->execute([$periodId]);
        }

        echo json_encode(['success' => true, 'message' => 'Teaching period deleted successfully']);
    }

    private function assignPeriodTeachers(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $periodId = $input['periodId'] ?? null;
        $teachersData = $input['teachers'] ?? ($input['teacherIds'] ?? []);
        $assignedDays = $input['assignedDays'] ?? 'Monday – Friday';

        if (!$periodId || !is_array($teachersData)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'periodId and teachers array are required']);
            return;
        }

        if ($this->db) {
            $this->db->beginTransaction();
            try {
                $ins = $this->db->prepare("
                    INSERT INTO `period_teachers` (`id`, `period_id`, `teacher_id`, `assigned_days`, `status`)
                    VALUES (?, ?, ?, ?, 'Active')
                    ON DUPLICATE KEY UPDATE `assigned_days` = VALUES(`assigned_days`), `status` = 'Active'
                ");

                foreach ($teachersData as $tItem) {
                    $tId = is_array($tItem) ? ($tItem['teacherId'] ?? $tItem['id']) : $tItem;
                    $days = is_array($tItem) ? ($tItem['assignedDays'] ?? $assignedDays) : $assignedDays;
                    $ptId = 'PT-' . $periodId . '-' . $tId;
                    $ins->execute([$ptId, $periodId, $tId, $days]);
                }

                $this->db->commit();
            } catch (Throwable $e) {
                $this->db->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                return;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Teachers assigned to period successfully',
            'data' => ['periodId' => $periodId, 'teachers' => $teachersData]
        ]);
    }

    private function removePeriodTeacher(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $periodId = $input['periodId'] ?? ($_GET['period_id'] ?? null);
        $teacherId = $input['teacherId'] ?? ($_GET['teacher_id'] ?? null);

        if (!$periodId || !$teacherId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'periodId and teacherId are required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("DELETE FROM `period_teachers` WHERE `period_id` = ? AND `teacher_id` = ?");
            $stmt->execute([$periodId, $teacherId]);
        }

        echo json_encode(['success' => true, 'message' => 'Teacher removed from period successfully']);
    }
}

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'schedules.php') {
    $controller = new ScheduleController();
    $controller->handleRequest();
}

