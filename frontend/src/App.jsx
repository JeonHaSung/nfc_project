import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import rootRouter from './router/rootRouter'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={rootRouter} />
    </AuthProvider>
  )
}

export default App
