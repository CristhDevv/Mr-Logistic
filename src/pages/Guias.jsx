import { useState, useEffect } from 'react'
import { Search, Save, Loader2, Package, MapPin, Trash2, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Guias() {
  const [guias, setGuias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    numero_guia: '',
    monto: '',
    metodo_pago: 'nequi',
    tipo: 'envio',
    observaciones: ''
  })

  useEffect(() => {
    fetchGuias()

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('guias_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guias' },
        (payload) => {
          console.log('Cambio en tiempo real detectado:', payload);
          fetchGuias(); // Refrescar tabla
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [])

  async function fetchGuias() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('guias')
        .select('*')
        .order('fecha_registro', { ascending: false })
      
      if (error) throw error
      setGuias(data || [])
    } catch (error) {
      console.error('Error fetching guias:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const payload = {
        ...formData,
        monto: parseFloat(formData.monto) || 0
      }
      
      const { error } = await supabase
        .from('guias')
        .insert([payload])
      
      if (error) throw error
      
      setFormData({ numero_guia: '', monto: '', metodo_pago: 'nequi', tipo: 'envio', observaciones: '' })
      fetchGuias()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(id, field, currentValue) {
    const newValue = !currentValue; // Valor contrario
    try {
      // 1. Actualizar en Supabase primero
      const { error } = await supabase
        .from('guias')
        .update({ [field]: newValue })
        .eq('id', id);
      
      if (error) throw error;
      
      // 2. Solo si es exitoso, actualizar el estado local en React
      setGuias(prev => prev.map(g => 
        g.id === id ? { ...g, [field]: newValue } : g
      ));
    } catch (error) {
      // 3. En caso de error, no actualizar y mostrar por consola
      console.error('Error actualizando estado:', error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta guía?')) return
    
    try {
      const { error } = await supabase
        .from('guias')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      setGuias(prev => prev.filter(g => g.id !== id))
    } catch (error) {
      console.error('Error eliminando:', error.message)
    }
  }

  const filtered = guias.filter(g =>
    g.numero_guia.toLowerCase().includes(search.toLowerCase())
  )

  const paymentColors = {
    nequi: 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20',
    pago_directo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    efectivo: 'bg-amber-100 text-amber-700 border-amber-200'
  }

  const typeColors = {
    envio: 'bg-blue-100 text-blue-700',
    entrega: 'bg-purple-100 text-purple-700'
  }

  const PillButton = ({ label, value, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all duration-200 whitespace-nowrap ${
        active 
          ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm' 
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Gestión de Guías</h1>
          <p className="text-gray-500 text-sm mt-1">Registro y control de envíos/entregas</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6B00] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por número..."
            className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Formulario Inline (Sin cards, borde a la izquierda) */}
      <div className="bg-white border-l-4 border-[#FF6B00] border-y border-r border-gray-200 p-5 relative z-10">
        <form onSubmit={handleSubmit} className="flex flex-wrap xl:flex-nowrap gap-6 items-end">
          <div className="w-full lg:w-40 space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-400">Número Guía</label>
            <input
              required
              type="text"
              placeholder="G-0000"
              className="w-full bg-[#FAFAFA] border-b-2 border-gray-200 px-3 py-2 text-sm font-bold focus:border-[#FF6B00] outline-none transition-colors"
              value={formData.numero_guia}
              onChange={e => setFormData({ ...formData, numero_guia: e.target.value })}
            />
          </div>
          
          <div className="w-full lg:w-28 space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-400">Valor</label>
            <input
              required
              type="number"
              placeholder="0"
              className="w-full bg-[#FAFAFA] border-b-2 border-gray-200 px-3 py-2 text-sm font-bold focus:border-[#FF6B00] outline-none transition-colors"
              value={formData.monto}
              onChange={e => setFormData({ ...formData, monto: e.target.value })}
            />
          </div>

          <div className="w-full lg:w-auto space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-400">Método de Pago</label>
            <div className="flex gap-2 p-1 bg-gray-50 border border-gray-100 rounded-full w-fit">
              {[
                { id: 'nequi', label: 'Nequi' },
                { id: 'pago_directo', label: 'Pago Directo' },
                { id: 'efectivo', label: 'Efectivo' }
              ].map(opt => (
                <PillButton 
                  key={opt.id}
                  label={opt.label}
                  active={formData.metodo_pago === opt.id}
                  onClick={() => setFormData({ ...formData, metodo_pago: opt.id })}
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:w-auto space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-400">Tipo</label>
            <div className="flex gap-2 p-1 bg-gray-50 border border-gray-100 rounded-full w-fit">
              {[
                { id: 'envio', label: 'Envío' },
                { id: 'entrega', label: 'Entrega' }
              ].map(opt => (
                <PillButton 
                  key={opt.id}
                  label={opt.label}
                  active={formData.tipo === opt.id}
                  onClick={() => setFormData({ ...formData, tipo: opt.id })}
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:flex-1 space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-400">Observaciones</label>
            <input
              type="text"
              placeholder="Opcional..."
              className="w-full bg-[#FAFAFA] border-b-2 border-gray-200 px-3 py-2 text-sm focus:border-[#FF6B00] outline-none transition-colors"
              value={formData.observaciones}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

          <div className="w-full lg:w-auto">
            <button 
              disabled={saving}
              className="w-full lg:w-auto bg-[#FF6B00] hover:bg-[#e66000] text-white px-8 py-2.5 font-bold transition-colors flex items-center justify-center gap-2 rounded shadow-md shadow-orange-200"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla (Flat layout) */}
      <div className="bg-white border border-gray-200 w-full overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-[#FFF0E6] border-b border-[#FF6B00]/20">
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest">Número</th>
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest">Tipo</th>
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest">Valor</th>
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest">Pago</th>
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest">Sistema</th>
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest">Observaciones</th>
              <th className="px-4 py-3 text-[#CC5500] font-black uppercase text-[10px] tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto mb-2 text-[#FF6B00]" size={24} />
                  Cargando datos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-sm">
                  Sin registros
                </td>
              </tr>
            ) : (
              filtered.map((g, idx) => (
                <tr key={g.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} hover:bg-orange-50/50 transition-colors`}>
                  <td className="px-4 py-3">
                    <span className="font-black text-[#1a1a1a] text-sm">{g.numero_guia}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[g.tipo] || 'bg-gray-100'}`}>
                        {g.tipo}
                      </span>
                      {g.tipo === 'entrega' && (
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${g.entregado ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-[#FF6B00] border-orange-200'}`}>
                          {g.entregado ? 'Entregado' : 'Por entregar'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#1a1a1a] text-sm">
                      ${parseFloat(g.monto).toLocaleString('es-CO')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${paymentColors[g.metodo_pago] || 'bg-gray-100'}`}>
                      {g.metodo_pago?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(g.id, 'bajado_sistema', g.bajado_sistema)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors border flex items-center gap-1.5 w-fit ${
                        g.bajado_sistema 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                          : 'bg-orange-50 border-orange-200 text-[#FF6B00] hover:bg-orange-100'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${g.bajado_sistema ? 'bg-emerald-500' : 'bg-[#FF6B00]'}`} />
                      {g.bajado_sistema ? 'Sincronizado' : 'Pendiente'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 max-w-[200px] truncate block" title={g.observaciones}>
                      {g.observaciones || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(g.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
