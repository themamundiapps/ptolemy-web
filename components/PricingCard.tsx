export default function PricingCard({
  title,
  price,
  period,
  features,
  badge,
  highlighted,
  onSelect,
  ctaLabel = "Subscribe",
}: {
  title: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  highlighted?: boolean;
  onSelect?: () => void;
  ctaLabel?: string;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-lg border p-8 ${
        highlighted ? "border-gold bg-surface" : "border-white/10 bg-surface/60"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-wide text-background">
          {badge}
        </span>
      )}
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      <p className="mt-2">
        <span className="font-serif text-4xl text-gold">{price}</span>
        {period && <span className="text-muted"> /{period}</span>}
      </p>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-gold">·</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {onSelect && (
        <button
          onClick={onSelect}
          className="mt-8 rounded border border-gold px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-background"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
