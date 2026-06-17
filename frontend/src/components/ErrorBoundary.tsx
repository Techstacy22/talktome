import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 text-center">
          <p className="text-5xl">💥</p>
          <h1 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-100">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 max-w-sm">
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
