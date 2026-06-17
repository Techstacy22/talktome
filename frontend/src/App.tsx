import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import MindMap from "./pages/MindMap";
import JournalList from "./pages/JournalList";
import JournalNew from "./pages/JournalNew";
import JournalEdit from "./pages/JournalEdit";
import ChatNew from "./pages/ChatNew";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
