import React, { useState } from 'react';
import api from '../api/api';
import { User, Mail, Lock, Phone, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Registro.css';

export default function Registro() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tel: '',
    senha: '',
    tipo: 'cliente' // Padrão do sistema
  });
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.senha) {
      return alert("Por favor, preencha os campos obrigatórios.");
    }

    setCarregando(true);
    try {
      await api.post('/registro', formData);
      alert("Conta criada com sucesso! Agora faça seu login.");
      navigate('/');
    } catch (err) {
      alert("Erro ao registrar: " + (err.response?.data?.error || "Erro de conexão"));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="reg-container">
      {/* SEÇÃO LATERAL: PERSUASIVA */}
      <div className="reg-info hidden lg:flex">
        <div className="reg-info-content">
          <button onClick={() => navigate('/')} className="btn-voltar">
            <ArrowLeft size={20} /> Voltar ao Login
          </button>
          
          <div className="mt-12">
            <span className="badge-novo">Junte-se a nós</span>
            <h2 className="text-5xl font-black text-white mt-4 leading-tight">
              Crie sua conta na <br/>
              <span className="text-pink-400">Sabor e Arte.</span>
            </h2>
            
            <ul className="beneficios-list">
              <li><CheckCircle size={20} className="text-pink-400" /> Faça pedidos em segundos</li>
              <li><CheckCircle size={20} className="text-pink-400" /> Acompanhe seu histórico financeiro</li>
              <li><CheckCircle size={20} className="text-pink-400" /> Acesse relatórios exclusivos</li>
            </ul>
          </div>

          <div className="dev-signature">
            Desenvolvido por <a href="https://alanpontoinfo.netlify.app" target="_blank" rel="noreferrer">alanpontoinfo</a>
          </div>
        </div>
      </div>

      {/* SEÇÃO DO FORMULÁRIO */}
      <div className="reg-form-wrapper">
        <form className="reg-card animate-fade-in" onSubmit={handleRegistro}>
          <div className="reg-header">
            <div className="logo-mini">SA</div>
            <h1>Nova Conta</h1>
            <p>Preencha os dados para começar sua jornada doce.</p>
          </div>

          <div className="space-y-4">
            <div className="input-field">
              <label>Nome Completo *</label>
              <div className="input-icon-wrapper">
                <User size={18} className="icon" />
                <input 
                  type="text" 
                  placeholder="Ex: Alan Silva"
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="input-field">
              <label>E-mail Corporativo *</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="icon" />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-field">
                <label>Telefone/WhatsApp</label>
                <div className="input-icon-wrapper">
                  <Phone size={18} className="icon" />
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    onChange={e => setFormData({...formData, tel: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-field">
                <label>Senha *</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    onChange={e => setFormData({...formData, senha: e.target.value})}
                    required 
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-registrar" disabled={carregando}>
              {carregando ? 'Criando sua conta...' : 'Finalizar Cadastro'}
              <Sparkles size={20} className="ml-2" />
            </button>
          </div>

          <p className="footer-link">
            Já tem uma conta? <span onClick={() => navigate('/')}>Fazer Login</span>
          </p>
        </form>
      </div>
    </div>
  );
}
