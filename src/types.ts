/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'OWNER' | 'SUPERVISOR' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  designation?: string;
  spendLimit?: number;
  isActive?: boolean;
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
  | 'AUDITOR_DASHBOARD'
  | 'TRANSACTIONS'
  | 'ADD_EXPENSE'
  | 'EDIT_EXPENSE'
  | 'RETURN_CASH'
  | 'REPORTS'
  | 'PROFILE'
  | 'COLLECT_CASH'
  | 'REQUEST_CASH';

export interface CategoryBudget {
  name: string;
  spent: number;
  color: string;
  icon: string;
}
