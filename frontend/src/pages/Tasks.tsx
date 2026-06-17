import { useEffect, useState } from "react";
import api from "../lib/api";

type Priority = "low" | "medium" | "high";
type Status = "todo" | "in_progress" | "done";
type FilterStatus = "all" | Status;
type SortKey = "created" | "deadline" | "priority";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  deadline: string | null;
  created_at: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABEL: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const NEXT_STATUS: Record<Status, Status> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

function deadlineUrgency(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return "text-red-500";
  if (days <= 1) return "text-orange-500";
  if (days <= 3) return "text-amber-500";
  return "text-gray-400";
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("created");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    deadline: "",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    api
      .get<Task[]>("/tasks/")
      .then((r) => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        priority: form.priority,
      };
      if (form.description) payload.description = form.description;
      if (form.deadline) payload.deadline = new Date(form.deadline).toISOString();
      const res = await api.post<Task>("/tasks/", payload);
      setTasks((prev) => [res.data, ...prev]);
      setForm({ title: "", description: "", priority: "medium", deadline: "" });
      setShowForm(false);
    } catch {}
    setSubmitting(false);
  };

  const cycleStatus = async (task: Task) => {
    const next = NEXT_STATUS[task.status];
    try {
      const res = await api.patch<Task>(`/tasks/${task.id}`, { status: next });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    } catch {}
  };

  const deleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sort === "deadline") {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tasks</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {counts.todo} to do · {counts.in_progress} in progress · {counts.done} done
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New Task
        </button>
      </div>

      {/* New task form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-white dark:bg-gray-800 p-5 shadow-sm space-y-3"
        >
          <input
            required
            placeholder="Task title"
            aria-label="Task title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 focus:outline-none"
          />
          <textarea
            placeholder="Description (optional)"
            aria-label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-400 focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Priority</label>
              <select
                aria-label="Priority"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Deadline</label>
              <input
                type="date"
                aria-label="Deadline"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add Task"}
            </button>
          </div>
        </form>
      )}

      {/* Filter + Sort bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "todo", "in_progress", "done"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? `All (${counts.all})` : `${STATUS_LABEL[f as Status]} (${counts[f as Status]})`}
            </button>
          ))}
        </div>

        <select
          aria-label="Sort tasks"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 focus:outline-none"
        >
          <option value="created">Sort: Newest</option>
          <option value="deadline">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {filter === "all" ? "No tasks yet. Add one above!" : `No ${STATUS_LABEL[filter as Status]} tasks.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCycle={() => cycleStatus(task)}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onCycle,
  onDelete,
}: {
  task: Task;
  onCycle: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";

  return (
    <li
      className={`flex items-start gap-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-3 transition-all ${
        done ? "opacity-60" : "hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-sm"
      }`}
    >
      {/* Status circle */}
      <button
        type="button"
        onClick={onCycle}
        title={`Mark as ${STATUS_LABEL[NEXT_STATUS[task.status]]}`}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done
            ? "border-green-400 bg-green-400 text-white"
            : task.status === "in_progress"
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400"
        }`}
      >
        {done && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {task.status === "in_progress" && (
          <div className="h-2 w-2 rounded-full bg-indigo-400" />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
            {task.title}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}
          >
            {task.priority}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {STATUS_LABEL[task.status]}
          </span>
        </div>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{task.description}</p>
        )}
        {task.deadline && (
          <p className={`mt-0.5 text-xs font-medium ${deadlineUrgency(task.deadline)}`}>
            {formatDeadline(task.deadline)}
          </p>
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400"
        title="Delete task"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}
