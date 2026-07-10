import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Undo2
} from 'lucide-react';

interface ReturnCashViewProps {
  onReturnCash: (amount: number, note: string) => void;
  onCancel: () => void;
  darkMode: boolean;
  availableBalance: number;
}

export default function ReturnCashView({
  onReturnCash,
  onCancel,
  darkMode,
  availableBalance
}: ReturnCashViewProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const amountPresets = [500, 1000, 2000, 5000, availableBalance].filter(val => val > 0 && val <= availableBalance);
  // Deduplicate presets
  const uniquePresets = Array.from(new Set(amountPresets));

  const handlePresetClick = (val: number) => {
    setAmount(val.toString());
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    if (parsedAmount > availableBalance) {
      setErrorMsg(`You can only return up to Rs. ${availableBalance.toLocaleString()}`);
      return;
    }

    onReturnCash(parsedAmount, note.trim() || 'Returned remaining funds to Owner');
  };

  return (
    <div className={`absolute inset-0 flex flex-col justify-between pb-24 overflow-y-auto no-scrollbar transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      {/* Dynamic Screen Header */}
      <div className={`p-4 flex items-center justify-between border-b sticky top-0 z-20 backdrop-blur-md ${darkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-slate-100'
        }`}>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          <span>Go Back</span>
        </button>
        <span className="text-sm font-bold font-display flex items-center gap-1">
          <Undo2 className="w-4 h-4 text-brand-teal" />
          Return Cash
        </span>
        <div className="w-14" /> {/* Spacer */}
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex-1 space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
          <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">
            Send your leftover daily cash back to the Owner. This will be deducted from your remaining balance once approved.
          </p>
        </div>

        {/* Large Amount Field */}
        <div className={`p-5 rounded-3xl border text-center transition-all-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">How much are you returning?</span>

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
              max={availableBalance}
              step="any"
              required
              autoFocus
            />
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
            {uniquePresets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetClick(val)}
                className={`py-1 px-3 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${amount === val.toString()
                  ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/25'
                  : darkMode
                    ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
              >
                {val === availableBalance ? 'Return All' : `Rs. ${val}`}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-bold block mt-3">
            Max available to return: Rs. {availableBalance.toLocaleString()}
          </span>
        </div>

        {/* Note Input */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Write a short note (Optional):</span>
          <textarea
            placeholder="Type a simple note (Optional, e.g. Leftover cash from today)"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setErrorMsg('');
            }}
            rows={2.5}
            className={`w-full p-3.5 text-xs rounded-2xl border outline-none transition-all-300 resize-none font-medium ${darkMode
              ? 'bg-slate-900 border-slate-800 focus:border-teal-500 text-white'
              : 'bg-white border-slate-200 focus:border-teal-500 text-slate-800'
              }`}
          />
        </div>

        {/* Large Submit Button */}
        <button
          type="submit"
          className="w-full relative h-12 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-blue font-bold text-sm text-white hover:opacity-95 focus:outline-none flex items-center justify-center shadow-lg shadow-brand-teal/20 active:scale-[0.98] transition-all duration-150 mt-6 cursor-pointer"
        >
          <Check className="w-4.5 h-4.5 mr-1" />
          <span>Send to Owner for Approval</span>
        </button>
      </form>
    </div>
  );
}
