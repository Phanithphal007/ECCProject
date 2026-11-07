/**
 * Centralized Automatic Teacher Remarks Generator Service — ECC EduManage
 * 
 * 100% Local Rule-Based Engine:
 * - NO external AI APIs (Gemini, OpenAI, etc.) required
 * - NO API keys or external server dependencies
 * - Operates instantly directly in the browser and when deployed on InfinityFree
 * - Generates tailored, professional English & natural Khmer remarks based on
 *   the student's actual assessment scores, identifying specific strengths and areas for growth.
 */

// Skill mappings in English and Khmer
const SKILL_MAP = [
  {
    keywords: ['speak', 'conversation', 'foreign', 'សន្ទនា', 'បរទេស', 'និយាយ'],
    category: 'Speaking & Pronunciation',
    categoryKhmer: 'ការសន្ទនា និងការបញ្ចេញសំឡេង',
    strengthEn: 'English speaking confidence, clear pronunciation, and verbal interaction',
    strengthKm: 'ភាពជឿជាក់ក្នុងការសន្ទនាភាសាអង់គ្លេស និងការបញ្ចេញសំឡេងច្បាស់លាស់',
    improveEn: 'regular conversational speaking practice and pronunciation exercises',
    improveKm: 'ការហាត់និយាយសន្ទនាជាប្រចាំ និងការកែលម្អការបញ្ចេញសំឡេង'
  },
  {
    keywords: ['listen', 'ស្តាប់', 'ការស្តាប់'],
    category: 'Listening Comprehension',
    categoryKhmer: 'ការស្តាប់ និងការយល់ដឹង',
    strengthEn: 'active listening skills and following spoken classroom instructions attentively',
    strengthKm: 'សមត្ថភាពស្តាប់យល់បានល្អ និងការផ្ចង់អារម្មណ៍តាមដានការណែនាំរបស់គ្រូ',
    improveEn: 'listening to English audio stories and audio comprehension exercises',
    improveKm: 'ការស្តាប់សាច់រឿងភាសាអង់គ្លេស និងការអនុវត្តលំហាត់ស្តាប់បន្ថែម'
  },
  {
    keywords: ['read', 'អាន', 'ការអាន'],
    category: 'Reading Fluency',
    categoryKhmer: 'ការអាន និងការយល់ន័យ',
    strengthEn: 'reading fluency, word recognition, and reading comprehension',
    strengthKm: 'ភាពស្ទាត់ជំនាញក្នុងការអាន និងការយល់ន័យនៃពាក្យពេចន៍',
    improveEn: 'guided daily reading and vocabulary expansion',
    improveKm: 'ការអានសៀវភៅភាសាអង់គ្លេសជារៀងរាល់ថ្ងៃ និងការទន្ទេញពាក្យគន្លឹះ'
  },
  {
    keywords: ['writ', 'សរសេរ', 'ការសរសេរ'],
    category: 'Writing & Spelling',
    categoryKhmer: 'ការសរសេរ និងអក្ខរាវិរុទ្ធ',
    strengthEn: 'spelling accuracy, neat handwriting, and written sentence construction',
    strengthKm: 'ភាពត្រឹមត្រូវនៃអក្ខរាវិរុទ្ធ សំណេរស្អាត និងការបង្កើតល្បះខ្លីៗ',
    improveEn: 'spelling practice, sentence formation, and short paragraph writing',
    improveKm: 'ការហាត់សរសេរតាមអាន ការកែតម្រូវអក្ខរាវិរុទ្ធ និងការតែងល្បះ'
  },
  {
    keywords: ['attend', 'វត្តមាន', 'វត្ត'],
    category: 'Attendance & Punctuality',
    categoryKhmer: 'វត្តមាន និងវិន័យ',
    strengthEn: 'outstanding attendance, punctuality, and consistent classroom presence',
    strengthKm: 'វត្តមានទៀងទាត់ គោរពពេលវេលា និងមានវិន័យល្អក្នុងការសិក្សា',
    improveEn: 'maintaining regular attendance and avoiding unnecessary absences',
    improveKm: 'ការបន្តរក្សាវត្តមានឱ្យបានពេញលេញ និងមិនអវត្តមានដោយគ្មានច្បាប់'
  },
  {
    keywords: ['observ', 'daily', 'week', 'សង្កេត', 'ប្រចាំ'],
    category: 'Classroom Participation',
    categoryKhmer: 'ការចូលរួមសកម្មភាពក្នុងថ្នាក់',
    strengthEn: 'active classroom participation, positive peer collaboration, and diligence',
    strengthKm: 'ការចូលរួមសកម្មភាពក្នុងថ្នាក់យ៉ាងសកម្ម និងសហការបានល្អជាមួយមិត្តរួមថ្នាក់',
    improveEn: 'active involvement in group exercises and volunteering answers in class',
    improveKm: 'ការបង្កើនភាពក្លាហានក្នុងការឆ្លើយសំណួរ និងចូលរួមសកម្មភាពជាក្រុម'
  },
  {
    keywords: ['exam', 'final', 'test', 'ប្រឡង', 'តេស្ត', 'បញ្ចប់'],
    category: 'Curriculum Mastery',
    categoryKhmer: 'ការក្តាប់បានមេរៀនទូទៅ',
    strengthEn: 'thorough understanding of core curriculum concepts and test readiness',
    strengthKm: 'ការយល់ដឹងច្បាស់លាស់លើខ្លឹមសារមេរៀន និងលទ្ធផលប្រឡងគាប់ប្រសើរ',
    improveEn: 'structured review of lesson units and homework assignments',
    improveKm: 'ការរំលឹកមេរៀនជាប្រចាំ និងការធ្វើស្វ័យសិក្សាមុនពេលប្រឡង'
  }
];

/**
 * Match an item name to its skill definition
 */
const detectSkill = (item) => {
  const text = `${item.name || ''} ${item.nameKhmer || ''}`.toLowerCase();
  for (const s of SKILL_MAP) {
    if (s.keywords.some((kw) => text.includes(kw))) {
      return s;
    }
  }
  return {
    category: 'General English Skills',
    categoryKhmer: 'ជំនាញភាសាអង់គ្លេសទូទៅ',
    strengthEn: 'consistent academic effort and task completion',
    strengthKm: 'ការខិតខំប្រឹងប្រែងរៀនសូត្រ និងការបំពេញកិច្ចការបានល្អ',
    improveEn: 'consistent daily revision and practice',
    improveKm: 'ការរំលឹកមេរៀន និងអនុវត្តលំហាត់បន្ថែមជាប្រចាំ'
  };
};

/**
 * Analyze items and return categorized scores, strengths, and improvements
 */
export const analyzeScores = (items = [], metrics = null) => {
  if (!items || items.length === 0) {
    return {
      percentage: metrics?.percentage || 0,
      grade: metrics?.grade || 'N/A',
      strengths: [],
      improvements: [],
      topStrength: null,
      topImprovement: null
    };
  }

  const analyzed = items.map((it) => {
    const max = Number(it.maxScore) || 100;
    const obt = Number(it.obtainedScore) || 0;
    const pct = max > 0 ? (obt / max) * 100 : 0;
    const skill = detectSkill(it);
    return {
      ...it,
      percentage: pct,
      skill
    };
  });

  // Sort by percentage descending
  analyzed.sort((a, b) => b.percentage - a.percentage);

  const strengths = analyzed.filter((a) => a.percentage >= 80);
  const improvements = analyzed.filter((a) => a.percentage < 75);

  const topStrength = analyzed[0]?.skill || SKILL_MAP[0];
  const topImprovement = improvements.length > 0
    ? improvements[improvements.length - 1].skill
    : analyzed[analyzed.length - 1]?.skill || SKILL_MAP[0];

  const overallPct = metrics?.percentage ?? (
    analyzed.reduce((sum, a) => sum + a.obtainedScore, 0) /
    Math.max(1, analyzed.reduce((sum, a) => sum + a.maxScore, 0)) * 100
  );

  let grade = metrics?.grade;
  if (!grade || grade === '-') {
    if (overallPct >= 90) grade = 'A';
    else if (overallPct >= 80) grade = 'B';
    else if (overallPct >= 70) grade = 'C';
    else if (overallPct >= 60) grade = 'D';
    else grade = 'F';
  }

  return {
    percentage: Number(overallPct.toFixed(1)),
    grade,
    strengths,
    improvements,
    topStrength,
    topImprovement
  };
};

/**
 * Generate English Teacher Remarks (Professional & constructive)
 * 
 * @param {Object} params
 * @param {Object} params.student - Student record
 * @param {Array} params.items - Assessment items
 * @param {Object} [params.metrics] - Total score metrics
 * @param {Object} [params.options] - Teacher names, course
 * @returns {string} Multiline English remarks
 */
export const generateEnglishRemarks = ({ student, items = [], metrics = null, options = {} }) => {
  const analysis = analyzeScores(items, metrics);
  const { grade, percentage, topStrength, topImprovement } = analysis;

  const isFemale = student?.gender === 'Female' || student?.gender === 'ស្រី';
  const prefix = isFemale ? 'Miss' : 'Mr.';
  const pronounSubj = isFemale ? 'She' : 'He';
  const pronounObj = isFemale ? 'her' : 'him';
  const pronounPoss = isFemale ? 'Her' : 'His';
  const rawName = student?.name || 'Student';
  const engName = rawName.toUpperCase();
  const teacherName = options.leadTeacher || options.teacher || 'Teacher Sovannary Long';

  const lines = [];

  if (grade === 'A') {
    lines.push(
      `1. ${prefix} ${engName} demonstrates exceptional dedication and outstanding academic excellence throughout this term.`
    );
    lines.push(
      `2. ${pronounPoss} mastery in ${topStrength.strengthEn} is particularly noteworthy, reflecting quick comprehension and active enthusiasm.`
    );
    lines.push(
      `3. ${pronounSubj} is encouraged to maintain this high standard and continue expanding ${pronounObj}self with advanced vocabulary and expressive speaking with ${teacherName}.`
    );
  } else if (grade === 'B') {
    lines.push(
      `1. ${prefix} ${engName} has made steady, commendable progress and exhibits a positive, cooperative attitude in all English sessions.`
    );
    lines.push(
      `2. ${pronounSubj} performs reliably in ${topStrength.strengthEn}, displaying consistent effort and attentiveness.`
    );
    lines.push(
      `3. Further targeted practice in ${topImprovement.improveEn} with ${teacherName} will empower ${pronounObj} to achieve even greater confidence.`
    );
  } else if (grade === 'C') {
    lines.push(
      `1. ${prefix} ${engName} shows satisfactory engagement and participates reasonably well in regular classroom learning.`
    );
    lines.push(
      `2. While ${pronounSubj.toLowerCase()} has made good foundational effort in ${topStrength.strengthEn}, additional revision is strongly recommended.`
    );
    lines.push(
      `3. Regular home practice and focused focus on ${topImprovement.improveEn} will significantly enhance ${pronounPoss.toLowerCase()} communication fluency.`
    );
  } else {
    // Grade D or F
    lines.push(
      `1. ${prefix} ${engName} requires closer guidance and consistent daily encouragement to strengthen ${pronounPoss.toLowerCase()} English foundation.`
    );
    lines.push(
      `2. Focused extra support in ${topImprovement.improveEn} is essential to build basic comprehension and word recognition.`
    );
    lines.push(
      `3. Maintaining punctual attendance and active one-on-one review with ${teacherName} will help ${pronounObj} overcome learning hurdles.`
    );
  }

  return lines.join('\n');
};

/**
 * Generate Natural Khmer Teacher Remarks (Culturally encouraging & grammatically fluent)
 * 
 * @param {Object} params
 * @param {Object} params.student - Student record
 * @param {Array} params.items - Assessment items
 * @param {Object} [params.metrics] - Total score metrics
 * @param {Object} [params.options] - Teacher names, course
 * @returns {string} Multiline Khmer remarks
 */
export const generateKhmerRemarks = ({ student, items = [], metrics = null, options = {} }) => {
  const analysis = analyzeScores(items, metrics);
  const { grade, topStrength, topImprovement } = analysis;

  const lines = [];

  if (grade === 'A') {
    lines.push(
      `- ជាសិស្សពូកែ មានវិន័យថ្លៃថ្នូរ និងយកចិត្តទុកដាក់ខ្ពស់លើការរៀនសូត្រជាប្រចាំ។`
    );
    lines.push(
      `- មានភាពលេចធ្លោខ្លាំងលើ${topStrength.strengthKm} និងក្លាហានក្នុងការចូលរួមសកម្មភាពក្នុងថ្នាក់។`
    );
    lines.push(
      `- លើកទឹកចិត្តឱ្យបន្តរក្សាភាពឧស្សាហ៍ព្យាយាម និងពង្រីកការអានដើម្បីបង្កើនចំណេះដឹងភាសាអង់គ្លេសកាន់តែទូលំទូលាយ។`
    );
  } else if (grade === 'B') {
    lines.push(
      `- ជាសិស្សមានភាពឧស្សាហ៍ព្យាយាម និងមានការរីកចម្រើនគួរឱ្យកត់សម្គាល់ក្នុងការសិក្សា។`
    );
    lines.push(
      `- បង្ហាញសមត្ថភាពបានល្អលើ${topStrength.strengthKm} និងមានទំនាក់ទំនងរាក់ទាក់ជាមួយគ្រូ និងមិត្តភក្តិ។`
    );
    lines.push(
      `- គួរចំណាយពេលអនុវត្តបន្ថែមលើ${topImprovement.improveKm} ដើម្បីទទួលបានលទ្ធផលកាន់តែប្រសើរឡើង។`
    );
  } else if (grade === 'C') {
    lines.push(
      `- ជាសិស្សមានការខិតខំប្រឹងប្រែងរៀនសូត្រ និងចូលរួមក្នុងថ្នាក់រៀនបានសមរម្យ។`
    );
    lines.push(
      `- មានការយល់ដឹងជាមូលដ្ឋាន ប៉ុន្តែនៅខ្វះការហាត់អនុវត្តជាក់ស្តែង ជាពិសេសលើ${topImprovement.improveKm}។`
    );
    lines.push(
      `- លើកទឹកចិត្តឱ្យបង្កើនការទន្ទេញពាក្យ រំលឹកមេរៀននៅផ្ទះបន្ថែម និងសួរសំណួរគ្រូឱ្យបានញឹកញាប់ពេលមិនយល់។`
    );
  } else {
    // Grade D or F
    lines.push(
      `- ត្រូវការការយកចិត្តទុកដាក់ និងការជួយគាំទ្របន្ថែមលើការរៀនភាសាអង់គ្លេសពីគ្រូ និងអាណាព្យាបាល។`
    );
    lines.push(
      `- គួរបង្កើនពេលវេលារំលឹកមេរៀនឡើងវិញនៅផ្ទះ ជាពិសេសលើ${topImprovement.improveKm}។`
    );
    lines.push(
      `- លើកទឹកចិត្តឱ្យប្អូនខិតខំប្រឹងប្រែងឡើងវិញ ចូលរៀនឱ្យបានទៀងទាត់ និងកុំមានការអៀនខ្មាសក្នុងការរៀនសូត្រ។`
    );
  }

  return lines.join('\n');
};

/**
 * Universal Remark Generator
 * Returns both English and Khmer remarks in a single unified call.
 */
export const generateBothRemarks = ({ student, items = [], metrics = null, options = {} }) => {
  return {
    english: generateEnglishRemarks({ student, items, metrics, options }),
    khmer: generateKhmerRemarks({ student, items, metrics, options }),
    analysis: analyzeScores(items, metrics)
  };
};

export const remarkGeneratorService = {
  analyzeScores,
  generateEnglishRemarks,
  generateKhmerRemarks,
  generateBothRemarks
};

export default remarkGeneratorService;

