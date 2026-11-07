<?php
/**
 * EduManage ECC — English Subjects API Endpoint
 * Handles GET, POST, PUT, DELETE for English learning subjects.
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

class SubjectController {
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
            $this->db = null; // graceful fallback
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
                        $this->getSubjects($id);
                    }
                    break;
                case 'POST':
                    $this->createSubject();
                    break;
                case 'PUT':
                    $this->updateSubject($id);
                    break;
                case 'DELETE':
                    $this->deleteSubject($id);
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
            echo json_encode(['success' => true, 'code' => 'ENG-001']);
            return;
        }

        $stmt = $this->db->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM `subject_sequences`");
        $row = $stmt->fetch();
        $nextId = (int)($row['next_id'] ?? 1);

        while (true) {
            $candidateCode = sprintf('ENG-%03d', $nextId);
            $chk = $this->db->prepare("SELECT COUNT(*) AS cnt FROM `subjects` WHERE `code` = ?");
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

    private function getSubjects(?string $id): void {
        if (!$this->db) {
            echo json_encode([
                'success' => true,
                'data' => [],
                'message' => 'Database offline. Operating in in-memory client mode.'
            ]);
            return;
        }

        if ($id) {
            $stmt = $this->db->prepare("SELECT * FROM `subjects` WHERE `id` = ?");
            $stmt->execute([$id]);
            $subject = $stmt->fetch();
            if ($subject) {
                $subject['skills'] = json_decode($subject['skills'] ?? '[]', true);
                echo json_encode(['success' => true, 'data' => $subject]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Subject not found']);
            }
            return;
        }

        $stmt = $this->db->query("SELECT * FROM `subjects` ORDER BY `name` ASC");
        $subjects = $stmt->fetchAll();
        foreach ($subjects as &$s) {
            $s['skills'] = json_decode($s['skills'] ?? '[]', true);
        }

        echo json_encode(['success' => true, 'data' => $subjects]);
    }

    private function createSubject(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Subject name is required']);
            return;
        }

        $code = null;
        $id = null;
        $skillsJson = json_encode($input['skills'] ?? []);

        if ($this->db) {
            $this->db->beginTransaction();
            try {
                $maxAttempts = 10;
                $seqId = null;

                for ($i = 0; $i < $maxAttempts; $i++) {
                    $seqStmt = $this->db->prepare("INSERT INTO `subject_sequences` (`created_at`) VALUES (CURRENT_TIMESTAMP)");
                    $seqStmt->execute();
                    $seqId = (int)$this->db->lastInsertId();
                    $candidateCode = sprintf('ENG-%03d', $seqId);

                    // Verify uniqueness in subjects table
                    $checkStmt = $this->db->prepare("SELECT COUNT(*) AS cnt FROM `subjects` WHERE `code` = ?");
                    $checkStmt->execute([$candidateCode]);
                    if ((int)$checkStmt->fetch()['cnt'] === 0) {
                        $code = $candidateCode;
                        $updSeq = $this->db->prepare("UPDATE `subject_sequences` SET `code` = ? WHERE `id` = ?");
                        $updSeq->execute([$code, $seqId]);
                        break;
                    }
                }

                if (!$code) {
                    throw new RuntimeException("Failed to generate unique subject code after multiple attempts");
                }

                $id = !empty($input['id']) ? $input['id'] : 'SUB-' . sprintf('%03d', $seqId);

                $stmt = $this->db->prepare("
                    INSERT INTO `subjects` (`id`, `code`, `name`, `khmer_name`, `category`, `description`, `skills`, `grades`, `status`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id,
                    $code,
                    $input['name'],
                    $input['khmer_name'] ?? $input['nameKhmer'] ?? null,
                    $input['category'] ?? 'Core Skills',
                    $input['description'] ?? '',
                    $skillsJson,
                    $input['grades'] ?? 'Grade 1 - 12',
                    $input['status'] ?? 'Active'
                ]);

                $this->db->commit();
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                throw $e;
            }
        } else {
            $code = 'ENG-001';
            $id = !empty($input['id']) ? $input['id'] : 'SUB-001';
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => array_merge($input, ['id' => $id, 'code' => $code]),
            'message' => 'Subject created successfully'
        ]);
    }

    private function updateSubject(?string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $subjectId = $id ?? ($input['id'] ?? null);

        if (!$subjectId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Subject ID is required for update']);
            return;
        }

        if ($this->db) {
            $skillsJson = isset($input['skills']) ? json_encode($input['skills']) : null;
            // Note: `code` is strictly preserved and not modified on update
            $stmt = $this->db->prepare("
                UPDATE `subjects`
                SET `name` = COALESCE(?, `name`),
                    `khmer_name` = COALESCE(?, `khmer_name`),
                    `category` = COALESCE(?, `category`),
                    `description` = COALESCE(?, `description`),
                    `skills` = COALESCE(?, `skills`),
                    `grades` = COALESCE(?, `grades`),
                    `status` = COALESCE(?, `status`)
                WHERE `id` = ?
            ");
            $stmt->execute([
                $input['name'] ?? null,
                $input['khmer_name'] ?? $input['nameKhmer'] ?? null,
                $input['category'] ?? null,
                $input['description'] ?? null,
                $skillsJson,
                $input['grades'] ?? null,
                $input['status'] ?? null,
                $subjectId
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Subject updated successfully']);
    }

    private function deleteSubject(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Subject ID is required']);
            return;
        }

        if ($this->db) {
            // Check if any active classes reference this subject
            $stmtCheck = $this->db->prepare("SELECT COUNT(*) AS count FROM `classes` WHERE `subject_id` = ? AND `status` != 'Archived'");
            $stmtCheck->execute([$id]);
            $res = $stmtCheck->fetch();
            if ($res && (int)$res['count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Cannot delete subject: it is currently assigned to ' . $res['count'] . ' active class(es). Please reassign or archive affected classes first.'
                ]);
                return;
            }

            $stmt = $this->db->prepare("DELETE FROM `subjects` WHERE `id` = ?");
            $stmt->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Subject deleted successfully']);
    }
}

$controller = new SubjectController();
$controller->handleRequest();

