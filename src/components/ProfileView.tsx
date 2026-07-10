/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  ShieldAlert,
  Moon,
  Sun,
  Lock,
  ChevronRight,
  LogOut,
  CheckCircle,
  EyeOff,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as UserType } from '../types';

interface ProfileViewProps {
  user: UserType;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout: () => void;
  onShowToast: (message: string, type: 'SUCCESS' | 'ERROR') => void;
  onUpdateUser: (user: UserType) => void;
}

export default function ProfileView({
  user,
  darkMode,
  setDarkMode,
  onLogout,
  onShowToast,
  onUpdateUser,
}: ProfileViewProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassForm, setShowPassForm] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const isOwner = user.role === 'OWNER';
  const isAuditor = user.role === 'AUDITOR';

  const handleSaveInfo = async () => {
    setIsSavingInfo(true);
    try {
      const { error } = await supabase.from('users').update({
        phone: editPhone,
        avatarUrl: editAvatarUrl
      }).eq('id', user.id);
      
      if (error) throw error;
      
      const updatedUser = { ...user, phone: editPhone, avatarUrl: editAvatarUrl };
      onUpdateUser(updatedUser);
      onShowToast('Profile updated successfully!', 'SUCCESS');
      setIsEditingInfo(false);
    } catch (err: any) {
      onShowToast(err.message || 'Error updating profile', 'ERROR');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      onShowToast('Please fill in all password fields.', 'ERROR');
      return;
    }

    if (newPassword !== confirmPassword) {
      onShowToast('New passwords do not match!', 'ERROR');
      return;
    }

    if (newPassword.length < 6) {
      onShowToast('Password must be at least 6 characters.', 'ERROR');
      return;
    }

    setIsChanging(true);

    setTimeout(() => {
      setIsChanging(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassForm(false);
      onShowToast('Passcode updated successfully!', 'SUCCESS');
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 p-4 space-y-5">
      {/* User Information Profile Hero Card */}
      <div className={`p-5 rounded-3xl border transition-all-300 relative overflow-hidden text-center flex flex-col items-center ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        {/* Colorful gradient circle behind avatar */}
        <div className={`absolute top-0 left-0 right-0 h-16 pointer-events-none opacity-20 ${
          isOwner ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
        }`} />

        <div className="relative mt-4 mb-3">
          <img
            src={isEditingInfo ? editAvatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : user.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
            alt={user.name}
            className={`w-20 h-20 rounded-full object-cover border-4 ${
              isOwner ? 'border-blue-500' : 'border-teal-500'
            }`}
          />
          {!isAuditor && (
            <button
              onClick={() => {
                if (isEditingInfo) {
                  handleSaveInfo();
                } else {
                  setIsEditingInfo(true);
                }
              }}
              disabled={isSavingInfo}
              className={`absolute bottom-0 right-0 p-1.5 rounded-full text-white border-2 border-white dark:border-slate-950 cursor-pointer transition-colors ${
                isOwner ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSavingInfo ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : isEditingInfo ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <h3 className="text-lg font-bold font-display">{user.name}</h3>
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold mt-1">
          {user.designation}
        </span>

        {isEditingInfo ? (
          <div className="w-full mt-5 border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Photo URL (Link)</label>
              <input 
                type="text" 
                value={editAvatarUrl} 
                onChange={e => setEditAvatarUrl(e.target.value)} 
                className={`w-full p-2.5 rounded-xl outline-none border transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'}`}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</label>
              <input 
                type="text" 
                value={editPhone} 
                onChange={e => setEditPhone(e.target.value)} 
                className={`w-full p-2.5 rounded-xl outline-none border transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'}`}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <button 
              onClick={handleSaveInfo}
              disabled={isSavingInfo}
              className={`w-full mt-3 p-2 rounded-xl text-white font-bold transition-colors ${
                isOwner ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSavingInfo ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={() => {
                setIsEditingInfo(false);
                setEditPhone(user.phone || '');
                setEditAvatarUrl(user.avatarUrl || '');
              }}
              className={`w-full mt-2 p-2 rounded-xl border font-bold transition-colors ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              Cancel Edit
            </button>
          </div>
        ) : (
          <div className="w-full mt-5 border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-2.5 text-xs text-left">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user.phone || 'No phone number provided'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span className="capitalize">{user.role.toLowerCase()} Privileges</span>
            </div>
          </div>
        )}
      </div>

      {/* System Settings Block */}
      <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">SYSTEM SETTINGS</h4>

        {/* Premium Dark Mode Toggle Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {darkMode ? <Moon className="w-4.5 h-4.5 text-teal-400" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
            <div>
              <span className="text-xs font-bold block">Theme Mode</span>
              <span className="text-[10px] text-slate-400 block">Switch light or dark style</span>
            </div>
          </div>
          
          {/* Custom Switch Container */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
              darkMode ? 'bg-teal-500' : 'bg-slate-200'
            }`}
          >
            <motion.div
              layout
              className="w-4 h-4 rounded-full bg-white shadow"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ marginLeft: darkMode ? 'auto' : '0px' }}
            />
          </button>
        </div>

        {!isAuditor && (
          <>
            {/* Passcode Trigger */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center justify-between">
              <button
                onClick={() => setShowPassForm(!showPassForm)}
                className="flex items-center gap-2.5 text-left w-full focus:outline-none"
              >
                <Lock className="w-4.5 h-4.5 text-slate-400" />
                <div className="flex-1">
                  <span className="text-xs font-bold block">Change Passcode</span>
                  <span className="text-[10px] text-slate-400 block">Manage terminal login security</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showPassForm ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Simulated Password Form */}
            {showPassForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handlePasswordSubmit}
                className="space-y-3.5 border-t border-dashed border-slate-100 dark:border-slate-800/60 pt-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Current Passcode</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    maxLength={8}
                    className={`w-full p-2 text-xs rounded-xl border outline-none font-mono ${
                      darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">New Passcode</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      maxLength={8}
                      className={`w-full py-2 pl-3 pr-10 text-xs rounded-xl border outline-none font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Confirm New Passcode</label>
                  <input
                    type="password"
                    placeholder="••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={8}
                    className={`w-full p-2 text-xs rounded-xl border outline-none font-mono ${
                      darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChanging}
                  className={`w-full py-2 rounded-xl text-white font-bold text-xs transition-colors shadow flex items-center justify-center gap-1.5 ${
                    isOwner ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {isChanging ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Update Credentials</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </>
        )}
      </div>

      {/* Prominent Action Button: Logout */}
      <button
        onClick={onLogout}
        className="w-full h-11 rounded-2xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
      >
        <LogOut className="w-4 h-4 stroke-[2.5]" />
        <span>SIGN OUT OF SYSTEM</span>
      </button>
    </div>
  );
}
