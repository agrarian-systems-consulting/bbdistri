"use client";

import { useDroppable } from "@dnd-kit/core";
import { droppableEmplacementId } from "@/lib/hangar/dnd-ids";
import { isAllotable, shouldDimByFilter } from "@/lib/hangar/filters";
import type {
  Emplacement,
  Lot,
  StatutTriage,
  Zone as ZoneType,
} from "@/lib/types/domain";
import { Allee } from "./Allee";
import { LotCard } from "./LotCard";

const ZONE_LABELS: Record<ZoneType, string> = {
  A: "ZONE A",
  B: "ZONE B",
  C: "ZONE C",
  PREP: "ZONE PRÉPARATION COMMANDE",
  TAMPON: "TAMPON",
};

type Props = {
  zone: ZoneType;
  emplacements: Emplacement[];
  lotsParEmp: Map<string, Lot[]>;
  caissonsById: Record<string, string>;
  hoveredLotId: string | null;
  activeStatuts: Set<StatutTriage>;
  searchQuery: string;
  isFullscreen: boolean;
  onToggleFullscreen: (zone: ZoneType) => void;
  onHoverChange: (lotId: string | null) => void;
};

function VracDropZone({
  emplacement,
  lots,
  caissonsById,
  hoveredLotId,
  activeStatuts,
  searchQuery,
  onHoverChange,
}: {
  emplacement: Emplacement;
  lots: Lot[];
  caissonsById: Record<string, string>;
  hoveredLotId: string | null;
  activeStatuts: Set<StatutTriage>;
  searchQuery: string;
  onHoverChange: (lotId: string | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableEmplacementId(emplacement.id),
    data: { emplacementId: emplacement.id },
  });
  return (
    <div
      ref={setNodeRef}
      className={`prep-content ${isOver ? "drop-target-vrac" : ""}`}
      data-emp-id={emplacement.id}
    >
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
  );
}

export function Zone({
  zone,
  emplacements,
  lotsParEmp,
  caissonsById,
  hoveredLotId,
  activeStatuts,
  searchQuery,
  isFullscreen,
  onToggleFullscreen,
  onHoverChange,
}: Props) {
  const vrac = zone === "PREP" || zone === "TAMPON";

  return (
    <section className={`zone zone-${zone} ${isFullscreen ? "fullscreen" : ""}`}>
      <span className="zone-label">
        {ZONE_LABELS[zone]}
        <button
          type="button"
          className="fs-toggle"
          onClick={() => onToggleFullscreen(zone)}
          title={isFullscreen ? "Fermer plein écran" : "Plein écran"}
          aria-label={
            isFullscreen
              ? `Fermer plein écran ${ZONE_LABELS[zone]}`
              : `Plein écran ${ZONE_LABELS[zone]}`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 9 4 4 9 4" />
            <polyline points="20 9 20 4 15 4" />
            <polyline points="4 15 4 20 9 20" />
            <polyline points="20 15 20 20 15 20" />
          </svg>
        </button>
      </span>
      {vrac ? (
        emplacements.length > 0 ? (
          <VracDropZone
            emplacement={emplacements[0]}
            lots={emplacements.flatMap((e) => lotsParEmp.get(e.id) ?? [])}
            caissonsById={caissonsById}
            hoveredLotId={hoveredLotId}
            activeStatuts={activeStatuts}
            searchQuery={searchQuery}
            onHoverChange={onHoverChange}
          />
        ) : (
          <div className="prep-content" />
        )
      ) : (
        <div className="allees">
          {emplacements.map((emp) => (
            <Allee
              key={emp.id}
              emplacement={emp}
              lots={lotsParEmp.get(emp.id) ?? []}
              caissonsById={caissonsById}
              hoveredLotId={hoveredLotId}
              activeStatuts={activeStatuts}
              searchQuery={searchQuery}
              onHoverChange={onHoverChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}
