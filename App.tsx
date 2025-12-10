
import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Plus, ChevronLeft, ChevronRight, LayoutGrid, CalendarRange, Pencil, Palette, Moon, Sun, Grid3X3, FileBarChart, Users as UsersIcon, LogOut, LayoutDashboard, Download, Mail, Database } from 'lucide-react';
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
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- App Data State ---
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [theme, setTheme] = useState<Theme>(() => {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'NEO';
  });
  
  // Customization State
  const [appTitle, setAppTitle] = useState(() => localStorage.getItem(STORAGE_KEYS.APP_TITLE) || 'FinanzaFlow Pro');
  const [appSubtitle, setAppSubtitle] = useState(() => localStorage.getItem(STORAGE_KEYS.APP_SUBTITLE) || 'Gestione Flussi di Cassa');
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.LOGO));

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
  
  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false); // New Modal State
  const [selectedDateForTx, setSelectedDateForTx] = useState<string>('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingBalanceBank, setEditingBalanceBank] = useState<Bank | null>(null);

  // --- Persistence ---
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

  // --- Automatic Backup Logic ---
  useEffect(() => {
    if (!currentUser) return; // Only check if logged in

    const checkBackup = () => {
        const configStr = localStorage.getItem(STORAGE_KEYS.BACKUP_CONFIG);
        const config: BackupConfig = configStr ? JSON.parse(configStr) : INITIAL_BACKUP_CONFIG;

        if (!config.enabled) return;

        const today = new Date();
        const currentDayOfWeek = today.getDay().toString(); // 0-6
        const dateStr = getItalyDateStr(today);

        // Check Time
        const [targetHour, targetMinute] = (config.time || '09:00').split(':').map(Number);
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        
        // Is it time? (Current time >= Target time)
        const isTimeDue = currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

        // Logic: If Today matches Config Day AND we haven't backed up today yet AND it is past the time
        if (config.dayOfWeek === currentDayOfWeek && config.lastBackupDate !== dateStr && isTimeDue) {
            setShowAutoBackupModal(true);
        }
    };
    
    checkBackup();
    
    // Check every minute just in case app is left open
    const interval = setInterval(checkBackup, 60000);
    return () => clearInterval(interval);

  }, [currentUser]);

  const handleExecuteAutoBackup = () => {
      const configStr = localStorage.getItem(STORAGE_KEYS.BACKUP_CONFIG);
      let config: BackupConfig = configStr ? JSON.parse(configStr) : INITIAL_BACKUP_CONFIG;

      // 1. Generate Backup Data
      const dataToBackup = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
              banks: localStorage.getItem(STORAGE_KEYS.BANKS),
              categories: localStorage.getItem(STORAGE_KEYS.CATEGORIES),
              transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
              users: localStorage.getItem(STORAGE_KEYS.USERS),
              theme: localStorage.getItem(STORAGE_KEYS.THEME),
              logo: localStorage.getItem(STORAGE_KEYS.LOGO)
          }
      };

      const jsonString = JSON.stringify(dataToBackup, null, 2);
      const fileName = `finanzaflow_auto_backup_${getItalyDateStr(new Date())}.json`;

      // 2. Download File
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 3. Update Config (Last Backup Date & History)
      const newHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          fileName: fileName,
          sizeBytes: blob.size,
          dataSnapshot: jsonString
      };

      // Add to history, sort by date desc, keep max 5
      const updatedHistory = [newHistoryItem, ...(config.history || [])]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

      config.lastBackupDate = getItalyDateStr(new Date());
      config.history = updatedHistory;

      localStorage.setItem(STORAGE_KEYS.BACKUP_CONFIG, JSON.stringify(config));

      // 4. Open Email Client
      if (config.email) {
          const subject = encodeURIComponent("Backup Automatico FinanzaFlow");
          const body = encodeURIComponent(`In allegato trovi il backup settimanale generato automaticamente.\n\nFile: ${fileName}\nData: ${new Date().toLocaleDateString()}`);
          window.open(`mailto:${config.email}?subject=${subject}&body=${body}`, '_self');
      }

      setShowAutoBackupModal(false);
  };

  // --- Calculation ---
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
        date,
        dateStr,
        totalLiquidity: totalRealLiquidity, // Fabbisogno matches Real Liquidity in this model
        realLiquidity: totalRealLiquidity,
        predictedIncome,
        predictedExpense,
        bankBalances: { ...runningBankBalances },
        categoryAmounts
      });
    });
    return data;
  }, [transactions, banks, categories, startDate, daysToShow]);

  // --- Helpers ---
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

  const handleAddUser = (u: User) => {
      setUsers([...users, u]);
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleUpdateAppConfig = (title: string, subtitle: string, newLogo: string | null) => {
      setAppTitle(title);
      setAppSubtitle(subtitle);
      setLogo(newLogo);
  };

  // --- Styles Generators ---
  const isNeo = theme === 'NEO';
  const isModern = theme === 'MODERN';

  // Base layout classes
  const mainBgClass = isNeo ? 'bg-slate-900' : isModern ? 'bg-gray-50' : 'bg-white';
  const textMainClass = isNeo ? 'text-slate-100' : 'text-gray-800';
  const textSubClass = isNeo ? 'text-slate-400' : 'text-gray-500';
  const tableBgClass = isNeo ? 'bg-slate-900' : 'bg-white';

  const getHeaderCellClass = () => {
    if (isNeo) return "min-w-[120px] p-3 text-center bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 first:rounded-tl-xl";
    if (isModern) return "min-w-[120px] p-3 text-center bg-gray-50 border-b border-gray-200";
    return "min-w-[120px] border-b border-r border-gray-200 p-2 text-center bg-[#f2f2f2]";
  };

  const getFabbisognoClass = () => {
    if (isNeo) return "bg-gradient-to-r from-indigo-900 to-purple-900 text-white border-b border-slate-700 shadow-lg shadow-indigo-900/20";
    if (isModern) return "bg-slate-800 text-white border-b border-gray-700";
    return "bg-[#00b050] text-white border-b border-r border-green-600";
  };

  const getRealeClass = () => {
    if (isNeo) return "bg-slate-800/80 text-slate-200 border-b border-slate-700";
    if (isModern) return "bg-slate-100 text-slate-700 border-b border-gray-200 font-semibold";
    return "bg-[#92d050] text-gray-900 border-b border-r border-green-400";
  };

  const getIncomeClass = () => {
    if (isNeo) return "bg-slate-900 text-emerald-400 border-b border-slate-800";
    if (isModern) return "bg-emerald-50 text-emerald-700 border-b border-gray-100";
    return "bg-[#ffff00] text-gray-800 border-b border-r border-yellow-400";
  };
    
  const getExpenseClass = () => {
    if (isNeo) return "bg-slate-900 text-rose-400 border-b border-slate-800";
    if (isModern) return "bg-rose-50 text-rose-700 border-b border-gray-100";
    return "bg-[#ffff00] text-red-700 border-b border-r border-yellow-400";
  };

  const getBankHeaderClass = (bank: Bank) => {
    if (isNeo) return "bg-slate-800 text-slate-200 border-y border-slate-700";
    if (isModern) return `${bank.colorClass} bg-opacity-30 border-t border-b border-gray-200 text-gray-800`;
    return `${bank.colorClass} border-t-2 border-gray-400`;
  };

  const getCellBaseClass = () => {
    if (isNeo) return "p-2 text-right text-xs border-b border-slate-800 font-mono tracking-tight text-slate-300 hover:bg-slate-800 transition-colors";
    if (isModern) return "p-2 text-right text-xs border-b border-gray-100 font-mono tracking-tight";
    return "border-b border-r border-gray-100 p-2 text-right text-xs";
  };

  const getThemeIcon = () => {
    if (theme === 'NEO') return <Moon size={16} />;
    if (theme === 'MODERN') return <Grid3X3 size={16} />;
    return <Sun size={16} />;
  }

  const getThemeLabel = () => {
     if (theme === 'NEO') return 'Neo Dark';
     if (theme === 'MODERN') return 'Moderno';
     return 'Excel';
  }

  // --- Auth Check ---
  if (!currentUser) {
      return (
        <Login 
            users={users} 
            onLogin={setCurrentUser} 
            appTitle={appTitle} 
            appSubtitle={appSubtitle} 
            logo={logo} 
        />
      );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${mainBgClass}`}>
      
      {/* Header */}
      <header className={`${isNeo ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-30 shadow-sm flex flex-col backdrop-blur-md transition-colors`}>
        <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {logo ? (
                    <img src={logo} alt="Logo Azienda" className="h-12 w-auto object-contain rounded-md" />
                ) : (
                    <div className={`${isNeo ? 'bg-indigo-500' : isModern ? 'bg-indigo-600' : 'bg-green-600'} p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30`}>
                        <LayoutGrid size={24} />
                    </div>
                )}
                <div>
                    <h1 className={`text-xl font-bold tracking-tight ${textMainClass}`}>{appTitle}</h1>
                    <p className={`text-xs ${textSubClass}`}>{appSubtitle}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {activeTab === 'TIMELINE' && (
                    <div className={`flex rounded-xl p-1 border ${isNeo ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                        <button onClick={() => shiftDate(-7)} className={`p-2 rounded-lg shadow-sm transition-all ${isNeo ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-white text-gray-600'}`}><ChevronLeft size={16}/></button>
                        <div className={`px-4 py-2 text-sm font-semibold min-w-[120px] text-center border-x ${isNeo ? 'text-slate-200 bg-slate-800 border-slate-700' : 'text-gray-700 bg-white border-gray-200'}`}>
                            {formatDateShort(startDate)}
                        </div>
                        <button onClick={() => shiftDate(7)} className={`p-2 rounded-lg shadow-sm transition-all ${isNeo ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-white text-gray-600'}`}><ChevronRight size={16}/></button>
                    </div>
                )}

                <div className={`h-6 w-px mx-2 ${isNeo ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
            
                <button 
                    onClick={toggleTheme}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isNeo ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700 border border-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Cambia Tema"
                >
                    {getThemeIcon()}
                    <span className="hidden sm:inline">{getThemeLabel()}</span>
                </button>

                {activeTab !== 'USERS' && activeTab !== 'DASHBOARD' && activeTab !== 'BACKUP' && (
                    <button 
                        onClick={() => { setEditingTx(null); setSelectedDateForTx(''); setIsTxModalOpen(true); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all text-sm font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${isNeo ? 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20' : isModern ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nuovo</span>
                    </button>
                )}
                
                <button 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className={`p-2 rounded-lg transition-colors ${isNeo ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <Settings size={20} />
                </button>

                <div className={`h-6 w-px mx-2 ${isNeo ? 'bg-slate-700' : 'bg-gray-300'}`}></div>

                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${textMainClass}`}>{currentUser.username}</span>
                    <button 
                        onClick={() => setCurrentUser(null)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>

        <div className={`px-6 flex gap-8 text-sm font-medium border-t overflow-x-auto ${isNeo ? 'border-slate-800 text-slate-500' : 'border-gray-100 text-gray-500'}`}>
            <button 
                onClick={() => setActiveTab('DASHBOARD')}
                className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'DASHBOARD' ? (isNeo ? 'border-indigo-500 text-indigo-400' : isModern ? 'border-indigo-600 text-indigo-700' : 'border-green-600 text-green-700') : 'border-transparent hover:text-gray-700'}`}
            >
                <LayoutDashboard size={16} />
                Riepilogo
            </button>
            <button 
                onClick={() => setActiveTab('TIMELINE')}
                className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'TIMELINE' ? (isNeo ? 'border-indigo-500 text-indigo-400' : isModern ? 'border-indigo-600 text-indigo-700' : 'border-green-600 text-green-700') : 'border-transparent hover:text-gray-700'}`}
            >
                <LayoutGrid size={16} />
                Timeline Flusso
            </button>
            <button 
                onClick={() => setActiveTab('INCOME')}
                className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'INCOME' ? 'border-yellow-500 text-yellow-600' : 'border-transparent hover:text-gray-700'}`}
            >
                <CalendarRange size={16} />
                Dettaglio Movimenti
            </button>
            <button 
                onClick={() => setActiveTab('REPORTS')}
                className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'REPORTS' ? 'border-purple-500 text-purple-600' : 'border-transparent hover:text-gray-700'}`}
            >
                <FileBarChart size={16} />
                Report
            </button>
            <button 
                onClick={() => setActiveTab('BACKUP')}
                className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'BACKUP' ? 'border-orange-500 text-orange-600' : 'border-transparent hover:text-gray-700'}`}
            >
                <Database size={16} />
                Backup / Restore
            </button>
            
            {currentUser.role === 'MASTER' && (
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`py-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'USERS' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-gray-700'}`}
                >
                    <UsersIcon size={16} />
                    Utenti
                </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'DASHBOARD' && (
          <Dashboard transactions={transactions} categories={categories} banks={banks} username={currentUser.name} />
      )}

      {activeTab === 'TIMELINE' && (
        <main className="flex-1 overflow-hidden flex flex-col p-4 transition-colors">
            <div className={`flex-1 rounded-2xl shadow-sm flex flex-col overflow-hidden relative border transition-colors ${isNeo ? 'bg-slate-900 border-slate-700 shadow-xl shadow-black/20' : isModern ? 'bg-white border-gray-200' : 'bg-white border-gray-300'}`}>
            
            <div className="overflow-auto timeline-scroll flex-1">
                <table className="border-collapse w-full min-w-max text-sm">
                <thead className={`sticky top-0 z-20 shadow-sm backdrop-blur-md ${isNeo ? 'bg-slate-900/90' : ''}`}>
                    <tr>
                    <th className={`sticky left-0 z-30 p-3 text-left font-bold min-w-[300px] w-[300px] border-b ${isNeo ? 'bg-slate-900 text-slate-300 border-slate-700' : isModern ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-100 border-r border-gray-300 text-gray-700'}`}>
                        DESCRIZIONE / DATA
                    </th>
                    {timelineData.map((day, i) => (
                        <th key={i} className={getHeaderCellClass()}>
                            <div className="flex flex-col items-center justify-center">
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isNeo ? 'text-indigo-400' : 'text-gray-400'}`}>{getDayName(day.date)}</span>
                                <span className={`text-sm font-bold ${isNeo ? 'text-white' : isModern ? 'text-gray-700' : 'text-gray-800'}`}>
                                    {formatDateShort(day.date).slice(0, 5)}
                                </span>
                                <button 
                                    onClick={() => { setEditingTx(null); setSelectedDateForTx(day.dateStr); setIsTxModalOpen(true); }}
                                    className={`mt-1 opacity-0 hover:opacity-100 text-[10px] px-2 py-0.5 rounded transition-opacity ${isNeo ? 'bg-slate-700 text-indigo-300 hover:bg-slate-600' : isModern ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    +
                                </button>
                            </div>
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody className={tableBgClass}>
                    {/* --- SUMMARY --- */}
                    <tr className={getFabbisognoClass()}>
                        <td className={`sticky left-0 z-10 p-3 font-bold text-xs uppercase truncate ${getFabbisognoClass()} ${!isNeo && !isModern && 'border-r border-green-600'}`}>
                            FABBISOGNO / PROSPETTICO
                        </td>
                        {timelineData.map((day, i) => (
                            <td key={i} className={`p-2 text-right font-bold text-sm font-mono ${!isNeo && !isModern && 'border-r border-green-600'}`}>
                                {formatCurrency(day.totalLiquidity)}
                            </td>
                        ))}
                    </tr>
                    <tr className={getRealeClass()}>
                        <td className={`sticky left-0 z-10 p-3 font-bold text-xs uppercase truncate ${getRealeClass()} ${!isNeo && !isModern && 'border-r border-green-400'}`}>
                            DISPONIBILITA' REALE
                        </td>
                        {timelineData.map((day, i) => (
                            <td key={i} className={`p-2 text-right font-medium font-mono ${!isNeo && !isModern && 'border-r border-green-400'}`}>
                                {formatCurrency(day.realLiquidity)}
                            </td>
                        ))}
                    </tr>
                    <tr className={getIncomeClass()}>
                        <td className={`sticky left-0 z-10 p-3 font-bold text-xs uppercase truncate ${getIncomeClass()} ${!isNeo && !isModern && 'border-r border-yellow-400'}`}>
                            INCASSI PREVISIONALI
                        </td>
                        {timelineData.map((day, i) => (
                            <td key={i} className={`p-2 text-right font-medium font-mono ${!isNeo && !isModern && 'border-r border-yellow-400'}`}>
                                {day.predictedIncome !== 0 ? formatCurrency(day.predictedIncome) : '-'}
                            </td>
                        ))}
                    </tr>
                    <tr className={getExpenseClass()}>
                        <td className={`sticky left-0 z-10 p-3 font-bold text-xs uppercase truncate ${getExpenseClass()} ${!isNeo && !isModern && 'border-r border-yellow-400'}`}>
                            SPESE PREVISIONALI
                        </td>
                        {timelineData.map((day, i) => (
                            <td key={i} className={`p-2 text-right font-medium font-mono ${!isNeo && !isModern && 'border-r border-yellow-400'}`}>
                                {day.predictedExpense !== 0 ? formatCurrency(day.predictedExpense) : '-'}
                            </td>
                        ))}
                    </tr>

                    <tr className={`h-6 border-b ${isNeo ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}><td colSpan={daysToShow + 1}></td></tr>

                    {/* --- BANKS --- */}
                    {banks.map(bank => {
                    const bankCats = categories.filter(c => c.bankId === bank.id);
                    bankCats.sort((a, b) => (a.isSystem ? -1 : b.isSystem ? 1 : 0));

                    return (
                        <React.Fragment key={bank.id}>
                        {bankCats.filter(c => c.isSystem).map(cat => (
                            <tr key={cat.id} className={getBankHeaderClass(bank)}>
                                <td className={`sticky left-0 z-10 p-2 font-bold text-sm truncate ${getBankHeaderClass(bank)} ${!isNeo && !isModern && 'border-r border-gray-300'}`}>
                                    <div className="flex justify-between items-center w-full group">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1 h-6 rounded-full ${isNeo ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50' : isModern ? 'bg-indigo-500' : 'bg-blue-600'}`}></div>
                                        <span>{bank.name} <span className={`text-xs font-normal ml-1 ${isNeo ? 'text-slate-400' : 'text-gray-500'} italic`}>(Saldo Disponibile)</span></span>
                                      </div>
                                      <button onClick={() => setEditingBalanceBank(bank)} className={`opacity-0 group-hover:opacity-100 p-1 rounded ${isNeo ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-black/10'}`}>
                                        <Pencil size={14} />
                                      </button>
                                    </div>
                                </td>
                                {timelineData.map((day, i) => (
                                    <td 
                                        key={i} 
                                        className={`p-2 text-right font-bold cursor-pointer relative group/cell font-mono ${isNeo ? 'text-white hover:bg-slate-700' : 'text-gray-800 hover:bg-black/5'} ${!isNeo && !isModern && 'border-r border-blue-200'}`}
                                        onClick={() => setEditingBalanceBank(bank)}
                                    >
                                        {formatCurrency(day.bankBalances[bank.id] || 0)}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {bankCats.filter(c => !c.isSystem).map(cat => (
                            <tr key={cat.id} className={`transition-colors group ${isNeo ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
                                <td className={`sticky left-0 z-10 p-2 text-xs font-medium truncate pl-8 border-l-4 ${isNeo ? 'bg-slate-900 group-hover:bg-slate-800/50 text-slate-400 border-l-transparent border-b border-slate-800' : isModern ? 'bg-white group-hover:bg-gray-50 text-gray-500 border-l-transparent' : 'bg-white group-hover:bg-gray-50 text-gray-600 border-l-transparent border-r border-gray-200'}`} title={cat.name}>
                                    {cat.name}
                                </td>
                                {timelineData.map((day, i) => {
                                    const val = day.categoryAmounts[cat.id] || 0;
                                    
                                    let colorClass = 'text-gray-300';
                                    if (val > 0) colorClass = isNeo ? 'text-emerald-400 font-bold' : isModern ? 'text-emerald-600' : 'text-green-700';
                                    else if (val < 0) colorClass = isNeo ? 'text-rose-400 font-bold' : isModern ? 'text-rose-600' : 'text-red-600';
                                    else colorClass = isNeo ? 'text-slate-700' : 'text-gray-300';

                                    return (
                                        <td key={i} className={getCellBaseClass()}>
                                            <span className={`${colorClass} font-medium`}>
                                                {val !== 0 ? formatCurrency(val) : '-'}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        <tr className={`h-4 border-b ${isNeo ? 'bg-transparent border-slate-800' : 'bg-transparent border-gray-100'}`}><td colSpan={daysToShow + 1}></td></tr>
                        </React.Fragment>
                    );
                    })}
                </tbody>
                </table>
            </div>
            </div>
        </main>
      )}

      {activeTab === 'INCOME' && (
        <IncomeForecast 
            transactions={transactions}
            categories={categories}
            banks={banks}
            onEdit={(tx) => { setEditingTx(tx); setIsTxModalOpen(true); }}
            onDelete={(id) => { if(confirm('Eliminare?')) setTransactions(p => p.filter(t => t.id !== id)); }}
        />
      )}

      {activeTab === 'REPORTS' && (
        <Reports 
            transactions={transactions}
            banks={banks}
            categories={categories}
            logo={logo}
            onLogoUpload={setLogo}
        />
      )}
      
      {activeTab === 'BACKUP' && (
          <BackupRestore 
            banks={banks}
            categories={categories}
            transactions={transactions}
            users={users}
            theme={theme}
            logo={logo}
          />
      )}

      {activeTab === 'USERS' && currentUser.role === 'MASTER' && (
          <UserManagement 
            users={users} 
            onAddUser={handleAddUser} 
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            currentUserId={currentUser.id}
          />
      )}

      {/* AUTO BACKUP MODAL */}
      {showAutoBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-purple-600 p-6 flex flex-col items-center text-center text-white">
                    <div className="bg-white/20 p-3 rounded-full mb-3">
                        <Download size={32} />
                    </div>
                    <h2 className="text-xl font-bold">Backup Automatico Richiesto</h2>
                    <p className="text-purple-100 text-sm mt-1">
                        È programmato un backup per oggi.
                    </p>
                </div>
                
                <div className="p-6">
                    <p className="text-gray-600 text-sm mb-6 text-center">
                        Clicca qui sotto per scaricare il file di salvataggio e aprire automaticamente il tuo client di posta per l'invio.
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={handleExecuteAutoBackup}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Esegui e Invia Email
                        </button>
                        <button 
                            onClick={() => setShowAutoBackupModal(false)}
                            className="w-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors"
                        >
                            Ricordamelo più tardi
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTx}
        banks={banks}
        categories={categories}
        initialDate={selectedDateForTx}
        transactionToEdit={editingTx}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        banks={banks} 
        categories={categories} 
        onAddBank={(b) => setBanks([...banks, b])} 
        onAddCategory={(c) => setCategories([...categories, c])}
        appTitle={appTitle}
        appSubtitle={appSubtitle}
        appLogo={logo}
        onUpdateAppConfig={handleUpdateAppConfig}
      />
      <BalanceModal isOpen={!!editingBalanceBank} onClose={() => setEditingBalanceBank(null)} onSave={handleUpdateBalance} bankName={editingBalanceBank?.name || ''} currentAmount={editingBalanceBank ? (transactions.find(t => t.id === `init_${editingBalanceBank.id}`)?.amount || 0) : 0} />
    </div>
  );
}

export default App;
