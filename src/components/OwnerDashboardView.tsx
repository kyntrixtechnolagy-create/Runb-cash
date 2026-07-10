/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  Users,
  TrendingDown,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Coins,
  Check,
  X,
  Clock,
  ExternalLink,
  Edit2,
  Phone,
  Mail,
  Briefcase,
  Save,
  Trash2
} from 'lucide-react';
import { User, SupervisorBalance, Transaction } from '../types';

interface OwnerDashboardViewProps {
  user: User;
  supervisors: User[];
  balances: SupervisorBalance[];
  transactions: Transaction[];
  darkMode: boolean;
  onAllocateCash: (supervisorId: string, amount: number, notes: string) => void;
  onAddSupervisor: (name: string, email: string, password: string, designation: string, phone: string, spendLimit: number) => void;
  onReviewTransaction: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onViewTransactionDetails: (tx: Transaction) => void;
  onEditStaff: (id: string, name: string, designation: string, phone: string, spendLimit: number) => void;
  onRemoveStaff?: (id: string) => void;
  onEditAllocation?: (txId: string, newAmount: number) => void;
  onCreateTransfer?: (senderId: string, receiverId: string, amount: number) => void;
  onViewStaffAudit?: (staffId: string) => void;
}

export default function OwnerDashboardView({
  user,
  supervisors,
  balances,
  transactions,
  darkMode,
  onAllocateCash,
  onAddSupervisor,
  onReviewTransaction,
  onViewTransactionDetails,
  onEditStaff,
  onRemoveStaff,
  onEditAllocation,
  onCreateTransfer,
  onViewStaffAudit
}: OwnerDashboardViewProps) {
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showAddSupModal, setShowAddSupModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Navigation State to avoid scrolling
  const [currentTab, setCurrentTab] = useState<'HOME' | 'STAFF' | 'STAFF_DETAILS' | 'PENDING'>('HOME');

  // Form states for Allocating Cash
  const [allocSupId, setAllocSupId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocNotes, setAllocNotes] = useState('');
  const [allocPaymentMethod, setAllocPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [allocBankName, setAllocBankName] = useState('');
  const [bankList, setBankList] = useState(['HDFC']);
  const [showNewBankForm, setShowNewBankForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  // Form states for Transferring Cash
  const [transferSenderId, setTransferSenderId] = useState('');
  const [transferReceiverId, setTransferReceiverId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Form states for Adding Supervisor
  const [newSupName, setNewSupName] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupPassword, setNewSupPassword] = useState('');
  const [newSupDesig, setNewSupDesig] = useState('');
  const [addSupPhone, setAddSupPhone] = useState('');
  const [addSupSpendLimit, setAddSupSpendLimit] = useState('');

  // Editing staff
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesig, setEditDesig] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpendLimit, setEditSpendLimit] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [staffDetailsDate, setStaffDetailsDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const openEditStaff = (staff: User) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditDesig(staff.designation || '');
    setEditPhone(staff.phone || '');
    setEditSpendLimit(staff.spendLimit?.toString() || '');
  };

  const handleEditSave = () => {
    if (!editingStaff) return;
    setIsSavingEdit(true);
    // Simulate network delay
    setTimeout(() => {
      onEditStaff(editingStaff.id, editName, editDesig, editPhone, Number(editSpendLimit) || 0);
      setIsSavingEdit(false);
      setEditingStaff(null);
    }, 600);
  };

  // Compute stats
  const masterTreasury = 0; // Dynamic treasury to be implemented later
  const totalAllocated = balances.reduce((sum, b) => sum + b.allocatedCash, 0);
  const totalSpent = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPending = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingTreasury = masterTreasury;
  const supervisorRemaining = balances.reduce((sum, b) => sum + b.remainingCash, 0);
  const liveTotalLiquidValue = remainingTreasury + supervisorRemaining;

  // Filter pending approvals
  const ownerPendingTransactions = transactions.filter((t) => 
    (
      (t.status === 'PENDING' && t.category !== 'Allocation' && t.category !== 'STAFF_TRANSFER') ||
      (t.status === 'NEEDS_CORRECTION' && t.category === 'Allocation')
    )
  );
  const staffTransferPending = transactions.filter((t) => t.status === 'PENDING' && t.category === 'STAFF_TRANSFER');

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocSupId || !allocAmount || Number(allocAmount) <= 0) return;

    const payload = JSON.stringify({
      note: allocNotes || 'Owner allocation',
      paymentMethod: allocPaymentMethod,
      bankName: allocPaymentMethod === 'ONLINE' ? allocBankName : ''
    });

    onAllocateCash(allocSupId, Number(allocAmount), payload);
    setAllocSupId('');
    setAllocAmount('');
    setAllocNotes('');
    setAllocPaymentMethod('CASH');
    setAllocBankName('');
    setShowAllocateModal(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSenderId || !transferReceiverId || transferSenderId === transferReceiverId || !transferAmount || Number(transferAmount) <= 0) return;
    if (onCreateTransfer) {
      onCreateTransfer(transferSenderId, transferReceiverId, Number(transferAmount));
    }
    setShowTransferModal(false);
    setTransferSenderId('');
    setTransferReceiverId('');
    setTransferAmount('');
  };

  const handleAddSupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName || !newSupEmail || !newSupDesig || !newSupPassword) return;
    onAddSupervisor(newSupName, newSupEmail, newSupPassword, newSupDesig, addSupPhone, Number(addSupSpendLimit) || 0);
    setShowAddSupModal(false);
    setNewSupName('');
    setNewSupEmail('');
    setNewSupPassword('');
    setNewSupDesig('');
    setAddSupPhone('');
    setAddSupSpendLimit('');
  };

  // Mock data for weekly chart
  const weeklyFlowData = [
    { label: 'Mon', income: 5000, expense: 1200 },
    { label: 'Tue', income: 0, expense: 2500 },
    { label: 'Wed', income: 3000, expense: 800 },
    { label: 'Thu', income: 0, expense: 1500 },
    { label: 'Fri', income: 10000, expense: 4100 },
    { label: 'Sat', income: 0, expense: 600 },
    { label: 'Sun', income: 2000, expense: 930 }
  ];

  // SVG dimensions for chart
  const chartHeight = 80;
  const chartWidth = 320;
  const maxVal = 12000;

  return (
    <div className="flex-1 overflow-hidden p-3 flex flex-col relative h-full">
      {/* ══ HOME TAB ══ */}
      {currentTab === 'HOME' && (
        <div className="flex-1 flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Welcome Card & Real-time Balance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setCurrentTab('STAFF_DETAILS')}
        className="rounded-[20px] bg-gradient-to-r from-brand-blue to-brand-teal text-white p-4 shadow-xl shadow-brand-blue/20 relative overflow-hidden cursor-pointer shrink-0"
      >
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-4 -mb-4" />

        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-[10px] font-bold tracking-wide uppercase text-blue-100 font-sans">Total Business Money Available</h3>
            <h2 className="text-2xl font-display font-bold tracking-tight mt-0.5">
              Rs. {liveTotalLiquidValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <Wallet className="w-4 h-4 text-teal-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/15 pt-2 mt-2">
          <div>
            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">Safe Box (Main Fund)</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              Rs. {remainingTreasury.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">Money with Staff</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              Rs. {supervisorRemaining.toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Corporate Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        {/* Supervisors Card */}
        <div 
          onClick={() => setCurrentTab('STAFF')}
          className={`p-3 rounded-[16px] border shadow-sm transition-all-300 flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">Staff</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-bold font-display">{supervisors.length}</div>
            <span className="text-[9px] text-slate-400 font-medium">On duty</span>
          </div>
        </div>

        {/* Pending Approval Card */}
        <div 
          onClick={() => setCurrentTab('PENDING')}
          className={`p-3 rounded-[16px] border shadow-sm transition-all-300 flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">Pending</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-bold font-display text-amber-500">
              Rs. {totalPending >= 1000 ? (totalPending / 1000).toFixed(1) + 'k' : totalPending}
            </div>
            <span className="text-[9px] text-slate-400 font-medium">To approve</span>
          </div>
        </div>

        {/* Expenses Card (Full Width) */}
        <div className={`col-span-2 p-3 rounded-[16px] border shadow-sm transition-all-300 flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-slate-400">Total Spent</span>
            </div>
            <div className="text-xl font-bold font-display text-red-500">Rs. {totalSpent.toLocaleString()}</div>
            <span className="text-[9px] text-slate-400 font-medium">Approved purchases</span>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>



      {/* Quick Action Hub */}
      <div className="space-y-2 shrink-0">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">What do you want to do?</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all-300 shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>Send Money</span>
          </button>
          <button
            onClick={() => setShowAddSupModal(true)}
            className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border-2 font-bold text-xs transition-all-300 active:scale-95 cursor-pointer ${darkMode
              ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'
              }`}
          >
            <Plus className="w-4 h-4 text-teal-500" />
            <span>New Staff</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className={`col-span-2 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border-2 font-bold text-xs transition-all-300 active:scale-95 cursor-pointer ${darkMode
              ? 'bg-blue-900/20 border-blue-800 hover:bg-blue-900/40 text-blue-400'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600'
              }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Staff to Staff Transfer</span>
          </button>
        </div>
      </div>
        </div>
      )}

      {/* ══ PENDING REVIEWS TAB ══ */}
      {currentTab === 'PENDING' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <button onClick={() => setCurrentTab('HOME')} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h3 className="text-lg font-bold font-display">Pending Approvals</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
      {ownerPendingTransactions.length > 0 && (
        <div id="pending-approvals-section" className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Needs Your Approval</h4>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
              {ownerPendingTransactions.length} TO REVIEW
            </span>
          </div>

          <div className="space-y-2.5">
            {ownerPendingTransactions.map((tx) => (
              <motion.div
                key={tx.id}
                layoutId={tx.id}
                className={`p-3.5 rounded-2xl border transition-all-300 flex flex-col gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : tx.type === 'RETURN' ? 'bg-purple-500/10 text-purple-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {tx.type === 'INCOME' ? '+' : tx.type === 'RETURN' ? 'R' : tx.category[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx.type === 'RETURN' ? 'Cash Return' : tx.category === 'CASH_REQUEST' ? 'Cash Request' : tx.type === 'INCOME' ? 'Received Cash' : tx.category}</div>
                      <div className="text-sm font-bold mt-0.5 line-clamp-1">
                        {(() => {
                          if (tx.category === 'Allocation') {
                            try {
                              const d = JSON.parse(tx.description);
                              return (
                                <span>
                                  {d.note} <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded ml-1">{d.paymentMethod === 'ONLINE' ? `Online: ${d.bankName}` : 'Cash'}</span>
                                </span>
                              );
                            } catch {
                              return tx.description;
                            }
                          }
                          return tx.description;
                        })()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">By {tx.supervisorName} • {tx.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'RETURN' ? 'text-purple-500' : 'text-red-500'}`}>
                      {tx.type === 'INCOME' || tx.type === 'RETURN' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                    </div>
                    {tx.receiptUrl && (
                      <button
                        onClick={() => onViewTransactionDetails(tx)}
                        className="text-[10px] text-blue-500 font-semibold hover:underline mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Receipt</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit Action Buttons */}
                {tx.status === 'NEEDS_CORRECTION' && tx.category === 'Allocation' ? (
                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-0.5 space-y-2">
                    <div className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/10 p-2 rounded-lg">
                      Staff Note: {tx.mistakeNote}
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="New Amount"
                        id={`edit-alloc-${tx.id}`}
                        defaultValue={tx.amount}
                        className={`flex-1 p-2 text-xs rounded-xl border outline-none ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`edit-alloc-${tx.id}`) as HTMLInputElement;
                          const newAmount = Number(input.value);
                          if (newAmount > 0 && onEditAllocation) {
                            onEditAllocation(tx.id, newAmount);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-0.5">
                    <button
                      onClick={() => onReviewTransaction(tx.id, 'APPROVED')}
                      className={`flex-1 py-1.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-transform cursor-pointer ${tx.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : tx.type === 'RETURN' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{tx.category === 'CASH_REQUEST' ? 'Approve Request' : tx.type === 'INCOME' ? 'Approve Collection' : tx.type === 'RETURN' ? 'Accept Return' : 'Approve Purchase'}</span>
                    </button>
                    <button
                      onClick={() => onReviewTransaction(tx.id, 'REJECTED')}
                      className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-transform cursor-pointer ${darkMode
                        ? 'border-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-400'
                        : 'border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500'
                        }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline / Reject</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Staff to Staff Pending Transfers info */}
      {staffTransferPending.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending Staff Transfers</h4>
          <div className="space-y-2.5">
            {staffTransferPending.map((tx) => {
              let state: any = {};
              try { state = JSON.parse(tx.description); } catch {}
              
              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-2xl border transition-all-300 flex flex-col gap-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-blue-50/50 border-blue-100'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Staff Transfer</div>
                        <div className="text-[10px] text-slate-500">From {tx.supervisorName} to {state.receiverName || 'another staff'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                        Rs. {tx.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-blue-500 text-center uppercase tracking-wide py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl mt-1">
                    Waiting for staff approvals
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
          </div>
        </div>
      )}

      {/* ══ STAFF TAB ══ */}
      {currentTab === 'STAFF' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <button onClick={() => setCurrentTab('HOME')} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h3 className="text-lg font-bold font-display">Staff Members</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-20">
      {/* Supervisors Budget Tracker */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Staff Spending Limits</h4>
        <div className="space-y-2.5">
          {balances.map((b) => {
            const usagePercent = Math.min((b.spentCash / b.allocatedCash) * 100, 100);
            const isCritical = usagePercent > 80;

            return (
              <div
                key={b.supervisorId}
                className={`p-3.5 rounded-2xl border transition-all-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{b.supervisorName}</span>
                  </div>
                  <span className="text-xs font-bold font-mono">
                    Rs. {b.remainingCash.toLocaleString()} <span className="text-slate-400 font-normal text-[10px]">left of overall Rs. {b.allocatedCash.toLocaleString()}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${usagePercent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${isCritical
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : usagePercent > 50
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-r from-teal-500 to-blue-500'
                      }`}
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400 font-semibold">
                  <span>Spent: Rs. {b.spentCash.toLocaleString()} ({Math.round(usagePercent)}%)</span>
                  <button
                    onClick={() => {
                      setAllocSupId(b.supervisorId);
                      setShowAllocateModal(true);
                    }}
                    className="text-blue-500 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>Send Money</span>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ ALL STAFF DETAILS TAB ══ */}
          </div>
        </div>
      )}

      {currentTab === 'STAFF_DETAILS' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <button onClick={() => setCurrentTab('HOME')} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h3 className="text-lg font-bold font-display">All Staff Details</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-20">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filters & Staff</h4>
              <div className="flex items-center gap-2">
            <input
              type="date"
              value={staffDetailsDate}
              onChange={(e) => setStaffDetailsDate(e.target.value)}
              className={`p-1.5 text-[10px] font-bold rounded-lg border outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
            />
            {staffDetailsDate && (
              <button
                onClick={() => setStaffDetailsDate('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                Clear
              </button>
            )}
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
              }`}>{supervisors.length} members</span>
          </div>
        </div>

        {supervisors.length === 0 ? (
          <div className={`p-5 rounded-2xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No staff registered yet.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Use "Register a New Staff" to add your team.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {supervisors.map((s) => {
              const bal = balances.find((b) => b.supervisorId === s.id);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onViewStaffAudit && onViewStaffAudit(s.id)}
                  className={`p-4 rounded-2xl border transition-all-300 cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`}
                        alt={s.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-teal-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide truncate">{s.designation || 'Staff'} {s.spendLimit ? `| Limit: Rs.${s.spendLimit}` : ''}</div>
                      </div>
                    </div>
                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditStaff(s);
                      }}
                      className="p-2 rounded-xl bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors shrink-0 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Details Row */}
                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Balance Details (Columnar / Tabular Layout) */}
                  {bal && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2.5">
                      {staffDetailsDate && (
                        <div className="flex justify-between items-center">
                          <div className="text-[11px] font-bold text-slate-400 uppercase">Opening</div>
                          <div className="text-xs font-bold font-mono text-slate-500">
                            Rs. {(
                              transactions.filter(t => t.supervisorId === s.id && t.date < staffDetailsDate && t.type === 'INCOME' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) -
                              transactions.filter(t => t.supervisorId === s.id && t.date < staffDetailsDate && t.type === 'EXPENSE' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) -
                              transactions.filter(t => t.supervisorId === s.id && t.date < staffDetailsDate && t.type === 'RETURN' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Given</div>
                        <div className="text-xs font-bold font-mono text-blue-500">
                          Rs. {(staffDetailsDate
                            ? transactions.filter(t => t.supervisorId === s.id && t.date === staffDetailsDate && t.type === 'INCOME' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                            : bal.allocatedCash + transactions.filter(t => t.supervisorId === s.id && t.type === 'RETURN' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                          ).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Spent</div>
                        <div className="text-xs font-bold font-mono text-red-500">
                          Rs. {(staffDetailsDate
                            ? transactions.filter(t => t.supervisorId === s.id && t.date === staffDetailsDate && t.type === 'EXPENSE' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                            : bal.spentCash
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Returned</div>
                        <div className="text-xs font-bold font-mono text-purple-500">
                          Rs. {(staffDetailsDate
                            ? transactions.filter(t => t.supervisorId === s.id && t.date === staffDetailsDate && t.type === 'RETURN' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                            : transactions.filter(t => t.supervisorId === s.id && t.type === 'RETURN' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                          {staffDetailsDate ? 'Cur. Left' : 'Left'}
                        </div>
                        <div className="text-sm font-bold font-mono text-teal-500">
                          Rs. {
                            staffDetailsDate ? (
                              (
                                transactions.filter(t => t.supervisorId === s.id && t.date < staffDetailsDate && t.type === 'INCOME' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) -
                                transactions.filter(t => t.supervisorId === s.id && t.date < staffDetailsDate && t.type === 'EXPENSE' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) -
                                transactions.filter(t => t.supervisorId === s.id && t.date < staffDetailsDate && t.type === 'RETURN' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                              ) +
                              transactions.filter(t => t.supervisorId === s.id && t.date === staffDetailsDate && t.type === 'INCOME' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) -
                              transactions.filter(t => t.supervisorId === s.id && t.date === staffDetailsDate && t.type === 'EXPENSE' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) -
                              transactions.filter(t => t.supervisorId === s.id && t.date === staffDetailsDate && t.type === 'RETURN' && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0)
                            ).toLocaleString() :
                            bal.remainingCash.toLocaleString()
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
        </div>
      )}

      {/* ══ EDIT STAFF MODAL ══ */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
          >
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <img
                src={editingStaff.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingStaff.name)}&background=random`}
                alt={editingStaff.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-teal-500"
              />
              <div>
                <h3 className="text-base font-bold font-display">Edit Staff Info</h3>
                <p className="text-xs text-slate-400">{editingStaff.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full p-2.5 text-sm rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'
                    }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Job Title</label>
                <input
                  type="text"
                  value={editDesig}
                  onChange={(e) => setEditDesig(e.target.value)}
                  className={`w-full p-2.5 text-sm rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'
                    }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={`w-full p-2.5 text-sm rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'
                    }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={handleEditSave}
                disabled={isSavingEdit}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
              
              {onRemoveStaff && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove this staff member? Their past transactions will be kept.')) {
                      onRemoveStaff(editingStaff.id);
                      setEditingStaff(null);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Staff
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ALLOCATE CASH MODAL DIALOG */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
          >
            <button
              onClick={() => setShowAllocateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display mb-1">Send Money to a Staff</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Send money directly from your main vault to a staff's pocket fund.</p>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select a Staff</label>
                <select
                  value={allocSupId}
                  onChange={(e) => setAllocSupId(e.target.value)}
                  className={`w-full p-2.5 text-xs font-bold rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  required
                >
                  <option value="">-- Click to select a person --</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">How much money? (Rs. Rupees)</label>
                <div className="relative">
                  <div className="absolute left-3 top-2 text-slate-400 font-mono text-sm">Rs.</div>
                  <input
                    type="number"
                    placeholder="1500"
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(e.target.value)}
                    className={`w-full py-2 pl-10 pr-3 text-sm rounded-xl border outline-none font-semibold ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Write a short note for why you are sending this</label>
                <input
                  type="text"
                  placeholder="For example: Weekly spending money"
                  value={allocNotes}
                  onChange={(e) => setAllocNotes(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocPaymentMethod('CASH')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors border ${allocPaymentMethod === 'CASH' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : (darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocPaymentMethod('ONLINE')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors border ${allocPaymentMethod === 'ONLINE' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : (darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}
                  >
                    Online Payment
                  </button>
                </div>
              </div>

              {allocPaymentMethod === 'ONLINE' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Bank Name</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {bankList.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => { setAllocBankName(bank); setShowNewBankForm(false); }}
                        className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${allocBankName === bank ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : (darkMode ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                      >
                        {bank}
                      </button>
                    ))}
                    {!showNewBankForm ? (
                      <button
                        type="button"
                        onClick={() => setShowNewBankForm(true)}
                        className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-bold transition-colors border border-dashed flex items-center justify-center gap-1 cursor-pointer ${darkMode ? 'border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="flex-1 min-w-[120px] flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl px-2 py-1 border border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          placeholder="Bank name..."
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="bg-transparent text-xs font-bold px-1 py-1 outline-none w-full text-slate-800 dark:text-white"
                          maxLength={20}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = newBankName.trim();
                              if (trimmed) {
                                if (!bankList.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
                                  setBankList([...bankList, trimmed]);
                                }
                                setAllocBankName(trimmed);
                                setNewBankName('');
                                setShowNewBankForm(false);
                              }
                            } else if (e.key === 'Escape') {
                              setShowNewBankForm(false);
                              setNewBankName('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newBankName.trim();
                            if (trimmed) {
                              if (!bankList.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
                                setBankList([...bankList, trimmed]);
                              }
                              setAllocBankName(trimmed);
                              setNewBankName('');
                              setShowNewBankForm(false);
                            }
                          }}
                          className="p-1 rounded-md bg-blue-500 text-white cursor-pointer hover:bg-blue-600 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewBankForm(false);
                            setNewBankName('');
                          }}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 cursor-pointer hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-500/25 mt-2 cursor-pointer"
              >
                Send Money Now
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADD SUPERVISOR MODAL DIALOG */}
      {showAddSupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
          >
            <button
              onClick={() => setShowAddSupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display mb-1">Register a New Staff</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Enter their details below to set up an account.</p>

            <form onSubmit={handleAddSupSubmit} className="space-y-4.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">First and Last Name</label>
                <input
                  type="text"
                  placeholder="Robert Carter"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className={`w-full p-2 text-xs font-bold rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Email Address</label>
                <input
                  type="email"
                  placeholder="robert.carter@buildcorp.com"
                  value={newSupEmail}
                  onChange={(e) => setNewSupEmail(e.target.value)}
                  className={`w-full p-2 text-xs font-bold rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Account Password</label>
                <input
                  type="text"
                  placeholder="Secret password for staff"
                  value={newSupPassword}
                  onChange={(e) => setNewSupPassword(e.target.value)}
                  className={`w-full p-2 text-xs font-bold rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Job Title / Role</label>
                <input
                  type="text"
                  placeholder="Warehouse Inventory Lead"
                  value={newSupDesig}
                  onChange={(e) => setNewSupDesig(e.target.value)}
                  className={`w-full p-2 text-xs font-bold rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={addSupPhone}
                    onChange={(e) => setAddSupPhone(e.target.value)}
                    className={`w-full p-2 text-xs font-bold rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-lg shadow-teal-500/25 mt-2 cursor-pointer"
              >
                Create Account
              </button>
            </form>
          </motion.div>
        </div>
      )}
    {/* Staff to Staff Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden ${
              darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
            }`}
          >
            <div className={`p-5 flex items-center justify-between border-b ${
              darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Staff to Staff Transfer</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5 ml-1">From Staff (Sender)</label>
                <select
                  value={transferSenderId}
                  onChange={(e) => setTransferSenderId(e.target.value)}
                  className={`w-full p-3 rounded-2xl text-sm font-bold border outline-none transition-colors ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  required
                >
                  <option value="">Select sender...</option>
                  {supervisors.map(s => {
                    const bal = balances.find(b => b.supervisorId === s.id)?.remainingCash || 0;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} - Bal: Rs. {bal.toLocaleString()}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5 ml-1">To Staff (Receiver)</label>
                <select
                  value={transferReceiverId}
                  onChange={(e) => setTransferReceiverId(e.target.value)}
                  className={`w-full p-3 rounded-2xl text-sm font-bold border outline-none transition-colors ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  required
                >
                  <option value="">Select receiver...</option>
                  {supervisors.map(s => {
                    const bal = balances.find(b => b.supervisorId === s.id)?.remainingCash || 0;
                    return (
                      <option key={s.id} value={s.id} disabled={s.id === transferSenderId}>
                        {s.name} - Bal: Rs. {bal.toLocaleString()}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5 ml-1">Amount (Rs.)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className={`w-full p-3 rounded-2xl text-sm font-bold border outline-none transition-colors ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="any"
                />
              </div>

              <button
                type="submit"
                disabled={!transferSenderId || !transferReceiverId || transferSenderId === transferReceiverId || !transferAmount}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all-300 disabled:opacity-50 disabled:active:scale-100"
              >
                <Check className="w-4 h-4" /> Request Transfer
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
