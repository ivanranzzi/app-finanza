
import React, { useState } from 'react';
import { User } from '../types';
import { LayoutGrid, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
  appTitle: string;
  appSubtitle: string;
  logo: string | null;
}

export const Login: React.FC<Props> = ({ users, onLogin, appTitle, appSubtitle, logo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenziali non valide');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-indigo-600 p-8 text-center">
            {logo ? (
                 <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 p-2 shadow-lg">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                 </div>
            ) : (
                <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <LayoutGrid size={32} className="text-white" />
                </div>
            )}
            <h1 className="text-2xl font-bold text-white">{appTitle}</h1>
            <p className="text-indigo-200 text-sm mt-1">{appSubtitle}</p>
        </div>

        <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Accedi al Sistema</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}
                
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Nome Utente"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    Entra
                    <ArrowRight size={18} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
