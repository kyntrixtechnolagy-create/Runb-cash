/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi,
  Battery,
  UserCheck,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Database,
  TrendingDown,
  Activity,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Signal,
  Bell
} from 'lucide-react';

import { ActiveScreen, UserRole, User as UserType, Transaction, SupervisorBalance } from './types';
import { supabase } from './lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { subscribeToPushNotifications } from './lib/pushNotifications';

// Subcomponents
import SplashView from './components/SplashView';
import LoginView from './components/LoginView';
import SignupView from './components/SignupView';
import DashboardHeader from './components/DashboardHeader';
import BottomNav from './components/BottomNav';
import AuditorDashboardView from './components/AuditorDashboardView';
import OwnerDashboardView from './components/OwnerDashboardView';
import SupervisorDashboardView from './components/SupervisorDashboardView';
import TransactionsView from './components/TransactionsView';
import AddExpenseView from './components/AddExpenseView';
import EditExpenseView from './components/EditExpenseView';
import ReturnCashView from './components/ReturnCashView';
import ReportsView from './components/ReportsView';
import ProfileView from './components/ProfileView';
import CollectCashView from './components/CollectCashView';
import RequestCashView from './components/RequestCashView';
import Toast, { ToastMessage } from './components/Toast';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('SPLASH');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Dynamic application state backing local storage
  const [supervisors, setSupervisors] = useState<UserType[]>([]);
  const [balances, setBalances] = useState<SupervisorBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reportStaffFilter, setReportStaffFilter] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme-preference');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTxDetails, setSelectedTxDetails] = useState<Transaction | null>(null);

  // Push Notification State
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>('granted');

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermissionStatus(Notification.permission);
    }
  }, []);

  const handleEnablePush = async () => {
    if (currentUser && currentUser.id && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushPermissionStatus(permission);
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(currentUser.id);
        if (result && !result.success) {
          showToast(`Push Error: ${result.error}`, 'ERROR');
        } else {
          showToast('Push Notifications enabled!', 'SUCCESS');
        }
      } else {
        showToast('Permission denied.', 'ERROR');
      }
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id && pushPermissionStatus === 'granted') {
      subscribeToPushNotifications(currentUser.id).then(result => {
        if (result && !result.success && result.error !== 'VAPID public key missing from Env Vars') {
          // We don't want to spam the user with missing VAPID key toast on every load if they are just on desktop
          // but if it's a real DB error, show it
          console.error("Auto-subscribe failed:", result.error);
        }
      });
    }
  }, [currentUser, pushPermissionStatus]);

  // Time & Status bar state
  const [currentTime, setCurrentTime] = useState('10:45 AM');

  // Trigger clock updates
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Push Notifications
  useEffect(() => {
    if (currentUser && currentUser.id) {
      subscribeToPushNotifications(currentUser.id);
    }
  }, [currentUser]);

  // Hardware Back Button Handling
  const activeScreenRef = React.useRef(activeScreen);
  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    const handlePopState = () => {
      const currentScreen = activeScreenRef.current;
      const isDashboard = 
        currentScreen === 'OWNER_DASHBOARD' || 
        currentScreen === 'SUPERVISOR_DASHBOARD' || 
        currentScreen === 'AUDITOR_DASHBOARD' ||
        currentScreen === 'SPLASH' ||
        currentScreen === 'LOGIN' ||
        currentScreen === 'SIGNUP';

      if (!isDashboard && currentUser) {
        // We pressed back while on a sub-screen. Return to dashboard instead of closing app.
        const role = currentUser.role;
        setActiveScreen(role === 'OWNER' ? 'OWNER_DASHBOARD' : role === 'AUDITOR' ? 'AUDITOR_DASHBOARD' : 'SUPERVISOR_DASHBOARD');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const prevScreenRef = React.useRef(activeScreen);
  useEffect(() => {
    const prev = prevScreenRef.current;
    const curr = activeScreen;
    
    const isPrevDashboard = prev === 'OWNER_DASHBOARD' || prev === 'SUPERVISOR_DASHBOARD' || prev === 'AUDITOR_DASHBOARD';
    const isCurrDashboard = curr === 'OWNER_DASHBOARD' || curr === 'SUPERVISOR_DASHBOARD' || curr === 'AUDITOR_DASHBOARD';

    // When navigating from a dashboard to a sub-screen, push a state to history
    // so that the hardware back button will fire a popstate event instead of closing the app.
    if (isPrevDashboard && !isCurrDashboard) {
      window.history.pushState({ subScreen: true }, '', '');
    }
    
    prevScreenRef.current = curr;
  }, [activeScreen]);

  // Fetch real data from Supabase
  const loadDatabase = async (userId: string) => {
    try {
      const { data: sups } = await supabase.from('users').select('*').eq('role', 'SUPERVISOR');
      const { data: bals } = await supabase.from('supervisor_balances').select('*');
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });

      if (sups) {
        setSupervisors(sups as UserType[]);

        // Auto-create balance rows for any staff who signed up themselves
        // (they won't have a row in supervisor_balances yet)
        if (bals) {
          const existingIds = new Set((bals as SupervisorBalance[]).map((b) => b.supervisorId));
          const missing = (sups as UserType[]).filter((s) => !existingIds.has(s.id));
          if (missing.length > 0) {
            const newRows = missing.map((s) => ({
              "supervisorId": s.id,
              "supervisorName": s.name,
              "allocatedCash": 0,
              "spentCash": 0,
              "remainingCash": 0
            }));
            const { data: inserted } = await supabase.from('supervisor_balances').insert(newRows).select();
            const allBals = [...(bals as SupervisorBalance[]), ...((inserted || []) as SupervisorBalance[])];
            setBalances(allBals);
          } else {
            setBalances(bals as SupervisorBalance[]);
          }
        }
      }

      if (txs) setTransactions(txs as Transaction[]);
    } catch (e) {
      console.error(e);
    }
  };

  // Listen to Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setCurrentUser(data as UserType);
            loadDatabase(session.user.id);
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.from('users').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setCurrentUser(data as UserType);
            loadDatabase(session.user.id);
          }
        });
      } else {
        setCurrentUser(null);
        setActiveScreen('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Database Updater
  const updateDB = (updatedSups: UserType[], updatedBalances: SupervisorBalance[], updatedTxs: Transaction[]) => {
    setSupervisors(updatedSups);
    setBalances(updatedBalances);
    setTransactions(updatedTxs);
    // Future Note: Implement real upsert to Supabase here
  };

  // Toast Helpers
  const showToast = (text: string, type: 'SUCCESS' | 'ERROR') => {
    setToast({
      id: Math.random().toString(),
      text,
      type
    });
  };

  // Push Notification Helpers
  const sendPushNotification = async (targetUserId: string, title: string, body: string) => {
    try {
      await supabase.functions.invoke('send-push', {
        body: { targetUserId, title, body }
      });
    } catch (err) {
      console.error('Failed to send push notification:', err);
    }
  };

  const notifyOwners = async (title: string, body: string) => {
    const owners = supervisors.filter(s => s.role === 'OWNER');
    for (const owner of owners) {
      await sendPushNotification(owner.id, title, body);
    }
  };

  const handleSplashComplete = () => {
    if (currentUser) {
      setActiveScreen(currentUser.role === 'OWNER' ? 'OWNER_DASHBOARD' : currentUser.role === 'AUDITOR' ? 'AUDITOR_DASHBOARD' : 'SUPERVISOR_DASHBOARD');
    } else {
      setActiveScreen('LOGIN');
    }
  };

  const handleLoginSuccess = (user: UserType) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'SUCCESS');
    setActiveScreen(user.role === 'OWNER' ? 'OWNER_DASHBOARD' : user.role === 'AUDITOR' ? 'AUDITOR_DASHBOARD' : 'SUPERVISOR_DASHBOARD');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveScreen('LOGIN');
    showToast('Securely signed out of system.', 'SUCCESS');
  };

  // Owner action: Allocate petty cash to supervisor
  const handleAllocateCash = async (supId: string, amount: number, notes: string) => {
    const targetSup = supervisors.find((s) => s.id === supId);
    if (!targetSup) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Insert transaction as PENDING
      const { data: txData, error: txError } = await supabase.from('transactions').insert([
        {
          amount,
          type: 'INCOME',
          category: 'Allocation',
          description: notes,
          date: today,
          "supervisorId": supId,
          "supervisorName": targetSup.name,
          status: 'PENDING'
        }
      ]).select().single();
      if (txError) { console.error('TX insert error:', txError); throw txError; }

      // 2. Update local state
      const newTx: Transaction = { ...(txData as Transaction) };
      updateDB(supervisors, balances, [newTx, ...transactions]);
      showToast(`Sent Rs. ${amount.toLocaleString()} to ${targetSup.name}. Waiting for staff to accept.`, 'SUCCESS');
      await sendPushNotification(supId, 'Cash Allocated', `Owner allocated Rs. ${amount.toLocaleString()} to you.`);
    } catch (err: any) {
      showToast(err.message || 'Error saving allocation to DB', 'ERROR');
    }
  };

  // Staff action: Approve allocation from owner
  const handleApproveAllocation = async (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx || targetTx.category !== 'Allocation' || targetTx.status !== 'PENDING') return;

    try {
      const existing = balances.find((b) => b.supervisorId === targetTx.supervisorId);
      const currentAllocated = existing?.allocatedCash ?? 0;
      const currentRemaining = existing?.remainingCash ?? 0;
      const newAllocated = currentAllocated + targetTx.amount;
      const newRemaining = currentRemaining + targetTx.amount;

      // 1. Update transaction
      const { error: txError } = await supabase.from('transactions').update({ status: 'APPROVED' }).eq('id', txId);
      if (txError) throw txError;

      // 2. Upsert balance
      const { error: balError } = await supabase.from('supervisor_balances').upsert(
        {
          "supervisorId": targetTx.supervisorId,
          "supervisorName": targetTx.supervisorName,
          "allocatedCash": newAllocated,
          "spentCash": existing?.spentCash ?? 0,
          "remainingCash": newRemaining
        },
        { onConflict: 'supervisorId' }
      );
      if (balError) throw balError;

      // 3. Update local state
      let updatedBalances: SupervisorBalance[];
      if (existing) {
        updatedBalances = balances.map((b) =>
          b.supervisorId === targetTx.supervisorId ? { ...b, allocatedCash: newAllocated, remainingCash: newRemaining } : b
        );
      } else {
        updatedBalances = [...balances, {
          supervisorId: targetTx.supervisorId, supervisorName: targetTx.supervisorName,
          allocatedCash: newAllocated, spentCash: 0, remainingCash: newRemaining
        }];
      }

      updateDB(supervisors, updatedBalances, transactions.map((t) => t.id === txId ? { ...t, status: 'APPROVED' } : t));
      showToast('Cash allocation accepted and added to your balance!', 'SUCCESS');
      await notifyOwners('Allocation Accepted', `${targetTx.supervisorName} accepted Rs. ${targetTx.amount.toLocaleString()}`);
    } catch (err: any) {
      showToast(err.message || 'Error approving allocation', 'ERROR');
    }
  };

  // Staff action: Re-request allocation
  const handleRerequestAllocation = async (txId: string, note: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx || targetTx.category !== 'Allocation' || targetTx.status !== 'PENDING') return;

    try {
      const { error: txError } = await supabase.from('transactions')
        .update({ status: 'NEEDS_CORRECTION', mistakeNote: note })
        .eq('id', txId);
      if (txError) throw txError;

      updateDB(supervisors, balances, transactions.map((t) => t.id === txId ? { ...t, status: 'NEEDS_CORRECTION', mistakeNote: note } : t));
      showToast('Re-requested the correct amount from owner.', 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error re-requesting allocation', 'ERROR');
    }
  };

  // Owner action: Edit & Resend Allocation
  const handleEditAllocation = async (txId: string, newAmount: number) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx || targetTx.category !== 'Allocation' || targetTx.status !== 'NEEDS_CORRECTION') return;

    try {
      const { error: txError } = await supabase.from('transactions')
        .update({ amount: newAmount, status: 'PENDING', mistakeNote: null })
        .eq('id', txId);
      if (txError) throw txError;

      updateDB(supervisors, balances, transactions.map((t) => t.id === txId ? { ...t, amount: newAmount, status: 'PENDING', mistakeNote: undefined } : t));
      showToast('Corrected amount sent to staff for approval.', 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error updating allocation', 'ERROR');
    }
  };

  // Owner action: Initiate Staff to Staff Transfer
  const handleCreateTransfer = async (senderId: string, receiverId: string, amount: number) => {
    const targetSender = supervisors.find(s => s.id === senderId);
    const targetReceiver = supervisors.find(s => s.id === receiverId);
    if (!targetSender || !targetReceiver) return;

    const today = new Date().toISOString().split('T')[0];
    const transferState = {
      receiverId,
      receiverName: targetReceiver.name,
      senderApproved: false,
      receiverApproved: false
    };

    try {
      const { data: txData, error: txError } = await supabase.from('transactions').insert([
        {
          amount,
          type: 'EXPENSE',
          category: 'STAFF_TRANSFER',
          description: JSON.stringify(transferState),
          date: today,
          supervisorId: senderId,
          supervisorName: targetSender.name,
          status: 'PENDING'
        }
      ]).select().single();

      if (txError) throw txError;

      const newTx: Transaction = { ...(txData as Transaction) };
      updateDB(supervisors, balances, [newTx, ...transactions]);
      showToast(`Initiated transfer of Rs. ${amount.toLocaleString()} from ${targetSender.name} to ${targetReceiver.name}`, 'SUCCESS');
      await sendPushNotification(receiverId, 'Transfer Initiated', `${targetSender.name} initiated a transfer of Rs. ${amount.toLocaleString()}`);
    } catch (err: any) {
      showToast(err.message || 'Error initiating transfer', 'ERROR');
    }
  };

  const handleApproveTransfer = async (txId: string, userId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.category !== 'STAFF_TRANSFER' || tx.status !== 'PENDING') return;

    try {
      const transferState = JSON.parse(tx.description);
      const isSender = userId === tx.supervisorId;
      const isReceiver = userId === transferState.receiverId;

      if (isSender) transferState.senderApproved = true;
      if (isReceiver) transferState.receiverApproved = true;

      const bothApproved = transferState.senderApproved && transferState.receiverApproved;

      if (bothApproved) {
        const senderBal = balances.find(b => b.supervisorId === tx.supervisorId);
        const receiverBal = balances.find(b => b.supervisorId === transferState.receiverId);

        const newSenderRemaining = (senderBal?.remainingCash ?? 0) - tx.amount;
        const newSenderSpent = (senderBal?.spentCash ?? 0) + tx.amount;
        const newReceiverRemaining = (receiverBal?.remainingCash ?? 0) + tx.amount;
        const newReceiverAllocated = (receiverBal?.allocatedCash ?? 0) + tx.amount;

        const { error: txErr1 } = await supabase.from('transactions').update({
          description: JSON.stringify(transferState),
          status: 'APPROVED'
        }).eq('id', tx.id);
        if (txErr1) throw txErr1;

        const today = new Date().toISOString().split('T')[0];
        const { data: rxTxData, error: txErr2 } = await supabase.from('transactions').insert([{
          amount: tx.amount,
          type: 'INCOME',
          category: 'STAFF_TRANSFER_IN',
          description: `Transfer from ${tx.supervisorName}`,
          date: today,
          supervisorId: transferState.receiverId,
          supervisorName: transferState.receiverName,
          status: 'APPROVED'
        }]).select().single();
        if (txErr2) throw txErr2;

        await supabase.from('supervisor_balances').upsert([
          {
            supervisorId: tx.supervisorId,
            supervisorName: tx.supervisorName,
            allocatedCash: senderBal?.allocatedCash ?? 0,
            spentCash: newSenderSpent,
            remainingCash: newSenderRemaining
          },
          {
            supervisorId: transferState.receiverId,
            supervisorName: transferState.receiverName,
            allocatedCash: newReceiverAllocated,
            spentCash: receiverBal?.spentCash ?? 0,
            remainingCash: newReceiverRemaining
          }
        ], { onConflict: 'supervisorId' });

        const updatedTxs = transactions.map(t => t.id === tx.id ? { ...t, description: JSON.stringify(transferState), status: 'APPROVED' as any } : t);
        const updatedBalances = balances.map(b => {
          if (b.supervisorId === tx.supervisorId) return { ...b, spentCash: newSenderSpent, remainingCash: newSenderRemaining };
          if (b.supervisorId === transferState.receiverId) return { ...b, allocatedCash: newReceiverAllocated, remainingCash: newReceiverRemaining };
          return b;
        });

        updateDB(supervisors, updatedBalances, [rxTxData as Transaction, ...updatedTxs]);
        showToast('Transfer completed successfully!', 'SUCCESS');
        await sendPushNotification(tx.supervisorId, 'Transfer Completed', `${transferState.receiverName} approved your transfer of Rs. ${tx.amount.toLocaleString()}`);
      } else {
        const { error: txErr1 } = await supabase.from('transactions').update({
          description: JSON.stringify(transferState)
        }).eq('id', tx.id);
        if (txErr1) throw txErr1;

        const updatedTxs = transactions.map(t => t.id === tx.id ? { ...t, description: JSON.stringify(transferState) } : t);
        updateDB(supervisors, balances, updatedTxs);
        showToast('You approved the transfer. Waiting for the other party.', 'SUCCESS');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing approval', 'ERROR');
    }
  };

  const handleDeclineTransfer = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.category !== 'STAFF_TRANSFER') return;

    try {
      const { error: txErr } = await supabase.from('transactions').update({ status: 'REJECTED' }).eq('id', txId);
      if (txErr) throw txErr;

      const updatedTxs = transactions.map(t => t.id === txId ? { ...t, status: 'REJECTED' as any } : t);
      updateDB(supervisors, balances, updatedTxs);
      showToast('Transfer declined.', 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error declining transfer', 'ERROR');
    }
  };

  // Owner action: Add new supervisor
  const handleAddSupervisor = async (name: string, email: string, password: string, designation: string, phone: string) => {
    const tempSupabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    try {
      const { data, error } = await tempSupabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        const newId = data.user.id;

        // Insert user — column keys must match DB exactly
        const { error: dbError } = await supabase.from('users').insert([{
          id: newId,
          name,
          email,
          role: 'SUPERVISOR',
          "avatarUrl": `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          phone,
          designation
        }]);
        if (dbError) { console.error('User insert error:', dbError); throw dbError; }

        // Insert balance
        const { error: balError } = await supabase.from('supervisor_balances').insert([{
          "supervisorId": newId,
          "supervisorName": name,
          "allocatedCash": 0,
          "spentCash": 0,
          "remainingCash": 0
        }]);
        if (balError) { console.error('Balance insert error:', balError); throw balError; }

        const newSup: UserType = { id: newId, name, email, role: 'SUPERVISOR', avatarUrl: '', phone, designation, spendLimit: spendLimit || undefined };
        const newBalance: SupervisorBalance = { supervisorId: newId, supervisorName: name, allocatedCash: 0, spentCash: 0, remainingCash: 0 };
        updateDB([...supervisors, newSup], [...balances, newBalance], transactions);
        showToast(`Staff ${name} added successfully!`, 'SUCCESS');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating staff', 'ERROR');
    }
  };

  // Owner action: Edit existing staff details
  const handleEditStaff = async (userId: string, name: string, desig: string, phone: string, spendLimit: number) => {
    try {
      const updates = { name, designation: desig, phone, spendLimit: spendLimit || undefined };
      const { error } = await supabase.from('users').update(updates).eq('id', userId);
      if (error) { console.error('Edit staff error:', error); throw error; }

      const updatedSups = supervisors.map((s) =>
        s.id === userId ? { ...s, ...updates } : s
      );
      setSupervisors(updatedSups as UserType[]);
      showToast(`${name}'s details updated!`, 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error updating staff', 'ERROR');
    }
  };

  // Owner action: Remove staff (soft delete)
  const handleRemoveStaff = async (userId: string) => {
    try {
      const { error } = await supabase.from('users').update({ isActive: false }).eq('id', userId);
      if (error) { console.error('Remove staff error:', error); throw error; }

      const updatedSups = supervisors.map((s) =>
        s.id === userId ? { ...s, isActive: false } : s
      );
      setSupervisors(updatedSups as UserType[]);
      showToast('Staff member removed successfully.', 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error removing staff', 'ERROR');
    }
  };

  // Owner action: Approve or reject supervisor claim
  const handleReviewTransaction = async (txId: string, status: 'APPROVED' | 'REJECTED') => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    try {
      const { error: txError } = await supabase.from('transactions').update({ status }).eq('id', txId);
      if (txError) { console.error('Review TX error:', txError); throw txError; }

      let updatedBalances = [...balances];
      if (status === 'APPROVED' && targetTx.status === 'PENDING' && targetTx.type === 'EXPENSE') {
        const targetBalance = balances.find((b) => b.supervisorId === targetTx.supervisorId);
        if (targetBalance) {
          const newSpent = targetBalance.spentCash + targetTx.amount;
          const newRemaining = targetBalance.remainingCash - targetTx.amount;

          const { error: balError } = await supabase.from('supervisor_balances')
            .update({ "spentCash": newSpent, "remainingCash": newRemaining })
            .eq('supervisorId', targetTx.supervisorId);
          if (balError) { console.error('Balance update error:', balError); throw balError; }

          updatedBalances = balances.map((b) =>
            b.supervisorId === targetTx.supervisorId ? { ...b, spentCash: newSpent, remainingCash: newRemaining } : b
          );
        }
      } else if (status === 'APPROVED' && targetTx.status === 'PENDING' && targetTx.type === 'RETURN') {
        // If a RETURN is approved, reduce the allocatedCash and remainingCash
        const targetBalance = balances.find((b) => b.supervisorId === targetTx.supervisorId);
        if (targetBalance) {
          const newAllocated = targetBalance.allocatedCash - targetTx.amount;
          const newRemaining = targetBalance.remainingCash - targetTx.amount;

          const { error: balError } = await supabase.from('supervisor_balances')
            .update({ "allocatedCash": newAllocated, "remainingCash": newRemaining })
            .eq('supervisorId', targetTx.supervisorId);
          if (balError) { console.error('Balance update error:', balError); throw balError; }

          updatedBalances = balances.map((b) =>
            b.supervisorId === targetTx.supervisorId ? { ...b, allocatedCash: newAllocated, remainingCash: newRemaining } : b
          );
        }
      } else if (status === 'APPROVED' && targetTx.status === 'PENDING' && targetTx.type === 'INCOME') {
        const targetBalance = balances.find((b) => b.supervisorId === targetTx.supervisorId);
        if (targetBalance) {
          const newAllocated = targetBalance.allocatedCash + targetTx.amount;
          const newRemaining = targetBalance.remainingCash + targetTx.amount;

          const { error: balError } = await supabase.from('supervisor_balances')
            .update({ "allocatedCash": newAllocated, "remainingCash": newRemaining })
            .eq('supervisorId', targetTx.supervisorId);
          if (balError) { console.error('Balance update error:', balError); throw balError; }

          updatedBalances = balances.map((b) =>
            b.supervisorId === targetTx.supervisorId ? { ...b, allocatedCash: newAllocated, remainingCash: newRemaining } : b
          );
        }
      }

      updateDB(supervisors, updatedBalances, transactions.map((t) => t.id === txId ? { ...t, status } : t));
      showToast(`Claim sheet is ${status.toLowerCase()}`, 'SUCCESS');

      const statusWord = status === 'APPROVED' ? 'Approved' : 'Rejected';
      await sendPushNotification(targetTx.supervisorId, `Expense ${statusWord}`, `Your expense of Rs. ${targetTx.amount.toLocaleString()} was ${status.toLowerCase()}.`);

      const targetBal = updatedBalances.find(b => b.supervisorId === targetTx.supervisorId);
      if (status === 'APPROVED' && targetBal && targetBal.remainingCash < 1000) {
        await notifyOwners('Low Balance Alert', `${targetTx.supervisorName} has a low balance of Rs. ${targetBal.remainingCash.toLocaleString()}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating transaction', 'ERROR');
    }
  };

  // Owner action: Mark a transaction as mistake
  const handleMarkMistake = async (txId: string, note: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    try {
      const { error: txError } = await supabase.from('transactions').update({ status: 'NEEDS_CORRECTION', "mistakeNote": note }).eq('id', txId);
      if (txError) { console.error('Mark Mistake error:', txError); throw txError; }

      let updatedBalances = [...balances];

      // If the transaction was previously APPROVED, reverse the balance so it's not double counted later
      if (targetTx.status === 'APPROVED') {
        const targetBalance = balances.find((b) => b.supervisorId === targetTx.supervisorId);
        if (targetBalance) {
          const newSpent = targetBalance.spentCash - targetTx.amount;
          const newRemaining = targetBalance.remainingCash + targetTx.amount;

          const { error: balError } = await supabase.from('supervisor_balances')
            .update({ "spentCash": newSpent, "remainingCash": newRemaining })
            .eq('supervisorId', targetTx.supervisorId);

          if (balError) { console.error('Balance update error:', balError); throw balError; }

          updatedBalances = balances.map((b) =>
            b.supervisorId === targetTx.supervisorId ? { ...b, spentCash: newSpent, remainingCash: newRemaining } : b
          );
        }
      }

      updateDB(supervisors, updatedBalances, transactions.map((t) => t.id === txId ? { ...t, status: 'NEEDS_CORRECTION', mistakeNote: note } : t));
      showToast(`Flagged as mistake for staff correction`, 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error flagging transaction', 'ERROR');
    }
  };

  // Owner action: Bulk approve daily pending transactions
  const handleApproveDaily = async (supervisorId: string, date: string) => {
    try {
      // Find all pending transactions for this supervisor on this date
      const txsToApprove = transactions.filter(t => t.supervisorId === supervisorId && t.date === date && t.status === 'PENDING');

      if (txsToApprove.length === 0) {
        showToast('No pending transactions to approve', 'SUCCESS');
        return;
      }

      const txIds = txsToApprove.map(t => t.id);
      const { error: txError } = await supabase.from('transactions').update({ status: 'APPROVED' }).in('id', txIds);
      if (txError) { console.error('Approve Daily error:', txError); throw txError; }

      // Update balances
      let updatedBalances = [...balances];
      const targetBalance = balances.find((b) => b.supervisorId === supervisorId);

      if (targetBalance) {
        const expenseTotal = txsToApprove.filter(t => t.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
        const returnTotal = txsToApprove.filter(t => t.type === 'RETURN').reduce((sum, tx) => sum + tx.amount, 0);

        const newSpent = targetBalance.spentCash + expenseTotal;
        const newAllocated = targetBalance.allocatedCash - returnTotal;
        const newRemaining = targetBalance.remainingCash - (expenseTotal + returnTotal);

        const { error: balError } = await supabase.from('supervisor_balances')
          .update({ "spentCash": newSpent, "allocatedCash": newAllocated, "remainingCash": newRemaining })
          .eq('supervisorId', supervisorId);

        if (balError) { console.error('Balance update error:', balError); throw balError; }

        updatedBalances = balances.map((b) =>
          b.supervisorId === supervisorId ? { ...b, spentCash: newSpent, allocatedCash: newAllocated, remainingCash: newRemaining } : b
        );
      }

      updateDB(supervisors, updatedBalances, transactions.map((t) => txIds.includes(t.id) ? { ...t, status: 'APPROVED' } : t));
      showToast(`Approved ${txsToApprove.length} transaction(s)`, 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Error approving transactions', 'ERROR');
    }
  };

  // Supervisor action: Update an expense that had a mistake
  const handleUpdateExpense = async (txId: string, updates: Partial<Transaction>) => {
    if (!currentUser) return;
    try {
      const updatePayload = {
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        date: updates.date,
        "receiptUrl": updates.receiptUrl || null,
        status: 'PENDING',
        "mistakeNote": null
      };

      const { error } = await supabase.from('transactions').update(updatePayload).eq('id', txId);
      if (error) { console.error('Update expense error:', error); throw error; }

      updateDB(supervisors, balances, transactions.map((t) => t.id === txId ? { ...t, ...updatePayload, status: 'PENDING', mistakeNote: undefined } : t));
      showToast('Expense corrected and submitted for review!', 'SUCCESS');
      setActiveScreen('SUPERVISOR_DASHBOARD');
      setSelectedTxDetails(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update expense', 'ERROR');
    }
  };

  // Supervisor action: Submit new expense claim
  const handleSaveExpense = async (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    receiptUrl?: string;
  }) => {
    if (!currentUser) return;

    try {
      // Insert without id — let Postgres generate UUID
      const { data: txData, error } = await supabase.from('transactions').insert([
        {
          amount: data.amount,
          type: 'EXPENSE',
          category: data.category,
          description: data.description,
          date: data.date,
          "supervisorId": currentUser.id,
          "supervisorName": currentUser.name,
          "receiptUrl": data.receiptUrl || null,
          status: 'PENDING'
        }
      ]).select().single();

      if (error) { console.error('Expense insert error:', error); throw error; }

      const newTx = txData as Transaction;
      updateDB(supervisors, balances, [newTx, ...transactions]);
      showToast('Expense claim sheet submitted for audit!', 'SUCCESS');
      await notifyOwners('New Expense Submitted', `${currentUser.name} submitted an expense for Rs. ${data.amount.toLocaleString()}`);
      setActiveScreen('SUPERVISOR_DASHBOARD');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit expense', 'ERROR');
    }
  };

  // Supervisor action: Submit a return cash request
  const handleReturnCash = async (amount: number, note: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: txData, error } = await supabase.from('transactions').insert([
        {
          amount: amount,
          type: 'RETURN',
          category: 'Returned to Owner',
          description: note,
          date: today,
          "supervisorId": currentUser.id,
          "supervisorName": currentUser.name,
          status: 'PENDING'
        }
      ]).select().single();

      if (error) { console.error('Return insert error:', error); throw error; }

      const newTx = txData as Transaction;
      updateDB(supervisors, balances, [newTx, ...transactions]);
      showToast('Cash return submitted for owner approval!', 'SUCCESS');
      await notifyOwners('Cash Returned', `${currentUser.name} returned Rs. ${amount.toLocaleString()}`);
      setActiveScreen('SUPERVISOR_DASHBOARD');
    } catch (err: any) {
      showToast(err.message || 'Failed to return cash', 'ERROR');
    }
  };

  // Supervisor action: Submit a cash collection (income)
  const handleCollectCash = async (amount: number, siteName: string, note: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: txData, error } = await supabase.from('transactions').insert([
        {
          amount: amount,
          type: 'INCOME',
          category: siteName,
          description: note,
          date: today,
          "supervisorId": currentUser.id,
          "supervisorName": currentUser.name,
          status: 'PENDING'
        }
      ]).select().single();

      if (error) { console.error('Income insert error:', error); throw error; }

      const newTx = txData as Transaction;
      updateDB(supervisors, balances, [newTx, ...transactions]);
      showToast('Cash collection submitted for approval.', 'SUCCESS');
      await notifyOwners('Cash Collected', `${currentUser.name} collected Rs. ${amount.toLocaleString()} from ${siteName}`);
      setActiveScreen('SUPERVISOR_DASHBOARD');
    } catch (err: any) {
      showToast(err.message || 'Error saving collection', 'ERROR');
    }
  };

  const handleRequestCash = async (amount: number, reason: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: txData, error } = await supabase.from('transactions').insert([
        {
          amount,
          type: 'INCOME',
          category: 'CASH_REQUEST',
          description: reason,
          date: today,
          "supervisorId": currentUser.id,
          "supervisorName": currentUser.name,
          status: 'PENDING'
        }
      ]).select().single();

      if (error) { console.error('Request cash error:', error); throw error; }

      const finalTx = txData as Transaction;
      updateDB(supervisors, balances, [finalTx, ...transactions]);
      showToast('Money request sent to owner.', 'SUCCESS');
      await notifyOwners('Cash Requested', `${currentUser.name} requested Rs. ${amount.toLocaleString()} for ${reason}`);
      setActiveScreen('SUPERVISOR_DASHBOARD');
    } catch (err: any) {
      showToast(err.message || 'Error saving request', 'ERROR');
    }
  };

  // Pull-to-refresh simulator
  const handleRefreshLedger = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Ledger and treasury audit balances updated!', 'SUCCESS');
    }, 1200);
  };

  // Database Reset (for developers/reviewers)
  const handleResetDatabase = () => {
    localStorage.removeItem('pc_supervisors');
    localStorage.removeItem('pc_balances');
    localStorage.removeItem('pc_transactions');
    localStorage.removeItem('pc_db_initialized');

    // Reset React State
    setSupervisors(INITIAL_SUPERVISORS);
    setBalances(INITIAL_BALANCES);
    setTransactions(INITIAL_TRANSACTIONS);

    localStorage.setItem('pc_supervisors', JSON.stringify(INITIAL_SUPERVISORS));
    localStorage.setItem('pc_balances', JSON.stringify(INITIAL_BALANCES));
    localStorage.setItem('pc_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('pc_db_initialized', 'true');

    showToast('Demo dataset reset to high-fidelity factory settings.', 'SUCCESS');
  };

  // Quick switch role utility on side controller
  const handleDevSwitchUser = (user: UserType) => {
    setCurrentUser(user);
    localStorage.setItem('pc_logged_user', JSON.stringify(user));
    showToast(`Switched terminal role: ${user.name}`, 'SUCCESS');
    setActiveScreen(user.role === 'OWNER' ? 'OWNER_DASHBOARD' : user.role === 'AUDITOR' ? 'AUDITOR_DASHBOARD' : 'SUPERVISOR_DASHBOARD');
  };

  // Get active supervisor balance
  const activeSupBalance = balances.find((b) => b.supervisorId === currentUser?.id) || {
    supervisorId: currentUser?.id || '',
    supervisorName: currentUser?.name || '',
    allocatedCash: 0,
    spentCash: 0,
    remainingCash: 0
  };

  // Calculate pending returns to subtract from spendable cash
  const pendingReturns = transactions
    .filter(t => t.supervisorId === currentUser?.id && t.type === 'RETURN' && t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  let spendableCash = Math.max(0, activeSupBalance.remainingCash - pendingReturns);
  if (currentUser?.spendLimit && currentUser.spendLimit > 0) {
    const limitRemaining = Math.max(0, currentUser.spendLimit - activeSupBalance.spentCash);
    spendableCash = Math.min(spendableCash, limitRemaining);
  }

  return (
    <div className={`fixed inset-0 w-full h-[100dvh] lg:h-auto lg:relative lg:min-h-screen flex items-center justify-center p-0 lg:p-12 font-sans transition-colors duration-300 overflow-hidden ${darkMode ? 'dark bg-[#0B1C2C] text-slate-100' : 'bg-vibrant-bg text-vibrant-text'
      }`}>
      {/* Decorative radial background glowing nodes */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 pointer-events-none" />

      {/* Main Split Grid (Figma Design Layout) */}
      <div className="max-w-6xl w-full h-full flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center z-10">

        {/* Left Side: Product Specifications (Friendly guide for all ages, highly accessible) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs text-blue-500 font-mono tracking-wider font-bold uppercase">
              Easy & Clear Assistant
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Made for Everyone
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Simple Pocket Money Manager
            </h1>
            <p className={`text-base leading-relaxed max-w-lg font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              A friendly, easy-to-use tool to help you request, spend, and keep track of daily pocket money. We use simple words, large text, and clear steps so you can manage your work without any stress!
            </p>
          </div>

          {/* Quick Features List */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>1. Record an Expense</h3>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Easily write down what you bought. Type numbers in a big, easy-to-see box.</p>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <UserCheck className="w-5 h-5 text-blue-500 mb-2" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>2. Quick Approval</h3>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>The owner can review the items and instantly click "Approve" with a simple checkmark.</p>
            </div>
          </div>


        </div>

        {/* Right Side: High Fidelity Mobile Viewport Frame */}
        <div className="flex-1 flex justify-center w-full h-full lg:col-span-6 lg:h-auto min-h-0">

          {/* Outer Mobile Mockup Bezel Frame */}
          <div className={`w-full h-full lg:max-w-[412px] lg:min-h-[820px] lg:h-[860px] lg:rounded-[48px] lg:border-8 lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] relative overflow-hidden flex flex-col ${darkMode ? 'bg-slate-950 lg:border-slate-850' : 'bg-slate-50 lg:border-slate-200'}`}>

            {/* Dynamic Island Screen Camera Notch */}
            <div className="hidden lg:flex lg:absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 dark:bg-slate-900/90 rounded-full z-50 items-center justify-center border border-white/5 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 mr-2 shadow-sm" />
              <div className="text-[7.5px] text-teal-400 font-bold uppercase">RunB</div>
            </div>

            {/* Mobile Status Bar (Simulated Battery, WiFi, Cellular Signal, and Time) */}
            <div className={`hidden lg:flex px-6 pt-3 pb-1 justify-between items-center text-[10px] font-mono z-40 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-white text-slate-700'
              }`}>
              <div className="font-bold flex items-center">
                <span>{currentTime}</span>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-emerald-500" />
                <Wifi className="w-3.5 h-3.5" />
                <div className="flex items-center gap-0.5">
                  <Battery className="w-4 h-4 text-emerald-500" />
                  <span className="text-[8px] font-bold">100%</span>
                </div>
              </div>
            </div>

            {/* Simulated Frame Screen Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <AnimatePresence mode="wait">
                {activeScreen === 'SPLASH' && (
                  <SplashView key="splash" onComplete={handleSplashComplete} />
                )}

                {activeScreen === 'LOGIN' && (
                  <LoginView
                    key="login"
                    onLoginSuccess={handleLoginSuccess}
                    onGoToSignup={() => setActiveScreen('SIGNUP')}
                    darkMode={darkMode}
                  />
                )}

                {activeScreen === 'SIGNUP' && (
                  <SignupView
                    key="signup"
                    onBackToLogin={() => setActiveScreen('LOGIN')}
                    darkMode={darkMode}
                  />
                )}

                {/* Dashboard views (Include Header, Main view area, and Bottom Navigation) */}
                {activeScreen !== 'SPLASH' && activeScreen !== 'LOGIN' && activeScreen !== 'SIGNUP' && currentUser && (
                  <div className="flex-1 flex flex-col h-full relative">

                    {/* Header */}
                    <DashboardHeader
                      user={currentUser}
                      darkMode={darkMode}
                      onLogout={handleLogout}
                      onRefresh={handleRefreshLedger}
                      isRefreshing={isRefreshing}
                    />

                    {/* Push Notification Banner */}
                    {pushPermissionStatus === 'default' && (
                      <div className="bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between z-10 shadow-sm shrink-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Enable Notifications</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Get alerted for cash transfers instantly.</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setPushPermissionStatus('denied')} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1">Dismiss</button>
                          <button onClick={handleEnablePush} className="bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm hover:bg-primary-dark transition-colors">Enable</button>
                        </div>
                      </div>
                    )}

                    {/* Active Screen View Switch */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">

                      {activeScreen === 'OWNER_DASHBOARD' && (
                        <OwnerDashboardView
                          user={currentUser}
                          supervisors={supervisors.filter((s) => s.isActive !== false)}
                          balances={balances}
                          transactions={transactions}
                          darkMode={darkMode}
                          onAllocateCash={handleAllocateCash}
                          onAddSupervisor={handleAddSupervisor}
                          onReviewTransaction={handleReviewTransaction}
                          onViewTransactionDetails={(tx) => setSelectedTxDetails(tx)}
                          onEditStaff={handleEditStaff}
                          onRemoveStaff={handleRemoveStaff}
                          onCreateTransfer={handleCreateTransfer}
                          onEditAllocation={handleEditAllocation}
                          onViewStaffAudit={(staffId) => {
                            setReportStaffFilter(staffId);
                            setActiveScreen('REPORTS');
                          }}
                        />
                      )}

                      {activeScreen === 'AUDITOR_DASHBOARD' && (
                        <AuditorDashboardView
                          user={currentUser}
                          supervisors={supervisors.filter((s) => s.isActive !== false)}
                          balances={balances}
                          transactions={transactions}
                          darkMode={darkMode}
                          onViewTransactionDetails={(tx) => setSelectedTxDetails(tx)}
                          onNavigate={(screen) => setActiveScreen(screen)}
                          onViewStaffAudit={(staffId) => {
                            setReportStaffFilter(staffId);
                            setActiveScreen('REPORTS');
                          }}
                        />
                      )}

                      {activeScreen === 'SUPERVISOR_DASHBOARD' && (
                        <SupervisorDashboardView
                          user={currentUser}
                          balance={activeSupBalance}
                          spendableCash={spendableCash}
                          transactions={transactions}
                          darkMode={darkMode}
                          onAddExpenseClick={() => setActiveScreen('ADD_EXPENSE')}
                          onReturnCashClick={() => setActiveScreen('RETURN_CASH')}
                          onCollectCashClick={() => setActiveScreen('COLLECT_CASH')}
                          onRequestCashClick={() => setActiveScreen('REQUEST_CASH')}
                          onViewTransactionDetails={(tx) => setSelectedTxDetails(tx)}
                          onEditExpense={(tx) => {
                            setSelectedTxDetails(tx);
                            setActiveScreen('EDIT_EXPENSE');
                          }}
                          onApproveTransfer={handleApproveTransfer}
                          onDeclineTransfer={handleDeclineTransfer}
                          onApproveAllocation={handleApproveAllocation}
                          onRerequestAllocation={handleRerequestAllocation}
                        />
                      )}

                      {activeScreen === 'TRANSACTIONS' && (
                        <TransactionsView
                          transactions={(currentUser.role === 'OWNER' || currentUser.role === 'AUDITOR') ? transactions : transactions.filter(t => t.supervisorId === currentUser.id)}
                          userRole={currentUser.role}
                          darkMode={darkMode}
                          onReviewTransaction={handleReviewTransaction}
                          onEditAllocation={handleEditAllocation}
                          selectedTxDetails={selectedTxDetails}
                          setSelectedTxDetails={setSelectedTxDetails}
                          onEditExpense={(tx) => {
                            setSelectedTxDetails(tx);
                            setActiveScreen('EDIT_EXPENSE');
                          }}
                        />
                      )}

                      {activeScreen === 'ADD_EXPENSE' && (
                        <AddExpenseView
                          onSaveExpense={handleSaveExpense}
                          onCancel={() => setActiveScreen('SUPERVISOR_DASHBOARD')}
                          darkMode={darkMode}
                          availableBalance={spendableCash}
                        />
                      )}

                      {activeScreen === 'RETURN_CASH' && (
                        <ReturnCashView
                          onReturnCash={handleReturnCash}
                          onCancel={() => setActiveScreen('SUPERVISOR_DASHBOARD')}
                          darkMode={darkMode}
                          availableBalance={spendableCash}
                        />
                      )}

                      {activeScreen === 'COLLECT_CASH' && (
                        <CollectCashView
                          onCollectCash={handleCollectCash}
                          onCancel={() => setActiveScreen('SUPERVISOR_DASHBOARD')}
                          darkMode={darkMode}
                        />
                      )}

                      {activeScreen === 'REQUEST_CASH' && (
                        <RequestCashView
                          onRequestCash={handleRequestCash}
                          onCancel={() => setActiveScreen('SUPERVISOR_DASHBOARD')}
                          darkMode={darkMode}
                        />
                      )}

                      {activeScreen === 'EDIT_EXPENSE' && selectedTxDetails && (
                        <EditExpenseView
                          transaction={selectedTxDetails}
                          onUpdateExpense={handleUpdateExpense}
                          onCancel={() => {
                            setActiveScreen('SUPERVISOR_DASHBOARD');
                            setSelectedTxDetails(null);
                          }}
                          darkMode={darkMode}
                          availableBalance={activeSupBalance.remainingCash + selectedTxDetails.amount}
                        />
                      )}

                      {activeScreen === 'REPORTS' && (
                        <ReportsView
                          key={reportStaffFilter || 'reports-all'}
                          transactions={transactions}
                          supervisors={supervisors}
                          userRole={currentUser.role}
                          activeUser={currentUser}
                          darkMode={darkMode}
                          onMarkMistake={handleMarkMistake}
                          onApproveDaily={handleApproveDaily}
                          initialSupFilter={reportStaffFilter || undefined}
                          initialReportType={reportStaffFilter ? 'SUPERVISOR' : undefined}
                        />
                      )}

                      {activeScreen === 'PROFILE' && (
                        <ProfileView
                          user={currentUser}
                          darkMode={darkMode}
                          setDarkMode={setDarkMode}
                          onLogout={handleLogout}
                          onShowToast={showToast}
                          onUpdateUser={setCurrentUser}
                        />
                      )}
                    </div>

                    {/* Navigation bar at bottom of mobile view */}
                    {activeScreen !== 'ADD_EXPENSE' && activeScreen !== 'EDIT_EXPENSE' && activeScreen !== 'RETURN_CASH' && (
                      <BottomNav
                        activeScreen={activeScreen}
                        setActiveScreen={setActiveScreen}
                        userRole={currentUser.role}
                        darkMode={darkMode}
                        onFabClick={() => setActiveScreen('ADD_EXPENSE')}
                      />
                    )}
                  </div>
                )}
              </AnimatePresence>

              {/* Universal Toast Notification Component */}
              <Toast toast={toast} onClose={() => setToast(null)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
