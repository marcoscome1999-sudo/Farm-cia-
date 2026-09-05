import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Sale, PharmacySettings } from '../types.ts';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: PharmacySettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.moeda_simbolo || 'MT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-8">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">Recibo / Talão de Venda</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 bg-slate-100 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            className="w-full max-w-[340px] bg-white p-5 shadow-xs border border-slate-200 text-slate-900 font-mono text-xs leading-relaxed"
          >
            {/* Header da Farmácia */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h4 className="font-bold text-sm uppercase tracking-wide">
                {settings?.nome_farmacia || 'FARMÁCIA SAÚDE & VIDA'}
              </h4>
              <p className="text-[11px] text-slate-600">{settings?.endereco}</p>
              <p className="text-[11px] text-slate-600">NUIT: {settings?.nuit || '400192837'}</p>
              {settings?.alvara_sanitario && (
                <p className="text-[10px] text-slate-500">Alvará Sanitário: {settings.alvara_sanitario}</p>
              )}
              <p className="text-[11px] text-slate-600">Tel: {settings?.contacto}</p>
            </div>

            {/* Dados do Documento */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>TALÃO DE VENDA:</span>
                <span className="font-bold">{sale.numero_fatura}</span>
              </div>
              <div className="flex justify-between">
                <span>DATA/HORA:</span>
                <span>{new Date(sale.data_venda).toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex justify-between">
                <span>OPERADOR:</span>
                <span>{sale.caixa_nome}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span>{sale.cliente_nome}</span>
              </div>
              {sale.cliente_nuit && (
                <div className="flex justify-between">
                  <span>NUIT CLIENTE:</span>
                  <span>{sale.cliente_nuit}</span>
                </div>
              )}
            </div>

            {/* Tabela de Itens */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200">
                <span>DESCRIÇÃO</span>
                <span>TOTAL ({currency})</span>
              </div>
              <div className="divide-y divide-slate-100 py-1 space-y-1.5">
                {sale.itens.map((item, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="font-medium text-[11px]">{item.produto_nome}</div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.quantidade}x @ {item.preco_unitario.toFixed(2)} [Lote: {item.numero_lote}]
                      </span>
                      <span className="font-semibold text-slate-900">{item.subtotal_item.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totais */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{sale.subtotal.toFixed(2)} {currency}</span>
              </div>
              {sale.desconto_valor > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>DESCONTO:</span>
                  <span>-{sale.desconto_valor.toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL A PAGAR:</span>
                <span>{sale.total_liquido.toFixed(2)} {currency}</span>
              </div>
            </div>

            {/* Pagamento */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>MÉTODO:</span>
                <span className="font-bold">{sale.forma_pagamento}</span>
              </div>
              <div className="flex justify-between">
                <span>VALOR ENTREGUE:</span>
                <span>{sale.valor_pago.toFixed(2)} {currency}</span>
              </div>
              {sale.troco > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>TROCO:</span>
                  <span>{sale.troco.toFixed(2)} {currency}</span>
                </div>
              )}
              {sale.referencia_pagamento && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>REF. TRANSAÇÃO:</span>
                  <span>{sale.referencia_pagamento}</span>
                </div>
              )}
            </div>

            {/* Se houver medicamento controlado com receita */}
            {sale.receita && (
              <div className="my-2 p-2 bg-amber-50 border border-amber-300 rounded text-[10px] space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-amber-900">
                  <ShieldAlert className="w-3 h-3" />
                  <span>DISPENSAÇÃO SOB RECEITA RETIDA</span>
                </div>
                <div>Nº Receita: {sale.receita.numero_receita}</div>
                <div>Médico: {sale.receita.nome_medico} {sale.receita.numero_ordem_medico ? `(${sale.receita.numero_ordem_medico})` : ''}</div>
                <div>Paciente: {sale.receita.nome_paciente}</div>
              </div>
            )}

            {/* Rodapé Fiscal */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
              <p>{settings?.mensagem_rodape_recibo || 'Obrigado pela preferência! Medicamentos não sujeitos a troca.'}</p>
              <p className="font-semibold text-[9px]">DOCUMENTO NÃO VÁLIDO COMO FATURA FISCAL SE NÃO CERTIFICADO</p>
              <p className="text-[9px]">FarmaSys POS - v2.5.0</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Fechar
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo</span>
          </button>
        </div>

      </div>
    </div>
  );
};
