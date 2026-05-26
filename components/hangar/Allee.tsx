"use client";

import { useDroppable } from "@dnd-kit/core";
import { droppableEmplacementId } from "@/lib/hangar/dnd-ids";
import { isAllotable, shouldDimByFilter } from "@/lib/hangar/filters";
import type { Emplacement, Lot, StatutTriage } from "@/lib/types/domain";
import { LotCard } from "./LotCard";

type Props = {
  emplacement: Emplacement;
  lots: Lot[];
  caissonsById: Record<string, string>;
  hoveredLotId: string | null;
  activeStatuts: Set<StatutTriage>;
  searchQuery: string;
  onHoverChange: (lotId: string | null) => void;
};

export function Allee({
  emplacement,
  lots,
  caissonsById,
  hoveredLotId,
  activeStatuts,
  searchQuery,
  onHoverChange,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableEmplacementId(emplacement.id),
    data: { emplacementId: emplacement.id },
  });
  const empty = lots.length === 0;
  const label = emplacement.allee ?? emplacement.name;
  const classes = [
    "allee",
    empty ? "vide" : "",
    isOver ? "drop-target-allee" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={setNodeRef} className={classes} data-emp-id={emplacement.id}>
      <div className="allee-header">{label}</div>
      <div className="allee-content">
        {lots.map((lot) => (
          <LotCard
            key={`${emplacement.id}-${lot.id}`}
            lot={lot}
            emplacementId={emplacement.id}
            caissonsById={caissonsById}
            isHighlighted={hoveredLotId === lot.id}
            isDimmed={shouldDimByFilter(lot, activeStatuts, searchQuery)}
            isAllotable={isAllotable(lot)}
            onHoverChange={onHoverChange}
          />
        ))}
      </div>
    </div>
  );
}
