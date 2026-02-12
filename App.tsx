
import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Plus, ChevronLeft, ChevronRight, LayoutGrid, CalendarRange, Pencil, Palette, Moon, Sun, Grid3X3, FileBarChart, Users as UsersIcon, LogOut, LayoutDashboard, Download, Mail, Database, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Bank, Category, Transaction, DailyData, User, BackupConfig } from './types';
import { INITIAL_BANKS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_USERS, STORAGE_KEYS, INITIAL_BACKUP_CONFIG } from './constants';
import { formatCurrency, formatDateShort, getDayName, getItalyDateStr } from './utils/formatters';
import { TransactionModal } from './components/TransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { IncomeForecast } from './components/IncomeForecast';
import { BalanceModal } from './components/BalanceModal';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { BackupRestore } from './components/BackupRestore';
import { Dashboard } from './components/Dashboard';

type Tab = 'DASHBOARD' | 'TIMELINE' | 'INCOME' | 'REPORTS' | 'BACKUP' | 'USERS';
type Theme = 'MODERN' | 'EXCEL' | 'NEO';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'NEO');
  const [appTitle, setAppTitle] = useState(() => localStorage.getItem(STORAGE_KEYS.APP_TITLE) || 'FinanzaFlow Pro');
  const [appSubtitle, setAppSubtitle] = useState(() => localStorage.getItem(STORAGE_KEYS.APP_SUBTITLE) || 'Gestione Flussi di Cassa');
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.LOGO));
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'OFFLINE' | 'CONNECTED' | 'ERROR'>('OFFLINE');

  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANKS);
    return saved ? JSON.parse(saved) : INITIAL_BANKS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [startDate, setStartDate] = useState(() => new Date());
  const [daysToShow, setDaysToShow] = useState(14); 
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false);
  const [selectedDateForTx, setSelectedDateForTx] = useState<string>('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingBalanceBank, setEditingBalanceBank] = useState<Bank | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks)); }, [banks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.THEME, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { 
      if(logo) localStorage.setItem(STORAGE_KEYS.LOGO, logo);
      else localStorage.removeItem(STORAGE_KEYS.LOGO);
  }, [logo]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.APP_TITLE, appTitle); }, [appTitle]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.APP_SUBTITLE, appSubtitle); }, [appSubtitle]);

  // Cloud Check
  useEffect(() => {
    const cloudConfig = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
    if (cloudConfig) {
      setCloudStatus('CONNECTED');
    }
  }, []);

  const timelineData = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDateStr = getItalyDateStr(dates[0]);
    const initialBankBalances: Record<string, number> = {};
    banks.forEach(b => {
      const balCat = categories.find(c => c.bankId === b.id && c.isSystem && c.name.includes('Disponibilità liquida'));
      if (balCat) {
          let balance = 0;
          const pastTxs = sortedTx.filter(t => {
             const tCat = categories.find(c => c.id === t.categoryId);
             return t.date < firstDateStr && tCat?.bankId === b.id;
          });
          pastTxs.forEach(t => balance += t.amount);
          initialBankBalances[b.id] = balance;
      } else {
        initialBankBalances[b.id] = 0;
      }
    });
    const data: DailyData[] = [];
    const runningBankBalances = { ...initialBankBalances };
    dates.forEach(date => {
      const dateStr = getItalyDateStr(date);
      const daysTxs = sortedTx.filter(t => t.date === dateStr);
      const categoryAmounts: Record<string, number> = {};
      let predictedIncome = 0;
      let predictedExpense = 0;
      categories.forEach(c => categoryAmounts[c.id] = 0);
      daysTxs.forEach(t => {
        if (categoryAmounts[t.categoryId] !== undefined) categoryAmounts[t.categoryId] += t.amount;
        if (t.amount > 0 && !categories.find(c=>c.id === t.categoryId)?.isSystem) predictedIncome += t.amount;
        if (t.amount < 0 && !categories.find(c=>c.id === t.categoryId)?.isSystem) predictedExpense += t.amount;
        const cat = categories.find(c => c.id === t.categoryId);
        if (cat && cat.bankId) runningBankBalances[cat.bankId] += t.amount;
      });
      let totalRealLiquidity = 0;
      banks.forEach(b => totalRealLiquidity += runningBankBalances[b.id]);
      data.push({
        date, dateStr, totalLiquidity: totalRealLiquidity, realLiquidity: totalRealLiquidity,
        predictedIncome, predictedExpense, bankBalances: { ...runningBankBalances }, categoryAmounts
      });
    });
    return data;
  }, [transactions, banks, categories, startDate, daysToShow]);

  const handleSaveTx = (tx: Transaction) => {
    setTransactions(prev => {
        const index = prev.findIndex(t => t.id === tx.id);
        if (index >= 0) { const c = [...prev]; c[index] = tx; return c; }
        return [...prev, tx];
    });
  };

  const handleUpdateBalance = (amount: number) => {
    if (!editingBalanceBank) return;
    const bankId = editingBalanceBank.id;
    const initTxId = `init_${bankId}`;
    const existingTx = transactions.find(t => t.id === initTxId);
    if (existingTx) {
      setTransactions(prev => prev.map(t => t.id === initTxId ? { ...t, amount } : t));
    } else {
      const balCat = categories.find(c => c.bankId === bankId && c.isSystem && c.name.includes('Disponibilità liquida'));
      if (balCat) {
        const pastDate = new Date(startDate);
        pastDate.setDate(pastDate.getDate() - 1);
        const pastDateStr = getItalyDateStr(pastDate);
        setTransactions(prev => [...prev, {
          id: initTxId, date: pastDateStr, amount: amount, categoryId: balCat.id, description: 'Saldo Iniziale Manuale'
        }]);
      }
    }
  };

  // Fix: Add missing handleUpdateAppConfig function
  const handleUpdateAppConfig = (title: string, subtitle: string, logo: string | null) => {
    setAppTitle(title);
    setAppSubtitle(subtitle);
    setLogo(logo);
  };

  const shiftDate = (days: number) => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + days);
    setStartDate(newDate);
  };
  
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'MODERN') return 'EXCEL';
      if (prev === 'EXCEL') return 'NEO';
      return 'MODERN';
    });
  };

  const isNeo = theme === 'NEO';
  const isModern = theme === 'MODERN';
  const mainBgClass = isNeo ? 'bg-slate-900' : isModern ? 'bg-gray-50' : 'bg-white';
  const textMainClass = isNeo ? 'text-slate-100' : 'text-gray-800';
  const textSubClass = isNeo ? 'text-slate-400' : 'text-gray-500';
  const tableBgClass = isNeo ? 'bg-slate-900' : 'bg-white';

  if (!currentUser) return <Login users={users} onLogin={setCurrentUser} appTitle={appTitle} appSubtitle={appSubtitle} logo={logo} />;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${mainBgClass}`}>
      <header className={`${isNeo ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-30 shadow-sm flex flex-col backdrop-blur-md transition-colors`}>
        <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {logo ? <img src={logo} alt="Logo" className="h-12 w-auto object-contain rounded-md" /> : <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><LayoutGrid size={24} /></div>}
                <div>
                    <h1 className={`text-xl font-bold tracking-tight ${textMainClass}`}>{appTitle}</h1>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs ${textSubClass}`}>{appSubtitle}</p>
                      <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${cloudStatus === 'CONNECTED' ? 'text-green-500' : 'text-gray-400'}`}>
                        {cloudStatus === 'CONNECTED' ? <Cloud size={10} /> : <CloudOff size={10} />}
                        {cloudStatus === 'CONNECTED' ? 'SQL Cloud' : 'Local'}
                      </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {activeTab === 'TIMELINE' && (
                    <div className={`flex rounded-xl p-1 border ${isNeo ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                        <button onClick={() => shiftDate(-7)} className="p-2 rounded-lg hover:bg-white transition-all"><ChevronLeft size={16}/></button>
                        <div className="px-4 py-2 text-sm font-semibold min-w-[120px] text-center border-x">{formatDateShort(startDate)}</div>
                        <button onClick={() => shiftDate(7)} className="p-2 rounded-lg hover:bg-white transition-all"><ChevronRight size={16}/></button>
                    </div>
                )}
                <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600">
                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Sync</span>
                </button>
                <button onClick={() => { setEditingTx(null); setSelectedDateForTx(''); setIsTxModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white text-sm font-medium">+ Novo</button>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-lg text-gray-600"><Settings size={20} /></button>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${textMainClass}`}>{currentUser.username}</span>
                    <button onClick={() => setCurrentUser(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={18} /></button>
                </div>
            </div>
        </div>
        <div className="px-6 flex gap-8 text-sm font-medium border-t overflow-x-auto">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`py-3 border-b-2 ${activeTab === 'DASHBOARD' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}><LayoutDashboard size={16} /> Riepilogo</button>
            <button onClick={() => setActiveTab('TIMELINE')} className={`py-3 border-b-2 ${activeTab === 'TIMELINE' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}><LayoutGrid size={16} /> Timeline</button>
            <button onClick={() => setActiveTab('INCOME')} className={`py-3 border-b-2 ${activeTab === 'INCOME' ? 'border-yellow-600 text-yellow-700' : 'border-transparent text-gray-500'}`}><CalendarRange size={16} /> Movimenti</button>
            <button onClick={() => setActiveTab('REPORTS')} className={`py-3 border-b-2 ${activeTab === 'REPORTS' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500'}`}><FileBarChart size={16} /> Report</button>
            <button onClick={() => setActiveTab('BACKUP')} className={`py-3 border-b-2 ${activeTab === 'BACKUP' ? 'border-orange-600 text-orange-700' : 'border-transparent text-gray-500'}`}><Database size={16} /> SQL / Backup</button>
            {currentUser.role === 'MASTER' && <button onClick={() => setActiveTab('USERS')} className={`py-3 border-b-2 ${activeTab === 'USERS' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}><UsersIcon size={16} /> Utenti</button>}
        </div>
      </header>
      {activeTab === 'DASHBOARD' && <Dashboard transactions={transactions} categories={categories} banks={banks} username={currentUser.name} />}
      {activeTab === 'TIMELINE' && (
        <main className="flex-1 overflow-hidden flex flex-col p-4">
            <div className={`flex-1 rounded-2xl shadow-sm flex flex-col overflow-hidden relative border ${isNeo ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-auto timeline-scroll flex-1">
                    <table className="border-collapse w-full min-w-max text-sm">
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th className="sticky left-0 z-30 p-3 text-left font-bold min-w-[300px] w-[300px] bg-gray-50 border-b">DESCRIZIONE / DATA</th>
                                {timelineData.map((day, i) => (
                                    <th key={i} className="min-w-[120px] p-3 text-center border-b bg-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase">{getDayName(day.date)}</span>
                                            <span className="text-sm font-bold text-gray-700">{formatDateShort(day.date).slice(0, 5)}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-emerald-600 text-white font-bold">
                                <td className="sticky left-0 z-10 p-3">FABBISOGNO / PROSPETTICO</td>
                                {timelineData.map((day, i) => <td key={i} className="p-2 text-right">{formatCurrency(day.totalLiquidity)}</td>)}
                            </tr>
                            {banks.map(bank => (
                                <React.Fragment key={bank.id}>
                                    <tr className={`${bank.colorClass} font-bold border-t-2 border-gray-200`}>
                                        <td className="sticky left-0 z-10 p-2 pl-4">{bank.name}</td>
                                        {timelineData.map((day, i) => <td key={i} className="p-2 text-right">{formatCurrency(day.bankBalances[bank.id] || 0)}</td>)}
                                    </tr>
                                    {categories.filter(c => c.bankId === bank.id && !c.isSystem).map(cat => (
                                        <tr key={cat.id} className="hover:bg-gray-50 border-b border-gray-100">
                                            <td className="sticky left-0 z-10 p-2 pl-8 text-gray-500 text-xs bg-white">{cat.name}</td>
                                            {timelineData.map((day, i) => {
                                                const val = day.categoryAmounts[cat.id] || 0;
                                                return <td key={i} className={`p-2 text-right text-xs font-mono ${val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-300'}`}>{val !== 0 ? formatCurrency(val) : '-'}</td>
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
      )}
      {activeTab === 'INCOME' && <IncomeForecast transactions={transactions} categories={categories} banks={banks} onEdit={(tx) => { setEditingTx(tx); setIsTxModalOpen(true); }} onDelete={(id) => setTransactions(p => p.filter(t => t.id !== id))} />}
      {activeTab === 'REPORTS' && <Reports transactions={transactions} banks={banks} categories={categories} logo={logo} onLogoUpload={setLogo} />}
      {activeTab === 'BACKUP' && <BackupRestore banks={banks} categories={categories} transactions={transactions} users={users} theme={theme} logo={logo} />}
      {activeTab === 'USERS' && currentUser.role === 'MASTER' && <UserManagement users={users} onAddUser={u => setUsers([...users, u])} onUpdateUser={u => setUsers(p => p.map(x => x.id === u.id ? u : x))} onDeleteUser={id => setUsers(p => p.filter(x => x.id !== id))} currentUserId={currentUser.id} />}
      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSave={handleSaveTx} banks={banks} categories={categories} initialDate={selectedDateForTx} transactionToEdit={editingTx} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} banks={banks} categories={categories} onAddBank={(b) => setBanks([...banks, b])} onAddCategory={(c) => setCategories([...categories, c])} appTitle={appTitle} appSubtitle={appSubtitle} appLogo={logo} onUpdateAppConfig={handleUpdateAppConfig} />
      <BalanceModal isOpen={!!editingBalanceBank} onClose={() => setEditingBalanceBank(null)} onSave={handleUpdateBalance} bankName={editingBalanceBank?.name || ''} currentAmount={editingBalanceBank ? (transactions.find(t => t.id === `init_${editingBalanceBank.id}`)?.amount || 0) : 0} />
    </div>
  );
}

export default App;
