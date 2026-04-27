import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateChallengePage from "./pages/CreateChallengePage.jsx";
import ChallengePage from "./pages/ChallengePage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-pixel text-xs text-slate-900">
        Загрузка...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/challenges/new"
          element={(
            <PrivateRoute>
              <CreateChallengePage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/challenges/:id"
          element={(
            <PrivateRoute>
              <ChallengePage />
            </PrivateRoute>
          )}
        />
      </Route>
    </Routes>
  );
}
