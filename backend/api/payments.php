<?php
/**
 * EduManage ECC — Fees & Payments REST API
 * Handles recording student tuition payments, querying payment histories,
 * invoices, overdue balances, and financial summaries with MySQL transactions.
 */

declare(strict_types=1);

date_default_timezone_set('Asia/Phnom_Penh');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class PaymentController {
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
            $this->db->exec("SET time_zone = '+07:00'");
        } catch (Throwable $e) {
            $this->db = null;
        }
    }

    public function handleRequest(): void {
        $method = $_SERVER['REQUEST_METHOD'];

        try {
            switch ($method) {
                case 'GET':
                    $this->handleGet();
                    break;
                case 'POST':
                    $this->recordPayment();
                    break;
                case 'DELETE':
                    $id = $_GET['id'] ?? null;
                    $this->deletePayment($id);
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

    private function handleGet(): void {
        if (!$this->db) {
            echo json_encode(['success' => false, 'error' => 'Database connection unavailable']);
            return;
        }

        $studentId = $_GET['student_id'] ?? null;
        $action = $_GET['action'] ?? null;

        if ($studentId) {
            $this->getStudentPaymentSummary($studentId);
            return;
        }

        if ($action === 'summary') {
            $this->getFinancialSummary();
            return;
        }

        if ($action === 'receipt') {
            $id = $_GET['id'] ?? null;
            $this->getReceiptDetails($id);
            return;
        }

        if ($action === 'transactions') {
            $this->getAllTransactions();
            return;
        }

        // Default: return all invoices (the primary data for the Fees & Payments table)
        $this->getAllInvoices();
    }

    /**
     * Get all invoices joined with student details and payment statistics
     */
    private function getAllInvoices(): void {
        $statusFilter = $_GET['status'] ?? 'All';
        $search = trim($_GET['search'] ?? '');
        $termFilter = trim($_GET['term'] ?? '');

        $today = date('Y-m-d');

        $query = "
            SELECT 
                i.id,
                i.invoice_no AS invoiceNo,
                i.student_id AS studentId,
                s.student_id AS officialStudentId,
                s.name AS studentName,
                s.khmer_name AS khmerName,
                s.grade,
                s.guardian_name AS guardianName,
                s.guardian_phone AS phone,
                i.term,
                i.academic_year AS academicYear,
                i.fee_type AS feeType,
                CAST(i.amount_due AS DECIMAL(10,2)) AS amount,
                CAST(i.amount_paid AS DECIMAL(10,2)) AS amountPaid,
                CAST(i.balance AS DECIMAL(10,2)) AS outstandingBalance,
                i.due_date AS dueDate,
                i.status,
                i.notes,
                i.created_at AS createdAt,
                (
                    SELECT p.payment_method 
                    FROM student_payments p 
                    WHERE p.invoice_id = i.id OR p.student_id = i.student_id 
                    ORDER BY p.payment_date DESC, p.created_at DESC 
                    LIMIT 1
                ) AS paymentMethod,
                (
                    SELECT p.payment_date 
                    FROM student_payments p 
                    WHERE p.invoice_id = i.id OR p.student_id = i.student_id 
                    ORDER BY p.payment_date DESC, p.created_at DESC 
                    LIMIT 1
                ) AS paymentDate,
                (
                    SELECT p.receipt_no 
                    FROM student_payments p 
                    WHERE p.invoice_id = i.id OR p.student_id = i.student_id 
                    ORDER BY p.payment_date DESC, p.created_at DESC 
                    LIMIT 1
                ) AS receiptNo
            FROM invoices i
            JOIN students s ON i.student_id = s.id
            WHERE 1=1
        ";

        $params = [];

        if ($statusFilter !== 'All' && in_array($statusFilter, ['Paid', 'Partial', 'Unpaid'], true)) {
            $query .= " AND i.status = ?";
            $params[] = $statusFilter;
        }

        if ($termFilter !== '') {
            $query .= " AND i.term = ?";
            $params[] = $termFilter;
        }

        if ($search !== '') {
            $query .= " AND (
                s.name LIKE ? OR 
                s.khmer_name LIKE ? OR 
                s.student_id LIKE ? OR 
                i.invoice_no LIKE ? OR 
                i.id LIKE ?
            )";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $query .= " ORDER BY (i.status != 'Paid' AND i.due_date < '{$today}') DESC, i.due_date ASC, i.created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll();

        $processed = array_map(function($inv) use ($today) {
            $amt = (float)$inv['amount'];
            $paid = (float)$inv['amountPaid'];
            $bal = (float)$inv['outstandingBalance'];
            $dueDate = $inv['dueDate'];

            // Calculate overdue condition: balance > 0 and due_date < today
            $isOverdue = ($bal > 0 && $dueDate < $today);
            $daysOverdue = 0;
            if ($isOverdue) {
                $daysOverdue = max(0, (int)round((strtotime($today) - strtotime($dueDate)) / 86400));
            }

            return array_merge($inv, [
                'amount' => $amt,
                'amountPaid' => $paid,
                'outstandingBalance' => $bal,
                'isOverdue' => $isOverdue,
                'daysOverdue' => $daysOverdue,
                'paymentMethod' => $inv['paymentMethod'] ?: 'ABA Pay / KHQR',
                'paymentDate' => $inv['paymentDate'] ?: $inv['dueDate'],
                'receiptNo' => $inv['receiptNo'] ?: $inv['invoiceNo']
            ]);
        }, $invoices);

        echo json_encode([
            'success' => true,
            'data' => $processed,
            'count' => count($processed)
        ]);
    }

    /**
     * Get aggregate financial summary calculated directly from MySQL
     */
    private function getFinancialSummary(): void {
        $today = date('Y-m-d');

        // 1. Total successfully collected amount (excluding cancelled/reversed if any)
        $totPaidStmt = $this->db->query("SELECT COALESCE(SUM(amount), 0) FROM student_payments");
        $totalCollected = (float)$totPaidStmt->fetchColumn();

        // 2. Total expected tuition from all invoices
        $totTuitionStmt = $this->db->query("SELECT COALESCE(SUM(amount_due), 0) FROM invoices");
        $totalTuitionExpected = (float)$totTuitionStmt->fetchColumn();
        if ($totalTuitionExpected <= 0) {
            $stuTotStmt = $this->db->query("SELECT COALESCE(SUM(tuition_fee), 0) FROM students WHERE status != 'Archived'");
            $totalTuitionExpected = (float)$stuTotStmt->fetchColumn();
        }

        // 3. Outstanding receivables
        $totBalStmt = $this->db->query("SELECT COALESCE(SUM(balance), 0) FROM invoices");
        $totalOutstanding = (float)$totBalStmt->fetchColumn();

        // 4. Collection rate percentage
        $collectionRate = $totalTuitionExpected > 0 ? round(($totalCollected / $totalTuitionExpected) * 100, 1) : 0.0;

        // 5. Counts per status
        $statusCounts = ['Paid' => 0, 'Partial' => 0, 'Unpaid' => 0, 'All' => 0];
        $cntStmt = $this->db->query("SELECT status, COUNT(*) AS cnt FROM invoices GROUP BY status");
        while ($row = $cntStmt->fetch()) {
            $statusCounts[$row['status']] = (int)$row['cnt'];
            $statusCounts['All'] += (int)$row['cnt'];
        }

        // 6. Overdue calculations (due_date < CURDATE() AND balance > 0)
        // Fully paid invoices are NOT counted as overdue
        $ovrStmt = $this->db->prepare("
            SELECT 
                COALESCE(SUM(balance), 0) AS overdueBalance,
                COUNT(DISTINCT student_id) AS overdueStudentsCount
            FROM invoices 
            WHERE status != 'Paid' AND balance > 0 AND due_date < ?
        ");
        $ovrStmt->execute([$today]);
        $ovr = $ovrStmt->fetch();
        $overdueBalance = (float)($ovr['overdueBalance'] ?? 0.00);
        $overdueStudentsCount = (int)($ovr['overdueStudentsCount'] ?? 0);

        // 7. Configured Tuition Tier (queried from active students)
        $tierStmt = $this->db->query("SELECT DISTINCT tuition_fee FROM students WHERE tuition_fee > 0 ORDER BY tuition_fee ASC");
        $tiers = $tierStmt->fetchAll(PDO::FETCH_COLUMN);
        if (count($tiers) === 1) {
            $tuitionTierStr = '$' . number_format((float)$tiers[0], 2) . ' / Term';
        } elseif (count($tiers) > 1) {
            $tuitionTierStr = '$' . number_format((float)min($tiers), 2) . ' – $' . number_format((float)max($tiers), 2) . ' / Term';
        } else {
            $tuitionTierStr = '$100.00 / Term';
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'totalCollected' => $totalCollected,
                'totalTuitionExpected' => $totalTuitionExpected,
                'totalOutstanding' => $totalOutstanding,
                'collectionRate' => $collectionRate,
                'paidCount' => $statusCounts['Paid'],
                'partialCount' => $statusCounts['Partial'],
                'unpaidCount' => $statusCounts['Unpaid'],
                'allCount' => $statusCounts['All'],
                'overdueBalance' => $overdueBalance,
                'overdueStudentsCount' => $overdueStudentsCount,
                'tuitionTier' => $tuitionTierStr
            ]
        ]);
    }

    /**
     * Get details for an official payment receipt / invoice slip
     */
    private function getReceiptDetails(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Receipt or Invoice ID required']);
            return;
        }

        // Try find by payment receipt_no or payment id
        $stmt = $this->db->prepare("
            SELECT 
                p.id AS paymentId,
                p.receipt_no AS receiptNo,
                p.amount AS amountPaid,
                p.payment_method AS paymentMethod,
                p.payment_date AS paymentDate,
                p.note,
                p.recorded_by AS recordedBy,
                p.created_at AS paymentCreatedAt,
                i.id AS invoiceId,
                i.invoice_no AS invoiceNo,
                i.term,
                i.academic_year AS academicYear,
                i.fee_type AS feeType,
                i.amount_due AS totalAmountDue,
                i.amount_paid AS cumulativePaid,
                i.balance AS outstandingBalance,
                i.due_date AS dueDate,
                i.status AS paymentStatus,
                s.id AS studentId,
                s.student_id AS officialStudentId,
                s.name AS studentName,
                s.khmer_name AS khmerName,
                s.grade,
                s.guardian_name AS guardianName,
                s.guardian_phone AS guardianPhone
            FROM student_payments p
            LEFT JOIN invoices i ON p.invoice_id = i.id
            JOIN students s ON p.student_id = s.id
            WHERE p.id = ? OR p.receipt_no = ? OR i.id = ? OR i.invoice_no = ?
            ORDER BY p.payment_date DESC
            LIMIT 1
        ");
        $stmt->execute([$id, $id, $id, $id]);
        $receipt = $stmt->fetch();

        if (!$receipt) {
            // Check if it's an invoice without payments yet
            $invStmt = $this->db->prepare("
                SELECT 
                    NULL AS paymentId,
                    i.invoice_no AS receiptNo,
                    0.00 AS amountPaid,
                    'Pending' AS paymentMethod,
                    i.due_date AS paymentDate,
                    i.notes AS note,
                    'ECC Administration' AS recordedBy,
                    i.created_at AS paymentCreatedAt,
                    i.id AS invoiceId,
                    i.invoice_no AS invoiceNo,
                    i.term,
                    i.academic_year AS academicYear,
                    i.fee_type AS feeType,
                    i.amount_due AS totalAmountDue,
                    i.amount_paid AS cumulativePaid,
                    i.balance AS outstandingBalance,
                    i.due_date AS dueDate,
                    i.status AS paymentStatus,
                    s.id AS studentId,
                    s.student_id AS officialStudentId,
                    s.name AS studentName,
                    s.khmer_name AS khmerName,
                    s.grade,
                    s.guardian_name AS guardianName,
                    s.guardian_phone AS guardianPhone
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                WHERE i.id = ? OR i.invoice_no = ?
            ");
            $invStmt->execute([$id, $id]);
            $receipt = $invStmt->fetch();
        }

        if (!$receipt) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Receipt record not found']);
            return;
        }

        echo json_encode(['success' => true, 'data' => $receipt]);
    }

    /**
     * Get payment summary and transaction history for a specific student
     */
    private function getStudentPaymentSummary(string $studentId): void {
        $stmt = $this->db->prepare("SELECT id, student_id, name, khmer_name, grade, tuition_status, tuition_fee FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch();

        if (!$student) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Student not found']);
            return;
        }

        $payStmt = $this->db->prepare("
            SELECT id, receipt_no AS receiptNo, amount, payment_method AS paymentMethod, payment_date AS paymentDate, note, recorded_by AS recordedBy, created_at AS createdAt
            FROM student_payments
            WHERE student_id = ?
            ORDER BY payment_date DESC, created_at DESC
        ");
        $payStmt->execute([$studentId]);
        $history = $payStmt->fetchAll();

        // Check student invoice
        $invStmt = $this->db->prepare("SELECT * FROM invoices WHERE student_id = ? ORDER BY due_date DESC LIMIT 1");
        $invStmt->execute([$studentId]);
        $invoice = $invStmt->fetch();

        $tuitionFee = (float)($invoice ? $invoice['amount_due'] : ($student['tuition_fee'] ?: 100.00));
        $totalPaid = 0.00;
        foreach ($history as $h) {
            $totalPaid += (float)$h['amount'];
        }

        $outstandingBalance = max(0.00, $tuitionFee - $totalPaid);
        $lastPaymentDate = count($history) > 0 ? $history[0]['paymentDate'] : null;

        // Accurate derived payment status
        if ($outstandingBalance <= 0 && $tuitionFee > 0) {
            $computedStatus = 'Paid';
        } elseif ($totalPaid > 0) {
            $computedStatus = 'Partial';
        } else {
            $computedStatus = 'Unpaid';
        }

        // Keep database status in sync if divergent
        if ($student['tuition_status'] !== $computedStatus) {
            $upStmt = $this->db->prepare("UPDATE students SET tuition_status = ? WHERE id = ?");
            $upStmt->execute([$computedStatus, $studentId]);
            $student['tuition_status'] = $computedStatus;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'studentId' => $student['id'],
                'officialStudentId' => $student['student_id'] ?: $student['id'],
                'studentName' => $student['name'],
                'khmerName' => $student['khmer_name'],
                'grade' => $student['grade'],
                'tuitionFee' => $tuitionFee,
                'totalTuition' => $tuitionFee,
                'totalPaid' => $totalPaid,
                'outstandingBalance' => $outstandingBalance,
                'paymentStatus' => $computedStatus,
                'tuitionStatus' => $computedStatus,
                'lastPaymentDate' => $lastPaymentDate,
                'history' => $history
            ]
        ]);
    }

    /**
     * Get all raw payment transactions
     */
    private function getAllTransactions(): void {
        $stmt = $this->db->query("
            SELECT 
                p.id,
                p.receipt_no AS receiptNo,
                p.student_id AS studentId,
                s.student_id AS officialStudentId,
                s.name AS studentName,
                s.grade,
                p.amount,
                p.payment_method AS paymentMethod,
                p.payment_date AS paymentDate,
                p.note,
                p.recorded_by AS recordedBy,
                p.created_at AS createdAt
            FROM student_payments p
            JOIN students s ON p.student_id = s.id
            ORDER BY p.payment_date DESC, p.created_at DESC
        ");
        $rows = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $rows]);
    }

    /**
     * Record a new student payment using a safe ACID database transaction
     */
    private function recordPayment(): void {
        if (!$this->db) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database offline']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
            return;
        }

        $studentId = trim((string)($input['studentId'] ?? $input['student_id'] ?? ''));
        $amount = (float)($input['amount'] ?? 0);
        $paymentMethod = trim((string)($input['paymentMethod'] ?? $input['payment_method'] ?? 'ABA Pay / KHQR'));
        $paymentDate = trim((string)($input['paymentDate'] ?? $input['payment_date'] ?? date('Y-m-d')));
        $dueDate = trim((string)($input['dueDate'] ?? $input['due_date'] ?? ''));
        $term = trim((string)($input['term'] ?? 'Term 4 (Nov - Jan 2026)'));
        $academicYear = trim((string)($input['academicYear'] ?? '2026-2027'));
        $feeType = trim((string)($input['feeType'] ?? 'Tuition Fee'));
        $referenceNo = trim((string)($input['referenceNo'] ?? $input['reference_no'] ?? ''));
        $note = trim((string)($input['note'] ?? ''));
        $recordedBy = trim((string)($input['recordedBy'] ?? $input['recorded_by'] ?? 'Sophea Heng'));
        $invoiceId = trim((string)($input['invoiceId'] ?? $input['invoice_id'] ?? ''));

        if (empty($studentId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Student ID is required']);
            return;
        }

        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Payment amount must be greater than zero']);
            return;
        }

        // 1. Begin Database Transaction
        $this->db->beginTransaction();

        try {
            // Verify student exists and lock row
            $stuStmt = $this->db->prepare("SELECT id, student_id, name, tuition_fee, tuition_status FROM students WHERE id = ? FOR UPDATE");
            $stuStmt->execute([$studentId]);
            $student = $stuStmt->fetch();

            if (!$student) {
                $this->db->rollBack();
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => "Student '{$studentId}' not found"]);
                return;
            }

            // 2. Prevent duplicate payment submissions (same student, amount, date recorded within last 30 seconds)
            $dupStmt = $this->db->prepare("
                SELECT id, receipt_no FROM student_payments 
                WHERE student_id = ? AND amount = ? AND payment_date = ? 
                  AND created_at >= (NOW() - INTERVAL 30 SECOND)
                LIMIT 1
            ");
            $dupStmt->execute([$studentId, $amount, $paymentDate]);
            $existingDup = $dupStmt->fetch();
            if ($existingDup) {
                $this->db->rollBack();
                http_response_code(409);
                echo json_encode([
                    'success' => false, 
                    'error' => "Duplicate payment submission detected. Receipt {$existingDup['receipt_no']} was already recorded."
                ]);
                return;
            }

            // 3. Find or Create the Target Invoice
            $targetInvoice = null;
            if (!empty($invoiceId)) {
                $invStmt = $this->db->prepare("SELECT * FROM invoices WHERE id = ? FOR UPDATE");
                $invStmt->execute([$invoiceId]);
                $targetInvoice = $invStmt->fetch();
            }

            if (!$targetInvoice) {
                // Find existing open invoice for student and term
                $invStmt = $this->db->prepare("SELECT * FROM invoices WHERE student_id = ? AND term = ? FOR UPDATE");
                $invStmt->execute([$studentId, $term]);
                $targetInvoice = $invStmt->fetch();
            }

            if (!$targetInvoice) {
                // Find any open invoice for student
                $invStmt = $this->db->prepare("SELECT * FROM invoices WHERE student_id = ? AND status != 'Paid' ORDER BY due_date ASC LIMIT 1 FOR UPDATE");
                $invStmt->execute([$studentId]);
                $targetInvoice = $invStmt->fetch();
            }

            if (!$targetInvoice) {
                // Generate a new invoice
                $invCount = (int)$this->db->query("SELECT COUNT(*) FROM invoices")->fetchColumn() + 1;
                $newInvId = 'INV-CAM-' . date('Y') . '-' . sprintf('%02d', $invCount);
                $newInvNo = 'INV-' . date('Y') . '-' . sprintf('%03d', $invCount);
                $invAmountDue = (float)($input['totalAmountDue'] ?? $student['tuition_fee'] ?: 100.00);
                $invDueDate = !empty($dueDate) ? $dueDate : date('Y-m-d', strtotime('+30 days'));

                $createInv = $this->db->prepare("
                    INSERT INTO invoices (id, invoice_no, student_id, fee_type, term, academic_year, amount_due, amount_paid, balance, due_date, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, 'Unpaid', ?)
                ");
                $createInv->execute([
                    $newInvId,
                    $newInvNo,
                    $studentId,
                    $feeType,
                    $term,
                    $academicYear,
                    $invAmountDue,
                    $invAmountDue,
                    $invDueDate,
                    $note ?: "{$term} {$feeType}"
                ]);

                $invStmt = $this->db->prepare("SELECT * FROM invoices WHERE id = ? FOR UPDATE");
                $invStmt->execute([$newInvId]);
                $targetInvoice = $invStmt->fetch();
            }

            // 4. Generate unique receipt number: REC-YYYY-RANDOM
            $receiptNo = trim((string)($input['receiptNo'] ?? $input['receipt_no'] ?? ''));
            if (empty($receiptNo)) {
                $randDigits = str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                $receiptNo = 'REC-' . date('Y') . '-' . $randDigits;
            }

            $chkReceipt = $this->db->prepare("SELECT COUNT(*) FROM student_payments WHERE receipt_no = ?");
            $chkReceipt->execute([$receiptNo]);
            if ((int)$chkReceipt->fetchColumn() > 0) {
                $receiptNo .= '-' . rand(10, 99);
            }

            $paymentId = 'PAY-' . uniqid();

            // 5. Insert payment record into student_payments
            $insStmt = $this->db->prepare("
                INSERT INTO student_payments (id, student_id, invoice_id, receipt_no, reference_no, amount, payment_method, payment_date, note, recorded_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $insStmt->execute([
                $paymentId,
                $studentId,
                $targetInvoice['id'],
                $receiptNo,
                $referenceNo ?: null,
                $amount,
                $paymentMethod,
                $paymentDate,
                $note ?: 'Tuition payment',
                $recordedBy
            ]);

            // 6. Recalculate invoice amounts strictly
            $invPaymentsStmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE invoice_id = ?");
            $invPaymentsStmt->execute([$targetInvoice['id']]);
            $updatedInvPaid = (float)$invPaymentsStmt->fetchColumn();

            $invDue = (float)$targetInvoice['amount_due'];
            $updatedInvBalance = max(0.00, $invDue - $updatedInvPaid);

            // Strict status rule: Paid only when balance = 0
            if ($updatedInvBalance <= 0.00 && $invDue > 0) {
                $updatedInvStatus = 'Paid';
            } elseif ($updatedInvPaid > 0) {
                $updatedInvStatus = 'Partial';
            } else {
                $updatedInvStatus = 'Unpaid';
            }

            $updInv = $this->db->prepare("UPDATE invoices SET amount_paid = ?, balance = ?, status = ? WHERE id = ?");
            $updInv->execute([$updatedInvPaid, $updatedInvBalance, $updatedInvStatus, $targetInvoice['id']]);

            // 7. Recalculate student overall status
            $stuSumStmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = ?");
            $stuSumStmt->execute([$studentId]);
            $studentTotalPaid = (float)$stuSumStmt->fetchColumn();

            $studentTuitionFee = (float)($student['tuition_fee'] ?: 100.00);

            if ($studentTotalPaid >= $studentTuitionFee && $studentTuitionFee > 0) {
                $studentStatus = 'Paid';
            } elseif ($studentTotalPaid > 0) {
                $studentStatus = 'Partial';
            } else {
                $studentStatus = 'Unpaid';
            }

            $updStu = $this->db->prepare("UPDATE students SET tuition_status = ? WHERE id = ?");
            $updStu->execute([$studentStatus, $studentId]);

            // 8. Commit Transaction
            $this->db->commit();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => "Payment of \${$amount} recorded successfully. Status updated to {$updatedInvStatus}.",
                'data' => [
                    'id' => $paymentId,
                    'invoiceId' => $targetInvoice['id'],
                    'invoiceNo' => $targetInvoice['invoice_no'],
                    'receiptNo' => $receiptNo,
                    'referenceNo' => $referenceNo,
                    'studentId' => $studentId,
                    'studentName' => $student['name'],
                    'amount' => $amount,
                    'amountPaid' => $updatedInvPaid,
                    'outstandingBalance' => $updatedInvBalance,
                    'paymentMethod' => $paymentMethod,
                    'paymentDate' => $paymentDate,
                    'status' => $updatedInvStatus,
                    'studentPaymentStatus' => $studentStatus,
                    'note' => $note,
                    'recordedBy' => $recordedBy
                ]
            ]);
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Delete payment transaction (Rollback with transaction recalculation)
     */
    private function deletePayment(?string $id): void {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Payment ID is required']);
            return;
        }

        $selStmt = $this->db->prepare("SELECT student_id, invoice_id FROM student_payments WHERE id = ?");
        $selStmt->execute([$id]);
        $payment = $selStmt->fetch();

        if (!$payment) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Payment record not found']);
            return;
        }

        $studentId = $payment['student_id'];
        $invoiceId = $payment['invoice_id'];

        $this->db->beginTransaction();
        try {
            $delStmt = $this->db->prepare("DELETE FROM student_payments WHERE id = ?");
            $delStmt->execute([$id]);

            if ($invoiceId) {
                $invSumStmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE invoice_id = ?");
                $invSumStmt->execute([$invoiceId]);
                $invPaid = (float)$invSumStmt->fetchColumn();

                $invDueStmt = $this->db->prepare("SELECT amount_due FROM invoices WHERE id = ?");
                $invDueStmt->execute([$invoiceId]);
                $invDue = (float)$invDueStmt->fetchColumn();

                $invBal = max(0.00, $invDue - $invPaid);
                $invStat = ($invBal <= 0 && $invDue > 0) ? 'Paid' : ($invPaid > 0 ? 'Partial' : 'Unpaid');

                $updInv = $this->db->prepare("UPDATE invoices SET amount_paid = ?, balance = ?, status = ? WHERE id = ?");
                $updInv->execute([$invPaid, $invBal, $invStat, $invoiceId]);
            }

            // Recalculate student
            $stuSumStmt = $this->db->prepare("SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = ?");
            $stuSumStmt->execute([$studentId]);
            $stuPaid = (float)$stuSumStmt->fetchColumn();

            $stuFeeStmt = $this->db->prepare("SELECT tuition_fee FROM students WHERE id = ?");
            $stuFeeStmt->execute([$studentId]);
            $stuFee = (float)$stuFeeStmt->fetchColumn();

            $stuStat = ($stuPaid >= $stuFee && $stuFee > 0) ? 'Paid' : ($stuPaid > 0 ? 'Partial' : 'Unpaid');
            $updStu = $this->db->prepare("UPDATE students SET tuition_status = ? WHERE id = ?");
            $updStu->execute([$stuStat, $studentId]);

            $this->db->commit();
            echo json_encode(['success' => true, 'message' => 'Payment record deleted successfully']);
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}

$controller = new PaymentController();
$controller->handleRequest();
