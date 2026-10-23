import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function AdminLogin({ onLoginSuccess, onClose }) {
  const getInitialParams = () => {
    try {
      const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
      const params = new URLSearchParams(search);
      const token = params.get('token');
      const resetParam = params.get('resetPassword');
      const otp = params.get('otp');
      const u = params.get('username') || '';
      const em = params.get('email') || '';
      const isReset = !!(token || resetParam === 'true' || otp);
      return {
        isReset,
        token: token || '',
        otp: otp || '',
        username: u,
        email: em
      };
    } catch (e) {
      return { isReset: false, token: '', otp: '', username: '', email: '' };
    }
  };

  const initialParams = getInitialParams();

  const [isForgotPassword, setIsForgotPassword] = useState(initialParams.isReset);
  const [forgotStep, setForgotStep] = useState(initialParams.isReset ? 2 : 1); // 1: Request OTP Email, 2: Enter OTP & New Password

  const [username, setUsername] = useState(initialParams.username);
  const [password, setPassword] = useState('');

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState(initialParams.username);
  const [forgotEmail, setForgotEmail] = useState(initialParams.email);
  const [resetToken, setResetToken] = useState(initialParams.token);
  const [otpCode, setOtpCode] = useState(initialParams.otp);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(
    initialParams.isReset
      ? 'Email link verified! Please enter the 6-digit OTP received in your email and set your new password.'
      : ''
  );

  // Auto-detect reset link parameters from URL query string or hash
  useEffect(() => {
    const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
    const params = new URLSearchParams(search);
    const resetParam = params.get('resetPassword');
    const paramUsername = params.get('username');
    const paramEmail = params.get('email');
    const paramOtp = params.get('otp');
    const paramToken = params.get('token');

    if (paramToken || resetParam === 'true' || paramOtp) {
      setIsForgotPassword(true);
      setForgotStep(2);
      if (paramToken) setResetToken(paramToken);
      if (paramUsername) {
        setForgotUsername(paramUsername);
        setUsername(paramUsername);
      }
      if (paramEmail) setForgotEmail(paramEmail);
      if (paramOtp) setOtpCode(paramOtp);

      setSuccessMsg('Email link verified! Please enter the 6-digit OTP received in your email and set your new password.');
    }
  }, []);

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

  // Step 1: Request OTP Email Confirmation
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotUsername || !forgotEmail) {
      setError('Please fill in both username and registered email address.');
      return;
    }

    if (forgotUsername.trim().toLowerCase() === 'system') {
      setError('Password reset is not permitted for the System reference account.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          email: forgotEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Verification link & OTP code sent to your email. Please check your inbox.');
        setForgotStep(2);
      } else {
        setError(data.message || 'No account found with this username and email address.');
      }
    } catch (err) {
      console.error('Request OTP failed:', err);
      setError('Unable to connect to server. Please try again.');
    }
    setLoading(false);
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword || !confirmPassword) {
      setError('Please enter the verification OTP code and your new password.');
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
      const payload = {
        otpCode: otpCode.trim(),
        newPassword
      };
      if (resetToken) {
        payload.token = resetToken;
      } else {
        payload.username = forgotUsername;
        payload.email = forgotEmail;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminView');
        setSuccessMsg('Password reset successfully! Redirecting to login page...');
        setTimeout(() => {
          setIsForgotPassword(false);
          setForgotStep(1);
          setResetToken('');
          setUsername(forgotUsername);
          setPassword('');
          setError('');
          setSuccessMsg('');
        }, 1800);
      } else {
        setError(data.message || 'Password reset failed. Please check your verification OTP code.');
      }
    } catch (err) {
      console.error('Password reset failed:', err);
      setError('Unable to reach the server. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden relative">
        
        {/* Header Bar */}
        <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-6 text-white text-center relative">
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              class="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
            >
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          )}
          
          <h3 class="text-xl font-serif font-bold tracking-wide">
            {isForgotPassword ? (forgotStep === 2 ? 'Set Account Password' : 'Forgot Password Recovery') : 'Login'}
          </h3>
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
                  onClick={() => { setIsForgotPassword(true); setForgotStep(1); setError(''); setSuccessMsg(''); setForgotUsername(username); }}
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

            <div class="pt-3 mt-1 text-center border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(true); setForgotStep(2); setError(''); setSuccessMsg('Please enter your 6-digit OTP code to set your password.'); }}
                class="text-xs font-semibold text-slate-600 hover:text-[#B30E2E] transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <i class="fa-solid fa-key text-[11px] text-[#B30E2E]"></i>
                <span>Have an Invitation OTP? Set Password</span>
              </button>
            </div>
          </form>
        ) : forgotStep === 1 ? (
          /* STEP 1: REQUEST OTP EMAIL */
          <form onSubmit={handleRequestOtp} class="p-6 space-y-3.5">
            {error && (
              <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-sm"></i>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
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
              <label class="block text-xs font-bold text-gray-700 mb-1">Registered Email Address *</label>
              <input 
                type="email" 
                required 
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter registered email"
                class="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-xs bg-gray-50 focus:bg-white font-medium"
              />
            </div>

            <p class="text-[11px] text-gray-500 italic">
              A 6-digit confirmation OTP code will be sent to your email inbox for verification.
            </p>

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
                    <span>Sending Mail...</span>
                  </>
                ) : (
                  <span>Send OTP Email</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: ENTER OTP & NEW PASSWORD */
          <form onSubmit={handleResetPasswordSubmit} class="p-6 space-y-3.5">
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

            {forgotUsername ? (
              <div class="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <span class="text-slate-500 font-medium">Account Username:</span>
                <span class="font-bold text-[#B30E2E]">{forgotUsername}</span>
              </div>
            ) : !resetToken ? (
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                <input 
                  type="text" 
                  required 
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  placeholder="Enter your account username"
                  class="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-xs bg-gray-50 focus:bg-white font-medium"
                />
              </div>
            ) : null}

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit Email OTP *</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-Digit OTP Code"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] text-center font-bold tracking-widest text-base bg-amber-50 focus:bg-white text-slate-800"
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
                onClick={() => { setIsForgotPassword(false); setForgotStep(1); setError(''); setSuccessMsg(''); }}
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
                    <span>{forgotStep === 2 ? 'Saving...' : 'Resetting...'}</span>
                  </>
                ) : (
                  <span>{forgotStep === 2 ? 'Set Password' : 'Reset Password'}</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
