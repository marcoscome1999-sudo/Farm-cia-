import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  Search,
  Layers,
  X,
  ArrowDownLeft,
} from 'lucide-react';
import { Supplier, Purchase, Product, User, PharmacySettings } from '../types.ts';
import { api } from '../services/api.ts';

interface PurchasesViewProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  products: Product[];
  currentUser: User | null;
  settings: PharmacySettings | null;
  onRefresh: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  suppliers,
  purchases,
  products,
  currentUser,
  settings,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'encomendas' | 'fornecedores'>('encomendas');
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [receivingPurchase, setReceivingPurchase] = useState<Purchase | null>(null);

  // Estados de novos formulários
  const [supplierForm, setSupplierForm] = useState({
    nome: '',
    nuit_nif: '',
    contacto: '',
    email: '',
    endereco: '',
    prazo_pagamento_dias: 30,
  });

  const [purchaseItems, setPurchaseItems] = useState<{
    produto_id: string;
    produto_nome: string;
    quantidade_pedida: number;
    preco_custo_unitario: number;
  }[]>([]);

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Itens para receção
  const [receivingItems, setReceivingItems] = useState<{
    produto_id: string;
    quantidade: number;
    numero_lote: string;
    data_validade: string;
    preco_custo: number;
  }[]>([]);

  const currency = settings?.moeda_simbolo || 'MT';

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier({
        ...supplierForm,
        actor_id: currentUser?.id,
        actor_name: currentUser?.nome,
      });
      setIsNewSupplierOpen(false);
      onRefresh();
      alert('Fornecedor cadastrado com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleAddProductToPurchase = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    if (purchaseItems.some(it => it.produto_id === prodId)) return;

    setPurchaseItems([
      ...purchaseItems,
      {
        produto_id: prod.id,
        produto_nome: prod.nome,
        quantidade_pedida: 20,
        preco_custo_unitario: prod.preco_custo,
      },
    ]);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) {
      alert('Selecione um fornecedor e pelo menos um item.');
      return;
    }
    try {
      await api.createPurchase({
        fornecedor_id: selectedSupplierId,
        itens: purchaseItems,
        observacoes: purchaseNotes,
        utilizador_id: currentUser?.id,
        utilizador_nome: currentUser?.nome,
      });
      setIsNewPurchaseOpen(false);
      setPurchaseItems([]);
      setPurchaseNotes('');
      onRefresh();
      alert('Encomenda de compra criada com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const startReceiving = (purchase: Purchase) => {
    setReceivingPurchase(purchase);
    const now = new Date();
    const addOneYear = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    setReceivingItems(
      purchase.itens.map((it, idx) => ({
        produto_id: it.produto_id,
        quantidade: it.quantidade_pedida,
        numero_lote: `L-${it.produto_nome.slice(0, 4).toUpperCase()}-${new Date().getFullYear()}${idx + 1}`,
        data_validade: addOneYear,
        preco_custo: it.preco_custo_unitario,
      }))
    );
  };

  const handleConfirmReceival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPurchase) return;

    try {
      await api.receivePurchase(receivingPurchase.id, {
        itensRecebidos: receivingItems,
        utilizador_id: currentUser?.id,
        utilizador_nome: currentUser?.nome,
      });
      setReceivingPurchase(null);
      onRefresh();
      alert('Mercadoria recebida! O stock e os lotes foram alimentados automaticamente.');
    } catch (err: any) {
      alert(`Erro ao receber encomenda: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Fornecedores e Gestão de Compras
          </h2>
          <p className="text-xs text-slate-500">
            Registo de encomendas, controlo de fornecedores e entrada automática de stock com lote e validade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewSupplierOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Novo Fornecedor</span>
          </button>

          <button
            onClick={() => {
              setSelectedSupplierId(suppliers[0]?.id || '');
              setIsNewPurchaseOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Encomenda</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('encomendas')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'encomendas' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Encomendas a Fornecedores ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('fornecedores')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'fornecedores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diretório de Fornecedores ({suppliers.length})
          </button>
        </div>

        {/* 1. ENCOMENDAS */}
        {activeTab === 'encomendas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nº Encomenda</th>
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3">Data Encomenda</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3">Itens</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {pur.numero_encomenda}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{pur.fornecedor_nome}</div>
                      <div className="text-[10px] text-slate-400">Responsável: {pur.utilizador_nome}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {new Date(pur.data_encomenda).toLocaleDateString('pt-PT')}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-md ${
                        pur.estado === 'RECEBIDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pur.estado === 'PENDENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {pur.estado === 'RECEBIDO' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {pur.estado}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[11px]">
                        {pur.itens.map(it => (
                          <div key={it.id} className="text-slate-600">
                            {it.quantidade_pedida}x {it.produto_nome}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {pur.total_compra.toFixed(2)} {currency}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {pur.estado === 'PENDENTE' ? (
                        <button
                          onClick={() => startReceiving(pur)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Dar Entrada</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Entrada concluída</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. FORNECEDORES */}
        {activeTab === 'fornecedores' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 hover:border-emerald-300 transition-colors">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{sup.nome}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    Ativo
                  </span>
                </div>
                
                <div className="text-xs text-slate-600 space-y-1">
                  <div>NUIT/NIF: <span className="font-mono">{sup.nuit_nif || 'Não informado'}</span></div>
                  <div>Contacto: <span className="font-semibold">{sup.contacto}</span></div>
                  {sup.email && <div>Email: {sup.email}</div>}
                  {sup.endereco && <div className="text-slate-500 text-[11px]">{sup.endereco}</div>}
                  <div className="pt-1 text-[11px] text-slate-400">Prazo de Pagamento: {sup.prazo_pagamento_dias} dias</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL: NOVA ENCOMENDA */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Criar Nova Encomenda de Compra</h3>
              <button onClick={() => setIsNewPurchaseOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fornecedor *</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.contacto})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adicionar Medicamentos ao Pedido</label>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddProductToPurchase(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="">Clique para selecionar um medicamento...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>+ {p.nome} (Custo ref: {p.preco_custo} {currency})</option>
                  ))}
                </select>
              </div>

              {/* Lista de Itens do Pedido */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Itens a Encomendar:</span>
                {purchaseItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum item adicionado ainda.</p>
                ) : (
                  purchaseItems.map((item, idx) => (
                    <div key={item.produto_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold flex-1">{item.produto_nome}</span>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500">Qtd:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade_pedida}
                          onChange={e => {
                            const updated = [...purchaseItems];
                            updated[idx].quantidade_pedida = parseInt(e.target.value) || 1;
                            setPurchaseItems(updated);
                          }}
                          className="w-16 px-2 py-1 border rounded text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500">Custo ({currency}):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.preco_custo_unitario}
                          onChange={e => {
                            const updated = [...purchaseItems];
                            updated[idx].preco_custo_unitario = parseFloat(e.target.value) || 0;
                            setPurchaseItems(updated);
                          }}
                          className="w-20 px-2 py-1 border rounded text-right font-bold font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Total da Encomenda */}
              <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Total Previsto da Compra:</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {purchaseItems.reduce((acc, it) => acc + (it.quantidade_pedida * it.preco_custo_unitario), 0).toFixed(2)} {currency}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações da Encomenda</label>
                <textarea
                  rows={2}
                  value={purchaseNotes}
                  onChange={e => setPurchaseNotes(e.target.value)}
                  placeholder="Ex: Entrega urgente com guia de transporte e certificado analítico de lote..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:bg-slate-300"
                >
                  Emitir Encomenda
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAR ENTRADA NA ENCOMENDA (RECEÇÃO DE MERCADORIA) */}
      {receivingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-2 text-emerald-900">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base">Receção de Compra - {receivingPurchase.numero_encomenda}</h3>
                  <p className="text-xs text-emerald-800">Fornecedor: {receivingPurchase.fornecedor_nome}</p>
                </div>
              </div>
              <button onClick={() => setReceivingPurchase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceival} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-semibold">Registo Sanitário de Lotes:</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Ao confirmar a receção, o stock da farmácia será alimentado imediatamente e os novos lotes ficarão disponíveis para venda FEFO.
                </p>
              </div>

              <div className="space-y-3">
                {receivingItems.map((it, idx) => {
                  const prod = products.find(p => p.id === it.produto_id);
                  return (
                    <div key={it.produto_id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-slate-900 text-xs">{prod?.nome || 'Medicamento'}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">Qtd Recebida (un) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={it.quantidade}
                            onChange={e => {
                              const updated = [...receivingItems];
                              updated[idx].quantidade = parseInt(e.target.value) || 0;
                              setReceivingItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">Nº do Lote (Batch) *</label>
                          <input
                            type="text"
                            required
                            placeholder="L-12345"
                            value={it.numero_lote}
                            onChange={e => {
                              const updated = [...receivingItems];
                              updated[idx].numero_lote = e.target.value;
                              setReceivingItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">Data de Validade *</label>
                          <input
                            type="date"
                            required
                            value={it.data_validade}
                            onChange={e => {
                              const updated = [...receivingItems];
                              updated[idx].data_validade = e.target.value;
                              setReceivingItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReceivingPurchase(null)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Confirmar Entrada em Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO FORNECEDOR */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Cadastrar Fornecedor</h3>
              <button onClick={() => setIsNewSupplierOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Empresa / Distribuidora *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Medis Farmacêutica"
                  value={supplierForm.nome}
                  onChange={e => setSupplierForm({ ...supplierForm, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NUIT / NIF</label>
                  <input
                    type="text"
                    placeholder="400192831"
                    value={supplierForm.nuit_nif}
                    onChange={e => setSupplierForm({ ...supplierForm, nuit_nif: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contacto Telefónico *</label>
                  <input
                    type="text"
                    required
                    placeholder="+258 21 490 120"
                    value={supplierForm.contacto}
                    onChange={e => setSupplierForm({ ...supplierForm, contacto: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail de Encomendas</label>
                <input
                  type="email"
                  placeholder="encomendas@fornecedor.co.mz"
                  value={supplierForm.email}
                  onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço / Armazém</label>
                <input
                  type="text"
                  placeholder="Avenida ou Parque Industrial"
                  value={supplierForm.endereco}
                  onChange={e => setSupplierForm({ ...supplierForm, endereco: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
