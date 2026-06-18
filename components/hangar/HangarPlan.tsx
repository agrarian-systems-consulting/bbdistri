import { sortEmplacements } from "@/lib/hangar/layout";
import type {
  Emplacement,
  Lot,
  StatutTriage,
  Zone as ZoneType,
} from "@/lib/types/domain";
import { Zone } from "./Zone";

type Props = {
  empsParZone: Map<ZoneType, Emplacement[]>;
  lotsParEmp: Map<string, Lot[]>;
  caissonsById: Record<string, string>;
  hoveredLotId: string | null;
  activeStatuts: Set<StatutTriage>;
  searchQuery: string;
  allotableLotIds: Set<string>;
  allotementHoveredKey: string | null;
  fullscreenZone: ZoneType | null;
  onToggleFullscreen: (zone: ZoneType) => void;
  onHoverChange: (lotId: string | null) => void;
  onLotClick: (lot: Lot) => void;
  onAddLotClick: (emplacement: Emplacement) => void;
};

export function HangarPlan(props: Props) {
  const zoneProps = (zone: ZoneType, emps: Emplacement[]) => ({
    zone,
    emplacements: emps,
    lotsParEmp: props.lotsParEmp,
    caissonsById: props.caissonsById,
    hoveredLotId: props.hoveredLotId,
    activeStatuts: props.activeStatuts,
    searchQuery: props.searchQuery,
    allotableLotIds: props.allotableLotIds,
    allotementHoveredKey: props.allotementHoveredKey,
    isFullscreen: props.fullscreenZone === zone,
    onToggleFullscreen: props.onToggleFullscreen,
    onHoverChange: props.onHoverChange,
    onLotClick: props.onLotClick,
    onAddLotClick: props.onAddLotClick,
  });

  return (
    <main className="hangar">
      <div className="rang-haut">
        <Zone
          {...zoneProps(
            "A",
            sortEmplacements(props.empsParZone.get("A") ?? [], "A"),
          )}
        />
        <div className="passage-vertical">passage</div>
        <Zone {...zoneProps("PREP", props.empsParZone.get("PREP") ?? [])} />
      </div>

      <div className="allee-passage">— allée de passage —</div>

      <div className="rang-bas">
        <Zone
          {...zoneProps(
            "C",
            sortEmplacements(props.empsParZone.get("C") ?? [], "C"),
          )}
        />
        <Zone
          {...zoneProps(
            "B",
            sortEmplacements(props.empsParZone.get("B") ?? [], "B"),
          )}
        />
      </div>
    </main>
  );
}
