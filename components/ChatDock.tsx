"use client";

import { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import { ApiError, chatWithAstrologer } from "@/lib/api";
import { analyzeAnswerForCollapse } from "@/lib/chatAnswerCollapse";
import { buildChatSuggestions } from "@/lib/chatSuggestions";
import { ELECTIONAL_THEMES } from "@/lib/electionalThemes";
import { toRoman } from "@/lib/format";
import type { AiQuota, BirthData, ChartResponse, ChatDepth, ChatMessage } from "@/lib/types";

interface Entry {
  question: string;
  answer?: string;
}

const DEPTH_OPTIONS: { key: ChatDepth; label: string; description: string }[] = [
  { key: "plain", label: "Plain", description: "Explains technical terms as it uses them — for readers new to astrology" },
  { key: "standard", label: "Standard", description: "The default register" },
  {
    key: "traditional",
    label: "Traditional",
    description: "Unglossed technical vocabulary and source citations — for readers who already know Lilly",
  },
];

/** A chat reply, collapsed to its first paragraphs once it's no longer the
 * most recent answer in the log -- otherwise the accumulated-log layout
 * (Task: consultation log, not chat bubbles) turns into a wall of text.
 * `forceExpanded` (the most recent entry) always renders in full regardless
 * of length; a short answer (see analyzeAnswerForCollapse) never gets a
 * collapse control at all, even once superseded. */
function AnswerBlock({ content, forceExpanded }: { content: string; forceExpanded: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { isCollapsible, collapsedText } = useMemo(() => analyzeAnswerForCollapse(content), [content]);
  const showFull = forceExpanded || expanded || !isCollapsible;

  return (
    <div className="chat-entry-answer md">
      <Markdown>{showFull ? content : collapsedText}</Markdown>
      {isCollapsible && !forceExpanded && (
        <button type="button" className="chat-answer-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Collapse" : "Read in Full"}
        </button>
      )}
    </div>
  );
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
  depth,
  onDepthChange,
  initialInput = "",
}: {
  birth: BirthData;
  chart: ChartResponse;
  userId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  quota: AiQuota | null;
  onQuotaChange: (quota: AiQuota) => void;
  depth: ChatDepth;
  onDepthChange: (depth: ChatDepth) => void;
  initialInput?: string;
}) {
  const [input, setInput] = useState(initialInput);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const quotaExhausted = quota !== null && quota.remaining <= 0;
  const entries = useMemo(() => buildEntries(messages), [messages]);
  const allSuggestions = useMemo(() => buildChatSuggestions(chart, category), [chart, category]);
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
      const { reply } = await chatWithAstrologer(birth, withUser, userId, depth);
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
      <div className="chat-category-select" role="group" aria-label="Suggestion topic">
        <span className="chat-category-label">Ask About</span>
        <div className="chat-category-pills">
          <button
            type="button"
            className={`chat-category-pill${category === null ? " active" : ""}`}
            onClick={() => setCategory(null)}
          >
            General
          </button>
          {ELECTIONAL_THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`chat-category-pill${category === t.key ? " active" : ""}`}
              onClick={() => setCategory(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
                  <AnswerBlock content={entry.answer} forceExpanded={isLast} />
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

          <div className="chat-depth-select" role="group" aria-label="Reading register">
            <span className="chat-depth-label">Register</span>
            <div className="chat-depth-pills">
              {DEPTH_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`chat-depth-pill${depth === opt.key ? " active" : ""}`}
                  onClick={() => onDepthChange(opt.key)}
                  disabled={sending}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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
