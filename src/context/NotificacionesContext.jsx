import { createContext, useContext, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const NotificacionesContext = createContext()

export function NotificacionesProvider({ children }) {
  const { user, rol } = useAuth()

  useEffect(() => {
    if (!user || rol !== 'admin') return

    // 1. Suscripción en tiempo real
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guias' },
        (payload) => {
          if (payload.new.domiciliario_id) {
            toast(`📦 Nueva guía #${payload.new.numero_guia} registrada en ruta`, {
              icon: '📦',
              duration: 4000
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'guias' },
        (payload) => {
          // Entrega completada: old.entregado era false, new.entregado es true
          if (!payload.old.entregado && payload.new.entregado) {
            toast.success(`✓ Guía #${payload.new.numero_guia} entregada por el domiciliario`, {
              duration: 5000,
              style: {
                borderLeft: '4px solid #10b981'
              }
            })
          }
        }
      )
      .subscribe()

    // 2. Revisión periódica de guías sin bajar
    const checkPendingGuides = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      
      const { data, count, error } = await supabase
        .from('guias')
        .select('*', { count: 'exact', head: true })
        .eq('entregado', true)
        .eq('bajado_sistema', false)
        .lt('fecha_registro', twoHoursAgo)

      if (count > 0) {
        toast.error(`⚠️ ${count} guías entregadas pendientes de bajar del sistema`, {
          duration: 6000,
          style: {
            borderLeft: '4px solid #ef4444'
          }
        })
      }
    }

    // Ejecutar al inicio y cada hora
    checkPendingGuides()
    const interval = setInterval(checkPendingGuides, 3600000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user, rol])

  return (
    <NotificacionesContext.Provider value={{}}>
      {children}
    </NotificacionesContext.Provider>
  )
}

export const useNotificaciones = () => useContext(NotificacionesContext)
