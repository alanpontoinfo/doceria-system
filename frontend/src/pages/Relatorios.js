import React from 'react';
import api from '../api/api';
import { FileDown, DollarSign, Tag, PieChart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Relatorios.css';

export default function Relatorios() {
  const navigate = useNavigate();

  const baixarPDF = async (url, nomeArquivo) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob', 
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erro ao baixar relatório:", err);
      alert("Erro ao gerar PDF. Verifique a conexão com o servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-sweet-gradient p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div>
            <button onClick={() => navigate('/produtos')} className="btn-voltar-rel mb-4">
              <ArrowLeft size={18} /> Voltar
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-doce-preto leading-tight">
              Central de <span className="text-pink-500 italic">Inteligência</span>
            </h1>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-pink-100 flex items-center gap-4">
            <div className="bg-pink-100 p-3 rounded-2xl text-pink-500">
              <PieChart size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Status do Sistema</p>
              <p className="text-sm font-black text-doce-preto">Dados Atualizados</p>
            </div>
          </div>
        </header>

        {/* GRID DE RELATÓRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* CARD RELATÓRIO DE VENDAS */}
          <div className="card-relatorio group">
            <div className="icon-wrapper bg-pink-500 shadow-pink-200">
              <DollarSign size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-doce-preto">Relatório de Vendas</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Visão detalhada de todos os pedidos, clientes e faturamento acumulado da doceria. Ideal para fechamento de mês.
            </p>
            <button 
              onClick={() => baixarPDF('/api/relatorio/vendas', 'vendas_doceria.pdf')}
              className="btn-gerar-pdf-preto"
            >
              <FileDown size={20}/> Gerar PDF de Vendas
            </button>
          </div>

          {/* CARD TABELA DE PREÇOS */}
          <div className="card-relatorio group border-dashed border-gray-200">
            <div className="icon-wrapper bg-doce-preto shadow-gray-200">
              <Tag size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-doce-preto">Tabela de Preços</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Lista atualizada de produtos e categorias para conferência interna ou envio rápido para parceiros e revendedores.
            </p>
            <button 
              onClick={() => baixarPDF('/api/relatorio/precos', 'tabela_precos_atual.pdf')}
              className="btn-gerar-pdf-borda"
            >
              <FileDown size={20}/> Baixar Catálogo PDF
            </button>
          </div>

        </div>


          {/* CARD RELATÓRIO DE VENDAS */}
          <div className="card-relatorio group">
            <div className="icon-wrapper bg-pink-500 shadow-pink-200">
              <DollarSign size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-doce-preto">Relatório Historico de Pedidos</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Visão detalhada do historico  de todos os pedidos de cada cliente.
            </p>
            <button
              onClick={() => baixarPDF('/api/relatorio/meus-pedidos', 'meu_historico_pedidos.pdf')}
              className="btn-gerar-pdf-preto"
            >
              <FileDown size={20}/> Gerar PDF Histórico de Pedidos
            </button>
          </div>


        {/* FOOTER INFORMATIVO */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>© 2026 Doceria System - Módulo de Exportação de Dados Analíticos</p>
        </footer>
      </div>
    </div>
  );
}
