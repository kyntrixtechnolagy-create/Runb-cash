import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Check,
  AlertCircle,
  HandCoins,
  Plus,
  X
} from 'lucide-react';

interface CollectCashViewProps {
  onCollectCash: (amount: number, siteName: string, note: string) => void;
  onCancel: () => void;
  darkMode: boolean;
}

export default function CollectCashView({
  onCollectCash,
  onCancel,
  darkMode
}: CollectCashViewProps) {
  const [amount, setAmount] = useState('');
  const [sitesList, setSitesList] = useState(['Site A', 'Site B', 'Downtown Project']);
  const [siteName, setSiteName] = useState('Site A');
  const [newSiteName, setNewSiteName] = useState('');
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const amountPresets = [500, 1000, 2000, 5000, 10000];

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
    if (!siteName.trim()) {
      setErrorMsg('Please enter the site name where you received the cash.');
      return;
    }

    onCollectCash(parsedAmount, siteName.trim(), note.trim() || 'Collected cash at site');
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
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          <span>Go Back</span>
        </button>
        <span className="text-sm font-bold font-display flex items-center gap-1">
          <HandCoins className="w-4 h-4 text-emerald-500" />
          Receive Cash
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

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            Log the cash you received from a site owner or staff. This will be added to your balance once approved.
          </p>
        </div>

        {/* Large Amount Field */}
        <div className={`p-5 rounded-3xl border text-center transition-all-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">How much did you receive?</span>
          
          <div className="relative mt-2 max-w-xs mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-500 mr-1.5">Rs.</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg('');
              }}
              className="w-48 text-left text-4xl font-display font-bold bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 pb-2 focus:border-emerald-500 outline-none text-emerald-500 font-sans"
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
                className={`py-1 px-3 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                  amount === val.toString()
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : darkMode
                    ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Rs. {val}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Site Name Tap Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Which site gave the money?</span>
            <span className="text-[10px] text-emerald-500 font-bold">Site Add option below</span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
            {sitesList.map((site) => {
              const isSelected = siteName === site;
              return (
                <button
                  key={site}
                  type="button"
                  onClick={() => { setSiteName(site); setErrorMsg(''); }}
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-[1.03]'
                      : darkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100'
                      : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[12px]">{site}</span>
                </button>
              );
            })}

            {!showNewSiteForm ? (
              <button
                type="button"
                onClick={() => setShowNewSiteForm(true)}
                className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border-2 border-dashed ${
                  darkMode
                    ? 'border-slate-800 text-emerald-400 hover:text-emerald-300 hover:border-slate-700'
                    : 'border-slate-200 text-emerald-600 hover:bg-slate-50 hover:border-slate-300'
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
                  className="bg-transparent text-xs font-bold px-1 py-0.5 outline-none w-24 text-slate-800 dark:text-white"
                  maxLength={20}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newSiteName.trim();
                    if (trimmed) {
                      if (!sitesList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
                        setSitesList([...sitesList, trimmed]);
                        setSiteName(trimmed);
                      } else {
                        setSiteName(sitesList.find(s => s.toLowerCase() === trimmed.toLowerCase()) || trimmed);
                      }
                      setNewSiteName('');
                      setShowNewSiteForm(false);
                      setErrorMsg('');
                    }
                  }}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[10px] font-bold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewSiteName('');
                    setShowNewSiteForm(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Note Input */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Who gave it & Why (Optional):</span>
          <textarea
            placeholder="Type a simple note (e.g. Received from John at Site A)"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setErrorMsg('');
            }}
            rows={2.5}
            className={`w-full p-3.5 text-xs rounded-2xl border outline-none transition-all-300 resize-none font-medium ${
              darkMode
                ? 'bg-slate-900 border-slate-800 focus:border-emerald-500 text-white'
                : 'bg-white border-slate-200 focus:border-emerald-500 text-slate-800'
            }`}
          />
        </div>

        {/* Large Submit Button */}
        <button
          type="submit"
          className="w-full relative h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-sm text-white hover:opacity-95 focus:outline-none flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all duration-150 mt-6 cursor-pointer"
        >
          <Check className="w-4.5 h-4.5 mr-1" />
          <span>Submit for Approval</span>
        </button>
      </form>
    </div>
  );
}
