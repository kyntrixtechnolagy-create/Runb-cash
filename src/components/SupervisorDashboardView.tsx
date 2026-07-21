/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
  onApproveAllocation?: (txId: string) => void;
  onRerequestAllocation?: (txId: string, note: string) => void;
  onViewLedgerClick?: () => void;
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
  onDeclineTransfer,
  onApproveAllocation,
  onRerequestAllocation,
  onViewLedgerClick
}: SupervisorDashboardViewProps) {
  const [currentTab, setCurrentTab] = useState<'HOME' | 'PURCHASES'>('HOME');
  const [rerequestNote, setRerequestNote] = useState<{ [key: string]: string }>({});
  const [showRerequestInput, setShowRerequestInput] = useState<{ [key: string]: boolean }>({});

  // Filter transactions for this supervisor
  const myTransactions = transactions.filter((t) => t.supervisorId === user.id);

  // Compute stats
  const availableCash = spendableCash;
  const totalFundingAllocated = balance ? balance.allocatedCash : 0;

  // Expenses spent by this supervisor today (or overall approved spent)
  const todayStr = new Date().toISOString().split('T')[0];
  const [cfStartDate, setCfStartDate] = useState(todayStr);
  const [cfEndDate, setCfEndDate] = useState(todayStr);
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

  // Cash Flow Summary Metrics (Filtered by date range)
  const cfIncomeTransactions = myTransactions.filter(t => t.type === 'INCOME' && t.date >= cfStartDate && t.date <= cfEndDate && t.status === 'APPROVED');
  const companyReceiptsFiltered = cfIncomeTransactions
    .filter(t => t.category === 'Allocation')
    .reduce((sum, t) => sum + t.amount, 0);
  const customerReceiptsFiltered = cfIncomeTransactions
    .filter(t => t.category !== 'Allocation')
    .reduce((sum, t) => sum + t.amount, 0);
  const expensesFiltered = myTransactions
    .filter(t => t.type === 'EXPENSE' && t.date >= cfStartDate && t.date <= cfEndDate && t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);
  const returnsFiltered = myTransactions
    .filter(t => t.type === 'RETURN' && t.date >= cfStartDate && t.date <= cfEndDate && t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate closing balance on cfEndDate
  const transactionsAfterRange = myTransactions.filter(t => t.date > cfEndDate && t.status === 'APPROVED');
  const incomeAfter = transactionsAfterRange.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expenseAfter = transactionsAfterRange.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const returnsAfter = transactionsAfterRange.filter(t => t.type === 'RETURN').reduce((sum, t) => sum + t.amount, 0);

  const closingBalance = availableCash - incomeAfter + expenseAfter + returnsAfter;
  const openingBalance = closingBalance - companyReceiptsFiltered - customerReceiptsFiltered + expensesFiltered + returnsFiltered;

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

  // Pending Allocations (sent by owner)
  const myPendingAllocations = myTransactions.filter(t =>
    t.category === 'Allocation' && t.status === 'PENDING'
  );

  return (
    <div className="flex-1 overflow-hidden p-4 flex flex-col relative h-full">
      {currentTab === 'HOME' && (
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto no-scrollbar pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Dynamic Header Banner / Profile Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onViewLedgerClick}
            className="rounded-[20px] bg-gradient-to-r from-brand-blue to-brand-teal text-white p-5 shadow-xl shadow-brand-blue/20 relative overflow-hidden shrink-0 cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />

            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[10px] font-semibold tracking-wide uppercase text-teal-100">My Leftover Money</h3>
                <h2 className="text-3xl font-display font-bold tracking-tight mt-0.5 whitespace-nowrap">
                  Rs. {availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onCollectCashClick(); }}
                  className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-emerald-500/30 transition-colors cursor-pointer"
                  title="Receive Cash at Site"
                >
                  <ArrowDownLeft className="w-5 h-5 text-emerald-100" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestCashClick(); }}
                  className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-blue-500/30 transition-colors cursor-pointer"
                  title="Request Cash from Owner"
                >
                  <Coins className="w-5 h-5 text-blue-100" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReturnCashClick(); }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 transition-colors cursor-pointer"
                  title="Return Cash to Owner"
                >
                  <Undo2 className="w-5 h-5 text-teal-100" />
                </button>
              </div>
            </div>

            {/* Dynamic Warning if cash is low */}
            {availableCash < 200 && (
              <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-2 mt-2 text-[10px] text-red-100 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Balance low. Please ask for more money soon.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-white/15 pt-3 mt-3">
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
            <div 
              onClick={onViewLedgerClick}
              className={`p-4 rounded-2xl border transition-all-300 flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'
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
            <div 
              onClick={onViewLedgerClick}
              className={`p-4 rounded-2xl border transition-all-300 flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waiting Approval</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold font-mono text-amber-500">
                  Rs. {totalPendingSpent.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Pending review</span>
              </div>
            </div>
          </div>

          {/* Cash Flow Summary */}
          <div className={`p-4 rounded-3xl border transition-all-300 space-y-3 mt-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
              <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap">Cash Flow Summary</h4>
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="date"
                  value={cfStartDate}
                  onChange={(e) => setCfStartDate(e.target.value)}
                  className={`p-1.5 text-[10px] font-bold rounded-lg border outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                />
                <span className="text-[10px] font-bold text-slate-400">to</span>
                <input 
                  type="date"
                  value={cfEndDate}
                  onChange={(e) => setCfEndDate(e.target.value)}
                  className={`p-1.5 text-[10px] font-bold rounded-lg border outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                />
                {(cfStartDate !== todayStr || cfEndDate !== todayStr) && (
                  <button 
                    onClick={() => { setCfStartDate(todayStr); setCfEndDate(todayStr); }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span>Opening</span>
                <span className="font-mono text-slate-800 dark:text-slate-100">Rs. {openingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-emerald-500">Customer Receipts</span>
                <span className="font-mono text-emerald-500">Rs. {customerReceiptsFiltered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-emerald-500">Company receipt</span>
                <span className="font-mono text-emerald-500">Rs. {companyReceiptsFiltered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-red-500">Expenses</span>
                <span className="font-mono text-red-500">Rs. {expensesFiltered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-800 dark:text-slate-100 uppercase tracking-wider">Closing balance</span>
                <span className="font-mono text-slate-800 dark:text-slate-100 text-sm">Rs. {closingBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {myPendingAllocations.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Pending Allocations From Owner</h4>
              {myPendingAllocations.map(tx => (
                <div key={tx.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-teal-900/50' : 'bg-teal-50/50 border-teal-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">New Allocation</div>
                      <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">Rs. {tx.amount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Date: {tx.date.split('-').reverse().join('/')}</div>
                      <div className="text-[10px] text-slate-500 mt-1 max-w-[120px]">
                        {(() => {
                          try {
                            return JSON.parse(tx.description).note;
                          } catch { return tx.description; }
                        })()}
                      </div>
                    </div>
                  </div>

                  {showRerequestInput[tx.id] ? (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter reason for re-request (e.g. amount is wrong)"
                        value={rerequestNote[tx.id] || ''}
                        onChange={(e) => setRerequestNote(prev => ({ ...prev, [tx.id]: e.target.value }))}
                        className={`w-full p-2 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                          }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (rerequestNote[tx.id]?.trim() && onRerequestAllocation) {
                              onRerequestAllocation(tx.id, rerequestNote[tx.id]);
                            }
                          }}
                          className="flex-1 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 active:scale-95 transition-all"
                        >
                          Submit Re-request
                        </button>
                        <button
                          onClick={() => setShowRerequestInput(prev => ({ ...prev, [tx.id]: false }))}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onApproveAllocation && onApproveAllocation(tx.id)}
                        className="flex-1 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"
                      >
                        Accept Cash
                      </button>
                      <button
                        onClick={() => setShowRerequestInput(prev => ({ ...prev, [tx.id]: true }))}
                        className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all"
                      >
                        Re-request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
          <div className={`p-4 rounded-xl border transition-all-300 shrink-0 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How much has been spent:</span>
              <span className="text-[10px] font-bold text-teal-500">{Math.round(ratioUsed)}% Spent</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(ratioUsed, 100)}%` }}
                className="h-full bg-gradient-to-r from-brand-blue to-brand-teal rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[9px] font-semibold text-slate-400 mt-1.5">
              <span>Spent overall: Rs. {overallSpentApproved.toLocaleString()}</span>
              <span>Leftover: Rs. {availableCash.toLocaleString()}</span>
            </div>
          </div>

          {/* Recent Purchases Summary Card */}
          <div
            onClick={() => setCurrentTab('PURCHASES')}
            className={`p-4 rounded-2xl border transition-all-300 shrink-0 flex items-center justify-between cursor-pointer active:scale-[0.98] ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Recent Transactions</span>
              </div>
              <div className="text-xl font-bold font-display text-blue-600 dark:text-blue-400">{myTransactions.length} items</div>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">Click to view all transactions</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {currentTab === 'PURCHASES' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <button onClick={() => setCurrentTab('HOME')} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h3 className="text-lg font-bold font-display">My Purchases</h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-24">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">My Recent Transactions</h4>
              <span className="text-[11px] font-semibold text-slate-400">Total items: {myTransactions.length}</span>
            </div>

            {myTransactions.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400">You haven't added any purchases yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onViewTransactionDetails(tx)}
                    className={`p-3 rounded-2xl border transition-all-300 flex items-center justify-between cursor-pointer hover:scale-[1.01] ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${tx.type === 'INCOME'
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
                        <div className="text-[10px] text-slate-500 mt-0.5">{tx.date.split('-').reverse().join('/')}</div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold font-mono ${tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'RETURN' ? 'text-purple-500' : 'text-red-500'
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

        </div>
      )}


    </div>
  );
}
