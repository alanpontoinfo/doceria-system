import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Trash2, Edit, Plus, FileText, X, ShoppingBag, LogOut, User, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import './Produtos.css';

export default function Produtos() {
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', tipoProduto: '', preco: '', qtd: '' });

  const itensPorPagina = 6;
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('userTipo') === 'admin';
  const userName = localStorage.getItem('userName') || 'Confeiteiro(a)';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/produtos');
      setProds(res.data);
    } catch (err) {
      console.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Paginação (Melhorada)
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const produtosExibidos = prods.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(prods.length / itensPorPagina);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
	  {/*window.location.href = '/';*/}
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({ nome: p.nome, tipoProduto: p.tipoProduto, preco: p.preco, qtd: p.qtd });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/produtos/${editingId}`, form);
      } else {
        await api.post('/produtos', form);
      }
      fecharModal();
      loadProducts();
    } catch (err) {
      alert("Erro ao salvar dados.");
    }
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ nome: '', tipoProduto: '', preco: '', qtd: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente remover este doce?")) {
      try {
        await api.delete(`/produtos/${id}`);
        loadProducts();
      } catch (err) {
        alert("Erro ao excluir");
      }
    }
  };
/*
  const handleDownloadPrecos = async () => {
    try {
      const res = await api.get('/relatorio/precos', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tabela_precos.pdf');
      link.click();
    } catch (err) {
      alert("Erro ao gerar PDF.");
    }
  };
*/
  return (
    <div className="min-h-screen bg-sweet-gradient p-8">
      {/* BARRA SUPERIOR DE USUÁRIO */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6 bg-white/70 p-4 rounded-3xl backdrop-blur-md border border-white shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-pink-500 p-2 rounded-full text-white">
            <User size={18} />
          </div>
          <span className="text-doce-preto font-bold">
            Olá, <span className="text-pink-600">{userName.split(' ')[0]}</span>!
          </span>
        </div>
        <button onClick={handleLogout} className="btn-logoff text-xs md:text-sm">
          <LogOut size={16} /> <span className="hidden md:inline">Sair</span>
        </button>
      </div>

	  {/*<div className="max-w-6xl mx-auto mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black text-doce-preto mb-6">
          Menu de <span className="text-pink-500">Delícias</span>
        </h1>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <button onClick={() => navigate('/pedidos')} className="btn-pedidos w-full md:w-auto">
            <ShoppingBag size={18} /> Fazer Pedido
          </button>
	  { isAdmin && (
		  <button onClick={() => navigate('/relatorios')} className="btn-admin w-full md:w-auto">
              <FileText size={16}/> <span className="hidden md:inline"/> Relatórios
            </button> )}

          {isAdmin && (

            <button onClick={() => navigate('/precificar')} className="btn-admin w-full md:w-auto">
              <DollarSign size={16} /> Precificar
            </button>
          
          )}
     {/*      <button onClick={handleDownloadPrecos} className="btn-cursorpointer btn-secondary flex-1 md:flex-none">
            <FileText size={18} /> <span className="hidden md:inline">Tabela PDF</span>
          </button>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full md:w-auto">
              <Plus size={16} /> <span className="hidden md:inline">Novo</span>
            </button>
          )}
        </div>
      </div>*/}
	  
	  

    {/* CONTAINER RESPONSIVO DE BOTÕES */}


<div className="max-w-6xl mx-auto mb-10 text-center md:text-left">
  <h1 className="text-3xl md:text-5xl font-black text-doce-preto mb-8">
    Menu de <span className="text-pink-500">Delícias</span>
  </h1>

  {/* O container agora gerencia o fluxo via Produtos.css */}
  <div className="actions-grid">
    
    <button 
      onClick={() => navigate('/pedidos')} 
      className="btn-pedidos shadow-lg"
    >
      <ShoppingBag size={20} /> 
      <span>Fazer Pedido</span>
    </button>

    {isAdmin && (
      <>
        <button 
          onClick={() => navigate('/relatorios')} 
          className="btn-relatorio"
        >
          <FileText size={18} /> 
          <span>Relatórios</span>
        </button>

        <button 
          onClick={() => navigate('/precificar')} 
          className="btn-admin"
        >
          <DollarSign size={18} /> 
          <span>Precificar</span>
        </button>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-primary"
        >
          <Plus size={18} /> 
          <span>Novo Produto</span>
        </button>
      </>
    )}
  </div>
</div>




	  {/*
    <div className="max-w-6xl mx-auto mb-10 text-center md:text-left">
  <h1 className="text-3xl md:text-5xl font-black text-doce-preto mb-8">
    Menu de <span className="text-pink-500">Delícias</span>
  </h1>
*/}
  {/* AQUI ESTÁ A CHAMADA DA CLASSE CSS */}
	  {/*<div className="actions-grid">
    
    <button 
      onClick={() => navigate('/pedidos')} 
      className="btn-pedidos w-full md:w-auto"
    >
      <ShoppingBag size={20} /> Fazer Pedido
    </button>

    {isAdmin && (
      <>
        <button 
          onClick={() => navigate('/relatorios')} 
          className="btn-relatorio w-full md:w-auto"
        >
          <FileText size={18} /> Relatórios
        </button>

        <button 
          onClick={() => navigate('/precificar')} 
          className="btn-admin w-full md:w-auto"
        >
          <DollarSign size={18} /> Precificar
        </button>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-primary w-full md:w-auto"
        >
          <Plus size={18} /> Novo
        </button>
      </>
    )}
  </div>
</div>*/}


      {/* LISTAGEM DE PRODUTOS PAGINADA */}
      {loading ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* AQUI ESTAVA O ERRO DE LÓGICA: use produtosExibidos */}
          {produtosExibidos.map(p => (
            <div key={p._id} className="card-produto animate-fade-in">
              <div className="badge-preco">R$ {parseFloat(p.preco).toFixed(2)}</div>
              <div className="mb-6">
                <span className="categoria-label">{p.tipoProduto}</span>
                <h3 className="nome-produto">{p.nome}</h3>
              </div>
              <div className="flex justify-between items-center border-t border-pink-50 pt-4">
                <span className="estoque-label">Estoque: <b>{p.qtd} un</b></span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="btn-icon-edit"><Edit size={18}/></button>
                    <button onClick={() => handleDelete(p._id)} className="btn-icon-delete"><Trash2 size={18}/></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTROLES DE PAGINAÇÃO */}
      {totalPaginas > 1 && (
        <div className="max-w-6xl mx-auto flex justify-center items-center gap-4 mt-12 pb-10">
          <button 
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(p => p - 1)}
            className="p-2 btn-cursorpointer rounded-full bg-white border border-pink-100 disabled:opacity-30 bg-pink-500 bg-pink-500:hover transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            {[...Array(totalPaginas)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPaginaAtual(i + 1)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${paginaAtual === i + 1 ? 'bg-pink-500  text-white shadow-md' : 'bg-white text-gray-400 border border-pink-50'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(p => p + 1)}
            className="p-2 btn-cursorpointer rounded-full bg-white border border-pink-100 disabled:opacity-30 bg-pink-500 bg-pink-500:hover transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* MODAL (FOI MOVIDO PARA DENTRO DA DIV PRINCIPAL E ANTES DO FIM DO RETURN) */}

{isModalOpen && (
  <div className="modal-overlay">
    {/* Container Branco do Form */}
    <div className="modal-content bg-white p-8 rounded-[40px] shadow-2xl border-b-8 border-pink-500 relative mx-auto">
      
      {/* Botão Fechar */}
      <button 
        onClick={fecharModal} 
        className="btn-cursorpointer absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
      >
        <X size={24} />
      </button>

      <h2 className="text-2xl font-black mb-6 text-doce-preto p-4">
        {editingId ? 'Editar Produto' : 'Cadastrar Produto'}
      </h2>

      <form onSubmit={handleSave} className="space-y-4">
        <input
          value={form.nome}
          placeholder="Nome da delícia"
          className="w-full p-4 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400 transition-all"
          onChange={e => setForm({...form, nome: e.target.value})}
          required
        />
        
        <input
          value={form.tipoProduto}
          placeholder="Categoria (ex: Bolos)"
          className="w-full p-4 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400 transition-all"
          onChange={e => setForm({...form, tipoProduto: e.target.value})}
          required
        />

        <div className="flex gap-4">
          <input
            value={form.preco}
            type="number" step="0.01" 
            placeholder="Preço"
            className="w-m-full p-4 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400 transition-all"
            onChange={e => setForm({...form, preco: e.target.value})}
            required
          />
          <input
            value={form.qtd}
            type="number" 
            placeholder="Estoque"
            className="w-m-full p-4 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400 transition-all"
            onChange={e => setForm({...form, qtd: e.target.value})}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn-cursorpointer btn-cad-prodt w-full bg-doce-preto text-white p-4 rounded-2xl font-bold hover:bg-pink-500 transition-all shadow-lg mt-4"
        >
          {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
        </button>
      </form>
    </div>
  </div>
)}



{/*
      {isModalOpen && (
        <div className="fixed inset-0 bg-doce-preto/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-md shadow-2xl border-b-8 border-pink-500 relative">
            <button onClick={fecharModal} className="btn-cursorpointer absolute top-6 right-6 text-gray-400 hover:text-black">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black mb-6 text-doce-preto p-4">
              {editingId ? 'Editar Doce' : 'Cadastrar Doce'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input 
                value={form.nome}
                placeholder="Nome da delícia" 
                className="w-full p-4 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400"
                onChange={e => setForm({...form, nome: e.target.value})}
                required
              />
              <input 
                value={form.tipoProduto}
                placeholder="Categoria (ex: Bolos)" 
                className="w-full p-4 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400"
                onChange={e => setForm({...form, tipoProduto: e.target.value})}
                required
              />
              <div className="flex gap-4">
                <input 
                  value={form.preco}
                  type="number" step="0.01" placeholder="Preço" 
                  className="w-m-full p-2 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400"
                  onChange={e => setForm({...form, preco: e.target.value})}
                  required
                />
                <input 
                  value={form.qtd}
                  type="number" placeholder="Estoque" 
                  className="w-m-full p-2 bg-gray-50 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-400"
                  onChange={e => setForm({...form, qtd: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn-cursorpointer w-full bg-doce-preto text-white p-4 rounded-2xl font-bold hover:bg-pink-500 transition-all shadow-lg mt-4">
                {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}*/}
    </div>
  );
}
