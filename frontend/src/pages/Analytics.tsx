import { useEffect, useState } from "react";
import api from "../lib/api";

interface ActivityDay {
  date: string;
  journals: number;
  chats: number;
}

interface TopConcept {
  label: string;
  category: string;
  weight: number;
}

interface WritingStats {
  total_journals: number;
  total_chats: number;
  total_words: number;
  avg_words_per_journal: number;
  longest_streak: number;
  memories_count: number;
}

interface AnalyticsData {
  stats: WritingStats;
  activity: ActivityDay[];
  top_concepts: TopConcept[];
  ai_narrative: string | null;
}

const CAT_COLOR: Record<string, string> = {
  goal: "bg-purple-400",
  challenge: "bg-amber-400",
  interest: "bg-green-400",
  person: "bg-blue-400",
  topic: "bg-indigo-400",
  emotion: "bg-pink-400",
  skill: "bg-teal-400",
};

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AnalyticsData>("/analytics/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  if (!data || (data.stats.total_journals === 0 && data.stats.total_chats === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-5xl">📊</p>
        <h2 className="mt-4 text-lg font-semibold text-gray-700">No data yet</h2>
        <p className="mt-1 text-sm text-gray-400">
          Write a journal or start a chat — your analytics will appear here.
        </p>
      </div>
    );
  }

  const { stats, activity, top_concepts, ai_narrative } = data;
  const maxActivity = Math.max(...activity.map((d) => d.journals + d.chats), 1);
  const maxWeight = Math.max(...top_concepts.map((c) => c.weight), 1);

  // Show every 5th day label
  const labelEvery = 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500">Your writing and growth at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        <StatCard label="Journals" value={fmt(stats.total_journals)} icon="📓" />
        <StatCard label="Chats" value={fmt(stats.total_chats)} icon="💬" />
        <StatCard label="Words written" value={fmt(stats.total_words)} icon="✍️" />
        <StatCard label="Avg per journal" value={fmt(stats.avg_words_per_journal)} icon="📏" />
        <StatCard label="Longest streak" value={`${stats.longest_streak}d`} icon="🔥" highlight={stats.longest_streak >= 3} />
        <StatCard label="Memories" value={fmt(stats.memories_count)} icon="🧠" />
      </div>

      {/* AI Narrative */}
      {ai_narrative && (
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            ✨ AI Insight
          </p>
          <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-200">{ai_narrative}</p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Activity chart */}
        <section className="col-span-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Activity — last 30 days</h2>
          <div className="flex items-end gap-0.5 h-28">
            {activity.map((day, i) => {
              const total = day.journals + day.chats;
              const heightPct = total === 0 ? 0 : Math.max(4, Math.round((total / maxActivity) * 100));
              const showLabel = i % labelEvery === 0;
              return (
                <div key={day.date} className="group relative flex flex-1 flex-col items-center">
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {dayLabel(day.date)}: {day.journals}j {day.chats}c
                  </div>
                  <div className="flex w-full flex-col-reverse" style={{ height: "7rem" }}>
                    {total > 0 ? (
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${heightPct}%`,
                          background: day.journals > 0 && day.chats > 0
                            ? "linear-gradient(to top, #818cf8, #6366f1)"
                            : day.journals > 0
                            ? "#6366f1"
                            : "#a5b4fc",
                        }}
                      />
                    ) : (
                      <div className="w-full rounded-t bg-gray-100" style={{ height: "4px" }} />
                    )}
                  </div>
                  {showLabel && (
                    <span className="mt-1 text-[9px] text-gray-300 rotate-0">
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Journal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-300" /> Chat
            </span>
          </div>
        </section>

        {/* Top concepts */}
        <section className="col-span-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Top concepts</h2>
          {top_concepts.length === 0 ? (
            <p className="text-xs text-gray-400">
              Process a journal in Mind Map to see your top concepts.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {top_concepts.map((c) => {
                const barPct = Math.max(6, Math.round((c.weight / maxWeight) * 100));
                const dot = CAT_COLOR[c.category] ?? "bg-gray-400";
                return (
                  <li key={c.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                        <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{c.label}</span>
                      </div>
                      <span className="ml-2 shrink-0 text-xs text-gray-400">×{c.weight}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-400 transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Heatmap legend / active-day summary */}
      <ActiveDaySummary activity={activity} />
    </div>
  );
}

function ActiveDaySummary({ activity }: { activity: ActivityDay[] }) {
  const activeDays = activity.filter((d) => d.journals > 0 || d.chats > 0).length;
  const journalDays = activity.filter((d) => d.journals > 0).length;
  const chatDays = activity.filter((d) => d.chats > 0).length;
  const busiest = [...activity].sort(
    (a, b) => b.journals + b.chats - (a.journals + a.chats)
  )[0];

  return (
    <div className="grid grid-cols-4 gap-4">
      <MiniStat label="Active days (30d)" value={String(activeDays)} sub="days with any activity" />
      <MiniStat label="Journal days" value={String(journalDays)} sub="days with a journal" />
      <MiniStat label="Chat days" value={String(chatDays)} sub="days with a conversation" />
      <MiniStat
        label="Busiest day"
        value={busiest && (busiest.journals + busiest.chats) > 0 ? dayLabel(busiest.date) : "—"}
        sub={
          busiest && (busiest.journals + busiest.chats) > 0
            ? `${busiest.journals + busiest.chats} activities`
            : "no data yet"
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
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
      <div className="text-xl">{icon}</div>
      <div className={`mt-1 text-xl font-bold ${highlight ? "text-orange-500" : "text-gray-800 dark:text-gray-100"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-300 dark:text-gray-600">{sub}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 rounded bg-gray-200" />
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="h-16 rounded-xl bg-gray-100" />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 h-52 rounded-xl bg-gray-100" />
        <div className="col-span-2 h-52 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
