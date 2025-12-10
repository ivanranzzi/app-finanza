import React, { useState, useMemo, useRef } from 'react';
import { Bank, Category, Transaction } from '../types';
import { formatCurrency, formatDateShort, getItalyDateStr } from '../utils/formatters';
import { FileText, FileSpreadsheet, Upload, Filter, Calendar, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  transactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  logo: string | null;
  onLogoUpload: (logo: string | null) => void;
}

export const Reports: React.FC<Props> = ({ transactions, banks, categories, logo, onLogoUpload }) => {
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(getItalyDateStr(firstDay));
  const [endDate, setEndDate] = useState(getItalyDateStr(lastDay));
  const [selectedBankId, setSelectedBankId] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Filter Logic ---
  const reportData = useMemo(() => {
    // Filter by Date Range
    let filtered = transactions.filter(t => t.date >= startDate && t.date <= endDate);

    // Filter by Bank
    if (selectedBankId !== 'ALL') {
      filtered = filtered.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return cat && cat.bankId === selectedBankId;
      });
    }

    // Sort by Date
    filtered.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Totals
    let totalIncome = 0;
    let totalExpense = 0;

    const categorizedData: Record<string, number> = {};

    filtered.forEach(t => {
       // Skip system rows (balances) for Income/Expense reports to avoid skewing data
       const cat = categories.find(c => c.id === t.categoryId);
       if (cat?.isSystem) return;

       if (t.amount >= 0) totalIncome += t.amount;
       else totalExpense += t.amount;

       const catName = cat ? cat.name : 'Sconosciuto';
       if (!categorizedData[catName]) categorizedData[catName] = 0;
       categorizedData[catName] += t.amount;
    });

    return {
      filteredTransactions: filtered,
      totalIncome,
      totalExpense,
      netResult: totalIncome + totalExpense,
      categorizedData
    };
  }, [transactions, startDate, endDate, selectedBankId, categories]);

  // --- Handlers ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBankName = (id: string) => {
      if (id === 'ALL') return 'Tutti i Flussi';
      return banks.find(b => b.id === id)?.name || 'Banca';
  }

  // --- Export Logic ---
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    if (logo) {
        doc.addImage(logo, 'PNG', 15, 10, 30, 15); // x, y, w, h
    }
    
    doc.setFontSize(18);
    doc.text('Report Finanziario', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Periodo: ${formatDateShort(new Date(startDate))} - ${formatDateShort(new Date(endDate))}`, 105, 28, { align: 'center' });
    doc.text(`Ambito: ${getBankName(selectedBankId)}`, 105, 33, { align: 'center' });

    // Summary Box
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 40, 182, 20, 'FD'); // x, y, w, h
    
    doc.setFontSize(10);
    doc.text('Entrate Totali:', 20, 52);
    doc.setTextColor(0, 128, 0);
    doc.text(formatCurrency(reportData.totalIncome), 50, 52);
    
    doc.setTextColor(0, 0, 0);
    doc.text('Uscite Totali:', 80, 52);
    doc.setTextColor(200, 0, 0);
    doc.text(formatCurrency(reportData.totalExpense), 110, 52);
    
    doc.setTextColor(0, 0, 0);
    doc.text('Risultato:', 140, 52);
    doc.setTextColor(reportData.netResult >= 0 ? 0 : 200, reportData.netResult >= 0 ? 128 : 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(reportData.netResult), 160, 52);

    // Table
    const tableData = reportData.filteredTransactions
        .filter(t => !categories.find(c => c.id === t.categoryId)?.isSystem)
        .map(t => [
            formatDateShort(new Date(t.date)),
            categories.find(c => c.id === t.categoryId)?.name || '-',
            banks.find(b => b.id === categories.find(c => c.id === t.categoryId)?.bankId)?.name || '-',
            t.description || '',
            formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        startY: 70,
        head: [['Data', 'Categoria', 'Banca', 'Descrizione', 'Importo']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 8 },
        columnStyles: { 4: { halign: 'right' } }
    });

    doc.save(`report_finanzaflow_${startDate}_${endDate}.pdf`);
  };

  const exportExcel = () => {
    // Prepare Data for Excel
    const dataForExcel = reportData.filteredTransactions
        .filter(t => !categories.find(c => c.id === t.categoryId)?.isSystem)
        .map(t => ({
            Data: t.date,
            Categoria: categories.find(c => c.id === t.categoryId)?.name || '-',
            Banca: banks.find(b => b.id === categories.find(c => c.id === t.categoryId)?.bankId)?.name || '-',
            Descrizione: t.description || '',
            Importo: t.amount
        }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimenti");
    XLSX.writeFile(wb, `report_finanzaflow_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden">
        
        {/* Header Control Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Filter className="text-indigo-600" />
                        Reportistica Avanzata
                    </h2>
                    <p className="text-sm text-gray-500">Esporta i tuoi flussi di cassa</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Logo Uploader */}
                    <div className="flex items-center gap-2">
                        {logo && <img src={logo} className="h-8 w-auto rounded border" alt="Logo" />}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Upload size={14} />
                            {logo ? 'Cambia Logo' : 'Carica Logo'}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleLogoUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Da</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">A</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ambito / Banca</label>
                    <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-3 text-gray-400" />
                        <select 
                            value={selectedBankId}
                            onChange={e => setSelectedBankId(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="ALL">Tutti i Flussi (Consolidato)</option>
                            {banks.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 ml-auto">
                    <button 
                        onClick={exportPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <FileText size={16} />
                        PDF
                    </button>
                    <button 
                        onClick={exportExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <FileSpreadsheet size={16} />
                        Excel
                    </button>
                </div>
            </div>
        </div>

        {/* Results Preview */}
        <div className="flex-1 overflow-y-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Entrate Periodo</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalIncome)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Uscite Periodo</h3>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalExpense)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Flusso Netto</h3>
                    <p className={`text-2xl font-bold ${reportData.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                        {formatCurrency(reportData.netResult)}
                    </p>
                </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700">Anteprima Dati</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">Data</th>
                            <th className="px-6 py-3 font-medium">Categoria</th>
                            <th className="px-6 py-3 font-medium">Banca</th>
                            <th className="px-6 py-3 font-medium">Descrizione</th>
                            <th className="px-6 py-3 font-medium text-right">Importo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {reportData.filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    Nessun dato trovato per i filtri selezionati.
                                </td>
                            </tr>
                        ) : (
                            reportData.filteredTransactions
                                .filter(t => !categories.find(c => c.id === t.categoryId)?.isSystem)
                                .map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{formatDateShort(new Date(t.date))}</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">
                                        {categories.find(c => c.id === t.categoryId)?.name || '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
                                            {banks.find(b => b.id === categories.find(c => c.id === t.categoryId)?.bankId)?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{t.description}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};