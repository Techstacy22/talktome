import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-white px-4 py-6 shadow-sm">
        <h1 className="mb-8 text-xl font-bold text-indigo-600">TalkToMe</h1>
        <nav className="space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
          >
            📓 Journals
          </Link>
          <Link
            to="/dashboard/chat/new"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
          >
            💬 New Chat
          </Link>
        </nav>
        <div className="absolute bottom-6 left-0 w-60 px-4">
          <div className="mb-2 px-3 text-xs text-gray-400">{user?.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
