import React, { useState } from 'react';
import {
  Store,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  BookOpen,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Boxes,
  Truck,
  BarChart3,
  FileText,
  Sliders,
} from 'lucide-react';
import { User, PharmacySettings } from '../types.ts';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onSwitchUser: () => void;
  settings: PharmacySettings | null;
  lowStockCount: number;
  expiringCount: number;
  offlineCount: number;
  onSyncOffline: () => void;
  onOpenDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  settings,
  lowStockCount,
  expiringCount,
  offlineCount,
  onSyncOffline,
  onOpenDocs,
}) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await onSyncOffline();
    setTimeout(() => setSyncing(false), 800);
  };

  const navItems = [
    { id: 'pos', label: 'Vendas (PDV)', icon: ShoppingBag },
    { id: 'stock', label: 'Stock & Lotes', icon: Boxes, badge: lowStockCount + expiringCount },
    { id: 'purchases', label: 'Compras', icon: Truck },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'audit', label: 'Auditoria', icon: ShieldCheck },
    { id: 'settings', label: 'Sistema & SQL', icon: Sliders },
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FARMACEUTICO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CAIXA':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Pharmacy Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  {settings?.nome_farmacia || 'FarmaSys'}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PDV Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                {settings?.alvara_sanitario ? `Alvará: ${settings.alvara_sanitario}` : 'Sistema de Gestão Farmacêutica'}
              </p>
            </div>
          </div>

          {/* Actions: Sync Status, Docs, User Switch */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Offline sync badge */}
            {offlineCount > 0 ? (
              <button
                onClick={handleSync}
                disabled={syncing}
                title="Vendas gravadas localmente aguardando envio ao servidor"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{offlineCount} Pendente(s)</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span>Online</span>
              </div>
            )}

            {/* Documentação & Guia */}
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Manual do utilizador e guia de instalação"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Manual & SQL</span>
            </button>

            {/* Operador / User Profile */}
            {currentUser && (
              <div className="flex items-center pl-2 border-l border-slate-200 gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.nome}
                  </div>
                  <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium ${getRoleBadge(currentUser.nivel_acesso)}`}>
                    {currentUser.nivel_acesso}
                  </span>
                </div>

                <button
                  onClick={onSwitchUser}
                  title="Trocar operador ou introduzir PIN"
                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium sm:hidden">{currentUser.nome.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-100">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
