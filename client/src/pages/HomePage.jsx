import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Map, useMap } from '@vis.gl/react-google-maps';

// Importação da imagem da logo
import logoImg from '../LOGO---CIDADEMDIA (1).png';

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

  // Estados para dados públicos
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingPages, setLoadingPages] = useState(true);

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // Busca de ocorrências públicas
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await fetch('https://cidadeemdia.onrender.com/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Busca de páginas institucionais
  const fetchPages = async () => {
    try {
      setLoadingPages(true);
      const response = await fetch('http://localhost:3000/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar páginas institucionais:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchPages();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  // Filtragem de Ocorrências com base na pesquisa confirmada
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

  return (
    <div className="min-h-screen bg-slate-50 antialiased font-sans flex flex-col">
      {/* Top Header / Navbar */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative z-40 sticky top-0">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo importada */}
          <Link to="/" className="flex items-center group">
            <img 
              src={logoImg} 
              alt="Logo Cidade em Dia" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>

          {/* Botões de Ação (Login e Cadastro) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')} 
              className="px-4 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-yellow-400" />
              <span>Entrar</span>
            </button>

            <button 
              onClick={() => navigate('/register')} 
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-300 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner / Seção de Busca */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-yellow-300 border border-yellow-400/20">
            <Award className="w-3.5 h-3.5 text-yellow-400" /> Portal Oficial de Acompanhamento Público
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Acompanhe e notifique o seu município em <span className="text-yellow-400 underline decoration-yellow-400/30">tempo real</span>.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            Consulte protocolos, verifique demandas atendidas e navegue pelas secretarias e órgãos institucionais parceiros.
          </p>

          {/* Form / Barra de Pesquisa com Botão de Confirmação */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busque por protocolo, descrição, área ou cidade..." 
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-yellow-400 block">{posts.length}</span>
              <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Ocorrências Registradas</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-blue-400 block">{pages.length}</span>
              <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Páginas Institucionais</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-2xl font-black text-green-400 block">100%</span>
              <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">Transparência Pública</span>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-12">
        
        {/* Seção 1: Páginas Institucionais */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-700" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Páginas Institucionais</h3>
                <p className="text-xs text-slate-500">Órgãos, Secretarias e Subprefeituras ativas no sistema</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              {pages.length} Cadastradas
            </span>
          </div>

          {loadingPages ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500 font-medium">Carregando páginas institucionais...</span>
            </div>
          ) : pages.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-sm font-medium">
              Nenhuma página institucional disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pages.map((page) => {
                const title = page.tittle || page.title || 'Órgão Institucional';
                return (
                  <div key={page._id || page.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group">
                    {page.imageProfile ? (
                      <img src={page.imageProfile} alt={title} className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm uppercase flex-shrink-0">
                        {title.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{title}</h4>
                      {page.managedArea && (
                        <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-500" /> {page.managedArea}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Seção 2: Feed de Ocorrências */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Ocorrências Registradas</h3>
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
              <p className="text-sm text-slate-500 font-medium">Buscando ocorrências públicas...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-slate-700 font-bold text-base">Nenhuma ocorrência encontrada.</p>
              <p className="text-xs text-slate-400">Tente ajustar o termo de pesquisa digitado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.map((post) => (
                <div 
                  key={post._id || post.id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md border border-blue-100 uppercase tracking-wide">
                        Protocolo: {post.protocol || 'S/N'}
                      </span>
                      {post.createdAt && (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Previa da Imagem */}
                    {post.photos && (Array.isArray(post.photos) ? post.photos.length > 0 : typeof post.photos === 'string') && (
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
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
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors">
                    <span className="flex items-center gap-1 text-slate-500 truncate max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> 
                      <span className="truncate">{post.city || post.City || 'Não informada'}</span>
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5">
                      Ver mapa <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Detalhes da Ocorrência */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
            
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold bg-blue-500/30 text-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1">
                  Ocorrência Pública
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

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Localização Georreferenciada
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

              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Relato Detalhado</span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedPost.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-slate-50 p-3 rounded-xl border border-slate-100 ${temCep ? '' : 'col-span-2'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade / UF</span>
                  <p className="text-xs font-bold text-slate-700 truncate">{selectedPost.city || selectedPost.City || 'Não informada'}</p>
                </div>

                {temCep && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CEP</span>
                    <p className="text-xs font-mono font-bold text-slate-700">{selectedPost.CEP || selectedPost.cep}</p>
                  </div>
                )}

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
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Logo Cidade em Dia" 
              className="h-8 w-auto object-contain" 
            />
            <span className="text-slate-600">•</span>
            <span>Todos os direitos reservados</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/login" className="hover:text-white transition-colors">Acesso Restrito</Link>
            <Link to="/register" className="hover:text-white transition-colors">Cadastrar Órgão</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;