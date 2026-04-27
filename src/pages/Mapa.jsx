import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from '../lib/supabase'

// Fix default icon for leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Custom Icons with SVGs
const courierIcon = new L.DivIcon({
  html: `<div style="background-color: #FF6B00; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const deliveryIcon = new L.DivIcon({
  html: `<div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 1px 6px rgba(0,0,0,0.2);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Helper component to recenter map
function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.panTo(center, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function Mapa() {
  const [couriers, setCouriers] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [mapCenter, setMapCenter] = useState([4.5709, -74.2973]) // Default: Colombia center

  const fetchData = useCallback(async () => {
    // 1. Fetch active couriers with location
    const { data: doms } = await supabase
      .from('domiciliarios')
      .select('*')
      .eq('activo', true)
      .not('latitud', 'is', null)
    
    setCouriers(doms || [])
    
    // Auto-center on first courier if available
    if (doms && doms.length > 0) {
      setMapCenter([doms[0].latitud, doms[0].longitud])
    }

    // 2. Fetch delivered guides with location
    const { data: guias } = await supabase
      .from('guias')
      .select('*')
      .eq('entregado', true)
      .not('latitud', 'is', null)
    
    setDeliveries(guias || [])
  }, [])

  useEffect(() => {
    fetchData()

    // Realtime subscription
    const channel = supabase
      .channel('map_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domiciliarios' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guias' }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchData])

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Monitor GPS</h1>
          <p className="text-gray-500 text-sm mt-1">Sincronización en vivo con repartidores y entregas</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Servicio Activo
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] bg-white border border-gray-200 relative z-0 shadow-sm overflow-hidden rounded-lg">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapAutoCenter center={mapCenter} />

          {/* Domiciliarios */}
          {couriers.map(c => (
            <Marker key={c.id} position={[c.latitud, c.longitud]} icon={courierIcon}>
              <Popup>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400">Repartidor</p>
                  <p className="font-black text-[#1a1a1a] text-sm">{c.nombre}</p>
                  <p className="text-[9px] text-emerald-600 font-bold">Activo ahora</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Entregas Realizadas */}
          {deliveries.map(d => (
            <Marker key={d.id} position={[d.latitud, d.longitud]} icon={deliveryIcon}>
              <Popup>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400">Entrega Exitosa</p>
                  <p className="font-black text-[#1a1a1a] text-sm">Guía: {d.numero_guia}</p>
                  <p className="text-[9px] text-gray-400">{new Date(d.fecha_entrega).toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Leyenda flat premium */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-gray-100 p-4 shadow-xl z-[400] rounded-xl flex flex-col gap-3 min-w-[150px]">
          <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50 pb-2">Monitor</h4>
          
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-[#FF6B00] rounded-full border-2 border-white shadow-sm"></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#1a1a1a]">Repartidor</span>
              <span className="text-[9px] text-gray-400 font-bold">En movimiento</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#1a1a1a]">Entrega OK</span>
              <span className="text-[9px] text-gray-400 font-bold">Punto GPS</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-50">
            <p className="text-[9px] text-gray-300 font-medium">Total repartidores: {couriers.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
