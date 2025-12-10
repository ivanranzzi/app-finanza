
import { Bank, Category, Transaction, TransactionType, User, BackupConfig } from './types';
import { v4 as uuidv4 } from 'uuid'; 

export const generateId = () => Math.random().toString(36).substr(2, 9);

// Keys used for LocalStorage
export const STORAGE_KEYS = {
  BANKS: 'ff_banks_v2',
  CATEGORIES: 'ff_categories_v2',
  TRANSACTIONS: 'ff_transactions_v2',
  THEME: 'ff_theme_v2',
  LOGO: 'ff_logo_v1',
  USERS: 'ff_users_v1',
  BACKUP_CONFIG: 'ff_backup_config_v1'
};

export const INITIAL_USERS: User[] = [
  { id: 'user_master', username: 'admin', password: '1234', role: 'MASTER', name: 'Super Admin' }
];

export const INITIAL_BACKUP_CONFIG: BackupConfig = {
  enabled: false,
  email: '',
  dayOfWeek: '5', // Default Friday
  time: '09:00', // Default 9 AM
  lastBackupDate: '',
  history: []
};

export const INITIAL_BANKS: Bank[] = [
  { id: 'bank_intesa', name: 'INTESA', colorClass: 'bg-blue-100' },
  { id: 'bank_marca', name: 'MARCA', colorClass: 'bg-teal-100' },
];

export const INITIAL_CATEGORIES: Category[] = [
  // --- BANK INTESA Categories ---
  { id: 'cat_intesa_balance', name: 'Disponibilità liquida BANCA INTESA C/C', bankId: 'bank_intesa', isSystem: true },
  { id: 'cat_intesa_fido', name: 'FIDO DI CONTO', bankId: 'bank_intesa', isCreditLine: true },
  { id: 'cat_intesa_anticipo', name: 'ANTICIPO FATTURE (VISUALIZZAZIONE)', bankId: 'bank_intesa' },
  { id: 'cat_intesa_incassi', name: 'INCASSI PER CREDITI NON ANTICIPATI', bankId: 'bank_intesa' },
  { id: 'cat_intesa_fornitori', name: 'FORNITORI VARI, SPESE, COSTI', bankId: 'bank_intesa' },
  { id: 'cat_intesa_paghe', name: 'PAGHE DIPENDENTI', bankId: 'bank_intesa' },
  { id: 'cat_intesa_f24', name: 'F24, VECCHIE RATEAZIONI', bankId: 'bank_intesa' },
  
  // --- BANK MARCA Categories ---
  { id: 'cat_marca_balance', name: 'Disponibilità liquida BANCA DELLA MARCA', bankId: 'bank_marca', isSystem: true },
  { id: 'cat_marca_fido', name: 'FIDO DI CONTO', bankId: 'bank_marca', isCreditLine: true },
  { id: 'cat_marca_anticipo', name: 'ANTICIPO FATTURE', bankId: 'bank_marca' },
  { id: 'cat_marca_incassi', name: 'INCASSI PER CREDITI', bankId: 'bank_marca' },
  { id: 'cat_marca_fornitori', name: 'FORNITORI VARI, SPESE', bankId: 'bank_marca' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Starting empty to ensure clean slate with 0 balance
];
