import {
  groupEmplacementsByZone,
  groupLotsByEmplacement,
} from "@/lib/hangar/layout";
import type { Emplacement, Lot } from "@/lib/types/domain";
import { HangarPlan } from "./HangarPlan";
import { Topbar } from "./Topbar";

export function HangarView({
  lots,
  emplacements,
}: {
  lots: Lot[];
  emplacements: Emplacement[];
}) {
  const lotsParEmp = groupLotsByEmplacement(lots);
  const empsParZone = groupEmplacementsByZone(emplacements);

  return (
    <>
      <Topbar
        totalLots={lots.length}
        totalEmplacements={emplacements.length}
      />
      <HangarPlan empsParZone={empsParZone} lotsParEmp={lotsParEmp} />
      <p className="footer-note">
        Vraies données Airtable. Lots <em>Epuisé</em> et dépôt ≠{" "}
        <em>Hangar</em> filtrés en amont.
      </p>
    </>
  );
}
