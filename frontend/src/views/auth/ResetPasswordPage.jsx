import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { useApp } from '../../context/useApp';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const email = searchParams.get('email') || 'parent@gmail.com';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Error', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(email, newPassword);
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: res.message
      });
      navigate('/login');
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle={`Choose a secure password for account ${email}`}
    >
      <form onSubmit={handleReset} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#29364D] bg-slate-50/60 dark:bg-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>{isLoading ? 'Updating...' : 'Set Password & Sign In'}</span>
        </button>
      </form>
    </AuthLayout>
  );
};

