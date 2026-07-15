/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, SupervisorBalance, Transaction } from './types';

export const INITIAL_OWNER: User = {
  id: 'owner-1',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@buildcorp.com',
  role: 'OWNER',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  phone: '+1 (555) 019-2834',
  designation: 'Managing Director & CFO'
};

export const INITIAL_SUPERVISORS: User[] = [
  {
    id: 'sup-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@buildcorp.com',
    role: 'SUPERVISOR',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 014-9821',
    designation: 'Site A Construction Manager'
  },
  {
    id: 'sup-2',
    name: 'Maria Chen',
    email: 'maria.chen@buildcorp.com',
    role: 'SUPERVISOR',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 015-8833',
    designation: 'Logistics Operations Lead'
  },
  {
    id: 'sup-3',
    name: 'David Koomson',
    email: 'david.koomson@buildcorp.com',
    role: 'SUPERVISOR',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 018-7711',
    designation: 'HQ Facilities Supervisor'
  }
];

export const INITIAL_BALANCES: SupervisorBalance[] = [
  {
    supervisorId: 'sup-1',
    supervisorName: 'Alex Rivera',
    allocatedCash: 5000,
    spentCash: 3420,
    remainingCash: 1580
  },
  {
    supervisorId: 'sup-2',
    supervisorName: 'Maria Chen',
    allocatedCash: 3000,
    spentCash: 1850,
    remainingCash: 1150
  },
  {
    supervisorId: 'sup-3',
    supervisorName: 'David Koomson',
    allocatedCash: 2000,
    spentCash: 450,
    remainingCash: 1550
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    amount: 5000,
    type: 'INCOME',
    category: 'Allocation',
    description: 'Initial monthly cash allocation - Construction Site A',
    date: '2026-06-01',
    supervisorId: 'sup-1',
    supervisorName: 'Alex Rivera',
    status: 'APPROVED'
  },
  {
    id: 'tx-2',
    amount: 1500,
    type: 'EXPENSE',
    category: 'Materials',
    description: 'Emergency cement bags and rebar ties procurement',
    date: '2026-06-15',
    supervisorId: 'sup-1',
    supervisorName: 'Alex Rivera',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80',
    status: 'APPROVED'
  },
  {
    id: 'tx-3',
    amount: 3000,
    type: 'INCOME',
    category: 'Allocation',
    description: 'Logistics fuel and toll allocation',
    date: '2026-06-01',
    supervisorId: 'sup-2',
    supervisorName: 'Maria Chen',
    status: 'APPROVED'
  },
  {
    id: 'tx-4',
    amount: 420,
    type: 'EXPENSE',
    category: 'Fuel',
    description: 'Diesel top-up for delivery trucks (Fleet B)',
    date: '2026-06-28',
    supervisorId: 'sup-2',
    supervisorName: 'Maria Chen',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80',
    status: 'APPROVED'
  },
  {
    id: 'tx-5',
    amount: 2000,
    type: 'INCOME',
    category: 'Allocation',
    description: 'HQ facilities monthly petty cash quota',
    date: '2026-06-05',
    supervisorId: 'sup-3',
    supervisorName: 'David Koomson',
    status: 'APPROVED'
  },
  {
    id: 'tx-6',
    amount: 250,
    type: 'EXPENSE',
    category: 'Supplies',
    description: 'High-speed HDMI cables & whiteboard markers',
    date: '2026-06-29',
    supervisorId: 'sup-3',
    supervisorName: 'David Koomson',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80',
    status: 'APPROVED'
  },
  {
    id: 'tx-7',
    amount: 780,
    type: 'EXPENSE',
    category: 'Repairs',
    description: 'Main server room air conditioner maintenance service',
    date: '2026-06-29',
    supervisorId: 'sup-1',
    supervisorName: 'Alex Rivera',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80',
    status: 'PENDING'
  },
  {
    id: 'tx-8',
    amount: 630,
    type: 'EXPENSE',
    category: 'Meals',
    description: 'Catered lunch for client inspection team on Site A',
    date: '2026-06-30',
    supervisorId: 'sup-1',
    supervisorName: 'Alex Rivera',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80',
    status: 'PENDING'
  },
  {
    id: 'tx-9',
    amount: 500,
    type: 'EXPENSE',
    category: 'Travel',
    description: 'Express shipping & courier services for client contract',
    date: '2026-06-28',
    supervisorId: 'sup-2',
    supervisorName: 'Maria Chen',
    status: 'APPROVED'
  },
  {
    id: 'tx-10',
    amount: 930,
    type: 'EXPENSE',
    category: 'Equipment',
    description: 'Replacing broken hydraulic jack in warehouse bay 3',
    date: '2026-06-30',
    supervisorId: 'sup-2',
    supervisorName: 'Maria Chen',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80',
    status: 'PENDING'
  }
];

export const INITIAL_CATEGORIES = [
  { name: 'Fuel', icon: 'Fuel', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { name: 'Materials', icon: 'HardHat', color: 'bg-amber-100 text-amber-600 border-amber-200' },
  { name: 'Supplies', icon: 'ShoppingBag', color: 'bg-teal-100 text-teal-600 border-teal-200' },
  { name: 'Repairs', icon: 'Wrench', color: 'bg-red-100 text-red-600 border-red-200' },
  { name: 'Meals', icon: 'Coffee', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { name: 'Allocation', icon: 'Wallet', color: 'bg-green-100 text-green-600 border-green-200' }
];

export const INITIAL_SITES = ['Common', 'Site A', 'Site B', 'Downtown Project', 'Uptown Site'];
export const INITIAL_SUPPLIERS = ['General', 'Vendor A', 'Vendor B', 'Local Store', 'Wholesale Depot'];

export const MOCK_RECEIPTS = [
  { name: 'Home Depot Receipt', url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80' },
  { name: 'Shell Gas Station Invoice', url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400&auto=format&fit=crop&q=80' },
  { name: 'Staples Office Supplies', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80' },
  { name: 'AC Repair Service Receipt', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80' }
];
