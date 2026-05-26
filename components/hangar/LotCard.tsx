"use client";

import { statutClass } from "@/lib/hangar/statut";
import type { Lot } from "@/lib/types/domain";

type Props = {
  lot: Lot;
  caissonsById: Record<string, string>;
  isHighlighted: boolean;
  isDimmed: boolean;
  isAllotable: boolean;
  onHoverChange: (lotId: string | null) => void;
};

export function LotCard({
  lot,
  caissonsById,
  isHighlighted,
  isDimmed,
  isAllotable,
  onHoverChange,
}: Props) {
  const caissonNumeros = lot.caissonIds
    .map((id) => caissonsById[id])
    .filter((n): n is string => Boolean(n));

  const classes = [
    "lot",
    statutClass(lot.statut),
    isHighlighted ? "highlight" : "",
    isDimmed ? "dimmed-by-filter" : "",
    isAllotable ? "allotable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      data-lot-id={lot.id}
      onMouseEnter={() => onHoverChange(lot.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div className="lot-num">{lot.nom}</div>
      {lot.produit ? <div className="lot-produit">{lot.produit}</div> : null}
      {caissonNumeros.length > 0 ? (
        <div className="lot-caissons">
          {caissonNumeros.map((num) => (
            <span key={num} className="lot-caisson-tag">
              Caisson {num}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
