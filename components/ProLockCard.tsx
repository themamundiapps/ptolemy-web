/** Shared "this lives behind Ptolemy Pro" card -- used anywhere a whole tab
 * (Synastry, Analysis) or a whole theme (Electional) is Pro-gated. Distinct
 * from `.soon` (features.md §2): SOON means "not built yet, nothing to see";
 * this means "built, real, and worth paying for" -- so it shows what's
 * behind the gate instead of hiding it, and invites a click rather than
 * reading as disabled. The 403 this exists in front of is enforced
 * server-side regardless (see PRODUCT_STATE §5 / backend routers) -- this
 * card is the sales pitch, not the security boundary.
 */
export default function ProLockCard({
  title,
  description,
  features,
  onUpgrade,
}: {
  title: string;
  description: string;
  features?: string[];
  onUpgrade: () => void;
}) {
  return (
    <div className="data-card pro-lock-card">
      <span className="pro-lock-badge">Ptolemy Pro</span>
      <h4>{title}</h4>
      <p className="pro-lock-desc">{description}</p>
      {features && features.length > 0 && (
        <ul className="pro-lock-features">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <button type="button" className="btn-primary" onClick={onUpgrade}>
        Unlock with Pro — $5/mo
      </button>
    </div>
  );
}
