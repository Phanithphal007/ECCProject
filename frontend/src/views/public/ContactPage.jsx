import { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* 1. Header Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
          <MessageSquare size={14} /> Get in Touch
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Contact ECC Campus & Admissions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Have questions about our English curriculum, schedules, or tuition? Reach out via phone, Telegram, or message us below.
        </p>
      </section>

      {/* 2. Main Contact Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Campus Information & Hours */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Campus Information</h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Campus Location</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      ECC English Learning Center, Street 271, Sangkat Boeung Tumpun, Khan Mean Chey, Phnom Penh, Cambodia.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Admissions Hotline</span>
                    <span className="text-slate-600 dark:text-slate-300 block">+855 (0) 23 888 999</span>
                    <span className="text-slate-600 dark:text-slate-300 block">+855 (0) 12 345 678</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Official Email</span>
                    <span className="text-slate-600 dark:text-slate-300">admissions@ecc-edumanage.kh</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Campus Hours</span>
                    <span className="text-slate-600 dark:text-slate-300 block">Monday – Saturday: 7:30 AM – 7:30 PM</span>
                    <span className="text-slate-600 dark:text-slate-300 block">Sunday: 8:00 AM – 12:00 PM (Admin only)</span>
                  </div>
                </div>
              </div>

              {/* Telegram Channel Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <a 
                  href="https://t.me/ecc_admissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all"
                >
                  <MessageSquare size={16} /> Contact on Telegram (@ecc_admissions) <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Map Placeholder Card */}
            <div className="p-6 rounded-3xl bg-slate-100/70 dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] text-center space-y-2">
              <MapPin size={28} className="mx-auto text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Campus Visits Welcome</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parents are invited to tour classrooms, view teaching materials, and meet our teachers any weekday.
              </p>
            </div>
          </div>

          {/* Right: Interactive Message Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Message Dispatched!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out, <strong className="text-slate-900 dark:text-white">{formData.name}</strong>. An ECC admissions representative will respond to your inquiry via phone or email within one business day.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', phone: '', email: '', subject: 'General Inquiry', message: '' });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Us a Direct Message</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fill out the form below and we will get back to you promptly.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Full Name *
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Sok Pisey"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone Number *
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input 
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Inquiry Topic
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option>General Inquiry</option>
                        <option>Course Admissions & Fees</option>
                        <option>Free Placement Test</option>
                        <option>Schedule Consultation</option>
                        <option>Feedback or Suggestion</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Message / Questions *
                    </label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Please let us know your child's age, current English level, or specific requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {loading ? (
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <Send size={15} /> Send Message to ECC
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

