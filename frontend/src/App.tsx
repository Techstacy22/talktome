import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<JournalList />} />
            <Route path="journals/new" element={<JournalNew />} />
            <Route path="journals/:id/edit" element={<JournalEdit />} />
            <Route path="chat/new" element={<ChatNew />} />
            <Route path="chat/:sessionId" element={<Chat />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
