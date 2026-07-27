"use client";

import { useState } from "react";
import { ApiError, chatWithAstrologer } from "@/lib/api";
import { FREE_MESSAGE_LIMIT } from "@/lib/storage";
import type { BirthData, ChatMessage } from "@/lib/types";

export default function ChatDock({
  birth,
  userId,
  messages,
  onMessagesChange,
  remaining,
}: {
  birth: BirthData;
  userId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  remaining: number;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = remaining <= 0;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
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

  return (
    <div className="chat-dock" id="chat-dock">
      <h4>Ask the Astrologer</h4>
      <p>About your sect, your ruling planet, or any aspect above worth going deeper on.</p>

      {messages.length > 0 && (
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {sending && <div className="bubble assistant" style={{ fontStyle: "italic" }}>The astrologer is consulting your chart…</div>}
        </div>
      )}
      {error && (
        <p style={{ color: "var(--terracotta)", fontSize: ".85rem", marginBottom: 12 }}>{error}</p>
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
            placeholder="Why does Saturn in the 12th matter so much here?"
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
