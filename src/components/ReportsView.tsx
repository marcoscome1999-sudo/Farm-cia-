import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart as PieChartIcon,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { DashboardSummary, PharmacySettings } from '../types.ts';

interface ReportsViewProps {
  summary: DashboardSummary | null;
  settings: PharmacySettings | null;
}

const PAYMENT_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export const ReportsView: React.FC<ReportsViewProps> = ({ summary, settings }) => {
  const [reportTab, setReportTab] = useState<'geral' | 'top_produtos' | 'estagnados' | 'validade'>('geral');
  const currency = settings?.moeda_simbolo || 'MT';

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-500">
        Carregando dados dos relatórios de farmácia...
      </div>
    );
  }

  // Prepara dados de formas de pagamento para o gráfico Donut
  const paymentMethodsData = Object.entries(summary.vendas_por_forma_pagamento || {}).map(([key, val]) => {
    const payment = val as { total: number; quantidade: number };
    return {
      name: key.replace('_', '-'),
      total: payment.total || 0,
      quantidade: payment.quantidade || 0,
    };
  });

  // Exportar relatório em CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Item,Valor\r\n';
    csvContent += `Total Vendas (Valor),${(summary.total_vendas_valor || 0).toFixed(2)} ${currency}\r\n`;
    csvContent += `Lucro Bruto Estimado,${(summary.lucro_bruto_estimado || 0).toFixed(2)} ${currency}\r\n`;
    csvContent += `Margem de Lucro Bruto,${summary.margem_lucro_percentual || 0}%\r\n`;
    csvContent += `Valor do Stock a Preço de Custo,${(summary.valor_stock_custo || 0).toFixed(2)} ${currency}\r\n`;
    csvContent += `Valor do Stock a Preço de Venda,${(summary.valor_stock_venda || 0).toFixed(2)} ${currency}\r\n`;
    csvContent += `Total de Vendas Concluídas,${summary.total_vendas_quantidade || 0}\r\n`;
    csvContent += `Produtos com Stock Baixo,${summary.produtos_baixo_stock || 0}\r\n`;
    csvContent += `Lotes Vencidos,${summary.lotes_vencidos ?? summary.produtos_vencidos ?? 0}\r\n\r\n`;

    csvContent += 'Top Medicamentos Mais Vendidos\r\n';
    csvContent += 'Medicamento,Quantidade Vendida,Receita Total\r\n';
    (summary.produtos_mais_vendidos || []).forEach(p => {
      csvContent += `"${p.produto_nome}",${p.quantidade_vendida || 0},${(p.receita_total || 0).toFixed(2)}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmasys_relatorio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lotesVencidosCount = summary.lotes_vencidos ?? summary.produtos_vencidos ?? 0;
  const baixoStockCount = summary.produtos_baixo_stock || 0;
  const totalAlertasCriticos = baixoStockCount + lotesVencidosCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Relatórios e Métricas de Gestão
          </h2>
          <p className="text-xs text-slate-500">
            Análise de vendas, rentabilidade comercial, avaliação patrimonial de stock e produtos parados.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório (CSV / Excel)</span>
        </button>
      </div>

      {/* KPI Cards: Sales, Profit, Margin, Stock Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Faturação Total</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {(summary.total_vendas_valor || 0).toFixed(2)} <span className="text-xs font-normal">{currency}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {summary.total_vendas_quantidade || 0} vendas registadas
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Lucro Bruto Estimado</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black font-mono text-teal-700">
            {(summary.lucro_bruto_estimado || 0).toFixed(2)} <span className="text-xs font-normal">{currency}</span>
          </div>
          <div className="text-[11px] text-teal-600 font-semibold">
            Margem comercial média: {summary.margem_lucro_percentual || 0}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Valor Stock (Preço Custo)</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {(summary.valor_stock_custo || 0).toFixed(2)} <span className="text-xs font-normal">{currency}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Preço de venda: {(summary.valor_stock_venda || 0).toFixed(2)} {currency}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Alertas Críticos</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">
            {totalAlertasCriticos}
          </div>
          <div className="text-[11px] text-slate-500">
            {baixoStockCount} stock baixo • {lotesVencidosCount} vencidos
          </div>
        </div>

      </div>

      {/* Visual Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products Bar Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Medicamentos Mais Vendidos (Quantidade)
            </h3>
            <span className="text-xs text-slate-400">Top performance</span>
          </div>

          <div className="h-64 w-full">
            {summary.produtos_mais_vendidos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Ainda não há vendas suficientes para gerar o gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.produtos_mais_vendidos}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="produto_nome"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(val: any, name: any) => [`${val} unidades`, 'Qtd Vendida']}
                  />
                  <Bar dataKey="quantidade_vendida" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              Vendas por Pagamento
            </h3>
            <span className="text-xs text-slate-400">Distribuição</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {paymentMethodsData.length === 0 ? (
              <div className="text-xs text-slate-400">Sem dados de pagamento.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {paymentMethodsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${parseFloat(val).toFixed(2)} ${currency}`, 'Valor Total']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {paymentMethodsData.map((p, idx) => (
              <div key={`payment-method-${p.name}-${idx}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium">{p.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {(p.total || 0).toFixed(2)} {currency} ({p.quantidade || 0}x)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detailed Tables: Top Sellers, Stagnant, Critical Expiry */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setReportTab('geral')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              reportTab === 'geral' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mais Vendidos
          </button>
          <button
            onClick={() => setReportTab('estagnados')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              reportTab === 'estagnados' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Produtos Parados / Sem Venda ({(summary.produtos_estagnados || []).length})
          </button>
          <button
            onClick={() => setReportTab('validade')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              reportTab === 'validade' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lotes em Risco de Validade ({(summary.lotes_validade_critica || []).length})
          </button>
        </div>

        {/* 1. TOP SELLERS */}
        {reportTab === 'geral' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Medicamento</th>
                  <th className="py-2.5 px-3 text-center">Quantidade Vendida</th>
                  <th className="py-2.5 px-3 text-right">Faturação Total</th>
                  <th className="py-2.5 px-3 text-right">Lucro Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(summary.produtos_mais_vendidos || []).map((p, idx) => (
                  <tr key={p.produto_id ? `top-${p.produto_id}` : `top-idx-${idx}-${p.produto_nome}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{p.produto_nome}</td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-700">
                      {p.quantidade_vendida || 0} un
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {(p.receita_total || 0).toFixed(2)} {currency}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-teal-700 font-bold">
                      {(p.lucro_estimado || 0).toFixed(2)} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. ESTAGNOS */}
        {reportTab === 'estagnados' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Medicamento / Princípio Ativo</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Stock Parado</th>
                  <th className="py-2.5 px-3 text-right">Capital Imobilizado</th>
                  <th className="py-2.5 px-3">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!summary.produtos_estagnados || summary.produtos_estagnados.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Excelente! Não há medicamentos parados ou com stock estagnado no momento.
                    </td>
                  </tr>
                ) : (
                  summary.produtos_estagnados.map((prod, idx) => (
                    <tr key={prod.id ? `estagnado-${prod.id}` : `estagnado-idx-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">{prod.codigo_interno}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{prod.nome}</div>
                        <div className="text-[11px] text-slate-500">{prod.principio_ativo}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{prod.categoria}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                        {prod.stock_total || 0} un
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {(((prod.stock_total || 0) * (prod.preco_custo || 0)) || 0).toFixed(2)} {currency}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Sem saídas recentes
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. LOTES EM RISCO DE VALIDADE */}
        {reportTab === 'validade' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nº Lote</th>
                  <th className="py-2.5 px-3">Medicamento</th>
                  <th className="py-2.5 px-3">Data de Validade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Qtd em Risco</th>
                  <th className="py-2.5 px-3 text-right">Custo do Lote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!summary.lotes_validade_critica || summary.lotes_validade_critica.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Nenhum lote com validade próxima ou expirada.
                    </td>
                  </tr>
                ) : (
                  summary.lotes_validade_critica.map((batch, idx) => (
                    <tr key={batch.id ? `critico-${batch.id}` : `critico-idx-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{batch.numero_lote}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{batch.produto_nome}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{batch.data_validade}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          batch.status_validade === 'VENCIDO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {batch.status_validade === 'VENCIDO' ? 'Vencido' : `Vence em ${batch.dias_para_vencer} dias`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {batch.quantidade_atual || 0} un
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {(batch.preco_custo_lote || 0).toFixed(2)} {currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
