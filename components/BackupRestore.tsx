
import React, { useState, useRef, useEffect } from 'react';
import { BackupConfig, Transaction, Category, Bank } from '../types';
import { STORAGE_KEYS, INITIAL_BACKUP_CONFIG, generateId } from '../constants';
import { Download, Upload, Database, AlertTriangle, FileJson, Calendar, Mail, Clock, History, FileClock, FileSpreadsheet, ShieldCheck, CheckCircle, BrainCircuit, Server, Link as LinkIcon, Key } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  banks: any[];
  categories: any[];
  transactions: any[];
  users: any[];
  theme: string;
  logo: string | null;
}

interface BackupData {
    timestamp: string;
    version: string;
    data: {
        banks: string | null;
        categories: string | null;
        transactions: string | null;
        users: string | null;
        theme: string | null;
        logo: string | null;
    };
}

export const BackupRestore: React.FC<Props> = ({ banks, categories, transactions, users, theme, logo }) => {
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUP_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_BACKUP_CONFIG;
  });

  // Fix: Provide explicit string type and safer initialization for cloud settings
  const [cloudUrl, setCloudUrl] = useState<string>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return typeof parsed?.url === 'string' ? parsed.url : '';
        } catch (e) {
          return '';
        }
      }
      return '';
  });
  
  const [cloudKey, setCloudKey] = useState<string>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return typeof parsed?.key === 'string' ? parsed.key : '';
        } catch (e) {
          return '';
        }
      }
      return '';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [importStatus, setImportStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.BACKUP_CONFIG, JSON.stringify(backupConfig));
  }, [backupConfig]);

  const saveCloudSettings = () => {
      if (cloudUrl && cloudKey) {
          localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify({ url: cloudUrl, key: cloudKey }));
          alert('Configurações de Nuvem salvas! O app agora tentará sincronizar com o banco SQL Supabase.');
          window.location.reload();
      } else {
          localStorage.removeItem(STORAGE_KEYS.CLOUD_CONFIG);
          alert('Sincronização desativada.');
      }
  };

  const handleDownloadAIPrompt = () => {
    const summary = `
# 📑 RESUMO TÉCNICO DO PROJETO: FINANZAFLOW PRO
Este app agora suporta integração com Supabase SQL para armazenamento persistente na nuvem.
Modo de Armazenamento: SQL Híbrido (LocalStorage + Supabase).
    `;
    const blob = new Blob([summary.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projeto_finanzaflow_ia.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullExcelExport = () => {
    const wb = XLSX.utils.book_new();
    const txData = transactions.map(t => ({
        ID: t.id, Data: t.date, Importo: t.amount,
        Categoria: categories.find(c => c.id === t.categoryId)?.name || 'N/A',
        Banca: banks.find(b => b.id === categories.find(c => c.id === t.categoryId)?.bankId)?.name || 'N/A',
        Descrizione: t.description || '', Tipo: t.amount >= 0 ? 'Entrata' : 'Uscita'
    }));
    const wsTx = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTx, "Movimenti");
    XLSX.writeFile(wb, `Full_Export_FinanzaFlow_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleExcelImportClick = () => excelInputRef.current?.click();

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              // Fix: Explicitly handle reader result and cast to satisfy Uint8Array constructor
              const result = event.target?.result;
              if (!result) return;
              const data = new Uint8Array(result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = "Movimenti";
              if (!workbook.Sheets[sheetName]) throw new Error(`Foglio '${sheetName}' non trovato.`);
              
              // Fix: Ensure rawData is handled as an array of objects
              const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
              const newTransactions: Transaction[] = [];
              const categoryNameMap = new Map<string, string>(categories.map(c => [String(c.name).toLowerCase().trim(), String(c.id)]));
              
              rawData.forEach((row: any) => {
                  let catId = categoryNameMap.get((row['Categoria'] || '').toString().toLowerCase().trim());
                  if (!catId) return;
                  
                  let dateStr: any = row['Data'];
                  if (typeof dateStr === 'number') {
                    dateStr = new Date(Math.round((dateStr - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
                  }
                  
                  // Fix: Explicitly cast and ensure strings for Transaction object
                  newTransactions.push({ 
                    id: String(row['ID'] || generateId()), 
                    date: String(dateStr), 
                    amount: parseFloat(row['Importo']), 
                    categoryId: String(catId), 
                    description: String(row['Descrizione'] || '') 
                  });
              });
              
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...transactions, ...newTransactions]));
              setImportStatus({ msg: `Importação concluída.`, type: 'success' });
              setTimeout(() => window.location.reload(), 2000);
          } catch (err: any) { setImportStatus({ msg: `Erro: ${err.message}`, type: 'error' }); }
      };
      reader.readAsArrayBuffer(file);
  };

  const handleBackup = () => {
      const data = { timestamp: new Date().toISOString(), data: { banks: localStorage.getItem(STORAGE_KEYS.BANKS), categories: localStorage.getItem(STORAGE_KEYS.CATEGORIES), transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) } };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finanzaflow_backup.json`;
      link.click();
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden overflow-y-auto space-y-6">
        
        {/* SQL CLOUD CONFIGURATION (NEW) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Server className="text-blue-600" />
                Configurações de Nuvem (SQL Supabase)
            </h2>
            <p className="text-sm text-gray-500 mb-6">
                Para salvar automaticamente seus dados em um banco SQL profissional (grátis), crie um projeto no <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">Supabase</a> e insira as credenciais abaixo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Project URL</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={cloudUrl}
                            onChange={e => setCloudUrl(e.target.value)}
                            placeholder="https://xyz.supabase.co"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                    </div>
                </div>
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Anon API Key</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            type="password" 
                            value={cloudKey}
                            onChange={e => setCloudKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1Ni..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                    </div>
                </div>
            </div>
            <button 
                onClick={saveCloudSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
                <CheckCircle size={18} />
                Conectar e Ativar SQL Cloud
            </button>
        </div>

        {/* AI EXPORT SECTION */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full"><BrainCircuit size={28} /></div>
                    <div>
                        <h2 className="text-xl font-bold">Resumo para Outra IA</h2>
                        <p className="text-blue-100 text-sm opacity-90">Explique este projeto SQL Híbrido para outro assistente.</p>
                    </div>
                </div>
                <button onClick={handleDownloadAIPrompt} className="bg-white text-indigo-700 hover:bg-blue-50 font-bold py-2.5 px-6 rounded-lg shadow-lg flex items-center gap-2">
                    <Download size={18} /> Gerar TXT
                </button>
            </div>
        </div>

        {/* EXCEL SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FileSpreadsheet className="text-green-600" />
                Integração Excel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleFullExcelExport} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all">
                    <Download size={20} /> Baixar Planilha Atual
                </button>
                <button onClick={handleExcelImportClick} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all">
                    <Upload size={20} /> Carregar do Excel
                </button>
                <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleExcelFileChange} className="hidden" />
            </div>
        </div>

        {/* MANUAL BACKUP */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Database className="text-orange-600" />
                Backup JSON (Sistema)
            </h2>
            <button onClick={handleBackup} className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-6 rounded-lg flex items-center gap-2">
                <Download size={18} /> Exportar Tudo (.json)
            </button>
        </div>
    </div>
  );
};
