import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  KeyRound,
  History,
  Settings,
  Download,
  Upload,
  CheckCircle2,
  X,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  Database,
} from 'lucide-react';
import { User, AuditLog, PharmacySettings } from '../types.ts';
import { api } from '../services/api.ts';

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  settings: PharmacySettings | null;
  auditLogs: AuditLog[];
  onSwitchUser: (user: User) => void;
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  settings,
  auditLogs,
  onSwitchUser,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'utilizadores' | 'auditoria' | 'configuracoes'>('utilizadores');
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<PharmacySettings>(
    settings || {
      nome_farmacia: 'FarmaSys Farmácia Central',
      nuit_nif: '400982314',
      endereco: 'Avenida 24 de Julho, 1420, Maputo',
      contacto: '+258 21 300 400',
      email: 'contacto@farmasys.co.mz',
      moeda_simbolo: 'MT',
      moeda_nome: 'Meticais',
      taxa_iva_padrao: 0,
      dias_alerta_vencimento_1: 30,
      dias_alerta_vencimento_2: 60,
      dias_alerta_vencimento_3: 90,
      mensagem_recibo_rodape: 'Obrigado pela sua preferência! Desejamos-lhe as melhoras.',
      exigir_receita_psicotropicos: true,
    }
  );

  const [newUserForm, setNewUserForm] = useState({
    nome: '',
    username: '',
    email: '',
    nivel_acesso: 'CAIXA' as 'ADMINISTRADOR' | 'FARMACEUTICO' | 'CAIXA',
    senha: '',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        ...newUserForm,
        actor_id: currentUser?.id,
        actor_name: currentUser?.nome,
      });
      setIsNewUserOpen(false);
      onRefresh();
      alert('Utilizador cadastrado com sucesso!');
    } catch (err: any) {
      alert(`Erro ao criar utilizador: ${err.message}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        ...settingsForm,
        actor_id: currentUser?.id,
        actor_name: currentUser?.nome,
      });
      onRefresh();
      alert('Configurações da farmácia atualizadas com sucesso!');
    } catch (err: any) {
      alert(`Erro ao gravar configurações: ${err.message}`);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const backupData = await api.getBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `farmasys_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`Erro ao gerar backup: ${err.message}`);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await api.restoreBackup({
          backupData: parsed,
          actor_id: currentUser?.id,
          actor_name: currentUser?.nome,
        });
        onRefresh();
        alert('Backup restaurado com sucesso! A base de dados foi recarregada.');
      } catch (err: any) {
        alert(`Ficheiro de backup inválido: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Controlo de Acessos, Auditoria e Configurações
          </h2>
          <p className="text-xs text-slate-500">
            Perfis de utilizador (Admin, Farmacêutico, Caixa), registo legal de auditoria e definições gerais da farmácia.
          </p>
        </div>

        <button
          onClick={() => setIsNewUserOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Operador / Farmacêutico</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('utilizadores')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'utilizadores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Utilizadores & Cargos ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'auditoria' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registo de Auditoria ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'configuracoes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Configurações da Farmácia & Backup
          </button>
        </div>

        {/* 1. UTILIZADORES */}
        {activeTab === 'utilizadores' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>
                Sessão ativa como: <strong className="text-slate-900">{currentUser?.nome}</strong> ({currentUser?.nivel_acesso})
              </span>
              <span className="text-[11px] text-slate-400">
                Dica: Você pode alternar rapidamente para testar as permissões de cada perfil.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => {
                const isCurrent = user.id === currentUser?.id;
                return (
                  <div
                    key={user.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {user.nome}
                          {isCurrent && (
                            <span className="text-[10px] font-semibold px-2 py-0.2 bg-emerald-600 text-white rounded-full">
                              Atual
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-slate-500">@{user.username} • {user.email}</span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        user.nivel_acesso === 'ADMINISTRADOR'
                          ? 'bg-purple-100 text-purple-800'
                          : user.nivel_acesso === 'FARMACEUTICO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {user.nivel_acesso}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {user.ativo ? 'Conta ativa' : 'Desativado'}
                      </span>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onSwitchUser(user);
                            alert(`Sessão alterada para ${user.nome} (${user.nivel_acesso}).`);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Trocar para este
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. REGISTO DE AUDITORIA */}
        {activeTab === 'auditoria' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Data e Hora</th>
                  <th className="py-2.5 px-3">Operador / Utilizador</th>
                  <th className="py-2.5 px-3">Ação Realizada</th>
                  <th className="py-2.5 px-3">Módulo / Tabela</th>
                  <th className="py-2.5 px-3">Detalhes do Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.data_hora).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {log.utilizador_nome}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{log.tabela_afetada}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {log.detalhes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. CONFIGURAÇÕES & BACKUP */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Farmácia *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.nome_farmacia}
                    onChange={e => setSettingsForm({ ...settingsForm, nome_farmacia: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NUIT / NIF da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.nuit_nif}
                    onChange={e => setSettingsForm({ ...settingsForm, nuit_nif: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contacto Telefónico</label>
                  <input
                    type="text"
                    value={settingsForm.contacto}
                    onChange={e => setSettingsForm({ ...settingsForm, contacto: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Físico</label>
                <input
                  type="text"
                  value={settingsForm.endereco}
                  onChange={e => setSettingsForm({ ...settingsForm, endereco: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Símbolo da Moeda</label>
                  <input
                    type="text"
                    value={settingsForm.moeda_simbolo}
                    onChange={e => setSettingsForm({ ...settingsForm, moeda_simbolo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Moeda</label>
                  <input
                    type="text"
                    value={settingsForm.moeda_nome}
                    onChange={e => setSettingsForm({ ...settingsForm, moeda_nome: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taxa de IVA Padrão (%)</label>
                  <input
                    type="number"
                    value={settingsForm.taxa_iva_padrao}
                    onChange={e => setSettingsForm({ ...settingsForm, taxa_iva_padrao: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mensagem de Rodapé nos Recibos Térmicos</label>
                <input
                  type="text"
                  value={settingsForm.mensagem_recibo_rodape}
                  onChange={e => setSettingsForm({ ...settingsForm, mensagem_recibo_rodape: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Salvar Definições da Farmácia
              </button>
            </form>

            {/* Secção de Backup e Restauro */}
            <div className="pt-6 border-t border-slate-200 max-w-2xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Cópia de Segurança (Backup) e Restauro da Base de Dados
              </h4>
              <p className="text-xs text-slate-500">
                Gere um ficheiro JSON com todos os produtos, lotes, vendas, compras e auditoria da farmácia para salvaguarda externa.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descarregar Backup Completo (JSON)</span>
                </button>

                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Restaurar Ficheiro de Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: NOVO UTILIZADOR */}
      {isNewUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Criar Novo Utilizador</h3>
              <button onClick={() => setIsNewUserOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teresa Mondlane"
                  value={newUserForm.nome}
                  onChange={e => setNewUserForm({ ...newUserForm, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="teresa.m"
                    value={newUserForm.username}
                    onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Senha Provisória *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserForm.senha}
                    onChange={e => setNewUserForm({ ...newUserForm, senha: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Profissional</label>
                <input
                  type="email"
                  placeholder="teresa@farmacia.co.mz"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Nível de Acesso *</label>
                <select
                  value={newUserForm.nivel_acesso}
                  onChange={e => setNewUserForm({ ...newUserForm, nivel_acesso: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="CAIXA">Caixa / Balcão (Apenas vendas PDV, descontos até 5%)</option>
                  <option value="FARMACEUTICO">Farmacêutico (Gestão de lotes, validação de receitas e descontos)</option>
                  <option value="ADMINISTRADOR">Administrador (Acesso integral e auditoria financeira)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewUserOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Gravar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
