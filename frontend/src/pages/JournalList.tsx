import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

interface Journal {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function JournalList() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<Journal[]>("/journals/")
      .then((res) => setJournals(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">My Journals</h2>
        <Link
          to="/dashboard/journals/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + New Entry
        </Link>
      </div>

      {journals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400">No journal entries yet.</p>
          <Link
            to="/dashboard/journals/new"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Write your first entry →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {journals.map((journal) => (
            <Link
              key={journal.id}
              to={`/dashboard/journals/${journal.id}/edit`}
              className="block rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{journal.title}</h3>
                <span className="text-xs text-gray-400">
                  {new Date(journal.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-500">{journal.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
