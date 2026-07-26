const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

// Pulls a short heading out of a paragraph's own opening clause, so the
// label always reflects what the paragraph actually says instead of a
// guessed topic name.
function headingFor(paragraph: string): string {
  const firstClause = paragraph.split(/[.—]/)[0].trim();
  const words = firstClause.split(/\s+/);
  const short = words.slice(0, 8).join(" ");
  return short.length < firstClause.length ? `${short}…` : short;
}

// Strips leading markdown heading markers ("#", "##", ...) some backend
// responses include as a title line.
function stripMarkdownHeading(text: string): string {
  return text.replace(/^#+\s*/, "").trim();
}

export default function ReadingSections({ analysis }: { analysis: string }) {
  const paragraphs = analysis
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    // Drop lines that are *only* a markdown heading (e.g. "# A Reading of
    // the Nativity") — that's a title, not a section of its own, and the
    // page's own <h1> already carries that role.
    .filter((p) => !/^#+\s+\S.*$/.test(p) || p.includes("\n"))
    .map(stripMarkdownHeading);

  const sections = paragraphs.map((paragraph, i) => ({
    id: `reading-${i}`,
    roman: ROMAN[i] ?? String(i + 1),
    heading: headingFor(paragraph),
    paragraph,
  }));

  return (
    <div>
      {sections.length > 1 && (
        <nav className="mb-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="font-cinzel text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-bronze-dark"
            >
              {s.heading}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-5">
        {sections.map((s) => (
          <div key={s.id} id={s.id} className="scroll-mt-24 border border-line bg-parchment-2 p-6 lg:p-7">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-cinzel text-[11px] uppercase tracking-[0.14em] text-bronze-dark">{s.roman}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <h2 className="mb-3 font-cormorant text-xl font-medium capitalize text-ink">{s.heading}</h2>
            <p className="whitespace-pre-line font-crimson text-[15px] leading-relaxed text-ink-2">{s.paragraph}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
