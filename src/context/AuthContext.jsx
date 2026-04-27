import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserChange(session?.user ?? null)
    })

    // 2. Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserChange(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUserChange = async (authUser) => {
    if (authUser) {
      setUser(authUser)
      // Cargar perfil
      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      setPerfil(data)
    } else {
      setUser(null)
      setPerfil(null)
    }
    setLoading(false)
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, perfil, rol: perfil?.rol, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
