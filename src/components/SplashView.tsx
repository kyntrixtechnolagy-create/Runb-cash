/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import runbLogo from '../assets/runb_logo.png';

interface SplashViewProps {
  onComplete: () => void;
  key?: string;
}

export default function SplashView({ onComplete }: SplashViewProps) {
  useEffect(() => {
    const timer = setTimeout(() => { onComplete(); }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-16 px-8 z-50 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1C2C 0%, #0f2d1e 50%, #0B1C2C 100%)' }}>
      {/* Ambient green glow blobs */}
      <div className="absolute top-1/4 -left-16 w-72 h-72 bg-green-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-1/3 -right-16 w-72 h-72 bg-emerald-400 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse" />

      <div />

      {/* Main Logo & Brand */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', times: [0, 0.7, 1] }}
          className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <img src={runbLogo} alt="RunB" className="w-20 h-20 object-contain" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-5xl font-sans font-black tracking-tight mb-2"
          style={{ background: 'linear-gradient(135deg, #4ADE80, #22C55E, #16A34A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          RunB
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 0.8 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-xs tracking-widest font-sans uppercase font-semibold text-green-300/80"
        >
          Your Daily Cash Companion
        </motion.p>
      </div>

      {/* Loading Bar */}
      <div className="flex flex-col items-center w-full max-w-xs">
        <div className="w-full h-0.5 rounded-full overflow-hidden mb-8" style={{ background: 'rgba(34,197,94,0.15)' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #16A34A, #4ADE80)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-green-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secured & Safe Cash Manager</span>
          </div>

          <div className="opacity-60">
            <p className="text-[10px] font-bold text-green-400/80 uppercase tracking-widest">Powered by Avigos Technologies</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
