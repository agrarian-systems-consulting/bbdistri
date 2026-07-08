"use client";

import type { Emplacement, Lot } from "@/lib/types/domain";

type Props = {
  lots: Lot[];
  emplacementsById: Map<string, Emplacement>;
  onClose: () => void;
  onLotClick: (lot: Lot) => void;
};

/**
 * Sidebar listant les écarts de tri dont le code article reste à préciser
 * (produit "APRECISER"). On ne peut pas connaître à l'avance le code article
 * d'un écart : cette liste sert de « à traiter » pour rattacher chaque lot au
 * bon article via la modale de détail (clic sur un lot).
 */
export function ArticleAPreciserSidebar({
  lots,
  emplacementsById,
  onClose,
  onLotClick,
}: Props) {
  return (
    <aside className="side-panel">
      <header className="side-panel-header">
        <div>
          <h2>Article à préciser</h2>
          <p>
            {lots.length} écart{lots.length > 1 ? "s" : ""} de tri à rattacher à
            un code article · cliquer pour préciser
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la liste des articles à préciser"
          className="side-panel-close"
        >
          ×
        </button>
      </header>
      {lots.length === 0 ? (
        <p className="side-panel-empty">
          Aucun écart de tri en attente de code article.
        </p>
      ) : (
        <ul className="apreciser-list">
          {lots.map((lot) => {
            const empNames = lot.emplacementIds
              .map((id) => emplacementsById.get(id)?.name)
              .filter((n): n is string => Boolean(n));
            return (
              <li
                key={lot.id}
                className="apreciser-item"
                onClick={() => onLotClick(lot)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onLotClick(lot);
                  }
                }}
              >
                <div className="apreciser-item-main">
                  <div className="apreciser-item-nom">{lot.nom}</div>
                  <div className="apreciser-item-empls">
                    {empNames.length > 0 ? (
                      empNames.map((name) => (
                        <span key={name} className="emp-badge">
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="emp-badge emp-badge-empty">
                        Non placé
                      </span>
                    )}
                  </div>
                </div>
                <span className="apreciser-item-cta">à préciser →</span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
