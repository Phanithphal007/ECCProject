import { forwardRef } from 'react';
import { ECC_LOGO_BASE64 } from '../../assets/eccLogoBase64';
import { JADEN_GRUNK_SIGNATURE_BASE64 } from '../../assets/jadenGrunkSignatureBase64';
import { getOfficialStudentId } from '../../utils/studentId';

export const EccScoreReport = forwardRef(({
  student,
  scoreRecord,
  academicYear = "២០២៦- ២០២៧",
  reportDate = "07/09/2026",
  mode = "screen", // "screen" (Siemreap font) | "print" (Bokor font)
  className = ""
}, ref) => {
  if (!student) return null;

  // Student name formatting
  const khmerName = student.khmerName || student.name || 'កុសល សុខពិសាល';
  const englishName = (student.name || 'KOSAL SOKPISAL').toUpperCase();

  // Student ID: Read the actual official 6-digit Student ID from the selected student record
  const studentIdDisplay = getOfficialStudentId(student);

  // Gender in Khmer
  const genderKhmer = student.gender === 'Female' || student.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស';

  // Course Level
  const courseLevel = scoreRecord?.course || student.course || "សន្ទនាសម្រាប់បឋមទូទៅ";
  const displayAcademicYear = scoreRecord?.academicYear || academicYear;
  const termName = scoreRecord?.periodNameKhmer || "វគ្គ/ខែ បញ្ចប់វគ្គសិក្សា";

  // Score Items
  const items = (scoreRecord && Array.isArray(scoreRecord.items) && scoreRecord.items.length > 0)
    ? scoreRecord.items
    : [
        { id: 1, noKhmer: '១', nameKhmer: 'វត្តមាន', maxScore: 10, obtainedScore: 10, grade: 'A' },
        { id: 2, noKhmer: '២', nameKhmer: 'ការសង្កេតប្រចាំថ្ងៃ', maxScore: 15, obtainedScore: 13, grade: 'B' },
        { id: 3, noKhmer: '៣', nameKhmer: 'ការសង្កេតប្រចាំសប្តាហ៍', maxScore: 20, obtainedScore: 18, grade: 'B' },
        { id: 4, noKhmer: '៤', nameKhmer: 'ការធ្វើតេស្តជាមួយបរទេស', maxScore: 30, obtainedScore: 30, grade: 'A' },
        { id: 5, noKhmer: '៥', nameKhmer: 'ការប្រឡងបញ្ចប់', maxScore: 25, obtainedScore: 25, grade: 'A' }
      ];

  const totalObtained = scoreRecord?.metrics?.totalObtained ?? items.reduce((sum, it) => sum + Number(it.obtainedScore || 0), 0);
  const totalMax = scoreRecord?.metrics?.totalMax ?? items.reduce((sum, it) => sum + Number(it.maxScore || 0), 100);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  
  const finalGrade = scoreRecord?.metrics?.grade && scoreRecord.metrics.grade !== '-'
    ? scoreRecord.metrics.grade
    : (percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : percentage >= 50 ? 'E' : 'F');

  const isPassed = percentage >= 50;

  // Remarks formatting
  const defaultKhmerComments = [
    "-ជាសិស្សសកម្មក្នុងការសិក្សា",
    "-ជាសិស្សមានភាពអត់ធ្មត់លើការសិក្សា",
    "-ជាសិស្សមានការតាំងចិត្តខ្ពស់លើការសិក្សា"
  ];

  const prefixTitle = genderKhmer === 'ស្រី' ? 'Miss' : 'Mr.';
  const defaultForeignComments = [
    `1. ${prefixTitle} ${englishName} demonstrates a positive attitude toward learning English.`,
    `2. He is encouraged to improve his speaking confidence, vocabulary, pronunciation, through regular practice with Teacher Veasna.`,
    "3. With consistent effort and dedication, he can achieve greater progress in English communication."
  ];

  let khmerCommentLines = defaultKhmerComments;
  if (scoreRecord?.teacherRemarksKhmer) {
    if (Array.isArray(scoreRecord.teacherRemarksKhmer)) {
      const f = scoreRecord.teacherRemarksKhmer.map(s => String(s || '').trim()).filter(Boolean);
      if (f.length > 0) khmerCommentLines = f;
    } else {
      const f = String(scoreRecord.teacherRemarksKhmer).split('\n').map(s => s.trim()).filter(Boolean);
      if (f.length > 0) khmerCommentLines = f;
    }
  }

  let englishCommentLines = defaultForeignComments;
  if (scoreRecord?.teacherRemarks) {
    if (Array.isArray(scoreRecord.teacherRemarks)) {
      const f = scoreRecord.teacherRemarks.map(s => String(s || '').trim()).filter(Boolean);
      if (f.length > 0) englishCommentLines = f;
    } else {
      const f = String(scoreRecord.teacherRemarks).split('\n').map(s => s.trim()).filter(Boolean);
      if (f.length > 0) englishCommentLines = f;
    }
  }

  return (
    <div
      ref={ref}
      id="ecc-official-score-sheet"
      className={`ecc-report-document ecc-report-screen font-khmer bg-white text-slate-950 mx-auto select-none print:m-0 print:p-0 ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm 15mm 12mm 15mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        fontFamily: '"Siemreap", system-ui, sans-serif'
      }}
    >
      {/* ================= TOP MOTTO BAR ================= */}
      <div className="flex items-center justify-between px-1 pb-1 font-report-khmer text-[13px] text-[#1a5b8c] font-semibold tracking-wide">
        <span>មជ្ឈមណ្ឌលភាសាអង់គ្លេសសម្រាប់ទំនាក់ទំនង</span>
        <span>រៀនទីនេះ ចេះទីនេះ ទំនាក់ទំនងគ្រប់ទីកន្លែង</span>
      </div>

      {/* ================= TOP DOUBLE ORANGE STRIPE ================= */}
      <div className="w-full mb-3">
        <div className="w-full h-[4.5px] bg-[#c58c35]" />
        <div className="w-full h-[2.5px]" />
        <div className="w-full h-[1.5px] bg-[#c58c35]" />
      </div>

      {/* ================= HEADER: OFFICIAL LOGO & INSTITUTION ================= */}
      <div className="flex items-center justify-center gap-5 my-2">
        <img
          src={ECC_LOGO_BASE64}
          alt="ECC Logo"
          className="w-[78px] h-[78px] object-contain shrink-0"
          crossOrigin="anonymous"
        />
        <div className="text-center">
          <h2
            className="text-[17px] font-bold text-[#0d3b66] leading-tight tracking-wide"
            style={{ fontFamily: '"Moul", serif' }}
          >
            មជ្ឈមណ្ឌលភាសាអង់គ្លេសសម្រាប់ទំនាក់ទំនង
          </h2>
          <h3 className="font-report-english text-[14px] font-bold text-[#111827] leading-snug tracking-normal mt-0.5">
            English for Communication Centre
          </h3>
          <p className="font-report-english text-[12px] font-medium text-[#374151] leading-tight mt-0.5">
            Department of Examination Affair
          </p>
        </div>
      </div>

      {/* ================= REPORT TITLE & ACADEMIC YEAR ================= */}
      <div className="w-full my-3 text-center">
        {/* Course title line without red dotted line */}
        <div className="flex items-center justify-center gap-2 w-full font-bold text-[#c02626] text-[15px]">
          <span className="shrink-0 font-report-khmer tracking-wide whitespace-nowrap">
            ព្រឹត្តិប័ត្រពិន្ទុសម្រាប់វគ្គសិក្សា ៖
          </span>
          <span className="font-report-khmer font-bold text-[#c02626] tracking-wide whitespace-nowrap">
            {courseLevel}
          </span>
        </div>

        {/* Academic year only (Khmer date/period text completely removed) */}
        <div className="flex items-center justify-center font-report-khmer text-[#0284c7] font-bold text-[14px] mt-1">
          <span>ឆ្នាំសិក្សា៖ {displayAcademicYear}</span>
        </div>
      </div>

      {/* ================= 1. STUDENT INFORMATION ================= */}
      <div className="mt-3.5 mb-2 font-report-khmer">
        <h4 className="text-[14px] font-bold text-[#0284c7] mb-1.5">
          ១. ព័ត៌មានអំពីសិស្សានុសិស្ស
        </h4>
        <div
          className="text-[12.5px] leading-relaxed pl-1"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            columnGap: '16px',
            rowGap: '6px',
            alignItems: 'baseline'
          }}
        >
          {/* Row 1 — Column 1 (Left): Student Name (Khmer) */}
          <div className="flex items-baseline truncate pr-1">
            <span className="text-slate-900 shrink-0 whitespace-nowrap">- សិស្សឈ្មោះ :</span>
            <strong className="text-slate-950 font-bold ml-1.5 text-[13px] truncate">
              {khmerName}
            </strong>
          </div>

          {/* Row 1 — Column 2 (Center): Student Name (English) */}
          <div className="flex items-baseline truncate pr-1">
            <span className="text-slate-900 shrink-0 whitespace-nowrap">ជាអក្សរឡាតាំង :</span>
            <strong className="text-slate-950 font-bold ml-1.5 font-report-english text-[12px] tracking-wide uppercase truncate">
              {englishName}
            </strong>
          </div>

          {/* Row 1 — Column 3 (Right): Student ID */}
          <div className="flex items-baseline truncate pr-1">
            <span className="text-slate-900 shrink-0 whitespace-nowrap">អត្តលេខសិស្ស :</span>
            <strong className="text-[#dc2626] font-bold text-[13px] ml-1.5 tracking-wider font-report-english">
              {studentIdDisplay}
            </strong>
          </div>

          {/* Row 2 — Column 1 (Left): Gender */}
          <div className="flex items-baseline truncate pr-1">
            <span className="text-slate-900 shrink-0 whitespace-nowrap">- ភេទ :</span>
            <strong className="text-slate-950 font-bold ml-1.5 text-[12.5px]">
              {genderKhmer}
            </strong>
          </div>

          {/* Row 2 — Column 2 (Center & Right): Assessment Date (spans columns 2-3 to prevent any truncation) */}
          <div
            className="flex items-baseline"
            style={{ gridColumn: '2 / -1' }}
          >
            <span className="text-slate-900 shrink-0 whitespace-nowrap">កាលបរិច្ឆេទចុះឈ្មោះសិក្សា :</span>
            <span className="font-report-english text-slate-950 font-semibold text-[12px] ml-1.5 whitespace-nowrap">
              {scoreRecord?.dateRecorded || student?.assessmentDate || student?.enrollmentDate || reportDate || '2026-11-06'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 2. EVALUATION TABLE ================= */}
      <div className="mt-3">
        <h4 className=" font-khmer text-[14px] font-bold text-[#0284c7] text-center mb-1.5">
          ២. តារាងវាយតម្លៃពិន្ទុ
        </h4>
        <table className="w-full border-collapse border border-black text-[12.5px] font-report-khmer">
          <thead>
            <tr className="bg-white">
              <th className="border border-black py-1.5 px-2 text-center font-bold text-[#b91c1c] w-[8%]">
                ល.រ
              </th>
              <th className="border border-black py-1.5 px-3 text-center font-bold text-[#b91c1c] w-[44%]">
                បរិយាយការវាយតម្លៃ
              </th>
              <th className="border border-black py-1.5 px-2 text-center font-bold text-[#b91c1c] w-[16%]">
                ពិន្ទុសរុប
              </th>
              <th className="border border-black py-1.5 px-2 text-center font-bold text-[#b91c1c] w-[18%]">
                ពិន្ទុទទួលបាន
              </th>
              <th className="border border-black py-1.5 px-2 text-center font-bold text-[#b91c1c] w-[14%]">
                និទ្ទេស
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const max = Number(item.maxScore) || 0;
              const obt = Number(item.obtainedScore) || 0;
              const ratio = max > 0 ? (obt / max) * 100 : 0;
              let itemGrade = item.grade || (ratio >= 90 ? 'A' : ratio >= 80 ? 'B' : ratio >= 70 ? 'C' : ratio >= 60 ? 'D' : ratio >= 50 ? 'E' : 'F');
              const khmerNumber = item.noKhmer || ['១','២','៣','៤','៥','៦','៧','៨','៩','១០'][idx] || (idx + 1);

              return (
                <tr key={item.id || idx} className="h-6">
                  <td className="border border-black py-1 px-2 text-center font-bold text-slate-950">
                    {khmerNumber}
                  </td>
                  <td className="border border-black py-1 px-3 text-left font-medium text-slate-950">
                    {item.nameKhmer || item.name || item.categoryKhmer || item.category}
                  </td>
                  <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]">
                    {max}
                  </td>
                  <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]">
                    {obt}
                  </td>
                  <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]">
                    {itemGrade}
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="h-6">
              <td colSpan={2} className="border border-black py-1 px-3 text-center font-bold text-[#b91c1c]">
                ពិន្ទុសរុប
              </td>
              <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]">
                {totalObtained}
              </td>
              <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]"></td>
              <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]"></td>
            </tr>

            {/* Final Grade Row */}
            <tr className="h-6">
              <td colSpan={2} className="border border-black py-1 px-3 text-center font-bold text-[#b91c1c]">
                និទ្ទេស
              </td>
              <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]">
                {finalGrade}
              </td>
              <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]"></td>
              <td className="border border-black py-1 px-2 text-center font-bold text-[#b91c1c]"></td>
            </tr>
          </tbody>
        </table>

        {/* Pass / Fail Outcome Checkboxes */}
        <div className="flex items-center justify-center gap-12 font-report-khmer text-[13px] text-slate-950 mt-2">
          <span className="font-bold text-[#b91c1c] text-[13.5px]">• លទ្ធផល</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-[15px] h-[15px] border border-black text-black font-sans text-[11px] font-bold leading-none">
              {isPassed ? '✓' : ''}
            </span>
            <span className="font-semibold text-slate-950">ជាប់</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-[15px] h-[15px] border border-black text-black font-sans text-[11px] font-bold leading-none">
              {!isPassed ? '✓' : ''}
            </span>
            <span className="font-semibold text-slate-950">ធ្លាក់</span>
          </div>
        </div>
      </div>

      {/* ================= 3. TEACHER COMMENTS ================= */}
      <div className="mt-3.5 space-y-2.5">
        <h4
          className="font-report-khmer text-[13.5px] font-bold text-[#0284c7] tracking-wide"
          style={{ fontFamily: '"Siemreap", system-ui, sans-serif' }}
        >
          ៣. មតិយោបល់របស់គ្រូបង្រៀននិងគ្រូបរទេស
        </h4>

        {/* Local Teacher Comments (Khmer) */}
        <div className="space-y-1.5">
          <div
            className="font-report-khmer text-[13px] font-bold text-[#dc2626] flex items-center gap-1.5"
            style={{ fontFamily: '"Siemreap", system-ui, sans-serif' }}
          >
            <span>&gt;</span>
            <span>មតិយោបល់របស់គ្រូបង្រៀន</span>
          </div>

          <div className="space-y-2 pl-1.5">
            {khmerCommentLines.map((line, idx) => {
              const trimmed = String(line || '').trim();
              if (!trimmed) return null;
              // Clean leading dash, bullet, asterisk, or numbering from text to ensure consistent bullet presentation
              const cleanText = trimmed.replace(/^(?:[-•*]|\d+[\.)])\s*/, '');
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-left"
                >
                  <span
                    className="font-report-khmer text-slate-800 font-bold select-none shrink-0 text-[13px] leading-[1.8]"
                    style={{ fontFamily: '"Siemreap", system-ui, sans-serif' }}
                    aria-hidden="true"
                  >
                    -
                  </span>
                  <p
                    className="grow m-0 font-report-khmer text-[12.5px] text-slate-950 font-medium leading-[1.8] text-left"
                    style={{
                      fontFamily: '"Siemreap", system-ui, sans-serif',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      textRendering: 'optimizeLegibility'
                    }}
                  >
                    {cleanText}
                  </p>
                </div>
              );
            })}

            {khmerCommentLines.length === 0 && (
              <div className="space-y-3 pl-1.5 pt-1">
                <div className="border-b border-dotted border-slate-300 h-4" />
                <div className="border-b border-dotted border-slate-300 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Foreign Teacher Comments (English in italics, reddish-brown) */}
        <div className="pt-1.5 space-y-1.5">
          <div
            className="font-report-khmer text-[13px] font-bold text-[#dc2626] flex items-center gap-1.5"
            style={{ fontFamily: '"Siemreap", system-ui, sans-serif' }}
          >
            <span>&gt;</span>
            <span>មតិយោបល់របស់គ្រូបរទេស</span>
          </div>

          <div className="space-y-1.5 pl-1.5 font-report-english">
            {englishCommentLines.map((cm, idx) => {
              const trimmed = String(cm || '').trim();
              if (!trimmed) return null;
              // Detect if comment already starts with a number (e.g. "1. " or "1) ")
              const match = trimmed.match(/^(\d+)[\.)]\s*(.*)$/);
              const num = match ? match[1] : (idx + 1);
              const cleanText = match ? match[2] : trimmed;

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-left"
                >
                  <span
                    className="font-report-english text-[#881337] font-bold select-none shrink-0 text-[11.5px] leading-[1.6]"
                    style={{ fontFamily: "'Inter', Arial, sans-serif" }}
                  >
                    {num}.
                  </span>
                  <p
                    className="grow m-0 font-report-english italic text-[11.5px] text-[#881337] font-semibold leading-[1.6] text-left"
                    style={{
                      fontFamily: "'Inter', Arial, sans-serif",
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {cleanText}
                  </p>
                </div>
              );
            })}

            {englishCommentLines.length === 0 && (
              <div className="space-y-3 pl-1.5 pt-1">
                <div className="border-b border-dotted border-slate-300 h-4" />
                <div className="border-b border-dotted border-slate-300 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 4. SIGNATURES & DATES ================= */}
      <div className="mt-6 pt-1 font-report-khmer">
        <div className="grid grid-cols-3 gap-2 text-center items-start">
          {/* Left Column: Guardian */}
          <div>
            <p className="text-[12.5px] text-slate-950 font-bold">
              បានឃើញនិងឯកភាព
            </p>
            <p className="text-[12px] font-bold text-[#dc2626] mt-0.5">
              ហត្ថលេខាអាណាព្យាបាល
            </p>
            <div className="h-16" />
          </div>

          {/* Center Column: Foreign Teacher */}
          <div>
            <p className="font-report-english text-[11px] text-slate-700">
              Date: ......./................/..............
            </p>
            <p className="font-report-english text-[12px] font-bold text-slate-900 mt-0.5">
              Foreign Teacher's Signature
            </p>
            {/* Real Blue Handwritten Signature */}
            <div className="h-12 flex items-center justify-center my-0.5">
              <img
                src={JADEN_GRUNK_SIGNATURE_BASE64}
                alt="Signature"
                className="h-11 w-auto max-w-[150px] object-contain select-none"
              />
            </div>
          </div>

          {/* Right Column: Local Teacher */}
          <div>
            <p className="text-[11.5px] text-slate-700">
              ម.ស.ខ/ ថ្ងៃទី ..... / .......... / ..........
            </p>
            <div className="h-16 flex items-center justify-center">
              {/* Official teacher signature space */}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM DOUBLE ORANGE STRIPE ================= */}
      <div className="w-full mt-7">
        <div className="w-full h-[4.5px] bg-[#c58c35]" />
        <div className="w-full h-[2.5px]" />
        <div className="w-full h-[1.5px] bg-[#c58c35]" />
      </div>
    </div>
  );
});

EccScoreReport.displayName = 'EccScoreReport';
