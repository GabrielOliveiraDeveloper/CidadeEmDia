import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  FileText, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  X,
  Hash,
  RefreshCw,
  Search
} from 'lucide-react';

const Dashboard = () => {
  const userId = localStorage.getItem('@Cidademdia:userId') || 'Usuário';

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    protocol: '', 
    cep: '',
    city: '',
    photos: [], 
    description: '',
    coordinates: null,
    managedArea: '' 
  });

  const [managedAreas, setManagedAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [geoLoading, setGeoLoading] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const generateRandomProtocol = () => {
    const randomNum = `PRT${Date.now().toString().slice(-6)}`;
    setNewPost(prev => ({ ...prev, protocol: randomNum }));
  };

  useEffect(() => {
    fetchPosts();
    generateRandomProtocol();

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
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!newPost.city.trim()) {
      setManagedAreas([]);
      setNewPost(prev => ({ ...prev, managedArea: '' }));
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setAreasLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/areas/${encodeURIComponent(newPost.city.trim())}`);
        if (response.ok) {
          const areas = await response.json();
          setManagedAreas(areas);
          setNewPost(prev => ({ ...prev, managedArea: '' }));
        }
      } catch (error) {
        console.error("Erro ao buscar áreas gerenciadas:", error);
      } finally {
        setAreasLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newPost.city]);

  const initMap = () => {
    if (!window.L || mapRef.current || !mapContainerRef.current) return;

    const L = window.L;
    const defaultCoords = [-23.55052, -46.633308];

    const map = L.map(mapContainerRef.current).setView(defaultCoords, 13);
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

    const marker = L.marker(defaultCoords, { icon: defaultIcon }).addTo(map);
    markerRef.current = marker;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateMarkerPosition(lat, lng, true);
    });
  };

  const updateMarkerPosition = (lat, lng, isManualClick = false) => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      
      if (!isManualClick) {
        mapRef.current.setView([lat, lng], 16);
      }

      setNewPost(prev => ({
        ...prev,
        coordinates: { lat, lng }
      }));
    }
  };

  const handleSearchAddressOnMap = async () => {
    const { city, cep } = newPost;
    
    const queryParts = [];
    if (city) queryParts.push(city);
    if (cep) queryParts.push(cep);
    queryParts.push('Brasil');

    const searchQuery = queryParts.join(', ');

    if (queryParts.length <= 1) {
      setMessage({ type: 'error', text: 'Preencha os campos de endereço antes de buscar no mapa.' });
      return;
    }

    setGeoLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        updateMarkerPosition(parseFloat(lat), parseFloat(lon), false);
      } else {
        setMessage({ type: 'error', text: 'Endereço não localizado no mapa. Tente refinar os campos.' });
      }
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      setMessage({ type: 'error', text: 'Erro ao conectar com o serviço de mapas.' });
    } finally {
      setGeoLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/posts');
      const data = await response.json();
      if (response.ok) {
        setPosts(data);
      } else {
        throw new Error(data.message || 'Erro ao buscar ocorrências');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMessage({ type: '', text: '' });

    if (files.length > 5) {
      setMessage({ type: 'error', text: 'Você pode selecionar no máximo 5 fotos por ocorrência.' });
      e.target.value = '';
      return;
    }

    const invalidFile = files.find(file => !file.type.startsWith('image/'));
    if (invalidFile) {
      setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG).' });
      e.target.value = '';
      return;
    }

    const base64Promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    });

    Promise.all(base64Promises)
      .then(base64Images => {
        setNewPost(prev => ({ ...prev, photos: base64Images }));
      })
      .catch(err => {
        setMessage({ type: 'error', text: 'Erro ao processar uma ou mais imagens.' });
        console.error(err);
      });
  };

  const removeImagePreview = (indexToRemove) => {
    setNewPost(prev => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:3000/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId, 
          protocol: newPost.protocol,
          cep: newPost.cep,
          city: newPost.city,
          photos: newPost.photos, 
          description: newPost.description,
          managedArea: newPost.managedArea 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao criar ocorrência');

      setMessage({ type: 'success', text: 'Ocorrência registrada com sucesso!' });
      setNewPost({ 
        protocol: '', cep: '', city: '', photos: [], description: '', coordinates: null, managedArea: '' 
      });
      setManagedAreas([]);
      
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

      fetchPosts(); 
      generateRandomProtocol(); 
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta ocorrência?')) return;

    try {
      const response = await fetch(`http://localhost:3000/posts/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao deletar ocorrência');
      
      setPosts(prev => prev.filter(post => post._id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@Cidademdia:token');
    localStorage.removeItem('@Cidademdia:userId');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 antialiased font-sans">
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white shadow-md relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Cidade<span className="text-yellow-400">em</span>dia
            </h1>
            <p className="text-xs text-blue-100 font-light hidden sm:block">Painel de Monitoramento Cidadão</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-50 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              ID: <span className="font-mono text-yellow-300">{userId.slice(-6)}</span>
            </span>

            <button 
              onClick={handleLogout}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5 sticky top-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-lg">Nova Ocorrência</h2>
            </div>

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

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex justify-between items-center">
                  <span>Código de Protocolo</span>
                  <button 
                    type="button" 
                    onClick={generateRandomProtocol}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transform active:rotate-180 transition-transform duration-200"
                    title="Sugerir outro código"
                  >
                    <RefreshCw className="w-3 h-3" /> Gerar sugestão
                  </button>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="protocol"
                    required
                    value={newPost.protocol}
                    onChange={handleInputChange}
                    placeholder="Ex: PRT982738"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-mono tracking-wider"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização do Problema</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      required
                      value={newPost.cep}
                      onChange={handleInputChange}
                      placeholder="01310-100"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cidade</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={newPost.city}
                      onChange={handleInputChange}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    Área Gerenciada
                    {areasLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                  </label>
                  <select
                    name="managedArea"
                    required
                    value={newPost.managedArea}
                    onChange={handleInputChange}
                    disabled={managedAreas.length === 0 || areasLoading}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                  >
                    {managedAreas.length === 0 ? (
                      <option value="">{newPost.city ? 'Nenhuma área disponível nesta cidade' : 'Digite a cidade primeiro...'}</option>
                    ) : (
                      <>
                        <option value="">Selecione uma área registrada...</option>
                        {managedAreas.map((area, index) => (
                          <option key={index} value={area}>{area}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSearchAddressOnMap}
                  disabled={geoLoading}
                  className="w-full mt-1 bg-slate-200 hover:bg-slate-300 active:bg-slate-400/80 text-slate-700 font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-70"
                >
                  {geoLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  Localizar Endereço no Mapa
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex justify-between">
                  <span>Ajuste Fino (Clique se necessário)</span>
                  {newPost.coordinates && (
                    <span className="text-emerald-600 font-mono text-[10px]">✓ Coordenadas Prontas</span>
                  )}
                </label>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-44 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden z-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fotos do Problema (Máx. 5)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer relative group">
                  <div className="space-y-1 text-center pointer-events-none">
                    <Upload className="mx-auto h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <div className="flex text-sm text-slate-600">
                      <span className="relative font-semibold text-blue-600 group-hover:text-blue-700">Selecione arquivos</span>
                      <p className="pl-1">ou arraste para aqui</p>
                    </div>
                    <p className="text-xs text-slate-400">PNG, JPG, JPEG até 5 fotos</p>
                  </div>
                  <input 
                    id="file-upload" 
                    name="photos" 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
              </div>

              {newPost.photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {newPost.photos.map((base64, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img src={base64} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 shadow-sm hover:bg-red-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Descrição do Problema</label>
                <textarea
                  name="description"
                  required
                  rows="3"
                  value={newPost.description}
                  onChange={handleInputChange}
                  placeholder="Descreva detalhadamente o problem encontrado..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:from-blue-800 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar Ocorrência'}
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <FileText className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-slate-800 text-lg">Ocorrências na Comunidade</h2>
          </div>

          {fetchLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Buscando ocorrências ativas...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
              <p className="text-slate-400 font-medium text-sm">Nenhuma ocorrência registrada até o momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div 
                  key={post._id} 
                  className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md border border-blue-100 uppercase tracking-wide">
                        Ref: {post.protocol || 'Sem Prot.'}
                      </span>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {post.photos && Array.isArray(post.photos) && post.photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1">
                        {post.photos.map((src, i) => (
                          <div key={i} className="aspect-square bg-slate-100 rounded-md overflow-hidden">
                            <img src={src} alt="Evidência" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : post.photos && typeof post.photos === 'string' && post.photos.startsWith('data:image') ? (
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                        <img src={post.photos} alt="Evidência única" className="w-full h-full object-cover" />
                      </div>
                    ) : null}

                    <p className="text-sm text-slate-700 font-normal leading-relaxed line-clamp-4">
                      {post.description}
                    </p>
                    
                    {post.managedArea && (
                      <div className="text-[11px] bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block font-medium text-slate-600">
                        Área: {post.managedArea}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>CEP {post.CEP || post.cep}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                      User: {post.idUser ? post.idUser.slice(-4) : 'Anon'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;