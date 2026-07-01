/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Home, Receipt, BarChart3, User, Plus } from 'lucide-react';
import { ActiveScreen, UserRole } from '../types';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  userRole: UserRole;
  darkMode: boolean;
  onFabClick?: () => void;
}

export default function BottomNav({
  activeScreen,
  setActiveScreen,
  userRole,
  darkMode,
  onFabClick
}: BottomNavProps) {
  const isOwner = userRole === 'OWNER';

  const navItems = [
    {
      id: 'DASHBOARD' as const,
      label: 'Home',
      icon: Home,
      screen: isOwner ? ('OWNER_DASHBOARD' as const) : ('SUPERVISOR_DASHBOARD' as const)
    },
    {
      id: 'TRANSACTIONS' as const,
      label: 'Activity',
      icon: Receipt,
      screen: 'TRANSACTIONS' as const
    },
    ...(isOwner
      ? [
          {
            id: 'REPORTS' as const,
            label: 'Reports',
            icon: BarChart3,
            screen: 'REPORTS' as const
          }
        ]
      : [
          // Supervisors can also view reports (supervisor-level summary stats)
          {
            id: 'REPORTS' as const,
            label: 'Summary',
            icon: BarChart3,
            screen: 'REPORTS' as const
          }
        ]),
    {
      id: 'PROFILE' as const,
      label: 'Profile',
      icon: User,
      screen: 'PROFILE' as const
    }
  ];

  const getIsActive = (itemId: string) => {
    if (itemId === 'DASHBOARD') {
      return activeScreen === 'OWNER_DASHBOARD' || activeScreen === 'SUPERVISOR_DASHBOARD';
    }
    return activeScreen === itemId;
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 h-20 border-t flex items-center justify-between px-6 z-30 transition-colors duration-300 pb-4 ${
      darkMode ? 'bg-slate-950/95 border-slate-900' : 'bg-white/95 border-slate-100'
    } backdrop-blur-md`}>
      {navItems.map((item, index) => {
        const isActive = getIsActive(item.id);
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.screen)}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive
                ? isOwner
                  ? 'text-blue-500'
                  : 'text-teal-500'
                : 'text-slate-400 hover:text-slate-500'
            }`}>
              <Icon className="w-5.5 h-5.5 transition-transform duration-300 active:scale-75" />
            </div>
            
            <span className={`text-[9px] font-medium tracking-wide mt-0.5 ${
              isActive
                ? darkMode
                  ? 'text-white'
                  : 'text-slate-900'
                : 'text-slate-400'
            }`}>
              {item.label}
            </span>

            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className={`absolute bottom-[-10px] w-5 h-1 rounded-full ${
                  isOwner ? 'bg-blue-500' : 'bg-teal-500'
                }`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}

      {/* Embedded Supervisor Add FAB inside bottom-nav spacer for elegance, if is Supervisor */}
      {!isOwner && onFabClick && (
        <button
          onClick={onFabClick}
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-tr from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-500/35 border-4 border-slate-50 dark:border-slate-950 active:scale-90 active:rotate-90 transition-all duration-300"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      )}
    </div>
  );
}
