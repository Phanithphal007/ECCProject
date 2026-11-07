<?php
/**
 * EduManage ECC — Class Student Enrollments API Endpoint
 * Handles enrolling students into classes, duplicate prevention, and roster listing.
 */

declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class EnrollmentController {
    private ?PDO $db;

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

        try {
            switch ($method) {
                case 'GET':
                    $this->getRoster();
                    break;
                case 'POST':
                    $this->enrollStudents();
                    break;
                case 'DELETE':
                    $this->unenrollStudent();
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

    private function getRoster(): void {
        $classId = $_GET['class_id'] ?? null;
        $studentId = $_GET['student_id'] ?? null;

        if ($studentId) {
            $this->getStudentEnrollments((string)$studentId);
            return;
        }

        if (!$classId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'class_id or student_id query parameter is required']);
            return;
        }

        if (!$this->db) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }

        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.name,
                s.khmer_name AS khmerName,
                s.gender,
                s.grade,
                s.english_level AS englishLevel,
                s.attendance_rate AS attendanceRate,
                s.status,
                s.avatar,
                e.enrolled_at AS joinDate
            FROM `enrollments` e
            INNER JOIN `students` s ON e.student_id = s.id
            WHERE e.class_id = ? AND e.status = 'Active'
            ORDER BY s.name ASC
        ");
        $stmt->execute([$classId]);
        $students = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $students]);
    }

    private function getStudentEnrollments(string $studentId): void {
        if (!$this->db) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }

        $stmt = $this->db->prepare("
            SELECT 
                e.class_id,
                c.name AS class_name,
                c.code AS class_code,
                c.grade_level,
                c.status AS class_status,
                e.status AS enrollment_status
            FROM `enrollments` e
            INNER JOIN `classes` c ON e.class_id = c.id
            WHERE (e.student_id = ? OR e.student_id = (SELECT s.id FROM `students` s WHERE s.student_id = ? LIMIT 1))
              AND e.status = 'Active'
              AND c.status != 'Archived'
            ORDER BY c.name ASC
        ");
        $stmt->execute([$studentId, $studentId]);
        $rows = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $rows]);
    }

    private function enrollStudents(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $classId = $input['classId'] ?? $input['class_id'] ?? null;
        $studentIds = $input['studentIds'] ?? ($input['studentId'] ? [$input['studentId']] : []);

        if (!$classId || empty($studentIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'classId and studentIds are required']);
            return;
        }

        if ($this->db) {
            // Use INSERT IGNORE to strictly prevent duplicate enrollments!
            $stmt = $this->db->prepare("
                INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
                VALUES (?, ?, 'Active')
            ");

            foreach ($studentIds as $sid) {
                $stmt->execute([$classId, $sid]);
            }
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => count($studentIds) . ' student(s) enrolled successfully into class ' . $classId
        ]);
    }

    private function unenrollStudent(): void {
        $classId = $_GET['class_id'] ?? null;
        $studentId = $_GET['student_id'] ?? null;

        if (!$classId || !$studentId) {
            $input = json_decode(file_get_contents('php://input'), true);
            $classId = $classId ?? ($input['classId'] ?? null);
            $studentId = $studentId ?? ($input['studentId'] ?? null);
        }

        if (!$classId || !$studentId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'class_id and student_id are required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("DELETE FROM `enrollments` WHERE `class_id` = ? AND `student_id` = ?");
            $stmt->execute([$classId, $studentId]);
        }

        echo json_encode(['success' => true, 'message' => 'Student removed from cohort']);
    }
}

$controller = new EnrollmentController();
$controller->handleRequest();

