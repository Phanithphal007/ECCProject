/**
 * Static Mock Courses Data
 * Courses are learning programs offered by ECC English Learning Center.
 * (Separate concept from Classes, which are scheduled cohorts).
 */
export const mockCourses = [
  {
    id: "CRS-ALPHA",
    slug: "english-alphabet",
    code: "ALP-101",
    name: "English Alphabet & Early Literacy",
    nameKhmer: "អក្សរក្រមអង់គ្លេស និងការអានដំបូង",
    category: "Young Learners (Ages 4-6)",
    level: "Beginner / Pre-Starters",
    duration: "3 Months (48 Hours)",
    monthlyPrice: 40,
    priceNote: "$40/month (Term discount available)",
    featured: true,
    rating: 4.9,
    enrolledCount: 84,
    badge: "Popular for Kids",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80",
    description: "A fun, interactive, phonics-based introductory program designed specifically for young Cambodian children to master letter recognition, letter sounds, handwriting, and foundational vocabulary.",
    objectives: [
      "Master uppercase and lowercase letters A to Z with correct stroke order",
      "Recognize 26 primary letter sounds using multi-sensory songs and motions",
      "Build foundational vocabulary of over 150 everyday objects, animals, and colors",
      "Develop confidence to speak simple greetings and answer basic questions in English"
    ],
    curriculum: [
      { week: "Weeks 1-4", topic: "Letters A to H: Recognition, sounds, and initial blends" },
      { week: "Weeks 5-8", topic: "Letters I to P: Tracing, simple CVC words, and interactive storytelling" },
      { week: "Weeks 9-12", topic: "Letters Q to Z: Full alphabet review, reading sight words, and oral showcase" }
    ],
    suitableAge: "4 – 6 Years Old",
    scheduleOptions: "Mon - Wed - Fri or Tue - Thu - Sat (Morning / Afternoon)"
  },
  {
    id: "CRS-PHONICS",
    slug: "phonics-mastery",
    code: "PHN-201",
    name: "Phonics & Word Building Mastery",
    nameKhmer: "ការបញ្ចេញសំឡេង និងការផ្សំអក្សរ",
    category: "Primary Starters (Ages 6-9)",
    level: "Elementary / Starters",
    duration: "4 Months (64 Hours)",
    monthlyPrice: 45,
    priceNote: "$45/month (Includes workbook)",
    featured: true,
    rating: 4.8,
    enrolledCount: 112,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80",
    description: "Helps primary students decode unfamiliar words effortlessly using synthetic phonics, short/long vowels, consonant digraphs, and guided decodable storybooks.",
    objectives: [
      "Blend and segment 44 English phonemes accurately",
      "Read short stories with natural intonation and correct pronunciation",
      "Spelling proficiency for 300+ high-frequency elementary words",
      "Transition smoothly into independent reading comprehension"
    ],
    curriculum: [
      { week: "Weeks 1-4", topic: "Short Vowel Sounds (a, e, i, o, u) & CVC word building" },
      { week: "Weeks 5-8", topic: "Consonant Blends (bl, cl, st, nd) & Digraphs (sh, ch, th, ph)" },
      { week: "Weeks 9-12", topic: "Long Vowels with silent 'e' and vowel teams (ai, ee, oa)" },
      { week: "Weeks 13-16", topic: "Decodable reader books, fluency drills, and spelling bee" }
    ],
    suitableAge: "6 – 9 Years Old",
    scheduleOptions: "Mon to Fri (1 hour/day) or Weekend Intensives"
  },
  {
    id: "CRS-BASIC",
    slug: "basic-english",
    code: "ENG-100",
    name: "Basic English for Daily Life",
    nameKhmer: "ភាសាអង់គ្លេសមូលដ្ឋានសម្រាប់ជីវិតប្រចាំថ្ងៃ",
    category: "General (Kids & Teens)",
    level: "A1 Elementary",
    duration: "6 Months (96 Hours)",
    monthlyPrice: 50,
    priceNote: "$50/month",
    featured: true,
    rating: 4.9,
    enrolledCount: 135,
    badge: "Foundational",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80",
    description: "Designed to help Cambodian learners develop real-world English communication skills for classroom, travel, making friends, and everyday routines.",
    objectives: [
      "Hold conversations about family, school, hobbies, food, and daily routines",
      "Understand spoken English instructions from native and Khmer teachers",
      "Write grammatically sound paragraphs and short personal diaries",
      "Build a vocabulary base of 600+ essential high-frequency terms"
    ],
    curriculum: [
      { week: "Month 1", topic: "Self-introductions, greetings, and classroom expressions" },
      { week: "Month 2", topic: "Talking about family, school, and favorite sports" },
      { week: "Month 3", topic: "Describing houses, towns, and asking for directions" },
      { week: "Month 4", topic: "Ordering food, shopping, and telling time" },
      { week: "Month 5", topic: "Past experiences and weekend activities" },
      { week: "Month 6", topic: "Future plans, role-play presentation, and term exam" }
    ],
    suitableAge: "7 – 14 Years Old",
    scheduleOptions: "Morning (08:00 - 09:30 AM) or Afternoon (02:00 - 03:30 PM)"
  },
  {
    id: "CRS-GRAMMAR",
    slug: "english-grammar",
    code: "GRM-301",
    name: "English Grammar & Writing Mechanics",
    nameKhmer: "វេយ្យាករណ៍ និងរចនាសម្ព័ន្ធសំណេរ",
    category: "Teens & Secondary",
    level: "A2 - B1 Intermediate",
    duration: "4 Months (64 Hours)",
    monthlyPrice: 55,
    priceNote: "$55/month",
    featured: false,
    rating: 4.7,
    enrolledCount: 78,
    badge: "Academic Focus",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80",
    description: "Master English tenses, clause structures, sentence mechanics, punctuation, and academic paragraph organization with structured step-by-step guidance.",
    objectives: [
      "Master 12 English verb tenses and apply them accurately in speaking and writing",
      "Eliminate common grammatical errors made by Khmer native speakers",
      "Construct compound and complex sentences with appropriate conjunctions",
      "Write structured narrative, descriptive, and opinion paragraphs"
    ],
    curriculum: [
      { week: "Module 1", topic: "Parts of speech, noun-verb agreement, and articles (a/an/the)" },
      { week: "Module 2", topic: "Present, Past, and Future Tenses in deep comparison" },
      { week: "Module 3", topic: "Modals, Passive Voice, and Conditional Sentences" },
      { week: "Module 4", topic: "Essay organization, thesis statements, and peer review" }
    ],
    suitableAge: "11 – 17 Years Old",
    scheduleOptions: "Mon - Wed - Fri or Tue - Thu (Evening 05:00 - 06:30 PM)"
  },
  {
    id: "CRS-SPEAKING",
    slug: "conversational-speaking",
    code: "SPK-401",
    name: "Conversational Speaking & Pronunciation",
    nameKhmer: "ការសន្ទនា និងការបញ្ចេញសំឡេងច្បាស់",
    category: "Teens & Adults",
    level: "B1 - B2 Upper Intermediate",
    duration: "3 Months (48 Hours)",
    monthlyPrice: 60,
    priceNote: "$60/month (Native teacher sessions)",
    featured: true,
    rating: 5.0,
    enrolledCount: 96,
    badge: "Native Teachers",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80",
    description: "Interactive conversation labs led by native English instructors to overcome speaking hesitation, perfect word stress and sentence rhythm, and speak fluently in any situation.",
    objectives: [
      "Speak without hesitating or translating in mind from Khmer to English",
      "Perfect English intonation, linking sounds, and reduced forms",
      "Deliver persuasive 3-minute oral presentations with visual slides",
      "Debate contemporary youth topics and lead group discussions"
    ],
    curriculum: [
      { week: "Month 1", topic: "Breaking speaking barriers: Confidence, idioms, and natural fillers" },
      { week: "Month 2", topic: "Topic-based discussions: Technology, travel, global cultures, environment" },
      { week: "Month 3", topic: "Public speaking showcase, impromptu speech, and graduation debate" }
    ],
    suitableAge: "12+ Years Old & Adults",
    scheduleOptions: "Mon - Wed - Fri (05:00 - 06:30 PM) or Saturday Full Day"
  },
  {
    id: "CRS-READWRITE",
    slug: "academic-reading-writing",
    code: "RDW-302",
    name: "Academic Reading & Essay Writing",
    nameKhmer: "ការអានបែបវិទ្យាសាស្ត្រ និងការសរសេរតែងសេចក្តី",
    category: "Secondary & High School",
    level: "B1 Intermediate",
    duration: "4 Months (64 Hours)",
    monthlyPrice: 55,
    priceNote: "$55/month",
    featured: false,
    rating: 4.8,
    enrolledCount: 62,
    badge: "School Success",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80",
    description: "Equips students with critical reading techniques (skimming, scanning, inferencing) and structured 5-paragraph academic essay writing frameworks.",
    objectives: [
      "Read complex non-fiction texts and identify main ideas and supporting arguments",
      "Expand academic vocabulary using roots, prefixes, and context clues",
      "Write 5-paragraph essays: cause/effect, compare/contrast, argumentative",
      "Cite sources and avoid plagiarism in academic homework"
    ],
    curriculum: [
      { week: "Unit 1", topic: "Critical reading comprehension strategies and speed reading" },
      { week: "Unit 2", topic: "Paragraph architecture and transition signals" },
      { week: "Unit 3", topic: "Argumentative essays and counter-arguments" },
      { week: "Unit 4", topic: "Independent research synthesis and portfolio submission" }
    ],
    suitableAge: "13 – 18 Years Old",
    scheduleOptions: "Tue - Thu - Sat (03:30 - 05:00 PM)"
  },
  {
    id: "CRS-IELTS",
    slug: "ielts-preparation",
    code: "IEL-501",
    name: "IELTS & International Exam Prep",
    nameKhmer: "ការត្រៀមប្រឡងតេស្តអន្តរជាតិ IELTS",
    category: "High School & University",
    level: "B2 - C1 Advanced",
    duration: "4 Months (80 Hours)",
    monthlyPrice: 75,
    priceNote: "$75/month (Includes official mock tests)",
    featured: true,
    rating: 4.9,
    enrolledCount: 45,
    badge: "High Band Guarantee",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
    description: "Intensive exam mastery for all four IELTS modules (Listening, Reading, Writing Task 1 & 2, and Speaking) with real Cambridge exam materials and personalized score analytics.",
    objectives: [
      "Target Band 6.5 to 7.5+ in Academic IELTS",
      "Master Writing Task 1 visual data analysis and Task 2 250-word essays",
      "Develop speaking interview stamina with native examiner mock tests",
      "Proven time-management strategies for 60-minute reading passages"
    ],
    curriculum: [
      { week: "Phase 1", topic: "Diagnostic test, question types breakdown, and listening tactics" },
      { week: "Phase 2", topic: "Academic reading scanning speed and Task 1 graph reporting" },
      { week: "Phase 3", topic: "Task 2 discursive essays and Part 2/3 speaking practice" },
      { week: "Phase 4", topic: "4 full timed simulation exams with one-on-one examiner feedback" }
    ],
    suitableAge: "15+ Years Old & University Students",
    scheduleOptions: "Mon - Wed - Fri (06:30 - 08:30 PM) or Weekend Intensive"
  }
];

