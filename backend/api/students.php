<?php
/**
 * EduManage ECC — Students API Endpoint
 * Handles GET, POST, PUT, DELETE, and Bulk Operations for student administration.
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

class StudentController {
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
            $this->db = null; // graceful fallback for offline/client state
        }
    }

    public function handleRequest(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $id = $_GET['id'] ?? null;
        $action = $_GET['action'] ?? null;

        try {
            switch ($method) {
                case 'GET':
                    $this->getStudents($id);
                    break;
                case 'POST':
                    $this->createStudent();
                    break;
                case 'PUT':
                    if ($action === 'bulk-status') {
                        $this->bulkUpdateStatus();
                    } elseif ($action === 'bulk-assign') {
                        $this->bulkAssignClass();
                    } elseif ($action === 'archive') {
                        $this->archiveStudent($id);
                    } else {
                        $this->updateStudent($id);
                    }
                    break;
                case 'DELETE':
                    $this->deleteStudent($id);
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

    private function getStudents(?string $id): void {
        if (!$this->db) {
            echo json_encode([
                'success' => true,
                'data' => [],
                'message' => 'Database offline. Operating in client-side state mode.'
            ]);
            return;
        }

        if ($id) {
            $stmt = $this->db->prepare("
                SELECT 
                    s.*,
                    COALESCE(SUM(p.amount), 0) AS total_paid,
                    MAX(p.payment_date) AS last_payment_date
                FROM `students` s
                LEFT JOIN `student_payments` p ON s.id = p.student_id
                WHERE s.id = ?
                GROUP BY s.id
            ");
            $stmt->execute([$id]);
            $student = $stmt->fetch();
            if ($student) {
                $student['studentId'] = $student['student_id'] ?? $student['id'];
                $tuitionFee = (float)($student['tuition_fee'] ?: 100.00);
                $totalPaid = (float)$student['total_paid'];
                $balance = max(0.00, $tuitionFee - $totalPaid);
                if ($totalPaid >= $tuitionFee && $tuitionFee > 0) {
                    $status = 'Paid';
                } elseif ($totalPaid > 0) {
                    $status = 'Partial';
                } else {
                    $status = 'Unpaid';
                }
                $student['tuitionFee'] = $tuitionFee;
                $student['totalTuition'] = $tuitionFee;
                $student['totalPaid'] = $totalPaid;
                $student['outstandingBalance'] = $balance;
                $student['lastPaymentDate'] = $student['last_payment_date'];
                $student['tuitionStatus'] = $status;
                $student['paymentStatus'] = $status;
                echo json_encode(['success' => true, 'data' => $student]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Student not found']);
            }
            return;
        }

        $query = "
            SELECT 
                s.*,
                COALESCE(SUM(p.amount), 0) AS total_paid,
                MAX(p.payment_date) AS last_payment_date
            FROM `students` s
            LEFT JOIN `student_payments` p ON s.id = p.student_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($_GET['grade']) && $_GET['grade'] !== 'All') {
            $query .= " AND s.`grade` = ?";
            $params[] = $_GET['grade'];
        }
        if (!empty($_GET['status']) && $_GET['status'] !== 'All') {
            $query .= " AND s.`status` = ?";
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['gender']) && $_GET['gender'] !== 'All') {
            $query .= " AND s.`gender` = ?";
            $params[] = $_GET['gender'];
        }
        if (!empty($_GET['search'])) {
            $q = '%' . trim($_GET['search']) . '%';
            $query .= " AND (s.`name` LIKE ? OR s.`khmer_name` LIKE ? OR s.`id` LIKE ? OR s.`guardian_phone` LIKE ?)";
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
        }

        $query .= " GROUP BY s.`id` ORDER BY s.`join_date` DESC, s.`name` ASC";
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $students = $stmt->fetchAll();

        foreach ($students as &$s) {
            $s['studentId'] = $s['student_id'] ?? $s['id'];
            $tuitionFee = (float)($s['tuition_fee'] ?: 100.00);
            $totalPaid = (float)$s['total_paid'];
            $balance = max(0.00, $tuitionFee - $totalPaid);
            
            if ($totalPaid >= $tuitionFee && $tuitionFee > 0) {
                $status = 'Paid';
            } elseif ($totalPaid > 0) {
                $status = 'Partial';
            } else {
                $status = 'Unpaid';
            }
            
            $s['tuitionFee'] = $tuitionFee;
            $s['totalTuition'] = $tuitionFee;
            $s['totalPaid'] = $totalPaid;
            $s['outstandingBalance'] = $balance;
            $s['lastPaymentDate'] = $s['last_payment_date'];
            $s['tuitionStatus'] = $status;
            $s['paymentStatus'] = $status;
        }

        echo json_encode(['success' => true, 'data' => $students]);
    }

    private function createStudent(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
            return;
        }

        $firstName = trim($input['firstName'] ?? '');
        $lastName = trim($input['lastName'] ?? '');
        $name = trim($input['name'] ?? "$firstName $lastName");
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Student English name is required']);
            return;
        }

        $khmerFirstName = trim($input['khmerFirstName'] ?? '');
        $khmerLastName = trim($input['khmerLastName'] ?? '');
        $khmerName = trim($input['khmerName'] ?? $input['khmer_name'] ?? "$khmerFirstName $khmerLastName");

        $id = $input['id'] ?? ('STU-' . rand(1000, 9999));
        $joinDate = $input['joinDate'] ?? date('Y-m-d');
        $gender = $input['gender'] ?? 'Male';
        $grade = $input['grade'] ?? 'Grade 1';
        $englishLevel = $input['englishLevel'] ?? $input['english_level'] ?? 'Beginner';
        $guardianName = $input['guardianName'] ?? $input['guardian_name'] ?? null;
        $guardianPhone = $input['guardianPhone'] ?? $input['guardian_phone'] ?? null;
        $studentPhone = $input['studentPhone'] ?? $input['student_phone'] ?? ($input['phone'] ?? null);
        $status = $input['status'] ?? 'Active';
        $tuitionStatus = $input['paymentStatus'] ?? $input['payment_status'] ?? $input['tuitionStatus'] ?? $input['tuition_status'] ?? 'Unpaid';
        $studentId = $input['studentId'] ?? $input['student_id'] ?? $input['studentCode'] ?? null;
        $avatar = $input['avatar'] ?? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80';
        $attendanceRate = (float)($input['attendanceRate'] ?? 100.00);

        $classId = $input['classId'] ?? $input['class_id'] ?? null;
        if (empty($classId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'An active English Class must be selected before registering a student.']);
            return;
        }

        if ($this->db) {
            // 1. Validate class status
            $classStmt = $this->db->prepare("SELECT id, name, status, capacity, grade_level FROM `classes` WHERE `id` = ?");
            $classStmt->execute([$classId]);
            $classRow = $classStmt->fetch();

            if (!$classRow) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Selected English Class was not found.']);
                return;
            }

            if ($classRow['status'] !== 'Active') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => "Cannot register student: Class '{$classRow['name']}' is not active."]);
                return;
            }

            // 2. Validate available capacity
            $countStmt = $this->db->prepare("SELECT COUNT(*) AS total FROM `enrollments` WHERE `class_id` = ? AND `status` = 'Active'");
            $countStmt->execute([$classId]);
            $currentEnrollment = (int)$countStmt->fetchColumn();
            $maxCapacity = (int)($classRow['capacity'] ?: 25);

            if ($currentEnrollment >= $maxCapacity) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => "Cannot register student: Class '{$classRow['name']}' has reached its maximum capacity of {$maxCapacity} students."]);
                return;
            }

            // 3. Prevent duplicate enrollment
            $dupStmt = $this->db->prepare("SELECT COUNT(*) FROM `enrollments` WHERE `class_id` = ? AND `student_id` = ?");
            $dupStmt->execute([$classId, $id]);
            if ((int)$dupStmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => "Student {$id} is already enrolled in this English Class."]);
                return;
            }

            // 4. Begin database transaction
            $this->db->beginTransaction();
            try {
                $grade = $classRow['grade_level'] ?: ($input['grade'] ?? 'Grade 1');
                $tuitionFee = (float)($input['tuitionFee'] ?? 100.00);
                $stmt = $this->db->prepare("
                    INSERT INTO `students` (
                        `id`, `student_id`, `name`, `khmer_name`, `gender`, `grade`, `english_level`,
                        `guardian_name`, `guardian_phone`, `student_phone`, `attendance_rate`,
                        `tuition_status`, `tuition_fee`, `status`, `avatar`, `join_date`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    $studentId,
                    $name,
                    $khmerName ?: null,
                    $gender,
                    $grade,
                    $englishLevel,
                    $guardianName,
                    $guardianPhone,
                    $studentPhone,
                    $attendanceRate,
                    $tuitionStatus,
                    $tuitionFee,
                    $status,
                    $avatar,
                    $joinDate
                ]);

                $enrollStmt = $this->db->prepare("
                    INSERT INTO `enrollments` (`class_id`, `student_id`, `status`, `enrolled_at`)
                    VALUES (?, ?, 'Active', NOW())
                ");
                $enrollStmt->execute([$classId, $id]);

                // Create initial payment transaction if Paid or Partial
                if ($tuitionStatus === 'Paid') {
                    $randDigits = str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                    $payStmt = $this->db->prepare("
                        INSERT INTO `student_payments` (id, student_id, receipt_no, amount, payment_method, payment_date, note, recorded_by, created_at)
                        VALUES (?, ?, ?, ?, 'ABA Pay / KHQR', CURDATE(), 'Full tuition payment upon enrollment', 'Admin', NOW())
                    ");
                    $payStmt->execute([
                        'PAY-' . uniqid(),
                        $id,
                        'REC-' . date('Y') . '-' . $randDigits,
                        $tuitionFee
                    ]);
                } elseif ($tuitionStatus === 'Partial') {
                    $randDigits = str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                    $partialAmount = (float)($input['paidAmount'] ?? ($tuitionFee / 2));
                    $payStmt = $this->db->prepare("
                        INSERT INTO `student_payments` (id, student_id, receipt_no, amount, payment_method, payment_date, note, recorded_by, created_at)
                        VALUES (?, ?, ?, ?, 'Wing Bank', CURDATE(), 'Partial initial tuition payment (deposit)', 'Admin', NOW())
                    ");
                    $payStmt->execute([
                        'PAY-' . uniqid(),
                        $id,
                        'REC-' . date('Y') . '-' . $randDigits,
                        $partialAmount
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

        $createdData = array_merge($input, [
            'id' => $id,
            'studentId' => $studentId,
            'student_id' => $studentId,
            'name' => $name,
            'khmerName' => $khmerName,
            'joinDate' => $joinDate,
            'status' => $status,
            'tuitionStatus' => $tuitionStatus,
            'paymentStatus' => $tuitionStatus,
            'tuition_status' => $tuitionStatus,
            'attendanceRate' => $attendanceRate,
            'avatar' => $avatar
        ]);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => $createdData,
            'message' => 'Student registered and enrolled successfully'
        ]);
    }

    private function updateStudent(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $studentId = $id ?? ($input['id'] ?? null);

        if (!$studentId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Student ID is required']);
            return;
        }

        $firstName = trim($input['firstName'] ?? '');
        $lastName = trim($input['lastName'] ?? '');
        $fullName = (!empty($firstName) || !empty($lastName)) ? trim("$firstName $lastName") : ($input['name'] ?? null);

        $khmerFirstName = trim($input['khmerFirstName'] ?? '');
        $khmerLastName = trim($input['khmerLastName'] ?? '');
        $khmerFullName = (!empty($khmerFirstName) || !empty($khmerLastName)) ? trim("$khmerFirstName $khmerLastName") : ($input['khmerName'] ?? $input['khmer_name'] ?? null);

        if ($this->db) {
            $stmt = $this->db->prepare("
                UPDATE `students`
                SET `name` = COALESCE(?, `name`),
                    `khmer_name` = COALESCE(?, `khmer_name`),
                    `gender` = COALESCE(?, `gender`),
                    `grade` = COALESCE(?, `grade`),
                    `english_level` = COALESCE(?, `english_level`),
                    `guardian_name` = COALESCE(?, `guardian_name`),
                    `guardian_phone` = COALESCE(?, `guardian_phone`),
                    `student_phone` = COALESCE(?, `student_phone`),
                    `tuition_status` = COALESCE(?, `tuition_status`),
                    `status` = COALESCE(?, `status`),
                    `avatar` = COALESCE(?, `avatar`)
                WHERE `id` = ?
            ");
            $stmt->execute([
                $fullName,
                $khmerFullName,
                $input['gender'] ?? null,
                $input['grade'] ?? null,
                $input['englishLevel'] ?? $input['english_level'] ?? null,
                $input['guardianName'] ?? $input['guardian_name'] ?? null,
                $input['guardianPhone'] ?? $input['guardian_phone'] ?? null,
                $input['studentPhone'] ?? $input['student_phone'] ?? ($input['phone'] ?? null),
                $input['paymentStatus'] ?? $input['payment_status'] ?? $input['tuitionStatus'] ?? $input['tuition_status'] ?? null,
                $input['status'] ?? null,
                $input['avatar'] ?? null,
                $studentId
            ]);

            // Sync payment transaction records if payment status was updated
            $targetPaymentStatus = $input['paymentStatus'] ?? $input['payment_status'] ?? $input['tuitionStatus'] ?? $input['tuition_status'] ?? null;
            if ($targetPaymentStatus) {
                $feeStmt = $this->db->prepare("SELECT tuition_fee FROM students WHERE id = ?");
                $feeStmt->execute([$studentId]);
                $tuitionFee = (float)($feeStmt->fetchColumn() ?: 100.00);

                $paidStmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = ?");
                $paidStmt->execute([$studentId]);
                $currentPaid = (float)$paidStmt->fetchColumn();

                if ($targetPaymentStatus === 'Paid' && $currentPaid < $tuitionFee) {
                    $diff = $tuitionFee - $currentPaid;
                    $randDigits = str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                    $insPay = $this->db->prepare("
                        INSERT INTO student_payments (id, student_id, receipt_no, amount, payment_method, payment_date, note, recorded_by, created_at)
                        VALUES (?, ?, ?, ?, 'ABA Pay / KHQR', CURDATE(), 'Settlement payment to mark as Paid', 'Admin', NOW())
                    ");
                    $insPay->execute(['PAY-' . uniqid(), $studentId, 'REC-' . date('Y') . '-' . $randDigits, $diff]);
                } elseif ($targetPaymentStatus === 'Partial' && $currentPaid <= 0) {
                    $half = $tuitionFee / 2;
                    $randDigits = str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                    $insPay = $this->db->prepare("
                        INSERT INTO student_payments (id, student_id, receipt_no, amount, payment_method, payment_date, note, recorded_by, created_at)
                        VALUES (?, ?, ?, ?, 'Wing Bank', CURDATE(), 'Partial tuition payment', 'Admin', NOW())
                    ");
                    $insPay->execute(['PAY-' . uniqid(), $studentId, 'REC-' . date('Y') . '-' . $randDigits, $half]);
                }
            }
        }

        echo json_encode(['success' => true, 'message' => 'Student updated successfully', 'data' => $input]);
    }

    private function archiveStudent(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Student ID is required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("UPDATE `students` SET `status` = 'Archived' WHERE `id` = ?");
            $stmt->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Student archived safely']);
    }

    private function bulkUpdateStatus(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $studentIds = $input['studentIds'] ?? [];
        $status = $input['status'] ?? 'Active';

        if (empty($studentIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'studentIds array is required']);
            return;
        }

        if ($this->db) {
            $inClause = implode(',', array_fill(0, count($studentIds), '?'));
            $stmt = $this->db->prepare("UPDATE `students` SET `status` = ? WHERE `id` IN ($inClause)");
            $stmt->execute(array_merge([$status], $studentIds));
        }

        echo json_encode([
            'success' => true,
            'message' => count($studentIds) . ' student(s) updated to status ' . $status
        ]);
    }

    private function bulkAssignClass(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $studentIds = $input['studentIds'] ?? [];
        $classId = $input['classId'] ?? null;

        if (empty($studentIds) || empty($classId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'studentIds and classId are required']);
            return;
        }

        if ($this->db) {
            $stmt = $this->db->prepare("
                INSERT IGNORE INTO `enrollments` (`class_id`, `student_id`, `status`)
                VALUES (?, ?, 'Active')
            ");
            foreach ($studentIds as $sid) {
                $stmt->execute([$classId, $sid]);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => count($studentIds) . ' student(s) assigned to class ' . $classId
        ]);
    }

    private function deleteStudent(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Student ID is required']);
            return;
        }

        if ($this->db) {
            // Delete enrollments and student record safely
            $stmt = $this->db->prepare("DELETE FROM `enrollments` WHERE `student_id` = ?");
            $stmt->execute([$id]);

            $stmtStudent = $this->db->prepare("DELETE FROM `students` WHERE `id` = ?");
            $stmtStudent->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Student record permanently removed']);
    }
}

$controller = new StudentController();
$controller->handleRequest();

