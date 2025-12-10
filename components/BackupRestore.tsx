
import React, { useState, useRef, useEffect } from 'react';
import { BackupConfig } from '../types';
import { STORAGE_KEYS, INITIAL_BACKUP_CONFIG } from '../constants';
import { Download, Upload, Database, AlertTriangle, FileJson, Calendar, Mail, Clock, History, FileClock, FileSpreadsheet, ShieldCheck } from 'lucide-react';
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
  // Backup Config State
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUP_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_BACKUP_CONFIG;
  });

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  // Save config on change
  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.BACKUP_CONFIG, JSON.stringify(backupConfig));
  }, [backupConfig]);

  // --- EXCEL EXPORT ---
  const handleFullExcelExport = () => {
    const wb = XLSX.utils.book_new();

    // 1. Transactions Sheet
    const txData = transactions.map(t => ({
        ID: t.id,
        Data: t.date,
        Importo: t.amount,
        Categoria: categories.find(c => c.id === t.categoryId)?.name || 'N/A',
        Banca: banks.find(b => b.id === categories.find(c => c.id === t.categoryId)?.bankId)?.name || 'N/A',
        Descrizione: t.description || '',
        Tipo: t.amount >= 0 ? 'Entrata' : 'Uscita'
    }));
    const wsTx = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTx, "Movimenti");

    // 2. Categories Sheet
    const catData = categories.map(c => ({
        ID: c.id,
        Nome: c.name,
        Banca: banks.find(b => b.id === c.bankId)?.name || 'Generale',
        Sistema: c.isSystem ? 'SI' : 'NO'
    }));
    const wsCat = XLSX.utils.json_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, wsCat, "Categorie");

    // 3. Banks Sheet
    const bankData = banks.map(b => ({
        ID: b.id,
        Nome: b.name
    }));
    const wsBank = XLSX.utils.json_to_sheet(bankData);
    XLSX.utils.book_append_sheet(wb, wsBank, "Banche");

    // Save File
    XLSX.writeFile(wb, `Full_Export_FinanzaFlow_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // --- JSON BACKUP LOGIC ---
  const handleBackup = () => {
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

      const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finanzaflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadHistoryItem = (dataString: string, fileName: string) => {
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RESTORE LOGIC ---
  const handleRestoreClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const parsed = JSON.parse(content);

              if (!parsed.data || !parsed.timestamp) {
                  throw new Error("Formato backup non valido o incompleto");
              }
              setPendingBackup(parsed as BackupData);

          } catch (err) {
              console.error(err);
              alert('Errore durante la lettura del file: Formato non valido.');
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const confirmRestore = () => {
      if (!pendingBackup) return;

      try {
          const restoreItem = (key: string, value: string | null) => {
              if (value !== null && value !== undefined) {
                  localStorage.setItem(key, value);
              } else {
                  localStorage.removeItem(key);
              }
          };

          restoreItem(STORAGE_KEYS.BANKS, pendingBackup.data.banks);
          restoreItem(STORAGE_KEYS.CATEGORIES, pendingBackup.data.categories);
          restoreItem(STORAGE_KEYS.TRANSACTIONS, pendingBackup.data.transactions);
          restoreItem(STORAGE_KEYS.USERS, pendingBackup.data.users);
          restoreItem(STORAGE_KEYS.THEME, pendingBackup.data.theme);
          restoreItem(STORAGE_KEYS.LOGO, pendingBackup.data.logo);

          alert('Ripristino completato con successo! La pagina verrà ricaricata.');
          window.location.reload();
      } catch (err) {
          console.error(err);
          alert('Errore critico durante il ripristino dei dati.');
      }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden overflow-y-auto">
        
        {/* EXCEL EXPORT CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FileSpreadsheet className="text-green-600" />
                Esportazione Dati Completa
            </h2>
            <div className="bg-green-50 border border-green-100 rounded-lg p-5 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-green-900 mb-1">Scarica Excel (.xlsx)</h3>
                    <p className="text-sm text-green-700">
                        Genera un file Excel contenente fogli separati per Movimenti, Categorie e Banche. 
                        Ideale per analisi esterne o archiviazione.
                    </p>
                </div>
                <button 
                    onClick={handleFullExcelExport}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                    <Download size={18} />
                    Esporta Tutto
                </button>
            </div>
        </div>

        {/* AUTOMATION SETTINGS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Clock className="text-purple-600" />
                Automazione Backup (JSON)
            </h2>
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg mb-6">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex items-center gap-2 mb-1 lg:mb-0 min-w-[200px]">
                        <input 
                            type="checkbox" 
                            id="autoBackup"
                            checked={backupConfig.enabled}
                            onChange={e => setBackupConfig({...backupConfig, enabled: e.target.checked})}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="autoBackup" className="font-semibold text-gray-700">Abilita Backup Auto</label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Giorno della Settimana</label>
                            <select 
                                value={backupConfig.dayOfWeek}
                                onChange={e => setBackupConfig({...backupConfig, dayOfWeek: e.target.value})}
                                disabled={!backupConfig.enabled}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <option value="1">Lunedì</option>
                                <option value="2">Martedì</option>
                                <option value="3">Mercoledì</option>
                                <option value="4">Giovedì</option>
                                <option value="5">Venerdì</option>
                                <option value="6">Sabato</option>
                                <option value="0">Domenica</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Orario Esecuzione</label>
                            <input 
                                type="time"
                                value={backupConfig.time || '09:00'}
                                onChange={e => setBackupConfig({...backupConfig, time: e.target.value})}
                                disabled={!backupConfig.enabled}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Destinatario</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="email" 
                                    value={backupConfig.email}
                                    onChange={e => setBackupConfig({...backupConfig, email: e.target.value})}
                                    disabled={!backupConfig.enabled}
                                    className="w-full pl-9 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                    placeholder="tuamail@azienda.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <History size={16} className="text-gray-400" />
                    Cronologia Ultimi Backup Auto (Max 5)
                </h3>
                
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-2 w-10"></th>
                                <th className="px-4 py-2">Data e Ora</th>
                                <th className="px-4 py-2">Nome File</th>
                                <th className="px-4 py-2 text-right">Dimensione</th>
                                <th className="px-4 py-2 text-center">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(!backupConfig.history || backupConfig.history.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        Nessun backup automatico registrato.
                                    </td>
                                </tr>
                            ) : (
                                backupConfig.history.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-center text-purple-600">
                                            <FileClock size={16} />
                                        </td>
                                        <td className="px-4 py-2 text-gray-700">
                                            {new Date(item.date).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                                            {item.fileName}
                                        </td>
                                        <td className="px-4 py-2 text-right text-gray-500 text-xs">
                                            {(item.sizeBytes / 1024).toFixed(2)} KB
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button 
                                                onClick={() => handleDownloadHistoryItem(item.dataSnapshot, item.fileName)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors"
                                                title="Scarica questo backup"
                                            >
                                                <Download size={12} /> Scarica
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* BACKUP & RESTORE SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Database className="text-orange-600" />
                Backup e Ripristino Manuale (File di Sistema)
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-orange-50 border border-orange-100 rounded-lg p-5 flex flex-col items-start">
                    <div className="bg-white p-3 rounded-full shadow-sm text-orange-600 mb-3"><Download size={24} /></div>
                    <h3 className="font-bold text-gray-800 mb-1">Esporta Backup Sistema</h3>
                    <p className="text-xs text-gray-500 mb-4">Scarica un file JSON completo per il ripristino del sistema in caso di emergenza.</p>
                    <button onClick={handleBackup} className="mt-auto bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"><Download size={16} /> Scarica JSON</button>
                </div>
                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-5 flex flex-col items-start">
                    <div className="bg-white p-3 rounded-full shadow-sm text-blue-600 mb-3"><Upload size={24} /></div>
                    <h3 className="font-bold text-gray-800 mb-1">Ripristina da File</h3>
                    <p className="text-xs text-gray-500 mb-4">Carica un file JSON per ripristinare lo stato. <span className="font-bold text-red-500">Sovrascrive i dados atuais!</span></p>
                    <button onClick={handleRestoreClick} className="mt-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"><Upload size={16} /> Carica JSON</button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            </div>
        </div>

        {/* RESTORE CONFIRMATION MODAL */}
        {pendingBackup && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                     <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
                         <div className="bg-red-100 p-2 rounded-full text-red-600 flex-shrink-0"><AlertTriangle size={24} /></div>
                         <div>
                             <h2 className="text-lg font-bold text-red-800">Conferma Ripristino Backup</h2>
                             <p className="text-red-600 text-sm mt-1">Stai per sovrascrivere l'intero database. Questa operazione è irreversibile.</p>
                         </div>
                     </div>
                     <div className="p-6 space-y-4">
                         <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                             <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Dettagli Backup</h3>
                             <div className="flex items-center gap-3 mb-2"><FileJson className="text-blue-500" size={20} /><span className="font-mono text-sm text-gray-700">Versione: {pendingBackup.version}</span></div>
                             <div className="flex items-center gap-3"><Calendar className="text-blue-500" size={20} /><span className="font-medium text-gray-800">{new Date(pendingBackup.timestamp).toLocaleString()}</span></div>
                         </div>
                         <div className="text-sm text-gray-600"><p>Cliccando su "Conferma Ripristino", l'applicazione verrà aggiornata con i dati contenuti nel file selezionato. Tutti i dati não salvati serão perdidos.</p></div>
                     </div>
                     <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                         <button onClick={() => setPendingBackup(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Annulla</button>
                         <button onClick={confirmRestore} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-md transition-colors flex items-center gap-2"><Upload size={16} /> Conferma Ripristino</button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};
