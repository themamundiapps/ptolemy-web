"use client";

import { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import { ApiError, chatWithAstrologer } from "@/lib/api";
import { buildChatSuggestions } from "@/lib/chatSuggestions";
import { toRoman } from "@/lib/format";
import type { AiQuota, BirthData, ChartResponse, ChatMessage } from "@/lib/types";

interface Entry {
  question: string;
  answer?: string;
}

/** Pairs the flat message list into chronological question/answer entries.
 * A trailing user message with no assistant reply yet is a pending (or, if
 * the last send failed, errored) entry -- ChatDock renders that last slot
 * differently based on `sending`/`error` rather than the message list alone. */
function buildEntries(messages: ChatMessage[]): Entry[] {
  const entries: Entry[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role !== "user") continue;
    const next = messages[i + 1];
    if (next?.role === "assistant") {
      entries.push({ question: messages[i].content, answer: next.content });
      i++;
    } else {
      entries.push({ question: messages[i].content });
    }
  }
  return entries;
}

export default function ChatDock({
  birth,
  chart,
  userId,
  messages,
  onMessagesChange,
  quota,
  onQuotaChange,
  initialInput = "",
}: {
  birth: BirthData;
  chart: ChartResponse;
  userId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  quota: AiQuota | null;
  onQuotaChange: (quota: AiQuota) => void;
  initialInput?: string;
}) {
  const [input, setInput] = useState(initialInput);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quotaExhausted = quota !== null && quota.remaining <= 0;
  const entries = useMemo(() => buildEntries(messages), [messages]);
  const allSuggestions = useMemo(() => buildChatSuggestions(chart), [chart]);
  const askedQuestions = useMemo(() => new Set(messages.filter((m) => m.role === "user").map((m) => m.content)), [messages]);
  const suggestions = allSuggestions.filter((q) => !askedQuestions.has(q));

  const sendMessage = async (content: string) => {
    if (!content || sending || quotaExhausted) return;

    const withUser = [...messages, { role: "user", content } as ChatMessage];
    onMessagesChange(withUser);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const { reply } = await chatWithAstrologer(birth, withUser, userId);
      onMessagesChange([...withUser, { role: "assistant", content: reply }]);
      if (quota) onQuotaChange({ ...quota, remaining: Math.max(quota.remaining - 1, 0) });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        onQuotaChange(quota ? { ...quota, remaining: 0 } : { remaining: 0, limit: 10, resets_at: "midnight UTC" });
      } else {
        setError(e instanceof ApiError ? e.message : "The astrologer could not be reached. Please try again.");
      }
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
      {entries.length > 0 && (
        <div className="chat-log">
          {entries.map((entry, i) => {
            const isLast = i === entries.length - 1;
            return (
              <div className="chat-entry" key={i}>
                <div className="s-eyebrow">
                  <span className="n">{toRoman(i + 1)}</span>
                  <span className="n">— Question</span>
                </div>
                <div className="chat-entry-question">{entry.question}</div>
                {entry.answer ? (
                  <div className="chat-entry-answer md">
                    <Markdown>{entry.answer}</Markdown>
                  </div>
                ) : isLast && sending ? (
                  <div className="chat-entry-answer chat-pending">
                    The astrologer is consulting your chart
                    <span className="chat-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                ) : isLast && error ? (
                  <div className="chat-entry-error">{error}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {quotaExhausted ? (
        <div className="chat-limit-note">
          You&apos;ve used all {quota?.limit} consultations for today. Your limit resets at {quota?.resets_at}.
        </div>
      ) : (
        <>
          {suggestions.length > 0 && (
            <div className="chat-suggestions">
              {suggestions.map((q) => (
                <button key={q} type="button" className="chat-suggestion" disabled={sending} onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
