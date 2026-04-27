import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

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

const deliveries = [
  { id: 'G-001', lat: 4.710989, lng: -74.072092, label: 'G-001 - Envío' },
  { id: 'G-002', lat: 4.718136, lng: -74.049724, label: 'G-002 - Entrega' },
]

export default function Mapa() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Mapa de Entregas</h1>
        <p className="text-gray-500 text-sm mt-1">Monitoreo GPS en tiempo real</p>
      </div>

      <div className="flex-1 min-h-[500px] bg-white border border-gray-200 relative z-0">
        <MapContainer
          center={[4.710989, -74.072092]}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {deliveries.map(d => (
            <Marker key={d.id} position={[d.lat, d.lng]}>
              <Popup>
                <div className="text-center font-bold text-[#1a1a1a]">
                  {d.label}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Leyenda flat */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-gray-200 p-3 shadow-sm z-[400] flex flex-col gap-2">
          <h4 className="text-[10px] font-black uppercase text-gray-400">Leyenda</h4>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1a1a1a]">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Domiciliario
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1a1a1a]">
            <div className="w-3 h-3 bg-[#FF6B00] rounded-full"></div> Destino
          </div>
        </div>
      </div>
    </div>
  )
}
