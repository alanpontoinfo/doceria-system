import React, { useState } from 'react';
import api from '../api/api';
import { DollarSign, Percent, Box, PieChart, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Preco.css';

export default function Preco() {
  const [form, setForm] = useState({ 
    ingredientes: 0, 
    embalagem: 0, 
    porcentagem_adicional: 30, 
    porcentagem_margem: 50,
    qtd_produzida: 1 // Novo campo
  });
  
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const calcular = async () => {
    if (form.qtd_produzida <= 0) {
      alert("A quantidade produzida deve ser pelo menos 1.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/produtos/precificar', form);
      const dados = res.data.calculo_detalhado;
      
      // Cálculo do valor unitário (Preço Final Sugerido / Qtd Produzida)
      const precoFinal = parseFloat(dados['5_preco_final_sugerido']);
      const valorUnitario = form.qtd_produzida / precoFinal;

      setResultado({
        ...dados,
        valor_unitario: valorUnitario.toFixed(2)
      });
    } catch (err) {
      alert("Erro ao calcular. Verifique se o servidor Flask está ativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sweet-gradient p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <button onClick={() => navigate('/produtos')} className="btn-voltar-preco mb-6">
          <ArrowLeft size={20} /> Voltar ao Menu
        </button>

        <div className="bg-doce-preto text-white p-8 md:p-12 rounded-[40px] shadow-2xl border-r-8 border-pink-500 animate-fade-in">
          <header className="mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-pink-300 flex items-center gap-3">
              <PieChart size={32} /> Precificação <span className="text-white italic text-2xl">Inteligente</span>
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Ajuste os custos e margens para encontrar o preço ideal por unidade.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* COLUNA DE CUSTOS */}
            <div className="space-y-6">
              <div className="input-group-precificacao">
                <label><DollarSign size={16}/> Custo Ingredientes (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  onChange={e => setForm({...form, ingredientes: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="input-group-precificacao">
                <label><Box size={16}/> Custo Embalagem (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  onChange={e => setForm({...form, embalagem: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="input-group-precificacao">
                <label><Info size={16}/> Qtd Produzida (Fornada)</label>
                <input 
                  type="number" 
                  value={form.qtd_produzida}
                  placeholder="Ex: 20 brigadeiros"
                  onChange={e => setForm({...form, qtd_produzida: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            {/* COLUNA DE PERCENTUAIS */}
            <div className="space-y-6">
              <div className="input-group-precificacao">
                <label><Percent size={16}/> Custos Adicionais (%)</label>
                <input 
                  type="number" 
                  value={form.porcentagem_adicional}
                  onChange={e => setForm({...form, porcentagem_adicional: parseFloat(e.target.value) || 0})}
                />
                <small className="text-gray-500">Luz, água, gás, etc.</small>
              </div>

              <div className="input-group-precificacao">
                <label><Percent size={16}/> Margem de Lucro Desejada (%)</label>
                <input 
                  type="number" 
                  value={form.porcentagem_margem}
                  onChange={e => setForm({...form, porcentagem_margem: parseFloat(e.target.value) || 0})}
                />
              </div>

              <button 
                onClick={calcular} 
                disabled={loading}
                className="btn-calcular-grande"
              >
                {loading ? 'Calculando...' : 'Gerar Valor Sugerido'}
              </button>
            </div>
          </div>

          {/* RESULTADO (EXIBIÇÃO ANALÍTICA) */}
          {resultado && (
            <div className="mt-12 bg-white/5 p-8 rounded-3xl border-2 border-dashed border-pink-500/30 animate-scale-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <p className="flex justify-between text-gray-400">
                    <span>Custo Total Produção:</span> 
                    <span className="text-white font-bold">R$ {resultado['3_custo_total_producao']}</span>
                  </p>
                  <p className="flex justify-between text-gray-400">
                    <span>Sugestão Fornada:</span> 
                    <span className="text-white font-bold">R$ {resultado['5_preco_final_sugerido']}</span>
                  </p>
                </div>
                
                <div className="bg-pink-500 p-6 rounded-2xl text-center shadow-lg">
                  <span className="text-xs uppercase font-black tracking-widest text-pink-100">Preço Unitário Sugerido</span>
                  <h3 className="text-4xl font-black text-white">R$ {resultado.valor_unitario}</h3>
                  <p className="text-[10px] text-pink-200 mt-1">Lucro de {form.porcentagem_margem}% garantido</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
