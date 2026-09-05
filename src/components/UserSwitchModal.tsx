import React, { useState } from 'react';
import { X, Users, Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { User } from '../types.ts';

interface UserSwitchModalProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  users,
  currentUser,
  onSelectUser,
  onClose,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || users[0]?.id || '');
  const [pinInput, setPinInput] = useState('');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      onSelectUser(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Trocar de Operador / Perfil</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Selecione o profissional que está a operar o balcão da farmácia neste momento:
          </p>

          <div className="space-y-2">
            {users.map(u => {
              const isSelected = selectedUserId === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{u.nome}</div>
                    <div className="text-[11px] text-slate-500">@{u.username} • {u.email}</div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    u.nivel_acesso === 'ADMINISTRADOR'
                      ? 'bg-purple-100 text-purple-800'
                      : u.nivel_acesso === 'FARMACEUTICO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.nivel_acesso}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
            >
              Confirmar Operador
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
