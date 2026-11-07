<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../services/EvaluationPdfService.php';

$service = new EvaluationPdfService();

// Support query param or POST JSON body
$studentId = $_GET['student_id'] ?? $_GET['id'] ?? '20260709';

// Default mock student data matching ECC format
$studentData = [
    'studentId' => $studentId,
    'name' => $_GET['name'] ?? 'KOSAL SOKPISAL',
    'khmerName' => $_GET['khmer_name'] ?? 'កុសល សុខពិសាល',
    'gender' => $_GET['gender'] ?? 'ប្រុស',
    'courseLevel' => $_GET['course'] ?? 'សន្ទនាសម្រាប់បឋមទូទៅ',
    'academicYear' => $_GET['year'] ?? '២០២៦- ២០២៧',
    'termName' => $_GET['term'] ?? 'វគ្គទី៖ ខែ បញ្ចប់វគ្គសិក្សា',
    'reportDate' => $_GET['date'] ?? '07/09/2026',
    'foreignTeacher' => 'Jaden Grunk',
    'localTeacher' => 'Teacher Sophea'
];

if ($requestMethod === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && is_array($input)) {
        $studentData = array_merge($studentData, $input);
    }
}

// Check format requested: 'html' (default for print/preview) or 'json'
$format = $_GET['format'] ?? 'html';

if ($format === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'success',
        'data' => $studentData,
        'logo' => '/assets/images/ecc-logo.png'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Render HTML
header('Content-Type: text/html; charset=utf-8');
echo $service->renderEvaluationHtml($studentData);
