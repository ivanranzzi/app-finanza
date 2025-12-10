
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  OPENING_BALANCE = 'OPENING_BALANCE', // For initial bank balance
}

export type UserRole = 'MASTER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed. Local storage demo only.
  role: UserRole;
  name: string;
}

export interface Bank {
  id: string;
  name: string;
  colorClass: string; // Tailwind class for styling rows related to this bank
}

export interface Category {
  id: string;
  name: string;
  bankId: string | null; // null if it's a general category or a summary row, otherwise specific to a bank
  isSystem?: boolean; // If true, cannot be deleted (e.g., standard bank rows)
  isCreditLine?: boolean; // If true, it's a static value like "Fido"
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  amount: number;
  categoryId: string;
  description?: string;
  isRecurring?: boolean;
}

export interface DailyData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  totalLiquidity: number; // FABBISOGNO
  realLiquidity: number; // DISPONIBILITA' LIQUIDA REALE
  predictedIncome: number; // INCASSI
  predictedExpense: number; // SPESE
  bankBalances: Record<string, number>; // bankId -> balance
  categoryAmounts: Record<string, number>; // categoryId -> total amount for day
}
