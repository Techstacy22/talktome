import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

interface Stats {
  total_journals: number;
  total_chats: number;
  journal_streak: number;
}

interface JournalSummary {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSummary {
  id: string;
  title: string | null;
  created_at: string;
}

interface DashboardData {
  stats: Stats;
  recent_journals: JournalSummary[];
  recent_chats: ChatSummary[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/dashboard/")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get<{ insight: string | null }>("/dashboard/insight")
      .then((res) => setInsight(res.data.insight))
      .catch(() => {})
      .finally(() => setInsightLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-14 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 rounded-xl bg-gray-200" />
          <div className="h-48 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="📓" label="Journals" value={data?.stats.total_journals ?? 0} />
        <StatCard icon="💬" label="Chats" value={data?.stats.total_chats ?? 0} />
        <StatCard
          icon="🔥"
          label="Day streak"
          value={data?.stats.journal_streak ?? 0}
          highlight={!!data?.stats.journal_streak}
        />
      </div>

      {/* AI Insight */}
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 px-5 py-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-400 dark:text-indigo-300">
          ✨ AI Insight
        </p>
        {insightLoading ? (
          <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-200" />
        ) : insight ? (
          <p className="text-sm text-indigo-800 dark:text-indigo-200">{insight}</p>
        ) : (
          <p className="text-sm italic text-indigo-300 dark:text-indigo-600">
            Write a journal or start a chat to get your first insight.
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Journals */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Journals</h2>
            <Link
              to="/dashboard/journals"
              className="text-xs text-indigo-500 hover:underline"
            >
              View all →
            </Link>
          </div>

          {data?.recent_journals.length ? (
            <ul className="space-y-2">
              {data.recent_journals.map((j) => (
                <li key={j.id}>
                  <Link
                    to={`/dashboard/journals/${j.id}/edit`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <span className="truncate font-medium text-gray-800 dark:text-gray-100">{j.title}</span>
                    <span className="ml-3 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(j.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              message="No journals yet."
              action={{ label: "Write your first", href: "/dashboard/journals/new" }}
            />
          )}

          <Link
            to="/dashboard/journals/new"
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-dashed border-indigo-200 dark:border-indigo-800 py-2 text-sm text-indigo-400 dark:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"
          >
            + New Journal
          </Link>
        </section>

        {/* Recent Chats */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Chats</h2>
          </div>

          {data?.recent_chats.length ? (
            <ul className="space-y-2">
              {data.recent_chats.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/dashboard/chat/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <span className="truncate font-medium text-gray-800 dark:text-gray-100">
                      {c.title ?? "Untitled chat"}
                    </span>
                    <span className="ml-3 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(c.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              message="No chats yet."
              action={{ label: "Start one", href: "/dashboard/chat/new" }}
            />
          )}

          <Link
            to="/dashboard/chat/new"
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-dashed border-indigo-200 dark:border-indigo-800 py-2 text-sm text-indigo-400 dark:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"
          >
            + New Chat
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
          : "border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <div className="text-2xl">{icon}</div>
      <div
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-orange-500" : "text-gray-800 dark:text-gray-100"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-4 py-6 text-center">
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
      <Link to={action.href} className="mt-1 inline-block text-xs text-indigo-500 hover:underline">
        {action.label}
      </Link>
    </div>
  );
}
