import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { useApp } from '../../context/useApp';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      addToast({
        type: 'info',
        title: 'Verification Code Dispatched',
        message: res.message
      });
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter the email associated with your ECC account and we'll send a 6-digit verification code."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Registered Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. parent@gmail.com"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Demo code will be <strong className="text-indigo-600">123456</strong>
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{isLoading ? 'Sending...' : 'Send Verification Code'}</span>
          <ArrowRight size={15} />
        </button>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

