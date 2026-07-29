import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="route-loader auth-route-loader" role="status">
        <span />
        관리자 인증을 확인하는 중입니다
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/admin/management/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
