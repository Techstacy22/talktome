import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/register", form);
      const loginForm = new URLSearchParams();
      loginForm.append("username", form.email);
      loginForm.append("password", form.password);
      const res = await api.post<{ access_token: string; refresh_token: string }>("/auth/login", loginForm, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      await login(res.data.access_token, res.data.refresh_token);
      navigate("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600">TalkToMe</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white dark:bg-gray-800 p-8 shadow dark:shadow-gray-900">
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {[
            { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
            { label: "Username", key: "username", type: "text", placeholder: "yourname" },
            { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <input
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                placeholder={placeholder}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
