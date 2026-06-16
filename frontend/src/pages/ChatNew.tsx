import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Session {
  id: string;
}

export default function ChatNew() {
  const navigate = useNavigate();

  useEffect(() => {
    api
      .post<Session>("/chat/sessions", { title: null })
      .then((res) => navigate(`/dashboard/chat/${res.data.id}`, { replace: true }));
  }, [navigate]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}
