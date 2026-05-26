import { statutClass } from "@/lib/hangar/statut";
import type { Lot } from "@/lib/types/domain";

export function LotCard({ lot }: { lot: Lot }) {
  return (
    <div className={`lot ${statutClass(lot.statut)}`} data-lot-id={lot.id}>
      <div className="lot-num">{lot.nom}</div>
      {lot.produit ? <div className="lot-produit">{lot.produit}</div> : null}
    </div>
  );
}
