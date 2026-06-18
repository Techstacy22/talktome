import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

// Eagerly load auth pages (first interaction)
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy load everything else — each page gets its own chunk
const Onboarding   = lazy(() => import("./pages/Onboarding"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const MindMap      = lazy(() => import("./pages/MindMap"));
const Tasks        = lazy(() => import("./pages/Tasks"));
const Memories     = lazy(() => import("./pages/Memories"));
const Analytics    = lazy(() => import("./pages/Analytics"));
const JournalList  = lazy(() => import("./pages/JournalList"));
const JournalNew   = lazy(() => import("./pages/JournalNew"));
const JournalEdit  = lazy(() => import("./pages/JournalEdit"));
const ChatNew      = lazy(() => import("./pages/ChatNew"));
const Chat         = lazy(() => import("./pages/Chat"));
const NotFound     = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
