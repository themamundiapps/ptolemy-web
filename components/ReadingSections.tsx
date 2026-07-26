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

export default function ReadingSections({ analysis }: { analysis: string }) {
  const paragraphs = analysis
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {paragraphs.map((paragraph, i) => (
        <div key={i} className="border border-line bg-parchment-2 p-6 lg:p-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-cinzel text-[11px] uppercase tracking-[0.14em] text-bronze-dark">
              {ROMAN[i] ?? i + 1}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <h2 className="mb-3 font-cormorant text-xl font-medium capitalize text-ink">{headingFor(paragraph)}</h2>
          <p className="whitespace-pre-line font-crimson text-[15px] leading-relaxed text-ink-2">{paragraph}</p>
        </div>
      ))}
    </div>
  );
}
