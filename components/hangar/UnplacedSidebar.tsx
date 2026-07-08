"use client";

import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { groupByCampagne } from "@/lib/hangar/campagne";
import { draggableLotId, UNPLACED_SOURCE } from "@/lib/hangar/dnd-ids";
import { statutClass } from "@/lib/hangar/statut";
import type { Lot } from "@/lib/types/domain";

type Props = {
  lots: Lot[];
  onClose: () => void;
  onLotClick: (lot: Lot) => void;
};

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
