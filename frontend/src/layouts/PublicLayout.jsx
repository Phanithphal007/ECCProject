import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  Menu, 
  X, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  LogIn, 
  LayoutDashboard,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useApp } from '../context/useApp';

export const PublicLayout = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { userRole, currentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoggedIn = Boolean(currentUser && userRole);

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'parent') return '/parent/dashboard';
    if (userRole === 'student') return '/student/dashboard';
    return '/';
  };

  const navLinks = [
    { to: '/', label: t('nav.home', 'Home') },
    { to: '/about', label: t('nav.about', 'About ECC') },
    { to: '/courses', label: t('nav.courses', 'Courses') },
    { to: '/pricing', label: t('nav.pricing', 'Pricing') },
    { to: '/teachers', label: t('nav.teachers', 'Teachers') },
    { to: '/contact', label: t('nav.contact', 'Contact') }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] flex flex-col transition-colors duration-200">
      {/* Top Banner: Contact & Operating Hours */}
      <div className="bg-indigo-900 text-indigo-100 text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-indigo-800">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Phone size={12} className="text-indigo-400" />
            <span>+855 12 888 999 / +855 23 888 777</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <Mail size={12} className="text-indigo-400" />
            <span>admissions@ecc.edu.kh</span>
          </span>
          <span className="hidden lg:flex items-center gap-1 text-indigo-300">
            <MapPin size={12} className="text-indigo-400" />
            <span>Phnom Penh Campus: St 271, Meanchey</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-indigo-300">Mon - Sat: 07:30 AM - 08:30 PM</span>
        </div>
      </div>

      {/* Main Public Header */}
      <header className="sticky top-0 z-40 h-18 bg-white/95 dark:bg-[#111C32]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#29364D] px-4 sm:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4338CA] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <GraduationCap size={24} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white font-heading block leading-none">
              ECC EduManage
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              English Learning Center
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeSwitcher />
          <LanguageSwitcher />

          {/* If Logged In: Show "Go to Portal" */}
          {isLoggedIn ? (
            <Link
              to={getDashboardPath()}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <LayoutDashboard size={14} />
              <span>{userRole === 'parent' ? 'Parent Portal' : userRole === 'student' ? 'Student Space' : 'Admin Dashboard'}</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/enrollment"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={14} />
                <span>Enroll Now</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#111C32] border-b border-slate-200 dark:border-[#29364D] px-5 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                <LayoutDashboard size={15} />
                <span>Open {userRole.toUpperCase()} Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-semibold"
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/enrollment"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  <BookOpen size={15} />
                  <span>Enroll / Inquiry</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1">
        {children}
      </main>

      {/* Comprehensive Public Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
            {/* Col 1 & 2: Branding & Mission */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">ECC English Learning Center</h3>
                  <p className="text-xs text-slate-400">Excellence in English Education Since 2018</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Empowering Cambodian youth from Grade 1 to Grade 12 with authentic conversational English, synthetic phonics, and international Cambridge & IELTS standards.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 text-xs font-semibold border border-slate-700">
                  <CheckCircle2 size={13} />
                  <span>Ministry of Education Recognized</span>
                </span>
              </div>
            </div>

            {/* Col 3: Programs & Courses */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">English Programs</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/courses" className="hover:text-white transition-colors">English Alphabet (Ages 4-6)</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Phonics Discovery</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Primary Basic English</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Grammar & Mechanics</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Speaking Lab (Native Teachers)</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">IELTS Preparation</Link></li>
              </ul>
            </div>

            {/* Col 4: Quick Links */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/" className="hover:text-white transition-colors">Home Page</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About ECC</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Tuition & Pricing</Link></li>
                <li><Link to="/teachers" className="hover:text-white transition-colors">Teaching Faculty</Link></li>
                <li><Link to="/enrollment" className="hover:text-white transition-colors">Enrollment Inquiry</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Portal Login</Link></li>
              </ul>
            </div>

            {/* Col 5: Contact & Campus */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">Campus Contact</h4>
              <div className="space-y-3 text-xs text-slate-400">
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>St 271, Sangkat Boeng Tumpun, Khan Meanchey, Phnom Penh</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={15} className="text-indigo-400 shrink-0" />
                  <span>+855 12 888 999</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={15} className="text-indigo-400 shrink-0" />
                  <span>admissions@ecc.edu.kh</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 ECC English Learning Center. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Enrollment</span>
              <span>•</span>
              <span>Academic Integrity</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

