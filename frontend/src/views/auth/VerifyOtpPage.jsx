import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { useApp } from '../../context/useApp';

export const VerifyOtpPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const email = searchParams.get('email') || 'parent@gmail.com';
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.verifyOtp(email, otp);
      addToast({
        type: 'success',
        title: 'OTP Verified',
        message: 'Code confirmed. Please set your new password.'
      });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      addToast({ type: 'error', title: 'Invalid Code', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Enter Verification Code"
      subtitle={`We sent a 6-digit confirmation code to ${email}`}
    >
      <form onSubmit={handleVerify} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            6-Digit OTP Code
          </label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 123456"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white text-center font-mono tracking-widest text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 text-center">
            For demonstration testing, enter <strong className="text-indigo-600">123456</strong>
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
          <ArrowRight size={15} />
        </button>

        <div className="text-center pt-2">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
          >
            <ArrowLeft size={14} />
            <span>Resend or Change Email</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

