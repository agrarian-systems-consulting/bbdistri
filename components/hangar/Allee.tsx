import type { Emplacement, Lot, StatutTriage } from "@/lib/types/domain";
import { LotCard } from "./LotCard";

type Props = {
  emplacement: Emplacement;
  lots: Lot[];
  caissonsById: Record<string, string>;
  hoveredLotId: string | null;
  activeStatuts: Set<StatutTriage>;
  onHoverChange: (lotId: string | null) => void;
};

export function Allee({
  emplacement,
  lots,
  caissonsById,
  hoveredLotId,
  activeStatuts,
  onHoverChange,
}: Props) {
  const empty = lots.length === 0;
  const label = emplacement.allee ?? emplacement.name;
  const noFilter = activeStatuts.size === 0;
  return (
    <div className={`allee ${empty ? "vide" : ""}`} data-emp-id={emplacement.id}>
      <div className="allee-header">{label}</div>
      <div className="allee-content">
        {lots.map((lot) => (
          <LotCard
            key={`${emplacement.id}-${lot.id}`}
            lot={lot}
            caissonsById={caissonsById}
            isHighlighted={hoveredLotId === lot.id}
            isDimmed={!noFilter && !activeStatuts.has(lot.statut)}
            onHoverChange={onHoverChange}
          />
        ))}
      </div>
    </div>
  );
}
