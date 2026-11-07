import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Target, 
  Compass, 
  Lightbulb, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Users, 
  ArrowRight 
} from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="space-y-16 sm:space-y-24 py-10 sm:py-16">
      {/* 1. Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          About ECC English Learning Center
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Nurturing Tomorrow&apos;s Global Communicators in Cambodia
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Founded in 2018 in Phnom Penh, ECC EduManage is dedicated to bridging Cambodian youth to world-class English literacy through structured phonics, active conversational environments, and caring mentorship.
        </p>
      </section>

      {/* 2. Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Target size={26} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To provide every Cambodian student with accessible, high-caliber English language education that fosters critical thinking, cultural appreciation, and unshakeable spoken confidence from early childhood through secondary graduation.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Compass size={26} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To become Cambodia’s foremost benchmark for youth English literacy and academic excellence, where young learners develop bilingual mastery and open doors to regional and global academic scholarships.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Teaching Philosophy & Learning Environment */}
      <section className="bg-slate-100/70 dark:bg-[#0E1626] py-16 border-y border-slate-200 dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Pedagogical Approach</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Our Core Teaching Philosophy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Production Over Rote Memorization</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Rather than memorizing lists of isolated words, students learn through structured dialogues, reader theater, role-playing, and guided storytelling.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Synthetic Phonics & Decoding</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We empower primary children to sound out 44 distinct English phonemes independently, building reading fluency and accurate accent development.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Continuous Parent Partnership</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Through our digital Parent Portal, families are partners in education, viewing attendance logs, homework feedback, and official term evaluations in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Campus Environment Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Our Facilities</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              A Modern, Safe & Inspiring Learning Environment
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Located on St 271 in Phnom Penh, ECC provides air-conditioned smart classrooms equipped with multimedia audio-visual displays, a decodable English library, clean hygienic spaces, and 24/7 security.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Interactive digital screens for phonics songs and video dialogues</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Small classroom capacity capped at 15 to 20 students per teacher</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Dedicated quiet reading lounge and Cambridge testing center</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Parent waiting area with free high-speed Wi-Fi and student pickup safety</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80"
              alt="ECC Campus Classroom"
              className="rounded-2xl shadow-md h-52 w-full object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80"
              alt="ECC Learning Group"
              className="rounded-2xl shadow-md h-52 w-full object-cover mt-6"
            />
          </div>
        </div>
      </section>

      {/* 5. Bottom Navigation CTAs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ready to Discover Our English Programs?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Browse our course catalogue or connect with our Academic Admissions team for a personalized placement test.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/courses"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-2"
            >
              <span>View All Courses</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/contact"
              className="min-h-[44px] px-6 py-2.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-700 dark:text-white font-semibold text-xs inline-flex items-center gap-2"
            >
              <span>Contact Campus</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

