import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { generateId, STORAGE_KEYS } from '../constants';
import { Trash2, UserPlus, ShieldAlert, User as UserIcon, Edit2, Check, X, Download, Upload, Database, AlertTriangle, FileJson, Calendar } from 'lucide-react';

interface Props {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUserId: string;
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

export const UserManagement: React.FC<Props> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUserId }) => {
  // Add State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ADMIN');

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('ADMIN');

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) return;
    
    if (users.find(u => u.username === newUsername)) {
        alert('Nome utente già esistente');
        return;
    }

    onAddUser({
        id: generateId(),
        username: newUsername,
        password: newPassword,
        name: newName,
        role: newRole
    });

    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole('ADMIN');
  };

  const handleStartEdit = (user: User) => {
      setEditingUser(user);
      setEditName(user.name);
      setEditUsername(user.username);
      setEditPassword(user.password || '');
      setEditRole(user.role);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      
      // Check username duplicate (excluding self)
      if (users.find(u => u.username === editUsername && u.id !== editingUser.id)) {
          alert('Nome utente già in uso da un altro utente');
          return;
      }

      onUpdateUser({
          ...editingUser,
          name: editName,
          username: editUsername,
          password: editPassword,
          role: editRole
      });
      setEditingUser(null);
  };

  const handleDelete = (userToDelete: User) => {
      if (userToDelete.role === 'MASTER') {
          const masterCount = users.filter(u => u.role === 'MASTER').length;
          
          if (masterCount <= 1) {
              alert("Operazione negata: Impossibile eliminare l'ultimo amministratore MASTER.");
              return;
          }

          if (!confirm(`ATTENZIONE: Stai per eliminare un amministratore MASTER (${userToDelete.name}). Confermi l'operazione?`)) {
              return;
          }
      } else {
          if (!confirm(`Sei sicuro di voler eliminare l'utente ${userToDelete.name}?`)) {
              return;
          }
      }

      onDeleteUser(userToDelete.id);
  };

  // --- BACKUP LOGIC ---
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

  // --- RESTORE LOGIC ---
  const handleRestoreClick = () => {
      // Trigger file input directly. 
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

              // Instead of confirming immediately, set state to show modal
              setPendingBackup(parsed as BackupData);

          } catch (err) {
              console.error(err);
              alert('Errore durante la lettura del file: Formato non valido.');
          } finally {
              // Reset input so the same file can be selected again if needed
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const confirmRestore = () => {
      if (!pendingBackup) return;

      try {
          // Helper to set or remove item
          const restoreItem = (key: string, value: string | null) => {
              if (value !== null && value !== undefined) {
                  localStorage.setItem(key, value);
              } else {
                  localStorage.removeItem(key);
              }
          };

          // Restore Items
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
        
        {/* ADD USER CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <ShieldAlert className="text-indigo-600" />
                Gestione Utenti e Permessi
            </h2>
            <p className="text-gray-500 text-sm mb-6">
                Aggiungi nuovi utenti al sistema. Il ruolo <strong>MASTER</strong> ha accesso completo. Il ruolo <strong>ADMIN</strong> non può accedere a questa pagina.
            </p>

            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Es. Mario Rossi"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Username</label>
                    <input 
                        type="text" 
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="login_user"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                    <input 
                        type="text" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="****"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ruolo</label>
                    <select 
                        value={newRole}
                        onChange={e => setNewRole(e.target.value as UserRole)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="ADMIN">ADMIN (Limitato)</option>
                        <option value="MASTER">MASTER (Completo)</option>
                    </select>
                </div>
                <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors h-[38px]"
                >
                    <UserPlus size={18} />
                    Aggiungi
                </button>
            </form>
        </div>

        {/* USERS LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-700">Utenti Attivi</h3>
            </div>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                        <th className="p-4 font-bold">Utente</th>
                        <th className="p-4 font-bold">Username</th>
                        <th className="p-4 font-bold">Ruolo</th>
                        <th className="p-4 font-bold text-center">Azioni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${user.role === 'MASTER' ? 'bg-indigo-500' : 'bg-green-500'}`}>
                                    <UserIcon size={16} />
                                </div>
                                <span className="font-medium text-gray-800">{user.name}</span>
                                {user.id === currentUserId && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">(Tu)</span>}
                            </td>
                            <td className="p-4 text-gray-600 font-mono text-sm">{user.username}</td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-md font-bold border ${user.role === 'MASTER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => handleStartEdit(user)}
                                        className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                        title="Modifica Utente"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    
                                    {user.id !== currentUserId && (
                                        <button 
                                            onClick={() => handleDelete(user)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                            title="Elimina Utente"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* BACKUP & RESTORE SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Database className="text-orange-600" />
                Backup e Ripristino
            </h2>
            <p className="text-gray-500 text-sm mb-6">
                Salva una copia completa di tutti i dati del sistema (Transazioni, Banche, Utenti, Categorie) o ripristina un salvataggio precedente.
            </p>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-orange-50 border border-orange-100 rounded-lg p-5 flex flex-col items-start">
                    <div className="bg-white p-3 rounded-full shadow-sm text-orange-600 mb-3">
                        <Download size={24} />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">Esporta Backup</h3>
                    <p className="text-xs text-gray-500 mb-4">Scarica un file JSON contenente tutti i dati configurati.</p>
                    <button 
                        onClick={handleBackup}
                        className="mt-auto bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Download size={16} />
                        Scarica Dati
                    </button>
                </div>

                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-5 flex flex-col items-start">
                    <div className="bg-white p-3 rounded-full shadow-sm text-blue-600 mb-3">
                        <Upload size={24} />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">Ripristina Backup</h3>
                    <p className="text-xs text-gray-500 mb-4">Carica un file JSON per ripristinare lo stato. <span className="font-bold text-red-500">Sovrascrive i dati attuali!</span></p>
                    <button 
                        onClick={handleRestoreClick}
                        className="mt-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Upload size={16} />
                        Carica File
                    </button>
                    <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="hidden" 
                    />
                </div>
            </div>
        </div>

        {/* RESTORE CONFIRMATION MODAL */}
        {pendingBackup && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                     <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
                         <div className="bg-red-100 p-2 rounded-full text-red-600 flex-shrink-0">
                             <AlertTriangle size={24} />
                         </div>
                         <div>
                             <h2 className="text-lg font-bold text-red-800">Conferma Ripristino Backup</h2>
                             <p className="text-red-600 text-sm mt-1">
                                 Stai per sovrascrivere l'intero database. Questa operazione è irreversibile.
                             </p>
                         </div>
                     </div>

                     <div className="p-6 space-y-4">
                         <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                             <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Dettagli Backup</h3>
                             <div className="flex items-center gap-3 mb-2">
                                 <FileJson className="text-blue-500" size={20} />
                                 <span className="font-mono text-sm text-gray-700">Versione: {pendingBackup.version}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <Calendar className="text-blue-500" size={20} />
                                 <span className="font-medium text-gray-800">
                                     {new Date(pendingBackup.timestamp).toLocaleString()}
                                 </span>
                             </div>
                         </div>
                         
                         <div className="text-sm text-gray-600">
                             <p>Cliccando su "Conferma Ripristino", l'applicazione verrà aggiornata con i dati contenuti nel file selezionato. Tutti i dati non salvati andranno persi.</p>
                         </div>
                     </div>

                     <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                         <button 
                             onClick={() => setPendingBackup(null)}
                             className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                         >
                             Annulla
                         </button>
                         <button 
                             onClick={confirmRestore}
                             className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-md transition-colors flex items-center gap-2"
                         >
                             <Upload size={16} />
                             Conferma Ripristino
                         </button>
                     </div>
                 </div>
             </div>
        )}

        {/* EDIT USER MODAL */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Modifica Utente</h2>
                        <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSaveEdit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input 
                                type="text" 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input 
                                type="text" 
                                value={editUsername}
                                onChange={e => setEditUsername(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="text" 
                                value={editPassword}
                                onChange={e => setEditPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                            <select 
                                value={editRole}
                                onChange={e => setEditRole(e.target.value as UserRole)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="ADMIN">ADMIN (Limitato)</option>
                                <option value="MASTER">MASTER (Completo)</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-2"
                            >
                                <Check size={16} />
                                Salva Modifiche
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};