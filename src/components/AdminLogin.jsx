import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function AdminLogin({ onLoginSuccess, onClose }) {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.admin) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        onLoginSuccess(data.admin, data.token);
        return;
      }
      setError(data.message || 'Invalid username or password. Please try again.');
    } catch (err) {
      console.error('Login request failed:', err);
      setError('Unable to reach the server. Please try again later.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail || !newPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          email: forgotEmail,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Password reset successfully! You can now log in.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setUsername(forgotUsername);
          setPassword('');
          setError('');
          setSuccessMsg('');
        }, 2000);
      } else {
        setError(data.message || 'Password reset failed. Please check your username and email.');
      }
    } catch (err) {
      console.error('Forgot password request failed:', err);
      setError('Unable to reach the server. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden relative">
        
        {/* Header Bar */}
        <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-6 text-white text-center relative">
          <button 
            type="button"
            onClick={onClose}
            class="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
          
          <h3 class="text-xl font-serif font-bold tracking-wide">
            {isForgotPassword ? 'Forgot Password Recovery' : 'Login'}
          </h3>
          <p class="text-[11px] text-white/80 mt-1 font-sans">
            {isForgotPassword ? 'Reset your account password via registered email' : 'Gulmohar City Management System'}
          </p>
        </div>

        {/* Form Body */}
        {!isForgotPassword ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} class="p-6 space-y-4">
            {error && (
              <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-sm"></i>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1 tracking-wider">Username *</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <i class="fa-solid fa-user text-xs"></i>
                </div>
                <input 
                  type="text" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-gray-50 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-gray-700 tracking-wider">Password *</label>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); setForgotUsername(username); }}
                  class="text-[11px] font-bold text-[#B30E2E] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <i class="fa-solid fa-lock text-xs"></i>
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-gray-50 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div class="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                class="w-full py-3 bg-[#B30E2E] hover:bg-[#8A0B22] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleForgotPassword} class="p-6 space-y-3.5">
            {error && (
              <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-sm"></i>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Username *</label>
              <input 
                type="text" 
                required 
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                placeholder="Enter registered username"
                class="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-xs bg-gray-50 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Registered Email *</label>
              <input 
                type="email" 
                required 
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter registered email address"
                class="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-xs bg-gray-50 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">New Password *</label>
              <input 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                class="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-xs bg-gray-50 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Confirm New Password *</label>
              <input 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                class="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-xs bg-gray-50 focus:bg-white font-medium"
              />
            </div>

            <div class="pt-2 flex items-center justify-between gap-3">
              <button 
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
                class="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Back to Login
              </button>

              <button 
                type="submit" 
                disabled={loading}
                class="w-1/2 py-2.5 bg-[#B30E2E] hover:bg-[#8A0B22] text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <i class="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
