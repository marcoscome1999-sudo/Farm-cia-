import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { POSView } from './components/POSView.tsx';
import { StockView } from './components/StockView.tsx';
import { PurchasesView } from './components/PurchasesView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { UsersView } from './components/UsersView.tsx';
import { ManualDocsModal } from './components/ManualDocsModal.tsx';
import { UserSwitchModal } from './components/UserSwitchModal.tsx';
import { api } from './services/api.ts';
import {
  Product,
  Batch,
  Sale,
  Supplier,
  Purchase,
  User,
  AuditLog,
  PharmacySettings,
  DashboardSummary,
  StockMovement,
} from './types.ts';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados principais de dados
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Utilizador ativo
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modais globais
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState<boolean>(false);

  // Estado Offline
  const [offlineCount, setOfflineCount] = useState<number>(() => {
    try {
      const q = localStorage.getItem('farmasys_offline_sales');
      return q ? JSON.parse(q).length : 0;
    } catch {
      return 0;
    }
  });

  const checkOfflineCount = useCallback(() => {
    try {
      const q = localStorage.getItem('farmasys_offline_sales');
      setOfflineCount(q ? JSON.parse(q).length : 0);
    } catch {
      setOfflineCount(0);
    }
  }, []);

  // Carregamento de todos os dados do sistema
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        prodsData,
        batchesData,
        salesData,
        suppliersData,
        purchasesData,
        movementsData,
        usersData,
        auditData,
        settingsData,
        summaryData,
      ] = await Promise.all([
        api.getProducts(),
        api.getBatches(),
        api.getSales(),
        api.getSuppliers(),
        api.getPurchases(),
        api.getMovements(),
        api.getUsers(),
        api.getAuditLogs(),
        api.getSettings(),
        api.getDashboardSummary(),
      ]);

      setProducts(prodsData);
      setBatches(batchesData);
      setSales(salesData);
      setSuppliers(suppliersData);
      setPurchases(purchasesData);
      setMovements(movementsData);
      setUsers(usersData);
      setAuditLogs(auditData);
      setSettings(settingsData);
      setSummary(summaryData);

      // Definir utilizador ativo inicial
      if (!currentUser && usersData.length > 0) {
        // Tentar obter do localStorage ou usar o primeiro admin/farmacêutico
        const savedUserId = localStorage.getItem('farmasys_active_user_id');
        const found = usersData.find((u: User) => u.id === savedUserId);
        setCurrentUser(found || usersData[0]);
      }

      checkOfflineCount();
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, checkOfflineCount]);

  useEffect(() => {
    loadAllData();
  }, []);

  // Troca de utilizador
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('farmasys_active_user_id', user.id);
  };

  // Concluir venda (integra com API ou guarda em fila offline)
  const handleSaleComplete = async (saleData: any): Promise<Sale> => {
    try {
      const createdSale = await api.createSale(saleData);
      // Atualizar lista local de vendas
      setSales(prev => [createdSale, ...prev]);
      checkOfflineCount();
      // Recarregar resumo em segundo plano
      api.getDashboardSummary().then(setSummary).catch(() => {});
      return createdSale;
    } catch (err: any) {
      // Se falhar e a venda tiver sido gravada offline pelo service
      checkOfflineCount();
      throw err;
    }
  };

  // Sincronizar vendas offline
  const handleSyncOffline = async () => {
    try {
      const result = await api.syncOfflineSales();
      alert(`Sincronização concluída! ${result.synced} vendas enviadas com sucesso.`);
      checkOfflineCount();
      loadAllData();
    } catch (err: any) {
      alert(`Erro na sincronização: ${err.message}`);
    }
  };

  // Contadores para os Badges do Header
  const lowStockCount = products.filter(p => (p.stock_total || 0) <= p.stock_minimo).length;
  const expiringCount = batches.filter(
    b => (b.status_validade === 'VENCIDO' || b.status_validade === 'PROXIMO_30') && b.quantidade_atual > 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      
      {/* Navegação Superior */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchUser={() => setIsSwitchUserOpen(true)}
        settings={settings}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
        offlineCount={offlineCount}
        onSyncOffline={handleSyncOffline}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Alerta de erro de conexão */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
            <button
              onClick={loadAllData}
              className="ml-auto font-bold underline hover:text-rose-950"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 pb-10">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">A carregar dados da farmácia...</p>
          </div>
        ) : (
          <>
            {/* 1. Módulo PDV / Vendas Rápidas de Balcão */}
            {activeTab === 'pos' && (
              <POSView
                products={products}
                currentUser={currentUser}
                settings={settings}
                onSaleComplete={handleSaleComplete}
                recentSales={sales}
                onRefreshProducts={loadAllData}
              />
            )}

            {/* 2. Módulo Stock, Lotes (FEFO) e Validades */}
            {activeTab === 'stock' && (
              <StockView
                products={products}
                batches={batches}
                movements={movements}
                currentUser={currentUser}
                settings={settings}
                onRefresh={loadAllData}
              />
            )}

            {/* 3. Módulo Compras e Fornecedores */}
            {activeTab === 'purchases' && (
              <PurchasesView
                suppliers={suppliers}
                purchases={purchases}
                products={products}
                currentUser={currentUser}
                settings={settings}
                onRefresh={loadAllData}
              />
            )}

            {/* 4. Módulo Relatórios, Margens e Análises */}
            {activeTab === 'reports' && (
              <ReportsView
                summary={summary}
                settings={settings}
              />
            )}

            {/* 5. Módulo Auditoria */}
            {activeTab === 'audit' && (
              <UsersView
                users={users}
                currentUser={currentUser}
                settings={settings}
                auditLogs={auditLogs}
                onSwitchUser={handleSwitchUser}
                onRefresh={loadAllData}
              />
            )}

            {/* 6. Módulo Configurações / Backup / SQL */}
            {activeTab === 'settings' && (
              <UsersView
                users={users}
                currentUser={currentUser}
                settings={settings}
                auditLogs={auditLogs}
                onSwitchUser={handleSwitchUser}
                onRefresh={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Rodapé Informativo */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {settings?.nome_farmacia || 'FarmaSys'} © {new Date().getFullYear()} • Sistema de Gestão Farmacêutica e Controlo de Stock
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Operador: <strong>{currentUser?.nome || 'Convidado'}</strong></span>
            <span>•</span>
            <span>Perfil: <strong>{currentUser?.nivel_acesso || 'CAIXA'}</strong></span>
            <span>•</span>
            <button
              onClick={() => setIsDocsOpen(true)}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Manual & Schema SQL
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: MANUAL DO UTILIZADOR & DOCUMENTAÇÃO */}
      {isDocsOpen && (
        <ManualDocsModal onClose={() => setIsDocsOpen(false)} />
      )}

      {/* MODAL: TROCA RÁPIDA DE OPERADOR */}
      {isSwitchUserOpen && (
        <UserSwitchModal
          users={users}
          currentUser={currentUser}
          onSelectUser={handleSwitchUser}
          onClose={() => setIsSwitchUserOpen(false)}
        />
      )}

    </div>
  );
}
