import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  BarChart3, 
  Calendar, 
  Package, 
  TrendingUp, 
  Wallet, 
  CheckCircle, 
  Clock, 
  ArrowRightLeft,
  Loader2,
  Filter,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default function Reportes() {
  const [period, setPeriod] = useState('hoy')
  const [customDates, setCustomDates] = useState({ desde: '', hasta: '' })
  const [guias, setGuias] = useState([])
  const [caja, setCaja] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [period, customDates])

  const fetchData = async () => {
    setLoading(true)
    try {
      let queryGuias = supabase.from('guias').select('*, domiciliarios(nombre)')
      let queryCaja = supabase.from('caja').select('*').eq('estado', 'cerrada')

      const range = getRange()
      if (range.desde) {
        queryGuias = queryGuias.gte('fecha_registro', range.desde)
        queryCaja = queryCaja.gte('fecha_apertura', range.desde)
      }
      if (range.hasta) {
        queryGuias = queryGuias.lte('fecha_registro', range.hasta)
        queryCaja = queryCaja.lte('fecha_cierre', range.hasta)
      }

      const [resGuias, resCaja] = await Promise.all([queryGuias, queryCaja])
      
      setGuias(resGuias.data || [])
      setCaja(resCaja.data || [])
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRange = () => {
    const now = new Date()
    let desde = null
    let hasta = null

    if (period === 'hoy') {
      const d = new Date(now)
      d.setHours(0,0,0,0)
      desde = d.toISOString()
    } else if (period === 'semana') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      desde = d.toISOString()
    } else if (period === 'mes') {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      desde = d.toISOString()
    } else if (period === 'personalizado') {
      if (customDates.desde) desde = new Date(customDates.desde).toISOString()
      if (customDates.hasta) {
        const h = new Date(customDates.hasta)
        h.setHours(23,59,59,999)
        hasta = h.toISOString()
      }
    }
    return { desde, hasta }
  }

  const stats = useMemo(() => {
    const total = guias.length
    const envios = guias.filter(g => g.tipo === 'envio').length
    const entregas = guias.filter(g => g.tipo === 'entrega').length
    const ingresos = guias.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0)
    const domEntregadas = guias.filter(g => g.domiciliario_id && g.entregado).length
    const pendientesSincro = guias.filter(g => !g.bajado_sistema).length

    return { total, envios, entregas, ingresos, domEntregadas, pendientesSincro }
  }, [guias])

  const paymentStats = useMemo(() => {
    const methods = {
      efectivo: { monto: 0, cant: 0 },
      nequi: { monto: 0, cant: 0 },
      pago_directo: { monto: 0, cant: 0 }
    }

    guias.forEach(g => {
      if (methods[g.metodo_pago]) {
        methods[g.metodo_pago].monto += (parseFloat(g.monto) || 0)
        methods[g.metodo_pago].cant += 1
      }
    })

    return methods
  }, [guias])

  const chartData = useMemo(() => {
    const days = {}
    guias.forEach(g => {
      const date = new Date(g.fecha_registro).toLocaleDateString()
      days[date] = (days[date] || 0) + 1
    })
    return Object.entries(days).map(([name, value]) => ({ name, value }))
  }, [guias])

  const cashStats = useMemo(() => {
    const aperturas = caja.length
    const totalBases = caja.reduce((acc, c) => acc + (parseFloat(c.base_caja) || 0), 0)
    const totalEsperado = caja.reduce((acc, c) => acc + (parseFloat(c.total_esperado_caja) || 0), 0)
    return { aperturas, totalBases, totalEsperado }
  }, [caja])

  // EXPORT FUNCTIONS
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Guias
    const guiasData = guias.map(g => ({
      'Número Guía': g.numero_guia,
      'Tipo': g.tipo,
      'Método Pago': g.metodo_pago,
      'Valor': g.monto,
      'Bajado Sistema': g.bajado_sistema ? 'SÍ' : 'NO',
      'Entregado': g.entregado ? 'SÍ' : 'NO',
      'Registrado por': g.domiciliarios?.nombre || 'Oficina',
      'Fecha': new Date(g.fecha_registro).toLocaleString()
    }))
    const wsGuias = XLSX.utils.json_to_sheet(guiasData)
    XLSX.utils.book_append_sheet(wb, wsGuias, 'Guías')

    // Sheet 2: Resumen
    const resumenData = [
      { Concepto: 'Total Guías', Valor: stats.total },
      { Concepto: 'Total Ingresos', Valor: stats.ingresos },
      { Concepto: 'Entregadas Domiciliario', Valor: stats.domEntregadas },
      { Concepto: 'Efectivo', Valor: paymentStats.efectivo.monto },
      { Concepto: 'Nequi', Valor: paymentStats.nequi.monto },
      { Concepto: 'Pago Directo', Valor: paymentStats.pago_directo.monto }
    ]
    const wsResumen = XLSX.utils.json_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // Sheet 3: Caja
    const cajaData = caja.map(c => ({
      'Fecha Apertura': new Date(c.fecha_apertura).toLocaleString(),
      'Fecha Cierre': new Date(c.fecha_cierre).toLocaleString(),
      'Abrió': c.nombre_apertura,
      'Cerró': c.nombre_cierre,
      'Base Caja': c.base_caja,
      'Base Dom': c.base_domiciliario,
      'Recaudado Ofi': c.total_recaudado_oficina,
      'Recaudado Dom': c.total_recaudado_domiciliario,
      'Total Esperado': c.total_esperado_caja,
      'Observaciones': c.observaciones_cierre
    }))
    const wsCaja = XLSX.utils.json_to_sheet(cajaData)
    XLSX.utils.book_append_sheet(wb, wsCaja, 'Caja')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `MrLogistic_Reporte_${dateStr}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const dateStr = new Date().toISOString().split('T')[0]

    // Header
    doc.setTextColor(255, 107, 0) // Naranja
    doc.setFontSize(22)
    doc.text('MrLogistic', 14, 20)
    
    doc.setTextColor(100)
    doc.setFontSize(10)
    doc.text(`REPORTE DE OPERACIÓN - PERÍODO: ${period.toUpperCase()}`, 14, 28)
    doc.text(`Fecha de exportación: ${new Date().toLocaleString()}`, 14, 33)

    // Table
    const tableData = guias.map(g => [
      g.numero_guia,
      g.tipo,
      g.metodo_pago,
      `$${parseFloat(g.monto).toLocaleString()}`,
      g.entregado ? 'SÍ' : 'NO',
      g.domiciliarios?.nombre || 'Oficina',
      new Date(g.fecha_registro).toLocaleDateString()
    ])

    doc.autoTable({
      startY: 40,
      head: [['Guía', 'Tipo', 'Pago', 'Valor', 'Entreg.', 'Registrado', 'Fecha']],
      body: tableData,
      headStyles: { fillColor: [255, 107, 0] },
      styles: { fontSize: 8 }
    })

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Resumen de Período:', 14, finalY)
    doc.setFontSize(10)
    doc.text(`Total Guías: ${stats.total}`, 14, finalY + 7)
    doc.text(`Total Ingresos: $${stats.ingresos.toLocaleString()}`, 14, finalY + 12)
    doc.text(`Entregadas Domiciliario: ${stats.domEntregadas}`, 14, finalY + 17)

    doc.save(`MrLogistic_Reporte_${dateStr}.pdf`)
  }

  const PillButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
        active 
          ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm' 
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight flex items-center gap-2">
            <BarChart3 className="text-[#FF6B00]" /> Inteligencia de Negocio
          </h1>
          <p className="text-gray-500 text-sm mt-1">Análisis de rendimiento y operación</p>
        </div>

        {/* Botones de Exportación y Selector */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#FF6B00] text-[#FF6B00] text-[10px] font-black uppercase rounded-lg hover:bg-orange-50 transition-colors"
            >
              <FileSpreadsheet size={14} /> Exportar Excel
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#FF6B00] text-[#FF6B00] text-[10px] font-black uppercase rounded-lg hover:bg-orange-50 transition-colors"
            >
              <FileText size={14} /> Exportar PDF
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-full w-fit shadow-sm">
            {['hoy', 'semana', 'mes', 'personalizado'].map(p => (
              <PillButton 
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                active={period === p}
                onClick={() => setPeriod(p)}
              />
            ))}
          </div>
          {period === 'personalizado' && (
            <div className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-300">
              <input 
                type="date" 
                className="text-[10px] font-bold border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#FF6B00]" 
                value={customDates.desde}
                onChange={e => setCustomDates({...customDates, desde: e.target.value})}
              />
              <span className="text-[10px] text-gray-400 font-bold">AL</span>
              <input 
                type="date" 
                className="text-[10px] font-bold border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#FF6B00]"
                value={customDates.hasta}
                onChange={e => setCustomDates({...customDates, hasta: e.target.value})}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest">Generando Reporte...</p>
        </div>
      ) : (
        <>
          {/* Sección 2: Resumen General */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
             <div className="flex items-center gap-10 min-w-max">
                <StatSimple label="Guías Totales" value={stats.total} icon={<Package size={14} />} color="orange" />
                <Divider />
                <StatSimple label="Envíos vs Entregas" value={`${stats.envios} / ${stats.entregas}`} icon={<ArrowRightLeft size={14} />} color="blue" />
                <Divider />
                <StatSimple label="Ingresos" value={`$${stats.ingresos.toLocaleString()}`} icon={<TrendingUp size={14} />} color="emerald" />
                <Divider />
                <StatSimple label="Entregadas Dom." value={stats.domEntregadas} icon={<CheckCircle size={14} />} color="purple" />
                <Divider />
                <StatSimple label="Pend. Sincro" value={stats.pendientesSincro} icon={<Clock size={14} />} color="red" />
             </div>
          </div>

          {/* Sección 3 & 5: Pagos y Caja */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
               <PaymentCard title="Efectivo" stats={paymentStats.efectivo} />
               <PaymentCard title="Nequi" stats={paymentStats.nequi} />
               <PaymentCard title="Pago Directo" stats={paymentStats.pago_directo} />
            </div>
            
            <div className="bg-[#1a1a1a] text-white rounded-2xl p-5 shadow-xl space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 <Wallet size={14} /> Resumen de Caja
               </h3>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Aperturas:</span>
                    <span className="text-sm font-black">{cashStats.aperturas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Suma Bases:</span>
                    <span className="text-sm font-black">${cashStats.totalBases.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-xs text-orange-400">Total Esperado:</span>
                    <span className="text-lg font-black text-[#FF6B00]">${cashStats.totalEsperado.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Sección 4: Gráfica */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-sm font-black text-[#1a1a1a] mb-6 flex items-center gap-2">
               <TrendingUp size={16} className="text-[#FF6B00]" /> 
               Volumen de Guías por Día
             </h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#fff5ed' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#FF6B00" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatSimple({ label, value, icon, color }) {
  const colors = {
    orange: 'text-[#FF6B00]',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
    red: 'text-red-500'
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-sm font-black ${colors[color] || 'text-[#1a1a1a]'}`}>{value}</div>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-8 bg-gray-100" />
}

function PaymentCard({ title, stats }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
       <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">{title}</p>
       <div className="flex justify-between items-end">
          <div className="text-xl font-black text-[#1a1a1a]">${stats.monto.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
            {stats.cant} guías
          </div>
       </div>
    </div>
  )
}
