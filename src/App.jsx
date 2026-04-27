import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Map, User, Package } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Guias from './pages/Guias'
import Mapa from './pages/Mapa'
import Domiciliario from './pages/Domiciliario'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#FAFAFA] text-[#1a1a1a]">
        {/* Sidebar Estilizado y Compacto */}
        <nav className="w-64 bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1 shadow-sm relative z-10">
          <div className="mb-8 px-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white">
              <Package size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[#1a1a1a]">MrLogistic</h1>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Plataforma</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 mt-2">
            {[
              { to: '/', label: 'Resumen', icon: <LayoutDashboard size={18} /> },
              { to: '/guias', label: 'Gestión Guías', icon: <FileText size={18} /> },
              { to: '/mapa', label: 'Mapa Entregas', icon: <Map size={18} /> },
              { to: '/domiciliario', label: 'Personal', icon: <User size={18} /> },
            ].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-[#FF6B00]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1a1a]'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                AD
              </div>
              <div>
                <p className="text-sm font-bold">Admin</p>
                <p className="text-xs text-gray-400">Operaciones</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content - layout flat */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/guias" element={<Guias />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/domiciliario" element={<Domiciliario />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
