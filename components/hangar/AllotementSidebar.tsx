"use client";

import { useMemo } from "react";
import type { Lot } from "@/lib/types/domain";

type Props = {
  groups: Map<string, string[]>;
  lotsById: Map<string, Lot>;
  hoveredKey: string | null;
  onHoverKey: (key: string | null) => void;
  onClose: () => void;
};

export function AllotementSidebar({
  groups,
  lotsById,
  hoveredKey,
  onHoverKey,
  onClose,
}: Props) {
  const sorted = useMemo(
    () =>
      Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length),
    [groups],
  );

  const totalLots = sorted.reduce((acc, [, ids]) => acc + ids.length, 0);

  return (
    <aside className="allotement-sidebar">
      <header className="allotement-sidebar-header">
        <div>
          <h2>Allotements possibles</h2>
          <p>
            {groups.size} groupe{groups.size > 1 ? "s" : ""} · {totalLots} lots
            concernés
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la liste des allotements"
          className="allotement-sidebar-close"
        >
          ×
        </button>
      </header>
      {sorted.length === 0 ? (
        <p className="allotement-sidebar-empty">
          Aucun groupe d&apos;allotement (aucune clé Produit+Destination partagée).
        </p>
      ) : (
        <ul className="allotement-sidebar-list">
          {sorted.map(([key, lotIds]) => {
            const sample = lotIds
              .slice(0, 4)
              .map((id) => lotsById.get(id)?.nom ?? id);
            return (
              <li
                key={key}
                className={`allotement-item ${hoveredKey === key ? "active" : ""}`}
                onMouseEnter={() => onHoverKey(key)}
                onMouseLeave={() => onHoverKey(null)}
              >
                <div className="allotement-item-key">{key}</div>
                <div className="allotement-item-meta">
                  <span className="allotement-item-count">
                    {lotIds.length} lots
                  </span>
                  <span className="allotement-item-sample">
                    {sample.join(" · ")}
                    {lotIds.length > sample.length ? " …" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
