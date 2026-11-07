import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  Award, 
  Clock, 
  Star, 
  ShieldCheck, 
  Sparkles,
  GraduationCap,
  HeartHandshake,
  MessageSquare
} from 'lucide-react';
import { courseService } from '../../services/courseService';

export const HomePage = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    courseService.getCourses().then((data) => {
      setCourses(data);
      setIsLoading(false);
    });
  }, []);

  const featuredCourses = courses.filter((c) => c.featured).slice(0, 4);

  const testimonials = [
    {
      name: "Sopheap Meng",
      role: "Parent of Grade 4 Student",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      quote: "Before joining ECC, my daughter was shy to speak English. After 4 months of Phonics and Speaking classes, she now reads English storybooks with natural confidence!"
    },
    {
      name: "Dara Sok",
      role: "Student (Grade 5 Honors)",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      quote: "I love learning with Teacher Sophea and Teacher Michael. The games and speaking practice make English fun, and my parents can always check my scores on the portal."
    },
    {
      name: "Vireak Bot",
      role: "Parent of High School Student",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      quote: "The IELTS preparation class helped my son score Band 7.0 for his overseas scholarship application. The teachers provide detailed mock exam reviews every week."
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 dark:from-[#0E1729] dark:via-[#111C32] dark:to-[#0B1120] pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-200/60 dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                <Sparkles size={14} className="text-amber-500" />
                <span>Premier English Learning Center in Phnom Penh</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Unlock Confident English for <span className="bg-gradient-to-r from-[#4338CA] to-[#4F46E5] bg-clip-text text-transparent">Every Future</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                ECC English Learning Center provides authentic phonics, real-world speaking, and Cambridge exam standards for Grade 1 through Grade 12 learners in a warm, motivating environment.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/courses"
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all hover:gap-3"
                >
                  <span>Explore Courses</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/enrollment"
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-2xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#29364D] text-slate-800 dark:text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Inquire Enrollment</span>
                </Link>
              </div>

              {/* Key Trust Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-[#29364D]">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">1,200+</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Graduated Learners</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">98%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pass & Fluency Rate</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">15:1</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Small Class Ratio</p>
                </div>
              </div>
            </div>

            {/* Hero Right Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#4338CA] to-[#4F46E5] rounded-3xl blur-xl opacity-30 dark:opacity-40 animate-pulse" />
                <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-[#29364D] shadow-2xl bg-white dark:bg-[#111C32]">
                  <img
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&auto=format&fit=crop&q=80"
                    alt="ECC English Learning Classroom"
                    className="w-full h-80 sm:h-96 object-cover"
                  />
                  <div className="p-5 bg-white dark:bg-[#111C32] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Cambodian Youth Literacy Program</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Active Term
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Co-taught by certified native English speakers and caring Cambodian senior educators.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE ECC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">The ECC Advantage</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Why Parents and Students Trust ECC
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A comprehensive learning ecosystem blending classroom engagement, phonics fundamentals, and real-time digital parent tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Certified Native & Khmer Teachers</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every cohort is instructed by qualified international and Cambodian English teachers with TEFL certification.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Synthetic Phonics System</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Proven synthetic phonics curriculum ensuring learners decode sounds, read stories, and pronounce words without memorization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Dedicated Parent Portal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Parents monitor daily attendance, homework submissions, teacher evaluation reports, and tuition invoices anytime.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center font-bold">
              <Award size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Official Cambridge Evaluation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standardized term exams and downloadable official ECC progress certificates printed in authentic Khmer and English typography.
            </p>
          </div>
        </div>
      </section>

      {/* 3. POPULAR ENGLISH COURSES WITH PRICES FROM courseService */}
      <section className="bg-slate-100/60 dark:bg-[#0E1626] py-16 sm:py-20 border-y border-slate-200/70 dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Programs Offered</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Popular English Learning Programs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Explore our core learning pathways tailored by age and proficiency. All tuition prices are transparent and curriculum-aligned.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View All Programs ({courses.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((crs) => (
              <div
                key={crs.id}
                className="bg-white dark:bg-[#111C32] rounded-2xl border border-slate-200/90 dark:border-[#29364D] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={crs.image}
                      alt={crs.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
                        {crs.badge || crs.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{crs.level}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} fill="currentColor" />
                        <span>{crs.rating}</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {crs.name}
                    </h3>
                    <p className="text-[11px] font-siemreap text-indigo-600 dark:text-indigo-400 font-semibold">
                      {crs.nameKhmer}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pt-1">
                      {crs.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 dark:border-[#1E293B] mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Monthly Tuition</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      ${crs.monthlyPrice}
                      <span className="text-xs font-normal text-slate-400">/mo</span>
                    </span>
                  </div>

                  <Link
                    to={`/courses/${crs.id}`}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STUDENT & PARENT TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Real Experiences</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Stories from Our Learning Community
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hear directly from Cambodian families and young learners who achieved breakthrough English proficiency with ECC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-[11px] text-slate-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0F172A] text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <GraduationCap size={280} />
          </div>

          <div className="relative max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold border border-white/20">
              New Term Enrollments Open Now
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Give Your Child the Gift of Fluent English Today
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Schedule a free diagnostic assessment or speak directly with our Academic Advisors to find the ideal course cohort for your child.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/enrollment"
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-slate-100 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <span>Submit Enrollment Inquiry</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/pricing"
                className="min-h-[46px] px-6 py-2.5 rounded-xl border border-white/30 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center transition-colors"
              >
                <span>View All Course Prices</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

