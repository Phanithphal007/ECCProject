import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  QrCode, 
  Building2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { courseService } from '../../services/courseService';

export const PricingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses for pricing', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Are there any hidden registration or enrollment fees?",
      a: "No hidden fees. A one-time registration fee of $15 applies to brand-new students, which includes their ECC school ID card, student notebook, and campus orientation."
    },
    {
      q: "Do you offer sibling discounts?",
      a: "Yes! Families enrolling two or more siblings receive a 10% discount on the tuition of the second and subsequent children."
    },
    {
      q: "What payment methods are supported?",
      a: "We accept Bakong KHQR (ABA Bank, ACLEDA Bank, Wing, Prince Bank, and all member banks), direct bank transfer, and cash at our campus accounting office."
    },
    {
      q: "Can tuition be paid on a quarterly or term basis?",
      a: "Yes. Parents who pay for a full 3-month or 6-month term upfront receive an additional 5% to 8% term discount."
    },
    {
      q: "What happens if my child misses a class?",
      a: "All homework, class activities, and teacher lecture slides are published to your Parent Portal. Makeup support sessions are held on Saturday mornings upon request."
    }
  ];

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* 1. Pricing Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
          <Tag size={13} /> Transparent & Affordable Tuition
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Invest in Your Child&apos;s English Mastery
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Clear, honest pricing with zero surprise charges. All courses include coursebooks, regular assessments, parent portal tracking, and teacher evaluations.
        </p>
      </section>

      {/* 2. Course Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id}
                className={`p-6 sm:p-8 rounded-3xl flex flex-col justify-between border transition-all duration-300 ${
                  course.featured 
                    ? 'bg-white dark:bg-[#111C32] border-2 border-indigo-600 dark:border-indigo-500 shadow-xl relative' 
                    : 'bg-white dark:bg-[#111C32] border-slate-200/90 dark:border-[#29364D] hover:shadow-lg'
                }`}
              >
                {course.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#4338CA] to-[#4F46E5] text-white text-[11px] font-bold tracking-wide shadow-md uppercase">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {course.category}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {course.suitableAge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{course.name}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-khmer mt-0.5">{course.nameKhmer}</p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">${course.monthlyPrice}</span>
                      <span className="text-xs text-slate-500 font-medium">/ month</span>
                    </div>
                    {course.priceNote && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{course.priceNote}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>{course.duration} curriculum</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>Printed workbook & learning materials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>Monthly progress evaluation & grade report</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>Live Parent Portal dashboard access</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <Link 
                    to={`/enrollment?course=${encodeURIComponent(course.name)}`}
                    className={`w-full py-3 px-4 rounded-2xl text-center text-xs font-bold block transition-all shadow-sm ${
                      course.featured 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    Select Program & Enroll
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Accepted Payment Methods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-100/70 dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Easy & Secure Transactions</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Supported Payment Methods</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Pay tuition seamlessly online through your preferred Cambodian banking app or in person.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bakong KHQR</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scan directly from ABA Mobile, ACLEDA mobile, Wing, or any Bakong member app.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Parent Portal Online</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">View real-time unpaid invoices, payment history, and instant digital receipts.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Campus Cash Desk</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pay cash or check at our Phnom Penh campus front desk, open Monday to Saturday.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Answers to common questions from parents regarding fees, schedules, and discounts.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-[#29364D] transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp size={18} className="text-indigo-600 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Consultation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-indigo-600 text-white p-8 sm:p-12 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black">Still have questions about tuition or schedules?</h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
            Our admissions counselors are happy to guide you through placement tests, class shifts, and family tuition bundles.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link 
              to="/enrollment"
              className="px-6 py-3 rounded-2xl bg-white text-indigo-600 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-md transition-all"
            >
              Start Enrollment Application
            </Link>
            <Link 
              to="/contact"
              className="px-5 py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              Contact Admissions Office
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

