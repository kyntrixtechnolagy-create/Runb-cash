/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  Calendar,
  X,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ChevronRight,
  User,
  Tags,
  Download,
  AlertCircle
} from 'lucide-react';
import { Transaction, UserRole } from '../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  userRole: UserRole;
  darkMode: boolean;
  onReviewTransaction?: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onEditAllocation?: (id: string, newAmount: number) => void;
  selectedTxDetails?: Transaction | null;
  setSelectedTxDetails: (tx: Transaction | null) => void;
  onEditExpense?: (tx: Transaction) => void;
  initialSearchTerm?: string;
  initialCategoryFilter?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  categories: { name: string, icon: string, color: string }[];
}

export default function TransactionsView({
  transactions,
  userRole,
  darkMode,
  onReviewTransaction,
  onEditAllocation,
  selectedTxDetails,
  setSelectedTxDetails,
  onEditExpense,
  initialSearchTerm = '',
  initialCategoryFilter = 'ALL',
  initialStartDate = '',
  initialEndDate = '',
  categories
}: TransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const isOwner = userRole === 'OWNER';
  const isSupervisor = userRole === 'SUPERVISOR';
  const isAuditor = userRole === 'AUDITOR';

  // Apply filters
  const filteredTx = transactions.filter((tx) => {
    const matchSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === 'ALL' || tx.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchStatus = selectedStatus === 'ALL' || tx.status === selectedStatus;
    const matchType = selectedType === 'ALL' || tx.type === selectedType;
    const matchDate = (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate);

    return matchSearch && matchCategory && matchStatus && matchType && matchDate;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 p-4 space-y-4">
      {/* Search and Filters panel */}
      <div className={`p-4 rounded-3xl border transition-all-300 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
        <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Search Ledger</h3>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, staff, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2 pl-10 pr-4 text-xs rounded-xl border outline-none transition-all-300 ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
          />
        </div>

        {/* Filters Select Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Flow Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
            >
              <option value="ALL">All Flows</option>
              <option value="INCOME">Income / Allocation</option>
              <option value="EXPENSE">Expense / Cost</option>
              <option value="RETURN">Cash Return</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending Audit</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-2">
          {/* Date Picker Filters */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Date Range</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full p-1.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full p-1.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
              />
            </div>
          </div>
        </div>

        {/* Clear Filter Indicator */}
        {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL' || startDate || endDate) && (
          <button
            onClick={handleClearFilters}
            className="text-[10px] text-blue-500 font-semibold flex items-center gap-1 mt-1 hover:underline"
          >
            <X className="w-3 h-3" />
            <span>Reset Active Filters</span>
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">LEDGER RECORDS</span>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {filteredTx.length} of {transactions.length} ITEMS
          </span>
        </div>

        {filteredTx.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">No matching transactions found.</p>
            <button
              onClick={handleClearFilters}
              className="text-xs text-blue-500 font-bold mt-2 hover:underline"
            >
              Clear filters and search
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTx.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isReturn = tx.type === 'RETURN';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTxDetails(tx)}
                  className={`p-3.5 rounded-2xl border transition-all-300 flex items-center justify-between cursor-pointer hover:scale-[1.01] ${darkMode
                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center font-bold text-xs ${isIncome
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : isReturn
                        ? 'bg-purple-500/10 text-purple-500'
                        : tx.status === 'APPROVED'
                          ? 'bg-blue-500/10 text-blue-500'
                          : tx.status === 'REJECTED'
                            ? 'bg-red-500/10 text-red-500'
                            : tx.status === 'NEEDS_CORRECTION'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-500'
                      }`}>
                      {isIncome ? '+' : isReturn ? 'R' : tx.category[0]}
                    </div>

                    <div>
                      <div className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>{isReturn ? 'Cash Return' : tx.category}</span>
                        {isOwner && (
                          <span className="text-slate-400 font-normal">by {tx.supervisorName}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-1">
                        {tx.category === 'STAFF_TRANSFER' ? (() => {
                          try {
                            const state = JSON.parse(tx.description);
                            return isIncome ? `Received from ${tx.supervisorName}` : `Transfer to ${state.receiverName}`;
                          } catch { return tx.description; }
                        })() : tx.category === 'Allocation' ? (() => {
                          try {
                            const d = JSON.parse(tx.description);
                            if (isOwner) {
                              return (
                                <span>
                                  {d.note} <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded ml-1 font-normal">{d.paymentMethod === 'ONLINE' ? `Online: ${d.bankName}` : 'Cash'}</span>
                                </span>
                              );
                            }
                            return d.note;
                          } catch { return tx.description; }
                        })() : tx.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{tx.date.split('-').reverse().join('/')}</div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`text-xs font-mono font-bold ${isIncome ? 'text-emerald-500' : isReturn ? 'text-purple-500' : 'text-red-500'
                      }`}>
                      {isIncome ? '+' : isReturn ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                    </span>

                    {/* Status indicator */}
                    <div className="flex items-center">
                      {tx.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-bold">
                          <CheckCircle className="w-2 h-2" /> Approved
                        </span>
                      )}
                      {tx.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-bold">
                          <Clock className="w-2 h-2" /> Pending
                        </span>
                      )}
                      {tx.status === 'REJECTED' && (
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-bold">
                            <XCircle className="w-2 h-2" /> Rejected
                          </span>
                          {isSupervisor && onEditExpense && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditExpense(tx);
                              }}
                              className="text-[8px] font-bold px-2 py-1 bg-red-500 text-white rounded active:scale-95 cursor-pointer"
                            >
                              Edit & Resubmit
                            </button>
                          )}
                        </div>
                      )}
                      {tx.status === 'NEEDS_CORRECTION' && (
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-bold">
                            <AlertCircle className="w-2 h-2" /> Needs Correction
                          </span>
                          {isSupervisor && onEditExpense && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditExpense(tx);
                              }}
                              className="text-[8px] font-bold px-2 py-1 bg-rose-500 text-white rounded active:scale-95"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED TRANSACTION DRAWER */}
      {selectedTxDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end justify-center p-0 z-50">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className={`w-full max-w-md rounded-t-[32px] p-6 border-t shadow-2xl relative transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
          >
            {/* Grabber handle */}
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            <button
              onClick={() => setSelectedTxDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display mb-1">Transaction Receipt</h3>
            <p className="text-xs text-slate-400 mb-5">Verifying transaction fields and digital receipt upload</p>

            {/* Receipt details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Amount Value
                  </div>
                  <div className={`text-2xl font-bold font-mono mt-0.5 ${selectedTxDetails.type === 'INCOME' ? 'text-emerald-500' : selectedTxDetails.type === 'RETURN' ? 'text-purple-500' : 'text-red-500'
                    }`}>
                    {selectedTxDetails.type === 'INCOME' ? '+' : selectedTxDetails.type === 'RETURN' ? '+' : '-'}Rs. {selectedTxDetails.amount.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Status
                  </div>
                  <div className="mt-1">
                    {selectedTxDetails.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {selectedTxDetails.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                      </span>
                    )}
                    {selectedTxDetails.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                    {selectedTxDetails.status === 'NEEDS_CORRECTION' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> Mistake
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">
                    {selectedTxDetails.type === 'EXPENSE' ? 'Site Name' : 'Flow Type'}
                  </span>
                  <span className="font-bold mt-1 block">
                    {selectedTxDetails.type === 'INCOME'
                      ? 'Allocation Inflow'
                      : selectedTxDetails.type === 'RETURN'
                        ? 'Cash Return'
                        : (selectedTxDetails.description.match(/^\[(.*?)\]/)
                          ? selectedTxDetails.description.match(/^\[(.*?)\]/)?.[1]
                          : (selectedTxDetails.description.match(/at (.*?) from/)
                            ? selectedTxDetails.description.match(/at (.*?) from/)?.[1]
                            : 'Unknown Site'))}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">Category Tag</span>
                  <span className="font-bold mt-1 block">{selectedTxDetails.category}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">Staff Member</span>
                  <span className="font-bold mt-1 block flex items-center gap-1">
                    <User className="w-3 h-3 text-teal-500" /> {selectedTxDetails.supervisorName}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">Logged Date</span>
                  <span className="font-bold mt-1 block">{selectedTxDetails.date.split('-').reverse().join('/')}</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">
                  {selectedTxDetails.type === 'RETURN' ? 'Return Note' : selectedTxDetails.category === 'STAFF_TRANSFER' ? 'Transfer Details' : selectedTxDetails.category === 'Allocation' ? 'Allocation Details' : 'Expense Justification'}
                </span>
                <p className="font-medium text-xs mt-1 text-slate-700 dark:text-slate-200">
                  {selectedTxDetails.category === 'STAFF_TRANSFER' ? (() => {
                    try {
                      const state = JSON.parse(selectedTxDetails.description);
                      return selectedTxDetails.type === 'INCOME'
                        ? `Received from ${selectedTxDetails.supervisorName}`
                        : `Transfer to ${state.receiverName}`;
                    } catch { return selectedTxDetails.description; }
                  })() : selectedTxDetails.category === 'Allocation' ? (() => {
                    try {
                      const d = JSON.parse(selectedTxDetails.description);
                      return (
                        <span>
                          {d.note}
                          <br />
                          <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded mt-1 inline-block font-normal">
                            {d.paymentMethod === 'ONLINE' ? `Online: ${d.bankName}` : 'Cash'}
                          </span>
                        </span>
                      );
                    } catch { return selectedTxDetails.description; }
                  })() : selectedTxDetails.description}
                </p>
              </div>

              {selectedTxDetails.status === 'NEEDS_CORRECTION' && selectedTxDetails.mistakeNote && (
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <span className="text-rose-500 font-mono tracking-wider text-[9px] uppercase block">Owner's Note on Mistake</span>
                  <p className="font-bold text-xs mt-1 text-rose-600 dark:text-rose-400">
                    {selectedTxDetails.mistakeNote}
                  </p>
                </div>
              )}

              {/* Receipt Image Upload Preview */}
              {selectedTxDetails.type === 'EXPENSE' && (
                <div className="space-y-1.5">
                  <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">Digital Receipt Attachment</span>
                  {selectedTxDetails.receiptUrl ? (
                    <div className="relative rounded-2xl overflow-hidden h-32 border border-slate-200 dark:border-slate-800 group">
                      <img
                        src={selectedTxDetails.receiptUrl}
                        alt="Receipt"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <a
                        href={selectedTxDetails.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-slate-950/70 hover:bg-slate-950 text-white p-1.5 rounded-lg text-[9px] font-mono tracking-wider flex items-center gap-1 shadow"
                      >
                        <Download className="w-3 h-3" />
                        <span>FULL FILE</span>
                      </a>
                    </div>
                  ) : (
                    <div className="h-20 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[11px]">No receipt attachment uploaded.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action approvals for Owners */}
              {isOwner && selectedTxDetails.status === 'PENDING' && onReviewTransaction && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onReviewTransaction(selectedTxDetails.id, 'APPROVED');
                      setSelectedTxDetails(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-white font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform ${selectedTxDetails.type === 'RETURN' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{selectedTxDetails.type === 'RETURN' ? 'Accept Return' : 'Approve Claims'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onReviewTransaction(selectedTxDetails.id, 'REJECTED');
                      setSelectedTxDetails(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline Claims</span>
                  </button>
                </div>
              )}

              {isOwner && selectedTxDetails.status === 'NEEDS_CORRECTION' && selectedTxDetails.category === 'Allocation' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="number"
                    placeholder="New Amount"
                    id={`edit-alloc-modal-${selectedTxDetails.id}`}
                    defaultValue={selectedTxDetails.amount}
                    className={`flex-1 p-2.5 text-xs rounded-xl border outline-none font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`edit-alloc-modal-${selectedTxDetails.id}`) as HTMLInputElement;
                      const newAmount = Number(input.value);
                      if (newAmount > 0 && onEditAllocation) {
                        onEditAllocation(selectedTxDetails.id, newAmount);
                        setSelectedTxDetails(null);
                      }
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform shadow-md shadow-blue-500/20"
                  >
                    Resend
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
