import type { Emplacement, Lot } from "@/lib/types/domain";
import { LotCard } from "./LotCard";

export function Allee({
  emplacement,
  lots,
}: {
  emplacement: Emplacement;
  lots: Lot[];
}) {
  const empty = lots.length === 0;
  const label = emplacement.allee ?? emplacement.name;
  return (
    <div className={`allee ${empty ? "vide" : ""}`} data-emp-id={emplacement.id}>
      <div className="allee-header">{label}</div>
      <div className="allee-content">
        {lots.map((lot) => (
          <LotCard key={`${emplacement.id}-${lot.id}`} lot={lot} />
        ))}
      </div>
    </div>
  );
}
