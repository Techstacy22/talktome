import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const STEPS = ["Academic", "Career", "Personal", "Preferences"];

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "PhD", "Other"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    university: "",
    major: "",
    year: "",
    bio: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    goals: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setIsSaving(true);
    setError("");
    try {
      await api.post("/profile/", form);
      navigate("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">TalkToMe</h1>
          <p className="mt-2 text-gray-500">Let's personalize your experience</p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  i <= step
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className="mt-1 text-xs text-gray-400">{label}</span>
              {i < STEPS.length - 1 && (
                <div className={`mt-4 h-0.5 w-full ${i < step ? "bg-indigo-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-2xl bg-white p-8 shadow">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Academic Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" value={form.first_name} onChange={(v) => update("first_name", v)} />
                <Field label="Last name" value={form.last_name} onChange={(v) => update("last_name", v)} />
              </div>
              <Field label="University" value={form.university} onChange={(v) => update("university", v)} placeholder="e.g. University of San Diego" />
              <Field label="Major" value={form.major} onChange={(v) => update("major", v)} placeholder="e.g. Computer Science" />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
                <select
                  value={form.year}
                  onChange={(e) => update("year", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Career & Goals</h2>
              <TextArea
                label="What are your career goals?"
                value={form.goals}
                onChange={(v) => update("goals", v)}
                placeholder="e.g. I want to become a software engineer at a top tech company and work on AI products..."
                rows={6}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">About You</h2>
              <TextArea
                label="Bio"
                value={form.bio}
                onChange={(v) => update("bio", v)}
                placeholder="Tell TalkToMe a little about yourself — your interests, challenges, what you're working on..."
                rows={7}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
                <input
                  type="text"
                  value={form.timezone}
                  onChange={(e) => update("timezone", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">Auto-detected from your browser</p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-700">You're all set!</p>
                <p className="mt-1 text-sm text-indigo-600">
                  TalkToMe will use this to personalize your dashboard and AI conversations.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Skip for now
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Let's go →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
