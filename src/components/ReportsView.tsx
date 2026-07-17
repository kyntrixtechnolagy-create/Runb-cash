/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  User,
  Tags,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { Transaction, UserRole, User as SupervisorType } from '../types';

interface ReportsViewProps {
  transactions: Transaction[];
  supervisors: SupervisorType[];
  userRole: UserRole;
  activeUser: SupervisorType;
  darkMode: boolean;
  onMarkMistake?: (txId: string, note: string) => void;
  onApproveDaily?: (supervisorId: string, date: string) => void;
  initialSupFilter?: string;
  initialReportType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DATE_RANGE' | 'SUPERVISOR';
  onChartClick?: (filterType: 'CATEGORY' | 'STAFF' | 'SITE' | 'SUPPLIER', name: string, startDate?: string, endDate?: string) => void;
  categories: {name: string, icon: string, color: string}[];
}

export default function ReportsView({
  transactions,
  supervisors,
  userRole,
  activeUser,
  darkMode,
  onMarkMistake,
  onApproveDaily,
  initialSupFilter,
  initialReportType,
  onChartClick,
  categories
}: ReportsViewProps) {
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DATE_RANGE' | 'SUPERVISOR'>(initialReportType || 'DAILY');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [supervisorStartDate, setSupervisorStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });
  const [supervisorEndDate, setSupervisorEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupFilter, setSelectedSupFilter] = useState(initialSupFilter || 'ALL');

  const [showMistakeForm, setShowMistakeForm] = useState(false);
  const [mistakeTxId, setMistakeTxId] = useState('');
  const [mistakeNote, setMistakeNote] = useState('');

  const isOwner = userRole === 'OWNER' || userRole === 'AUDITOR';

  // Filter transactions based on report filters & user permissions
  const reportTransactions = transactions.filter((t) => {
    // 1. Enforce Role Isolation
    const matchPermission = isOwner || t.supervisorId === activeUser.id;

    // 2. Date Filter
    let matchDateRange = true;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (reportType === 'DATE_RANGE') {
      matchDateRange = t.date >= startDate && t.date <= endDate;
    } else if (reportType === 'DAILY') {
      matchDateRange = t.date === todayStr;
    } else if (reportType === 'WEEKLY') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];
      matchDateRange = t.date >= lastWeekStr && t.date <= todayStr;
    } else if (reportType === 'MONTHLY') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = firstDay.toISOString().split('T')[0];
      matchDateRange = t.date >= firstDayStr && t.date <= todayStr;
    } else if (reportType === 'SUPERVISOR') {
      matchDateRange = t.date >= supervisorStartDate && t.date <= supervisorEndDate;
    }

    // 3. Supervisor Selector
    let matchSup = true;
    if (isOwner && reportType === 'SUPERVISOR') {
      matchSup = selectedSupFilter === 'ALL' || t.supervisorId === selectedSupFilter;
    }

    return matchPermission && matchDateRange && matchSup;
  });

  const getComputedDateBounds = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (reportType === 'DATE_RANGE') return { start: startDate, end: endDate };
    if (reportType === 'DAILY') return { start: todayStr, end: todayStr };
    if (reportType === 'WEEKLY') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      return { start: lastWeek.toISOString().split('T')[0], end: todayStr };
    }
    if (reportType === 'MONTHLY') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }
    if (reportType === 'SUPERVISOR') return { start: supervisorStartDate, end: supervisorEndDate };
    return { start: undefined, end: undefined };
  };

  // Calculate Metrics
  const expenses = reportTransactions.filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED');
  const allocations = reportTransactions.filter((t) => t.type === 'INCOME');

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const averageTicket = expenses.length > 0 ? Math.round(totalSpent / expenses.length) : 0;

  // Group Expenses by Category for Charts
  const categoryChartData = categories.map((cat) => {
    const amt = reportTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED' && t.category.toLowerCase() === cat.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat.name, amount: amt, color: cat.color };
  }).filter((c) => c.amount > 0);

  // Group Expenses by Staff (Supervisor) for Charts
  const staffChartData = supervisors.map((sup) => {
    const amt = reportTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED' && t.supervisorId === sup.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: sup.name, amount: amt };
  }).filter((s) => s.amount > 0);

  // Group Expenses by Site for Charts
  const siteChartMap: Record<string, number> = {};
  reportTransactions.forEach((t) => {
    if (t.type === 'EXPENSE' && t.status === 'APPROVED') {
      let site = 'Other';
      const bracketMatch = t.description.match(/^\[(.*?)\]\s*(.*)$/);
      if (bracketMatch) {
        site = bracketMatch[1];
      } else {
        const spentMatch = t.description.match(/Spent on .* at (.*)$/);
        if (spentMatch) {
          site = spentMatch[1];
        }
      }
      siteChartMap[site] = (siteChartMap[site] || 0) + t.amount;
    }
  });
  const actualSiteChartData = Object.entries(siteChartMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Group Expenses by Supplier for Charts
  const supplierChartMap: Record<string, number> = {};
  reportTransactions.forEach((t) => {
    if (t.type === 'EXPENSE' && t.status === 'APPROVED') {
      let supplier = 'Other';
      if (t.supplier) {
        supplier = t.supplier;
      } else {
        const bracketMatch = t.description.match(/^\[.*?\]\s*\{(.*?)\}/);
        if (bracketMatch) {
          supplier = bracketMatch[1];
        } else {
          const spentMatch = t.description.match(/from (.*)$/);
          if (spentMatch) {
            supplier = spentMatch[1];
          }
        }
      }
      supplierChartMap[supplier] = (supplierChartMap[supplier] || 0) + t.amount;
    }
  });
  const actualSupplierChartData = Object.entries(supplierChartMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Group Expenses by Supervisor (Owner Only)
  const supervisorChartData = supervisors.map((sup) => {
    const amt = transactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED' && t.supervisorId === sup.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: sup.name, amount: amt, designation: sup.designation };
  });

  const maxSupervisorSpend = Math.max(...supervisorChartData.map((s) => s.amount), 1);

  // CSV/Excel Exporter
  const handleExportCSV = () => {
    // Build CSV Headers
    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Staff Name', 'Amount ($)', 'Audit Status', 'Justification'];

    // Build Rows
    const rows = reportTransactions.map((t) => [
      t.id,
      t.date,
      t.type,
      t.category,
      t.supervisorName,
      t.amount,
      t.status,
      `"${t.description.replace(/"/g, '""')}"` // Escape quote chars in description
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PettyCash_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateLedgerRow = (t: any) => {
    let voucher = '';
    let nature = '';
    let narration = t.description;
    let site = '-';
    let vendor = t.supplier || '-';
    let debit = '';
    let credit = '';

    if (t.category === 'Allocation') {
      voucher = 'Contra';
      nature = 'Inter company transfer - owner to Staff';
      debit = `${t.supervisorName} Cash`;
      try {
        const d = JSON.parse(t.description);
        narration = d.note || 'Allocation';
        credit = d.paymentMethod === 'ONLINE' ? d.bankName : 'Owner Cash';
      } catch {
        credit = 'Owner Cash';
      }
    } else if (t.category === 'STAFF_TRANSFER') {
      voucher = 'Contra';
      nature = 'Inter company transfer - Staff to Staff';
      try {
        const state = JSON.parse(t.description);
        narration = state.note || 'Transfer';
        if (t.type === 'INCOME') {
          debit = `${t.supervisorName} Cash`;
          credit = `${state.senderName} Cash`;
        } else {
          debit = `${state.receiverName} Cash`;
          credit = `${t.supervisorName} Cash`;
        }
      } catch {
        debit = 'Receiver Cash';
        credit = 'Sender Cash';
      }
    } else if (t.type === 'RETURN') {
      voucher = 'Contra';
      nature = 'Inter company transfer - Staff to owner';
      debit = 'Owner Cash/Bank';
      credit = `${t.supervisorName} Cash`;
    } else if (t.type === 'EXPENSE') {
      voucher = 'Payment';
      nature = 'Expense claim by Staff';
      debit = t.category;
      credit = `${t.supervisorName} Cash`;

      // Extract site and supplier name from description if present
      const bracketMatch = t.description.match(/^\[(.*?)\](?:\s*\{(.*?)\})?\s*(.*)$/);
      if (bracketMatch) {
        site = bracketMatch[1];
        if (bracketMatch[2]) vendor = bracketMatch[2];
        narration = bracketMatch[3] || bracketMatch[2]; // fallback narration
      } else {
        const spentMatch = t.description.match(/Spent on .* at (.*?)(?: from (.*))?$/);
        if (spentMatch) {
          site = spentMatch[1].trim();
          if (spentMatch[2]) vendor = spentMatch[2].trim();
        }
      }
    } else if (t.type === 'INCOME') {
      voucher = 'Receipt';
      nature = 'Receipt from person outside the entity';
      debit = `${t.supervisorName} Cash`;
      credit = t.category || 'External Source';
    }

    const formattedDate = t.date.split('-').reverse().join('/');

    return [
      formattedDate,
      voucher,
      nature,
      narration,
      site,
      vendor,
      debit,
      credit,
      t.amount,
      t.status,
      t.id
    ];
  };

  const ledgerHeaders = [
    'Date',
    'Voucher',
    'Nature of Transaction',
    'Narration',
    'Site',
    'Vendor',
    'Debit Ledger',
    'Credit Ledger',
    'Amount',
    'Approval Status',
    'Transaction ID'
  ];

  // Real Excel Exporter
  const handleExportExcel = () => {
    const rows = reportTransactions.map(generateLedgerRow);
    const totalBalance = totalAllocated - totalSpent;
    rows.push(['', '', '', '', 'TOTAL BALANCE:', '', '', '', totalBalance, '', '']);

    const worksheet = XLSX.utils.aoa_to_sheet([ledgerHeaders, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `PettyCash_Report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF Exporter
  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`PettyCash Report - ${reportType}`, 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);

    const rows = reportTransactions.map(generateLedgerRow);
    const totalBalance = totalAllocated - totalSpent;
    rows.push(['', '', '', '', 'TOTAL BALANCE:', '', '', '', totalBalance, '', '']);

    autoTable(doc, {
      startY: 35,
      head: [ledgerHeaders],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110] }, // teal-700
      styles: { fontSize: 8 },
      didParseCell: function (cellData: any) {
        if (cellData.section === 'body') {
          const rowData = cellData.row.raw;
          // Red text for Expenses
          if (rowData[2] === 'EXPENSE' && cellData.column.index === 6) {
            cellData.cell.styles.textColor = [220, 38, 38];
          }
          // Bold style for Total Balance row
          if (rowData[4] === 'TOTAL BALANCE:') {
            cellData.cell.styles.fontStyle = 'bold';
            if (cellData.column.index === 6) {
              cellData.cell.styles.textColor = totalBalance >= 0 ? [16, 185, 129] : [220, 38, 38];
            }
          }
        }
      }
    });

    doc.save(`PettyCash_Report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24 p-4 space-y-5">
      {/* Report Segment Filter Tab Bar */}
      <div className={`p-1.5 rounded-2xl border transition-all-300 flex overflow-x-auto no-scrollbar ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
        <button
          onClick={() => setReportType('DAILY')}
          className={`flex-1 min-w-[70px] py-2 text-center text-[11px] font-bold rounded-xl transition-all duration-300 ${reportType === 'DAILY'
            ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow'
            : 'text-slate-400 hover:text-slate-500'
            }`}
        >
          Daily
        </button>
        <button
          onClick={() => setReportType('WEEKLY')}
          className={`flex-1 min-w-[70px] py-2 text-center text-[11px] font-bold rounded-xl transition-all duration-300 ${reportType === 'WEEKLY'
            ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow'
            : 'text-slate-400 hover:text-slate-500'
            }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setReportType('MONTHLY')}
          className={`flex-1 min-w-[70px] py-2 text-center text-[11px] font-bold rounded-xl transition-all duration-300 ${reportType === 'MONTHLY'
            ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow'
            : 'text-slate-400 hover:text-slate-500'
            }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setReportType('DATE_RANGE')}
          className={`flex-1 min-w-[70px] py-2 text-center text-[11px] font-bold rounded-xl transition-all duration-300 ${reportType === 'DATE_RANGE'
            ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow'
            : 'text-slate-400 hover:text-slate-500'
            }`}
        >
          Range
        </button>
        {isOwner && (
          <button
            onClick={() => setReportType('SUPERVISOR')}
            className={`flex-1 min-w-[80px] py-2 text-center text-[11px] font-bold rounded-xl transition-all duration-300 ${reportType === 'SUPERVISOR'
              ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow'
              : 'text-slate-400 hover:text-slate-500'
              }`}
          >
            Staff Audits
          </button>
        )}
      </div>

      {/* Dynamic Filter Controls Card */}
      <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
        <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase">REPORT FILTERS</h3>

        {reportType === 'DAILY' && (
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 p-3 rounded-2xl border border-blue-500/10 text-xs">
            <Calendar className="w-4.5 h-4.5 text-blue-500" />
            <span>Analyzing today's ledger logs ({new Date().toISOString().split('T')[0].split('-').reverse().join('/')})</span>
          </div>
        )}

        {reportType === 'WEEKLY' && (
          <div className="flex items-center gap-2 bg-purple-500/10 text-purple-500 p-3 rounded-2xl border border-purple-500/10 text-xs">
            <Calendar className="w-4.5 h-4.5 text-purple-500" />
            <span>Analyzing last 7 days of ledger logs</span>
          </div>
        )}

        {reportType === 'MONTHLY' && (
          <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-500 p-3 rounded-2xl border border-indigo-500/10 text-xs">
            <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            <span>Analyzing current month's ledger logs</span>
          </div>
        )}

        {reportType === 'DATE_RANGE' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-wider">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full p-2 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-wider">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full p-2 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
              />
            </div>
          </div>
        )}

        {isOwner && reportType === 'SUPERVISOR' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-wider">Select Supervisor Ledger</span>
              <select
                value={selectedSupFilter}
                onChange={(e) => setSelectedSupFilter(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <option value="ALL">All Supervisors comparative view</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-wider">Start Date</span>
                <input
                  type="date"
                  value={supervisorStartDate}
                  onChange={(e) => setSupervisorStartDate(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-wider">End Date</span>
                <input
                  type="date"
                  value={supervisorEndDate}
                  onChange={(e) => setSupervisorEndDate(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Export Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleExportCSV}
            disabled={reportTransactions.length === 0}
            className="w-full h-11 rounded-xl bg-slate-800 dark:bg-slate-700 font-bold text-xs text-white hover:opacity-95 focus:outline-none flex flex-col items-center justify-center gap-1 shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={reportTransactions.length === 0}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-bold text-xs text-white hover:opacity-95 focus:outline-none flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/15 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            <span>EXCEL</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={reportTransactions.length === 0}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 font-bold text-xs text-white hover:opacity-95 focus:outline-none flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-500/15 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border transition-all-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Filtered Expenditures</span>
          <div className="text-xl font-bold font-mono text-red-500 mt-1">Rs. {totalSpent.toLocaleString()}</div>
          <span className="text-[9px] text-slate-400 mt-1 block">Approved cash outflows</span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Average Ticket</span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">Rs. {averageTicket.toLocaleString()}</div>
          <span className="text-[9px] text-slate-400 mt-1 block">Per recorded expense item</span>
        </div>
      </div>

      {/* Category Expenses Breakdown chart */}
      {categoryChartData.length > 0 && (
        <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Category Allocation Chart</h4>

          {/* Simple custom visual horizontal bar indicators */}
          <div className="space-y-3">
            {categoryChartData.map((cat, idx) => {
              const pct = Math.round((cat.amount / totalSpent) * 100);

              return (
                <div 
                  key={idx} 
                  className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    const bounds = getComputedDateBounds();
                    onChartClick?.('CATEGORY', cat.name, bounds.start, bounds.end);
                  }}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      Rs. {cat.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Allocation Chart */}
      {staffChartData.length > 0 && (
        <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Staff Allocation Chart</h4>

          <div className="space-y-3">
            {staffChartData.map((staff, idx) => {
              const pct = Math.round((staff.amount / totalSpent) * 100);

              return (
                <div 
                  key={idx} 
                  className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    const bounds = getComputedDateBounds();
                    onChartClick?.('STAFF', staff.name, bounds.start, bounds.end);
                  }}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>{staff.name}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      Rs. {staff.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Site Allocation Chart */}
      {actualSiteChartData.length > 0 && (
        <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Site Allocation Chart</h4>

          <div className="space-y-3">
            {actualSiteChartData.map((site, idx) => {
              const pct = Math.round((site.amount / totalSpent) * 100);

              return (
                <div 
                  key={idx} 
                  className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    const bounds = getComputedDateBounds();
                    onChartClick?.('SITE', site.name, bounds.start, bounds.end);
                  }}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{site.name}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      Rs. {site.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Allocation Chart */}
      {actualSupplierChartData.length > 0 && (
        <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Supplier Allocation Chart</h4>

          <div className="space-y-3">
            {actualSupplierChartData.map((supplier, idx) => {
              const pct = Math.round((supplier.amount / totalSpent) * 100);

              return (
                <div 
                  key={idx} 
                  className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    const bounds = getComputedDateBounds();
                    onChartClick?.('SUPPLIER', supplier.name, bounds.start, bounds.end);
                  }}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>{supplier.name}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      Rs. {supplier.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supervisor comparative chart (Owner view comparing budgets) */}
      {isOwner && reportType === 'SUPERVISOR' && selectedSupFilter === 'ALL' && (
        <div className={`p-4 rounded-3xl border transition-all-300 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Supervisor Cumulative Spend</h4>

          <div className="space-y-3">
            {supervisorChartData.map((s, idx) => {
              const pct = (s.amount / maxSupervisorSpend) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">{s.designation}</span>
                    </div>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                      ${s.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(pct, 2)}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-teal-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtered ledger list */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase">LOG SHEET ITEMS ({reportTransactions.length})</h4>

        {reportTransactions.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">No logs for this filter range.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reportTransactions.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${darkMode ? 'bg-slate-900/55 border-slate-800/60' : 'bg-white border-slate-100'
                  }`}
              >
                <div>
                  <div className="font-bold font-mono text-[10px] text-slate-400 flex items-center gap-1.5 uppercase">
                    <span>{t.category}</span>
                    <span className="text-slate-400">by {t.supervisorName}</span>
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                    {t.category === 'STAFF_TRANSFER' ? (() => {
                      try {
                        const state = JSON.parse(t.description);
                        return t.type === 'INCOME' ? `Received from ${t.supervisorName}` : `Transfer to ${state.receiverName}`;
                      } catch { return t.description; }
                    })() : t.category === 'Allocation' ? (() => {
                      try {
                        const d = JSON.parse(t.description);
                        if (isOwner) {
                          return (
                            <span>
                              {d.note} <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded ml-1 font-normal">{d.paymentMethod === 'ONLINE' ? `Online: ${d.bankName}` : 'Cash'}</span>
                            </span>
                          );
                        }
                        return d.note;
                      } catch { return t.description; }
                    })() : t.description}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{t.date.split('-').reverse().join('/')}</div>
                </div>
                <div className="text-right">
                  <span className={`font-bold font-mono text-xs block ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                    {t.type === 'INCOME' ? '+' : '-'}Rs. {t.amount}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve All / Mistake Workflow (Owner only, on specific staff, only for today) */}
      {isOwner && reportType === 'SUPERVISOR' && selectedSupFilter !== 'ALL' && supervisorStartDate === new Date().toISOString().split('T')[0] && supervisorEndDate === new Date().toISOString().split('T')[0] && (
        <div className="pt-4 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => setShowMistakeForm(!showMistakeForm)}
              className={`flex-1 h-12 rounded-xl font-bold text-xs ${showMistakeForm
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-500'
                } transition-all duration-300`}
            >
              {showMistakeForm ? 'Cancel Mistake' : 'Mistake'}
            </button>
            <button
              onClick={() => {
                if (onApproveDaily) onApproveDaily(selectedSupFilter, supervisorStartDate);
              }}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              Approve All
            </button>
          </div>

          {/* Mistake Form Dropdown */}
          {showMistakeForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
            >
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Flag an Expense</h4>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Select Expense</label>
                <select
                  value={mistakeTxId}
                  onChange={(e) => setMistakeTxId(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <option value="" disabled>Choose transaction...</option>
                  {reportTransactions.filter(t => t.type === 'EXPENSE').map(t => (
                    <option key={t.id} value={t.id}>
                      ${t.amount} - {t.category} ({t.date.split('-').reverse().join('/')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="What needs to be corrected?"
                  value={mistakeNote}
                  onChange={(e) => setMistakeNote(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                />
              </div>

              <button
                disabled={!mistakeTxId}
                onClick={() => {
                  if (onMarkMistake && mistakeTxId) {
                    onMarkMistake(mistakeTxId, mistakeNote);
                    setShowMistakeForm(false);
                    setMistakeTxId('');
                    setMistakeNote('');
                  }
                }}
                className="w-full h-11 rounded-xl bg-rose-500 text-white font-bold text-xs disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Confirm Mistake
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
