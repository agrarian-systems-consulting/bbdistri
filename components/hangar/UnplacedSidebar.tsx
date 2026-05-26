"use client";

import { useDraggable } from "@dnd-kit/core";
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
        <ul className="unplaced-list">
          {lots.map((lot) => (
            <UnplacedLotItem
              key={lot.id}
              lot={lot}
              onLotClick={onLotClick}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
