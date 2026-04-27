import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Wallet, 
  Lock, 
  Unlock, 
  Banknote, 
  User, 
  TrendingUp, 
  ArrowRight, 
  Loader2, 
  History,
  AlertCircle,
  Coins,
  Receipt,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function Caja() {
  const [activeCaja, setActiveCaja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guias, setGuias] = useState([])
  const [saving, setSaving] = useState(false)

  // History State
  const [historial, setHistorial] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState(null)
  const itemsPerPage = 10

  // Form states
  const [openForm, setOpenForm] = useState({
    nombre_apertura: '',
    base_caja: '',
    base_domiciliario: ''
  })
  const [closeForm, setCloseForm] = useState({
    nombre_cierre: '',
    observaciones_cierre: ''
  })

  useEffect(() => {
    fetchActiveCaja()
    fetchHistory()
  }, [])

  async function fetchActiveCaja() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('caja')
        .select('*')
        .eq('estado', 'abierta')
        .maybeSingle()
      
      if (data) {
        setActiveCaja(data)
        fetchDayGuides(data.fecha_apertura)
      } else {
        setActiveCaja(null)
      }
    } catch (error) {
      console.error('Error fetching caja:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    try {
      setHistoryLoading(true)
      const { data, error } = await supabase
        .from('caja')
        .select('*')
        .eq('estado', 'cerrada')
        .order('fecha_cierre', { ascending: false })
      
      if (error) throw error
      setHistorial(data || [])
    } catch (error) {
      console.error('Error fetching history:', error.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function fetchDayGuides(since) {
    const { data } = await supabase
      .from('guias')
      .select('*')
      .gte('fecha_registro', since)
    
    setGuias(data || [])
  }

  const stats = useMemo(() => {
    if (!activeCaja) return null

    const oficina = guias
      .filter(g => !g.domiciliario_id)
      .reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0)

    const domRecaudado = guias
      .filter(g => g.domiciliario_id && g.entregado)
      .reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0)

    const baseCaja = parseFloat(activeCaja.base_caja) || 0
    const baseDom = parseFloat(activeCaja.base_domiciliario) || 0

    return {
      oficina,
      domRecaudado,
      totalCaja: baseCaja + oficina + domRecaudado - baseDom,
      totalDom: baseDom + domRecaudado
    }
  }, [guias, activeCaja])

  async function handleOpen(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('caja')
        .insert([{
          ...openForm,
          base_caja: parseFloat(openForm.base_caja) || 0,
          base_domiciliario: parseFloat(openForm.base_domiciliario) || 0,
          estado: 'abierta'
        }])
      
      if (error) throw error
      fetchActiveCaja()
    } catch (err) {
      alert('Error al abrir caja: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleClose(e) {
    e.preventDefault()
    if (!window.confirm('¿Estás seguro de cerrar la caja? Esta acción es irreversible.')) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('caja')
        .update({
          ...closeForm,
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
          total_recaudado_oficina: stats.oficina,
          total_recaudado_domiciliario: stats.domRecaudado,
          total_esperado_caja: stats.totalCaja
        })
        .eq('id', activeCaja.id)
      
      if (error) throw error
      setActiveCaja(null)
      setGuias([])
      fetchHistory()
    } catch (err) {
      alert('Error al cerrar caja: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Pagination Logic
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return historial.slice(start, start + itemsPerPage)
  }, [historial, currentPage])

  const totalPages = Math.ceil(historial.length / itemsPerPage)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mb-2" size={32} />
      <p className="text-sm font-bold">Cargando módulo de caja...</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-8 pb-10">
      {!activeCaja ? (
        <div className="max-w-md mx-auto mt-10 w-full">
          <div className="bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-[#FF6B00] p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Unlock size={32} />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Apertura de Caja</h1>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Nuevo Turno</p>
            </div>

            <form onSubmit={handleOpen} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <User size={12} className="text-[#FF6B00]" />
                  Responsable de Apertura
                </label>
                <input
                  required
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full bg-gray-50 border-b-2 border-gray-200 px-4 py-3 text-sm font-bold focus:border-[#FF6B00] outline-none transition-colors"
                  value={openForm.nombre_apertura}
                  onChange={e => setOpenForm({...openForm, nombre_apertura: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <Banknote size={12} className="text-emerald-500" />
                    Base Caja
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-b-2 border-gray-200 px-4 py-3 text-sm font-black focus:border-emerald-500 outline-none transition-colors"
                    value={openForm.base_caja}
                    onChange={e => setOpenForm({...openForm, base_caja: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                    <TrendingUp size={12} className="text-blue-500" />
                    Base Domiciliario
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-b-2 border-gray-200 px-4 py-3 text-sm font-black focus:border-blue-500 outline-none transition-colors"
                    value={openForm.base_domiciliario}
                    onChange={e => setOpenForm({...openForm, base_domiciliario: e.target.value})}
                  />
                </div>
              </div>

              <button
                disabled={saving}
                className="w-full bg-[#FF6B00] hover:bg-[#e66000] text-white py-4 font-black transition-all flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-orange-200 active:scale-95"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Unlock size={20} />}
                ABRIR CAJA AHORA
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Header Caja Abierta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Caja en curso</span>
              </div>
              <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight flex items-center gap-2">
                Gestión de Caja
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full flex items-center justify-center font-black text-sm">
                {activeCaja.nombre_apertura.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#1a1a1a]">{activeCaja.nombre_apertura}</span>
                <span className="text-[10px] font-bold text-gray-400">Abrió: {new Date(activeCaja.fecha_apertura).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Grid de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Recaudado Oficina" 
              amount={stats.oficina} 
              icon={<Receipt size={20} />} 
              color="blue"
            />
            <StatCard 
              title="Recaudado Dom." 
              amount={stats.domRecaudado} 
              icon={<TrendingUp size={20} />} 
              color="purple"
            />
            <StatCard 
              title="Esperado en Caja" 
              amount={stats.totalCaja} 
              icon={<Banknote size={20} />} 
              color="emerald"
              highlight
            />
            <StatCard 
              title="Debe Entregar Dom." 
              amount={stats.totalDom} 
              icon={<Coins size={20} />} 
              color="orange"
            />
          </div>

          {/* Info Bases & Cierre */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                 <h3 className="text-sm font-black text-[#1a1a1a] mb-4 flex items-center gap-2">
                   <History size={16} className="text-gray-400" />
                   Detalle de Bases Iniciales
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-xs font-bold text-gray-500">Base Inicial Caja (Físico)</span>
                       <span className="font-black text-sm text-[#1a1a1a]">${parseFloat(activeCaja.base_caja).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-xs font-bold text-gray-500">Base Entregada a Domiciliario</span>
                       <span className="font-black text-sm text-[#1a1a1a]">${parseFloat(activeCaja.base_domiciliario).toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
                    <AlertCircle size={20} className="text-[#FF6B00] shrink-0" />
                    <p className="text-[11px] font-medium text-[#CC5500] leading-relaxed">
                      El "Total Esperado en Caja" contempla el dinero base inicial, más todo lo recaudado hoy, restando lo que se le entregó al domiciliario como base.
                    </p>
                 </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden self-start">
              <div className="bg-red-500 p-4 text-white">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Lock size={16} />
                  CIERRE DE CAJA
                </h3>
              </div>
              <form onSubmit={handleClose} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Responsable del Cierre</label>
                  <input
                    required
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full bg-gray-50 border-b-2 border-gray-200 px-3 py-2 text-sm font-bold focus:border-red-500 outline-none transition-colors"
                    value={closeForm.nombre_cierre}
                    onChange={e => setCloseForm({...closeForm, nombre_cierre: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Observaciones Finales</label>
                  <textarea
                    placeholder="¿Novedades en el turno?"
                    rows="3"
                    className="w-full bg-gray-50 border border-gray-200 p-3 text-xs font-medium focus:border-red-500 outline-none transition-colors rounded-lg resize-none"
                    value={closeForm.observaciones_cierre}
                    onChange={e => setCloseForm({...closeForm, observaciones_cierre: e.target.value})}
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 font-black transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-red-100 active:scale-95"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Lock size={16} />}
                    CERRAR CAJA DEFINITIVO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Cierres */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1a1a1a] flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
              <History size={20} />
            </div>
            Historial de Caja
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-gray-400 uppercase">Pág {currentPage} de {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-300">
               <Loader2 className="animate-spin mb-2" />
               <span className="text-xs font-bold uppercase tracking-widest">Buscando registros...</span>
            </div>
          ) : historial.length === 0 ? (
            <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">
              No hay cierres registrados aún
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 hidden md:table-cell">Apertura</th>
                  <th className="px-6 py-4">Cierre (Responsable)</th>
                  <th className="px-6 py-4 text-right">Total Esperado</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      className={`
                        cursor-pointer transition-colors hover:bg-orange-50/30
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                      `}
                      onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400">{new Date(item.fecha_apertura).toLocaleDateString()}</span>
                           <span className="text-[9px] text-gray-300 font-medium">
                             {new Date(item.fecha_apertura).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                             {new Date(item.fecha_cierre).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-xs font-bold text-orange-500">{item.nombre_apertura}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-orange-600">{item.nombre_cierre}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-600">
                          ${parseFloat(item.total_esperado_caja).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expandedRow === item.id ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
                      </td>
                    </tr>
                    
                    {/* Acordeón de Detalles */}
                    {expandedRow === item.id && (
                      <tr className="bg-orange-50/10">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-white border border-orange-100 rounded-xl shadow-inner">
                             <div className="space-y-1">
                               <p className="text-[9px] font-black text-gray-400 uppercase">Base Caja</p>
                               <p className="text-xs font-bold text-gray-700">${parseFloat(item.base_caja).toLocaleString()}</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[9px] font-black text-gray-400 uppercase">Base Domiciliario</p>
                               <p className="text-xs font-bold text-gray-700">${parseFloat(item.base_domiciliario).toLocaleString()}</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[9px] font-black text-gray-400 uppercase">Recaudado Oficina</p>
                               <p className="text-xs font-bold text-gray-700">${parseFloat(item.total_recaudado_oficina).toLocaleString()}</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[9px] font-black text-gray-400 uppercase">Recaudado Dom.</p>
                               <p className="text-xs font-bold text-gray-700">${parseFloat(item.total_recaudado_domiciliario).toLocaleString()}</p>
                             </div>
                             <div className="col-span-2 md:col-span-4 pt-2 border-t border-gray-50">
                               <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Observaciones de Cierre</p>
                               <p className="text-xs text-gray-500 italic font-medium">"{item.observaciones_cierre || 'Sin observaciones'}"</p>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

import React from 'react' // Para React.Fragment en el bucle

function StatCard({ title, amount, icon, color, highlight }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    orange: 'text-orange-600 bg-orange-50'
  }

  return (
    <div className={`bg-white border ${highlight ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-gray-200'} p-5 rounded-2xl shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        {highlight && (
          <span className="text-[8px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Dato Clave</span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{title}</p>
      <p className={`text-xl font-black ${highlight ? 'text-emerald-700' : 'text-[#1a1a1a]'}`}>
        ${(amount || 0).toLocaleString('es-CO')}
      </p>
    </div>
  )
}
