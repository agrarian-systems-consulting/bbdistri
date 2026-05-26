import type { Emplacement, Lot, Zone } from "@/lib/types/domain";

/**
 * Map des lots par emplacementId. Un lot multi-emplacements apparaît dans
 * plusieurs entrées (une par emplacement lié).
 */
export function groupLotsByEmplacement(lots: Lot[]): Map<string, Lot[]> {
  const map = new Map<string, Lot[]>();
  for (const lot of lots) {
    for (const empId of lot.emplacementIds) {
      const arr = map.get(empId);
      if (arr) arr.push(lot);
      else map.set(empId, [lot]);
    }
  }
  return map;
}

export function groupEmplacementsByZone(
  emplacements: Emplacement[],
): Map<Zone, Emplacement[]> {
  const map = new Map<Zone, Emplacement[]>();
  for (const emp of emplacements) {
    const arr = map.get(emp.zone);
    if (arr) arr.push(emp);
    else map.set(emp.zone, [emp]);
  }
  return map;
}

/**
 * Tri des allées selon la convention du hangar (cf. docs/CLAUDE.md) :
 * - Zone A : décroissant (A17 → A01)
 * - Zone B : décroissant (B20 → B01)
 * - Zone C : croissant (C1 → C15)
 * - PREP / TAMPON : ordre stable d'insertion
 */
export function sortEmplacements(
  emplacements: Emplacement[],
  zone: Zone,
): Emplacement[] {
  if (zone === "PREP" || zone === "TAMPON") return emplacements;

  const reversed = zone === "A" || zone === "B";
  return [...emplacements].sort((a, b) => {
    const an = Number(a.allee ?? Number.NaN);
    const bn = Number(b.allee ?? Number.NaN);
    if (Number.isNaN(an) || Number.isNaN(bn)) return 0;
    return reversed ? bn - an : an - bn;
  });
}
