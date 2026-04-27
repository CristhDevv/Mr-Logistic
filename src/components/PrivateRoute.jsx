import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, rol, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(rol)) {
    return <Navigate to={rol === 'domiciliario' ? '/domiciliario' : '/'} replace />
  }

  return children
}
