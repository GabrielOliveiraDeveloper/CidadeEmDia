import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  MapPin, 
  FileText, 
  LogIn, 
  UserPlus, 
  X, 
  Loader2, 
  Award, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  Compass,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Shield,
  User,
  GitMerge,
  Eye,
  Mail,
  Phone,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Map, useMap } from '@vis.gl/react-google-maps';

// Importação da imagem da logo
import logoImg from '../LOGO---CIDADEMDIA (1).png';

// Base URL da API
const API_BASE_URL = 'https://cidadeemdia.onrender.com';

// Helper de conversão de coordenadas
const getCoords = (post) => {
  if (!post || !post.coordinates) return null;
  
  if (post.coordinates.lat !== undefined && post.coordinates.lng !== undefined) {
    return {
      lat: parseFloat(post.coordinates.lat),
      lng: parseFloat(post.coordinates.lng)
    };
  }
  
  if (Array.isArray(post.coordinates) && post.coordinates.length === 2) {
    return {
      lat: parseFloat(post.coordinates[0]),
      lng: parseFloat(post.coordinates[1])
    };
  }
  
  return null;
};

// Componente de controle do mapa no modal
const ViewMapController = ({ coordenadas }) => {
  const map = useMap();

  useEffect(() => {
    if (map && coordenadas) {
      map.panTo(coordenadas);
      map.setZoom(16);
    }
  }, [map, coordenadas]);

  return (
    <div className="w-full h-full relative">
      <Map
        defaultCenter={coordenadas || { lat: -23.55052, lng: -46.633308 }}
        defaultZoom={15}
        gestureHandling="greedy"
      >
        {coordenadas && map && (
          <CustomHtmlMarker map={map} position={coordenadas} />
        )}
      </Map>
    </div>
  );
};

// Marcador customizado HTML
const CustomHtmlMarker = ({ map, position }) => {
  const [pixelPosition, setPixelPosition] = useState(null);

  useEffect(() => {
    if (!map || !position) return;

    const updatePosition = () => {
      const projection = map.getProjection();
      if (projection) {
        const latLng = new window.google.maps.LatLng(position.lat, position.lng);
        const point = projection.fromLatLngToPoint(latLng);
        
        const bounds = map.getBounds();
        if (bounds) {
          const nwLatLng = new window.google.maps.LatLng(
            bounds.getNorthEast().lat(),
            bounds.getSouthWest().lng()
          );
          
          const topLeft = projection.fromLatLngToPoint(nwLatLng);
          const scale = Math.pow(2, map.getZoom());
          
          setPixelPosition({
            x: (point.x - topLeft.x) * scale,
            y: (point.y - topLeft.y) * scale,
          });
        }
      }
    };

    const listeners = [
      map.addListener('bounds_changed', updatePosition),
      map.addListener('zoom_changed', updatePosition),
      map.addListener('idle', updatePosition)
    ];

    updatePosition();

    return () => listeners.forEach(l => window.google.maps.event.removeListener(l));
  }, [map, position]);

  if (!pixelPosition) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        left: `${pixelPosition.x}px`,
        top: `${pixelPosition.y}px`,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        fontSize: '32px',
        zIndex: 999
      }}
    >
      📍
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  // Estados para dados públicos
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // Estados do fluxo de visualização de perfil (Login + Modal do Perfil)
  const [targetProfile, setTargetProfile] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Estado do perfil autenticado após login master aprovado
  const [viewingProfileData, setViewingProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingUserPosts, setLoadingUserPosts] = useState(false);

  // Busca de postagens públicas
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await fetch(`${API_BASE_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar postagens:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Busca e unificação de todos os perfis usando as rotas especificadas
  const fetchAllProfiles = async () => {
    try {
      setLoadingProfiles(true);

      const [pagesRes, subsRes, mastersRes, usersRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/pages`),
        fetch(`${API_BASE_URL}/subs`),
        fetch(`${API_BASE_URL}/returnAllMasters`),
        fetch(`${API_BASE_URL}/returnAllUsers`)
      ]);

      const fetchedProfiles = [];

      // 1. Processa Páginas Institucionais
      if (pagesRes.status === 'fulfilled' && pagesRes.value.ok) {
        const pagesData = await pagesRes.value.json();
        if (Array.isArray(pagesData)) {
          pagesData.forEach(p => {
            fetchedProfiles.push({
              id: p._id || p.id,
              name: p.tittle || p.title || 'Página Institucional',
              imageProfile: p.imageProfile,
              type: 'Página Institucional',
              managedArea: p.managedArea,
              city: p.city,
              email: p.email,
              tel: p.tel
            });
          });
        }
      }

      // 2. Processa Subcontas
      if (subsRes.status === 'fulfilled' && subsRes.value.ok) {
        const subsData = await subsRes.value.json();
        if (Array.isArray(subsData)) {
          subsData.forEach(s => {
            fetchedProfiles.push({
              id: s._id || s.id,
              name: s.tittle || s.title || 'Subconta',
              imageProfile: s.imageProfile,
              type: 'Subconta',
              managedArea: s.managedArea,
              email: s.email,
              tel: s.tel
            });
          });
        }
      }

      // 3. Processa Masters (Rota /returnAllMasters)
      if (mastersRes.status === 'fulfilled' && mastersRes.value.ok) {
        const mastersData = await mastersRes.value.json();
        if (Array.isArray(mastersData)) {
          mastersData.forEach(m => {
            fetchedProfiles.push({
              id: m._id || m.id,
              name: m.tittle || 'Conta Master',
              imageProfile: m.imageProfile,
              type: 'Conta Master',
              managedArea: m.managedArea,
              city: m.city,
              email: m.email,
              tel: m.tel || m.CPForCNPJ
            });
          });
        }
      }

      // 4. Processa Usuários (Rota /returnAllUsers)
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        if (Array.isArray(usersData)) {
          usersData.forEach(u => {
            fetchedProfiles.push({
              id: u._id || u.id,
              name: u.name || 'Usuário',
              imageProfile: u.imageProfile,
              type: 'Usuário',
              email: u.email,
              tel: u.tel
            });
          });
        }
      }

      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchAllProfiles();
  }, []);

  // Funções de rolagem do carrossel
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  // Ao clicar no botão "Ver perfil", abre o modal de validação de login Master
  const handleOpenViewProfile = (profile) => {
    setTargetProfile(profile);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setShowLoginModal(true);
  };

  // Requisição de Login para autorização Master
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha o e-mail e a senha.');
      return;
    }

    try {
      setLoggingIn(true);
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || 'E-mail ou senha inválidos.');
        return;
      }

      // Validação estrita de permissão Master
      if (data.role !== 'master') {
        setLoginError('Acesso negado: Apenas contas Master têm permissão para visualizar perfis.');
        return;
      }

      // Sucesso no login master: fecha modal de login e abre detalhes do perfil
      setShowLoginModal(false);
      openProfileDetails(targetProfile);

    } catch (error) {
      console.error('Erro ao realizar login:', error);
      setLoginError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Abre os detalhes do perfil e carrega os posts associados
  const openProfileDetails = async (profile) => {
    setViewingProfileData(profile);
    setUserPosts([]);
    
    if (profile && profile.id) {
      try {
        setLoadingUserPosts(true);
        const response = await fetch(`${API_BASE_URL}/posts/user/${profile.id}`);
        if (response.ok) {
          const postsData = await response.json();
          setUserPosts(Array.isArray(postsData) ? postsData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar postagens do usuário:', error);
      } finally {
        setLoadingUserPosts(false);
      }
    }
  };

  // Filtragem de Postagens com base na pesquisa confirmada
  const filteredPosts = posts.filter(post => {
    const term = activeSearch.toLowerCase().trim();
    if (!term) return true;

    return (
      (post.protocol && post.protocol.toLowerCase().includes(term)) ||
      (post.description && post.description.toLowerCase().includes(term)) ||
      (post.city && post.city.toLowerCase().includes(term)) ||
      (post.managedArea && post.managedArea.toLowerCase().includes(term))
    );
  });

  const parsedCoordinates = selectedPost ? getCoords(selectedPost) : null;
  const temCep = selectedPost?.CEP || selectedPost?.cep;

  // Helper para renderizar a badge correspondente ao tipo de perfil
  const renderProfileBadge = (type) => {
    switch (type) {
      case 'Conta Master':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" /> Master
          </span>
        );
      case 'Página Institucional':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-600" /> Institucional
          </span>
        );
      case 'Subconta':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
            <GitMerge className="w-3 h-3 text-amber-600" /> Subconta
          </span>
        );
      case 'Usuário':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
            <User className="w-3 h-3 text-green-600" /> Usuário
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white antialiased font-sans flex flex-col">
      {/* Top Header / Navbar */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white shadow-md relative z-40 sticky top-0">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
          
          {/* Logo Maior no Canto Superior Esquerdo */}
          <Link to="/" className="flex items-center group flex-shrink-0 py-2">
            <img 
              src={logoImg} 
              alt="Logo Cidade em Dia" 
              className="h-16 sm:h-20 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <button 
              onClick={() => navigate('/login')} 
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-blue-50 hover:text-white hover:bg-white/10 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-yellow-300" />
              <span>Entrar</span>
            </button>

            <button 
              onClick={() => navigate('/register')} 
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-300 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta</span>
            </button>

            <button 
              onClick={() => navigate('/register-master')} 
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              <span>Cadastrar Conta Master</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner / Seção de Busca */}
      <section className="bg-white text-slate-800 py-16 px-4 border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm">
            <Award className="w-3.5 h-3.5 text-green-600" /> Portal Oficial de Acompanhamento Público
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
            Acompanhe e notifique o seu município em <span className="text-green-600 underline decoration-green-500/30">tempo real</span>.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Consulte protocolos, verifique demandas atendidas e navegue pelas secretarias e órgãos institucionais parceiros.
          </p>

          {/* Form / Barra de Pesquisa */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="max-w-2xl mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busque por protocolo, descrição, área ou cidade..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-800 rounded-xl text-sm font-medium placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </button>
          </form>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-green-700 block">{posts.length}</span>
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Postagens Registradas</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-blue-600 block">{profiles.length}</span>
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Perfis Cadastrados</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-2xl font-black text-yellow-600 block">100%</span>
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Transparência Pública</span>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-12 bg-white w-full">
        
        {/* Seção 1: Carrossel de Perfis da Plataforma */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-green-700" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Perfis da Plataforma</h3>
                <p className="text-xs text-slate-500">Usuários, Páginas Institucionais, Contas Master e Subcontas cadastradas</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 mr-2">
                {profiles.length} Perfis
              </span>
              <button 
                onClick={() => scrollCarousel('left')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scrollCarousel('right')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                aria-label="Próximo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loadingProfiles ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 flex items-center justify-center gap-2 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500 font-medium">Carregando perfis da plataforma...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-sm font-medium shadow-sm">
              Nenhum perfil cadastrado no momento.
            </div>
          ) : (
            /* Carrossel Horizontal */
            <div 
              ref={carouselRef}
              className="flex items-center gap-4 overflow-x-auto scrollbar-none scroll-smooth py-2 px-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {profiles.map((profile, idx) => {
                const name = profile.name || 'Perfil sem nome';
                return (
                  <div 
                    key={profile.id || idx} 
                    className="min-w-[280px] max-w-[300px] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-green-600/40 transition-all flex flex-col justify-between flex-shrink-0 snap-start group space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {profile.imageProfile ? (
                        <img 
                          src={profile.imageProfile} 
                          alt={name} 
                          className="w-14 h-14 rounded-full object-cover border border-slate-200 flex-shrink-0" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base uppercase flex-shrink-0">
                          {name.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-green-700 transition-colors">
                          {name}
                        </h4>
                        {renderProfileBadge(profile.type)}
                        {profile.managedArea && (
                          <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" /> {profile.managedArea}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botão Ver Perfil */}
                    <button
                      onClick={() => handleOpenViewProfile(profile)}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-green-600 hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver perfil</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Seção 2: Feed de Postagens */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-700" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Postagens Registradas</h3>
                <p className="text-xs text-slate-500">Acompanhe as solicitações recentes enviadas pela comunidade</p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Exibindo <span className="font-bold text-slate-800">{filteredPosts.length}</span> de <span className="font-bold text-slate-800">{posts.length}</span>
            </div>
          </div>

          {loadingPosts ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500 font-medium">Buscando postagens públicas...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="text-slate-700 font-bold text-base">Nenhuma postagem encontrada.</p>
              <p className="text-xs text-slate-400">Tente ajustar o termo de pesquisa digitado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.map((post) => (
                <div 
                  key={post._id || post.id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md border border-blue-100 uppercase tracking-wide">
                        Protocolo: {post.protocol || 'S/N'}
                      </span>
                      {post.createdAt && (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Prévia da Imagem */}
                    {post.photos && (Array.isArray(post.photos) ? post.photos.length > 0 : typeof post.photos === 'string') && (
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                        <img 
                          src={Array.isArray(post.photos) ? post.photos[0] : post.photos} 
                          alt="Evidência Visual" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    )}

                    {/* Descrição */}
                    <p className="text-sm text-slate-700 font-medium line-clamp-3 leading-relaxed">
                      {post.description || 'Sem descrição cadastrada.'}
                    </p>

                    {/* Badge da Área */}
                    {post.managedArea && (
                      <div className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block font-bold text-slate-600 uppercase">
                        Setor: {post.managedArea}
                      </div>
                    )}
                  </div>

                  {/* Footer do Card */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-green-700 transition-colors">
                    <span className="flex items-center gap-1 text-slate-500 truncate max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> 
                      <span className="truncate">{post.city || post.City || 'Não informada'}</span>
                    </span>
                    <span className="text-[11px] font-bold text-green-700 flex items-center gap-0.5">
                      Ver mapa <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal 1: Autenticação de Usuário Master para Visualizar Perfil */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-yellow-300" />
                <div>
                  <h3 className="font-bold text-base">Autenticação Requerida</h3>
                  <p className="text-xs text-green-100">Área restrita a administradores Master</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Para visualizar o perfil completo de <strong>{targetProfile?.name}</strong>, informe as credenciais de uma <strong>Conta Master</strong>.
                </span>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">E-mail Master</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu.email@master.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Acessar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Visualização de Perfil Detalhado e Postagens do Usuário */}
      {viewingProfileData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
            
            {/* Header do Perfil */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white p-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                {viewingProfileData.imageProfile ? (
                  <img 
                    src={viewingProfileData.imageProfile} 
                    alt={viewingProfileData.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/80 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-white font-black text-xl uppercase shadow-md">
                    {viewingProfileData.name?.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xl">{viewingProfileData.name}</h3>
                    {renderProfileBadge(viewingProfileData.type)}
                  </div>
                  <p className="text-xs text-green-100 mt-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-yellow-300" /> Perfil Verificado pela Plataforma
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setViewingProfileData(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Perfil */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
              {/* Informações de Contato / Dados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail</span>
                  <p className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{viewingProfileData.email || 'Não informado'}</span>
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Telefone / Identificador</span>
                  <p className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{viewingProfileData.tel || 'Não informado'}</span>
                  </p>
                </div>

                {viewingProfileData.managedArea && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Área de Atuação</span>
                    <p className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span>{viewingProfileData.managedArea}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Seção de Postagens do Usuário */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-700" />
                    <span>Postagens Publicadas</span>
                  </h4>
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {userPosts.length} Encontradas
                  </span>
                </div>

                {loadingUserPosts ? (
                  <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-medium text-slate-500">Carregando postagens deste usuário...</span>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs font-medium">
                    Este perfil ainda não realizou nenhuma postagem.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userPosts.map((post) => (
                      <div 
                        key={post._id || post.id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                              Protocolo: {post.protocol}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{post.city}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium line-clamp-2">
                            {post.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            {post.managedArea}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setViewingProfileData(null);
                            }}
                            className="text-green-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Detalhes</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setViewingProfileData(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Detalhes da Postagem Selecionada */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
            
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white p-5 flex items-center justify-between flex-shrink-0 border-b border-green-800">
              <div>
                <span className="text-[10px] font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1 border border-yellow-400/30">
                  Postagem Pública
                </span>
                <h3 className="font-bold text-lg flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-yellow-400" /> Protocolo: {selectedPost.protocol || 'Sem Código'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Localização Georreferenciada
                </span>
                <div className="w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
                  <ViewMapController coordenadas={parsedCoordinates} />
                </div>
              </div>

              {selectedPost.photos && (Array.isArray(selectedPost.photos) ? selectedPost.photos.length > 0 : typeof selectedPost.photos === 'string') && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Evidências Anexadas</span>
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

              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Relato Detalhado</span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedPost.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-slate-50 p-3 rounded-xl border border-slate-200/80 ${temCep ? '' : 'col-span-2'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade / UF</span>
                  <p className="text-xs font-bold text-slate-700 truncate">{selectedPost.city || selectedPost.City || 'Não informada'}</p>
                </div>

                {temCep && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CEP</span>
                    <p className="text-xs font-mono font-bold text-slate-700">{selectedPost.CEP || selectedPost.cep}</p>
                  </div>
                )}

                {selectedPost.managedArea && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 col-span-2 flex items-center gap-2">
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
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white text-slate-600 py-8 border-t border-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Logo Cidade em Dia" 
              className="h-8 w-auto object-contain" 
            />
            <span className="text-slate-300">•</span>
            <span>Todos os direitos reservados</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <Link to="/login" className="hover:text-green-700 transition-colors">Acesso Restrito</Link>
            <Link to="/register" className="hover:text-green-700 transition-colors">Cadastrar Órgão</Link>
            <Link to="/register-master" className="hover:text-green-700 transition-colors">Conta Master</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;