import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Profile {
  first_name: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    api
      .get<Profile>("/profile/me")
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = profile?.first_name ?? user?.username ?? "there";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="relative w-60 shrink-0 border-r bg-white px-4 py-6 shadow-sm">
        <h1 className="mb-8 text-xl font-bold text-indigo-600">TalkToMe</h1>

        {/* Greeting */}
        <div className="mb-6 rounded-xl bg-indigo-50 px-4 py-3">
          <p className="text-xs text-indigo-400">{getGreeting()},</p>
          <p className="font-semibold text-indigo-700">{displayName} 👋</p>
        </div>

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
          <Link
            to="/onboarding"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
          >
            ✏️ Edit Profile
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
