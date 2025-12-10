import React, { useState } from 'react';
import { Bank, Category } from '../types';
import { generateId } from '../constants';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  banks: Bank[];
  categories: Category[];
  onAddBank: (bank: Bank) => void;
  onAddCategory: (category: Category) => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, banks, categories, onAddBank, onAddCategory }) => {
  const [activeTab, setActiveTab] = useState<'BANKS' | 'CATEGORIES'>('CATEGORIES');
  
  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatBank, setNewCatBank] = useState(banks[0]?.id || '');

  // New Bank Form State
  const [newBankName, setNewBankName] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Impostazioni Piani dei Conti</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex border-b">
            <button 
                className={`flex-1 py-3 font-medium ${activeTab === 'CATEGORIES' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('CATEGORIES')}
            >
                Categorie (Piani)
            </button>
            <button 
                className={`flex-1 py-3 font-medium ${activeTab === 'BANKS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('BANKS')}
            >
                Banche
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
