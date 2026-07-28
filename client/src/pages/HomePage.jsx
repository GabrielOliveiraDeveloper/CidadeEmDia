import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
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
  ExternalLink,
  SkipForward,
  Play
} from 'lucide-react';
import { Map, useMap } from '@vis.gl/react-google-maps';

// Importação da logo e do vídeo de abertura
import logoImg from '../LOGO---CIDADEMDIA (1).png';
import introVideo from './IMG_6655.MOV';

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
  const videoRef = useRef(null);

  // Estado para controlar a exibição do vídeo e estado do player
  const [showIntro, setShowIntro] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Função para dar Play garantido com som via gesto do usuário
  const handleStartVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Erro ao tentar reproduzir o vídeo:", error);
        });
    }
  };

  // Estados para dados públicos
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Estado da postagem que o usuário deseja visualizar
  const [targetPost, setTargetPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  // Estados do fluxo de visualização (Perfil ou Postagem)
  const [targetProfile, setTargetProfile] = useState(null);
  const [actionType, setActionType] = useState(null); // 'profile' ou 'post'
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

  // Busca e unificação de todos os perfis
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

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenViewProfile = (profile) => {
    setActionType('profile');
    setTargetProfile(profile);
    setTargetPost(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setShowLoginModal(true);
  };

  const handleOpenPostDetails = (post) => {
    setActionType('post');
    setTargetPost(post);
    setTargetProfile(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setShowLoginModal(true);
  };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || 'E-mail ou senha inválidos.');
        return;
      }

      if (data.role !== 'master') {
        setLoginError('Acesso negado: Apenas contas Master têm permissão para visualizar estas informações.');
        return;
      }

      setShowLoginModal(false);

      if (actionType === 'profile' && targetProfile) {
        openProfileDetails(targetProfile);
      } else if (actionType === 'post' && targetPost) {
        setSelectedPost(targetPost);
      }

    } catch (error) {
      console.error('Erro ao realizar login:', error);
      setLoginError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoggingIn(false);
    }
  };

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

  const parsedCoordinates = selectedPost ? getCoords(selectedPost) : null;
  const temCep = selectedPost?.CEP || selectedPost?.cep;

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
    <div className="min-h-screen bg-white antialiased font-sans flex flex-col relative">
      
      {/* Modal Overlay do Vídeo de Introdução com Botão Play Interativo */}
      {showIntro && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center bg-black border border-white/10">
            
            <video
              ref={videoRef}
              src={introVideo}
              playsInline
              onEnded={() => setShowIntro(false)}
              className="w-full h-full max-h-[85vh] object-contain bg-black rounded-3xl"
            />

            {/* Overlay com o Botão para Iniciar o Áudio/Vídeo */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 z-20">
                <button
                  onClick={handleStartVideo}
                  className="w-20 h-20 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all cursor-pointer group"
                >
                  <Play className="w-10 h-10 ml-1 group-hover:scale-105 transition-transform" />
                </button>
                <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-full border border-white/20">
                  Clique para assistir com som
                </span>
              </div>
            )}

            {/* Botão de Pular */}
            <button
              onClick={() => setShowIntro(false)}
              className="absolute bottom-6 right-6 z-30 bg-slate-900/80 hover:bg-black text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-white/20 transition-all flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <span>Pular</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white shadow-md relative z-40 sticky top-0">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center group flex-shrink-0 py-2">
            <img 
              src={logoImg} 
              alt="Logo Cidade em Dia" 
              className="h-16 sm:h-20 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>

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

      {/* Hero Banner */}
      <section className="bg-white text-slate-800 py-12 px-4 border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm">
            <Award className="w-3.5 h-3.5 text-green-600" /> Portal Oficial de Acompanhamento Público
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
            Acompanhe e notifique o seu município em <span className="text-green-600 underline decoration-green-500/30">tempo real</span>.
          </h2>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-12 bg-white w-full">
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

        {/* Feed de Postagens */}
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
              Total de <span className="font-bold text-slate-800">{posts.length}</span> postagens
            </div>
          </div>

          {loadingPosts ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500 font-medium">Buscando postagens públicas...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="text-slate-700 font-bold text-base">Nenhuma postagem encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => (
                <div 
                  key={post._id || post.id}
                  onClick={() => handleOpenPostDetails(post)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group cursor-pointer space-y-3"
                >
                  <div className="space-y-3">
                    {post.photos && (Array.isArray(post.photos) ? post.photos.length > 0 : typeof post.photos === 'string') && (
                      <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                        <img 
                          src={Array.isArray(post.photos) ? post.photos[0] : post.photos} 
                          alt="Imagem da Postagem" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    )}

                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {post.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-green-700 group-hover:text-green-800 transition-colors">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-500" /> Acesso Restrito Master
                    </span>
                    <span className="flex items-center gap-0.5">
                      Ver detalhes <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal Autenticação Master */}
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
                  Para {actionType === 'profile' ? `visualizar o perfil de ${targetProfile?.name}` : 'ver os detalhes completos desta postagem'}, informe as credenciais de uma <strong>Conta Master</strong>.
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
                      <span>Acessar Informações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualização de Perfil */}
      {viewingProfileData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
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

            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
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

      {/* Modal Detalhes da Postagem */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white p-5 flex items-center justify-between flex-shrink-0 border-b border-green-800">
              <div>
                <span className="text-[10px] font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1 border border-yellow-400/30">
                  Detalhes Acessados via Master
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