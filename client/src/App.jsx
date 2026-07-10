import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import RegisterMaster from './pages/RegisterMaster';
import Dashboard from './pages/Dashboard';
import DashboardMaster from './pages/DashboardMaster';
import DashboardSub from './pages/DashboardSub';

function App() {
    return (
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
    );
}

export default App;