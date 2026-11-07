import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  UserCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { useApp } from '../../context/useApp';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast, switchRole } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectByRole = (role) => {
    switchRole(role);
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'parent') navigate('/parent/dashboard');
    else if (role === 'student') navigate('/student/dashboard');
    else navigate('/');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter both identifier (email/phone/ID) and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await authService.login({ identifier, password });
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: res.message
      });
      redirectByRole(res.user.role);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (roleName) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.demoLogin(roleName);
      addToast({
        type: 'success',
        title: 'Demo Session Started',
        message: res.message
      });
      redirectByRole(res.user.role);
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    addToast({
      type: 'info',
      title: 'Google Sign-In',
      message: 'Google Sign-In is configured for production OAuth. Please use direct credentials or Demo login.'
    });
  };

  return (
    <AuthLayout
      title={t('auth.login_title', 'Sign In to ECC EduManage')}
      subtitle={t('auth.login_subtitle', 'Unified portal login for Administrators, Parents, and Students')}
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email, Phone, or Student ID
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin@ecc.edu.kh or parent@gmail.com"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <LogIn size={16} />
          <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
        </button>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-[#29364D] bg-white dark:bg-[#1E293B] hover:bg-slate-50 text-slate-700 dark:text-[#CBD5E1] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>

      {/* Demo Accounts for Testing (Clear, Explicit Demo helper box) */}
      <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#29364D]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
          <Sparkles size={14} className="text-amber-500" />
          <span>Quick Demo Roles (For Testing):</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 transition-colors text-left"
          >
            <ShieldCheck size={14} className="shrink-0" />
            <span className="truncate">Admin Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('parent')}
            className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center gap-1.5 transition-colors text-left"
          >
            <Users size={14} className="shrink-0" />
            <span className="truncate">Parent Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('student')}
            className="p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1.5 transition-colors text-left"
          >
            <GraduationCap size={14} className="shrink-0" />
            <span className="truncate">Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('user')}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#29364D] bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors text-left"
          >
            <UserCheck size={14} className="shrink-0" />
            <span className="truncate">General Visitor</span>
          </button>
        </div>
      </div>

      {/* Register Link */}
      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Register here
        </Link>
      </p>
    </AuthLayout>
  );
};

