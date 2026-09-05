import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Product,
  Batch,
  Sale,
  Supplier,
  Purchase,
  StockMovement,
  AuditLog,
  PharmacySettings,
  MedicalPrescription,
  PaymentMethod,
} from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pharmacy_db.json');

export interface DatabaseData {
  configuracoes: PharmacySettings;
  utilizadores: User[];
  fornecedores: Supplier[];
  produtos: Product[];
  lotes: Batch[];
  vendas: Sale[];
  receitas: MedicalPrescription[];
  compras: Purchase[];
  movimentos_stock: StockMovement[];
  auditoria_logs: AuditLog[];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'farmasys_salt_2026').digest('hex');
}

function getInitialData(): DatabaseData {
  const adminId = 'usr_admin_01';
  const farmaceuticoId = 'usr_farma_01';
  const caixaId = 'usr_caixa_01';

  const defaultUsers: User[] = [
    {
      id: adminId,
      nome: 'Dr. Afonso Muchanga',
      email: 'admin@farmasys.com',
      pin_acesso: '1234',
      nivel_acesso: 'ADMINISTRADOR',
      contacto: '+258 84 100 2000',
      ativo: true,
      criado_em: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: farmaceuticoId,
      nome: 'Dra. Carla Mabunda',
      email: 'carla@farmasys.com',
      pin_acesso: '2222',
      nivel_acesso: 'FARMACEUTICO',
      contacto: '+258 82 300 4000',
      ativo: true,
      criado_em: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: caixaId,
      nome: 'João Sitoe',
      email: 'joao@farmasys.com',
      pin_acesso: '3333',
      nivel_acesso: 'CAIXA',
      contacto: '+258 87 500 6000',
      ativo: true,
      criado_em: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  const defaultSuppliers: Supplier[] = [
    {
      id: 'sup_01',
      nome: 'Medis Farmacêutica Moçambique',
      nuit_nif: '400192831',
      contacto: '+258 21 490 120',
      email: 'encomendas@medis.co.mz',
      endereco: 'Av. das FPLM, nº 1420, Maputo',
      prazo_pagamento_dias: 30,
      ativo: true,
      criado_em: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'sup_02',
      nome: 'Distribuidora Farmacêutica Nacional (DFN)',
      nuit_nif: '400891023',
      contacto: '+258 21 312 800',
      email: 'vendas@dfn.co.mz',
      endereco: 'Rua do Trabalho, Armazém 4, Matola',
      prazo_pagamento_dias: 45,
      ativo: true,
      criado_em: new Date(Date.now() - 50 * 86400000).toISOString(),
    },
    {
      id: 'sup_03',
      nome: 'Basi Farma Internacional',
      nuit_nif: '400345678',
      contacto: '+258 84 555 9900',
      email: 'contacto@basi.pt',
      endereco: 'Parque Industrial de Beluluane',
      prazo_pagamento_dias: 15,
      ativo: true,
      criado_em: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
  ];

  const now = new Date();
  const addDays = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };

  const defaultProducts: Product[] = [
    {
      id: 'prod_01',
      codigo_barras: '5601234567890',
      codigo_interno: 'MED-001',
      nome: 'Paracetamol 500mg',
      principio_ativo: 'Paracetamol',
      categoria: 'Analgésico e Antipirético',
      laboratorio: 'Basi',
      forma_farmaceutica: 'Comprimido',
      dosagem: '500mg',
      requer_receita: false,
      eh_controlado: false,
      preco_custo: 45.0,
      preco_venda: 95.0,
      stock_minimo: 25,
      localizacao_prateleira: 'A1-P2',
      ativo: true,
    },
    {
      id: 'prod_02',
      codigo_barras: '5601234567891',
      codigo_interno: 'MED-002',
      nome: 'Amoxicilina + Ác. Clavulânico 625mg',
      principio_ativo: 'Amoxicilina / Ácido Clavulânico',
      categoria: 'Antibiótico',
      laboratorio: 'GSK',
      forma_farmaceutica: 'Comprimido Revestido',
      dosagem: '500mg + 125mg',
      requer_receita: true,
      eh_controlado: false,
      preco_custo: 280.0,
      preco_venda: 450.0,
      stock_minimo: 15,
      localizacao_prateleira: 'B2-P1',
      ativo: true,
    },
    {
      id: 'prod_03',
      codigo_barras: '5601234567892',
      codigo_interno: 'MED-003',
      nome: 'Ibuprofeno 400mg',
      principio_ativo: 'Ibuprofeno',
      categoria: 'Anti-inflamatório',
      laboratorio: 'Cinfa',
      forma_farmaceutica: 'Comprimido',
      dosagem: '400mg',
      requer_receita: false,
      eh_controlado: false,
      preco_custo: 75.0,
      preco_venda: 140.0,
      stock_minimo: 30,
      localizacao_prateleira: 'A1-P4',
      ativo: true,
    },
    {
      id: 'prod_04',
      codigo_barras: '5601234567893',
      codigo_interno: 'MED-004',
      nome: 'Omeprazol 20mg',
      principio_ativo: 'Omeprazol',
      categoria: 'Gastroprotetor',
      laboratorio: 'Sandoz',
      forma_farmaceutica: 'Cápsula',
      dosagem: '20mg',
      requer_receita: false,
      eh_controlado: false,
      preco_custo: 110.0,
      preco_venda: 220.0,
      stock_minimo: 20,
      localizacao_prateleira: 'C1-P3',
      ativo: true,
    },
    {
      id: 'prod_05',
      codigo_barras: '5601234567894',
      codigo_interno: 'MED-005',
      nome: 'Diazepam 10mg (Controlado)',
      principio_ativo: 'Diazepam',
      categoria: 'Ansiolítico / Sedativo',
      laboratorio: 'Roche',
      forma_farmaceutica: 'Comprimido',
      dosagem: '10mg',
      requer_receita: true,
      eh_controlado: true, // Medicamento controlado com retenção de receita médica!
      preco_custo: 150.0,
      preco_venda: 320.0,
      stock_minimo: 10,
      localizacao_prateleira: 'Cofre-01',
      ativo: true,
    },
    {
      id: 'prod_06',
      codigo_barras: '5601234567895',
      codigo_interno: 'MED-006',
      nome: 'Ciprofloxacina 500mg',
      principio_ativo: 'Cloridrato de Ciprofloxacina',
      categoria: 'Antibiótico',
      laboratorio: 'Bayer',
      forma_farmaceutica: 'Comprimido',
      dosagem: '500mg',
      requer_receita: true,
      eh_controlado: false,
      preco_custo: 190.0,
      preco_venda: 360.0,
      stock_minimo: 12,
      localizacao_prateleira: 'B2-P3',
      ativo: true,
    },
    {
      id: 'prod_07',
      codigo_barras: '5601234567896',
      codigo_interno: 'MED-007',
      nome: 'Cetirizina 10mg',
      principio_ativo: 'Dicloridrato de Cetirizina',
      categoria: 'Anti-histamínico',
      laboratorio: 'Mepha',
      forma_farmaceutica: 'Comprimido',
      dosagem: '10mg',
      requer_receita: false,
      eh_controlado: false,
      preco_custo: 60.0,
      preco_venda: 125.0,
      stock_minimo: 15,
      localizacao_prateleira: 'D1-P1',
      ativo: true,
    },
    {
      id: 'prod_08',
      codigo_barras: '5601234567897',
      codigo_interno: 'MED-008',
      nome: 'Metformina 850mg',
      principio_ativo: 'Cloridrato de Metformina',
      categoria: 'Antidiabético Oral',
      laboratorio: 'Merck',
      forma_farmaceutica: 'Comprimido',
      dosagem: '850mg',
      requer_receita: true,
      eh_controlado: false,
      preco_custo: 90.0,
      preco_venda: 180.0,
      stock_minimo: 25,
      localizacao_prateleira: 'E2-P2',
      ativo: true,
    },
    {
      id: 'prod_09',
      codigo_barras: '5601234567898',
      codigo_interno: 'MED-009',
      nome: 'Salbutamol Inalador 100mcg',
      principio_ativo: 'Sulfato de Salbutamol',
      categoria: 'Broncodilatador / Asma',
      laboratorio: 'GSK',
      forma_farmaceutica: 'Inalador / Spray',
      dosagem: '100mcg/dose',
      requer_receita: true,
      eh_controlado: false,
      preco_custo: 240.0,
      preco_venda: 420.0,
      stock_minimo: 10,
      localizacao_prateleira: 'F1-P1',
      ativo: true,
    },
    {
      id: 'prod_10',
      codigo_barras: '5601234567899',
      codigo_interno: 'MED-010',
      nome: 'Soro Fisiológico 0.9% 500ml',
      principio_ativo: 'Cloreto de Sódio',
      categoria: 'Soluções Perfusão',
      laboratorio: 'Fresenius Kabi',
      forma_farmaceutica: 'Frasco Perfusão',
      dosagem: '0.9% 500ml',
      requer_receita: false,
      eh_controlado: false,
      preco_custo: 50.0,
      preco_venda: 110.0,
      stock_minimo: 30,
      localizacao_prateleira: 'G1-Palete',
      ativo: true,
    },
    {
      id: 'prod_11',
      codigo_barras: '5601234567810',
      codigo_interno: 'MED-011',
      nome: 'Xarope Benylin 4 Flu 100ml',
      principio_ativo: 'Paracetamol + Dextrometorfano',
      categoria: 'Antigripal e Expetorante',
      laboratorio: 'Johnson & Johnson',
      forma_farmaceutica: 'Xarope',
      dosagem: '100ml',
      requer_receita: false,
      eh_controlado: false,
      preco_custo: 180.0,
      preco_venda: 310.0,
      stock_minimo: 15,
      localizacao_prateleira: 'A2-P1',
      ativo: true,
    },
    {
      id: 'prod_12',
      codigo_barras: '5601234567811',
      codigo_interno: 'MED-012',
      nome: 'Morfina 10mg/ml Ampola (Controlado)',
      principio_ativo: 'Cloridrato de Morfina',
      categoria: 'Analgésico Opióide Forte',
      laboratorio: 'B. Braun',
      forma_farmaceutica: 'Injetável',
      dosagem: '10mg/ml',
      requer_receita: true,
      eh_controlado: true,
      preco_custo: 350.0,
      preco_venda: 680.0,
      stock_minimo: 8,
      localizacao_prateleira: 'Cofre-02',
      ativo: true,
    },
  ];

  // Batches com lotes próximos de vencer e lotes saudáveis
  const defaultBatches: Batch[] = [
    // Paracetamol: Lote 1 (vence em 20 dias - alerta 30 dias!), Lote 2 (vence em 360 dias)
    {
      id: 'lot_01',
      produto_id: 'prod_01',
      numero_lote: 'L-PARA-2401',
      data_fabricacao: '2024-01-10',
      data_validade: addDays(22), // Alerta < 30 dias!
      quantidade_inicial: 100,
      quantidade_atual: 14,
      preco_custo_lote: 45.0,
      fornecedor_id: 'sup_01',
    },
    {
      id: 'lot_02',
      produto_id: 'prod_01',
      numero_lote: 'L-PARA-2509',
      data_fabricacao: '2025-05-12',
      data_validade: addDays(380),
      quantidade_inicial: 200,
      quantidade_atual: 180,
      preco_custo_lote: 45.0,
      fornecedor_id: 'sup_03',
    },
    // Amoxicilina: Lote vence em 50 dias (alerta 60 dias!)
    {
      id: 'lot_03',
      produto_id: 'prod_02',
      numero_lote: 'L-AMOX-2489',
      data_fabricacao: '2024-03-01',
      data_validade: addDays(52), // Alerta < 60 dias!
      quantidade_inicial: 60,
      quantidade_atual: 8, // Stock baixo!
      preco_custo_lote: 280.0,
      fornecedor_id: 'sup_01',
    },
    // Ibuprofeno: Lote saudável
    {
      id: 'lot_04',
      produto_id: 'prod_03',
      numero_lote: 'L-IBUP-2501',
      data_fabricacao: '2025-01-15',
      data_validade: addDays(400),
      quantidade_inicial: 150,
      quantidade_atual: 95,
      preco_custo_lote: 75.0,
      fornecedor_id: 'sup_02',
    },
    // Omeprazol: Lote vence em 85 dias (alerta 90 dias!)
    {
      id: 'lot_05',
      produto_id: 'prod_04',
      numero_lote: 'L-OMEP-2455',
      data_fabricacao: '2024-06-10',
      data_validade: addDays(82), // Alerta < 90 dias!
      quantidade_inicial: 80,
      quantidade_atual: 42,
      preco_custo_lote: 110.0,
      fornecedor_id: 'sup_02',
    },
    // Diazepam Controlado:
    {
      id: 'lot_06',
      produto_id: 'prod_05',
      numero_lote: 'L-DIAZ-CTRL-09',
      data_fabricacao: '2024-08-01',
      data_validade: addDays(290),
      quantidade_inicial: 50,
      quantidade_atual: 24,
      preco_custo_lote: 150.0,
      fornecedor_id: 'sup_01',
    },
    // Ciprofloxacina:
    {
      id: 'lot_07',
      produto_id: 'prod_06',
      numero_lote: 'L-CIPRO-2411',
      data_fabricacao: '2024-11-01',
      data_validade: addDays(310),
      quantidade_inicial: 40,
      quantidade_atual: 6, // Stock baixo (<12)
      preco_custo_lote: 190.0,
      fornecedor_id: 'sup_01',
    },
    // Cetirizina:
    {
      id: 'lot_08',
      produto_id: 'prod_07',
      numero_lote: 'L-CETI-2502',
      data_fabricacao: '2025-02-10',
      data_validade: addDays(450),
      quantidade_inicial: 80,
      quantidade_atual: 55,
      preco_custo_lote: 60.0,
      fornecedor_id: 'sup_03',
    },
    // Metformina:
    {
      id: 'lot_09',
      produto_id: 'prod_08',
      numero_lote: 'L-METF-2490',
      data_fabricacao: '2024-09-01',
      data_validade: addDays(240),
      quantidade_inicial: 100,
      quantidade_atual: 18, // Stock baixo (<25)
      preco_custo_lote: 90.0,
      fornecedor_id: 'sup_02',
    },
    // Salbutamol Inalador:
    {
      id: 'lot_10',
      produto_id: 'prod_09',
      numero_lote: 'L-SALB-2412',
      data_fabricacao: '2024-12-05',
      data_validade: addDays(320),
      quantidade_inicial: 30,
      quantidade_atual: 14,
      preco_custo_lote: 240.0,
      fornecedor_id: 'sup_01',
    },
    // Soro Fisiológico:
    {
      id: 'lot_11',
      produto_id: 'prod_10',
      numero_lote: 'L-SORO-2503',
      data_fabricacao: '2025-03-01',
      data_validade: addDays(600),
      quantidade_inicial: 120,
      quantidade_atual: 88,
      preco_custo_lote: 50.0,
      fornecedor_id: 'sup_02',
    },
    // Xarope Benylin:
    {
      id: 'lot_12',
      produto_id: 'prod_11',
      numero_lote: 'L-BENY-2408',
      data_fabricacao: '2024-08-15',
      data_validade: addDays(190),
      quantidade_inicial: 40,
      quantidade_atual: 22,
      preco_custo_lote: 180.0,
      fornecedor_id: 'sup_03',
    },
    // Morfina Controlada:
    {
      id: 'lot_13',
      produto_id: 'prod_12',
      numero_lote: 'L-MORF-CTRL-01',
      data_fabricacao: '2024-05-10',
      data_validade: addDays(180),
      quantidade_inicial: 20,
      quantidade_atual: 11,
      preco_custo_lote: 350.0,
      fornecedor_id: 'sup_01',
    },
    // Lote expirado de propósito para teste de alerta de produto vencido
    {
      id: 'lot_exp_01',
      produto_id: 'prod_03',
      numero_lote: 'L-IBUP-VENC-23',
      data_fabricacao: '2022-01-10',
      data_validade: addDays(-15), // Já expirado!
      quantidade_inicial: 50,
      quantidade_atual: 4,
      preco_custo_lote: 75.0,
      fornecedor_id: 'sup_02',
    },
  ];

  // Compras de exemplo
  const defaultPurchases: Purchase[] = [
    {
      id: 'pur_01',
      numero_encomenda: 'ENC-2026-001',
      fornecedor_id: 'sup_01',
      fornecedor_nome: 'Medis Farmacêutica Moçambique',
      utilizador_id: adminId,
      utilizador_nome: 'Dr. Afonso Muchanga',
      total_compra: 38500.0,
      estado: 'RECEBIDO',
      data_encomenda: new Date(Date.now() - 15 * 86400000).toISOString(),
      data_rececao: new Date(Date.now() - 12 * 86400000).toISOString(),
      observacoes: 'Recebido conforme com guias e certificados analíticos de lote.',
      itens: [
        {
          id: 'pitem_01',
          compra_id: 'pur_01',
          produto_id: 'prod_02',
          produto_nome: 'Amoxicilina + Ác. Clavulânico 625mg',
          quantidade_pedida: 60,
          quantidade_recebida: 60,
          preco_custo_unitario: 280.0,
          numero_lote: 'L-AMOX-2489',
          data_validade: addDays(52),
        },
        {
          id: 'pitem_02',
          compra_id: 'pur_01',
          produto_id: 'prod_05',
          produto_nome: 'Diazepam 10mg (Controlado)',
          quantidade_pedida: 50,
          quantidade_recebida: 50,
          preco_custo_unitario: 150.0,
          numero_lote: 'L-DIAZ-CTRL-09',
          data_validade: addDays(290),
        },
      ],
    },
    {
      id: 'pur_02',
      numero_encomenda: 'ENC-2026-002',
      fornecedor_id: 'sup_02',
      fornecedor_nome: 'Distribuidora Farmacêutica Nacional (DFN)',
      utilizador_id: farmaceuticoId,
      utilizador_nome: 'Dra. Carla Mabunda',
      total_compra: 14250.0,
      estado: 'PENDENTE',
      data_encomenda: new Date(Date.now() - 2 * 86400000).toISOString(),
      observacoes: 'Pedido de reposição urgente para antibióticos e gastroprotetores.',
      itens: [
        {
          id: 'pitem_03',
          compra_id: 'pur_02',
          produto_id: 'prod_06',
          produto_nome: 'Ciprofloxacina 500mg',
          quantidade_pedida: 40,
          preco_custo_unitario: 190.0,
        },
        {
          id: 'pitem_04',
          compra_id: 'pur_02',
          produto_id: 'prod_08',
          produto_nome: 'Metformina 850mg',
          quantidade_pedida: 50,
          preco_custo_unitario: 90.0,
        },
      ],
    },
  ];

  // Vendas de exemplo (com receitas para controlados)
  const defaultSales: Sale[] = [
    {
      id: 'sal_01',
      numero_fatura: 'FT-2026/001',
      caixa_utilizador_id: caixaId,
      caixa_nome: 'João Sitoe',
      cliente_nome: 'Helena Mondlane',
      cliente_contacto: '+258 84 999 1122',
      cliente_nuit: '109283746',
      subtotal: 330.0,
      desconto_valor: 0.0,
      desconto_percentual: 0.0,
      imposto_iva: 0.0,
      total_liquido: 330.0,
      forma_pagamento: 'M_PESA',
      valor_pago: 330.0,
      troco: 0.0,
      referencia_pagamento: 'MP-892182038',
      estado: 'CONCLUIDA',
      data_venda: new Date(Date.now() - 4 * 3600000).toISOString(),
      itens: [
        {
          id: 'sitem_01',
          produto_id: 'prod_01',
          produto_nome: 'Paracetamol 500mg',
          principio_ativo: 'Paracetamol',
          lote_id: 'lot_01',
          numero_lote: 'L-PARA-2401',
          quantidade: 2,
          preco_unitario: 95.0,
          preco_custo_unitario: 45.0,
          desconto_item: 0.0,
          subtotal_item: 190.0,
        },
        {
          id: 'sitem_02',
          produto_id: 'prod_03',
          produto_nome: 'Ibuprofeno 400mg',
          principio_ativo: 'Ibuprofeno',
          lote_id: 'lot_04',
          numero_lote: 'L-IBUP-2501',
          quantidade: 1,
          preco_unitario: 140.0,
          preco_custo_unitario: 75.0,
          desconto_item: 0.0,
          subtotal_item: 140.0,
        },
      ],
    },
    {
      id: 'sal_02',
      numero_fatura: 'FT-2026/002',
      caixa_utilizador_id: farmaceuticoId,
      caixa_nome: 'Dra. Carla Mabunda',
      cliente_nome: 'Carlos Tembe',
      cliente_contacto: '+258 82 444 8811',
      cliente_nuit: '',
      subtotal: 540.0,
      desconto_valor: 20.0,
      desconto_percentual: 3.7,
      imposto_iva: 0.0,
      total_liquido: 520.0,
      forma_pagamento: 'DINHEIRO',
      valor_pago: 600.0,
      troco: 80.0,
      estado: 'CONCLUIDA',
      data_venda: new Date(Date.now() - 2 * 3600000).toISOString(),
      itens: [
        {
          id: 'sitem_03',
          produto_id: 'prod_04',
          produto_nome: 'Omeprazol 20mg',
          principio_ativo: 'Omeprazol',
          lote_id: 'lot_05',
          numero_lote: 'L-OMEP-2455',
          quantidade: 1,
          preco_unitario: 220.0,
          preco_custo_unitario: 110.0,
          desconto_item: 0.0,
          subtotal_item: 220.0,
        },
        {
          id: 'sitem_04',
          produto_id: 'prod_05',
          produto_nome: 'Diazepam 10mg (Controlado)',
          principio_ativo: 'Diazepam',
          lote_id: 'lot_06',
          numero_lote: 'L-DIAZ-CTRL-09',
          quantidade: 1,
          preco_unitario: 320.0,
          preco_custo_unitario: 150.0,
          desconto_item: 0.0,
          subtotal_item: 320.0,
        },
      ],
      receita: {
        id: 'rec_01',
        venda_id: 'sal_02',
        numero_receita: 'REC-2026-9081',
        nome_medico: 'Dr. Salvador Cossa',
        numero_ordem_medico: 'OMM-1849',
        hospital_clinica: 'Hospital Central de Maputo',
        nome_paciente: 'Carlos Tembe',
        documento_paciente: 'BI 110293847291F',
        data_prescricao: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0],
        medicamentos_retidos: 'Diazepam 10mg - 1 Caixa (30 comp)',
        observacoes: 'Tomar 1 comp à noite. Tratamento por 30 dias.',
      },
    },
    {
      id: 'sal_03',
      numero_fatura: 'FT-2026/003',
      caixa_utilizador_id: caixaId,
      caixa_nome: 'João Sitoe',
      cliente_nome: 'Maria Langa',
      cliente_contacto: '+258 87 111 2233',
      subtotal: 450.0,
      desconto_valor: 0.0,
      desconto_percentual: 0.0,
      imposto_iva: 0.0,
      total_liquido: 450.0,
      forma_pagamento: 'E_MOLA',
      valor_pago: 450.0,
      troco: 0.0,
      referencia_pagamento: 'EML-77123984',
      estado: 'CONCLUIDA',
      data_venda: new Date(Date.now() - 1 * 3600000).toISOString(),
      itens: [
        {
          id: 'sitem_05',
          produto_id: 'prod_02',
          produto_nome: 'Amoxicilina + Ác. Clavulânico 625mg',
          principio_ativo: 'Amoxicilina / Ácido Clavulânico',
          lote_id: 'lot_03',
          numero_lote: 'L-AMOX-2489',
          quantidade: 1,
          preco_unitario: 450.0,
          preco_custo_unitario: 280.0,
          desconto_item: 0.0,
          subtotal_item: 450.0,
        },
      ],
    },
  ];

  const defaultMovements: StockMovement[] = [
    {
      id: 'mov_01',
      produto_id: 'prod_01',
      produto_nome: 'Paracetamol 500mg',
      lote_id: 'lot_01',
      numero_lote: 'L-PARA-2401',
      utilizador_id: caixaId,
      utilizador_nome: 'João Sitoe',
      tipo_movimento: 'SAIDA_VENDA',
      quantidade: 2,
      stock_anterior: 16,
      stock_resultante: 14,
      referencia_documento: 'FT-2026/001',
      motivo: 'Venda de balcão ao consumidor',
      data_movimento: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'mov_02',
      produto_id: 'prod_05',
      produto_nome: 'Diazepam 10mg (Controlado)',
      lote_id: 'lot_06',
      numero_lote: 'L-DIAZ-CTRL-09',
      utilizador_id: farmaceuticoId,
      utilizador_nome: 'Dra. Carla Mabunda',
      tipo_movimento: 'SAIDA_VENDA',
      quantidade: 1,
      stock_anterior: 25,
      stock_resultante: 24,
      referencia_documento: 'FT-2026/002',
      motivo: 'Venda sob receita médica retida (Dr. Salvador Cossa)',
      data_movimento: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'mov_03',
      produto_id: 'prod_03',
      produto_nome: 'Ibuprofeno 400mg',
      lote_id: 'lot_exp_01',
      numero_lote: 'L-IBUP-VENC-23',
      utilizador_id: farmaceuticoId,
      utilizador_nome: 'Dra. Carla Mabunda',
      tipo_movimento: 'PRODUTO_VENCIDO',
      quantidade: 4,
      stock_anterior: 8,
      stock_resultante: 4,
      referencia_documento: 'AUTO-ABATE-001',
      motivo: 'Produto vencido segregado para destruição sanitária',
      data_movimento: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];

  const defaultAudits: AuditLog[] = [
    {
      id: 'aud_01',
      utilizador_id: adminId,
      utilizador_nome: 'Dr. Afonso Muchanga',
      acao: 'INICIALIZACAO_SISTEMA',
      modulo: 'CONFIGURACOES',
      detalhes: 'Base de dados inicializada com catálogo de medicamentos e parâmetros de farmácia.',
      data: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'aud_02',
      utilizador_id: farmaceuticoId,
      utilizador_nome: 'Dra. Carla Mabunda',
      acao: 'RECECAO_MERCADORIA',
      modulo: 'COMPRAS',
      detalhes: 'Confirmação e entrada em stock da Encomenda ENC-2026-001 de Medis Farmacêutica.',
      data: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'aud_03',
      utilizador_id: farmaceuticoId,
      utilizador_nome: 'Dra. Carla Mabunda',
      acao: 'DISPENSACAO_CONTROLADO',
      modulo: 'PDV',
      detalhes: 'Venda de Diazepam 10mg com retenção de receita médica nº REC-2026-9081.',
      data: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
  ];

  const defaultSettings: PharmacySettings = {
    id: 'cfg_01',
    nome_farmacia: 'Farmácia Saúde & Vida',
    nuit: '400192837',
    alvara_sanitario: 'ALV-MS-2025/0948',
    responsavel_tecnico: 'Dra. Carla Mabunda (Farmacêutica Titular)',
    endereco: 'Avenida 24 de Julho, nº 1845, Bairro Central, Maputo',
    contacto: '+258 21 300 450 / +258 84 333 4444',
    email: 'contacto@farmaciasaudevida.co.mz',
    moeda_simbolo: 'MT',
    moeda_codigo: 'MZN',
    taxa_iva: 0.0, // Medicamentos são isentos de IVA por norma
    mensagem_rodape_recibo: 'Obrigado pela preferência! Guarde este recibo. Medicamentos não sujeitos a troca após saída da farmácia.',
  };

  return {
    configuracoes: defaultSettings,
    utilizadores: defaultUsers,
    fornecedores: defaultSuppliers,
    produtos: defaultProducts,
    lotes: defaultBatches,
    vendas: defaultSales,
    receitas: defaultSales.filter(s => s.receita).map(s => s.receita!),
    compras: defaultPurchases,
    movimentos_stock: defaultMovements,
    auditoria_logs: defaultAudits,
  };
}

class PharmacyDatabase {
  private data: DatabaseData;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Erro ao ler base de dados, reinicializando dados padrão:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  public saveData(customData?: DatabaseData) {
    try {
      this.ensureDirectory();
      const payload = customData || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Falha ao guardar dados da farmácia:', err);
    }
  }

  public getData(): DatabaseData {
    return this.data;
  }

  // AUDIT LOG
  public addAuditLog(userId: string, userName: string, acao: string, modulo: string, detalhes: string) {
    const log: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      utilizador_id: userId,
      utilizador_nome: userName,
      acao,
      modulo,
      detalhes,
      data: new Date().toISOString(),
    };
    this.data.auditoria_logs.unshift(log);
    if (this.data.auditoria_logs.length > 500) {
      this.data.auditoria_logs.pop();
    }
    this.saveData();
  }

  // PRODUTOS & LOTES COM ENRIQUECIMENTO
  public getProductsWithStock(): Product[] {
    const now = new Date();
    return this.data.produtos.map(p => {
      const productBatches = this.data.lotes.filter(l => l.produto_id === p.id && l.quantidade_atual > 0);
      
      const enrichedBatches = productBatches.map(b => {
        const expDate = new Date(b.data_validade);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        let status: Batch['status_validade'] = 'VALIDO';
        if (diffDays <= 0) {
          status = 'VENCIDO';
        } else if (diffDays <= 30) {
          status = 'PROXIMO_30';
        } else if (diffDays <= 60) {
          status = 'PROXIMO_60';
        } else if (diffDays <= 90) {
          status = 'PROXIMO_90';
        }

        return {
          ...b,
          dias_para_vencer: diffDays,
          status_validade: status,
        };
      }).sort((a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime());

      // FEFO: lotes ordenados por data de validade mais próxima
      const totalStock = enrichedBatches.reduce((acc, b) => acc + (b.status_validade !== 'VENCIDO' ? b.quantidade_atual : 0), 0);

      return {
        ...p,
        stock_total: totalStock,
        lotes_disponiveis: enrichedBatches,
      };
    });
  }

  // VENDA ATÔMICA (FEFO OU LOTE SELECIONADO)
  public createSale(saleData: Omit<Sale, 'id' | 'numero_fatura' | 'data_venda' | 'estado'>): Sale {
    const saleId = 'sal_' + Date.now();
    const count = this.data.vendas.length + 1;
    const invoiceNumber = `FT-${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;

    // Validar e deduzir stock por lote
    const itemsProcessed = saleData.itens.map(item => {
      const product = this.data.produtos.find(p => p.id === item.produto_id);
      if (!product) throw new Error(`Produto não encontrado: ${item.produto_nome}`);

      let batch = this.data.lotes.find(l => l.id === item.lote_id);
      if (!batch) {
        // Encontrar lote com FEFO se não especificado ou se especificado inválido
        const availableBatches = this.data.lotes
          .filter(l => l.produto_id === item.produto_id && l.quantidade_atual >= item.quantidade)
          .sort((a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime());
        if (availableBatches.length === 0) {
          throw new Error(`Stock insuficiente para ${product.nome}. Quantidade pedida: ${item.quantidade}`);
        }
        batch = availableBatches[0];
      }

      if (batch.quantidade_atual < item.quantidade) {
        throw new Error(`Stock insuficiente no lote ${batch.numero_lote} para ${product.nome}. Disponível: ${batch.quantidade_atual}`);
      }

      const stockAnterior = batch.quantidade_atual;
      batch.quantidade_atual -= item.quantidade;
      const stockResultante = batch.quantidade_atual;

      // Registar movimento de stock (Kardex)
      const movement: StockMovement = {
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        produto_id: product.id,
        produto_nome: product.nome,
        lote_id: batch.id,
        numero_lote: batch.numero_lote,
        utilizador_id: saleData.caixa_utilizador_id,
        utilizador_nome: saleData.caixa_nome,
        tipo_movimento: 'SAIDA_VENDA',
        quantidade: item.quantidade,
        stock_anterior: stockAnterior,
        stock_resultante: stockResultante,
        referencia_documento: invoiceNumber,
        motivo: `Venda ao balcão - Fatura ${invoiceNumber}`,
        data_movimento: new Date().toISOString(),
      };
      this.data.movimentos_stock.unshift(movement);

      return {
        ...item,
        id: 'sitem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        venda_id: saleId,
        lote_id: batch.id,
        numero_lote: batch.numero_lote,
        data_validade: batch.data_validade,
        preco_custo_unitario: batch.preco_custo_lote || product.preco_custo,
      };
    });

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      numero_fatura: invoiceNumber,
      itens: itemsProcessed,
      estado: 'CONCLUIDA',
      data_venda: new Date().toISOString(),
    };

    if (newSale.receita) {
      newSale.receita.id = 'rec_' + Date.now();
      newSale.receita.venda_id = saleId;
      this.data.receitas.unshift(newSale.receita);
    }

    this.data.vendas.unshift(newSale);
    this.addAuditLog(
      saleData.caixa_utilizador_id,
      saleData.caixa_nome,
      'VENDA_CONCLUIDA',
      'PDV',
      `Fatura ${invoiceNumber} no valor de ${newSale.total_liquido.toFixed(2)} ${this.data.configuracoes.moeda_simbolo} (${newSale.forma_pagamento}).`
    );

    this.saveData();
    return newSale;
  }

  // ENTRADA DE STOCK (COMPRA RECEBIDA)
  public receivePurchase(purchaseId: string, userId: string, userName: string, itemsReceived: { produto_id: string; quantidade: number; numero_lote: string; data_validade: string; preco_custo: number }[]): Purchase {
    const purchase = this.data.compras.find(c => c.id === purchaseId);
    if (!purchase) throw new Error('Encomenda não encontrada');
    if (purchase.estado === 'RECEBIDO') throw new Error('Esta encomenda já foi recebida anteriormente.');

    itemsReceived.forEach(item => {
      const product = this.data.produtos.find(p => p.id === item.produto_id);
      if (!product) return;

      // Criar novo lote ou somar em lote existente com mesma validade
      const existingBatch = this.data.lotes.find(l => l.produto_id === item.produto_id && l.numero_lote === item.numero_lote);
      let batchId = '';
      let stockAnterior = 0;
      let stockResultante = 0;

      if (existingBatch) {
        stockAnterior = existingBatch.quantidade_atual;
        existingBatch.quantidade_atual += item.quantidade;
        stockResultante = existingBatch.quantidade_atual;
        batchId = existingBatch.id;
      } else {
        batchId = 'lot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newBatch: Batch = {
          id: batchId,
          produto_id: item.produto_id,
          numero_lote: item.numero_lote,
          data_validade: item.data_validade,
          quantidade_inicial: item.quantidade,
          quantidade_atual: item.quantidade,
          preco_custo_lote: item.preco_custo,
          fornecedor_id: purchase.fornecedor_id,
          criado_em: new Date().toISOString(),
        };
        this.data.lotes.push(newBatch);
        stockAnterior = 0;
        stockResultante = item.quantidade;
      }

      // Atualizar preço de custo no produto se alterado
      if (item.preco_custo > 0 && item.preco_custo !== product.preco_custo) {
        product.preco_custo = item.preco_custo;
      }

      // Registar movimento Kardex
      this.data.movimentos_stock.unshift({
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        produto_id: product.id,
        produto_nome: product.nome,
        lote_id: batchId,
        numero_lote: item.numero_lote,
        utilizador_id: userId,
        utilizador_nome: userName,
        tipo_movimento: 'ENTRADA_COMPRA',
        quantidade: item.quantidade,
        stock_anterior: stockAnterior,
        stock_resultante: stockResultante,
        referencia_documento: purchase.numero_encomenda,
        motivo: `Receção de compra ${purchase.numero_encomenda} do fornecedor ${purchase.fornecedor_nome}`,
        data_movimento: new Date().toISOString(),
      });
    });

    purchase.estado = 'RECEBIDO';
    purchase.data_rececao = new Date().toISOString();

    this.addAuditLog(
      userId,
      userName,
      'RECECAO_COMPRA',
      'COMPRAS',
      `Encomenda ${purchase.numero_encomenda} recebida e stock alimentado automaticamente.`
    );

    this.saveData();
    return purchase;
  }

  // AJUSTE MANUAL DE STOCK (PERDA, VENCIDO, AVARIA, INVENTÁRIO)
  public adjustStock(params: {
    produto_id: string;
    lote_id: string;
    tipo: 'AJUSTE_POSITIVO' | 'PERDA_AVARIA' | 'PRODUTO_VENCIDO' | 'DEVOLUCAO';
    quantidade: number;
    motivo: string;
    utilizador_id: string;
    utilizador_nome: string;
  }) {
    const product = this.data.produtos.find(p => p.id === params.produto_id);
    const batch = this.data.lotes.find(l => l.id === params.lote_id);
    if (!product || !batch) throw new Error('Produto ou lote não encontrado');

    const stockAnterior = batch.quantidade_atual;
    if (params.tipo === 'AJUSTE_POSITIVO' || params.tipo === 'DEVOLUCAO') {
      batch.quantidade_atual += params.quantidade;
    } else {
      if (batch.quantidade_atual < params.quantidade) {
        throw new Error(`Quantidade a dar baixa (${params.quantidade}) é maior que o stock do lote (${batch.quantidade_atual}).`);
      }
      batch.quantidade_atual -= params.quantidade;
    }
    const stockResultante = batch.quantidade_atual;

    this.data.movimentos_stock.unshift({
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      produto_id: product.id,
      produto_nome: product.nome,
      lote_id: batch.id,
      numero_lote: batch.numero_lote,
      utilizador_id: params.utilizador_id,
      utilizador_nome: params.utilizador_nome,
      tipo_movimento: params.tipo,
      quantidade: params.quantidade,
      stock_anterior: stockAnterior,
      stock_resultante: stockResultante,
      referencia_documento: 'AJUSTE-MANUAL',
      motivo: params.motivo,
      data_movimento: new Date().toISOString(),
    });

    this.addAuditLog(
      params.utilizador_id,
      params.utilizador_nome,
      'AJUSTE_STOCK',
      'STOCK',
      `Ajuste (${params.tipo}) de ${params.quantidade} un em ${product.nome} (Lote: ${batch.numero_lote}). Motivo: ${params.motivo}`
    );

    this.saveData();
    return batch;
  }
}

export const db = new PharmacyDatabase();
export { hashPassword };
