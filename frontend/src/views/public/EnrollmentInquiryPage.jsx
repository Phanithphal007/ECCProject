import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Send, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  Phone, 
  Mail, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { courseService } from '../../services/courseService';

export const EnrollmentInquiryPage = () => {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryResult, setInquiryResult] = useState(null);

  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    email: '',
    childName: '',
    childAge: '',
    courseName: '',
    preferredShift: 'Morning (8:00 AM - 10:00 AM)',
    englishLevel: 'Complete Beginner',
    notes: ''
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const list = await courseService.getCourses();
        setCourses(list);
        
        // Check query param
        const params = new URLSearchParams(location.search);
        const queryCourse = params.get('course');
        if (queryCourse) {
          const match = list.find((c) => c.name.toLowerCase() === queryCourse.toLowerCase() || c.slug === queryCourse);
          if (match) {
            setFormData((prev) => ({ ...prev, courseName: match.name }));
          } else {
            setFormData((prev) => ({ ...prev, courseName: queryCourse }));
          }
        } else if (list.length > 0) {
          setFormData((prev) => ({ ...prev, courseName: list[0].name }));
        }
      } catch (err) {
        console.error('Failed to load courses for enrollment', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await courseService.submitEnrollmentInquiry(formData);
      setInquiryResult(res);
    } catch (err) {
      console.error('Enrollment submission error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* 1. Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
          <GraduationCap size={15} /> Student Enrollment & Placement
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Apply for Course Admission
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Submit your child&apos;s details to reserve a seat and schedule a complimentary 20-minute English placement test at our campus.
        </p>
      </section>

      {/* 2. Main Form or Result Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {inquiryResult ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#111C32] border-2 border-emerald-500/30 shadow-xl space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Application Received Successfully
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Application Ref: #{inquiryResult.inquiryId || 'INQ-2026'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                {inquiryResult.message}
              </p>
            </div>

            {/* Application Summary Box */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 text-left max-w-lg mx-auto space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.childName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Student Age:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.childAge} Years Old</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Course Selected:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.courseName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Preferred Shift:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.preferredShift}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Parent / Guardian:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.parentName} ({formData.phone})</span>
              </div>
            </div>

            {/* Next Steps List */}
            <div className="max-w-lg mx-auto text-left space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Next Steps for Parents:
              </span>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Our academic advisor will call you within 24 hours to confirm appointment time.</li>
                <li>Bring your child to ECC Campus for the 20-minute fun oral and literacy test.</li>
                <li>Receive customized level placement and class schedule options.</li>
              </ul>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700"
              >
                Back to Home Page
              </Link>
              <button
                onClick={() => {
                  setInquiryResult(null);
                  setFormData({
                    parentName: '',
                    phone: '',
                    email: '',
                    childName: '',
                    childAge: '',
                    courseName: courses[0]?.name || '',
                    preferredShift: 'Morning (8:00 AM - 10:00 AM)',
                    englishLevel: 'Complete Beginner',
                    notes: ''
                  });
                }}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-sm space-y-8">
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Online Enrollment & Placement Application
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please provide accurate contact details so we can reach you to schedule your child’s placement test.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Info Section */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <User size={14} /> 1. Parent or Guardian Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Parent / Guardian Full Name *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Sok Pisey"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Active Telegram) *
                    </label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g. 012 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input 
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Child Info Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <GraduationCap size={14} /> 2. Student Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Full Name *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Sok Vannak"
                      value={formData.childName}
                      onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Age *
                    </label>
                    <input 
                      type="number"
                      required
                      min={3}
                      max={20}
                      placeholder="e.g. 7"
                      value={formData.childAge}
                      onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Course Selection & Shift */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <BookOpen size={14} /> 3. Desired Program & Timing
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Desired Course Program *
                    </label>
                    <select
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} (${c.monthlyPrice}/mo)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Study Shift *
                    </label>
                    <select
                      value={formData.preferredShift}
                      onChange={(e) => setFormData({ ...formData, preferredShift: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Morning (8:00 AM - 10:00 AM)</option>
                      <option>Late Morning (10:00 AM - 12:00 PM)</option>
                      <option>Afternoon (1:30 PM - 3:30 PM)</option>
                      <option>Late Afternoon (3:30 PM - 5:30 PM)</option>
                      <option>Evening (5:30 PM - 7:30 PM)</option>
                      <option>Weekend Intensive (Sat & Sun)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current English Level
                  </label>
                  <select
                    value={formData.englishLevel}
                    onChange={(e) => setFormData({ ...formData, englishLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Complete Beginner (No English background)</option>
                    <option>Basic Phonics / ABC (Knows alphabet and simple words)</option>
                    <option>Elementary (Can form simple sentences)</option>
                    <option>Pre-Intermediate (Understands conversations)</option>
                    <option>IELTS / Advanced Aspirant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Special Notes or Preferred Test Date
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Tell us any specific learning goals or convenient day for placement test..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Send size={15} /> Submit Enrollment & Book Free Placement Test
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
                  <ShieldCheck size={14} className="text-emerald-500" /> No commitment required. Placement test is 100% free.
                </div>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};

