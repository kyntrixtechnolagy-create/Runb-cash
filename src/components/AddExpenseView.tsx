/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Camera,
  Paperclip,
  Check,
  ChevronLeft,
  X,
  FileText,
  AlertCircle,
  Plus
} from 'lucide-react';
import { CATEGORIES, MOCK_RECEIPTS } from '../mockData';

interface AddExpenseViewProps {
  onSaveExpense: (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    receiptUrl?: string;
  }) => void;
  onCancel: () => void;
  darkMode: boolean;
  availableBalance: number;
}

export default function AddExpenseView({
  onSaveExpense,
  onCancel,
  darkMode,
  availableBalance
}: AddExpenseViewProps) {
  const [amount, setAmount] = useState('');
  const [categoriesList, setCategoriesList] = useState(() =>
    CATEGORIES.filter(c => c.name !== 'Allocation')
  );
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

  const [sitesList, setSitesList] = useState(['Common', 'Site A', 'Site B', 'Downtown Project']);
  const [siteName, setSiteName] = useState('Common');
  const [newSiteName, setNewSiteName] = useState('');
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);

  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const amountPresets = [100, 500, 1000, 2000, 5000];

  const handlePresetClick = (val: number) => {
    setAmount(val.toString());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      // Generate object URL for preview
      const url = URL.createObjectURL(file);
      setReceiptUrl(url);
    }
  };

  const handleSelectMockReceipt = (name: string, url: string) => {
    setReceiptName(name);
    setReceiptUrl(url);
  };

  const handleRemoveReceipt = () => {
    setReceiptName('');
    setReceiptUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const lastSubmission = useRef<{ amount: number; description: string; time: number } | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);

  const submitExpense = (data: any) => {
    lastSubmission.current = {
      amount: data.amount,
      description: data.description,
      time: Date.now()
    };
    onSaveExpense(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    if (parsedAmount > availableBalance) {
      setErrorMsg(`Insufficient limit! Your remaining spend limit is Rs. ${availableBalance.toLocaleString()}`);
      return;
    }

    // Prefix the site name to the description
    const finalDescription = description.trim() 
      ? `[${siteName}] ${description.trim()}` 
      : `Spent on ${selectedCategory} at ${siteName}`;

    // Check for duplicate
    const now = Date.now();
    if (
      lastSubmission.current &&
      lastSubmission.current.amount === parsedAmount &&
      lastSubmission.current.description === finalDescription &&
      now - lastSubmission.current.time < 60000 // 60 seconds
    ) {
      setPendingSubmission({
        amount: parsedAmount,
        category: selectedCategory,
        description: finalDescription,
        date,
        receiptUrl: receiptUrl || undefined
      });
      setShowDuplicateWarning(true);
      return;
    }

    submitExpense({
      amount: parsedAmount,
      category: selectedCategory,
      description: finalDescription,
      date,
      receiptUrl: receiptUrl || undefined
    });
  };

  return (
    <div className={`absolute inset-0 flex flex-col justify-between pb-24 overflow-y-auto no-scrollbar transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Dynamic Screen Header */}
      <div className={`p-4 flex items-center justify-between border-b sticky top-0 z-20 backdrop-blur-md ${
        darkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-slate-100'
      }`}>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          <span>Go Back</span>
        </button>
        <span className="text-sm font-bold font-display">Add a New Purchase</span>
        <div className="w-14" /> {/* Spacer */}
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex-1 space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Large Amount Field */}
        <div className={`p-5 rounded-3xl border text-center transition-all-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">How much did you spend?</span>
          
          <div className="relative mt-2 max-w-xs mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-brand-teal mr-1.5">Rs.</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg('');
              }}
              className="w-48 text-left text-4xl font-display font-bold bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 pb-2 focus:border-brand-teal outline-none text-brand-teal font-sans"
              min="0.01"
              step="any"
              required
              autoFocus
            />
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
            {amountPresets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetClick(val)}
                className={`py-1 px-3 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  amount === val.toString()
                    ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/25'
                    : darkMode
                    ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                +Rs. {val}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-bold block mt-3">
            My spendable cash limit left is: Rs. {availableBalance.toLocaleString()}
          </span>
        </div>

        {/* Horizontal Category Tap Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nature of expense or expenditure</span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
            {!showNewCategoryForm ? (
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(true)}
                className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border-2 border-dashed shrink-0 ${
                  darkMode
                    ? 'border-slate-800 text-teal-400 hover:text-teal-300 hover:border-slate-700'
                    : 'border-slate-200 text-teal-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-full px-2 py-1 shrink-0 border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onBlur={() => {
                    const trimmed = newCategoryName.trim();
                    if (trimmed) {
                      if (!categoriesList.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
                        const newCat = {
                          name: trimmed,
                          icon: 'Tag',
                          color: 'bg-teal-100 text-teal-600 border-teal-200'
                        };
                        setCategoriesList([...categoriesList, newCat]);
                        setSelectedCategory(trimmed);
                      } else {
                        setSelectedCategory(categoriesList.find(c => c.name.toLowerCase() === trimmed.toLowerCase())?.name || trimmed);
                      }
                      setNewCategoryName('');
                    }
                    setShowNewCategoryForm(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="bg-transparent text-xs font-bold px-1 py-0.5 outline-none w-24 text-slate-800 dark:text-white"
                  maxLength={15}
                  autoFocus
                />
              </div>
            )}

            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 scale-[1.03]'
                      : darkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100'
                      : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[12px]">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Site Name Tap Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Which site is this for?</span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
            {!showNewSiteForm ? (
              <button
                type="button"
                onClick={() => setShowNewSiteForm(true)}
                className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border-2 border-dashed shrink-0 ${
                  darkMode
                    ? 'border-slate-800 text-teal-400 hover:text-teal-300 hover:border-slate-700'
                    : 'border-slate-200 text-teal-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-full px-2 py-1 shrink-0 border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Site name..."
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  onBlur={() => {
                    const trimmed = newSiteName.trim();
                    if (trimmed) {
                      if (!sitesList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
                        setSitesList([...sitesList, trimmed]);
                        setSiteName(trimmed);
                      } else {
                        setSiteName(sitesList.find(s => s.toLowerCase() === trimmed.toLowerCase()) || trimmed);
                      }
                      setNewSiteName('');
                      setErrorMsg('');
                    }
                    setShowNewSiteForm(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="bg-transparent text-xs font-bold px-1 py-0.5 outline-none w-24 text-slate-800 dark:text-white"
                  maxLength={20}
                  autoFocus
                />
              </div>
            )}

            {sitesList.map((site) => {
              const isSelected = siteName === site;
              return (
                <button
                  key={site}
                  type="button"
                  onClick={() => { setSiteName(site); setErrorMsg(''); }}
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 scale-[1.03]'
                      : darkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100'
                      : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[12px]">{site}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Write a short note of what you bought (Optional):</span>
          <textarea
            placeholder="Type a simple description (Optional, e.g. 5 gallons of fuel, lunch for crew, work tools...)"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrorMsg('');
            }}
            rows={2.5}
            className={`w-full p-3.5 text-xs rounded-2xl border outline-none transition-all-300 resize-none font-medium ${
              darkMode
                ? 'bg-slate-900 border-slate-800 focus:border-teal-500 text-white'
                : 'bg-white border-slate-200 focus:border-teal-500 text-slate-800'
            }`}
          />
        </div>

        {/* Date Selector */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">When did you buy this?</span>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full py-2.5 pl-11 pr-4 text-xs font-bold rounded-2xl border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
              }`}
              required
            />
          </div>
        </div>

        {/* Receipt attachment section */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Attach a picture of your paper bill (Optional)</span>

          {receiptUrl ? (
            <div className={`p-3 rounded-2xl border transition-all-300 flex items-center justify-between ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={receiptUrl}
                    alt="Receipt preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">Paper bill added successfully!</span>
                  <span className="text-xs font-bold block max-w-[200px] truncate">{receiptName || 'Uploaded Receipt'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveReceipt}
                className="p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Upload Selector */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-24 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-teal-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Camera className="w-6 h-6 mb-1 text-slate-400 group-hover:text-teal-500" />
                <span className="text-xs font-bold text-slate-500">Take a Photo or Select a File</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Click here to pick an image of your receipt</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </div>

              {/* Quick Select Preset Receipt Images (Super helpful for prototyping) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Or click one of these sample receipts to try it out:</span>
                <div className="grid grid-cols-2 gap-2">
                  {MOCK_RECEIPTS.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectMockReceipt(m.name, m.url)}
                      className={`p-2 rounded-xl border text-left text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.01] ${
                        darkMode
                          ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5 text-teal-500" />
                      <span className="truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Large Save Button */}
        <button
          type="submit"
          className="w-full relative h-12 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-blue font-bold text-sm text-white hover:opacity-95 focus:outline-none flex items-center justify-center shadow-lg shadow-brand-teal/20 active:scale-[0.98] transition-all duration-150 mt-6"
        >
          <Check className="w-4.5 h-4.5 mr-1" />
          <span>Submit for Review</span>
        </button>
      </form>

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display">Duplicate Entry Detected</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Submitted less than a minute ago</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-5">
              This looks like a duplicate entry. Are you sure you want to add it?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setPendingSubmission(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs border ${
                  darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  submitExpense(pendingSubmission);
                  setShowDuplicateWarning(false);
                  setPendingSubmission(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Yes, Add It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
