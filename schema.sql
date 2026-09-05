-- =====================================================================
-- FarmaSys - Sistema de Gestão de Farmácia e Ponto de Venda (PDV)
-- Schema Relacional SQL (Compatível com PostgreSQL 14+ e MySQL 8+)
-- =====================================================================

-- 1. TABELA DE UTILIZADORES
CREATE TABLE IF NOT EXISTS utilizadores (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    pin_acesso VARCHAR(10),
    palavra_passe_hash VARCHAR(255) NOT NULL,
    nivel_acesso VARCHAR(30) NOT NULL CHECK (nivel_acesso IN ('ADMINISTRADOR', 'FARMACEUTICO', 'CAIXA')),
    contacto VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE FORNECEDORES
CREATE TABLE IF NOT EXISTS fornecedores (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    nuit_nif VARCHAR(50),
    contacto VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    endereco TEXT,
    prazo_pagamento_dias INT DEFAULT 30,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(36) PRIMARY KEY,
    codigo_barras VARCHAR(100) UNIQUE,
    codigo_interno VARCHAR(50) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    principio_ativo VARCHAR(200) NOT NULL, -- DCI (Denominação Comum Internacional)
    categoria VARCHAR(100) NOT NULL,       -- Antibiótico, Analgésico, Anti-hipertensivo, etc.
    laboratorio VARCHAR(150) NOT NULL,     -- Fabricante/Laboratório
    forma_farmaceutica VARCHAR(100) NOT NULL, -- Comprimido, Xarope, Injetável, Pomada, Gotas, Cápsula
    dosagem VARCHAR(100),                  -- Ex: 500mg, 10mg/ml, 200mg
    requer_receita BOOLEAN DEFAULT FALSE,  -- Medicamento de venda sob receita médica obrigatória
    eh_controlado BOOLEAN DEFAULT FALSE,   -- Psicotrópico / Estupefaciente sujeito a registo rigoroso
    preco_custo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_minimo INT NOT NULL DEFAULT 10,
    localizacao_prateleira VARCHAR(100),   -- Ex: A1-Gaveta 3
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE LOTES (CONTROLO POR BATCH E VALIDADE - FEFO)
CREATE TABLE IF NOT EXISTS lotes (
    id VARCHAR(36) PRIMARY KEY,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    numero_lote VARCHAR(100) NOT NULL,
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    quantidade_inicial INT NOT NULL,
    quantidade_atual INT NOT NULL,
    preco_custo_lote DECIMAL(12,2),
    fornecedor_id VARCHAR(36) REFERENCES fornecedores(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lotes_validade ON lotes (data_validade ASC);
CREATE INDEX IF NOT EXISTS idx_lotes_produto ON lotes (produto_id);

-- 5. TABELA DE VENDAS (CABEÇALHO)
CREATE TABLE IF NOT EXISTS vendas (
    id VARCHAR(36) PRIMARY KEY,
    numero_fatura VARCHAR(50) UNIQUE NOT NULL,
    caixa_utilizador_id VARCHAR(36) NOT NULL REFERENCES utilizadores(id),
    cliente_nome VARCHAR(150) DEFAULT 'Consumidor Final',
    cliente_contacto VARCHAR(50),
    cliente_nuit VARCHAR(50),
    subtotal DECIMAL(12,2) NOT NULL,
    desconto_valor DECIMAL(12,2) DEFAULT 0.00,
    desconto_percentual DECIMAL(5,2) DEFAULT 0.00,
    imposto_iva DECIMAL(12,2) DEFAULT 0.00,
    total_liquido DECIMAL(12,2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL, -- Dinheiro, M-Pesa, e-Mola, Cartao, Transferencia, Misto
    valor_pago DECIMAL(12,2) NOT NULL,
    troco DECIMAL(12,2) DEFAULT 0.00,
    referencia_pagamento VARCHAR(100),    -- ID da transação M-Pesa/e-Mola/POS
    estado VARCHAR(30) DEFAULT 'CONCLUIDA' CHECK (estado IN ('CONCLUIDA', 'ANULADA', 'DEVOLVIDA')),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas (data_venda DESC);

-- 6. TABELA DE ITENS DA VENDA
CREATE TABLE IF NOT EXISTS itens_venda (
    id VARCHAR(36) PRIMARY KEY,
    venda_id VARCHAR(36) NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id),
    lote_id VARCHAR(36) REFERENCES lotes(id),
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    preco_custo_unitario DECIMAL(12,2) NOT NULL,
    desconto_item DECIMAL(12,2) DEFAULT 0.00,
    subtotal_item DECIMAL(12,2) NOT NULL
);

-- 7. TABELA DE RECEITAS MÉDICAS (MEDICAMENTOS CONTROLADOS)
CREATE TABLE IF NOT EXISTS receitas_medicas (
    id VARCHAR(36) PRIMARY KEY,
    venda_id VARCHAR(36) NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    numero_receita VARCHAR(100) NOT NULL,
    nome_medico VARCHAR(150) NOT NULL,
    numero_ordem_medico VARCHAR(100),
    hospital_clinica VARCHAR(150),
    nome_paciente VARCHAR(150) NOT NULL,
    documento_paciente VARCHAR(100),
    data_prescricao DATE NOT NULL,
    medicamentos_retidos TEXT,
    observacoes TEXT,
    registado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABELA DE COMPRAS / ENCOMENDAS A FORNECEDORES
CREATE TABLE IF NOT EXISTS compras (
    id VARCHAR(36) PRIMARY KEY,
    numero_encomenda VARCHAR(50) UNIQUE NOT NULL,
    fornecedor_id VARCHAR(36) NOT NULL REFERENCES fornecedores(id),
    utilizador_id VARCHAR(36) NOT NULL REFERENCES utilizadores(id),
    total_compra DECIMAL(12,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (estado IN ('PENDENTE', 'RECEBIDO', 'CANCELADO')),
    data_encomenda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_rececao TIMESTAMP,
    observacoes TEXT
);

-- 9. TABELA DE ITENS DA COMPRA
CREATE TABLE IF NOT EXISTS itens_compra (
    id VARCHAR(36) PRIMARY KEY,
    compra_id VARCHAR(36) NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id),
    quantidade_pedida INT NOT NULL,
    quantidade_recebida INT DEFAULT 0,
    preco_custo_unitario DECIMAL(12,2) NOT NULL,
    numero_lote VARCHAR(100),
    data_validade DATE
);

-- 10. TABELA DE MOVIMENTAÇÕES DE STOCK (KARDEX / AUDITORIA DE STOCK)
CREATE TABLE IF NOT EXISTS movimentos_stock (
    id VARCHAR(36) PRIMARY KEY,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id),
    lote_id VARCHAR(36) REFERENCES lotes(id),
    utilizador_id VARCHAR(36) NOT NULL REFERENCES utilizadores(id),
    tipo_movimento VARCHAR(30) NOT NULL CHECK (tipo_movimento IN ('ENTRADA_COMPRA', 'SAIDA_VENDA', 'AJUSTE_POSITIVO', 'PERDA_AVARIA', 'PRODUTO_VENCIDO', 'DEVOLUCAO')),
    quantidade INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_resultante INT NOT NULL,
    referencia_documento VARCHAR(100), -- ID da venda, compra ou ajuste
    motivo TEXT,
    data_movimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movimentos_data ON movimentos_stock (data_movimento DESC);

-- 11. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id VARCHAR(36) PRIMARY KEY,
    utilizador_id VARCHAR(36) REFERENCES utilizadores(id),
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    detalhes TEXT,
    ip_endereco VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. TABELA DE CONFIGURAÇÕES DA FARMÁCIA
CREATE TABLE IF NOT EXISTS configuracoes_farmacia (
    id VARCHAR(36) PRIMARY KEY,
    nome_farmacia VARCHAR(150) NOT NULL,
    nuit VARCHAR(50),
    alvara_sanitario VARCHAR(100),
    responsavel_tecnico VARCHAR(150),
    endereco TEXT,
    contacto VARCHAR(50),
    email VARCHAR(100),
    moeda_simbolo VARCHAR(10) DEFAULT 'MT',
    moeda_codigo VARCHAR(10) DEFAULT 'MZN',
    taxa_iva DECIMAL(5,2) DEFAULT 16.00,
    mensagem_rodape_recibo TEXT
);
