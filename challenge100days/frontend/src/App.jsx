import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import FeedPage from './pages/FeedPage'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'

const isLandingMode = import.meta.env.VITE_LANDING_MODE !== 'false'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  return children
}

export default function App() {
  if (isLandingMode) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
