import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Produtos from './pages/Produtos';
import Pedidos from './pages/Pedidos';
import Relatorios from './pages/Relatorios';
import Preco from './pages/Preco';

function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Verifica se existe um usuário no storage ao carregar o app
    const usuarioId = localStorage.getItem('userId');
    if (usuarioId) {
      setEstaLogado(true);
    }
    setCarregando(false);
  }, []);

  if (carregando) return null; // Evita piscar a tela de login antes de checar o storage

  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login setEstaLogado={setEstaLogado} />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rotas que dependem de estar logado */}
        <Route 
          path="/produtos" 
          element={estaLogado ? <Produtos /> : <Navigate to="/" />} 
        />
        <Route 
          path="/pedidos" 
          element={estaLogado ? <Pedidos /> : <Navigate to="/" />} 
        />
        <Route 
          path="/relatorios" 
          element={estaLogado ? <Relatorios /> : <Navigate to="/" />} 
        />
        <Route 
          path="/precificar" 
          element={estaLogado ? <Preco /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
