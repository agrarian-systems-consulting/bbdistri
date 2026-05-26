"use client";

import type { StatutTriage } from "@/lib/types/domain";

export type SidebarKind = "allotements" | "unplaced";

type Props = {
  totalLots: number;
  totalEmplacements: number;
  unplacedCount: number;
  activeStatuts: Set<StatutTriage>;
  searchQuery: string;
  openSidebar: SidebarKind | null;
  onToggleStatut: (statut: StatutTriage) => void;
  onSearchChange: (query: string) => void;
  onToggleSidebar: (kind: SidebarKind) => void;
};

const LEGEND_STATUTS: Array<{
  label: string;
  statut: StatutTriage;
  color: string;
}> = [
  { label: "Trié", statut: "Trié", color: "var(--statut-trie)" },
  { label: "Brut", statut: "Brut", color: "var(--statut-brut)" },
  { label: "À retrier", statut: "A retrier", color: "var(--statut-aretrier)" },
  {
    label: "Trié stocké",
    statut: "Trié stocké",
    color: "var(--statut-triestocke)",
  },
];

export function Topbar({
  totalLots,
  totalEmplacements,
  unplacedCount,
  activeStatuts,
  searchQuery,
  openSidebar,
  onToggleStatut,
  onSearchChange,
  onToggleSidebar,
}: Props) {
  const noFilter = activeStatuts.size === 0;
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
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="🔍  Produit ou N°lot…"
              autoComplete="off"
              aria-label="Rechercher un produit ou un N°lot"
            />
          </div>
          <button
            type="button"
            title="Effacer"
            onClick={() => onSearchChange("")}
            disabled={searchQuery.length === 0}
            style={{ opacity: searchQuery.length === 0 ? 0.3 : undefined }}
          >
            ✕
          </button>
        </div>
        <button
          type="button"
          className={`topbar-pill ${openSidebar === "unplaced" ? "active" : ""}`}
          onClick={() => onToggleSidebar("unplaced")}
          aria-pressed={openSidebar === "unplaced"}
          title="Lots du Hangar sans emplacement défini"
        >
          <span>À placer</span>
          {unplacedCount > 0 ? (
            <span className="topbar-pill-badge">{unplacedCount}</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`allotement-toggle ${openSidebar === "allotements" ? "active" : ""}`}
          onClick={() => onToggleSidebar("allotements")}
          aria-pressed={openSidebar === "allotements"}
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
          {LEGEND_STATUTS.map(({ label, statut, color }) => {
            const isActive = activeStatuts.has(statut);
            const classes = [
              "legend-item",
              "clickable",
              isActive ? "toggle-on" : "",
              !noFilter && !isActive ? "dimmed" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <span
                key={statut}
                className={classes}
                onClick={() => onToggleStatut(statut)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleStatut(statut);
                  }
                }}
              >
                <span className="legend-dot" style={{ background: color }} />
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </header>
  );
}
