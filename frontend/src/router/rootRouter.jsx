/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import AdminLayout from '../common/layout/Layout'
import PublicLayout from '../common/layout/PublicLayout'

const LoginPage = lazy(() => import('../page/auth/LoginPage'))
const StatisticsPage = lazy(() => import('../page/statistics/StatisticsPage'))
const StorePage = lazy(() => import('../page/store/StorePage'))
const StoreCardsPage = lazy(() => import('../page/store/StoreCardsPage'))
const TagFactoryPage = lazy(() => import('../page/tag/TagFactoryPage'))
const OnboardingPage = lazy(() => import('../page/onboarding/OnboardingPage'))
const OnboardingCompletePage = lazy(() => import('../page/onboarding/OnboardingCompletePage'))
const HomePage = lazy(() => import('../page/public/HomePage'))
const CompanyPage = lazy(() => import('../page/public/CompanyPage'))
const ProductsPage = lazy(() => import('../page/public/ProductsPage'))
const GuidePage = lazy(() => import('../page/public/GuidePage'))
const SupportPage = lazy(() => import('../page/public/SupportPage'))
const TagNotReadyPage = lazy(async () => {
  const module = await import('../page/onboarding/TagStatusPages')
  return { default: module.TagNotReadyPage }
})
const TagNotFoundPage = lazy(async () => {
  const module = await import('../page/onboarding/TagStatusPages')
  return { default: module.TagNotFoundPage }
})

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
  { path: '/onboarding', element: withSuspense(<OnboardingPage />) },
  { path: '/onboarding/complete', element: withSuspense(<OnboardingCompletePage />) },
  { path: '/tag/not-ready', element: withSuspense(<TagNotReadyPage />) },
  { path: '/tag/not-found', element: withSuspense(<TagNotFoundPage />) },
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
          { path: 'stores/:storeId/cards', element: withSuspense(<StoreCardsPage />) },
          {
            element: <ProtectedRoute requiredRole="MASTER" />,
            children: [
              { path: 'tags', element: withSuspense(<TagFactoryPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default rootRouter
