import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import MindMap from "./pages/MindMap";
import Tasks from "./pages/Tasks";
import Memories from "./pages/Memories";
import Analytics from "./pages/Analytics";
import JournalList from "./pages/JournalList";
import JournalNew from "./pages/JournalNew";
import JournalEdit from "./pages/JournalEdit";
import ChatNew from "./pages/ChatNew";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter contents">
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="journals" element={<JournalList />} />
          <Route path="journals/new" element={<JournalNew />} />
          <Route path="journals/:id/edit" element={<JournalEdit />} />
          <Route path="chat/new" element={<ChatNew />} />
          <Route path="chat/:sessionId" element={<Chat />} />
          <Route path="mindmap" element={<MindMap />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="memories" element={<Memories />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AnimatedRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
