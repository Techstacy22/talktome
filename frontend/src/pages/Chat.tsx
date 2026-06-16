import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: string;
  title: string | null;
  created_at: string;
  messages: Message[];
}

export default function Chat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("access_token");

  // Load existing session messages
  useEffect(() => {
    if (!sessionId) return;
    api
      .get<Session>(`/chat/sessions/${sessionId}`)
      .then((res) => setMessages(res.data.messages))
      .catch(() => navigate("/dashboard"));
  }, [sessionId, navigate]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsStreaming(true);

    // Add empty assistant message placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;

          try {
            const { content: chunk } = JSON.parse(payload) as { content: string };
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + chunk,
              };
              return updated;
            });
          } catch {
            // ignore parse errors on partial chunks
          }
        }
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-2">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>Start the conversation — I'm here to listen.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800 shadow-sm"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && msg.content === "" && (
                <span className="inline-block h-4 w-1 animate-pulse bg-gray-400" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white pt-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="self-end rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {isStreaming ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
