import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Package, CheckCircle, X, Loader2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Domiciliario() {
  const [scanning, setScanning] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [loadingCode, setLoadingCode] = useState(false)
  
  // Lista local de guías del día escaneadas
  const [guias, setGuias] = useState([])
  
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)

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
    setErrorMsg(null)
    setScanning(true)
  }

  const handleScanSuccess = async (decodedText) => {
    await stopScanner()
    await searchGuide(decodedText)
  }

  const searchGuide = async (numero_guia) => {
    setLoadingCode(true)
    setErrorMsg(null)
    try {
      const { data, error } = await supabase
        .from('guias')
        .select('*')
        .eq('numero_guia', numero_guia)
        .eq('tipo', 'entrega')
        .single()

      if (error || !data) {
        setErrorMsg(`La guía ${numero_guia} no existe o no es de tipo entrega.`)
        return
      }

      if (data.entregado) {
        setErrorMsg(`La guía ${numero_guia} ya fue marcada como entregada.`)
        return
      }

      // Añadir a la lista si no está ya
      setGuias(prev => {
        if (prev.find(g => g.id === data.id)) return prev
        return [data, ...prev]
      })

    } catch (err) {
      setErrorMsg('Error buscando la guía: ' + err.message)
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

      // Quitar de la lista local
      setGuias(prev => prev.filter(g => g.id !== id))
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
        () => {} // Ignorar errores de escaneo continuo
      ).catch(err => {
        setScanning(false)
        setErrorMsg('No se pudo acceder a la cámara. ' + err.message)
      })
    }

    return () => {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {})
      }
    }
  }, [scanning])

  const paymentColors = {
    nequi: 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20',
    pago_directo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    efectivo: 'bg-amber-100 text-amber-700 border-amber-200'
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight">Mi Ruta</h1>
          <p className="text-gray-500 text-xs mt-0.5">Escaneo y entregas del día</p>
        </div>
        <div className="bg-orange-50 text-[#FF6B00] px-2 py-1 rounded text-[10px] font-black uppercase border border-orange-100">
          En línea
        </div>
      </div>

      {/* Sección 1: Escáner */}
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
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">Escanear Guía</h3>
            <p className="text-[11px] text-gray-400 mb-4 px-4">Añade guías escaneando el código de barras o QR.</p>

            <button
              onClick={startScanner}
              disabled={loadingCode}
              className="w-full bg-[#FF6B00] hover:bg-[#e66000] disabled:opacity-50 text-white px-4 py-3 font-black transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-100 rounded text-sm"
            >
              {loadingCode ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />}
              {loadingCode ? 'Buscando...' : 'Escanear Ahora'}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="w-full mt-3 bg-red-50 border border-red-100 px-3 py-2 text-red-600 text-[11px] font-bold rounded">
            {errorMsg}
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
                searchGuide(e.target.value);
                e.target.value = '';
              }
            }}
         />
      </div>

      {/* Sección 2: Lista de Entregas */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
            <Package size={14} className="text-[#FF6B00]" />
            Pendientes ({guias.length})
          </h3>
          {guias.length > 0 && (
            <button className="text-[10px] font-bold text-[#FF6B00] hover:underline" onClick={() => setGuias([])}>
              Limpiar todo
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {guias.length === 0 ? (
            <div className="bg-white border border-gray-100 border-dashed py-8 px-4 text-center text-gray-300 text-[11px] font-bold rounded">
              No tienes guías cargadas para entrega.
            </div>
          ) : (
            guias.map((g) => (
              <div key={g.id} className="bg-white border border-gray-100 p-3 shadow-sm rounded flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-black text-[#1a1a1a] text-sm">{g.numero_guia}</span>
                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase border w-fit ${paymentColors[g.metodo_pago] || 'bg-gray-100'}`}>
                      {g.metodo_pago?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-bold text-gray-300">Cobrar</p>
                    <p className="font-black text-emerald-600 text-sm">
                      ${parseFloat(g.monto).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                {g.observaciones && (
                  <div className="bg-orange-50/50 p-1.5 text-[10px] text-[#CC5500] font-bold border-l-2 border-[#FF6B00] rounded-r">
                    {g.observaciones}
                  </div>
                )}

                <button
                  onClick={() => markAsDelivered(g.id)}
                  className="mt-1 w-full bg-[#1a1a1a] hover:bg-black text-white px-4 py-2.5 font-bold transition-colors flex items-center justify-center gap-2 rounded text-xs shadow-sm"
                >
                  <CheckCircle size={16} />
                  Confirmar Entrega
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
