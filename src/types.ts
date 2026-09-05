// Tipos do Sistema FarmaSys - Gestão Farmacêutica e Controlo de Stock

export type UserRole = 'ADMINISTRADOR' | 'FARMACEUTICO' | 'CAIXA';

export interface User {
  id: string;
  nome: string;
  username?: string;
  email: string;
  pin_acesso?: string;
  senha?: string;
  nivel_acesso: UserRole;
  contacto?: string;
  ativo: boolean;
  criado_em?: string;
}

export interface Product {
  id: string;
  codigo_barras: string;
  codigo_interno: string;
  nome: string;
  principio_ativo: string;
  categoria: string;
  laboratorio: string;
  forma_farmaceutica: string;
  dosagem: string;
  requer_receita: boolean;
  eh_controlado: boolean;
  preco_custo: number;
  preco_venda: number;
  stock_minimo: number;
  localizacao_prateleira?: string;
  ativo: boolean;
  stock_total?: number;
  lotes_disponiveis?: Batch[];
  criado_em?: string;
}

export type BatchStatus = 'VALIDO' | 'PROXIMO_30' | 'PROXIMO_60' | 'PROXIMO_90' | 'VENCIDO';

export interface Batch {
  id: string;
  produto_id: string;
  produto_nome?: string;
  numero_lote: string;
  data_fabricacao?: string;
  data_validade: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  preco_custo_lote: number;
  fornecedor_id?: string;
  dias_para_vencer?: number;
  status_validade?: BatchStatus;
  criado_em?: string;
}

export type PaymentMethod = 'DINHEIRO' | 'M_PESA' | 'E_MOLA' | 'CARTAO' | 'TRANSFERENCIA' | 'MISTO';

export interface MedicalPrescription {
  id?: string;
  venda_id?: string;
  numero_receita: string;
  nome_medico: string;
  numero_ordem_medico?: string;
  hospital_clinica?: string;
  nome_paciente: string;
  documento_paciente?: string;
  data_prescricao: string;
  medicamentos_retidos?: string;
  observacoes?: string;
  criado_em?: string;
}

export interface SaleItem {
  id?: string;
  produto_id: string;
  produto_nome: string;
  principio_ativo?: string;
  lote_id: string;
  numero_lote: string;
  data_validade?: string;
  quantidade: number;
  preco_unitario: number;
  preco_custo_unitario: number;
  desconto_item: number;
  subtotal_item: number;
}

export interface Sale {
  id: string;
  numero_fatura: string;
  caixa_utilizador_id: string;
  caixa_nome: string;
  cliente_nome: string;
  cliente_contacto?: string;
  cliente_nuit?: string;
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  imposto_iva: number;
  total_liquido: number;
  forma_pagamento: PaymentMethod;
  valor_pago: number;
  troco: number;
  referencia_pagamento?: string;
  estado: 'CONCLUIDA' | 'ANULADA' | 'DEVOLVIDA';
  data_venda: string;
  itens: SaleItem[];
  receita?: MedicalPrescription;
  offline_synced?: boolean;
}

export interface Supplier {
  id: string;
  nome: string;
  nuit_nif?: string;
  contacto: string;
  email?: string;
  endereco?: string;
  prazo_pagamento_dias: number;
  ativo: boolean;
  criado_em?: string;
}

export interface PurchaseItem {
  id?: string;
  compra_id?: string;
  produto_id: string;
  produto_nome: string;
  quantidade_pedida: number;
  quantidade_recebida?: number;
  preco_custo_unitario: number;
  numero_lote?: string;
  data_validade?: string;
}

export interface Purchase {
  id: string;
  numero_encomenda: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  utilizador_id: string;
  utilizador_nome?: string;
  total_compra: number;
  estado: 'PENDENTE' | 'RECEBIDO' | 'CANCELADO';
  data_encomenda: string;
  data_rececao?: string;
  observacoes?: string;
  itens: PurchaseItem[];
}

export type MovementType =
  | 'ENTRADA_COMPRA'
  | 'SAIDA_VENDA'
  | 'AJUSTE_POSITIVO'
  | 'PERDA_AVARIA'
  | 'PRODUTO_VENCIDO'
  | 'DEVOLUCAO';

export interface StockMovement {
  id: string;
  produto_id: string;
  produto_nome: string;
  lote_id?: string;
  numero_lote?: string;
  utilizador_id: string;
  utilizador_nome: string;
  tipo_movimento: MovementType;
  quantidade: number;
  stock_anterior: number;
  stock_resultante: number;
  referencia_documento?: string;
  motivo?: string;
  data_movimento: string;
}

export interface AuditLog {
  id: string;
  utilizador_id: string;
  utilizador_nome: string;
  acao: string;
  modulo?: string;
  tabela_afetada?: string;
  detalhes: string;
  data?: string;
  data_hora?: string;
}

export interface PharmacySettings {
  id?: string;
  nome_farmacia: string;
  nuit?: string;
  nuit_nif?: string;
  alvara_sanitario?: string;
  responsavel_tecnico?: string;
  endereco: string;
  contacto: string;
  email: string;
  moeda_simbolo: string;
  moeda_nome?: string;
  moeda_codigo?: string;
  taxa_iva?: number;
  taxa_iva_padrao?: number;
  dias_alerta_vencimento_1?: number;
  dias_alerta_vencimento_2?: number;
  dias_alerta_vencimento_3?: number;
  mensagem_recibo_rodape?: string;
  mensagem_rodape_recibo?: string;
  exigir_receita_psicotropicos?: boolean;
}

export interface TopProductMetric {
  produto_id?: string;
  produto_nome: string;
  quantidade_vendida: number;
  receita_total: number;
  lucro_estimado: number;
}

export interface DashboardSummary {
  vendas_hoje_total: number;
  vendas_hoje_contagem: number;
  vendas_mes_total: number;
  lucro_mes_estimado: number;
  margem_lucro_media: number;
  total_produtos: number;
  produtos_baixo_stock: number;
  produtos_vencidos: number;
  lotes_vencidos?: number;
  produtos_prestes_vencer: number;
  valor_stock_custo: number;
  valor_stock_venda: number;
  vendas_por_pagamento: { metodo: PaymentMethod; total: number; contagem: number }[];
  vendas_ultimos_dias: { data: string; total: number; lucro: number }[];
  // Campos adicionais de apoio
  produtos_mais_vendidos: TopProductMetric[];
  produtos_estagnados: Product[];
  lotes_validade_critica: Batch[];
  total_vendas_valor: number;
  total_vendas_quantidade: number;
  lucro_bruto_estimado: number;
  margem_lucro_percentual: number;
  vendas_por_forma_pagamento: Record<string, { total: number; quantidade: number }>;
}

export type ReportSummary = DashboardSummary;

export interface CartItem {
  produto: Product;
  loteSelecionado: Batch;
  quantidade: number;
  desconto_unitario: number;
  subtotal: number;
}
