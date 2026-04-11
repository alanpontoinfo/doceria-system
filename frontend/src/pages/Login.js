import React, { useState } from 'react';
import api from '../api/api';
import { Mail, Lock, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';


export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();


  const handleLogin = async () => {
    if (!email || !senha) return alert("Preencha todos os campos!");
    setCarregando(true);
    try {
      const res = await api.post('/login', { email, senha });
      localStorage.setItem('userId', res.data.id);
      localStorage.setItem('userTipo', res.data.tipo);
      localStorage.setItem('userName', res.data.nome);
	    {/*window.location.href = '/produtos';*/}
      navigate('/produtos');

    } catch (err) {
      alert("Erro ao logar: " + (err.response?.data?.error || "Erro de conexão"));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      
      {/* LADO ESQUERDO: BRANDING (Visível apenas em Desktop/Laptops) */}
      <div className="login-branding">
        <div className="branding-content">
          <span className="badge-premium">Sistema de Gestão</span>
          <h1 className="typing-animation">
            Sabor e Arte: <br/>
            <span className="text-pink-400">Seu lucro em foco.</span>
          </h1>
          <p className="branding-description">
            A ferramenta definitiva para docerias que buscam profissionalismo e controle analítico.
          </p>
          <div className="stat-preview">
            <Sparkles className="text-pink-400" size={18} />
            <span>Painel otimizado para alta performance</span>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO (Responsivo) */}
      <div className="login-form-wrapper">
        <div className="login-card animate-slide-up">
          
          {/* Logo que se adapta à tela */}
          <div className="logo-container">
             <div className="logo-icon">SA</div>
             <div className="logo-text">
                <span className="logo-main">Sabor e Arte</span>
                <span className="logo-sub">Doceria Business</span>
             </div>
          </div>

          <div className="form-header">
            <h3>Acessar Painel</h3>
            <p>Gerencie sua produção de qualquer lugar.</p>
          </div>

          <div className="form-inputs">
            <div className="input-group">
              <label>E-mail</label>
              <div className="input-with-icon">
                <Mail size={18} className="icon" />
                <input 
                  type="email" 
                  placeholder="exemplo@sabor.com" 
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Senha</label>
              <div className="input-with-icon">
                <Lock size={18} className="icon" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  onChange={e => setSenha(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleLogin}
              disabled={carregando}
              className={`btn-entrar ${carregando ? 'loading' : ''}`}
            >
              {carregando ? 'Entrando...' : 'Entrar no Sistema'}
              <ArrowRight size={20} className="arrow-icon" />
            </button>
          </div>

          <div className="login-footer">
            <a 
              href="https://alanpontoinfo.netlify.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="dev-credit"
            >
              Desenvolvido por <strong>alanpontoinfo</strong> <ExternalLink size={15} />
            </a>
	    <p className="footer-link">
            Já tem uma conta? <span onClick={() => navigate('/registro')}>Criar Registro</span>
          </p>

          </div>
        </div>
      </div>
    </div>
  );
}
