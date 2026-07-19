import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import Register from './pages/Register';
import Login from './pages/Login';
import RegisterMaster from './pages/RegisterMaster';
import Dashboard from './pages/Dashboard';
import DashboardMaster from './pages/DashboardMaster';
import DashboardSub from './pages/DashboardSub';

function App() {
    return (
        // O APIProvider envolve todo o ecossistema de rotas
        // Substitua SUA_API_KEY_DO_GOOGLE_MAPS_AQUI pela chave gerada no Google Cloud Console
        <APIProvider apiKey="AIzaSyDMPTsWelH2nBvCi9r6NL9EYP0sw2Hb_-g">
            <BrowserRouter>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register-master" element={<RegisterMaster />} />
                    <Route path='/dashboard' element={<Dashboard />} />
                    <Route path="/master-dashboard" element={<DashboardMaster />} />
                    <Route path="/subs-dashboard" element={<DashboardSub />} />
                </Routes>
            </BrowserRouter>
        </APIProvider>
    );
}

export default App;