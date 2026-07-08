"use client";

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { groupByCampagne } from "@/lib/hangar/campagne";
import type { Emplacement, Lot } from "@/lib/types/domain";

type Props = {
  lots: Lot[];
  emplacementsById: Map<string, Emplacement>;
  onClose: () => void;
  onLotClick: (lot: Lot) => void;
};

function APreciserItem({
  lot,
  emplacementsById,
  onLotClick,
}: {
  lot: Lot;
  emplacementsById: Map<string, Emplacement>;
  onLotClick: (lot: Lot) => void;
}) {
  const empNames = lot.emplacementIds
    .map((id) => emplacementsById.get(id)?.name)
    .filter((n): n is string => Boolean(n));
  return (
    <li
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
            <span className="emp-badge emp-badge-empty">Non placé</span>
          )}
        </div>
      </div>
      <span className="apreciser-item-cta">à préciser →</span>
    </li>
  );
}

/**
 * Sidebar listant les écarts de tri dont le code article reste à préciser
 * (produit "APRECISER" ou aucun article lié), regroupés par campagne comme la
 * sidebar « à placer » : campagne la plus récente en tête et ouverte par
 * défaut. Un clic sur un lot ouvre la modale de détail pour le rattacher au
 * bon article.
 */
export function ArticleAPreciserSidebar({
  lots,
  emplacementsById,
  onClose,
  onLotClick,
}: Props) {
  const grouped = useMemo(() => groupByCampagne(lots), [lots]);
  // Campagne la plus récente (premier groupe) ouverte par défaut.
  const defaultOpen = useMemo(
    () => (grouped.length > 0 ? [grouped[0][0]] : []),
    [grouped],
  );

  return (
    <aside className="side-panel">
      <header className="side-panel-header">
        <div>
          <h2>Article à préciser</h2>
          <p>
            {lots.length} lot{lots.length > 1 ? "s" : ""} à rattacher à un code
            article · cliquer pour préciser
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
          Aucun lot en attente de code article.
        </p>
      ) : (
        <Accordion
          className="campagne-accordion"
          multiple
          defaultValue={defaultOpen}
        >
          {grouped.map(([campagne, campagneLots]) => (
            <AccordionItem
              key={campagne}
              value={campagne}
              className="campagne-item"
            >
              <AccordionTrigger className="campagne-trigger">
                <span className="campagne-trigger-inner">
                  <span className="campagne-trigger-label">{campagne}</span>
                  <span className="badge-lots">
                    {campagneLots.length} lot
                    {campagneLots.length > 1 ? "s" : ""}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="campagne-content">
                <ul className="apreciser-list">
                  {campagneLots.map((lot) => (
                    <APreciserItem
                      key={lot.id}
                      lot={lot}
                      emplacementsById={emplacementsById}
                      onLotClick={onLotClick}
                    />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </aside>
  );
}
