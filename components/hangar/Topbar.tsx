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
          {totalLots} lots actifs · {totalEmplacements} emplacements
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div className="search-bar">
          <div className="search-wrap">
            <input
              placeholder="🔍  Produit ou N°lot…"
              autoComplete="off"
              aria-label="Rechercher un produit ou un N°lot"
            />
          </div>
          <button type="button" title="Effacer">
            ✕
          </button>
        </div>
        <button
          type="button"
          className="allotement-toggle"
          title="Suggestions d'allotements — regrouper les lots compatibles"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17l-4-4 4-4" />
            <path d="M3 13h12" />
            <path d="M17 7l4 4-4 4" />
            <path d="M21 11H9" />
          </svg>
          <span>Allotements</span>
        </button>
        <div className="legend">
          {LEGEND_STATUTS.map((s) => (
            <span key={s.label} className="legend-item">
              <span className="legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
