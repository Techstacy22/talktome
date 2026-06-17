import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

interface Journal { id: string; title: string; content: string; created_at: string }

export default function JournalList() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<Journal[]>("/journals/").then((r) => setJournals(r.data)).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">My Journals</h2>
        <Link
          to="/dashboard/journals/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + New Entry
        </Link>
      </div>

      {journals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-20 text-center">
          <p className="text-gray-400 dark:text-gray-500">No journal entries yet.</p>
          <Link
            to="/dashboard/journals/new"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Write your first entry →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {journals.map((j) => (
            <Link
              key={j.id}
              to={`/dashboard/journals/${j.id}/edit`}
              className="block rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{j.title}</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(j.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{j.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
