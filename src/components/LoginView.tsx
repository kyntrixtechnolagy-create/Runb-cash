import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Shield, ChevronRight, Check, Key } from 'lucide-react';
import runbLogo from '../assets/runb_logo.png';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onGoToSignup: () => void;
  darkMode: boolean;
}

export default function LoginView({ onLoginSuccess, onGoToSignup, darkMode }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch the user's role and details from our public users table
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (dbError) throw dbError;
        
        if (userData) {
          if (userData.role === 'OWNER' && companyCode !== import.meta.env.VITE_COMPANY_CODE) {
            await supabase.auth.signOut();
            setErrorMsg('Owner login requires the valid Company Security Code.');
            setIsLoading(false);
            return;
          }
          if (userData.role === 'AUDITOR' && companyCode !== import.meta.env.VITE_AUDITOR_CODE) {
            await supabase.auth.signOut();
            setErrorMsg('Auditor login requires the valid Auditor Security Code.');
            setIsLoading(false);
            return;
          }
          onLoginSuccess(userData as User);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`absolute inset-0 flex flex-col p-6 overflow-y-auto no-scrollbar transition-colors duration-300 ${
      darkMode ? 'text-slate-100' : 'text-slate-900'
    }`} style={{ background: darkMode ? '#0B1C2C' : '#F0FDF4' }}>
      {/* Top green glow accent */}
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.08) 0%, transparent 100%)' }} />

      {/* Brand Header */}
      <div className="flex flex-col items-center mt-8 mb-6 z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <img src={runbLogo} alt="Runb" className="w-14 h-14 object-contain" />
        </div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-center" style={{ background: 'linear-gradient(135deg, #4ADE80, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Runb
        </h2>
        <p className="text-xs text-slate-400 text-center font-medium mt-1 uppercase tracking-widest">
          Your Daily Cash Companion
        </p>
      </div>

      {/* Main Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full rounded-3xl p-5 border shadow-xl z-10 ${
          darkMode ? 'bg-[#0f2318]/80 border-green-900/30' : 'bg-white border-green-100'
        }`}
      >
        <h3 className="text-lg font-semibold mb-1">Enter Your Account</h3>
        <p className="text-xs text-slate-500 mb-5">Please type your email and secret password below:</p>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium"
          >
            {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Write your email here..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border outline-none transition-all-300 ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Write your password here..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`w-full py-2.5 pl-10 pr-12 text-sm rounded-xl border outline-none transition-all-300 ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Security Code field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Security Code <span className="text-[10px] font-normal italic">(Owners Only)</span></label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Required for Owner & Auditor login..."
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                disabled={isLoading}
                className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border outline-none transition-all-300 ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all-300 ${
                  rememberMe
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : darkMode
                    ? 'border-slate-800 bg-slate-950'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors font-medium">
                Keep me logged in
              </span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative h-11 rounded-xl font-bold text-sm text-white hover:opacity-95 focus:outline-none flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform duration-150 disabled:opacity-80"
            style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Checking your details...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>Start using the app</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </form>
      </motion.div>

      <div className="mt-8 flex justify-center z-10 pb-4">
        <button onClick={onGoToSignup} className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1">
          Don't have an account? <span className="text-green-500">Sign Up here</span>
        </button>
      </div>
    </div>
  );
}
