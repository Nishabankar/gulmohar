import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function AdminLogin({ onLoginSuccess, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden relative">
        
        {/* Header Bar */}
        <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            class="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
          
          <h3 class="text-xl font-serif font-bold tracking-wide">Login</h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} class="p-6 space-y-4">
          
          {error && (
            <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <i class="fa-solid fa-circle-exclamation text-red-500 text-sm"></i>
              <span>{error}</span>
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
            <label class="block text-xs font-bold text-gray-700 mb-1 tracking-wider">Password *</label>
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

      </div>
    </div>
  );
}
