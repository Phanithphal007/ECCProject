import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Users, 
  Award, 
  Calendar, 
  BookOpen, 
  Star, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { courseService } from '../../services/courseService';

export const CourseDetailsPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedCourses, setRelatedCourses] = useState([]);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const found = await courseService.getCourseById(id);
        setCourse(found);
        const all = await courseService.getCourses();
        setRelatedCourses(all.filter((c) => c.id !== found?.id && c.slug !== found?.slug).slice(0, 3));
      } catch (err) {
        console.error('Failed to get course details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <p className="text-sm text-slate-500">The program you are looking for may have been updated or moved.</p>
        <Link 
          to="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 space-y-12">
      {/* 1. Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/courses" className="hover:text-indigo-600 transition-colors">Courses</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{course.name}</span>
        </div>
      </div>

      {/* 2. Course Header Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Level: {course.level}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                <Star size={13} className="fill-amber-400 text-amber-400" /> {course.rating} (Verified Feedback)
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 font-khmer mb-1">
                {course.nameKhmer}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {course.name}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-[#29364D]">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Duration</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                  <Clock size={14} className="text-indigo-500" /> {course.duration}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Target Age</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                  <Users size={14} className="text-indigo-500" /> {course.suitableAge}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Schedule</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                  <Calendar size={14} className="text-indigo-500" /> Shift Options
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Certification</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                  <Award size={14} className="text-indigo-500" /> ECC Certificate
                </span>
              </div>
            </div>

            {/* Course Image */}
            <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-[#29364D] h-72 sm:h-96">
              <img 
                src={course.image} 
                alt={course.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Learning Objectives */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-[#29364D] space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" /> What Your Child Will Learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {course.objectives?.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-snug">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus / Curriculum */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-[#29364D] space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" /> Program Syllabus
              </h2>
              <div className="space-y-3 pt-2">
                {course.curriculum?.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {item.week}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                      {item.topic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Enrollment Sidebar Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111C32] border-2 border-indigo-500/20 shadow-xl space-y-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Course Tuition</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">${course.monthlyPrice}</span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>
                {course.priceNote && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                    {course.priceNote}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>Certified native & qualified Cambodian teachers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-500 shrink-0" />
                  <span>Pay monthly or quarterly via Bakong KHQR / ABA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-emerald-500 shrink-0" />
                  <span>Small classroom cohort: 12-16 students max</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link 
                  to={`/enrollment?course=${encodeURIComponent(course.name)}`}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm text-center block shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Apply & Enroll in this Course
                </Link>
                <Link 
                  to="/contact"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs text-center block transition-all"
                >
                  Inquire by Phone / Telegram
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                Need a student placement test? Free evaluations are held Monday through Saturday at our Phnom Penh campus.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Related Courses */}
      {relatedCourses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Other Available Programs</h2>
            <Link to="/courses" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              View All Courses <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedCourses.map((rc) => (
              <Link 
                key={rc.id}
                to={`/courses/${rc.slug || rc.id}`}
                className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-[#29364D] hover:shadow-md transition-all group"
              >
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">{rc.category}</div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{rc.name}</h3>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>${rc.monthlyPrice} / month</span>
                  <span className="font-semibold text-indigo-600 flex items-center gap-1">Learn <ArrowRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

