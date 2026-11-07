<?php

class EvaluationPdfService {
    private string $logoPath;
    private string $bokorFontPath;
    private string $interFontPath;

    public function __construct() {
        $this->logoPath = dirname(__DIR__) . '/assets/images/ecc-logo.png';
        $this->bokorFontPath = dirname(__DIR__) . '/assets/fonts/Bokor-Regular.ttf';
        $this->interFontPath = dirname(__DIR__) . '/assets/fonts/Inter-Regular.ttf';
    }

    /**
     * Generate standalone, print-ready HTML with embedded assets for the official ECC report.
     */
    public function renderEvaluationHtml(array $studentData): string {
        $logoBase64 = '';
        if (file_exists($this->logoPath)) {
            $logoData = file_get_contents($this->logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $studentName = htmlspecialchars($studentData['name'] ?? 'KOSAL SOKPISAL');
        $studentKhmerName = htmlspecialchars($studentData['khmerName'] ?? 'កុសល សុខពិសាល');
        $rawId = (string)($studentData['studentId'] ?? $studentData['student_code'] ?? $studentData['id'] ?? '201020');
        $numericId = preg_replace('/\D/', '', $rawId);
        if (strlen($numericId) === 4) {
            $numericId = '20' . $numericId;
        } elseif (strlen($numericId) > 6) {
            $numericId = substr($numericId, 0, 6);
        } elseif (strlen($numericId) > 0 && strlen($numericId) < 6) {
            $numericId = str_pad($numericId, 6, '0', STR_PAD_LEFT);
        }
        $studentId = htmlspecialchars($numericId ?: '201020');
        $gender = htmlspecialchars($studentData['gender'] ?? 'ប្រុស');
        $reportDate = htmlspecialchars($studentData['reportDate'] ?? '07/09/2026');
        $courseLevel = htmlspecialchars($studentData['courseLevel'] ?? 'សន្ទនាសម្រាប់បឋមទូទៅ');
        $academicYear = htmlspecialchars($studentData['academicYear'] ?? '២០២៦- ២០២៧');
        $termName = htmlspecialchars($studentData['termName'] ?? 'វគ្គទី៖ ខែ បញ្ចប់វគ្គសិក្សា');
        $foreignTeacher = htmlspecialchars($studentData['foreignTeacher'] ?? 'Jaden Grunk');
        $localTeacher = htmlspecialchars($studentData['localTeacher'] ?? 'Teacher Sophea');

        $criteria = $studentData['criteria'] ?? [
            ['no' => '១', 'name' => 'វត្តមាន', 'max' => 10, 'score' => 10, 'grade' => 'A'],
            ['no' => '២', 'name' => 'ការសង្កេតប្រចាំថ្ងៃ', 'max' => 15, 'score' => 13, 'grade' => 'B'],
            ['no' => '៣', 'name' => 'ការសង្កេតប្រចាំសប្តាហ៍', 'max' => 20, 'score' => 18, 'grade' => 'B'],
            ['no' => '៤', 'name' => 'ការធ្វើតេស្តជាមួយបរទេស', 'max' => 30, 'score' => 30, 'grade' => 'A'],
            ['no' => '៥', 'name' => 'ការប្រឡងបញ្ចប់', 'max' => 25, 'score' => 25, 'grade' => 'A'],
        ];

        $totalScore = array_reduce($criteria, fn($sum, $c) => $sum + ($c['score'] ?? 0), 0);
        $finalGrade = $totalScore >= 90 ? 'A' : ($totalScore >= 80 ? 'B' : ($totalScore >= 70 ? 'C' : ($totalScore >= 60 ? 'D' : 'E')));
        $isPassed = $totalScore >= 50;

        $khmerComments = $studentData['khmerComments'] ?? [
            '- ជាសិស្សសកម្មក្នុងការសិក្សា',
            '- ជាសិស្សមានភាពអត់ធ្មត់លើការសិក្សា',
            '- ជាសិស្សមានការតាំងចិត្តខ្ពស់លើការសិក្សា'
        ];

        $foreignComments = $studentData['foreignComments'] ?? [
            "1. Mr. {$studentName} demonstrates a positive attitude toward learning English.",
            "2. He is encouraged to improve his speaking confidence, vocabulary, pronunciation, through regular practice with {$localTeacher}.",
            "3. With consistent effort and dedication, he can achieve greater progress in English communication."
        ];

        ob_start();
        ?>
        <!DOCTYPE html>
        <html lang="km">
        <head>
            <meta charset="UTF-8">
            <title>ECC Evaluation Report - <?php echo $studentName; ?></title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Moul&family=Siemreap&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: A4 portrait;
                    margin: 8mm 10mm;
                }
                * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                    color: #0f172a;
                    font-family: 'Siemreap', system-ui, sans-serif;
                }
                .font-bokor, .font-khmer, .font-siemreap {
                    font-family: 'Siemreap', system-ui, sans-serif !important;
                }
                .font-english {
                    font-family: 'Inter', Arial, sans-serif !important;
                }
                .report-page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 12mm 14mm;
                    margin: 0 auto;
                    background: #ffffff;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1.5px solid #000000;
                }
                th, td {
                    border: 1px solid #000000;
                    padding: 5px 8px;
                    font-size: 13px;
                }
                .dotted-line {
                    border-bottom: 1px dotted #64748b;
                    padding-bottom: 3px;
                    margin-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <div class="report-page">
                <!-- TOP GOLD STRIPES -->
                <div style="width: 100%; margin-bottom: 6px;">
                    <div style="width: 100%; height: 1.5px; background: #c58c35;"></div>
                    <div style="width: 100%; height: 2.5px;"></div>
                    <div style="width: 100%; height: 3.5px; background: #c58c35;"></div>
                </div>

                <!-- TOP MOTTO BAR -->
                <div class="font-bokor" style="display: flex; justify-content: space-between; font-size: 13px; color: #0d3b66; font-weight: bold; margin-bottom: 6px;">
                    <span>មជ្ឈមណ្ឌលភាសាអង់គ្លេសសម្រាប់ទំនាក់ទំនង</span>
                    <span>រៀនទីនេះ ចេះទីនេះ ទំនាក់ទំនងគ្រប់ទីកន្លែង</span>
                </div>
                <div style="width: 100%; height: 1px; background: rgba(197, 140, 53, 0.7); margin-bottom: 12px;"></div>

                <!-- INSTITUTION HEADER -->
                <div style="display: flex; align-items: center; justify-content: center; gap: 18px; margin: 10px 0;">
                    <?php if ($logoBase64): ?>
                        <img src="<?php echo $logoBase64; ?>" alt="ECC Logo" style="width: 76px; height: 76px; object-fit: contain;">
                    <?php endif; ?>
                    <div style="text-align: center;">
                        <h2 style="font-family: 'Moul', serif; margin: 0; font-size: 17px; font-weight: bold; color: #1e3a8a;">
                            មជ្ឈមណ្ឌលភាសាអង់គ្លេសសម្រាប់ទំនាក់ទំនង
                        </h2>
                        <h3 class="font-english" style="margin: 3px 0 0; font-size: 14px; font-weight: bold; color: #0f172a;">
                            English for Communication Centre
                        </h3>
                        <p class="font-english" style="margin: 2px 0 0; font-size: 12px; color: #334155;">
                            Department of Examination Affair
                        </p>
                    </div>
                </div>

                <!-- CERTIFICATE TITLE -->
                <div style="text-align: center; margin: 12px 0 14px;">
                    <div class="font-siemreap" style="font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; color: #c02626;">
                        <span style="white-space: nowrap;">ព្រឹត្តិប័ត្រពិន្ទុសម្រាប់វគ្គសិក្សា ៖</span>
                        <span style="font-weight: bold; color: #c02626; white-space: nowrap;">
                            <?php echo $courseLevel; ?>
                        </span>
                    </div>
                    <div class="font-siemreap" style="font-size: 13px; color: #0284c7; font-weight: bold; margin-top: 5px;">
                        <span>ឆ្នាំសិក្សា៖ <?php echo $academicYear; ?></span>
                    </div>
                </div>

                <!-- 1. STUDENT INFORMATION -->
                <div style="margin-bottom: 14px;">
                    <h4 class="font-bokor" style="margin: 0 0 6px; font-size: 14px; color: #0284c7; font-weight: bold;">
                        ១. ព័ត៌មានអំពីសិស្សានុសិស្ស
                    </h4>
                    <div class="font-siemreap" style="font-size: 12.5px; display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 16px; row-gap: 6px; align-items: baseline;">
                        <!-- Row 1 — Column 1 (Left): Student Name (Khmer) -->
                        <div style="display: flex; align-items: baseline; overflow: hidden; white-space: nowrap;">
                            <span style="flex-shrink: 0;">- សិស្សឈ្មោះ :</span>
                            <strong style="margin-left: 6px; font-size: 13px;"><?php echo $studentKhmerName; ?></strong>
                        </div>

                        <!-- Row 1 — Column 2 (Center): Student Name (English) -->
                        <div class="font-english" style="display: flex; align-items: baseline; font-size: 12px; overflow: hidden; white-space: nowrap;">
                            <span class="font-siemreap" style="flex-shrink: 0;">ជាអក្សរឡាតាំង :</span>
                            <strong style="margin-left: 6px; text-transform: uppercase;"><?php echo strtoupper($studentName); ?></strong>
                        </div>

                        <!-- Row 1 — Column 3 (Right): Student ID -->
                        <div style="display: flex; align-items: baseline; overflow: hidden; white-space: nowrap;">
                            <span style="flex-shrink: 0;">អត្តលេខសិស្ស :</span>
                            <strong class="font-english" style="color: #dc2626; font-size: 13px; margin-left: 6px;"><?php echo $studentId; ?></strong>
                        </div>

                        <!-- Row 2 — Column 1 (Left): Gender -->
                        <div style="display: flex; align-items: baseline; overflow: hidden; white-space: nowrap;">
                            <span style="flex-shrink: 0;">- ភេទ :</span>
                            <strong style="margin-left: 6px;"><?php echo $gender; ?></strong>
                        </div>

                        <!-- Row 2 — Column 2 (Center): Assessment Date -->
                        <div style="display: flex; align-items: baseline; overflow: hidden; white-space: nowrap;">
                            <span style="flex-shrink: 0;">កាលបរិច្ឆេទចុះឈ្មោះសិក្សា :</span>
                            <span class="font-english" style="font-size: 12px; font-weight: 600; margin-left: 6px;"><?php echo $reportDate; ?></span>
                        </div>

                        <!-- Row 2 — Column 3 (Right): Empty cell preserving 3-column grid structure -->
                        <div></div>
                    </div>
                </div>

                <!-- 2. EVALUATION TABLE -->
                <div style="margin-bottom: 14px;">
                    <h4 class="font-bokor" style="margin: 0 0 6px; font-size: 14px; color: #0284c7; font-weight: bold;">
                        ២. តារាងវាយតម្លៃពិន្ទុ
                    </h4>
                    <table class="font-bokor">
                        <thead>
                            <tr style="background: #ffffff;">
                                <th style="width: 8%; text-align: center;">ល.រ</th>
                                <th style="width: 44%; text-align: center;">បរិយាយការវាយតម្លៃ</th>
                                <th style="width: 16%; text-align: center; color: #991b1b;">ពិន្ទុសរុប</th>
                                <th style="width: 16%; text-align: center; color: #991b1b;">ពិន្ទុទទួលបាន</th>
                                <th style="width: 16%; text-align: center; color: #991b1b;">និទ្ទេស</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($criteria as $c): ?>
                                <tr>
                                    <td style="text-align: center; font-weight: bold;"><?php echo $c['no']; ?></td>
                                    <td style="text-align: left;"><?php echo $c['name']; ?></td>
                                    <td style="text-align: center; font-weight: bold; color: #991b1b;"><?php echo $c['max']; ?></td>
                                    <td style="text-align: center; font-weight: bold; color: #991b1b;"><?php echo $c['score']; ?></td>
                                    <td style="text-align: center; font-weight: bold; color: #991b1b;"><?php echo $c['grade']; ?></td>
                                </tr>
                            <?php endforeach; ?>
                            <tr>
                                <td colspan="2" style="text-align: center; font-weight: bold; color: #991b1b;">ពិន្ទុសរុប</td>
                                <td style="text-align: center; font-weight: bold; color: #991b1b;"><?php echo $totalScore; ?></td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td colspan="2" style="text-align: center; font-weight: bold; color: #991b1b;">និទ្ទេស</td>
                                <td style="text-align: center; font-weight: bold; color: #991b1b;"><?php echo $finalGrade; ?></td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Result checkboxes -->
                    <div class="font-bokor" style="display: flex; justify-content: center; gap: 35px; margin-top: 8px; font-size: 13px; font-weight: bold;">
                        <span>• លទ្ធផល</span>
                        <span>[<?php echo $isPassed ? '✓' : ' '; ?>] ជាប់</span>
                        <span>[<?php echo !$isPassed ? '✓' : ' '; ?>] ធ្លាក់</span>
                    </div>
                </div>

                <!-- 3. TEACHER COMMENTS -->
                <div style="margin-bottom: 20px;">
                    <h4 class="font-bokor" style="margin: 0 0 6px; font-size: 14px; color: #0284c7; font-weight: bold;">
                        ៣. មតិយោបល់របស់គ្រូបង្រៀននិងគ្រូបរទេស
                    </h4>

                    <!-- Local Teacher Comments -->
                    <div style="margin-bottom: 8px;">
                        <p class="font-bokor" style="margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #dc2626;">
                            &gt; មតិយោបល់របស់គ្រូបង្រៀន
                        </p>
                        <div class="font-bokor" style="font-size: 12px;">
                            <?php foreach ($khmerComments as $km): ?>
                                <div class="dotted-line"><?php echo $km; ?></div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Foreign Teacher Comments -->
                    <div>
                        <p class="font-bokor" style="margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #dc2626;">
                            &gt; មតិយោបល់របស់គ្រូបរទេស
                        </p>
                        <div class="font-english" style="font-size: 11.5px; font-style: italic;">
                            <?php foreach ($foreignComments as $en): ?>
                                <div class="dotted-line"><?php echo $en; ?></div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <!-- 4. SIGNATURE SECTION -->
                <div style="margin-top: 25px;">
                    <div style="display: flex; justify-content: space-between; text-align: center;">
                        <div style="width: 32%;">
                            <p class="font-bokor" style="margin: 0; font-size: 12.5px; font-weight: bold;">បានឃើញនិងឯកភាព</p>
                            <p class="font-bokor" style="margin: 3px 0 0; font-size: 12.5px; font-weight: bold; color: #dc2626;">ហត្ថលេខាតំណាងព្យាបាល</p>
                            <div style="height: 48px;"></div>
                            <p class="font-english" style="margin: 0; font-size: 11px; color: #64748b;">Date: ......./................/..............</p>
                        </div>
                        <div style="width: 32%;">
                            <p class="font-english" style="margin: 0; font-size: 11px; color: #64748b;">Date: ......./................/..............</p>
                            <p class="font-english" style="margin: 3px 0 0; font-size: 12px; font-weight: bold;">Foreign Teacher's Signature</p>
                            <div style="height: 40px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-family: serif; font-style: italic; color: #312e81; font-size: 16px;">
                                    Jaden Grunk
                                </span>
                            </div>
                        </div>
                        <div style="width: 32%;">
                            <p class="font-bokor" style="margin: 0; font-size: 12px; color: #64748b;">ម.ស.ខ/ ថ្ងៃទី ..... / .......... / ..........</p>
                            <p class="font-bokor" style="margin: 3px 0 0; font-size: 12.5px; font-weight: bold;">ហត្ថលេខាគ្រូបង្រៀន</p>
                            <div style="height: 40px; display: flex; align-items: center; justify-content: center;">
                                <span class="font-bokor" style="font-size: 13px; color: #1e293b; font-weight: bold;">
                                    <?php echo $localTeacher; ?>
                                </span>
                            </div>
                            <p class="font-bokor" style="margin: 0; font-size: 11px; color: #64748b;"><?php echo $localTeacher; ?></p>
                        </div>
                    </div>
                </div>

                <!-- BOTTOM GOLD STRIPES -->
                <div style="width: 100%; margin-top: 25px;">
                    <div style="width: 100%; height: 3.5px; background: #c58c35;"></div>
                    <div style="width: 100%; height: 2.5px;"></div>
                    <div style="width: 100%; height: 1.5px; background: #c58c35;"></div>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }
}

