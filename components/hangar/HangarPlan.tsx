import { sortEmplacements } from "@/lib/hangar/layout";
import type { Emplacement, Lot, Zone as ZoneType } from "@/lib/types/domain";
import { Zone } from "./Zone";

export function HangarPlan({
  empsParZone,
  lotsParEmp,
}: {
  empsParZone: Map<ZoneType, Emplacement[]>;
  lotsParEmp: Map<string, Lot[]>;
}) {
  const zoneA = empsParZone.get("A") ?? [];
  const zoneB = empsParZone.get("B") ?? [];
  const zoneC = empsParZone.get("C") ?? [];
  const zonePrep = empsParZone.get("PREP") ?? [];
  const zoneTampon = empsParZone.get("TAMPON") ?? [];

  const hasA = zoneA.length > 0;
  const hasB = zoneB.length > 0;
  const hasC = zoneC.length > 0;
  const hasPrep = zonePrep.length > 0;
  const hasTampon = zoneTampon.length > 0;

  return (
    <main className="hangar">
      <div className={`rang-haut ${hasPrep ? "" : "no-prep"}`}>
        {hasA && (
          <Zone
            zone="A"
            emplacements={sortEmplacements(zoneA, "A")}
            lotsParEmp={lotsParEmp}
          />
        )}
        {hasPrep && (
          <>
            <div className="passage-vertical">passage</div>
            <Zone zone="PREP" emplacements={zonePrep} lotsParEmp={lotsParEmp} />
          </>
        )}
      </div>

      <div className="allee-passage">— allée de passage —</div>

      <div className={`rang-bas ${hasTampon ? "" : "no-tampon"}`}>
        {hasC && (
          <Zone
            zone="C"
            emplacements={sortEmplacements(zoneC, "C")}
            lotsParEmp={lotsParEmp}
          />
        )}
        {hasTampon && (
          <Zone zone="TAMPON" emplacements={zoneTampon} lotsParEmp={lotsParEmp} />
        )}
        {hasB && (
          <Zone
            zone="B"
            emplacements={sortEmplacements(zoneB, "B")}
            lotsParEmp={lotsParEmp}
          />
        )}
      </div>
    </main>
  );
}
