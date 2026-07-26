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
      className={`relative flex flex-col border p-8 ${
        highlighted ? "border-bronze-dark bg-parchment-2" : "border-line bg-parchment-2"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bronze-dark px-3 py-1 font-ebgaramond text-xs font-semibold uppercase tracking-wide text-parchment">
          {badge}
        </span>
      )}
      <h3 className="font-cinzel text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2">
        <span className="font-cinzel text-4xl text-bronze-dark">{price}</span>
        {period && <span className="font-crimson text-ink-2"> /{period}</span>}
      </p>
      <ul className="mt-6 flex-1 space-y-3 font-crimson text-sm text-ink-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-bronze-dark">·</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {onSelect && (
        <button
          onClick={onSelect}
          className={`mt-8 border px-4 py-2 font-ebgaramond text-sm tracking-wide transition-colors ${
            highlighted
              ? "border-ink bg-ink text-parchment hover:bg-ink-2"
              : "border-ink text-ink hover:bg-ink hover:text-parchment"
          }`}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
