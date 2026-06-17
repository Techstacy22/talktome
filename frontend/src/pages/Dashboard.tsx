import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface Profile { first_name: string | null }

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const NAV = [
  { to: "/dashboard",          label: "Home",       icon: "🏠", end: true  },
  { to: "/dashboard/journals", label: "Journals",   icon: "📓", end: false },
  { to: "/dashboard/tasks",    label: "Tasks",      icon: "✅", end: false },
  { to: "/dashboard/chat/new", label: "New Chat",   icon: "💬", end: false },
  { to: "/dashboard/mindmap",  label: "Mind Map",   icon: "🧠", end: false },
  { to: "/dashboard/memories", label: "AI Memory",  icon: "💡", end: false },
  { to: "/dashboard/analytics",label: "Analytics",  icon: "📊", end: false },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Profile>("/profile/me").then((r) => setProfile(r.data)).catch(() => {});
  }, []);

  const displayName = profile?.first_name ?? user?.username ?? "there";

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white px-4 py-6 shadow-sm transition-transform duration-200 dark:border-gray-700 dark:bg-gray-800 md:static md:z-auto md:translate-x-0 md:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-indigo-600">TalkToMe</h1>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Greeting */}
        <div className="mb-6 rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-900/30">
          <p className="text-xs text-indigo-400">{getGreeting()},</p>
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">{displayName} 👋</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-indigo-400"
                }`
              }
            >
              {icon} {label}
            </NavLink>
          ))}
          <Link
            to="/onboarding"
            onClick={closeSidebar}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-indigo-400"
          >
            ✏️ Edit Profile
          </Link>
        </nav>

        {/* Bottom: theme toggle + user */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
          >
            {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
          <div className="px-3 text-xs text-gray-400 dark:text-gray-600">{user?.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 md:hidden">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-indigo-600">TalkToMe</span>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
