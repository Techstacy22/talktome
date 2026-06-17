import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";

interface Message { id?: string; role: "user" | "assistant"; content: string }
interface Session { id: string; title: string | null; messages: Message[] }

export default function Chat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!sessionId) return;
    api
      .get<Session>(`/chat/sessions/${sessionId}`)
      .then((r) => setMessages(r.data.messages))
      .catch(() => navigate("/dashboard"));
  }, [sessionId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content }),
        }
      );
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
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
          } catch { /* partial chunk */ }
        }
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-2">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
            <p>Start the conversation — I'm here to listen.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm dark:shadow-gray-900"
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
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pt-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
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
