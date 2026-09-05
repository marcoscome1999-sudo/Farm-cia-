import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Percent,
  Receipt,
  User,
  ShieldAlert,
} from 'lucide-react';
import { PaymentMethod, MedicalPrescription, User as AppUser, PharmacySettings } from '../types.ts';

interface PaymentModalProps {
  subtotal: number;
  currency: string;
  currentUser: AppUser | null;
  settings: PharmacySettings | null;
  hasControlledItems: boolean;
  prescription: MedicalPrescription | null;
  onOpenPrescription: () => void;
  onCompleteSale: (paymentData: {
    forma_pagamento: PaymentMethod;
    valor_pago: number;
    troco: number;
    referencia_pagamento?: string;
    desconto_valor: number;
    desconto_percentual: number;
    imposto_iva: number;
    total_liquido: number;
    cliente_nome: string;
    cliente_contacto?: string;
    cliente_nuit?: string;
  }) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  subtotal,
  currency,
  currentUser,
  settings,
  hasControlledItems,
  prescription,
  onOpenPrescription,
  onCompleteSale,
  onClose,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('DINHEIRO');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState('');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNuit, setCustomerNuit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Desconto calculado
  const discountAmount =
    discountType === 'percent'
      ? (subtotal * Math.min(100, Math.max(0, discountValue))) / 100
      : Math.min(subtotal, Math.max(0, discountValue));

  const totalToPay = Math.max(0, subtotal - discountAmount);

  // Troco para dinheiro
  const numericCashGiven = parseFloat(cashGiven) || (method === 'DINHEIRO' ? 0 : totalToPay);
  const change = Math.max(0, numericCashGiven - totalToPay);

  // Validação de permissão de desconto
  const canGiveLargeDiscount =
    currentUser?.nivel_acesso === 'ADMINISTRADOR' || currentUser?.nivel_acesso === 'FARMACEUTICO';
  const discountPercentCalculated = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
  const isDiscountUnauthorized = !canGiveLargeDiscount && discountPercentCalculated > 5;

  const handleQuickCash = (amount: number) => {
    setCashGiven(String(amount));
  };

  const handleExactCash = () => {
    setCashGiven(String(totalToPay));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasControlledItems && !prescription) {
      alert('Atenção: A venda contém medicamento controlado! É obrigatório registar a receita médica antes de finalizar.');
      onOpenPrescription();
      return;
    }

    if (method === 'DINHEIRO' && numericCashGiven < totalToPay) {
      alert(`Valor entregue (${numericCashGiven.toFixed(2)} ${currency}) é inferior ao total (${totalToPay.toFixed(2)} ${currency}).`);
      return;
    }

    if (isDiscountUnauthorized) {
      alert('Operadores com nível "CAIXA" têm desconto limitado a 5%. Solicite autorização de Farmacêutico ou Administrador.');
      return;
    }

    setSubmitting(true);
    onCompleteSale({
      forma_pagamento: method,
      valor_pago: method === 'DINHEIRO' ? numericCashGiven : totalToPay,
      troco: method === 'DINHEIRO' ? change : 0,
      referencia_pagamento: referenceCode.trim() || undefined,
      desconto_valor: discountAmount,
      desconto_percentual: Math.round(discountPercentCalculated * 10) / 10,
      imposto_iva: 0,
      total_liquido: totalToPay,
      cliente_nome: customerName.trim() || 'Consumidor Final',
      cliente_contacto: customerPhone.trim() || undefined,
      cliente_nuit: customerNuit.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Finalizar Pagamento</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Alerta de Medicamento Controlado */}
          {hasControlledItems && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              prescription ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 text-xs">
                <ShieldAlert className={`w-4 h-4 ${prescription ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <span className="font-bold">Controlo de Psicotrópicos:</span>
                  <p className="text-[11px]">
                    {prescription
                      ? `Receita nº ${prescription.numero_receita} (Dr. ${prescription.nome_medico}) anexada.`
                      : 'Receita médica OBRIGATÓRIA ainda não registada.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenPrescription}
                className={`text-xs px-3 py-1 font-semibold rounded-lg border transition-colors ${
                  prescription
                    ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600'
                }`}
              >
                {prescription ? 'Ver / Editar Receita' : 'Preencher Receita'}
              </button>
            </div>
          )}

          {/* Métodos de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Forma de Pagamento</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
                { id: 'M_PESA', label: 'M-Pesa', icon: Smartphone },
                { id: 'E_MOLA', label: 'e-Mola', icon: Smartphone },
                { id: 'CARTAO', label: 'Cartão POS', icon: CreditCard },
                { id: 'TRANSFERENCIA', label: 'Transf.', icon: Receipt },
              ].map(m => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m.id as PaymentMethod);
                      if (m.id !== 'DINHEIRO') setCashGiven('');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desconto & Permissão */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-500" />
                Desconto Comercial
              </span>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    discountType === 'fixed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Valor ({currency})
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    discountType === 'percent' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  % Percentual
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder={discountType === 'percent' ? 'Ex: 5%' : 'Ex: 20 MT'}
                value={discountValue || ''}
                onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-500">
                {discountAmount > 0 && `(Desconto de -${discountAmount.toFixed(2)} ${currency})`}
              </span>
            </div>

            {isDiscountUnauthorized && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Descontos acima de 5% requerem cargo de Farmacêutico ou Administrador.</span>
              </div>
            )}
          </div>

          {/* Detalhes específicos de Dinheiro ou Carteiras Móveis */}
          {method === 'DINHEIRO' ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Valor Entregue pelo Cliente ({currency})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  className="flex-1 px-3 py-2 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleExactCash}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
                >
                  Valor Exato
                </button>
              </div>

              {/* Notas Rápidas */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100, 200, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    className="px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors"
                  >
                    +{val} {currency}
                  </button>
                ))}
              </div>

              {/* Troco */}
              <div className="mt-2 p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Troco a Devolver:</span>
                <span className={`text-base font-bold font-mono ${change > 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {change.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Referência da Transação / Telefone ({method === 'M_PESA' ? 'M-Pesa' : method === 'E_MOLA' ? 'e-Mola' : 'Comprovativo'})
              </label>
              <input
                type="text"
                placeholder={method === 'M_PESA' ? 'Ex: 841234567 / ID MP-10293' : 'Ex: Nº do comprovativo de pagamento'}
                value={referenceCode}
                onChange={e => setReferenceCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Dados do Cliente (Opcional) */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Identificação do Cliente no Recibo (Opcional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nome do cliente"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="Contacto / Celular"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="NUIT / NIF do cliente"
                value={customerNuit}
                onChange={e => setCustomerNuit(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Sumário de Fecho */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Líquido da Fatura</span>
              <div className="text-2xl font-black font-mono tracking-tight">
                {totalToPay.toFixed(2)} <span className="text-sm font-semibold">{currency}</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Subtotal: {subtotal.toFixed(2)} {currency}</div>
              {discountAmount > 0 && <div className="text-rose-400">Desconto: -{discountAmount.toFixed(2)} {currency}</div>}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || isDiscountUnauthorized}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar e Emitir Recibo (F4)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
