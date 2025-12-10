
import React, { useMemo } from 'react';
import { Transaction, Category, Bank } from '../types';
import { formatCurrency, formatDateShort, getItalyDateStr, getDayName, APP_TIMEZONE } from '../utils/formatters';
import { TrendingUp, TrendingDown, Calendar, Wallet, ArrowRight, Activity } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  banks: Bank[];
  username: string;
}

export const Dashboard: React.FC<Props> = ({ transactions, categories, banks, username }) => {

  // --- Logic: Next 5 Days ---
  const next5DaysData = useMemo(() => {
    const today = new Date();
    const days = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = getItalyDateStr(d);
      
      let income = 0;
      let expense = 0;

      transactions.filter(t => t.date === dateStr).forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        if (cat && !cat.isSystem) {
             if (t.amount >= 0) income += t.amount;
             else expense += t.amount;
        }
      });

      days.push({
        date: d,
        income,
        expense,
        net: income + expense
      });
    }
    return days;
  }, [transactions, categories]);

  // --- Logic: Current Month Graph Data ---
  const currentMonthData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const data = [];
    let maxVal = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateStr = getItalyDateStr(date);
        
        let dailyIncome = 0;
        let dailyExpense = 0; // Will store absolute value for height calculation

        transactions.filter(t => t.date === dateStr).forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            if (cat && !cat.isSystem) {
                if (t.amount >= 0) dailyIncome += t.amount;
                else dailyExpense += Math.abs(t.amount);
            }
        });

        // Update global max for scaling
        if (dailyIncome > maxVal) maxVal = dailyIncome;
        if (dailyExpense > maxVal) maxVal = dailyExpense;

        data.push({
            day: d,
            income: dailyIncome,
            expense: dailyExpense, // Absolute value
            net: dailyIncome - dailyExpense
        });
    }

    return { data, maxVal: maxVal === 0 ? 1000 : maxVal, monthName: new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(today) };
  }, [transactions, categories]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Ciao, {username} 👋</h1>
                <p className="text-gray-500 text-sm">Ecco la situazione finanziaria aggiornata.</p>
            </div>
            <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-400 uppercase">Data Odierna</p>
                <p className="text-lg font-bold text-indigo-600 capitalize">{new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
            </div>
        </div>

        {/* 5 Days Forecast */}
        <section>
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-indigo-600" size={20} />
                <h2 className="text-lg font-bold text-gray-700">Previsione Prossimi 5 Giorni</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {next5DaysData.map((day, idx) => (
                    <div key={idx} className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${idx === 0 ? 'ring-2 ring-indigo-100' : ''}`}>
                        {idx === 0 && <span className="absolute top-0 right-0 bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">OGGI</span>}
                        
                        <div className="mb-3">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">{getDayName(day.date)}</p>
                            <p className="text-sm font-bold text-gray-800">{formatDateShort(day.date).slice(0, 5)}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 flex items-center gap-1"><TrendingUp size={12}/> Entrate</span>
                                <span className="font-bold text-green-600">{formatCurrency(day.income)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 flex items-center gap-1"><TrendingDown size={12}/> Uscite</span>
                                <span className="font-bold text-red-600">{formatCurrency(Math.abs(day.expense))}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-400">Netto</span>
                                <span className={`font-bold ${day.net >= 0 ? 'text-indigo-600' : 'text-orange-500'}`}>{formatCurrency(day.net)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Monthly Chart */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Activity className="text-indigo-600" size={20} />
                    <div>
                        <h2 className="text-lg font-bold text-gray-700">Andamento Flusso {currentMonthData.monthName}</h2>
                        <p className="text-xs text-gray-400">Confronto Entrate (Blu) vs Uscite (Arancione)</p>
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                        <span className="text-gray-600">Entrate</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                        <span className="text-gray-600">Uscite</span>
                    </div>
                </div>
            </div>

            <div className="h-64 flex items-end gap-1 sm:gap-2">
                {currentMonthData.data.map((point) => {
                    const heightIncome = Math.max((point.income / currentMonthData.maxVal) * 100, 0); 
                    const heightExpense = Math.max((point.expense / currentMonthData.maxVal) * 100, 0);
                    
                    return (
                        <div key={point.day} className="flex-1 flex flex-col justify-end group relative h-full">
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[10px] p-2 rounded whitespace-nowrap z-50 pointer-events-none transition-opacity shadow-lg">
                                <p className="font-bold text-center border-b border-gray-600 pb-1 mb-1">Giorno {point.day}</p>
                                <div className="flex justify-between gap-3 text-indigo-300">
                                    <span>Entrate:</span>
                                    <span>{formatCurrency(point.income)}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-orange-300">
                                    <span>Uscite:</span>
                                    <span>{formatCurrency(point.expense)}</span>
                                </div>
                                <div className="flex justify-between gap-3 mt-1 pt-1 border-t border-gray-600 font-bold">
                                    <span>Netto:</span>
                                    <span className={point.net >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(point.net)}</span>
                                </div>
                            </div>

                            <div className="w-full flex items-end justify-center gap-[1px] h-full">
                                {/* Income Bar */}
                                <div 
                                    style={{ height: `${heightIncome}%` }} 
                                    className={`w-1/2 min-w-[3px] rounded-t-sm bg-indigo-400 group-hover:bg-indigo-600 transition-all duration-500 ${heightIncome === 0 ? 'min-h-[1px] opacity-20' : ''}`}
                                ></div>
                                {/* Expense Bar */}
                                <div 
                                    style={{ height: `${heightExpense}%` }} 
                                    className={`w-1/2 min-w-[3px] rounded-t-sm bg-orange-300 group-hover:bg-orange-500 transition-all duration-500 ${heightExpense === 0 ? 'min-h-[1px] opacity-20' : ''}`}
                                ></div>
                            </div>

                            <div className="text-[10px] text-gray-400 text-center mt-1 hidden sm:block">
                                {point.day % 2 !== 0 ? point.day : ''} 
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    </div>
  );
};
