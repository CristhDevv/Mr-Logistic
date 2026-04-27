import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Package, CheckCircle, X, Loader2, Search, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Domiciliario() {
  const [scanning, setScanning] = useState(false)
  const [warningMsg, setWarningMsg] = useState(null)
  const [loadingCode, setLoadingCode] = useState(false)
  const [domiciliario, setDomiciliario] = useState(null)
  
  // Lista de guías traídas de Supabase
  const [guias, setGuias] = useState([])
  
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)

  useEffect(() => {
    initDomiciliario()
  }, [])

  const initDomiciliario = async () => {
    try {
      // Obtenemos el domiciliario principal (el primero activo)
      const { data, error } = await supabase
        .from('domiciliarios')
        .select('*')
        .eq('activo', true)
        .limit(1)
        .single()
      
      if (error) throw error
      setDomiciliario(data)
      fetchGuias(data.id)
      subscribeToChanges(data.id)
    } catch (err) {
      console.error('Error inicializando domiciliario:', err.message)
    }
  }

  const fetchGuias = async (domId) => {
    const targetId = domId || domiciliario?.id
    if (!targetId) return

    const { data, error } = await supabase
      .from('guias')
      .select('*')
      .eq('domiciliario_id', targetId)
      .order('fecha_registro', { ascending: false })
    
    if (!error) setGuias(data || [])
  }

  const subscribeToChanges = (domId) => {
    const channel = supabase
      .channel(`guias_dom_${domId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guias', filter: `domiciliario_id=eq.${domId}` },
        () => fetchGuias(domId)
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop()
        html5QrRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setScanning(false)
  }

  const startScanner = async () => {
    setWarningMsg(null)
    setScanning(true)
  }

  const handleScanSuccess = async (decodedText) => {
    await stopScanner()
    await addGuide(decodedText)
  }

  const addGuide = async (numero_guia) => {
    if (!domiciliario) return
    setLoadingCode(true)
    setWarningMsg(null)
    
    try {
      const payload = {
        numero_guia,
        tipo: 'entrega',
        domiciliario_id: domiciliario.id,
        entregado: false,
        bajado_sistema: false,
        metodo_pago: 'pago_directo',
        monto: 0
      }

      const { error } = await supabase
        .from('guias')
        .insert([payload])

      if (error) {
        // Error de duplicado (unique constraint)
        if (error.code === '23505') {
          setWarningMsg(`La guía ${numero_guia} ya está registrada.`)
          setTimeout(() => setWarningMsg(null), 3000)
        } else {
          throw error
        }
      }
      
      // La lista se actualizará vía Realtime o fetchGuias manual si falla
      fetchGuias()

    } catch (err) {
      console.error('Error agregando guía:', err.message)
    } finally {
      setLoadingCode(false)
    }
  }

  const markAsDelivered = async (id) => {
    try {
      const { error } = await supabase
        .from('guias')
        .update({ 
          entregado: true, 
          fecha_entrega: new Date().toISOString() 
        })
        .eq('id', id)
      
      if (error) throw error
    } catch (err) {
      alert('Error al marcar como entregado: ' + err.message)
    }
  }

  useEffect(() => {
    if (scanning) {
      const qr = new Html5Qrcode('qr-reader')
      html5QrRef.current = qr

      qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {} 
      ).catch(err => {
        setScanning(false)
        console.error(err)
      })
    }

    return () => {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {})
      }
    }
  }, [scanning])

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight">Mi Ruta</h1>
          <p className="text-gray-500 text-xs mt-0.5">Repartidor: <span className="font-bold text-[#FF6B00]">{domiciliario?.nombre || '...'}</span></p>
        </div>
        <div className="bg-orange-50 text-[#FF6B00] px-2 py-1 rounded text-[10px] font-black uppercase border border-orange-100">
          En línea
        </div>
      </div>

      {/* Sección 1: Registro Automático */}
      <div className="bg-white border-l-4 border-[#FF6B00] border-y border-r border-gray-200 p-4 flex flex-col items-center justify-center text-center shadow-sm">
        {scanning ? (
          <div className="w-full relative">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden border border-gray-200 bg-black aspect-square" />
            <button
              onClick={stopScanner}
              className="mt-3 w-full bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 font-bold transition-colors flex items-center justify-center gap-2 rounded border border-red-200 text-sm"
            >
              <X size={18} />
              Cerrar Cámara
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-12 h-12 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full flex items-center justify-center mb-3">
              <QrCode size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">Registrar Nueva Guía</h3>
            <p className="text-[11px] text-gray-400 mb-4 px-4">Escanea o ingresa para registrar automáticamente en sistema.</p>

            <button
              onClick={startScanner}
              disabled={loadingCode || !domiciliario}
              className="w-full bg-[#FF6B00] hover:bg-[#e66000] disabled:opacity-50 text-white px-4 py-3 font-black transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-100 rounded text-sm"
            >
              {loadingCode ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />}
              {loadingCode ? 'Registrando...' : 'Escanear Ahora'}
            </button>
          </div>
        )}

        {warningMsg && (
          <div className="w-full mt-3 bg-orange-50 border border-orange-100 px-3 py-2 text-orange-600 text-[11px] font-bold rounded flex items-center gap-2 justify-center animate-pulse">
            <AlertCircle size={14} />
            {warningMsg}
          </div>
        )}
      </div>

      {/* Buscador Manual Minimalista */}
      <div className="bg-white border border-gray-200 p-3 flex gap-2 shadow-sm rounded">
         <Search size={16} className="text-gray-300 mt-1" />
         <input 
            type="text" 
            placeholder="Ingresar número manual..." 
            className="flex-1 bg-transparent text-sm focus:outline-none font-bold placeholder:font-normal placeholder:text-gray-300"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                addGuide(e.target.value);
                e.target.value = '';
              }
            }}
         />
      </div>

      {/* Sección 2: Lista Realtime */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
            <Package size={14} className="text-[#FF6B00]" />
            Listado del Día ({guias.length})
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          {guias.length === 0 ? (
            <div className="bg-white border border-gray-100 border-dashed py-8 px-4 text-center text-gray-300 text-[11px] font-bold rounded">
              No tienes guías registradas hoy.
            </div>
          ) : (
            guias.map((g) => (
              <div key={g.id} className={`bg-white border border-gray-100 p-3 shadow-sm rounded flex flex-col gap-2 transition-opacity ${g.entregado ? 'opacity-60' : 'opacity-100'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className={`font-black text-sm ${g.entregado ? 'text-gray-400 line-through' : 'text-[#1a1a1a]'}`}>
                      {g.numero_guia}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-bold uppercase text-gray-400 px-1 border border-gray-100 rounded">
                        {new Date(g.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {g.entregado && (
                        <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100">
                          Entregado
                        </span>
                      )}
                    </div>
                  </div>
                  {!g.entregado && (
                    <div className="text-right">
                      <button
                        onClick={() => markAsDelivered(g.id)}
                        className="bg-[#1a1a1a] hover:bg-black text-white px-4 py-2 font-bold transition-colors flex items-center justify-center gap-1.5 rounded text-[10px] shadow-sm"
                      >
                        <CheckCircle size={14} />
                        Entregar
                      </button>
                    </div>
                  )}
                </div>

                {g.observaciones && !g.entregado && (
                  <div className="bg-orange-50/50 p-1.5 text-[10px] text-[#CC5500] font-bold border-l-2 border-[#FF6B00] rounded-r">
                    {g.observaciones}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
