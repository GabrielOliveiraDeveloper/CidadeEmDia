import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Trash2, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Check, 
  X, 
  Film, 
  Layers,
  FileText,
  Star
} from 'lucide-react';

const API_BASE_URL = 'https://cidadeemdia.onrender.com';

const GerenciadorHome = () => {
  // ---------------------------------------------------------------------------
  // ESTADOS - MÍDIA HOME
  // ---------------------------------------------------------------------------
  const [midias, setMidias] = useState([]);
  const [loadingMidias, setLoadingMidias] = useState(true);
  const [uploadingMidia, setUploadingMidia] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isImageFile, setIsImageFile] = useState(true);

  // ---------------------------------------------------------------------------
  // ESTADOS - PLANOS
  // ---------------------------------------------------------------------------
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [planBenefits, setPlanBenefits] = useState([]);

  // ---------------------------------------------------------------------------
  // ESTADOS - POSTS DA COMUNIDADE
  // ---------------------------------------------------------------------------
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [updatingBannerId, setUpdatingBannerId] = useState(null);

  // ---------------------------------------------------------------------------
  // ESTADOS DE FEEDBACK (ALERTAS)
  // ---------------------------------------------------------------------------
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ---------------------------------------------------------------------------
  // CARREGAR DADOS INICIAIS
  // ---------------------------------------------------------------------------
  const fetchMidias = async () => {
    try {
      setLoadingMidias(true);
      const res = await fetch(`${API_BASE_URL}/midia-home`);
      if (res.ok) {
        const data = await res.json();
        setMidias(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar mídias:', error);
    } finally {
      setLoadingMidias(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await fetch(`${API_BASE_URL}/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch(`${API_BASE_URL}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchMidias();
    fetchPlans();
    fetchPosts();
  }, []);

  // ---------------------------------------------------------------------------
  // HANDLERS DE MÍDIA
  // ---------------------------------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showFeedback('error', 'Por favor, selecione apenas arquivos de imagem ou vídeo.');
      return;
    }

    setSelectedFile(file);
    setIsImageFile(isImage);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleUploadMidia = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showFeedback('error', 'Selecione um arquivo de imagem ou vídeo antes de enviar.');
      return;
    }

    try {
      setUploadingMidia(true);
      const base64Url = await convertFileToBase64(selectedFile);

      const response = await fetch(`${API_BASE_URL}/midia-home`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: base64Url,
          isImage: isImageFile
        })
      });

      if (response.ok) {
        const savedMidia = await response.json();
        setMidias((prev) => [savedMidia, ...prev]);
        setSelectedFile(null);
        setFilePreview(null);
        showFeedback('success', 'Mídia enviada com sucesso!');
      } else {
        const errData = await response.json();
        showFeedback('error', errData.message || 'Erro ao salvar mídia.');
      }
    } catch (error) {
      console.error('Erro ao realizar upload:', error);
      showFeedback('error', 'Erro de conexão ao enviar a mídia.');
    } finally {
      setUploadingMidia(false);
    }
  };

  const handleDeleteMidia = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta mídia?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/midia-home/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMidias((prev) => prev.filter((item) => (item._id || item.id) !== id));
        showFeedback('success', 'Mídia removida com sucesso!');
      } else {
        showFeedback('error', 'Não foi possível remover a mídia.');
      }
    } catch (error) {
      console.error('Erro ao deletar mídia:', error);
      showFeedback('error', 'Erro de conexão ao remover mídia.');
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER DE ATUALIZAR POST PARA BANNER
  // ---------------------------------------------------------------------------
  const handleUpdatePostToBanner = async (postId) => {
    try {
      setUpdatingBannerId(postId);
      const response = await fetch(`${API_BASE_URL}/updateposttobunner/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            (post._id || post.id) === postId ? { ...post, isBanner: true } : post
          )
        );
        showFeedback('success', 'Post destacado como banner com sucesso!');
      } else {
        const errData = await response.json();
        showFeedback('error', errData.message || 'Erro ao atualizar post para banner.');
      }
    } catch (error) {
      console.error('Erro ao promover post:', error);
      showFeedback('error', 'Erro de conexão ao atualizar post.');
    } finally {
      setUpdatingBannerId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS DE PLANOS
  // ---------------------------------------------------------------------------
  const handleAddBenefit = () => {
    if (!benefitInput.trim()) return;
    setPlanBenefits((prev) => [...prev, benefitInput.trim()]);
    setBenefitInput('');
  };

  const handleRemoveBenefit = (indexToRemove) => {
    setPlanBenefits((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planName || !planPrice) {
      showFeedback('error', 'Preencha o nome e o preço do plano.');
      return;
    }

    try {
      setCreatingPlan(true);

      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          price: planPrice,
          benefits: planBenefits
        })
      });

      if (response.ok) {
        const savedPlan = await response.json();
        setPlans((prev) => [savedPlan, ...prev]);
        setPlanName('');
        setPlanPrice('');
        setPlanBenefits([]);
        showFeedback('success', 'Plano criado com sucesso!');
      } else {
        const errData = await response.json();
        showFeedback('error', errData.message || 'Erro ao criar plano.');
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      showFeedback('error', 'Erro de conexão ao salvar o plano.');
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPlans((prev) => prev.filter((plan) => (plan._id || plan.id) !== id));
        showFeedback('success', 'Plano removido com sucesso!');
      } else {
        showFeedback('error', 'Não foi possível remover o plano.');
      }
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      showFeedback('error', 'Erro de conexão ao remover plano.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header do Painel */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-7 h-7 text-yellow-300" />
            <div>
              <h1 className="text-xl font-black tracking-tight">Painel de Gerenciamento da Home</h1>
              <p className="text-xs text-green-100">Gerencie as mídias, destaques e planos de assinatura</p>
            </div>
          </div>
        </div>
      </header>

      {/* Banner de Feedback Floating */}
      {feedback.message && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white border ${
            feedback.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-green-600 border-green-500'
          }`}>
            {feedback.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* =================================================================== */}
        {/* SEÇÃO 1: GERENCIAMENTO DE MÍDIAS DA HOME */}
        {/* =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Film className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Mídias da Homepage</h2>
                <p className="text-xs text-slate-500">Envie imagens ou vídeos curtos que serão exibidos na Home</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
              {midias.length} Mídia(s)
            </span>
          </div>

          <form onSubmit={handleUploadMidia} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Selecionar Imagem ou Vídeo
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="w-full sm:w-auto cursor-pointer px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Upload className="w-4 h-4 text-green-600" />
                  <span>{selectedFile ? 'Trocar Arquivo' : 'Escolher Arquivo'}</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>

                {selectedFile && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    {isImageFile ? (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[11px]">
                        <ImageIcon className="w-3.5 h-3.5" /> Imagem Detectada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[11px]">
                        <VideoIcon className="w-3.5 h-3.5" /> Vídeo Detectado
                      </span>
                    )}
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            {filePreview && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pré-visualização</span>
                <div className="relative w-full max-w-xs h-40 rounded-xl overflow-hidden border border-slate-300 bg-black flex items-center justify-center">
                  {isImageFile ? (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={filePreview} controls className="w-full h-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploadingMidia || !selectedFile}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploadingMidia ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Convertendo e Salvando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Salvar Mídia</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Mídias Cadastradas</h3>

            {loadingMidias ? (
              <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                <span className="text-xs text-slate-500 font-medium">Carregando mídias...</span>
              </div>
            ) : midias.length === 0 ? (
              <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium">
                Nenhuma mídia cadastrada até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {midias.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <div 
                      key={itemId}
                      className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {item.isImage ? (
                          <img src={item.url} alt="Mídia da Home" className="w-full h-full object-cover" />
                        ) : (
                          <video src={item.url} controls className="w-full h-full object-contain" />
                        )}

                        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                          item.isImage 
                            ? 'bg-blue-100/90 text-blue-800 border-blue-200' 
                            : 'bg-purple-100/90 text-purple-800 border-purple-200'
                        }`}>
                          {item.isImage ? 'Imagem' : 'Vídeo'}
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between border-t border-slate-200 bg-white">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                          ID: {itemId}
                        </span>

                        <button
                          onClick={() => handleDeleteMidia(itemId)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remover mídia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* SEÇÃO 2: POSTAGENS DA COMUNIDADE (BUSCADAS DA ROTA /posts) */}
        {/* =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-amber-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Postagens da Comunidade</h2>
                <p className="text-xs text-slate-500">Selecione posts para adicionar como Banner Destaque na Home</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
              {posts.length} Post(s)
            </span>
          </div>

          <div className="space-y-3">
            {loadingPosts ? (
              <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span className="text-xs text-slate-500 font-medium">Carregando postagens...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium">
                Nenhuma postagem encontrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post) => {
                  const postId = post._id || post.id;
                  const isAlreadyBanner = Boolean(post.isBanner);
                  const imageSrc = (post.photos && post.photos.length > 0)
                    ? (Array.isArray(post.photos) ? post.photos[0] : post.photos)
                    : (post.imageUrl || post.url || post.midiaUrl);

                  return (
                    <div 
                      key={postId}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                        isAlreadyBanner ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        {imageSrc ? (
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img 
                              src={imageSrc} 
                              alt={post.title || 'Imagem do Post'} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-slate-800 line-clamp-2">
                            {post.title || post.titulo || `Post de ${post.city || 'Cidadão'}`}
                          </h4>
                          {isAlreadyBanner && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Banner
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3">
                          {post.description || post.conteudo || post.content || 'Sem descrição.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                          ID: {postId}
                        </span>

                        <button
                          type="button"
                          disabled={isAlreadyBanner || updatingBannerId === postId}
                          onClick={() => handleUpdatePostToBanner(postId)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isAlreadyBanner
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm disabled:opacity-50'
                          }`}
                        >
                          {updatingBannerId === postId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Promovendo...</span>
                            </>
                          ) : isAlreadyBanner ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Banner Ativo</span>
                            </>
                          ) : (
                            <>
                              <Star className="w-3.5 h-3.5" />
                              <span>Adicionar como banner destaque</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* SEÇÃO 3: GERENCIAMENTO DE PLANOS */}
        {/* =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Planos de Assinatura</h2>
                <p className="text-xs text-slate-500">Cadastre e remova os planos disponíveis para contratação</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              {plans.length} Plano(s)
            </span>
          </div>

          <form onSubmit={handleCreatePlan} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nome do Plano</label>
                <input 
                  type="text"
                  placeholder="Ex: Plano Básico, Pro, Master..."
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Preço (R$)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="99,90"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Benefícios do Plano</label>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Ex: Suporte 24h, Acesso Ilimitado..."
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBenefit(); } }}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              {planBenefits.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {planBenefits.map((benefit, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>{benefit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="hover:text-red-600 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creatingPlan}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {creatingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Plano</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Planos Ativos</h3>

            {loadingPlans ? (
              <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs text-slate-500 font-medium">Carregando planos...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium">
                Nenhum plano cadastrado até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan) => {
                  const planId = plan._id || plan.id;
                  const benefitsList = Array.isArray(plan.benefits) 
                    ? plan.benefits 
                    : typeof plan.benefits === 'string' 
                      ? [plan.benefits] 
                      : [];

                  return (
                    <div 
                      key={planId}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-base text-slate-800">{plan.name}</h4>
                          <button
                            onClick={() => handleDeletePlan(planId)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remover plano"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-2xl font-black text-green-600">
                          R$ {plan.price}
                        </div>

                        {benefitsList.length > 0 && (
                          <ul className="space-y-2 pt-2 border-t border-slate-100">
                            {benefitsList.map((ben, bIdx) => (
                              <li key={bIdx} className="text-xs text-slate-600 flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{ben}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default GerenciadorHome;