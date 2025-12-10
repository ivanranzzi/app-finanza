import React, { useMemo } from 'react';
import { Transaction, Category, Bank } from '../types';
import { formatCurrency, formatDateShort, APP_TIMEZONE } from '../utils/formatters';
import { Edit2, Trash2, Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  banks: Bank[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const IncomeForecast: React.FC<Props> = ({ transactions, categories, banks, onEdit, onDelete }) => {
  
  // Filter and prepare data
  const { groupedData, totalIncome, totalExpense } = useMemo(() => {
    // 1. Filter for non-system categories (exclude initial balances/system rows)
    const relevant = transactions.filter(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return cat && !cat.isSystem;
    });

    // 2. Sort by Date
    relevant.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Group by Month (YYYY-MM)
    const grouped: Record<string, Transaction[]> = {};
    let tIncome = 0;
    let tExpense = 0;

    relevant.forEach(tx => {
      const monthKey = tx.date.substring(0, 7); // "2023-10"
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(tx);

      if (tx.amount >= 0) tIncome += tx.amount;
      else tExpense += tx.amount;
    });

    return { groupedData: grouped, totalIncome: tIncome, totalExpense: tExpense };
  }, [transactions, categories]);

  const getBankName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat || !cat.bankId) return '-';
    const bank = banks.find(b => b.id === cat.bankId);
    return bank ? bank.name : '-';
  };

  const getBankColor = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat || !cat.bankId) return 'bg-gray-100 text-gray-800';
    const bank = banks.find(b => b.id === cat.bankId);
    if (bank?.colorClass.includes('blue')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (bank?.colorClass.includes('teal')) return 'bg-teal-100 text-teal-800 border-teal-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '-';
  };

  const getMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: APP_TIMEZONE }).format(date);
  };

  const sortedMonths = Object.keys(groupedData).sort();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden">
      
      {/* Header Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-green-700">
                   <TrendingUp size={20} />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-gray-500 uppercase">Totale Entrate</h2>
                   <div className="text-xl font-bold text-gray-800">{formatCurrency(totalIncome)}</div>
                </div>
             </div>
         </div>

         <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full text-red-700">
                   <TrendingDown size={20} />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-gray-500 uppercase">Totale Uscite</h2>
                   <div className="text-xl font-bold text-red-700">{formatCurrency(totalExpense)}</div>
                </div>
             </div>
         </div>

         <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                   <Wallet size={20} />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-gray-500 uppercase">Saldo Periodo</h2>
                   <div className={`text-xl font-bold ${totalIncome + totalExpense >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                       {formatCurrency(totalIncome + totalExpense)}
                   </div>
                </div>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {sortedMonths.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
                <p>Nessun movimento registrato.</p>
            </div>
        ) : (
            sortedMonths.map(monthKey => {
                const monthTxs = groupedData[monthKey];
                const monthTotal = monthTxs.reduce((sum, t) => sum + t.amount, 0);
                
                return (
                    <div key={monthKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-gray-700 font-bold capitalize">
                                <Calendar size={16} />
                                {getMonthLabel(monthKey)}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                Saldo Mese: <span className={`font-bold ${monthTotal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(monthTotal)}</span>
                            </div>
                        </div>
                        
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2 font-medium w-32">Data</th>
                                    <th className="px-4 py-2 font-medium w-32">Banca</th>
                                    <th className="px-4 py-2 font-medium">Categoria / Descrizione</th>
                                    <th className="px-4 py-2 font-medium text-right">Importo</th>
                                    <th className="px-4 py-2 font-medium w-24 text-center">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {monthTxs.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-700">
                                            {formatDateShort(new Date(tx.date))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${getBankColor(tx.categoryId)}`}>
                                                {getBankName(tx.categoryId)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{getCategoryName(tx.categoryId)}</div>
                                            {tx.description && (
                                                <div className="text-gray-500 text-xs">{tx.description}</div>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${tx.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => onEdit(tx)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Modifica"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(tx.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Elimina"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};