import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Package, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6B00] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-200">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight">MrLogistic</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Control de Operaciones</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-black text-[#1a1a1a] mb-6">Ingresar al sistema</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Mail size={12} className="text-[#FF6B00]" />
                Correo Electrónico
              </label>
              <input
                required
                type="email"
                placeholder="ejemplo@mrlogistic.com"
                className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-sm font-bold focus:border-[#FF6B00] outline-none transition-colors rounded-t-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Lock size={12} className="text-[#FF6B00]" />
                Contraseña
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-sm font-bold focus:border-[#FF6B00] outline-none transition-colors rounded-t-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-[#FF6B00] hover:bg-[#e66000] text-white py-4 font-black transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-orange-100 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'INGRESAR AHORA'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-gray-300 text-[10px] font-bold uppercase tracking-widest">
          © 2026 MrLogistic Systems
        </p>
      </div>
    </div>
  )
}
