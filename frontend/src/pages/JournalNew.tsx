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
      navigate("/dashboard");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h2 className="text-2xl font-semibold text-gray-800">New Entry</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-8 shadow">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-lg font-semibold focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={14}
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-gray-700 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
