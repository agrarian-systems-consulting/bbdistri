"use client";

import { useDroppable } from "@dnd-kit/core";
import { droppableEmplacementId } from "@/lib/hangar/dnd-ids";
import { shouldDimByFilter } from "@/lib/hangar/filters";
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
  allotableLotIds: Set<string>;
  allotementHoveredKey: string | null;
  isFullscreen: boolean;
  onToggleFullscreen: (zone: ZoneType) => void;
  onHoverChange: (lotId: string | null) => void;
  onLotClick: (lot: Lot) => void;
};

function VracDropZone({
  emplacement,
  lots,
  caissonsById,
  hoveredLotId,
  activeStatuts,
  searchQuery,
  allotableLotIds,
  allotementHoveredKey,
  onHoverChange,
  onLotClick,
}: {
  emplacement: Emplacement;
  lots: Lot[];
  caissonsById: Record<string, string>;
  hoveredLotId: string | null;
  activeStatuts: Set<StatutTriage>;
  searchQuery: string;
  allotableLotIds: Set<string>;
  allotementHoveredKey: string | null;
  onHoverChange: (lotId: string | null) => void;
  onLotClick: (lot: Lot) => void;
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
          isDimmed={shouldDimByFilter(
            lot,
            activeStatuts,
            searchQuery,
            allotementHoveredKey,
          )}
          isAllotable={allotableLotIds.has(lot.id)}
          onHoverChange={onHoverChange}
          onLotClick={onLotClick}
        />
      ))}
    </div>
  );
}

export function Zone(props: Props) {
  const {
    zone,
    emplacements,
    lotsParEmp,
    isFullscreen,
    onToggleFullscreen,
  } = props;
  const vrac = zone === "PREP" || zone === "TAMPON";
  const childProps = {
    caissonsById: props.caissonsById,
    hoveredLotId: props.hoveredLotId,
    activeStatuts: props.activeStatuts,
    searchQuery: props.searchQuery,
    allotableLotIds: props.allotableLotIds,
    allotementHoveredKey: props.allotementHoveredKey,
    onHoverChange: props.onHoverChange,
    onLotClick: props.onLotClick,
  };

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
            {...childProps}
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
              {...childProps}
            />
          ))}
        </div>
      )}
    </section>
  );
}
