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
import { CATEGORIES } from '../mockData';

interface TransactionsViewProps {
  transactions: Transaction[];
  userRole: UserRole;
  darkMode: boolean;
  onReviewTransaction?: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  selectedTxDetails?: Transaction | null;
  setSelectedTxDetails: (tx: Transaction | null) => void;
}

export default function TransactionsView({
  transactions,
  userRole,
  darkMode,
  onReviewTransaction,
  selectedTxDetails,
  setSelectedTxDetails
}: TransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [filterDate, setFilterDate] = useState('');

  const isOwner = userRole === 'OWNER';

  // Apply filters
  const filteredTx = transactions.filter((tx) => {
    const matchSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === 'ALL' || tx.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchStatus = selectedStatus === 'ALL' || tx.status === selectedStatus;
    const matchType = selectedType === 'ALL' || tx.type === selectedType;
    const matchDate = !filterDate || tx.date === filterDate;

    return matchSearch && matchCategory && matchStatus && matchType && matchDate;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setFilterDate('');
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 p-4 space-y-4">
      {/* Search and Filters panel */}
      <div className={`p-4 rounded-3xl border transition-all-300 space-y-3 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
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
            className={`w-full py-2 pl-10 pr-4 text-xs rounded-xl border outline-none transition-all-300 ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>

        {/* Filters Select Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
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
              className={`w-full p-2 text-xs rounded-xl border outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">All Flows</option>
              <option value="INCOME">Income / Allocation</option>
              <option value="EXPENSE">Expense / Cost</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Status Dropdown */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Audit Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending Audit</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Date</span>
            <div className="relative">
              <Calendar className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`w-full p-1.5 pr-8 text-xs rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Clear Filter Indicator */}
        {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL' || filterDate) && (
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

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTxDetails(tx)}
                  className={`p-3.5 rounded-2xl border transition-all-300 flex items-center justify-between cursor-pointer hover:scale-[1.01] ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : tx.status === 'APPROVED'
                        ? 'bg-blue-500/10 text-blue-500'
                        : tx.status === 'REJECTED'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {isIncome ? '+' : tx.category[0]}
                    </div>

                    <div>
                      <div className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>{tx.category}</span>
                        {isOwner && (
                          <span className="text-slate-400 font-normal">by {tx.supervisorName}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-1">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{tx.date}</div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`text-xs font-mono font-bold ${
                      isIncome ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {isIncome ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
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
                          <Clock className="w-2 h-2" /> Auditing
                        </span>
                      )}
                      {tx.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-bold">
                          <XCircle className="w-2 h-2" /> Rejected
                        </span>
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
            className={`w-full max-w-md rounded-t-[32px] p-6 border-t shadow-2xl relative transition-all duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
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

            <h3 className="text-lg font-bold font-display mb-1">Transaction Receipt Audit</h3>
            <p className="text-xs text-slate-400 mb-5">Verifying transaction fields and digital receipt upload</p>

            {/* Receipt details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Amount Value
                  </div>
                  <div className={`text-2xl font-bold font-mono mt-0.5 ${
                    selectedTxDetails.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {selectedTxDetails.type === 'INCOME' ? '+' : '-'}Rs. {selectedTxDetails.amount.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Audit Status
                  </div>
                  <div className="mt-1">
                    {selectedTxDetails.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {selectedTxDetails.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Auditing
                      </span>
                    )}
                    {selectedTxDetails.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">Flow Type</span>
                  <span className="font-bold mt-1 block">{selectedTxDetails.type === 'INCOME' ? 'Allocation Inflow' : 'Field Expense'}</span>
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
                  <span className="font-bold mt-1 block">{selectedTxDetails.date}</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase block">Expense Justification</span>
                <p className="font-medium text-xs mt-1 text-slate-700 dark:text-slate-200">
                  {selectedTxDetails.description}
                </p>
              </div>

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
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Claims</span>
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
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
