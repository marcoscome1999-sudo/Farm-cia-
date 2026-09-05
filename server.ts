import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// ROTAS DA API
// ==========================================

// 1. AUTENTICAÇÃO E UTILIZADORES
app.post('/api/auth/login', (req, res) => {
  const { email, password, pin } = req.body;
  const data = db.getData();

  // Login por PIN (Ideal para ecrã de vendas no balcão)
  if (pin) {
    const user = data.utilizadores.find(u => u.pin_acesso === pin && u.ativo);
    if (!user) {
      return res.status(401).json({ error: 'PIN de acesso incorreto ou utilizador inativo.' });
    }
    db.addAuditLog(user.id, user.nome, 'LOGIN_PIN', 'AUTENTICACAO', `Utilizador entrou via PIN rápido de balcão.`);
    return res.json({ user, token: 'token_' + user.id });
  }

  // Login por Email e Palavra-passe
  if (email) {
    const user = data.utilizadores.find(u => u.email.toLowerCase() === email.toLowerCase() && u.ativo);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas ou utilizador inativo.' });
    }
    // Nota: aceita 'admin123', 'farma123', 'caixa123' ou qualquer para a demo padrão
    db.addAuditLog(user.id, user.nome, 'LOGIN_EMAIL', 'AUTENTICACAO', `Sessão iniciada via e-mail.`);
    return res.json({ user, token: 'token_' + user.id });
  }

  res.status(400).json({ error: 'Informe e-mail ou PIN para entrar.' });
});

app.get('/api/users', (req, res) => {
  const data = db.getData();
  res.json(data.utilizadores);
});

app.post('/api/users', (req, res) => {
  const { nome, email, pin_acesso, nivel_acesso, contacto, actor_id, actor_name } = req.body;
  if (!nome || !email || !nivel_acesso) {
    return res.status(400).json({ error: 'Nome, e-mail e nível de acesso são obrigatórios.' });
  }
  const data = db.getData();
  if (data.utilizadores.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Já existe um utilizador com este e-mail.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    nome,
    email,
    pin_acesso: pin_acesso || '1234',
    nivel_acesso,
    contacto: contacto || '',
    ativo: true,
    criado_em: new Date().toISOString(),
  };

  data.utilizadores.push(newUser);
  db.addAuditLog(actor_id || 'system', actor_name || 'Admin', 'CRIAR_UTILIZADOR', 'UTILIZADORES', `Criou o utilizador ${nome} (${nivel_acesso}).`);
  db.saveData();

  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, pin_acesso, nivel_acesso, contacto, ativo, actor_id, actor_name } = req.body;
  const data = db.getData();
  const user = data.utilizadores.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado.' });

  if (nome !== undefined) user.nome = nome;
  if (email !== undefined) user.email = email;
  if (pin_acesso !== undefined) user.pin_acesso = pin_acesso;
  if (nivel_acesso !== undefined) user.nivel_acesso = nivel_acesso;
  if (contacto !== undefined) user.contacto = contacto;
  if (ativo !== undefined) user.ativo = ativo;

  db.addAuditLog(actor_id || 'system', actor_name || 'Admin', 'EDITAR_UTILIZADOR', 'UTILIZADORES', `Atualizou os dados de ${user.nome}.`);
  db.saveData();

  res.json(user);
});

// 2. PRODUTOS & STOCK
app.get('/api/products', (req, res) => {
  const products = db.getProductsWithStock();
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const data = db.getData();
  const {
    codigo_barras,
    codigo_interno,
    nome,
    principio_ativo,
    categoria,
    laboratorio,
    forma_farmaceutica,
    dosagem,
    requer_receita,
    eh_controlado,
    preco_custo,
    preco_venda,
    stock_minimo,
    localizacao_prateleira,
    lote_inicial,
    data_validade_inicial,
    quantidade_inicial,
    actor_id,
    actor_name,
  } = req.body;

  if (!nome || !principio_ativo || !categoria) {
    return res.status(400).json({ error: 'Nome, princípio ativo e categoria são obrigatórios.' });
  }

  const prodId = 'prod_' + Date.now();
  const internalCode = codigo_interno || `MED-${String(data.produtos.length + 1).padStart(3, '0')}`;
  const barcode = codigo_barras || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;

  const newProduct = {
    id: prodId,
    codigo_barras: barcode,
    codigo_interno: internalCode,
    nome,
    principio_ativo,
    categoria,
    laboratorio: laboratorio || 'Genérico',
    forma_farmaceutica: forma_farmaceutica || 'Comprimido',
    dosagem: dosagem || '',
    requer_receita: Boolean(requer_receita),
    eh_controlado: Boolean(eh_controlado),
    preco_custo: Number(preco_custo) || 0,
    preco_venda: Number(preco_venda) || 0,
    stock_minimo: Number(stock_minimo) || 10,
    localizacao_prateleira: localizacao_prateleira || '',
    ativo: true,
  };

  data.produtos.unshift(newProduct);

  // Se informou lote inicial no cadastro
  if (quantidade_inicial && Number(quantidade_inicial) > 0 && data_validade_inicial) {
    const lotNum = lote_inicial || `L-INIC-${new Date().getFullYear()}`;
    const batchId = 'lot_' + Date.now();
    data.lotes.push({
      id: batchId,
      produto_id: prodId,
      numero_lote: lotNum,
      data_fabricacao: new Date().toISOString().split('T')[0],
      data_validade: data_validade_inicial,
      quantidade_inicial: Number(quantidade_inicial),
      quantidade_atual: Number(quantidade_inicial),
      preco_custo_lote: Number(preco_custo) || 0,
      criado_em: new Date().toISOString(),
    });

    data.movimentos_stock.unshift({
      id: 'mov_' + Date.now(),
      produto_id: prodId,
      produto_nome: nome,
      lote_id: batchId,
      numero_lote: lotNum,
      utilizador_id: actor_id || 'system',
      utilizador_nome: actor_name || 'Admin',
      tipo_movimento: 'AJUSTE_POSITIVO',
      quantidade: Number(quantidade_inicial),
      stock_anterior: 0,
      stock_resultante: Number(quantidade_inicial),
      referencia_documento: 'CADASTRO-INICIAL',
      motivo: 'Inventário inicial no registo do medicamento',
      data_movimento: new Date().toISOString(),
    });
  }

  db.addAuditLog(
    actor_id || 'system',
    actor_name || 'Admin',
    'CRIAR_PRODUTO',
    'CATALOGO',
    `Cadastrou o produto ${nome} (P. Venda: ${newProduct.preco_venda}, Controlado: ${newProduct.eh_controlado ? 'Sim' : 'Não'}).`
  );

  db.saveData();
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const data = db.getData();
  const product = data.produtos.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

  const {
    codigo_barras,
    codigo_interno,
    nome,
    principio_ativo,
    categoria,
    laboratorio,
    forma_farmaceutica,
    dosagem,
    requer_receita,
    eh_controlado,
    preco_custo,
    preco_venda,
    stock_minimo,
    localizacao_prateleira,
    ativo,
    actor_id,
    actor_name,
  } = req.body;

  // Log de alteração de preços (auditoria estrita de farmácia)
  if (preco_venda !== undefined && Number(preco_venda) !== product.preco_venda) {
    db.addAuditLog(
      actor_id || 'system',
      actor_name || 'Admin',
      'ALTERACAO_PRECO',
      'CATALOGO',
      `Alterou o preço de venda de ${product.nome} de ${product.preco_venda} para ${preco_venda}.`
    );
  }

  if (codigo_barras !== undefined) product.codigo_barras = codigo_barras;
  if (codigo_interno !== undefined) product.codigo_interno = codigo_interno;
  if (nome !== undefined) product.nome = nome;
  if (principio_ativo !== undefined) product.principio_ativo = principio_ativo;
  if (categoria !== undefined) product.categoria = categoria;
  if (laboratorio !== undefined) product.laboratorio = laboratorio;
  if (forma_farmaceutica !== undefined) product.forma_farmaceutica = forma_farmaceutica;
  if (dosagem !== undefined) product.dosagem = dosagem;
  if (requer_receita !== undefined) product.requer_receita = Boolean(requer_receita);
  if (eh_controlado !== undefined) product.eh_controlado = Boolean(eh_controlado);
  if (preco_custo !== undefined) product.preco_custo = Number(preco_custo);
  if (preco_venda !== undefined) product.preco_venda = Number(preco_venda);
  if (stock_minimo !== undefined) product.stock_minimo = Number(stock_minimo);
  if (localizacao_prateleira !== undefined) product.localizacao_prateleira = localizacao_prateleira;
  if (ativo !== undefined) product.ativo = Boolean(ativo);

  db.saveData();
  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const actor_id = req.body?.actor_id || req.query.actor_id;
  const actor_name = req.body?.actor_name || req.query.actor_name;

  const data = db.getData();
  const productIndex = data.produtos.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const removedProduct = data.produtos[productIndex];

  // Remover produto
  data.produtos.splice(productIndex, 1);

  // Remover lotes associados
  const associatedBatchesCount = data.lotes.filter(l => l.produto_id === id).length;
  data.lotes = data.lotes.filter(l => l.produto_id !== id);

  // Registar no log de auditoria
  db.addAuditLog(
    actor_id || 'system',
    actor_name || 'Admin',
    'REMOVER_PRODUTO',
    'CATALOGO',
    `Removeu o produto "${removedProduct.nome}" (${removedProduct.codigo_interno}) e eliminou ${associatedBatchesCount} lote(s) associado(s).`
  );

  db.saveData();
  res.json({
    success: true,
    message: `Produto "${removedProduct.nome}" removido com sucesso.`,
    batchesRemoved: associatedBatchesCount,
  });
});

// 3. LOTES
app.get('/api/batches', (req, res) => {
  const data = db.getData();
  const now = new Date();
  const enriched = data.lotes.map(b => {
    const prod = data.produtos.find(p => p.id === b.produto_id);
    const expDate = new Date(b.data_validade);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    let status: 'VALIDO' | 'PROXIMO_30' | 'PROXIMO_60' | 'PROXIMO_90' | 'VENCIDO' = 'VALIDO';
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
      produto_nome: prod?.nome || 'Medicamento',
      dias_para_vencer: diffDays,
      status_validade: status,
    };
  }).sort((a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime());

  res.json(enriched);
});

app.post('/api/batches', (req, res) => {
  const data = db.getData();
  const { produto_id, numero_lote, data_fabricacao, data_validade, quantidade, preco_custo, fornecedor_id, actor_id, actor_name } = req.body;

  if (!produto_id || !numero_lote || !data_validade || !quantidade) {
    return res.status(400).json({ error: 'Produto, número de lote, validade e quantidade são obrigatórios.' });
  }

  const product = data.produtos.find(p => p.id === produto_id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

  const batchId = 'lot_' + Date.now();
  const newBatch = {
    id: batchId,
    produto_id,
    numero_lote,
    data_fabricacao: data_fabricacao || new Date().toISOString().split('T')[0],
    data_validade,
    quantidade_inicial: Number(quantidade),
    quantidade_atual: Number(quantidade),
    preco_custo_lote: Number(preco_custo) || product.preco_custo,
    fornecedor_id: fornecedor_id || undefined,
    criado_em: new Date().toISOString(),
  };

  data.lotes.push(newBatch);

  // Kardex
  data.movimentos_stock.unshift({
    id: 'mov_' + Date.now(),
    produto_id,
    produto_nome: product.nome,
    lote_id: batchId,
    numero_lote,
    utilizador_id: actor_id || 'system',
    utilizador_nome: actor_name || 'Farmacêutico',
    tipo_movimento: 'AJUSTE_POSITIVO',
    quantidade: Number(quantidade),
    stock_anterior: 0,
    stock_resultante: Number(quantidade),
    referencia_documento: 'NOVO-LOTE',
    motivo: `Criação manual de novo lote ${numero_lote}`,
    data_movimento: new Date().toISOString(),
  });

  db.addAuditLog(
    actor_id || 'system',
    actor_name || 'Farmacêutico',
    'NOVO_LOTE',
    'STOCK',
    `Adicionado lote ${numero_lote} (${quantidade} un) para ${product.nome}. Validade: ${data_validade}.`
  );

  db.saveData();
  res.status(201).json(newBatch);
});

// 4. MOVIMENTOS E AJUSTES DE STOCK
app.post('/api/stock/adjust', (req, res) => {
  try {
    const { produto_id, lote_id, tipo, quantidade, motivo, utilizador_id, utilizador_nome } = req.body;
    if (!produto_id || !lote_id || !tipo || !quantidade || !motivo) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios para justificar o ajuste.' });
    }

    const updatedBatch = db.adjustStock({
      produto_id,
      lote_id,
      tipo,
      quantidade: Number(quantidade),
      motivo,
      utilizador_id: utilizador_id || 'system',
      utilizador_nome: utilizador_nome || 'Operador',
    });

    res.json(updatedBatch);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao ajustar stock.' });
  }
});

app.get('/api/stock/movements', (req, res) => {
  const data = db.getData();
  res.json(data.movimentos_stock);
});

// 5. VENDAS (PDV)
app.post('/api/sales', (req, res) => {
  try {
    const saleData = req.body;
    if (!saleData.itens || saleData.itens.length === 0) {
      return res.status(400).json({ error: 'O carrinho de vendas está vazio.' });
    }

    // Processamento atômico de venda com dedução FEFO
    const sale = db.createSale(saleData);
    res.status(201).json(sale);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Falha ao processar venda.' });
  }
});

app.get('/api/sales', (req, res) => {
  const data = db.getData();
  res.json(data.vendas);
});

app.get('/api/sales/:id', (req, res) => {
  const data = db.getData();
  const sale = data.vendas.find(s => s.id === req.params.id);
  if (!sale) return res.status(404).json({ error: 'Venda não encontrada.' });
  res.json(sale);
});

app.get('/api/prescriptions', (req, res) => {
  const data = db.getData();
  res.json(data.receitas);
});

// 6. FORNECEDORES E COMPRAS
app.get('/api/suppliers', (req, res) => {
  const data = db.getData();
  res.json(data.fornecedores);
});

app.post('/api/suppliers', (req, res) => {
  const data = db.getData();
  const { nome, nuit_nif, contacto, email, endereco, prazo_pagamento_dias, actor_id, actor_name } = req.body;
  if (!nome || !contacto) return res.status(400).json({ error: 'Nome e contacto são obrigatórios.' });

  const newSupplier = {
    id: 'sup_' + Date.now(),
    nome,
    nuit_nif: nuit_nif || '',
    contacto,
    email: email || '',
    endereco: endereco || '',
    prazo_pagamento_dias: Number(prazo_pagamento_dias) || 30,
    ativo: true,
    criado_em: new Date().toISOString(),
  };

  data.fornecedores.push(newSupplier);
  db.addAuditLog(actor_id || 'system', actor_name || 'Admin', 'CRIAR_FORNECEDOR', 'FORNECEDORES', `Cadastrou o fornecedor ${nome}.`);
  db.saveData();

  res.status(201).json(newSupplier);
});

app.put('/api/suppliers/:id', (req, res) => {
  const data = db.getData();
  const supplier = data.fornecedores.find(s => s.id === req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado.' });

  const { nome, nuit_nif, contacto, email, endereco, prazo_pagamento_dias, ativo, actor_id, actor_name } = req.body;
  if (nome !== undefined) supplier.nome = nome;
  if (nuit_nif !== undefined) supplier.nuit_nif = nuit_nif;
  if (contacto !== undefined) supplier.contacto = contacto;
  if (email !== undefined) supplier.email = email;
  if (endereco !== undefined) supplier.endereco = endereco;
  if (prazo_pagamento_dias !== undefined) supplier.prazo_pagamento_dias = Number(prazo_pagamento_dias);
  if (ativo !== undefined) supplier.ativo = Boolean(ativo);

  db.addAuditLog(actor_id || 'system', actor_name || 'Admin', 'EDITAR_FORNECEDOR', 'FORNECEDORES', `Atualizou o fornecedor ${supplier.nome}.`);
  db.saveData();

  res.json(supplier);
});

app.get('/api/purchases', (req, res) => {
  const data = db.getData();
  res.json(data.compras);
});

app.post('/api/purchases', (req, res) => {
  const data = db.getData();
  const { fornecedor_id, itens, observacoes, utilizador_id, utilizador_nome } = req.body;
  if (!fornecedor_id || !itens || itens.length === 0) {
    return res.status(400).json({ error: 'Fornecedor e itens são obrigatórios.' });
  }

  const supplier = data.fornecedores.find(s => s.id === fornecedor_id);
  if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado.' });

  const total = itens.reduce((acc: number, it: any) => acc + (it.quantidade_pedida * it.preco_custo_unitario), 0);
  const purchaseId = 'pur_' + Date.now();
  const count = data.compras.length + 1;
  const orderNum = `ENC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

  const newPurchase = {
    id: purchaseId,
    numero_encomenda: orderNum,
    fornecedor_id,
    fornecedor_nome: supplier.nome,
    utilizador_id: utilizador_id || 'usr_admin_01',
    utilizador_nome: utilizador_nome || 'Dr. Afonso Muchanga',
    total_compra: total,
    estado: 'PENDENTE' as const,
    data_encomenda: new Date().toISOString(),
    observacoes: observacoes || '',
    itens: itens.map((it: any) => ({
      id: 'pitem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      compra_id: purchaseId,
      produto_id: it.produto_id,
      produto_nome: it.produto_nome,
      quantidade_pedida: Number(it.quantidade_pedida),
      preco_custo_unitario: Number(it.preco_custo_unitario),
    })),
  };

  data.compras.unshift(newPurchase);
  db.addAuditLog(
    utilizador_id || 'system',
    utilizador_nome || 'Admin',
    'CRIAR_ENCOMENDA',
    'COMPRAS',
    `Criou encomenda ${orderNum} para ${supplier.nome} no valor de ${total.toFixed(2)} ${data.configuracoes.moeda_simbolo}.`
  );
  db.saveData();

  res.status(201).json(newPurchase);
});

app.post('/api/purchases/:id/receive', (req, res) => {
  try {
    const { id } = req.params;
    const { itensRecebidos, utilizador_id, utilizador_nome } = req.body;
    if (!itensRecebidos || itensRecebidos.length === 0) {
      return res.status(400).json({ error: 'Dados dos itens recebidos com lote e validade são obrigatórios.' });
    }

    const received = db.receivePurchase(id, utilizador_id || 'system', utilizador_nome || 'Farmacêutico', itensRecebidos);
    res.json(received);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao receber encomenda.' });
  }
});

// 7. RELATÓRIOS & ESTATÍSTICAS AVANÇADAS
app.get('/api/reports/summary', (req, res) => {
  const data = db.getData();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7);

  // Vendas de hoje
  const salesToday = data.vendas.filter(s => s.data_venda.startsWith(todayStr) && s.estado === 'CONCLUIDA');
  const vendasHojeTotal = salesToday.reduce((acc, s) => acc + s.total_liquido, 0);

  // Vendas do mês
  const salesMonth = data.vendas.filter(s => s.data_venda.startsWith(currentYearMonth) && s.estado === 'CONCLUIDA');
  const vendasMesTotal = salesMonth.reduce((acc, s) => acc + s.total_liquido, 0);

  // Lucro do mês estimado (Preço de venda - Preço de custo)
  let custoTotalMes = 0;
  salesMonth.forEach(sale => {
    sale.itens.forEach(item => {
      custoTotalMes += item.preco_custo_unitario * item.quantidade;
    });
  });
  const lucroMesEstimado = vendasMesTotal - custoTotalMes;
  const margemLucroMedia = vendasMesTotal > 0 ? (lucroMesEstimado / vendasMesTotal) * 100 : 0;

  // Produtos e Alertas
  const productsWithStock = db.getProductsWithStock();
  const produtosBaixoStock = productsWithStock.filter(p => (p.stock_total || 0) <= p.stock_minimo).length;

  let produtosVencidos = 0;
  let produtosPrestesVencer = 0;
  data.lotes.forEach(l => {
    if (l.quantidade_atual > 0) {
      const expDate = new Date(l.data_validade);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 0) {
        produtosVencidos++;
      } else if (diffDays <= 90) {
        produtosPrestesVencer++;
      }
    }
  });

  // Valorização do stock (Custo e Venda)
  let valorStockCusto = 0;
  let valorStockVenda = 0;
  productsWithStock.forEach(p => {
    const totalQty = p.stock_total || 0;
    valorStockCusto += totalQty * p.preco_custo;
    valorStockVenda += totalQty * p.preco_venda;
  });

  // Vendas por método de pagamento
  const paymentMap: Record<string, { total: number; contagem: number }> = {};
  data.vendas.filter(s => s.estado === 'CONCLUIDA').forEach(s => {
    if (!paymentMap[s.forma_pagamento]) {
      paymentMap[s.forma_pagamento] = { total: 0, contagem: 0 };
    }
    paymentMap[s.forma_pagamento].total += s.total_liquido;
    paymentMap[s.forma_pagamento].contagem += 1;
  });

  const vendasPorPagamento = Object.entries(paymentMap).map(([metodo, val]) => ({
    metodo: metodo as any,
    total: val.total,
    contagem: val.contagem,
  }));

  // Histórico últimos 7 dias para gráficos
  const ultimosDias: { data: string; total: number; lucro: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const daySales = data.vendas.filter(s => s.data_venda.startsWith(dateStr) && s.estado === 'CONCLUIDA');
    const dayTotal = daySales.reduce((acc, s) => acc + s.total_liquido, 0);
    let dayCost = 0;
    daySales.forEach(s => {
      s.itens.forEach(it => {
        dayCost += it.preco_custo_unitario * it.quantidade;
      });
    });
    ultimosDias.push({
      data: dateStr.split('-').slice(1).reverse().join('/'),
      total: dayTotal,
      lucro: Math.max(0, dayTotal - dayCost),
    });
  }

  res.json({
    vendas_hoje_total: vendasHojeTotal,
    vendas_hoje_contagem: salesToday.length,
    vendas_mes_total: vendasMesTotal,
    lucro_mes_estimado: lucroMesEstimado,
    margem_lucro_media: Math.round(margemLucroMedia * 10) / 10,
    total_produtos: data.produtos.length,
    produtos_baixo_stock: produtosBaixoStock,
    produtos_vencidos: produtosVencidos,
    lotes_vencidos: produtosVencidos,
    produtos_prestes_vencer: produtosPrestesVencer,
    valor_stock_custo: valorStockCusto,
    valor_stock_venda: valorStockVenda,
    vendas_por_pagamento: vendasPorPagamento,
    vendas_ultimos_dias: ultimosDias,
  });
});

app.get('/api/reports/top-products', (req, res) => {
  const data = db.getData();
  const salesMap: Record<string, { produto_id: string; nome: string; quantidade: number; receita: number; lucro: number }> = {};

  data.vendas.filter(s => s.estado === 'CONCLUIDA').forEach(sale => {
    sale.itens.forEach(it => {
      if (!salesMap[it.produto_id]) {
        salesMap[it.produto_id] = {
          produto_id: it.produto_id,
          nome: it.produto_nome,
          quantidade: 0,
          receita: 0,
          lucro: 0,
        };
      }
      salesMap[it.produto_id].quantidade += it.quantidade;
      salesMap[it.produto_id].receita += it.subtotal_item;
      salesMap[it.produto_id].lucro += it.subtotal_item - (it.preco_custo_unitario * it.quantidade);
    });
  });

  const list = Object.values(salesMap).sort((a, b) => b.quantidade - a.quantidade);
  res.json(list.slice(0, 10));
});

app.get('/api/reports/stagnant', (req, res) => {
  const data = db.getData();
  const daysThreshold = Number(req.query.dias) || 30;
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - daysThreshold * 86400000);

  const soldProductIds = new Set<string>();
  data.vendas.forEach(s => {
    if (new Date(s.data_venda) >= thresholdDate && s.estado === 'CONCLUIDA') {
      s.itens.forEach(it => soldProductIds.add(it.produto_id));
    }
  });

  const productsWithStock = db.getProductsWithStock();
  const stagnant = productsWithStock
    .filter(p => !soldProductIds.has(p.id) && (p.stock_total || 0) > 0)
    .map(p => ({
      ...p,
      valor_parado_custo: (p.stock_total || 0) * p.preco_custo,
      valor_parado_venda: (p.stock_total || 0) * p.preco_venda,
    }));

  res.json(stagnant);
});

// 8. CONFIGURAÇÕES, AUDITORIA, BACKUP E SCHEMA SQL
app.get('/api/settings', (req, res) => {
  const data = db.getData();
  res.json(data.configuracoes);
});

app.put('/api/settings', (req, res) => {
  const data = db.getData();
  const { actor_id, actor_name, ...newSettings } = req.body;
  data.configuracoes = { ...data.configuracoes, ...newSettings };
  db.addAuditLog(actor_id || 'system', actor_name || 'Admin', 'ATUALIZAR_CONFIGURACOES', 'CONFIGURACOES', 'Atualizou as definições da farmácia.');
  db.saveData();
  res.json(data.configuracoes);
});

app.get('/api/audit-logs', (req, res) => {
  const data = db.getData();
  res.json(data.auditoria_logs);
});

app.get('/api/backup/export', (req, res) => {
  const data = db.getData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=farmasys_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(data, null, 2));
});

app.post('/api/backup/restore', (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData.produtos || !backupData.lotes || !backupData.utilizadores) {
      return res.status(400).json({ error: 'Ficheiro de backup inválido ou estrutura corrompida.' });
    }
    db.saveData(backupData);
    res.json({ success: true, message: 'Base de dados restaurada com sucesso!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao restaurar backup.' });
  }
});

app.get('/api/schema.sql', (req, res) => {
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } else {
    res.status(404).send('-- Schema SQL não encontrado');
  }
});

// ==========================================
// VITE MIDDLEWARE & SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
const vite = await createViteServer({
    server: {
      middlewareMode: true,
      // The preview host provides the HMR WebSocket; do not open a second fixed port.
      hmr: false,
    },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FarmaSys Server operacional na porta ${PORT}`);
  });
}

startServer();
