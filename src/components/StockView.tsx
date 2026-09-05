import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ShieldAlert,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  History,
  TrendingDown,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Product, Batch, StockMovement, User, PharmacySettings } from '../types.ts';
import { api } from '../services/api.ts';

interface StockViewProps {
  products: Product[];
  batches: Batch[];
  movements: StockMovement[];
  currentUser: User | null;
  settings: PharmacySettings | null;
  onRefresh: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  batches,
  movements,
  currentUser,
  settings,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'lotes' | 'movimentos'>('produtos');
  const [filterType, setFilterType] = useState<'TODOS' | 'BAIXO_STOCK' | 'VENCIDOS' | 'VENC_30' | 'VENC_60' | 'VENC_90' | 'CONTROLADOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de formulários
  const [newProductForm, setNewProductForm] = useState({
    nome: '',
    principio_ativo: '',
    categoria: 'Analgésico e Antipirético',
    laboratorio: '',
    forma_farmaceutica: 'Comprimido',
    dosagem: '',
    codigo_barras: '',
    codigo_interno: '',
    preco_custo: 0,
    preco_venda: 0,
    stock_minimo: 15,
    localizacao_prateleira: '',
    requer_receita: false,
    eh_controlado: false,
    lote_inicial: '',
    data_validade_inicial: '',
    quantidade_inicial: 0,
  });

  const [newBatchForm, setNewBatchForm] = useState({
    produto_id: '',
    numero_lote: '',
    data_validade: '',
    quantidade: 10,
    preco_custo: 0,
  });

  const [adjustForm, setAdjustForm] = useState({
    produto_id: '',
    lote_id: '',
    tipo: 'PERDA_AVARIA' as 'AJUSTE_POSITIVO' | 'PERDA_AVARIA' | 'PRODUTO_VENCIDO' | 'DEVOLUCAO',
    quantidade: 1,
    motivo: '',
  });

  const currency = settings?.moeda_simbolo || 'MT';

  // Contadores de alertas
  const lowStockCount = products.filter(p => (p.stock_total || 0) <= p.stock_minimo).length;
  const expiredCount = batches.filter(b => b.status_validade === 'VENCIDO' && b.quantidade_atual > 0).length;
  const near30Count = batches.filter(b => b.status_validade === 'PROXIMO_30' && b.quantidade_atual > 0).length;

  // Filtragem de produtos
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.nome.toLowerCase().includes(term) ||
      p.principio_ativo.toLowerCase().includes(term) ||
      p.codigo_barras.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterType === 'BAIXO_STOCK') return (p.stock_total || 0) <= p.stock_minimo;
    if (filterType === 'CONTROLADOS') return p.eh_controlado;
    if (filterType === 'VENCIDOS') {
      return (p.lotes_disponiveis || []).some(b => b.status_validade === 'VENCIDO' && b.quantidade_atual > 0);
    }
    if (filterType === 'VENC_30') {
      return (p.lotes_disponiveis || []).some(b => b.status_validade === 'PROXIMO_30' && b.quantidade_atual > 0);
    }
    return true;
  });

  // Filtragem de lotes
  const filteredBatches = batches.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      b.numero_lote.toLowerCase().includes(term) ||
      (b.produto_nome && b.produto_nome.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterType === 'VENCIDOS') return b.status_validade === 'VENCIDO';
    if (filterType === 'VENC_30') return b.status_validade === 'PROXIMO_30';
    if (filterType === 'VENC_60') return b.status_validade === 'PROXIMO_60';
    if (filterType === 'VENC_90') return b.status_validade === 'PROXIMO_90';
    return true;
  });

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...newProductForm,
        actor_id: currentUser?.id,
        actor_name: currentUser?.nome,
      });
      setIsNewProductOpen(false);
      onRefresh();
      alert('Medicamento cadastrado com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleSaveNewBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBatch({
        ...newBatchForm,
        actor_id: currentUser?.id,
        actor_name: currentUser?.nome,
      });
      setIsNewBatchOpen(false);
      onRefresh();
      alert('Novo lote registado com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adjustStock({
        ...adjustForm,
        utilizador_id: currentUser?.id,
        utilizador_nome: currentUser?.nome,
      });
      setIsAdjustOpen(false);
      onRefresh();
      alert('Ajuste de stock processado e registado no Kardex!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteProduct(productToDelete.id, {
        id: currentUser?.id,
        nome: currentUser?.nome,
      });
      setProductToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(`Erro ao remover produto: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getExpiryBadge = (status?: string, days?: number) => {
    switch (status) {
      case 'VENCIDO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3" />
            Vencido ({days !== undefined ? Math.abs(days) : 0}d atrás)
          </span>
        );
      case 'PROXIMO_30':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3" />
            Vence em {days} dias
          </span>
        );
      case 'PROXIMO_60':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-800">
            Vence em {days} dias
          </span>
        );
      case 'PROXIMO_90':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
            Vence em {days} dias
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            Válido ({days}d)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            Gestão de Produtos, Stock e Lotes
          </h2>
          <p className="text-xs text-slate-500">
            Controlo por lote (batch), validade FEFO, stock mínimo e histórico de movimentações (Kardex).
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAdjustOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <span>Ajuste / Baixa Manual</span>
          </button>

          <button
            onClick={() => {
              setSelectedProductForBatch(products[0] || null);
              setNewBatchForm({ ...newBatchForm, produto_id: products[0]?.id || '' });
              setIsNewBatchOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Novo Lote</span>
          </button>

          <button
            onClick={() => setIsNewProductOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Medicamento</span>
          </button>
        </div>
      </div>

      {/* Summary Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveSubTab('produtos');
            setFilterType('BAIXO_STOCK');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterType === 'BAIXO_STOCK'
              ? 'border-amber-400 bg-amber-50/70 shadow-xs'
              : 'border-slate-200 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Alerta de Stock Baixo</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{lowStockCount}</div>
          <span className="text-[11px] text-slate-500">Produtos abaixo da quantidade mínima</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('lotes');
            setFilterType('VENCIDOS');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterType === 'VENCIDOS'
              ? 'border-rose-400 bg-rose-50/70 shadow-xs'
              : 'border-slate-200 bg-white hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Produtos Vencidos</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{expiredCount}</div>
          <span className="text-[11px] text-slate-500">Lotes expirados no armazém</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('lotes');
            setFilterType('VENC_30');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterType === 'VENC_30'
              ? 'border-yellow-400 bg-yellow-50/70 shadow-xs'
              : 'border-slate-200 bg-white hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Validade Próxima (≤ 30d)</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black text-yellow-800 mt-1">{near30Count}</div>
          <span className="text-[11px] text-slate-500">Lotes a vencer no próximo mês</span>
        </button>
      </div>

      {/* Sub-tabs & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          
          {/* Subtabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[
              { id: 'produtos', label: 'Catálogo de Produtos' },
              { id: 'lotes', label: 'Controlo de Lotes (FEFO)' },
              { id: 'movimentos', label: 'Histórico / Kardex' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setFilterType('TODOS');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por nome, princípio ativo, lote ou código..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Filtrar:</span>
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'BAIXO_STOCK', label: 'Baixo Stock' },
            { id: 'VENCIDOS', label: 'Vencidos' },
            { id: 'VENC_30', label: 'Vence ≤ 30 Dias' },
            { id: 'VENC_60', label: 'Vence ≤ 60 Dias' },
            { id: 'CONTROLADOS', label: 'Controlados' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 1. SUBTAB: CATÁLOGO DE PRODUTOS */}
        {activeSubTab === 'produtos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Medicamento / Princípio Ativo</th>
                  <th className="py-2.5 px-3">Forma & Lab</th>
                  <th className="py-2.5 px-3 text-right">P. Custo</th>
                  <th className="py-2.5 px-3 text-right">P. Venda</th>
                  <th className="py-2.5 px-3 text-center">Stock / Mínimo</th>
                  <th className="py-2.5 px-3 text-center">Validade Próxima</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(prod => {
                  const stock = prod.stock_total || 0;
                  const isLow = stock <= prod.stock_minimo;
                  const nextBatch = prod.lotes_disponiveis?.[0];

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {prod.codigo_interno}
                        <div className="text-[10px] text-slate-400">{prod.codigo_barras}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{prod.nome}</span>
                          {prod.eh_controlado && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-300">
                              CTRL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 italic">
                          {prod.principio_ativo} {prod.dosagem ? `(${prod.dosagem})` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div>{prod.forma_farmaceutica}</div>
                        <div className="text-[11px] text-slate-400">{prod.laboratorio}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {prod.preco_custo.toFixed(2)} {currency}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {prod.preco_venda.toFixed(2)} {currency}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-md ${
                          stock === 0
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {stock} / {prod.stock_minimo}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {nextBatch ? (
                          getExpiryBadge(nextBatch.status_validade, nextBatch.dias_para_vencer)
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sem lote</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedProductForBatch(prod);
                              setNewBatchForm({ ...newBatchForm, produto_id: prod.id });
                              setIsNewBatchOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Adicionar lote a este produto"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remover produto do catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. SUBTAB: CONTROLO DE LOTES */}
        {activeSubTab === 'lotes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nº Lote (Batch)</th>
                  <th className="py-2.5 px-3">Medicamento</th>
                  <th className="py-2.5 px-3">Data Fabrico</th>
                  <th className="py-2.5 px-3">Data Validade</th>
                  <th className="py-2.5 px-3 text-center">Status Validade</th>
                  <th className="py-2.5 px-3 text-right">Qtd Atual</th>
                  <th className="py-2.5 px-3 text-right">Custo Lote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {batch.numero_lote}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {batch.produto_nome}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {batch.data_fabricacao || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {batch.data_validade}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getExpiryBadge(batch.status_validade, batch.dias_para_vencer)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {batch.quantidade_atual} un
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {batch.preco_custo_lote.toFixed(2)} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. SUBTAB: HISTÓRICO DE MOVIMENTAÇÕES (KARDEX) */}
        {activeSubTab === 'movimentos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Tipo Movimento</th>
                  <th className="py-2.5 px-3">Medicamento & Lote</th>
                  <th className="py-2.5 px-3 text-right">Quantidade</th>
                  <th className="py-2.5 px-3 text-center">Stock Ant. → Resultante</th>
                  <th className="py-2.5 px-3">Operador</th>
                  <th className="py-2.5 px-3">Motivo / Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.slice(0, 50).map((mov, idx) => {
                  const isEntry = mov.tipo_movimento === 'ENTRADA_COMPRA' || mov.tipo_movimento === 'AJUSTE_POSITIVO';
                  return (
                    <tr key={mov.id ? `mov-${mov.id}` : `mov-idx-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(mov.data_movimento).toLocaleString('pt-PT')}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-md ${
                          isEntry
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isEntry ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {mov.tipo_movimento}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{mov.produto_nome}</div>
                        {mov.numero_lote && (
                          <div className="text-[11px] text-slate-500">Lote: {mov.numero_lote}</div>
                        )}
                      </td>

                      <td className={`py-3 px-3 text-right font-mono font-bold ${
                        isEntry ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isEntry ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        {mov.stock_anterior} → <span className="font-bold text-slate-900">{mov.stock_resultante}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        {mov.utilizador_nome}
                      </td>

                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        <span className="font-medium text-slate-800">{mov.referencia_documento || ''}</span>
                        {mov.motivo && <span className="block text-slate-500">{mov.motivo}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL: NOVO PRODUTO */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Medicamento</h3>
              <button onClick={() => setIsNewProductOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paracetamol 500mg"
                    value={newProductForm.nome}
                    onChange={e => setNewProductForm({ ...newProductForm, nome: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Princípio Ativo (DCI) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paracetamol"
                    value={newProductForm.principio_ativo}
                    onChange={e => setNewProductForm({ ...newProductForm, principio_ativo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newProductForm.categoria}
                    onChange={e => setNewProductForm({ ...newProductForm, categoria: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Analgésico e Antipirético">Analgésico e Antipirético</option>
                    <option value="Antibiótico">Antibiótico</option>
                    <option value="Anti-inflamatório">Anti-inflamatório</option>
                    <option value="Anti-hipertensivo">Anti-hipertensivo</option>
                    <option value="Antidiabético Oral">Antidiabético Oral</option>
                    <option value="Gastroprotetor">Gastroprotetor</option>
                    <option value="Anti-histamínico">Anti-histamínico</option>
                    <option value="Ansiolítico / Sedativo">Ansiolítico / Sedativo</option>
                    <option value="Vitaminas e Suplementos">Vitaminas e Suplementos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Forma Farmacêutica</label>
                  <select
                    value={newProductForm.forma_farmaceutica}
                    onChange={e => setNewProductForm({ ...newProductForm, forma_farmaceutica: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Comprimido">Comprimido</option>
                    <option value="Cápsula">Cápsula</option>
                    <option value="Xarope">Xarope</option>
                    <option value="Injetável">Injetável</option>
                    <option value="Pomada">Pomada</option>
                    <option value="Gotas">Gotas</option>
                    <option value="Inalador / Spray">Inalador / Spray</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratório / Fabricante</label>
                  <input
                    type="text"
                    placeholder="Ex: GSK, Basi, Mepha"
                    value={newProductForm.laboratorio}
                    onChange={e => setNewProductForm({ ...newProductForm, laboratorio: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Barras (EAN)</label>
                  <input
                    type="text"
                    placeholder="Ex: 5601234567890"
                    value={newProductForm.codigo_barras}
                    onChange={e => setNewProductForm({ ...newProductForm, codigo_barras: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço de Custo ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProductForm.preco_custo || ''}
                    onChange={e => setNewProductForm({ ...newProductForm, preco_custo: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço de Venda ({currency}) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProductForm.preco_venda || ''}
                    onChange={e => setNewProductForm({ ...newProductForm, preco_venda: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Checkboxes de Medicamento Controlado */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductForm.requer_receita}
                    onChange={e => setNewProductForm({ ...newProductForm, requer_receita: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Requer Receita Médica</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductForm.eh_controlado}
                    onChange={e => setNewProductForm({ ...newProductForm, eh_controlado: e.target.checked, requer_receita: true })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>Medicamento Psicotrópico / Controlado (Retém Receita)</span>
                </label>
              </div>

              {/* Lote Inicial Opcional */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-900">Entrada Inicial de Stock & Lote (Opcional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nº Lote (ex: L-2026-A)"
                    value={newProductForm.lote_inicial}
                    onChange={e => setNewProductForm({ ...newProductForm, lote_inicial: e.target.value })}
                    className="px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg"
                  />
                  <input
                    type="date"
                    value={newProductForm.data_validade_inicial}
                    onChange={e => setNewProductForm({ ...newProductForm, data_validade_inicial: e.target.value })}
                    className="px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Qtd inicial (un)"
                    value={newProductForm.quantidade_inicial || ''}
                    onChange={e => setNewProductForm({ ...newProductForm, quantidade_inicial: parseInt(e.target.value) || 0 })}
                    className="px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Gravar Medicamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LOTE */}
      {isNewBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Registar Novo Lote</h3>
              <button onClick={() => setIsNewBatchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBatch} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicamento *</label>
                <select
                  required
                  value={newBatchForm.produto_id}
                  onChange={e => setNewBatchForm({ ...newBatchForm, produto_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.principio_ativo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número do Lote (Batch) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: L-BASI-2026/04"
                  value={newBatchForm.numero_lote}
                  onChange={e => setNewBatchForm({ ...newBatchForm, numero_lote: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Validade *</label>
                  <input
                    type="date"
                    required
                    value={newBatchForm.data_validade}
                    onChange={e => setNewBatchForm({ ...newBatchForm, data_validade: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBatchForm.quantidade}
                    onChange={e => setNewBatchForm({ ...newBatchForm, quantidade: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewBatchOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Criar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE / BAIXA MANUAL DE STOCK */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-900">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm">Ajuste / Baixa Manual de Stock</h3>
              </div>
              <button onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Movimento *</label>
                <select
                  value={adjustForm.tipo}
                  onChange={e => setAdjustForm({ ...adjustForm, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="PERDA_AVARIA">Perda / Avaria (Frasco partido, blister danificado)</option>
                  <option value="PRODUTO_VENCIDO">Produto Vencido (Segregação sanitária)</option>
                  <option value="AJUSTE_POSITIVO">Ajuste Positivo (Contagem de inventário)</option>
                  <option value="DEVOLUCAO">Devolução de Cliente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicamento *</label>
                <select
                  required
                  value={adjustForm.produto_id}
                  onChange={e => {
                    const prodId = e.target.value;
                    const bList = batches.filter(b => b.produto_id === prodId && b.quantidade_atual > 0);
                    setAdjustForm({
                      ...adjustForm,
                      produto_id: prodId,
                      lote_id: bList[0]?.id || '',
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lote Específico *</label>
                <select
                  required
                  value={adjustForm.lote_id}
                  onChange={e => setAdjustForm({ ...adjustForm, lote_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="">Selecione o lote...</option>
                  {batches
                    .filter(b => b.produto_id === adjustForm.produto_id)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        Lote: {b.numero_lote} (Disp: {b.quantidade_atual} un | Val: {b.data_validade})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade a Ajustar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustForm.quantidade}
                  onChange={e => setAdjustForm({ ...adjustForm, quantidade: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Justificação *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Justifique a movimentação para fins de auditoria de farmácia..."
                  value={adjustForm.motivo}
                  onChange={e => setAdjustForm({ ...adjustForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE REMOÇÃO DE PRODUTO */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50/70">
              <div className="flex items-center gap-2 text-rose-800">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-rose-900">Remover Medicamento</h3>
                  <p className="text-[11px] text-rose-700">Esta ação eliminará o produto do catálogo</p>
                </div>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tem a certeza de que pretende remover este produto da base de dados da farmácia?
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Medicamento:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[240px]">{productToDelete.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Código Interno:</span>
                  <span className="font-mono font-semibold text-slate-700">{productToDelete.codigo_interno}</span>
                </div>
                {productToDelete.principio_ativo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Princípio Ativo:</span>
                    <span className="text-slate-700 italic">{productToDelete.principio_ativo}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Stock Atual:</span>
                  <span className={`font-mono font-bold ${(productToDelete.stock_total || 0) > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                    {productToDelete.stock_total || 0} un
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lotes Registados:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {(productToDelete.lotes_disponiveis || []).length} lote(s)
                  </span>
                </div>
              </div>

              {((productToDelete.stock_total || 0) > 0 || (productToDelete.lotes_disponiveis || []).length > 0) && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-tight">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Atenção ao Inventário:</span> Existem unidades em stock e/ou lotes associados a este medicamento. Ao confirmar, todos os lotes e registos associados deste produto serão também excluídos.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProductToDelete(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteProduct}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A remover...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sim, Remover Produto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
