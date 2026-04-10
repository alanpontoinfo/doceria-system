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
<Route path="/api/registro" element={<Registro />} />
        <Route path="/api/produtos" element={<Produtos />} />
        <Route path="/api/pedidos" element={<Pedidos />} />
        <Route path="/api/relatorios" element={<Relatorios />} />
        <Route path="/api/precificar" element={<Preco />} />
      </Routes>
    </Router>
  );
}

export default App;
