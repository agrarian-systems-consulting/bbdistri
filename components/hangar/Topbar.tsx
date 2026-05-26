type Props = {
  totalLots: number;
  totalEmplacements: number;
};

const LEGEND_STATUTS = [
  { label: "Trié", color: "var(--statut-trie)" },
  { label: "Brut", color: "var(--statut-brut)" },
  { label: "À retrier", color: "var(--statut-aretrier)" },
  { label: "Trié stocké", color: "var(--statut-triestocke)" },
] as const;

export function Topbar({ totalLots, totalEmplacements }: Props) {
  return (
    <header className="topbar">
      <div>
        <h1>Interface Hangar — SCIC Graines équitables</h1>
        <span className="subtitle">
          {totalLots} lots actifs · {totalEmplacements} emplacements · vue
          statique (étape 5)
        </span>
      </div>
      <div className="legend">
        {LEGEND_STATUTS.map((s) => (
          <span key={s.label} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </header>
  );
}
