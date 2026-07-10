import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, LogIn } from 'lucide-react';

const LoginForm = () => {
  // Estados para o formulário
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Estados de controle da UI
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Atualiza os campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Envio dos dados para a rota backend de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // Substitua pela URL completa do seu servidor se necessário (ex: http://localhost:5000/login)
      const response = await fetch('https://cidadeemdia.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Captura o status 400 (Email ou senha inválidos) ou 500
        throw new Error(data.message || 'Erro ao realizar login');
      }

      // Sucesso no Login
      setMessage({ type: 'success', text: data.message || 'Login realizado com sucesso!' });
      
      // Salva o token JWT retornado pela sua controladora no localStorage
      if (data.token) {
        localStorage.setItem('@Cidademdia:token', data.token);
      }

      // Salva o ID do usuário retornado do backend para vincular às ocorrências da Dashboard
      if (data.id) {
        localStorage.setItem('@Cidademdia:userId', data.id);
      }

      // Redireciona o usuário dinamicamente com base na role após 1.2 segundos para que ele veja a mensagem de sucesso
      setTimeout(() => {
        if (data.role === 'master') {
          window.location.href = `/master-dashboard?id=${data.id}`;
        } else if (data.role === 'subs') {
          window.location.href = `/subs-dashboard?id=${data.id}`;
        } else {
          // Padrão ou tipo 'user'
          window.location.href = `/dashboard?id=${data.id}`;
        }
      }, 1200);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header idêntico ao do cadastro para unidade visual */}
        <div className="relative bg-gradient-to-r from-green-700 via-green-600 to-blue-700 p-8 text-white text-center">
          {/* Detalhe em Amarelo */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
          
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Cidade<span className="text-yellow-400">em</span>dia
          </h1>
          <p className="text-blue-100 text-sm font-light">
            Acesse sua conta para exercer a sua cidadania
          </p>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {/* Feedback de Erro ou Sucesso */}
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fadeIn ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Campo: Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="seu-email@exemplo.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          {/* Campo: Senha */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Senha</label>
              <a href="#esqueci-senha" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-800 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar no Cidademdia</span>
              </>
            )}
          </button>
        </form>

        {/* Link alternativo para Cadastro */}
        <div className="px-8 pb-6 text-center text-sm text-slate-500">
          Não tem uma conta?{' '}
          <a href="#cadastro" className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors">
            Cadastre-se aqui
          </a>
        </div>
        
        {/* Rodapé institucional */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          Orgulho em cuidar do nosso espaço. 🇧🇷
        </div>
      </div>
    </div>
  );
};

export default LoginForm;