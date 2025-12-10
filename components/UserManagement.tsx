
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { generateId } from '../constants';
import { Trash2, UserPlus, ShieldAlert, User as UserIcon, Edit2, Check, X } from 'lucide-react';

interface Props {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUserId: string;
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

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-hidden overflow-y-auto">
        
        {/* ADD USER CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <ShieldAlert className="text-indigo-600" />
                Gestione Utenti e Permessi
            </h2>
            <p className="text-gray-500 text-sm mb-6">
                Aggiungi nuovi utenti al sistema. Il ruolo <strong>MASTER</strong> ha accesso completo. Il ruolo <strong>ADMIN</strong> não può accedere a questa pagina.
            </p>

            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Es. Mario Rossi" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Username</label>
                    <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="login_user" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                    <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="****" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ruolo</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                        <option value="ADMIN">ADMIN (Limitato)</option>
                        <option value="MASTER">MASTER (Completo)</option>
                    </select>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors h-[38px]">
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
                                    <button onClick={() => handleStartEdit(user)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Modifica Utente"><Edit2 size={18} /></button>
                                    {user.id !== currentUserId && <button onClick={() => handleDelete(user)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" title="Elimina Utente"><Trash2 size={18} /></button>}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* EDIT USER MODAL */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Modifica Utente</h2>
                        <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label><select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"><option value="ADMIN">ADMIN (Limitato)</option><option value="MASTER">MASTER (Completo)</option></select></div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Annulla</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-2"><Check size={16} /> Salva Modifiche</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
