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
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full pb-20">
      <div>
        <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Mi Ruta</h1>
        <p className="text-gray-500 text-sm mt-1">Escanea y entrega tus guías del día</p>
      </div>

      {/* Sección 1: Escáner */}
      <div className="bg-white border-l-4 border-[#FF6B00] border-y border-r border-gray-200 p-5 flex flex-col items-center justify-center text-center">
        {scanning ? (
          <div className="w-full relative">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden border border-gray-200 bg-black aspect-square" />
            <button
              onClick={stopScanner}
              className="mt-4 w-full bg-red-50 text-red-600 hover:bg-red-100 px-4 py-3 font-bold transition-colors flex items-center justify-center gap-2 rounded border border-red-200"
            >
              <X size={20} />
              Detener Escáner
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full flex items-center justify-center mb-4">
              <QrCode size={32} />
            </div>
            <h3 className="text-base font-bold text-[#1a1a1a] mb-2">Escanear Guía</h3>
            <p className="text-xs text-gray-500 mb-6">Usa la cámara para agregar guías a tu lista de entregas.</p>

            <button
              onClick={startScanner}
              disabled={loadingCode}
              className="w-full bg-[#FF6B00] hover:bg-[#e66000] disabled:opacity-50 text-white px-4 py-3.5 font-black transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-200"
            >
              {loadingCode ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}
              {loadingCode ? 'Buscando...' : 'Escanear Ahora'}
            </button>
          </>
        )}

        {errorMsg && (
          <div className="w-full mt-4 bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-bold rounded">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Buscador Manual de Emergencia */}
      <div className="bg-white border border-gray-200 p-4 flex gap-2">
         <input 
            type="text" 
            placeholder="O ingresar código manual..." 
            className="flex-1 bg-[#FAFAFA] border border-gray-200 px-3 py-2 text-sm focus:border-[#FF6B00] outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                searchGuide(e.target.value);
                e.target.value = '';
              }
            }}
         />
      </div>

      {/* Sección 2: Lista de Entregas */}
      <div>
        <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Package size={18} className="text-[#FF6B00]" />
          Por Entregar ({guias.length})
        </h3>

        <div className="flex flex-col gap-3">
          {guias.length === 0 ? (
            <div className="bg-[#FAFAFA] border border-gray-200 border-dashed p-8 text-center text-gray-400 text-sm font-bold">
              Escanea una guía para comenzar tu ruta.
            </div>
          ) : (
            guias.map((g) => (
              <div key={g.id} className="bg-white border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-[#1a1a1a] text-lg">{g.numero_guia}</h4>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${paymentColors[g.metodo_pago] || 'bg-gray-100'}`}>
                      {g.metodo_pago?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Valor a cobrar</p>
                    <p className="font-black text-emerald-600 text-lg">
                      ${parseFloat(g.monto).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                {g.observaciones && (
                  <div className="bg-[#FFF0E6] p-2 text-xs text-[#CC5500] font-medium border-l-2 border-[#FF6B00]">
                    <strong>Nota:</strong> {g.observaciones}
                  </div>
                )}

                <button
                  onClick={() => markAsDelivered(g.id)}
                  className="mt-2 w-full bg-[#1a1a1a] hover:bg-black text-white px-4 py-3 font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Marcar Entregado
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
