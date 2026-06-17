import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function JournalNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await api.post("/journals/", { title, content });
      navigate("/dashboard/journals");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/dashboard/journals" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ← Back
        </Link>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">New Entry</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
        {error && (
          <p className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-lg font-semibold text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={16}
          className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <div className="flex justify-end gap-3">
          <Link
            to="/dashboard/journals"
            className="rounded-lg border border-gray-200 dark:border-gray-600 px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
