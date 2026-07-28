import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders AI-generated prose (Chat, Chart Analysis) as real markdown instead
 * of dumping raw `#`/`**` characters on screen -- see app/globals.css's `.md`
 * block for the Cinzel/Cormorant/bronze styling applied to the output. */
export default function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={["md", className].filter(Boolean).join(" ")}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
