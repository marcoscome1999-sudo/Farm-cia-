import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Database,
  Terminal,
  FileCode,
  Copy,
  Check,
  Server,
  Layers,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface ManualDocsModalProps {
  onClose: () => void;
}

export const ManualDocsModal: React.FC<ManualDocsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'instalacao' | 'schema'>('manual');
  const [copied, setCopied] = useState(false);

  const sampleSqlSnippet = `-- TABELA PRINCIPAL DE PRODUTOS / MEDICAMENTOS
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(36) PRIMARY KEY,
    codigo_barras VARCHAR(64) UNIQUE,
    codigo_interno VARCHAR(32) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    principio_ativo VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    laboratorio VARCHAR(100),
    forma_farmaceutica VARCHAR(60) NOT NULL,
    dosagem VARCHAR(60),
    preco_custo DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    preco_venda DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock_minimo INT NOT NULL DEFAULT 10,
    requer_receita BOOLEAN NOT NULL DEFAULT FALSE,
    eh_controlado BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONTROLO DE LOTES E VALIDADE (FEFO)
CREATE TABLE IF NOT EXISTS lotes (
    id VARCHAR(36) PRIMARY KEY,
    produto_id VARCHAR(36) NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    numero_lote VARCHAR(50) NOT NULL,
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    quantidade_inicial INT NOT NULL,
    quantidade_atual INT NOT NULL,
    preco_custo_lote DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REGISTO DE VENDAS (PDV)
CREATE TABLE IF NOT EXISTS vendas (
    id VARCHAR(36) PRIMARY KEY,
    numero_fatura VARCHAR(32) UNIQUE NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    caixa_utilizador_id VARCHAR(36) NOT NULL REFERENCES utilizadores(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    desconto_valor DECIMAL(12, 2) DEFAULT 0.00,
    total_liquido DECIMAL(12, 2) NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL,
    valor_pago DECIMAL(12, 2) NOT NULL,
    troco DECIMAL(12, 2) DEFAULT 0.00,
    cliente_nome VARCHAR(120) DEFAULT 'Consumidor Final',
    cliente_contacto VARCHAR(50),
    cliente_nuit VARCHAR(30)
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleSqlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Manual do Sistema & Documentação Técnica</h3>
              <p className="text-xs text-slate-500">Instruções de operação diária, arquitetura e migração de banco de dados.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-nav */}
        <div className="px-6 pt-3 border-b border-slate-100 flex gap-2">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual de Uso (Passo a Passo)
          </button>
          <button
            onClick={() => setActiveTab('instalacao')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'instalacao'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Guia de Instalação & Stack
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Schema Relacional (SQL)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed flex-1">
          
          {/* TAB 1: MANUAL DO UTILIZADOR */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <h4 className="font-bold text-emerald-900 text-sm mb-1">Visão Geral do FarmaSys PDV</h4>
                <p className="text-emerald-800 text-xs">
                  O FarmaSys foi projetado para operações de balcão rápidas e seguras em farmácias comunitárias e hospitalares de pequeno e médio porte. Garante conformidade com o princípio <strong>FEFO</strong> (First-Expired, First-Out) e rastreabilidade rigorosa de medicamentos controlados.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-xs">1</span>
                    Como Realizar uma Venda no Balcão (PDV)
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px]">F2</kbd> para focar a barra de pesquisa ou utilize um leitor de código de barras USB/Câmara.</li>
                    <li>O sistema seleciona automaticamente o lote com validade mais próxima (FEFO).</li>
                    <li>Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px]">F4</kbd> ou clique em <strong>Finalizar Venda</strong>.</li>
                    <li>Escolha o método: Dinheiro (com cálculo automático de troco e notas rápidas), M-Pesa, e-Mola ou Cartão POS.</li>
                    <li>O recibo térmico de 80mm é emitido com todos os dados fiscais.</li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-mono text-xs">2</span>
                    Medicamentos Controlados & Retenção de Receita
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Medicamentos marcados como psicotrópicos exigem preenchimento obrigatório da receita.</li>
                    <li>O sistema solicita: Nome do médico, nº da ordem médica, hospital, dados do paciente e nº da receita.</li>
                    <li>A venda só é autorizada após a validação sanitária da receita.</li>
                    <li>Os dados ficam gravados no livro eletrónico para inspeção oficial.</li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-mono text-xs">3</span>
                    Gestão de Lotes & Alertas de Validade
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>O sistema calcula os dias restantes para expiração em tempo real.</li>
                    <li>Alertas visuais a 90, 60 e 30 dias de vencimento.</li>
                    <li>Lotes vencidos são bloqueados e destacados em vermelho para descarte/segregação.</li>
                    <li>Toda perda por quebra ou vencimento é justificada com registo em Kardex.</li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-mono text-xs">4</span>
                    Compras e Fornecedores
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Emita pedidos de compra a fornecedores cadastrados.</li>
                    <li>Ao receber os medicamentos, confira e insira o número de lote do fabricante e prazo de validade.</li>
                    <li>O stock é alimentado instantaneamente sem necessidade de cadastros duplicados.</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GUIA DE INSTALAÇÃO */}
          {activeTab === 'instalacao' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-sans text-sm">
                  <Terminal className="w-4 h-4" />
                  Instalação e Execução Local (Node.js)
                </div>
                <div>
                  <p className="text-slate-400"># 1. Clonar ou descompactar o projeto:</p>
                  <p className="text-emerald-300">git clone https://github.com/empresa/farmasys.git && cd farmasys</p>
                </div>
                <div>
                  <p className="text-slate-400"># 2. Instalar dependências:</p>
                  <p className="text-emerald-300">npm install</p>
                </div>
                <div>
                  <p className="text-slate-400"># 3. Executar o servidor e frontend:</p>
                  <p className="text-emerald-300">npm run dev</p>
                </div>
                <div>
                  <p className="text-slate-400"># 4. Aceder no navegador / tablet:</p>
                  <p className="text-cyan-300">http://localhost:3000 ou http://IP_DO_SERVIDOR:3000</p>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  Opção de Deploy com Banco Relacional (MySQL / PostgreSQL / MariaDB)
                </h4>
                <p className="text-slate-600">
                  O sistema inclui o ficheiro <code>schema.sql</code> completo com chaves primárias, chaves estrangeiras, índices e triggers de integridade. Para migrar para MySQL ou PostgreSQL em produção:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium">
                  <li>Crie a base de dados: <code>CREATE DATABASE farmasys_db;</code></li>
                  <li>Importe as tabelas executando o ficheiro <code>schema.sql</code></li>
                  <li>Configure as variáveis de ambiente <code>DATABASE_URL</code> no arquivo <code>.env</code></li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEMA SQL */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Estrutura Relacional (schema.sql)
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto border border-slate-800 max-h-96">
                {sampleSqlSnippet}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
