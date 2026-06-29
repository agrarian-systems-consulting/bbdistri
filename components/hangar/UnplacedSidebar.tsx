"use client";

import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { draggableLotId, UNPLACED_SOURCE } from "@/lib/hangar/dnd-ids";
import { statutClass } from "@/lib/hangar/statut";
import type { Lot } from "@/lib/types/domain";

type Props = {
  lots: Lot[];
  onClose: () => void;
  onLotClick: (lot: Lot) => void;
};

/** Libellé du groupe rassemblant les lots sans campagne saisie. */
const SANS_CAMPAGNE = "Sans campagne";

function UnplacedLotItem({
  lot,
  onLotClick,
}: {
  lot: Lot;
  onLotClick: (lot: Lot) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableLotId(UNPLACED_SOURCE, lot.id),
    data: { lotId: lot.id, sourceEmplacementId: UNPLACED_SOURCE },
  });
  return (
    <li
      ref={setNodeRef}
      className={`unplaced-item ${isDragging ? "dragging" : ""} ${statutClass(lot.statut)}`}
      onClick={() => {
        if (!isDragging) onLotClick(lot);
      }}
      {...listeners}
      {...attributes}
    >
      <div className="unplaced-item-main">
        <div className="unplaced-item-nom">{lot.nom}</div>
        {lot.produit ? (
          <div className="unplaced-item-produit">{lot.produit}</div>
        ) : null}
      </div>
      <span className="unplaced-item-statut">{lot.statut}</span>
    </li>
  );
}

/**
 * Regroupe les lots par campagne et ordonne les groupes par année
 * décroissante (la plus récente en tête), les lots sans campagne en dernier.
 * Trier par ordre décroissant évite de coder en dur la campagne courante :
 * la plus récente est toujours en haut et ouverte par défaut. Les lots non
 * datés ne sont jamais perdus : ils tombent dans le groupe « Sans campagne ».
 */
function groupByCampagne(lots: Lot[]): Array<[string, Lot[]]> {
  const groups = new Map<string, Lot[]>();
  for (const lot of lots) {
    const key = lot.campagne ?? SANS_CAMPAGNE;
    const bucket = groups.get(key);
    if (bucket) bucket.push(lot);
    else groups.set(key, [lot]);
  }

  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === SANS_CAMPAGNE) return 1;
    if (b === SANS_CAMPAGNE) return -1;
    // Les campagnes sont stockées en texte ("2026") : on compare en
    // numérique pour un tri d'années fiable (décroissant). Toute valeur non
    // numérique retombe sur un tri texte décroissant.
    const na = Number.parseInt(a, 10);
    const nb = Number.parseInt(b, 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return b.localeCompare(a);
    return nb - na;
  });
}

export function UnplacedSidebar({ lots, onClose, onLotClick }: Props) {
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
          <h2>Lots à placer</h2>
          <p>
            {lots.length} lot{lots.length > 1 ? "s" : ""} du Hangar sans
            emplacement défini · glisser-déposer vers une allée
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la liste des lots à placer"
          className="side-panel-close"
        >
          ×
        </button>
      </header>
      {lots.length === 0 ? (
        <p className="side-panel-empty">
          Tous les lots du Hangar ont un emplacement.
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
                <ul className="unplaced-list">
                  {campagneLots.map((lot) => (
                    <UnplacedLotItem
                      key={lot.id}
                      lot={lot}
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
