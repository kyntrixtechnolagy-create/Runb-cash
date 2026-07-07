/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import {
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  Undo2,
  Coins
} from 'lucide-react';
import { User, SupervisorBalance, Transaction } from '../types';

interface SupervisorDashboardViewProps {
  user: User;
  balance: SupervisorBalance;
  spendableCash: number;
  transactions: Transaction[];
  darkMode: boolean;
  onAddExpenseClick: () => void;
  onReturnCashClick: () => void;
  onCollectCashClick: () => void;
  onRequestCashClick: () => void;
  onViewTransactionDetails: (tx: Transaction) => void;
  onEditExpense?: (tx: Transaction) => void;
  onApproveTransfer?: (txId: string, userId: string) => void;
  onDeclineTransfer?: (txId: string, userId: string) => void;
}

export default function SupervisorDashboardView({
  user,
  balance,
  spendableCash,
  transactions,
  darkMode,
  onAddExpenseClick,
  onReturnCashClick,
  onCollectCashClick,
  onRequestCashClick,
  onViewTransactionDetails,
  onEditExpense,
  onApproveTransfer,
  onDeclineTransfer
}: SupervisorDashboardViewProps) {
  // Filter transactions for this supervisor
  const myTransactions = transactions.filter((t) => t.supervisorId === user.id);

  // Compute stats
  const availableCash = spendableCash;
  const totalFundingAllocated = balance ? balance.allocatedCash : 0;

  // Expenses spent by this supervisor today (or overall approved spent)
  const todayStr = new Date().toISOString().split('T')[0];
  const expensesToday = myTransactions
    .filter((t) => t.type === 'EXPENSE' && t.date === todayStr && t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);

  const overallSpentApproved = myTransactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pending verification
  const totalPendingSpent = myTransactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  // Limit alerts
  const ratioUsed = totalFundingAllocated > 0 ? (overallSpentApproved / totalFundingAllocated) * 100 : 0;

  // Pending Transfers
  const myPendingTransfers = transactions.filter(t => {
    if (t.category !== 'STAFF_TRANSFER' || t.status !== 'PENDING' || !t.description) return false;
    try {
      const state = JSON.parse(t.description);
      return t.supervisorId === user.id || state.receiverId === user.id;
    } catch { return false; }
  });

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 p-4 space-y-5 relative">
      {/* Dynamic Header Banner / Profile Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] bg-gradient-to-r from-brand-blue to-brand-teal text-white p-5 shadow-xl shadow-brand-blue/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />

        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold tracking-wide uppercase text-teal-100">My Leftover Money</h3>
            <h2 className="text-3xl font-display font-bold tracking-tight mt-1">
              Rs. {availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="flex gap-2">
            <button 
               onClick={onCollectCashClick}
               className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-emerald-500/30 transition-colors cursor-pointer"
               title="Receive Cash at Site"
            >
              <ArrowDownLeft className="w-5 h-5 text-emerald-100" />
            </button>
            <button 
               onClick={onRequestCashClick}
               className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-blue-500/30 transition-colors cursor-pointer"
               title="Request Cash from Owner"
            >
              <Coins className="w-5 h-5 text-blue-100" />
            </button>
            <button 
               onClick={onReturnCashClick}
               className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
               title="Return Cash to Owner"
            >
              <Undo2 className="w-5 h-5 text-teal-100" />
            </button>
          </div>
        </div>

        {/* Dynamic Warning if cash is low */}
        {availableCash < 200 && (
          <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-2 mt-3 text-[11px] text-red-100 font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Your balance is getting very low. Please ask the owner to send you more money soon.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-white/15 pt-4 mt-4">
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-teal-200 uppercase">Total Money Given</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              Rs. {totalFundingAllocated.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-teal-200 uppercase">Approved Spending</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              Rs. {overallSpentApproved.toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Numerical Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Spent Today Card */}
        <div className={`p-4 rounded-2xl border transition-all-300 flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spent Today</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              Rs. {expensesToday.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Approved spending today</span>
          </div>
        </div>

        {/* Pending Claims Card */}
        <div className={`p-4 rounded-2xl border transition-all-300 flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waiting Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-amber-500">
              Rs. {totalPendingSpent.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Waiting for owner review</span>
          </div>
        </div>
      </div>

      {myPendingTransfers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Pending Transfer Requests</h4>
          {myPendingTransfers.map(tx => {
            const state = JSON.parse(tx.description);
            const isSender = tx.supervisorId === user.id;
            const hasApproved = isSender ? state.senderApproved : state.receiverApproved;

            return (
              <div key={tx.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-blue-900/50' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Transfer Request</div>
                    <div className="text-lg font-bold font-mono">Rs. {tx.amount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500">From: {tx.supervisorName}</div>
                    <div className="text-xs font-bold text-slate-500">To: {state.receiverName}</div>
                  </div>
                </div>
                
                {hasApproved ? (
                  <div className="text-xs font-bold text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    Waiting for the other party to approve.
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveTransfer && onApproveTransfer(tx.id, user.id)}
                      className="flex-1 py-2 bg-blue-500 text-white font-bold text-xs rounded-xl hover:bg-blue-600 active:scale-95 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onDeclineTransfer && onDeclineTransfer(tx.id, user.id)}
                      className="flex-1 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-200 active:scale-95 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Simple Ledger Progress Chart */}
      <div className={`p-4 rounded-2xl border transition-all-300 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">How much has been spent:</span>
          <span className="text-xs font-bold text-teal-500">{Math.round(ratioUsed)}% Spent</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(ratioUsed, 100)}%` }}
            className="h-full bg-gradient-to-r from-brand-blue to-brand-teal rounded-full transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2">
          <span>Spent overall: Rs. {overallSpentApproved.toLocaleString()}</span>
          <span>Leftover: Rs. {availableCash.toLocaleString()}</span>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">My Recent Purchases</h4>
          <span className="text-[11px] font-semibold text-slate-400">Total items: {myTransactions.length}</span>
        </div>

        {myTransactions.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">You haven't added any purchases yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                onClick={() => onViewTransactionDetails(tx)}
                className={`p-3 rounded-2xl border transition-all-300 flex items-center justify-between cursor-pointer hover:scale-[1.01] ${
                  darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.type === 'INCOME'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : tx.type === 'RETURN'
                      ? 'bg-purple-500/10 text-purple-500'
                      : tx.status === 'APPROVED'
                      ? 'bg-teal-500/10 text-teal-500'
                      : tx.status === 'REJECTED'
                      ? 'bg-red-500/10 text-red-500'
                      : tx.status === 'NEEDS_CORRECTION'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : tx.type === 'RETURN' ? 'R' : tx.category[0]}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.category}</div>
                    <div className="text-xs font-bold mt-0.5 line-clamp-1">
                      {tx.category === 'STAFF_TRANSFER' ? (() => {
                        try {
                          const state = JSON.parse(tx.description);
                          return tx.type === 'INCOME' ? `Received from ${tx.supervisorName}` : `Transfer to ${state.receiverName}`;
                        } catch { return tx.description; }
                      })() : tx.category === 'Allocation' ? (() => {
                        try {
                          return JSON.parse(tx.description).note;
                        } catch { return tx.description; }
                      })() : tx.description}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{tx.date}</div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold font-mono ${
                    tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'RETURN' ? 'text-purple-500' : 'text-red-500'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                  </span>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1">
                    {tx.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">
                        <CheckCircle className="w-2 h-2" /> Approved
                      </span>
                    )}
                    {tx.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-bold">
                        <Clock className="w-2 h-2" /> Reviewing
                      </span>
                    )}
                    {tx.status === 'REJECTED' && (
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[9px] font-bold">
                          <XCircle className="w-2 h-2" /> Rejected
                        </span>
                        {onEditExpense && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditExpense(tx);
                            }}
                            className="text-[9px] font-bold px-2 py-1 bg-red-500 text-white rounded-md active:scale-95 cursor-pointer"
                          >
                            Edit Expense
                          </button>
                        )}
                      </div>
                    )}
                    {tx.status === 'NEEDS_CORRECTION' && (
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-bold">
                          <AlertCircle className="w-2 h-2" /> Needs Correction
                        </span>
                        {onEditExpense && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditExpense(tx);
                            }}
                            className="text-[9px] font-bold px-2 py-1 bg-rose-500 text-white rounded-md active:scale-95"
                          >
                            Edit Expense
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={onAddExpenseClick}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-tr from-brand-blue to-brand-teal text-white rounded-full flex items-center justify-center shadow-xl shadow-brand-blue/30 active:scale-90 active:rotate-90 transition-all duration-300 z-40 border border-white/10"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>
    </div>
  );
}
