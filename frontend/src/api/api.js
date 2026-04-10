import axios from 'axios';

const api = axios.create({
  // Se estiver em produção, usa a URL relativa /api, senão usa o localhost
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000'
});

// Interceptor para injetar o ID do usuário em cada requisição
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['user-id'] = userId;
  }
  return config;
});

export default api;