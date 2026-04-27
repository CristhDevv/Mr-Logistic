import { Package, Truck, CheckCircle, Clock } from 'lucide-react'

const stats = [
  { label: 'Total Guías', value: '0', icon: <Package size={20} />, color: 'bg-blue-50 text-blue-600' },
  { label: 'En Tránsito', value: '0', icon: <Truck size={20} />, color: 'bg-amber-50 text-amber-600' },
  { label: 'Entregadas', value: '0', icon: <CheckCircle size={20} />, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Pendientes', value: '0', icon: <Clock size={20} />, color: 'bg-[#FF6B00]/10 text-[#FF6B00]' },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Resumen de Operaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas generales en tiempo real</p>
      </div>

      <div className="bg-white border border-gray-200 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="flex-1 p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-3xl font-black text-[#1a1a1a]">{value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#FF6B00]" />
          Actividad Reciente
        </h3>
        <div className="bg-[#FAFAFA] border border-gray-100 p-8 text-center">
          <p className="text-sm font-medium text-gray-500">No hay actividad registrada aún.</p>
        </div>
      </div>
    </div>
  )
}
