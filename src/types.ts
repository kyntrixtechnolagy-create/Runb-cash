/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'OWNER' | 'SUPERVISOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  designation?: string;
}

export interface SupervisorBalance {
  supervisorId: string;
  supervisorName: string;
  allocatedCash: number;
  spentCash: number;
  remainingCash: number;
}

export type TransactionStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'NEEDS_CORRECTION';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'RETURN';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  supervisorId: string;
  supervisorName: string;
  receiptUrl?: string;
  status: TransactionStatus;
  mistakeNote?: string;
}

export interface PettyCashStats {
  totalCash: number;
  totalSpent: number;
  totalRemaining: number;
  todaySpent: number;
  totalSupervisors: number;
}

export type ActiveScreen =
  | 'SPLASH'
  | 'LOGIN'
  | 'SIGNUP'
  | 'OWNER_DASHBOARD'
  | 'SUPERVISOR_DASHBOARD'
  | 'TRANSACTIONS'
  | 'ADD_EXPENSE'
  | 'EDIT_EXPENSE'
  | 'RETURN_CASH'
  | 'REPORTS'
  | 'PROFILE';

export interface CategoryBudget {
  name: string;
  spent: number;
  color: string;
  icon: string;
}
