import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  User, 
  Package, 
  Menu, 
  X as CloseIcon, 
  Wallet,
  LogOut,
  Loader2,
  BarChart3
} from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificacionesProvider } from './context/NotificacionesContext'
import { Toaster } from 'react-hot-toast'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Guias from './pages/Guias'
import Mapa from './pages/Mapa'
import Domiciliario from './pages/Domiciliario'
import Caja from './pages/Caja'
import Reportes from './pages/Reportes'

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, rol, loading, signOut } = useAuth()
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
      </div>
    )
  }

  if (!user) return <Login />

  const isCourierView = rol === 'domiciliario'

  const menuItems = isCourierView 
    ? [
        { to: '/domiciliario', label: 'Mi Ruta', icon: <User size={18} /> }
      ]
    : [
        { to: '/', label: 'Resumen', icon: <LayoutDashboard size={18} /> },
        { to: '/guias', label: 'Gestión Guías', icon: <FileText size={18} /> },
        { to: '/mapa', label: 'Mapa Entregas', icon: <Map size={18} /> },
        { to: '/caja', label: 'Caja', icon: <Wallet size={18} /> },
        { to: '/reportes', label: 'Reportes', icon: <BarChart3 size={18} /> },
        { to: '/domiciliario', label: 'Modo Repartidor', icon: <User size={18} /> },
      ]

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#1a1a1a] overflow-hidden">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            borderLeft: '4px solid #FF6B00',
            background: '#fff',
            color: '#1a1a1a',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '12px'
          }
        }}
      />
      {/* Redirección automática si el rol es domiciliario y está en una ruta no permitida */}
      {isCourierView && location.pathname !== '/domiciliario' && <Navigate to="/domiciliario" replace />}

      {/* Hamburger Menu - Mobile Only */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[#FF6B00]"
      >
        {isSidebarOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay - Mobile Only */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Estilizado y Compacto */}
      <nav className={`
        fixed md:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1 shadow-sm transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-8 px-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white">
            <Package size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#1a1a1a]">MrLogistic</h1>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {isCourierView ? 'Vista Repartidor' : 'Panel de Gestión'}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 mt-2">
          {menuItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeSidebar}
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
        
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="px-3 py-2 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isCourierView ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-[#FF6B00]'}`}>
              {isCourierView ? 'DP' : 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black">{rol || 'Sin Rol'}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main content - layout flat */}
      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<PrivateRoute allowedRoles={['admin']}><Dashboard /></PrivateRoute>} />
            <Route path="/guias" element={<PrivateRoute allowedRoles={['admin']}><Guias /></PrivateRoute>} />
            <Route path="/mapa" element={<PrivateRoute allowedRoles={['admin']}><Mapa /></PrivateRoute>} />
            <Route path="/caja" element={<PrivateRoute allowedRoles={['admin']}><Caja /></PrivateRoute>} />
            <Route path="/reportes" element={<PrivateRoute allowedRoles={['admin']}><Reportes /></PrivateRoute>} />
            <Route path="/domiciliario" element={<PrivateRoute allowedRoles={['admin', 'domiciliario']}><Domiciliario /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificacionesProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </NotificacionesProvider>
    </AuthProvider>
  )
}

export default App
