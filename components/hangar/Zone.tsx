import type { Emplacement, Lot, Zone as ZoneType } from "@/lib/types/domain";
import { Allee } from "./Allee";
import { LotCard } from "./LotCard";

const ZONE_LABELS: Record<ZoneType, string> = {
  A: "ZONE A",
  B: "ZONE B",
  C: "ZONE C",
  PREP: "ZONE PRÉPARATION COMMANDE",
  TAMPON: "TAMPON",
};

export function Zone({
  zone,
  emplacements,
  lotsParEmp,
}: {
  zone: ZoneType;
  emplacements: Emplacement[];
  lotsParEmp: Map<string, Lot[]>;
}) {
  const vrac = zone === "PREP" || zone === "TAMPON";

  return (
    <section className={`zone zone-${zone}`}>
      <span className="zone-label">{ZONE_LABELS[zone]}</span>
      {vrac ? (
        <div className="prep-content">
          {emplacements.flatMap((emp) =>
            (lotsParEmp.get(emp.id) ?? []).map((lot) => (
              <LotCard key={`${emp.id}-${lot.id}`} lot={lot} />
            )),
          )}
        </div>
      ) : (
        <div className="allees">
          {emplacements.map((emp) => (
            <Allee
              key={emp.id}
              emplacement={emp}
              lots={lotsParEmp.get(emp.id) ?? []}
            />
          ))}
        </div>
      )}
    </section>
  );
}
