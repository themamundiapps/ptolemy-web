export default function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-surface p-8 text-center transition-colors hover:border-gold/40">
      <h3 className="font-serif text-2xl text-gold">{title}</h3>
      <p className="mt-3 text-muted leading-relaxed">{description}</p>
    </div>
  );
}
