const COLLAPSE_PARAGRAPH_COUNT = 2;

/** Below this length, an answer is "short" and never collapses -- the first
 * COLLAPSE_PARAGRAPH_COUNT paragraphs of a reply this short already amount
 * to nearly the whole thing, so a collapse control would hide almost
 * nothing while still costing the reader a click. Chat replies cap at 600
 * tokens (see backend/app/services/chat.py's _MAX_TOKENS), so "long" here
 * means "using a meaningful fraction of that budget", not an arbitrary cutoff. */
const SHORT_ANSWER_CHARS = 400;

const PARAGRAPH_SPLIT = /\n{2,}/;

export interface AnswerCollapseInfo {
  /** False for a short answer, or one where the collapsed preview wouldn't
   * meaningfully differ from the full text -- ChatDock renders no toggle at
   * all in that case, matching "short answers never collapse". */
  isCollapsible: boolean;
  /** The first COLLAPSE_PARAGRAPH_COUNT paragraphs (or, for a reply with no
   * paragraph breaks at all, a hard cut at the nearest word boundary). Equal
   * to the full trimmed content when isCollapsible is false. */
  collapsedText: string;
}

/** Pure text analysis backing the Chat tab's collapsible long-answer rule
 * (see components/ChatDock.tsx's AnswerBlock): the most recent answer is
 * always rendered in full regardless of what this returns -- this only
 * decides what a *previous* answer collapses to. */
export function analyzeAnswerForCollapse(content: string): AnswerCollapseInfo {
  const trimmed = content.trim();
  if (trimmed.length <= SHORT_ANSWER_CHARS) {
    return { isCollapsible: false, collapsedText: trimmed };
  }

  const paragraphs = trimmed.split(PARAGRAPH_SPLIT).filter((p) => p.trim().length > 0);
  if (paragraphs.length > COLLAPSE_PARAGRAPH_COUNT) {
    const collapsedText = paragraphs.slice(0, COLLAPSE_PARAGRAPH_COUNT).join("\n\n");
    // If the kept paragraphs already account for nearly the whole answer
    // (e.g. a short trailing paragraph), collapsing wouldn't hide enough of
    // the text to be worth a control.
    if (collapsedText.length >= trimmed.length - 40) {
      return { isCollapsible: false, collapsedText: trimmed };
    }
    return { isCollapsible: true, collapsedText };
  }

  // One long paragraph (or exactly two, tied at the count threshold) with no
  // earlier break to cut at -- fall back to a hard cut at the nearest word
  // boundary past the short-answer length, so a reply with no paragraph
  // structure still collapses instead of silently never qualifying.
  let cut = trimmed.slice(0, SHORT_ANSWER_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  return { isCollapsible: true, collapsedText: `${cut}…` };
}
