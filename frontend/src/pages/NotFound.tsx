import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 text-center">
      <p className="text-7xl font-black text-indigo-200 dark:text-indigo-900">404</p>
      <h1 className="mt-2 text-xl font-bold text-gray-800 dark:text-gray-100">Page not found</h1>
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
        That page doesn't exist or was moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
