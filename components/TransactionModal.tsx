import React, { useState, useEffect } from 'react';
import { Bank, Category, Transaction } from '../types';
import { generateId } from '../constants';
import { getItalyDateStr } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  banks: Bank[];
  categories: Category[];
  initialDate?: string;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<Props> = ({ isOpen, onClose, onSave, banks, categories, initialDate, transactionToEdit }) => {
  const [date, setDate] = useState(initialDate || getItalyDateStr(new Date()));
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // Reset or Fill form when opening
  useEffect(() => {
    if (isOpen) {
        if (transactionToEdit) {
            setDate(transactionToEdit.date);
            // Always show positive number in input, type determines sign
            setAmount(Math.abs(transactionToEdit.amount).toString());
            setCategoryId(transactionToEdit.categoryId);
            setDescription(transactionToEdit.description || '');
            // Determine type based on amount sign
            setType(transactionToEdit.amount >= 0 ? 'INCOME' : 'EXPENSE');
        } else {
            // Default to today in Italy if no specific initial date provided
            setDate(initialDate || getItalyDateStr(new Date()));
            setAmount('');
            setCategoryId('');
            setDescription('');
            // Default to EXPENSE for new items unless specified otherwise
            setType('EXPENSE');
        }
    }
  }, [isOpen, initialDate, transactionToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    // Determine sign based on type
    let finalAmount = parseFloat(amount);
    if (type === 'EXPENSE') finalAmount = -Math.abs(finalAmount);
    else finalAmount = Math.abs(finalAmount);

    const newTx: Transaction = {
      // If editing, keep ID. If new, generate ID.
      id: transactionToEdit ? transactionToEdit.id : generateId(),
      date,
      amount: finalAmount,
      categoryId,
      description,
    };

    onSave(newTx);
    onClose();
  };

  if (!isOpen) return null;

  // Filter categories
  const selectableCategories = categories.filter(c => !c.name.includes('Disponibilità liquida'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {transactionToEdit ? 'Modifica Movimento' : 'Nuovo Movimento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
             <button
                type="button"
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${type === 'EXPENSE' ? 'bg-red-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setType('EXPENSE')}
             >
                Uscita (Spese)
             </button>
             <button
                type="button"
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${type === 'INCOME' ? 'bg-green-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setType('INCOME')}
             >
                Entrata (Incassi)
             </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Conto / Categoria</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            >
              <option value="">Seleziona...</option>
              {banks.map(bank => (
                <optgroup key={bank.id} label={bank.name}>
                  {selectableCategories
                    .filter(c => c.bankId === bank.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Importo (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrizione (Opzionale)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};