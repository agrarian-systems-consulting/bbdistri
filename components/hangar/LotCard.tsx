"use client";

import { useDraggable } from "@dnd-kit/core";
import { draggableLotId } from "@/lib/hangar/dnd-ids";
import { statutClass } from "@/lib/hangar/statut";
import type { Lot } from "@/lib/types/domain";

type Props = {
  lot: Lot;
  emplacementId: string;
  caissonsById: Record<string, string>;
  isHighlighted: boolean;
  isDimmed: boolean;
  isAllotable: boolean;
  onHoverChange: (lotId: string | null) => void;
};

export function LotCard({
  lot,
  emplacementId,
  caissonsById,
  isHighlighted,
  isDimmed,
  isAllotable,
  onHoverChange,
}: Props) {
  const dragId = draggableLotId(emplacementId, lot.id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { lotId: lot.id, sourceEmplacementId: emplacementId },
    disabled: isDimmed,
  });

  const caissonNumeros = lot.caissonIds
    .map((id) => caissonsById[id])
    .filter((n): n is string => Boolean(n));

  const classes = [
    "lot",
    statutClass(lot.statut),
    isHighlighted ? "highlight" : "",
    isDimmed ? "dimmed-by-filter" : "",
    isAllotable ? "allotable" : "",
    isDragging ? "dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      className={classes}
      data-lot-id={lot.id}
      onMouseEnter={() => onHoverChange(lot.id)}
      onMouseLeave={() => onHoverChange(null)}
      {...listeners}
      {...attributes}
    >
      <div className="lot-num">{lot.nom}</div>
      {lot.produit ? <div className="lot-produit">{lot.produit}</div> : null}
      {caissonNumeros.length > 0 ? (
        <div className="lot-caissons">
          {caissonNumeros.map((num) => (
            <span key={num} className="lot-caisson-tag">
              Caisson {num}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
