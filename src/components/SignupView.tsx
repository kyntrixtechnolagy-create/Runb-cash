import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Key, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface SignupViewProps {
  onBackToLogin: () => void;
  darkMode: boolean;
}

type RoleTab = 'STAFF' | 'OWNER' | 'AUDITOR';

export default function SignupView({ onBackToLogin, darkMode }: SignupViewProps) {
  const [activeTab, setActiveTab] = useState<RoleTab>('STAFF');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setCompanyCode('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (tab: RoleTab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (activeTab === 'OWNER' || activeTab === 'AUDITOR') {
      if (!companyCode) {
        setErrorMsg('This account type requires the Company Security Code.');
        return;
      }
      if (companyCode !== import.meta.env.VITE_COMPANY_CODE) {
        setErrorMsg('Invalid Company Security Code.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const role: UserRole = activeTab === 'OWNER' ? 'OWNER' : activeTab === 'AUDITOR' ? 'AUDITOR' : 'SUPERVISOR';
        
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name,
              email,
              role,
              designation: role === 'OWNER' ? 'The Owner' : role === 'AUDITOR' ? 'Auditor' : 'Staff',
            }
          ]);

        if (dbError) throw dbError;

        setSuccessMsg('Account created successfully! You can now log in.');
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = activeTab === 'OWNER';
  const isAuditor = activeTab === 'AUDITOR';
  const requiresCode = isOwner || isAuditor;
  const accentFrom = isOwner ? 'from-blue-600' : isAuditor ? 'from-purple-600' : 'from-teal-500';
  const accentTo   = isOwner ? 'to-indigo-500' : isAuditor ? 'to-fuchsia-500' : 'to-emerald-500';
  const focusBorder = isOwner ? 'focus:border-blue-500' : isAuditor ? 'focus:border-purple-500' : 'focus:border-teal-500';

  return (
    <div className={`absolute inset-0 flex flex-col p-5 overflow-y-auto no-scrollbar transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top green glow accent */}
      <div className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-b pointer-events-none opacity-20 ${accentFrom} to-transparent`} />

      {/* Brand Header */}
      <div className="flex flex-col items-center mt-4 mb-5 z-10">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${accentFrom} ${accentTo} flex items-center justify-center shadow-lg mb-3`}>
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-display font-bold tracking-tight text-center">
          Create an Account
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Choose your account type below
        </p>
      </div>

      {/* Role Tab Selector */}
      <div className={`flex rounded-2xl p-1 mb-5 z-10 ${
        darkMode ? 'bg-slate-900' : 'bg-slate-200/60'
      }`}>
        {(['STAFF', 'OWNER', 'AUDITOR'] as RoleTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabSwitch(tab)}
            className={`flex-1 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === tab
                ? `bg-gradient-to-r ${tab === 'OWNER' ? 'from-blue-600 to-indigo-500' : tab === 'AUDITOR' ? 'from-purple-600 to-fuchsia-500' : 'from-teal-500 to-emerald-500'} text-white shadow-md`
                : darkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'OWNER' ? <Shield className="w-3.5 h-3.5" /> : tab === 'AUDITOR' ? <User className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {tab === 'STAFF' ? 'Staff' : tab === 'AUDITOR' ? 'Auditor' : 'Owner'}
          </button>
        ))}
      </div>

      {/* Main Signup Form */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full rounded-3xl p-5 border shadow-xl z-10 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mb-4 ${
          requiresCode ? (isOwner ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500') : 'bg-teal-500/10 text-teal-600'
        }`}>
          {requiresCode ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
          {requiresCode ? `${isOwner ? 'Owner' : 'Auditor'} - Requires security code` : 'Staff - No code needed'}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-3.5">
          {/* Name field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className={`w-full py-2 pl-10 pr-4 text-sm rounded-xl border outline-none ${
                  darkMode
                    ? `bg-slate-950 border-slate-800 ${focusBorder}`
                    : `bg-slate-50 border-slate-200 ${focusBorder}`
                }`}
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`w-full py-2 pl-10 pr-4 text-sm rounded-xl border outline-none ${
                  darkMode
                    ? `bg-slate-950 border-slate-800 ${focusBorder}`
                    : `bg-slate-50 border-slate-200 ${focusBorder}`
                }`}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`w-full py-2 pl-10 pr-10 text-sm rounded-xl border outline-none ${
                  darkMode
                    ? `bg-slate-950 border-slate-800 ${focusBorder}`
                    : `bg-slate-50 border-slate-200 ${focusBorder}`
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-400 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Code field */}
          {requiresCode && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Company Security Code <span className="text-blue-500">*</span></label>
              <div className="relative">
                <Key className="absolute left-3.5 top-2.5 w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  placeholder="Enter authorization code"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  disabled={isLoading}
                  className={`w-full py-2 pl-10 pr-4 text-sm rounded-xl border outline-none ${
                    darkMode
                      ? 'bg-slate-950 border-blue-900/60 focus:border-blue-500'
                      : 'bg-blue-50 border-blue-200 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Signup Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-1 h-11 rounded-xl bg-gradient-to-r ${accentFrom} ${accentTo} font-bold text-sm text-white hover:opacity-95 flex items-center justify-center shadow-lg transition-opacity`}
          >
            {isLoading ? 'Creating account...' : `Create ${isOwner ? 'Owner' : isAuditor ? 'Auditor' : 'Staff'} Account`}
          </button>
        </form>
      </motion.div>

      {/* Back to Login */}
      <div className="mt-5 flex justify-center pb-8">
        <button onClick={onBackToLogin} className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1">
          Already have an account? <span className={isOwner ? 'text-blue-600' : isAuditor ? 'text-purple-600' : 'text-teal-600'}>Log In</span>
        </button>
      </div>
    </div>
  );
}
