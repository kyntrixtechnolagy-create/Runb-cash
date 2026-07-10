import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndianRupee, ShieldCheck, Users, Activity, FileText, X } from 'lucide-react';
import { PettyCashStats, SupervisorBalance, Transaction, User } from '../types';

interface AuditorDashboardViewProps {
  user: User;
  supervisors: User[];
  balances: SupervisorBalance[];
  transactions: Transaction[];
  darkMode: boolean;
  onViewTransactionDetails: (tx: Transaction) => void;
  onNavigate: (screen: any) => void;
}

export default function AuditorDashboardView({
  user,
  supervisors,
  balances,
  transactions,
  darkMode,
  onViewTransactionDetails,
  onNavigate
}: AuditorDashboardViewProps) {

  const [showStaffBalances, setShowStaffBalances] = React.useState(false);

  const stats = {
    totalCash: balances.reduce((sum, b) => sum + b.allocatedCash, 0),
    totalSpent: balances.reduce((sum, b) => sum + b.spentCash, 0),
    totalRemaining: balances.reduce((sum, b) => sum + b.remainingCash, 0),
  };

  // Formatter for Indian Rupees
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`p-5 pb-24 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-full`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Auditor View</h1>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium flex items-center gap-1.5 mt-0.5`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Read-only access mode
          </p>
        </div>
      </motion.div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => setShowStaffBalances(!showStaffBalances)}
          className={`col-span-2 rounded-3xl p-5 shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <IndianRupee className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Company Cash</p>
              <p className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                {formatINR(stats.totalCash)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <AnimatePresence>
            {showStaffBalances && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="relative z-10 border-t border-slate-200 dark:border-slate-700/50 pt-4 overflow-hidden"
              >
                <div className="space-y-3">
                  {balances.length > 0 ? (
                    balances.map((balance, i) => {
                      const supervisor = supervisors.find(s => s.id === balance.supervisorId);
                      return (
                        <div
                          key={balance.id}
                          className={`p-3 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-bold text-sm truncate max-w-[60%]">
                              {supervisor ? supervisor.name : balance.supervisorName}
                            </div>
                            <div className="text-xs font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                              Allocated: {formatINR(balance.allocatedCash)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-xs">
                            <div>
                              <span className="text-slate-400 font-medium">Spent: </span>
                              <span className="font-bold text-red-500">{formatINR(balance.spentCash)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Remaining: </span>
                              <span className="font-bold text-emerald-500">{formatINR(balance.remainingCash)}</span>
                            </div>
                          </div>
                          
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full"
                              style={{ width: `${balance.allocatedCash > 0 ? Math.min(100, (balance.spentCash / balance.allocatedCash) * 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={`text-center py-4 rounded-2xl border border-dashed ${darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                      <p className="text-xs font-medium">No staff members found.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-[2rem] p-4 shadow-lg ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Spent</p>
          <p className="text-lg font-display font-bold text-red-500">{formatINR(stats.totalSpent)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-[2rem] p-4 shadow-lg ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Remaining</p>
          <p className="text-lg font-display font-bold text-emerald-500">{formatINR(stats.totalRemaining)}</p>
        </motion.div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => onNavigate('TRANSACTIONS')}
          className={`flex flex-col items-center justify-center p-4 rounded-3xl shadow-md border transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-xs font-bold">View Ledger</span>
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => onNavigate('REPORTS')}
          className={`flex flex-col items-center justify-center p-4 rounded-3xl shadow-md border transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-xs font-bold">Download Reports</span>
        </motion.button>
      </div>

      
    </div>
  );
}
