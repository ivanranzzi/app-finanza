
import React, { useState, useRef, useEffect } from 'react';
import { Bank, Category } from '../types';
import { generateId } from '../constants';
import { Trash2, Plus, Layout, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  banks: Bank[];
  categories: Category[];
  onAddBank: (bank: Bank) => void;
  onAddCategory: (category: Category) => void;
  // New props for customization
  appTitle: string;
  appSubtitle: string;
  appLogo: string | null;
  onUpdateAppConfig: (title: string, subtitle: string, logo: string | null) => void;
}

export const SettingsModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    banks, 
    categories, 
    onAddBank, 
    onAddCategory,
    appTitle,
    appSubtitle,
    appLogo,
    onUpdateAppConfig
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CATEGORIES' | 'BANKS'>('GENERAL');
  
  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatBank, setNewCatBank] = useState(banks[0]?.id || '');

  // New Bank Form State
  const [newBankName, setNewBankName] = useState('');

  // General Settings State
  const [tempTitle, setTempTitle] = useState(appTitle);
  const [tempSubtitle, setTempSubtitle] = useState(appSubtitle);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opening or when props change (e.g. after logo upload updates parent)
  useEffect(() => {
    if (isOpen) {
      setTempTitle(appTitle);
      setTempSubtitle(appSubtitle);
    }
  }, [isOpen, appTitle, appSubtitle]);

  if (!isOpen) return null;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatBank) return;
    onAddCategory({
      id: generateId(),
      name: newCatName,
      bankId: newCatBank,
    });
    setNewCatName('');
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName) return;
    const newId = generateId();
    onAddBank({
      id: newId,
      name: newBankName,
      colorClass: 'bg-gray-100', // Default color
    });
    // Also add a default balance category for this bank
    onAddCategory({
        id: generateId(),
        name: `Disponibilità liquida ${newBankName}`,
        bankId: newId,
        isSystem: true
    });
    setNewBankName('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Update immediately for preview/save
              onUpdateAppConfig(tempTitle, tempSubtitle, reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveGeneral = () => {
      onUpdateAppConfig(tempTitle, tempSubtitle, appLogo);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Impostazioni</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex border-b">
            <button 
                className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'GENERAL' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('GENERAL')}
            >
                Generale
            </button>
            <button 
                className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'CATEGORIES' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('CATEGORIES')}
            >
                Categorie
            </button>
            <button 
                className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'BANKS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('BANKS')}
            >
                Banche
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'GENERAL' && (
                <div className="space-y-8">
                    <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                        <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 flex items-center gap-2">
                            <Layout size={16} /> Personalizzazione App
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Applicazione</label>
                                <input 
                                    type="text" 
                                    value={tempTitle}
                                    onChange={e => setTempTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sottotitolo</label>
                                <input 
                                    type="text" 
                                    value={tempSubtitle}
                                    onChange={e => setTempSubtitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                            <ImageIcon size={16} /> Logo Aziendale
                        </h3>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm relative group">
                                {appLogo ? (
                                    <img src={appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-xs text-gray-400 text-center px-2">Nessun Logo</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Upload size={16} /> Carica Immagine
                                </button>
                                {appLogo && (
                                    <button 
                                        onClick={() => onUpdateAppConfig(tempTitle, tempSubtitle, null)}
                                        className="px-4 py-2 bg-white border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={16} /> Rimuovi Logo
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleLogoUpload} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                <p className="text-xs text-gray-400">Consigliato: PNG trasparente, max 2MB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleSaveGeneral}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            Salva Modifiche
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'CATEGORIES' && (
                <div className="space-y-6">
                    <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 rounded-lg flex gap-4 items-end border">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Nome Categoria</label>
                            <input 
                                type="text" 
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                className="w-full mt-1 border rounded p-2 text-sm"
                                placeholder="Es. Leasing Auto"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Banca Collegata</label>
                            <select 
                                value={newCatBank}
                                onChange={e => setNewCatBank(e.target.value)}
                                className="w-full mt-1 border rounded p-2 text-sm"
                            >
                                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <button className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
                            <Plus size={20} />
                        </button>
                    </form>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-700">Categorie Esistenti</h3>
                        {banks.map(bank => (
                            <div key={bank.id} className="mb-4">
                                <h4 className="text-sm font-bold text-gray-900 bg-gray-100 p-2 rounded">{bank.name}</h4>
                                <ul className="divide-y">
                                    {categories.filter(c => c.bankId === bank.id).map(cat => (
                                        <li key={cat.id} className="flex justify-between items-center py-2 px-2 hover:bg-gray-50">
                                            <span className="text-sm">{cat.name}</span>
                                            {!cat.isSystem && (
                                                <span className="text-xs text-gray-400">Modificabile</span>
                                            )}
                                            {cat.isSystem && (
                                                <span className="text-xs text-blue-500 font-medium">Sistema</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'BANKS' && (
                <div className="space-y-6">
                    <form onSubmit={handleAddBank} className="bg-gray-50 p-4 rounded-lg flex gap-4 items-end border">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Nome Banca</label>
                            <input 
                                type="text" 
                                value={newBankName}
                                onChange={e => setNewBankName(e.target.value)}
                                className="w-full mt-1 border rounded p-2 text-sm"
                                placeholder="Es. UNICREDIT"
                            />
                        </div>
                        <button className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
                             <Plus size={20} />
                        </button>
                    </form>

                    <div className="space-y-2">
                         <h3 className="font-semibold text-gray-700">Banche Attive</h3>
                         <ul className="divide-y border rounded">
                             {banks.map(bank => (
                                 <li key={bank.id} className="flex justify-between items-center p-3">
                                     <span className="font-medium">{bank.name}</span>
                                 </li>
                             ))}
                         </ul>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
