/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Bell, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import { User } from '../types';
import runbLogo from '../assets/runb_logo.png';

interface DashboardHeaderProps {
  user: User;
  darkMode: boolean;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function DashboardHeader({
  user,
  darkMode,
  onLogout,
  onRefresh,
  isRefreshing = false,
  notificationCount = 2,
  onNotificationClick
}: DashboardHeaderProps) {
  const isOwner = user.role === 'OWNER';

  return (
    <div className={`px-4 pt-3 pb-2.5 flex items-center justify-between border-b transition-colors duration-300 z-20 relative sticky top-0 backdrop-blur-md ${
      darkMode ? 'bg-[#0B1C2C]/95 border-green-900/30' : 'bg-white/95 border-green-100'
    }`}>

      {/* Left — Logo + App name */}
      <div className="flex items-center gap-2.5">
        <img src={runbLogo} alt="Runb" className="w-8 h-8 object-contain" />
        <div>
          <div className="text-base font-display font-bold leading-none tracking-tight text-green-500">Runb</div>
          <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5 uppercase tracking-wider">Your Daily Cash Companion</div>
        </div>
      </div>

      {/* Center — User badge */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=16a34a&color=fff`}
            alt={user.name}
            className={`w-8 h-8 rounded-full object-cover border-2 ${
              isOwner ? 'border-green-500' : 'border-emerald-400'
            }`}
          />
          <div className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 border border-white dark:border-[#0B1C2C] ${
            isOwner ? 'bg-green-600' : 'bg-emerald-500'
          }`}>
            <ShieldCheck className="w-2 h-2 text-white" />
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
            {isOwner ? 'Owner' : 'Staff'}
          </div>
          <div className="text-xs font-bold tracking-tight line-clamp-1 max-w-[90px]">
            {user.name}
          </div>
        </div>
      </div>

      {/* Right — Action buttons */}
      <div className="flex items-center gap-1.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`p-2 rounded-xl border transition-all-300 ${
              darkMode
                ? 'bg-green-950/40 border-green-900/40 hover:bg-green-900/40 text-green-400 active:text-green-300'
                : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700'
            }`}
            title="Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        <button
          onClick={onNotificationClick}
          className={`p-2 rounded-xl border relative transition-all-300 ${
            darkMode
              ? 'bg-green-950/40 border-green-900/40 hover:bg-green-900/40 text-green-400'
              : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          {notificationCount > 0 && (
            <>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#0B1C2C] animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#0B1C2C]" />
            </>
          )}
        </button>

        <button
          onClick={onLogout}
          className={`p-2 rounded-xl border transition-all-300 ${
            darkMode
              ? 'bg-green-950/40 border-green-900/40 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/40 text-slate-400'
              : 'bg-green-50 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600'
          }`}
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
