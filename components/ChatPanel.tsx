"use client";

import { useState } from "react";
import { ApiError, chatWithAstrologer } from "@/lib/api";
import { FREE_MESSAGE_LIMIT } from "@/lib/storage";
import type { BirthData, ChatMessage } from "@/lib/types";

export default function ChatPanel({
  birth,
  userId,
  messages,
  onMessagesChange,
  onUpgradeClick,
}: {
  birth: BirthData;
  userId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onUpgradeClick: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesSent = messages.filter((m) => m.role === "user").length;
  const remaining = Math.max(FREE_MESSAGE_LIMIT - messagesSent, 0);
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
    <div className="flex h-full flex-col border border-ink bg-parchment-2">
      <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ minHeight: 320, maxHeight: 520 }}>
        {messages.length === 0 && (
          <p className="font-cormorant italic text-ink-2">
            Ask the astrologer anything about your chart — your sect, your ruling planet, an aspect
            you&apos;re curious about.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-2 font-crimson text-sm leading-relaxed ${
                m.role === "user" ? "bg-ink text-parchment" : "border border-line bg-parchment text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && <p className="font-cormorant text-sm italic text-ink-2">The astrologer is consulting your chart…</p>}
        {error && <p className="font-crimson text-sm text-terracotta">{error}</p>}
      </div>

      <div className="border-t border-line p-4">
        {limitReached ? (
          <div className="border border-bronze bg-parchment p-4 text-center">
            <p className="font-crimson text-sm text-ink">You&apos;ve used all {FREE_MESSAGE_LIMIT} free messages.</p>
            <button
              onClick={onUpgradeClick}
              className="mt-3 bg-bronze-dark px-5 py-2 font-cinzel text-[13px] uppercase tracking-[0.1em] text-parchment transition-colors hover:bg-ink"
            >
              Upgrade to Pro for unlimited guidance
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your chart…"
                className="flex-1 border border-line bg-parchment px-4 py-2 font-crimson text-sm text-ink outline-none focus:border-bronze-dark"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="bg-ink px-5 py-2 font-cinzel text-[13px] uppercase tracking-[0.1em] text-parchment transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </form>
            <p className="mt-2 text-right font-ebgaramond text-xs uppercase tracking-[0.06em] text-ink-2">
              {remaining} free messages remaining
            </p>
          </>
        )}
      </div>
    </div>
  );
}
