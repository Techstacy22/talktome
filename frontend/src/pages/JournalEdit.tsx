import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";

interface Journal {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function JournalEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Journal>(`/journals/${id}`)
      .then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);
      })
      .catch(() => navigate("/dashboard"))
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await api.put(`/journals/${id}`, { title, content });
      navigate("/dashboard");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await api.delete(`/journals/${id}`);
      navigate("/dashboard");
    } catch {
      setError("Failed to delete.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h2 className="text-2xl font-semibold text-gray-800">Edit Entry</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white p-8 shadow">
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

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-red-200 px-5 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Entry"}
          </button>

          <div className="flex gap-3">
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
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
