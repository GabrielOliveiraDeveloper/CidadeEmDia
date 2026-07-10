import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Upload, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tel: '',
    imageProfile: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 2MB.' });
      return;
    }

    const reader = new FileReader();
    
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageProfile: reader.result }));
      setMessage({ type: '', text: '' });
    };

    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Erro ao processar o arquivo de imagem.' });
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageProfile: '' }));
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          tel: formData.tel,
          imageProfile: formData.imageProfile,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar usuário');
      }

      setMessage({ type: 'success', text: data.message });
      
      setFormData({ name: '', email: '', tel: '', imageProfile: '', password: '', confirmPassword: '' });
      const fileInput = document.getElementById('avatar-upload');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-2xl">
        
        <div className="relative bg-gradient-to-r from-green-700 via-green-600 to-blue-700 p-8 text-white text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Cidade<span className="text-yellow-400">em</span>dia
          </h1>
          <p className="text-blue-100 text-sm font-light">
            Crie sua conta e faça a diferença na sua comunidade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-3 pb-2 border-b border-slate-100">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block text-center w-full">
              Foto de Perfil
            </label>
            
            <div className="relative group">
              {formData.imageProfile ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-green-600 shadow-md">
                  <img 
                    src={formData.imageProfile} 
                    alt="Preview do perfil" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white rounded-full"
                    title="Remover imagem"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="avatar-upload" 
                  className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 shadow-inner group"
                >
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[10px] font-medium text-slate-500 mt-1 group-hover:text-blue-600">Enviar Foto</span>
                </label>
              )}
            </div>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="João Silva"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="joao@exemplo.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  name="tel"
                  required
                  value={formData.tel}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Senha</label>
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-800 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando Cadastro...</span>
              </>
            ) : (
              <span>Cadastrar no Cidademdia</span>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          Orgulho em cuidar do nosso espaço. 🇧🇷
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;