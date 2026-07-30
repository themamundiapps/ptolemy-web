"use client";

import { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import { ApiError, chatWithAstrologer } from "@/lib/api";
import { buildChatSuggestions } from "@/lib/chatSuggestions";
import { FREE_MESSAGE_LIMIT } from "@/lib/storage";
import type { BirthData, ChartResponse, ChatMessage } from "@/lib/types";

export default function ChatDock({
  birth,
  chart,
  userId,
  messages,
  onMessagesChange,
  remaining,
  initialInput = "",
}: {
  birth: BirthData;
  chart: ChartResponse;
  userId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  remaining: number;
  initialInput?: string;
}) {
  const [input, setInput] = useState(initialInput);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = remaining <= 0;
  const suggestions = useMemo(() => buildChatSuggestions(chart), [chart]);

  const sendMessage = async (content: string) => {
    if (!content || sending || limitReached) return;

    const withUser = [...messages, { role: "user", content } as ChatMessage];
    onMessagesChange(withUser);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const { reply } = await chatWithAstrologer(birth, withUser, userId);
      onMessagesChange([...withUser, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "The astrologer could not be reached. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input.trim());
  };

  return (
    <div className="chat-dock" id="chat-dock">
      <h4>Ask the Astrologer</h4>
      <p>
        Readings drawn from Ptolemy, Valens, and Lilly — anchored to your own chart, not a generic horoscope.
      </p>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="chat-suggestions">
          {suggestions.map((q) => (
            <button key={q} type="button" className="chat-suggestion" disabled={sending || limitReached} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
            </div>
          ))}
          {sending && <div className="bubble assistant" style={{ fontStyle: "italic" }}>The astrologer is consulting your chart…</div>}
        </div>
      )}
      {error && (
        <p style={{ color: "var(--terracotta)", fontSize: "var(--text-secondary-size)", marginBottom: 12 }}>{error}</p>
      )}

      {limitReached ? (
        <p style={{ fontStyle: "italic" }}>
          You&apos;ve used all {FREE_MESSAGE_LIMIT} free questions today. Upgrade to Pro for unlimited guidance.
        </p>
      ) : (
        <form className="input" onSubmit={handleSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Or ask your own question"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            Ask
          </button>
        </form>
      )}
    </div>
  );
}
