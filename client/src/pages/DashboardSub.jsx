import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Mail, 
  Lock, 
  Upload, 
  X, 
  LogOut, 
  Shield, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText,
  MapPin,
  Bell,
  Compass
} from 'lucide-react';

const DashboardSub = () => {
  // Captura dinamicamente o ID vindo do parâmetro da URL (?id=...) ou recorre ao localStorage caso não encontre
  const getSubId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if (idFromUrl) return idFromUrl;
    
    return localStorage.getItem('@Cidademdia:userId') || 'Sub';
  };

  const subId = getSubId();

  // Abas de visualização: 'subs' (Gerenciar Sub-contas) ou 'protocols' (Visualizar Protocolos das Notificações)
  const [activeTab, setActiveTab] = useState('subs');

  // Estados de dados
  const [subs, setSubs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // Estados para notificações e detalhes de posts
  const [notifications, setNotifications] = useState([]);
  const [postsDetails, setPostsDetails] = useState({}); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [protocolsLoading, setProtocolsLoading] = useState(false);
  
  // Estado para controlar qual post está ativo visualmente em detalhes (modal com mapa)
  const [selectedPost, setSelectedPost] = useState(null);

  // Referências para o Mapa Leaflet de Exibição
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Estado do formulário de sub-conta
  const [formData, setFormData] = useState({
    tittle: '',
    email: '',
    password: '',
    imageProfile: '',
    managedArea: ''
  });

  // Estados de controle da UI
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Injeta os scripts necessários do Leaflet dinamicamente para exibição de mapas
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Inicializa ou atualiza o mapa sempre que o modal de um post selecionado abrir
  useEffect(() => {
    if (selectedPost && mapContainerRef.current && window.L) {
      // Pequeno timeout para garantir que o contêiner do modal já renderizou no DOM
      const timer = setTimeout(() => {
        initDisplayMap();
      }, 100);
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedPost]);

  // Renderiza o mapa apenas para exibição e leitura das coordenadas
  const initDisplayMap = () => {
    if (!window.L || !mapContainerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const L = window.L;
    
    // Recupera as coordenadas do post ou define um padrão (São Paulo) caso venha nulo
    const lat = selectedPost.coordinates?.lat || -23.55052;
    const lng = selectedPost.coordinates?.lng || -46.633308;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: true,
      scrollWheelZoom: false
    }).setView([lat, lng], 15);
    
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    markerRef.current = L.marker([lat, lng], { icon: defaultIcon })
      .addTo(map)
      .bindPopup(`<b>Protocolo:</b> ${selectedPost.protocol || 'Sem ref.'}`)
      .openPopup();
  };

  // Buscar todas as sub-contas filtradas pelo ID do Sub logado
  const fetchSubs = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`http://localhost:3000/subs/master/${subId}`);
      const data = await response.json();
      if (response.ok) {
        setSubs(data);
      } else {
        throw new Error(data.message || 'Erro ao buscar sub-contas');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchLoading(false);
    }
  };

  // Buscar notificações direcionadas ao usuário logado
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:3000/notifications/${subId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        
        // Carrega os detalhes individuais em segundo plano
        data.forEach(notification => {
          if (notification.idPost) {
            fetchPostDetails(notification.idPost);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  // Carrega a coletânea de posts baseada em todas as notificações existentes
  const fetchAllNotificationPosts = async () => {
    setProtocolsLoading(true);
    try {
      await fetchNotifications();
    } catch (e) {
      console.error(e);
    } finally {
      setProtocolsLoading(false);
    }
  };

  // Buscar os detalhes específicos de um Post usando seu ID
  const fetchPostDetails = async (idPost) => {
    if (postsDetails[idPost]) return; 

    try {
      const response = await fetch(`http://localhost:3000/posts/${idPost}`);
      if (response.ok) {
        const postData = await response.json();
        setPostsDetails(prev => ({ ...prev, [idPost]: postData }));
      }
    } catch (error) {
      console.error(`Erro ao buscar post ${idPost}:`, error);
    }
  };

  useEffect(() => {
    if (subId && subId !== 'Sub') {
      fetchSubs();
      fetchNotifications();
      
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setFetchLoading(false);
    }
  }, [subId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione apenas imagens (PNG, JPG, JPEG).' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageProfile: reader.result }));
      setMessage({ type: '', text: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageProfile: '' }));
    const fileInput = document.getElementById('sub-avatar-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const isEditing = editingId !== null;
    const url = isEditing 
      ? `http://localhost:3000/subs/${editingId}` 
      : 'http://localhost:3000/subs';
    
    const method = isEditing ? 'PUT' : 'POST';

    const bodyData = {
      tittle: formData.tittle,
      email: formData.email,
      password: formData.password,
      imageProfile: formData.imageProfile,
      managedArea: formData.managedArea,
      ...(!isEditing && { idMaster: subId })
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao processar requisição');

      setMessage({ 
        type: 'success', 
        text: isEditing ? 'Sub-conta atualizada com sucesso!' : 'Sub-conta criada com sucesso!' 
      });

      setFormData({ tittle: '', email: '', password: '', imageProfile: '', managedArea: '' });
      setEditingId(null);
      handleRemoveImage();
      fetchSubs();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (sub) => {
    setEditingId(sub._id);
    setFormData({
      tittle: sub.tittle,
      email: sub.email,
      password: '', 
      imageProfile: sub.imageProfile || '',
      managedArea: sub.managedArea || ''
    });
    setActiveTab('subs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ tittle: '', email: '', password: '', imageProfile: '', managedArea: '' });
    handleRemoveImage();
  };

  const handleDeleteSub = async (id) => {
    if (!window.confirm('Tem certeza absoluta que deseja remover esta sub-conta gerenciada?')) return;

    try {
      const response = await fetch(`http://localhost:3000/subs/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao deletar sub-conta');
      setSubs(prev => prev.filter(sub => sub._id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@Cidademdia:token');
    localStorage.removeItem('@Cidademdia:userId');
    window.location.href = '/login';
  };

  const handleNotificationClick = (idPost) => {
    const post = postsDetails[idPost];
    if (post) {
      setSelectedPost(post);
      setShowNotifications(false);
    } else {
      alert('Os dados desta ocorrência ainda estão sendo carregados do servidor.');
    }
  };

  const handleOpenProtocolsTab = () => {
    setActiveTab('protocols');
    fetchAllNotificationPosts();
  };

  return (
    <div className="min-h-screen bg-slate-50 antialiased font-sans">
      
      {/* Header Principal */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white shadow-md relative z-50">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Cidade<span className="text-yellow-400">em</span>dia
              </h1>
              <p className="text-xs text-yellow-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> Painel de Controle Sub
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Menu Dropdown de Notificações */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors relative"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-800 py-2 max-h-96 overflow-y-auto z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-700">Notificações</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                      {notifications.length} nova(s)
                    </span>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      Nenhuma nova notificação por aqui.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notification) => {
                        const post = postsDetails[notification.idPost];
                        return (
                          <div 
                            key={notification._id} 
                            onClick={() => handleNotificationClick(notification.idPost)}
                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors text-left space-y-1"
                          >
                            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                              Nova Ocorrência
                            </p>
                            <p className="text-xs text-slate-600 font-medium line-clamp-2">
                              {post ? `Protocolo ${post.protocol || 'S/N'}: ${post.description}` : 'Buscando detalhes do registro...'}
                            </p>
                            <span className="text-[10px] font-bold text-green-600 block">
                              Clique aqui para ver os detalhes com mapa →
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <span className="text-sm font-medium text-blue-50 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              Fiscal ID: <span className="font-mono text-yellow-300">{subId && subId !== 'Sub' ? subId.slice(-6) : 'Sub'}</span>
            </span>

            <button 
              onClick={handleLogout}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Sair do painel sub"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Detalhes da Ocorrência COM MAPA INTEGRADO */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
            
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold bg-blue-500/30 text-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1">
                  Painel de Auditoria Visual
                </span>
                <h3 className="font-bold text-lg flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-yellow-400" /> Protocolo: {selectedPost.protocol || 'Sem Código'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* MAPA INTEGRADO PARA APENAS EXIBIÇÃO */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Localização Georreferenciada (Apenas Leitura)
                </span>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-44 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden z-10 shadow-inner"
                />
              </div>

              {/* Fotos da Ocorrência */}
              {selectedPost.photos && (Array.isArray(selectedPost.photos) ? selectedPost.photos.length > 0 : typeof selectedPost.photos === 'string') && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Anexos de Evidências</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.isArray(selectedPost.photos) ? (
                      selectedPost.photos.map((photo, index) => (
                        <div key={index} className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={photo} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 col-span-2">
                        <img src={selectedPost.photos} alt="Evidência única" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Relato Completo</span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedPost.description}</p>
              </div>

              {/* Grid de Informações de Endereço */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade / UF</span>
                  <p className="text-xs font-bold text-slate-700 truncate">{selectedPost.city || selectedPost.City || 'Não informada'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CEP</span>
                  <p className="text-xs font-mono font-bold text-slate-700">{selectedPost.CEP || selectedPost.cep || 'Sem CEP'}</p>
                </div>

                {selectedPost.managedArea && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Área Administrativa Destinada</span>
                      <p className="text-xs font-bold text-slate-700">{selectedPost.managedArea}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Conteúdo Central em Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário Lateral de Cadastro/Edição de Sub-contas */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className={`w-5 h-5 ${editingId ? 'text-amber-500' : 'text-blue-600'}`} />
                <h2 className="font-bold text-slate-800 text-lg">
                  {editingId ? 'Editar Sub-Conta' : 'Nova Sub-Conta'}
                </h2>
              </div>
              {editingId && (
                <button 
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Cancelar
                </button>
              )}
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSub} className="space-y-4">
              {/* Avatar upload */}
              <div className="flex flex-col items-center justify-center space-y-2 pb-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block text-center w-full">Foto de Perfil</label>
                <div className="relative group">
                  {formData.imageProfile ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-blue-600 shadow-sm">
                      <img src={formData.imageProfile} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={handleRemoveImage} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white rounded-full transition-opacity">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="sub-avatar-upload" className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] font-medium text-slate-500 mt-1">Upload</span>
                    </label>
                  )}
                </div>
                <input id="sub-avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Título */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Título / Nome</label>
                <input type="text" name="tittle" required value={formData.tittle} onChange={handleInputChange} placeholder="Ex: Fiscal Cleber - Zona Norte" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>

              {/* Área Gerenciada */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Área Gerenciada / Setor</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" name="managedArea" required value={formData.managedArea} onChange={handleInputChange} placeholder="Ex: Secretaria de Obras, Zona Sul" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="subconta@cidademdia.com" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{editingId ? 'Nova Senha (Opcional)' : 'Senha do Sub'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="password" name="password" required={!editingId} value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>

              <button type="submit" disabled={loading} className={`w-full text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 bg-gradient-to-r ${editingId ? 'from-amber-600 to-yellow-500' : 'from-blue-700 to-blue-600'}`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? 'Salvar Alterações' : 'Cadastrar Sub-Conta'}
              </button>
            </form>
          </div>
        </section>

        {/* Coluna de Exibição de Listagem Geral com Abas Dinâmicas */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Card topo informativo */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
            <h2 className="text-xl font-bold tracking-tight">Painel Operacional Sub 👋</h2>
            <p className="text-xs text-slate-300 font-light mt-1">Alternar modos operacionais abaixo para visualizar dados brutos da prefeitura ou gerenciar chaves de acesso vinculadas.</p>
          </div>

          {/* Botões de Ação Dinâmicos (Utilitários) - Planos Removido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={handleOpenProtocolsTab}
              className={`p-4 rounded-xl border shadow-sm flex items-center gap-3 text-left transition-all ${activeTab === 'protocols' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200/60 hover:bg-slate-50'}`}
            >
              <div className="p-2.5 bg-blue-600 text-white rounded-lg"><FileText className="w-5 h-5" /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Visualizar Protocolos</h4>
                <p className="text-[10px] text-slate-400 font-medium">Histórico de Ocorrências</p>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab('subs')}
              className={`p-4 rounded-xl border shadow-sm flex items-center gap-3 text-left transition-all ${activeTab === 'subs' ? 'bg-green-50 border-green-300 ring-2 ring-green-500/20' : 'bg-white border-slate-200/60 hover:bg-slate-50'}`}
            >
              <div className="p-2.5 bg-green-700 text-white rounded-lg"><Users className="w-5 h-5" /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Gerenciar Subs</h4>
                <p className="text-[10px] text-slate-400 font-medium">Contas Vinculadas</p>
              </div>
            </button>
          </div>

          {/* CONTEÚDO DA ABA 1: LISTAGEM DE OCORRÊNCIAS/NOTIFICAÇÕES COLETADAS */}
          {activeTab === 'protocols' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-700" />
                  <h3 className="font-bold text-slate-800 text-lg">Histórico Coletado de Ocorrências</h3>
                </div>
                <button onClick={fetchAllNotificationPosts} disabled={protocolsLoading} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                  <Loader2 className={`w-3.5 h-3.5 ${protocolsLoading ? 'animate-spin' : ''}`} /> Atualizar Lista
                </button>
              </div>

              {protocolsLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-500">Varrendo chaves e links de notificações registradas...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                  <p className="text-slate-400 font-medium text-sm">Nenhum protocolo ou link de notificação emitido para este Gerente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notifications.map((notification) => {
                    const post = postsDetails[notification.idPost];
                    if (!post) return null;

                    return (
                      <div 
                        key={notification._id}
                        onClick={() => setSelectedPost(post)}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:border-blue-400"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md border border-blue-100 uppercase tracking-wide">
                              Protocolo: {post.protocol || 'S/N'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(notification.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          {post.photos && (Array.isArray(post.photos) ? post.photos.length > 0 : typeof post.photos === 'string') && (
                            <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                              <img src={Array.isArray(post.photos) ? post.photos[0] : post.photos} alt="Evidência Principal" className="w-full h-full object-cover" />
                            </div>
                          )}

                          <p className="text-sm text-slate-700 font-medium line-clamp-3 leading-relaxed">
                            {post.description}
                          </p>

                          {post.managedArea && (
                            <div className="text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block font-bold text-slate-600 uppercase">
                              Setor: {post.managedArea}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold group-hover:text-blue-600 transition-colors">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" /> {post.city || 'Cidade N/D'}</span>
                          <span className="text-[10px] font-bold text-blue-600 underline">Auditar com mapa →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: LISTAGEM PADRÃO DE SUB-CONTAS */}
          {activeTab === 'subs' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1">
                <Users className="w-5 h-5 text-green-700" />
                <h3 className="font-bold text-slate-800 text-lg">Sub-contas Administradas</h3>
              </div>

              {fetchLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-500">Carregando lista de sub-contas subordinadas...</p>
                </div>
              ) : subs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                  <p className="text-slate-400 font-medium text-sm">Nenhuma sub-conta criada vinculada a este painel Sub.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subs.map((sub) => (
                    <div key={sub._id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="flex items-start gap-3">
                        {sub.imageProfile ? (
                          <img src={sub.imageProfile} alt={sub.tittle} className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm uppercase flex-shrink-0">
                            {sub.tittle ? sub.tittle.slice(0, 2) : 'SB'}
                          </div>
                        )}
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{sub.tittle}</h4>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {sub.email}</p>
                          {sub.managedArea && <p className="text-[11px] text-blue-600 font-semibold truncate mt-1 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {sub.managedArea}</p>}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">ID: {sub._id ? sub._id.slice(-6) : '...'}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleStartEdit(sub)} className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1 text-[11px]"><Edit3 className="w-3.5 h-3.5" /> Editar</button>
                          <button onClick={() => handleDeleteSub(sub._id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1 text-[11px]"><Trash2 className="w-3.5 h-3.5" /> Deletar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardSub;