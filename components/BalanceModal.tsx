import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  bankName: string;
  currentAmount: number;
}

export const BalanceModal: React.FC<Props> = ({ isOpen, onClose, onSave, bankName, currentAmount }) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount.toString());
    }
  }, [isOpen, currentAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(parseFloat(amount));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Modifica Saldo Iniziale</h2>
        <p className="text-sm text-gray-500 mb-4">Imposta il saldo di partenza per <strong>{bankName}</strong>.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Saldo Iniziale (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-lg font-semibold"
              placeholder="0.00"
              autoFocus
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