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
  fullscreenZone: ZoneType | null;
  onToggleFullscreen: (zone: ZoneType) => void;
  onHoverChange: (lotId: string | null) => void;
};

export function HangarPlan(props: Props) {
  const {
    empsParZone,
    lotsParEmp,
    caissonsById,
    hoveredLotId,
    activeStatuts,
    fullscreenZone,
    onToggleFullscreen,
    onHoverChange,
  } = props;

  const zoneProps = (zone: ZoneType, emps: Emplacement[]) => ({
    zone,
    emplacements: emps,
    lotsParEmp,
    caissonsById,
    hoveredLotId,
    activeStatuts,
    isFullscreen: fullscreenZone === zone,
    onToggleFullscreen,
    onHoverChange,
  });

  return (
    <main className="hangar">
      <div className="rang-haut">
        <Zone
          {...zoneProps("A", sortEmplacements(empsParZone.get("A") ?? [], "A"))}
        />
        <div className="passage-vertical">passage</div>
        <Zone {...zoneProps("PREP", empsParZone.get("PREP") ?? [])} />
      </div>

      <div className="allee-passage">— allée de passage —</div>

      <div className="rang-bas">
        <Zone
          {...zoneProps("C", sortEmplacements(empsParZone.get("C") ?? [], "C"))}
        />
        <Zone {...zoneProps("TAMPON", empsParZone.get("TAMPON") ?? [])} />
        <Zone
          {...zoneProps("B", sortEmplacements(empsParZone.get("B") ?? [], "B"))}
        />
      </div>
    </main>
  );
}
