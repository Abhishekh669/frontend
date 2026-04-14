"use client"
import { useState } from 'react';
import { User } from '@/utils/types/user.types';
import { updatePasswordAction } from '@/utils/actions/auth/login.action';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import Link from 'next/link';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function SettingPrivacyRelatedPage({ user }: { user: User }) {
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    setIsChangingPassword(true);
     
    try {
      if (form.newPassword.length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const res = await updatePasswordAction(form.currentPassword, form.newPassword);
      if(res.success){
        toast.success(res.message || "Password updated successfully");
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        router.replace("/login");
      }else{
        throw new Error(res.message || "Failed to update password");
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle forgot password - store current page as callback URL
  const handleForgotPassword = () => {
    // Store the current settings page URL as callback
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('callbackUrl', currentPath);
  };

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#6b7280" strokeWidth="1.2" fill="none"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="8" cy="10.5" r="1" fill="#6b7280"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Security & privacy</p>
          <p className="text-xs text-gray-400">Update your account password</p>
        </div>
      </div>

      {/* User strip (read-only) */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 mb-6">
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600 shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-md font-medium ${
          user.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Password fields */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Current password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              className="w-full text-sm h-9 px-3 pr-9 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">New password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                disabled={isChangingPassword}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full text-sm h-9 px-3 pr-9 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                disabled={isChangingPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className="w-full text-sm h-9 px-3 pr-9 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-3">
        {/* Forgot Password Button */}
        <Link
          href="/forgot-password"
          onClick={handleForgotPassword}
          className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
        >
          <KeyRound size={14} />
          Forgot Password?
        </Link>

        {/* Update Password Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isChangingPassword} 
          className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
        >
          {isChangingPassword ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </div>
  );
}

export default SettingPrivacyRelatedPage;