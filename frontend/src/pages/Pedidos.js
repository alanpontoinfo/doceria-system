import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { ShoppingCart, Trash2, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText, ArrowLeft } from 'lucide-react';
import './Pedidos.css';

export default function Pedidos() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [meusPedidos, setMeusPedidos] = useState([]);
  
  // Estados de Paginação
  const [pagProd, setPagProd] = useState(1);
  const [pagHist, setPagHist] = useState(1);
  
  const [loading, setLoading] = useState(true);
  
  const itensPorPaginaProd = 4;
  const itensPorPaginaHist = 3; // Menos itens por página no histórico para não alongar demais
  
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [resProds, resPedidos] = await Promise.all([
        api.get('/produtos'),
        api.get('/pedido')
      ]);
      setProdutos(resProds.data);
      setMeusPedidos(resPedidos.data.filter(p => p.usuario_id === userId));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Lógica Paginação Produtos
  const produtosExibidos = produtos.slice((pagProd - 1) * itensPorPaginaProd, pagProd * itensPorPaginaProd);
  const totalPaginasProd = Math.ceil(produtos.length / itensPorPaginaProd);

  // Lógica Paginação Histórico
  const pedidosExibidos = meusPedidos.slice((pagHist - 1) * itensPorPaginaHist, pagHist * itensPorPaginaHist);
  const totalPaginasHist = Math.ceil(meusPedidos.length / itensPorPaginaHist);

  const adicionarAoCarrinho = (prod) => {
    const existe = carrinho.find(item => item.id_produto === prod._id);
    if (existe) {
      setCarrinho(carrinho.map(item => 
        item.id_produto === prod._id ? { ...item, qtd: item.qtd + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { id_produto: prod._id, nome: prod.nome, preco: prod.preco, qtd: 1 }]);
    }
  };

  /*const finalizarPedido = async () => {
    if (carrinho.length === 0) {
      alert("⚠️ Carrinho vazio! Escolha uma delícia primeiro.");
      return;
    }
    try {
      await api.post('/pedido', { itens: carrinho });
      alert("🍭 Pedido enviado para a cozinha!");
      setCarrinho([]);
      carregarDados();
      setPagHist(1); // Volta para a primeira página do histórico para ver o novo pedido
    } catch (err) {
      alert("Erro ao processar pedido");
    }
  };*/

  const finalizarPedido = async () => {
  if (carrinho.length === 0) {
    alert("⚠️ Carrinho vazio! Escolha uma delícia primeiro.");
    return;
  }

  // --- VALIDAÇÃO DE ESTOQUE ---
  for (const item of carrinho) {
    // Procura o produto original na lista 'produtos' do seu estado
    const pOriginal = produtos.find(p => p.id === item.id_produto);

    // Se o produto não for encontrado ou a quantidade (qtd) for zero ou menos
    if (!pOriginal || pOriginal.qtd <= 0) {
      alert(`⚠️ Este produto acabou: ${item.nome}`);
      return; // Interrompe a função e não envia o pedido
    }

    // Opcional: Verifica se o pedido é maior que o estoque disponível
    if (item.qtd > pOriginal.qtd) {
       alert(`⚠️ Quantidade insuficiente para "${item.nome}". \n\nVocê pediu ${item.qtd}, mas temos apenas ${pOriginal.qtd} unidades disponíveis.`);
      return;
    }
  }

  // --- PROCESSO DE ENVIO ---

  // Se passou em todas as validações, envia para a API
  try {
    await api.post('/pedido', { itens: carrinho });
    alert("🍭 Pedido enviado com sucesso!");
    setCarrinho([]);
    carregarDados(); // Recarrega os produtos para atualizar o estoque visualmente
    setPagHist(1);
  } catch (err) {
    alert("Erro ao processar pedido. Verifique sua conexão.");
  }
};

  const calcularTotal = () => carrinho.reduce((sum, i) => sum + i.preco * i.qtd, 0);

  const podeCancelar = (dataPedido) => {
    const diffEmHoras = Math.abs(new Date() - new Date(dataPedido)) / (1000 * 60 * 60);
    return diffEmHoras <= 24;
  };


  const handleDownloadPrecos = async () => {
    try {
      const res = await api.get('/relatorio/meus-pedidos',{ headers: { 'user-id': userId }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historico.pdf');
      link.click();
    } catch (err) {
      alert("Erro ao gerar PDF.");
    }
  };


  return (
    <div className="min-h-screen bg-sweet-gradient p-4 md:p-8">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <button onClick={() => navigate('/produtos')} className="btn-voltar">
          <ArrowLeft size={20} /> <span>Menu</span>
        </button>
        <h1 className="text-3xl md:text-5xl font-black text-doce-preto text-center">
          Área de <span className="text-pink-500 italic">Pedidos</span>
        </h1>
        <div className="w-24 md:w-32"></div> {/* Spacer para centralizar o h1 */}
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* BLOCO SUPERIOR: VITRINE + CARRINHO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* VITRINE (2 COLUNAS NO DESKTOP) */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-doce-preto flex items-center gap-2">
               Nossas Delícias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {produtosExibidos.map(p => (
                <div key={p._id} className="card-vitrine">
                  <div className="info-prod">
                    <span className="cat-tag">{p.tipoProduto}</span>
                    <h3>{p.nome}</h3>
                    <p className="preco-tag">R$ {(Number(p.preco) || 0).toFixed(2)}</p>
                  </div>
                  <button onClick={() => adicionarAoCarrinho(p)} className="btn-add">
                    +
                  </button>
                </div>
              ))}
            </div>

            {/* Paginação Vitrine */}
            {totalPaginasProd > 1 && (
              <div className="flex justify-center gap-4 mt-8">
                <button disabled={pagProd === 1} onClick={() => setPagProd(p => p - 1)} className="btn-pag">
                  <ChevronLeft />
                </button>
                <span className="font-bold flex items-center">{pagProd} / {totalPaginasProd}</span>
                <button disabled={pagProd === totalPaginasProd} onClick={() => setPagProd(p => p + 1)} className="btn-pag">
                  <ChevronRight />
                </button>
              </div>
            )}
          </div>

          {/* CARRINHO (1 COLUNA NO DESKTOP) */}
          <div className="carrinho-container">
            <div className="carrinho-header">
              <ShoppingCart size={24} />
              <h2>Meu Carrinho</h2>
            </div>
            <div className="carrinho-corpo">
              {carrinho.length === 0 ? (
                <p className="text-white/50 text-center text-sm mt-10">Vazio...</p>
              ) : (
                carrinho.map(item => (
                  <div key={item.id_produto} className="carrinho-item">
                    <div>
                      <p className="font-bold text-sm">{item.nome}</p>
                      <p className="text-pink-300 text-xs">{item.qtd}x R$ {item.preco}</p>
                    </div>
                    <button onClick={() => setCarrinho(carrinho.filter(i => i.id_produto !== item.id_produto))}>
                      <Trash2 size={14} className = "btn-trash" />
                    </button>
                  </div>
                ))
              )}
            </div>
	     <div className="carrinho-rodape">
              <div className="carrinho-total">
                <span>TOTAL:</span>
                <span className="valor-total">R$ {calcularTotal().toFixed(2)}</span>
              </div>
              <button onClick={finalizarPedido} className="btn-finalizar">Finalizar</button>
            </div>
          </div>
        </div>

        {/* BLOCO INFERIOR: HISTÓRICO (LARGURA TOTAL) */}
        <section className="bg-white/40 p-8 rounded-[40px] border-2 border-dashed border-pink-200 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-doce-preto flex items-center gap-2">
              <Clock className="text-pink-500"/> Pedidos Anteriores
            </h2>
	  {/*<button onClick={  handleDownloadPrecos } className="btn-pdf-history">
              <FileText size={18} /> Exportar Histórico
            </button>*/}

	   <button onClick={handleDownloadPrecos} className="btn-historicopdf btn-secondary flex-1 md:flex-none">
            <FileText size={18} /> <span className="hidden md:inline">Baixar Histórico PDF</span>
          </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pedidosExibidos.map(p => (
              <div key={p._id} className="item-historico-card">
                <div className="topo-hist">
                  <span className="data-hist">{ new Date(p.data).toLocaleDateString()}</span>
                  <span className="total-hist">R$ {p.total.toFixed(2)}</span>
                </div>
                <div className="lista-itens-scroll">
                  {p.itens && p.itens.map((item, idx) => (
                    <div key={idx} className="tag-item-pedido">
                      {item.qtd}x {item.nome}
                    </div>
                  ))}
                </div>
                <div className="rodape-hist">
                  {podeCancelar(p.data) ? (
                    <button onClick={() => api.delete(`/pedido/${p._id}`).then(carregarDados)} className="btn-cancelar">
                      Cancelar Pedido
                    </button>
                  ) : (
                    <span className="status-finalizado"><CheckCircle size={14}/> Finalizado</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginação Histórico */}
          {totalPaginasHist > 1 && (
            <div className="flex justify-center gap-4 mt-10">
              <button disabled={pagHist === 1} onClick={() => setPagHist(p => p - 1)} className="btn-pag">
                <ChevronLeft />
              </button>
              <div className="flex gap-2">
                {[...Array(totalPaginasHist)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setPagHist(i + 1)}
                    className={`pag-num ${pagHist === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button disabled={pagHist === totalPaginasHist} onClick={() => setPagHist(p => p + 1)} className="btn-pag">
                <ChevronRight />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}















