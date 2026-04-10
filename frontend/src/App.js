import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Produtos from './pages/Produtos';
import Pedidos from './pages/Pedidos';
import Relatorios from './pages/Relatorios';
import Preco from './pages/Preco';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
<Route path="/registro" element={<Registro />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/precificacao" element={<Preco />} />
      </Routes>
    </Router>
  );
}

export default App;