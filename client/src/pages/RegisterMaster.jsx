import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importação adicionada
import { User, Mail, Lock, FileText, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck, MapPin, Globe, Network, Image as ImageIcon } from 'lucide-react';

const RegisterMasterForm = () => {
  const navigate = useNavigate(); // Instanciando o hook de navegação
  
  const [formData, setFormData] = useState({
    tittle: '',
    CPForCNPJ: '',
    email: '',
    imageProfile: '',
    state: '',
    city: '',
    managedArea: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const maskDocument = (value) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
    } else {
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .substring(0, 18);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageProfile: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'CPForCNPJ') {
      setFormData(prev => ({ ...prev, CPForCNPJ: maskDocument(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      const response = await fetch('https://cidadeemdia.onrender.com/register-master', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tittle: formData.tittle,
          CPForCNPJ: formData.CPForCNPJ,
          email: formData.email,
          imageProfile: formData.imageProfile,
          state: formData.state,
          city: formData.city,
          managedArea: formData.managedArea,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar master');
      }

      setMessage({ type: 'success', text: data.message });
      setFormData({ 
        tittle: '', 
        CPForCNPJ: '', 
        email: '', 
        imageProfile: '', 
        state: '',
        city: '',
        managedArea: '',
        password: '', 
        confirmPassword: '' 
      });

      // Redirecionamento automático após 2 segundos
      setTimeout(() => {
        navigate('/login');
        // Caso não utilize react-router-dom, descomente a linha abaixo e remova a de cima:
        // window.location.href = '/login';
      }, 2000);

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
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">Conta Nível Master</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Cidade<span className="text-yellow-400">em</span>dia
          </h1>
          <p className="text-blue-100 text-sm font-light">
            Cadastre uma conta de nível master para gerenciamento do sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Título da Conta</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="tittle"
                required
                value={formData.tittle}
                onChange={handleChange}
                placeholder="Nome ou Título de Identificação"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">CPF ou CNPJ</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="CPForCNPJ"
                  required
                  value={formData.CPForCNPJ}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail Administrativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="master@exemplo.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Novos Campos: Estado e Cidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo ou SP"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cidade</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ex: Campinas"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Novo Campo: Área Gerenciada */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Área Gerenciada</label>
            <div className="relative">
              <Network className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="managedArea"
                required
                value={formData.managedArea}
                onChange={handleChange}
                placeholder="Ex: Secretaria de Obras, Centro Urbano"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Imagem de Perfil</label>
            <div className="relative flex items-center gap-4">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-sm"
                />
              </div>
              {formData.imageProfile && (
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                  <img src={formData.imageProfile} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
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
                <span>Cadastrando Master...</span>
              </>
            ) : (
              <span>Cadastrar Conta Master</span>
            )}
          </button>
        </form>

        <div className="px-8 pb-6 text-center text-sm text-slate-500">
          Já possui uma conta master?{' '}
          <a href="/login" className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors">
            Faça login
          </a>
        </div>
        
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          Orgulho em cuidar do nosso espaço. 🇧🇷
        </div>
      </div>
    </div>
  );
};

export default RegisterMasterForm;