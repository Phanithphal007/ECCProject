import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  UserPlus, 
  Users, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { useApp } from '../../context/useApp';

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast, switchRole } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    khmerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'parent' // 'parent' | 'user' only (Admin and Student are strictly barred)
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.role === 'admin' || formData.role === 'student') {
      setErrorMsg('Administrative and student credentials cannot be registered publicly.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await authService.register(formData);
      addToast({
        type: 'success',
        title: 'Registration Successful',
        message: `Welcome to ECC, ${formData.name}! Your account has been created.`
      });

      switchRole(res.user.role);
      if (res.user.role === 'parent') {
        navigate('/parent/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register_title', 'Create an ECC Account')}
      subtitle={t('auth.register_subtitle', 'Register for Parent Portal access or public course inquiries')}
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
        {/* Account Type Selection (Parent vs General User Only) */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            I am registering as:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'parent' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.role === 'parent'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users size={16} className="mb-1 text-indigo-600 dark:text-indigo-400" />
              <div className="font-bold text-xs">Parent / Guardian</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Track child learning & fees</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'user' }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.role === 'user'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserCheck size={16} className="mb-1 text-slate-600 dark:text-slate-300" />
              <div className="font-bold text-xs">General User</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Explore courses & pricing</div>
            </button>
          </div>
        </div>

        {/* Full Name & Khmer Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name (English) *
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Kalyan Meas"
                className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Khmer Name (Optional)
            </label>
            <input
              type="text"
              name="khmerName"
              value={formData.khmerName}
              onChange={handleChange}
              placeholder="e.g. ម៉ាស កល្យាណ"
              className="w-full min-h-[42px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white font-siemreap text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="parent@gmail.com"
                className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+855 12 345 678"
                className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[44px] mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <UserPlus size={16} />
          <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

