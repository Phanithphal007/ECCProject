<?php
/**
 * EduManage ECC — English Classes API Endpoint
 * Handles GET, POST, PUT, DELETE for English class cohorts.
 */

declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class ClassController {
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
        $id = $_GET['id'] ?? null;
        $action = $_GET['action'] ?? null;

        try {
            switch ($method) {
                case 'GET':
                    if ($action === 'next-code') {
                        $this->getNextCode();
                    } else {
                        $this->getClasses($id);
                    }
                    break;
                case 'POST':
                    $this->createClass();
                    break;
                case 'PUT':
                    $this->updateClass($id);
                    break;
                case 'DELETE':
                    $this->deleteClass($id);
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

    private function getNextCode(): void {
        if (!$this->db) {
            echo json_encode(['success' => true, 'code' => 'CLS-001', 'next_sequence' => 1]);
            return;
        }

        $stmt = $this->db->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM `class_sequences`");
        $row = $stmt->fetch();
        $nextId = (int)($row['next_id'] ?? 1);

        while (true) {
            $candidateCode = sprintf('CLS-%03d', $nextId);
            $chk = $this->db->prepare("SELECT COUNT(*) AS cnt FROM `classes` WHERE `code` = ?");
            $chk->execute([$candidateCode]);
            $exists = (int)$chk->fetch()['cnt'];
            if ($exists === 0) {
                break;
            }
            $nextId++;
        }

        echo json_encode([
            'success' => true,
            'code' => $candidateCode,
            'next_sequence' => $nextId
        ]);
    }

    private function getClasses(?string $id): void {
        if (!$this->db) {
            echo json_encode([
                'success' => true,
                'data' => [],
                'message' => 'Database offline. Operating in in-memory client mode.'
            ]);
            return;
        }

        $baseQuery = "
            SELECT 
                c.*,
                c.period_id AS periodId,
                COALESCE(c.student_location, c.room, 'Student\'s Home') AS studentLocation,
                s.name AS subjectName,
                s.code AS subjectCode,
                s.grades AS subjectGrades,
                t.name AS teacherName,
                COUNT(e.student_id) AS enrolledCount,
                GROUP_CONCAT(e.student_id) AS enrolledStudentIdsList
            FROM `classes` c
            LEFT JOIN `subjects` s ON c.subject_id = s.id
            LEFT JOIN `teachers` t ON c.teacher_id = t.id
            LEFT JOIN `enrollments` e ON c.id = e.class_id AND e.status = 'Active'
        ";

        if ($id) {
            $stmt = $this->db->prepare($baseQuery . " WHERE c.id = ? GROUP BY c.id");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if ($row) {
                $row['enrolledStudentIds'] = $row['enrolledStudentIdsList'] ? explode(',', $row['enrolledStudentIdsList']) : [];
                $row['enrolled'] = (int)$row['enrolledCount'];
                $row['teacher'] = $row['teacherName'] ?? $row['teacher'] ?? '';
                $row['days'] = self::sanitizeSchedule($row['days'] ?? '');
                $row['time'] = self::sanitizeSchedule($row['time'] ?? '');
                $row['schedule'] = self::sanitizeSchedule($row['schedule'] ?? '');
                echo json_encode(['success' => true, 'data' => $row]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Class not found']);
            }
            return;
        }

        // Apply filters if given in query params
        $where = [];
        $params = [];
        if (!empty($_GET['grade'])) {
            $where[] = "c.grade_level = ?";
            $params[] = $_GET['grade'];
        }
        if (!empty($_GET['subject_id'])) {
            $where[] = "c.subject_id = ?";
            $params[] = $_GET['subject_id'];
        }
        if (!empty($_GET['status'])) {
            $where[] = "c.status = ?";
            $params[] = $_GET['status'];
        }

        $query = $baseQuery . (count($where) ? " WHERE " . implode(" AND ", $where) : "") . " GROUP BY c.id ORDER BY c.grade_level ASC, c.name ASC";
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['enrolledStudentIds'] = $r['enrolledStudentIdsList'] ? explode(',', $r['enrolledStudentIdsList']) : [];
            $r['enrolled'] = (int)$r['enrolledCount'];
            $r['teacher'] = $r['teacherName'] ?? $r['teacher'] ?? '';
            $r['days'] = self::sanitizeSchedule($r['days'] ?? '');
            $r['time'] = self::sanitizeSchedule($r['time'] ?? '');
            $r['schedule'] = self::sanitizeSchedule($r['schedule'] ?? '');
            unset($r['enrolledStudentIdsList']);
        }

        echo json_encode(['success' => true, 'data' => $rows]);
    }

    private function createClass(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Class name is required']);
            return;
        }

        $code = null;
        $id = null;
        $seqId = null;

        if ($this->db) {
            $this->db->beginTransaction();
            try {
                $maxAttempts = 20;
                for ($i = 0; $i < $maxAttempts; $i++) {
                    $seqStmt = $this->db->prepare("INSERT INTO `class_sequences` (`created_at`) VALUES (CURRENT_TIMESTAMP)");
                    $seqStmt->execute();
                    $seqId = (int)$this->db->lastInsertId();
                    $candidateCode = sprintf('CLS-%03d', $seqId);

                    // Verify uniqueness in classes table
                    $checkStmt = $this->db->prepare("SELECT COUNT(*) AS cnt FROM `classes` WHERE `code` = ?");
                    $checkStmt->execute([$candidateCode]);
                    if ((int)$checkStmt->fetch()['cnt'] === 0) {
                        $code = $candidateCode;
                        $updSeq = $this->db->prepare("UPDATE `class_sequences` SET `code` = ? WHERE `id` = ?");
                        $updSeq->execute([$code, $seqId]);
                        break;
                    }
                }

                if (!$code) {
                    throw new RuntimeException("Failed to generate unique class code after multiple attempts");
                }

                $id = !empty($input['id']) ? $input['id'] : ('CLS-' . sprintf('%03d', $seqId));
                $checkId = $this->db->prepare("SELECT COUNT(*) AS cnt FROM `classes` WHERE `id` = ?");
                $checkId->execute([$id]);
                if ((int)$checkId->fetch()['cnt'] > 0) {
                    $id = 'CLS-' . sprintf('%03d', $seqId) . '-' . strtoupper(substr(uniqid(), -3));
                }

                $days = self::sanitizeSchedule($input['days'] ?? 'Monday – Friday');
                $time = self::sanitizeSchedule($input['time'] ?? '08:00 AM – 09:30 AM');
                $schedule = !empty($input['schedule']) ? self::sanitizeSchedule($input['schedule']) : ($days . ' • ' . $time);
                $location = $input['studentLocation'] ?? $input['location'] ?? $input['room'] ?? "Student's Home";
                $teacherId = (!empty($input['teacherId']) && trim($input['teacherId']) !== '' && $input['teacherId'] !== 'TCH-NONE') ? trim($input['teacherId']) : null;
                $periodId = !empty($input['periodId']) ? trim($input['periodId']) : null;
                $subjectId = !empty($input['subjectId']) ? trim($input['subjectId']) : 'SUB-ALPHABET';

                $stmt = $this->db->prepare("
                    INSERT INTO `classes` (
                        `id`, `code`, `name`, `subject_id`, `teacher_id`, `period_id`, `grade_level`,
                        `student_location`, `room`, `days`, `time`, `schedule`, `academic_year`, `capacity`, `description`, `status`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    $code,
                    $input['name'],
                    $subjectId,
                    $teacherId,
                    $periodId,
                    $input['gradeLevel'] ?? 'Grade 1',
                    $location,
                    $location,
                    $days,
                    $time,
                    $schedule,
                    $input['academicYear'] ?? '2026-2027',
                    (int)($input['capacity'] ?? 25),
                    $input['description'] ?? '',
                    $input['status'] ?? 'Active'
                ]);

                $this->db->commit();
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
                return;
            }
        } else {
            $code = 'CLS-001';
            $id = 'CLS-' . strtoupper(substr(uniqid(), -6));
            $schedule = $input['schedule'] ?? 'Monday – Friday • 08:00 AM – 09:30 AM';
            $location = "Student's Home";
            $teacherId = null;
            $periodId = null;
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => array_merge($input, [
                'id' => $id,
                'code' => $code,
                'teacherId' => $teacherId,
                'periodId' => $periodId,
                'schedule' => $schedule,
                'studentLocation' => $location
            ]),
            'message' => 'Class created successfully with unique code ' . $code
        ]);
    }

    private function updateClass(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $classId = $id ?? ($input['id'] ?? null);

        if (!$classId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Class ID is required']);
            return;
        }

        $location = $input['studentLocation'] ?? $input['location'] ?? $input['room'] ?? null;
        $hasTeacherId = array_key_exists('teacherId', $input);
        $teacherId = $hasTeacherId ? (!empty($input['teacherId']) && trim($input['teacherId']) !== '' && $input['teacherId'] !== 'TCH-NONE' ? trim($input['teacherId']) : null) : null;

        $hasPeriodId = array_key_exists('periodId', $input);
        $periodId = $hasPeriodId ? (!empty($input['periodId']) ? trim($input['periodId']) : null) : null;

        if ($this->db) {
            // Note: `code` is deliberately preserved from the existing record; it cannot be modified per business rule
            $stmt = $this->db->prepare("
                UPDATE `classes`
                SET `name` = COALESCE(?, `name`),
                    `subject_id` = COALESCE(?, `subject_id`),
                    `teacher_id` = " . ($hasTeacherId ? "?" : "`teacher_id`") . ",
                    `period_id` = " . ($hasPeriodId ? "?" : "`period_id`") . ",
                    `grade_level` = COALESCE(?, `grade_level`),
                    `student_location` = COALESCE(?, `student_location`),
                    `room` = COALESCE(?, `room`),
                    `days` = COALESCE(?, `days`),
                    `time` = COALESCE(?, `time`),
                    `schedule` = COALESCE(?, `schedule`),
                    `academic_year` = COALESCE(?, `academic_year`),
                    `capacity` = COALESCE(?, `capacity`),
                    `description` = COALESCE(?, `description`),
                    `status` = COALESCE(?, `status`)
                WHERE `id` = ?
            ");

            $cleanDays = isset($input['days']) ? self::sanitizeSchedule($input['days']) : null;
            $cleanTime = isset($input['time']) ? self::sanitizeSchedule($input['time']) : null;
            $cleanSchedule = isset($input['schedule']) ? self::sanitizeSchedule($input['schedule']) : null;

            $params = [
                $input['name'] ?? null,
                $input['subjectId'] ?? null
            ];
            if ($hasTeacherId) $params[] = $teacherId;
            if ($hasPeriodId) $params[] = $periodId;
            $params[] = $input['gradeLevel'] ?? null;
            $params[] = $location;
            $params[] = $location;
            $params[] = $cleanDays;
            $params[] = $cleanTime;
            $params[] = $cleanSchedule;
            $params[] = $input['academicYear'] ?? null;
            $params[] = isset($input['capacity']) ? (int)$input['capacity'] : null;
            $params[] = $input['description'] ?? null;
            $params[] = $input['status'] ?? null;
            $params[] = $classId;

            $stmt->execute($params);
        }

        echo json_encode(['success' => true, 'message' => 'Class updated successfully']);
    }

    private function deleteClass(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Class ID is required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("DELETE FROM `classes` WHERE `id` = ?");
            $stmt->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Class deleted successfully']);
    }
}

$controller = new ClassController();
$controller->handleRequest();

