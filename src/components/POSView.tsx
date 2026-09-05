import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  History,
  Sparkles,
  Camera,
  Layers,
  Clock,
  Printer,
} from 'lucide-react';
import { Product, CartItem, Batch, Sale, MedicalPrescription, User, PharmacySettings } from '../types.ts';
import { PaymentModal } from './PaymentModal.tsx';
import { PrescriptionModal } from './PrescriptionModal.tsx';
import { ReceiptModal } from './ReceiptModal.tsx';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';

interface POSViewProps {
  products: Product[];
  currentUser: User | null;
  settings: PharmacySettings | null;
  onSaleComplete: (saleData: any) => Promise<Sale>;
  recentSales: Sale[];
  onRefreshProducts: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  currentUser,
  settings,
  onSaleComplete,
  recentSales,
  onRefreshProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<MedicalPrescription | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [showRecentSales, setShowRecentSales] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const currency = settings?.moeda_simbolo || 'MT';

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Categorias únicas
  const categories = ['TODOS', ...Array.from(new Set(products.map(p => p.categoria)))];

  // Filtro de produtos
  const filteredProducts = products.filter(p => {
    if (!p.ativo) return false;
    const matchesCat = selectedCategory === 'TODOS' || p.categoria === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesCat;

    const matchesSearch =
      p.nome.toLowerCase().includes(term) ||
      p.principio_ativo.toLowerCase().includes(term) ||
      p.codigo_barras.toLowerCase().includes(term) ||
      p.codigo_interno.toLowerCase().includes(term) ||
      (p.dosagem && p.dosagem.toLowerCase().includes(term));

    return matchesCat && matchesSearch;
  });

  // Adicionar ao carrinho com FEFO automático
  const addToCart = (product: Product, customBatch?: Batch) => {
    // Filtrar lotes válidos com stock
    const availableBatches = (product.lotes_disponiveis || []).filter(
      b => b.quantidade_atual > 0 && b.status_validade !== 'VENCIDO'
    );

    if (availableBatches.length === 0) {
      alert(`O medicamento "${product.nome}" está sem stock válido no momento.`);
      return;
    }

    const batchToUse = customBatch || availableBatches[0]; // FEFO: primeiro lote a vencer

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.produto.id === product.id && item.loteSelecionado.id === batchToUse.id
      );

      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.quantidade + 1 > batchToUse.quantidade_atual) {
          alert(`Limite de stock atingido para o lote ${batchToUse.numero_lote} (${batchToUse.quantidade_atual} un disponíveis).`);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...item,
          quantidade: item.quantidade + 1,
          subtotal: (item.quantidade + 1) * product.preco_venda,
        };
        return updated;
      }

      return [
        ...prevCart,
        {
          produto: product,
          loteSelecionado: batchToUse,
          quantidade: 1,
          desconto_unitario: 0,
          subtotal: product.preco_venda,
        },
      ];
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const item = prev[index];
      if (newQty > item.loteSelecionado.quantidade_atual) {
        alert(`Stock disponível no lote ${item.loteSelecionado.numero_lote} é de ${item.loteSelecionado.quantidade_atual} un.`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = {
        ...item,
        quantidade: newQty,
        subtotal: newQty * item.produto.preco_venda,
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setPrescriptionData(null);
  };

  const handleBarcodeScanned = (code: string) => {
    setIsScannerOpen(false);
    const found = products.find(p => p.codigo_barras === code || p.codigo_interno === code);
    if (found) {
      addToCart(found);
      setSearchTerm('');
    } else {
      setSearchTerm(code);
      alert(`Nenhum produto cadastrado com o código ${code}. O termo foi colocado na pesquisa.`);
    }
  };

  // Cálculo de totais
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, it) => acc + it.quantidade, 0);

  // Verificação de medicamentos controlados no carrinho
  const controlledItems = cart.filter(it => it.produto.eh_controlado);
  const hasControlledItems = controlledItems.length > 0;
  const controlledNames = controlledItems.map(it => `${it.produto.nome} (${it.quantidade} un)`);

  const handleFinalizeSale = async (paymentData: any) => {
    try {
      const salePayload = {
        ...paymentData,
        caixa_utilizador_id: currentUser?.id || 'usr_caixa_01',
        caixa_nome: currentUser?.nome || 'Operador de Balcão',
        subtotal,
        itens: cart.map(it => ({
          produto_id: it.produto.id,
          produto_nome: it.produto.nome,
          principio_ativo: it.produto.principio_ativo,
          lote_id: it.loteSelecionado.id,
          numero_lote: it.loteSelecionado.numero_lote,
          quantidade: it.quantidade,
          preco_unitario: it.produto.preco_venda,
          preco_custo_unitario: it.produto.preco_custo,
          desconto_item: 0,
          subtotal_item: it.subtotal,
        })),
        receita: hasControlledItems ? prescriptionData : undefined,
      };

      const completed = await onSaleComplete(salePayload);
      setLastCompletedSale(completed);
      clearCart();
      setIsPaymentOpen(false);
      onRefreshProducts();
    } catch (err: any) {
      alert(`Erro ao concluir venda: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      
      {/* Top Banner / Quick search row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Pesquisar por nome, princípio ativo (DCI), dosagem ou código de barras... (F2)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-2xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
              title="Ler código com a câmara"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecentSales(!showRecentSales)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
              showRecentSales
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Últimas Vendas</span>
          </button>
        </div>

      </div>

      {/* Categories chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main POS Grid: Left catalog, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product Cards / Search results */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Recent Sales Drawer if active */}
          {showRecentSales && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Vendas Recentes do Balcão
                </span>
                <span className="text-xs text-slate-500">{recentSales.length} registadas hoje</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto mt-2">
                {recentSales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{sale.numero_fatura}</span>
                      <span className="text-slate-500 ml-2">{sale.cliente_nome}</span>
                      <div className="text-[11px] text-slate-400">
                        {new Date(sale.data_venda).toLocaleTimeString('pt-PT')} • {sale.forma_pagamento} • Operador: {sale.caixa_nome}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-700">
                        {sale.total_liquido.toFixed(2)} {currency}
                      </span>
                      <button
                        onClick={() => setLastCompletedSale(sale)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Ver / Reimprimir Recibo"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Nenhum produto encontrado</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tente alterar os termos da pesquisa ou a categoria selecionada.
                </p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const stock = product.stock_total || 0;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= product.stock_minimo;
                const nearestBatch = product.lotes_disponiveis?.[0];

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`bg-white p-4 rounded-2xl border transition-all relative flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                        {product.categoria}
                      </span>
                      
                      {product.eh_controlado && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          <ShieldAlert className="w-3 h-3" />
                          Controlado
                        </span>
                      )}
                    </div>

                    {/* Product Names */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {product.nome}
                      </h4>
                      <p className="text-xs text-slate-500 italic line-clamp-1">
                        {product.principio_ativo} {product.dosagem ? `• ${product.dosagem}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {product.forma_farmaceutica} • {product.laboratorio}
                      </p>
                    </div>

                    {/* FEFO Batch Indicator */}
                    {nearestBatch && (
                      <div className="my-2.5 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Layers className="w-3 h-3 text-slate-400" />
                          Lote: {nearestBatch.numero_lote}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          Val: {new Date(nearestBatch.data_validade).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    )}

                    {/* Bottom: Price & Stock Status */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <div className="text-base font-black text-slate-900 font-mono">
                          {product.preco_venda.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-slate-500">{currency}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                            Esgotado
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Baixo: {stock} un
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Stock: {stock} un
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Checkout Cart */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Carrinho de Venda</h3>
                  <span className="text-xs text-slate-500">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} no balcão
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Esvaziar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">O carrinho está vazio.</p>
                  <p className="text-[11px] text-slate-400">
                    Clique num medicamento à esquerda ou escaneie o código de barras.
                  </p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.produto.id}-${item.loteSelecionado.id}`}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2"
                  >
                    {/* Item Name & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.produto.nome}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span>Lote: {item.loteSelecionado.numero_lote}</span>
                          <span>•</span>
                          <span>Val: {item.loteSelecionado.data_validade}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remover do carrinho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity controls & Subtotal */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2 py-1">
                        <button
                          onClick={() => updateQuantity(idx, item.quantidade - 1)}
                          className="p-0.5 text-slate-500 hover:text-slate-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => updateQuantity(idx, item.quantidade + 1)}
                          className="p-0.5 text-slate-500 hover:text-slate-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {item.subtotal.toFixed(2)} {currency}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          @{item.produto.preco_venda.toFixed(2)} un
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Controlled items warning box */}
            {hasControlledItems && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Medicamento Controlado
                  </span>
                  <button
                    onClick={() => setIsPrescriptionOpen(true)}
                    className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
                  >
                    {prescriptionData ? 'Editar Receita' : 'Preencher Receita'}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800">
                  {prescriptionData
                    ? `Receita nº ${prescriptionData.numero_receita} (Dr. ${prescriptionData.nome_medico}) anexada.`
                    : 'A retenção de receita médica é legalmente obrigatória para concluir esta venda.'}
                </p>
              </div>
            )}

            {/* Subtotal & Checkout Trigger */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-slate-600 text-xs">
                <span>Subtotal ({totalItemsCount} itens):</span>
                <span className="font-semibold">{subtotal.toFixed(2)} {currency}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total a Pagar:</span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {subtotal.toFixed(2)} <span className="text-xs font-normal">{currency}</span>
                </span>
              </div>

              <button
                onClick={() => setIsPaymentOpen(true)}
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <span>Finalizar Venda (F4)</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* MODAIS */}
      {isPaymentOpen && (
        <PaymentModal
          subtotal={subtotal}
          currency={currency}
          currentUser={currentUser}
          settings={settings}
          hasControlledItems={hasControlledItems}
          prescription={prescriptionData}
          onOpenPrescription={() => setIsPrescriptionOpen(true)}
          onCompleteSale={handleFinalizeSale}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}

      {isPrescriptionOpen && (
        <PrescriptionModal
          controlledItemsNames={controlledNames}
          initialData={prescriptionData}
          onSave={data => {
            setPrescriptionData(data);
            setIsPrescriptionOpen(false);
          }}
          onClose={() => setIsPrescriptionOpen(false)}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal
          products={products}
          onDetected={handleBarcodeScanned}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          settings={settings}
          onClose={() => setLastCompletedSale(null)}
        />
      )}

    </div>
  );
};
