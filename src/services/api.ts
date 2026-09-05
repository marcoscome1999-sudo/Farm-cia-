import {
  Product,
  Batch,
  Sale,
  Supplier,
  Purchase,
  StockMovement,
  AuditLog,
  PharmacySettings,
  ReportSummary,
  User,
} from '../types.ts';

const OFFLINE_SALES_KEY = 'farmasys_offline_sales_queue';

export const api = {
  // Autenticação
  async login(credentials: { email?: string; password?: string; pin?: string }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha na autenticação');
    }
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Erro ao carregar utilizadores');
    return res.json();
  },

  async createUser(userData: Partial<User> & { actor_id?: string; actor_name?: string }): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar utilizador');
    }
    return res.json();
  },

  async updateUser(id: string, userData: Partial<User> & { actor_id?: string; actor_name?: string }): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error('Erro ao atualizar utilizador');
    return res.json();
  },

  // Produtos e Stock
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Erro ao carregar produtos');
    return res.json();
  },

  async createProduct(productData: any): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar produto');
    }
    return res.json();
  },

  async updateProduct(id: string, productData: any): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar produto');
    }
    return res.json();
  },

  async deleteProduct(id: string, actor?: { id?: string; nome?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_id: actor?.id, actor_name: actor?.nome }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao remover produto');
    }
    return res.json();
  },

  async getBatches(): Promise<Batch[]> {
    const res = await fetch('/api/batches');
    if (!res.ok) throw new Error('Erro ao carregar lotes');
    return res.json();
  },

  async createBatch(batchData: any): Promise<Batch> {
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar lote');
    }
    return res.json();
  },

  async adjustStock(adjustData: any): Promise<any> {
    const res = await fetch('/api/stock/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao realizar ajuste de stock');
    }
    return res.json();
  },

  async getStockMovements(): Promise<StockMovement[]> {
    const res = await fetch('/api/stock/movements');
    if (!res.ok) throw new Error('Erro ao carregar movimentos de stock');
    return res.json();
  },

  // Vendas (PDV)
  async createSale(saleData: any): Promise<Sale> {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registar venda');
      }
      return res.json();
    } catch (networkOrServerError: any) {
      // Suporte a modo offline: guarda localmente para sincronizar depois
      console.warn('Conexão instável ou offline detectada. Guardando venda na fila local:', networkOrServerError);
      const offlineQueue = api.getOfflineQueue();
      const tempSale: Sale = {
        ...saleData,
        id: 'off_' + Date.now(),
        numero_fatura: `FT-OFF/${String(offlineQueue.length + 1).padStart(3, '0')}`,
        estado: 'CONCLUIDA',
        data_venda: new Date().toISOString(),
        offline_synced: false,
      };
      offlineQueue.push(tempSale);
      localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(offlineQueue));
      return tempSale;
    }
  },

  getOfflineQueue(): Sale[] {
    try {
      const raw = localStorage.getItem(OFFLINE_SALES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async syncOfflineSales(): Promise<{ synced: number; remaining: number }> {
    const queue = api.getOfflineQueue();
    if (queue.length === 0) return { synced: 0, remaining: 0 };
    let synced = 0;
    const remaining: Sale[] = [];

    for (const sale of queue) {
      try {
        const { id, numero_fatura, offline_synced, ...payload } = sale;
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          synced++;
        } else {
          remaining.push(sale);
        }
      } catch {
        remaining.push(sale);
      }
    }
    localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(remaining));
    return { synced, remaining: remaining.length };
  },

  async getSales(): Promise<Sale[]> {
    const res = await fetch('/api/sales');
    if (!res.ok) throw new Error('Erro ao carregar vendas');
    const onlineSales: Sale[] = await res.json();
    const offlineQueue = api.getOfflineQueue();
    return [...offlineQueue.filter(o => !o.offline_synced), ...onlineSales];
  },

  async getPrescriptions(): Promise<any[]> {
    const res = await fetch('/api/prescriptions');
    if (!res.ok) throw new Error('Erro ao carregar receitas');
    return res.json();
  },

  // Fornecedores e Compras
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch('/api/suppliers');
    if (!res.ok) throw new Error('Erro ao carregar fornecedores');
    return res.json();
  },

  async createSupplier(data: any): Promise<Supplier> {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao criar fornecedor');
    return res.json();
  },

  async updateSupplier(id: string, data: any): Promise<Supplier> {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar fornecedor');
    return res.json();
  },

  async getPurchases(): Promise<Purchase[]> {
    const res = await fetch('/api/purchases');
    if (!res.ok) throw new Error('Erro ao carregar encomendas');
    return res.json();
  },

  async createPurchase(data: any): Promise<Purchase> {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar encomenda');
    }
    return res.json();
  },

  async receivePurchase(id: string, data: any): Promise<Purchase> {
    const res = await fetch(`/api/purchases/${id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao confirmar receção');
    }
    return res.json();
  },

  async getMovements(): Promise<StockMovement[]> {
    return api.getStockMovements();
  },

  // Relatórios
  async getReportSummary(): Promise<ReportSummary> {
    const res = await fetch('/api/reports/summary');
    if (!res.ok) throw new Error('Erro ao carregar sumário');
    return res.json();
  },

  async getDashboardSummary(): Promise<ReportSummary> {
    try {
      const [summaryRes, topProds, stagnant, batches] = await Promise.all([
        fetch('/api/reports/summary').then(r => r.json()),
        fetch('/api/reports/top-products').then(r => r.json()),
        fetch('/api/reports/stagnant').then(r => r.json()),
        fetch('/api/batches').then(r => r.json()),
      ]);

      const criticalBatches = batches.filter(
        (b: any) => (b.status_validade === 'VENCIDO' || b.status_validade === 'PROXIMO_30') && b.quantidade_atual > 0
      );

      const paymentMap: Record<string, { total: number; quantidade: number }> = {};
      (summaryRes.vendas_por_pagamento || []).forEach((p: any) => {
        paymentMap[p.metodo] = { total: p.total, quantidade: p.contagem };
      });

      return {
        ...summaryRes,
        total_vendas_valor: summaryRes.vendas_mes_total || 0,
        total_vendas_quantidade: summaryRes.vendas_hoje_contagem || 0,
        lucro_bruto_estimado: summaryRes.lucro_mes_estimado || 0,
        margem_lucro_percentual: summaryRes.margem_lucro_media || 0,
        produtos_baixo_stock: summaryRes.produtos_baixo_stock || 0,
        produtos_vencidos: summaryRes.produtos_vencidos || 0,
        lotes_vencidos: summaryRes.produtos_vencidos || 0,
        valor_stock_custo: summaryRes.valor_stock_custo || 0,
        valor_stock_venda: summaryRes.valor_stock_venda || 0,
        produtos_mais_vendidos: (topProds || []).map((tp: any, index: number) => ({
          produto_id: tp.produto_id || tp.id || `prod-top-${index}`,
          produto_nome: tp.nome || tp.produto_nome || 'Medicamento',
          quantidade_vendida: tp.quantidade || 0,
          receita_total: tp.receita || 0,
          lucro_estimado: tp.lucro || 0,
        })),
        produtos_estagnados: stagnant || [],
        lotes_validade_critica: criticalBatches || [],
        vendas_por_forma_pagamento: paymentMap,
      };
    } catch {
      return api.getReportSummary();
    }
  },

  async getBackup(): Promise<any> {
    const res = await fetch('/api/backup/export');
    if (!res.ok) throw new Error('Erro ao exportar backup');
    return res.json();
  },

  async getTopProducts(): Promise<any[]> {
    const res = await fetch('/api/reports/top-products');
    if (!res.ok) throw new Error('Erro ao carregar top produtos');
    return res.json();
  },

  async getStagnantProducts(dias: number = 30): Promise<any[]> {
    const res = await fetch(`/api/reports/stagnant?dias=${dias}`);
    if (!res.ok) throw new Error('Erro ao carregar produtos parados');
    return res.json();
  },

  // Configurações, Auditoria, Backup
  async getSettings(): Promise<PharmacySettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Erro ao carregar configurações');
    return res.json();
  },

  async updateSettings(settings: Partial<PharmacySettings> & { actor_id?: string; actor_name?: string }): Promise<PharmacySettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Erro ao salvar configurações');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Erro ao carregar logs de auditoria');
    return res.json();
  },

  async restoreBackup(data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao restaurar base de dados');
    return res.json();
  },

  async getSqlSchema(): Promise<string> {
    const res = await fetch('/api/schema.sql');
    if (!res.ok) throw new Error('Erro ao ler schema SQL');
    return res.text();
  },
};
