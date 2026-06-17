import { useEffect, useState } from "react";
import api from "../lib/api";

type Category = "goal" | "challenge" | "interest" | "preference" | "achievement" | "note";
type Source = "chat" | "journal" | "manual";

interface Memory {
  id: string;
  category: Category;
  content: string;
  source: Source;
  created_at: string;
}

interface JournalItem { id: string; title: string }
interface ChatItem { id: string; title: string | null }

const CAT_META: Record<Category, { label: string; icon: string; bg: string; text: string; border: string }> = {
  goal:        { label: "Goals",        icon: "🎯", bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  challenge:   { label: "Challenges",   icon: "⚡", bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200"  },
  interest:    { label: "Interests",    icon: "✨", bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200"  },
  preference:  { label: "Preferences",  icon: "🎛️", bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
  achievement: { label: "Achievements", icon: "🏆", bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200" },
  note:        { label: "Notes",        icon: "📌", bg: "bg-gray-50",    text: "text-gray-700",   border: "border-gray-200"   },
};

const SOURCE_LABEL: Record<Source, string> = {
  chat: "from chat",
  journal: "from journal",
  manual: "added manually",
};

const ALL_CATEGORIES = Object.keys(CAT_META) as Category[];

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractTab, setExtractTab] = useState<"journal" | "chat">("journal");
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ category: Category; content: string }>({
    category: "goal",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMemories();
    api.get<JournalItem[]>("/journals/").then((r) => setJournals(r.data.slice(0, 20))).catch(() => {});
    api.get<ChatItem[]>("/chat/sessions").then((r) => setChats(r.data.slice(0, 15))).catch(() => {});
  }, []);

  const loadMemories = () => {
    api
      .get<Memory[]>("/memories/")
      .then((r) => setMemories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/memories/${id}`);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleExtract = async (type: "journal" | "chat", id: string) => {
    setExtracting(true);
    setFeedback("");
    try {
      const res = await api.post<Memory[]>(`/memories/extract/${type}/${id}`);
      if (res.data.length === 0) {
        setFeedback("No new memories found — everything was already known.");
      } else {
        setMemories((prev) => [...res.data, ...prev]);
        setFeedback(`✓ ${res.data.length} new ${res.data.length === 1 ? "memory" : "memories"} saved`);
      }
    } catch {
      setFeedback("Extraction failed. Try again.");
    } finally {
      setExtracting(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<Memory>("/memories/", {
        category: addForm.category,
        content: addForm.content.trim(),
        source: "manual",
      });
      setMemories((prev) => [res.data, ...prev]);
      setAddForm({ category: "goal", content: "" });
      setShowAdd(false);
    } catch {}
    setSubmitting(false);
  };

  // Group by category
  const byCategory = ALL_CATEGORIES.reduce<Record<Category, Memory[]>>((acc, cat) => {
    acc[cat] = memories.filter((m) => m.category === cat);
    return acc;
  }, {} as Record<Category, Memory[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI Memory</h1>
          <p className="text-sm text-gray-400">
            {memories.length} {memories.length === 1 ? "memory" : "memories"} · injected into every chat
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add Memory
        </button>
      </div>

      {/* How it works banner */}
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">✨ How this works</p>
        <p className="text-sm text-indigo-700">
          Everything saved here is automatically included in your AI chat context. The more TalkToMe knows about you,
          the more personalized its responses become.
        </p>
      </div>

      {/* Manual add form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm space-y-3"
        >
          <div className="flex gap-3">
            <div className="w-40 shrink-0">
              <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
              <select
                aria-label="Memory category"
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as Category }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CAT_META[c].icon} {CAT_META[c].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">Memory</label>
              <input
                required
                placeholder='e.g. "Wants to work at Google after graduation"'
                value={addForm.content}
                onChange={(e) => setAddForm((f) => ({ ...f, content: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Memory grid */}
        <div className="col-span-3 space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <p className="text-4xl">🧠</p>
              <p className="mt-2 text-sm text-gray-400">No memories yet.</p>
              <p className="text-xs text-gray-300 mt-1">
                Extract from a journal or chat, or add one manually.
              </p>
            </div>
          ) : (
            ALL_CATEGORIES.filter((cat) => byCategory[cat].length > 0).map((cat) => {
              const meta = CAT_META[cat];
              return (
                <section key={cat}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {meta.icon} {meta.label}
                  </h2>
                  <ul className="space-y-2">
                    {byCategory[cat].map((m) => (
                      <li
                        key={m.id}
                        className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${meta.bg} ${meta.border}`}
                      >
                        <p className={`flex-1 text-sm ${meta.text}`}>{m.content}</p>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-xs text-gray-300">{SOURCE_LABEL[m.source]}</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="text-xs text-gray-300 hover:text-red-400"
                          >
                            remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        {/* Extract sidebar */}
        <aside className="col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Extract from
            </p>

            {/* Tab */}
            <div className="mb-3 flex rounded-lg border border-gray-200 overflow-hidden">
              {(["journal", "chat"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setExtractTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    extractTab === t
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {t === "journal" ? "📓 Journals" : "💬 Chats"}
                </button>
              ))}
            </div>

            {extractTab === "journal" ? (
              journals.length ? (
                <ul className="space-y-1 max-h-72 overflow-y-auto">
                  {journals.map((j) => (
                    <ExtractItem
                      key={j.id}
                      label={j.title}
                      onClick={() => handleExtract("journal", j.id)}
                      disabled={extracting}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">No journals yet.</p>
              )
            ) : chats.length ? (
              <ul className="space-y-1 max-h-72 overflow-y-auto">
                {chats.map((c) => (
                  <ExtractItem
                    key={c.id}
                    label={c.title ?? "Untitled chat"}
                    onClick={() => handleExtract("chat", c.id)}
                    disabled={extracting}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No chats yet.</p>
            )}

            {extracting && (
              <p className="mt-3 text-xs text-indigo-500 animate-pulse">Extracting memories…</p>
            )}
            {feedback && !extracting && (
              <p className={`mt-3 text-xs ${feedback.startsWith("✓") ? "text-green-600" : "text-red-400"}`}>
                {feedback}
              </p>
            )}
          </div>

          {/* Stats */}
          {memories.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Memory breakdown
              </p>
              <div className="space-y-1.5">
                {ALL_CATEGORIES.filter((cat) => byCategory[cat].length > 0).map((cat) => {
                  const meta = CAT_META[cat];
                  const count = byCategory[cat].length;
                  const pct = Math.round((count / memories.length) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-500">
                          {meta.icon} {meta.label}
                        </span>
                        <span className="text-xs font-medium text-gray-600">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-indigo-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ExtractItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left text-xs text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 truncate"
      >
        {label}
      </button>
    </li>
  );
}
