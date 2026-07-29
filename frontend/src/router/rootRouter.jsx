/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import AdminLayout from '../common/layout/Layout'
import PublicLayout from '../common/layout/PublicLayout'

const LoginPage = lazy(() => import('../page/auth/LoginPage'))
const AdminPage = lazy(() => import('../page/admin/AdminPage'))
const StatisticsPage = lazy(() => import('../page/statistics/StatisticsPage'))
const StorePage = lazy(() => import('../page/store/StorePage'))
const TagPage = lazy(() => import('../page/tag/TagPage'))
const HomePage = lazy(() => import('../page/public/HomePage'))
const CompanyPage = lazy(() => import('../page/public/CompanyPage'))
const ProductsPage = lazy(() => import('../page/public/ProductsPage'))
const GuidePage = lazy(() => import('../page/public/GuidePage'))
const SupportPage = lazy(() => import('../page/public/SupportPage'))

function PageLoader() {
  return (
    <div className="route-loader" role="status">
      <span />
      페이지를 불러오는 중입니다
    </div>
  )
}

const withSuspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

const rootRouter = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'company', element: withSuspense(<CompanyPage />) },
      { path: 'products', element: withSuspense(<ProductsPage />) },
      { path: 'guide', element: withSuspense(<GuidePage />) },
      { path: 'support', element: withSuspense(<SupportPage />) },
    ],
  },
  { path: '/admin/login', element: withSuspense(<LoginPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/admin/management',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<StatisticsPage />) },
          { path: 'stores', element: withSuspense(<StorePage />) },
          { path: 'tags', element: withSuspense(<TagPage />) },
          {
            element: <ProtectedRoute requiredRole="MASTER" />,
            children: [
              { path: 'admins', element: withSuspense(<AdminPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default rootRouter
