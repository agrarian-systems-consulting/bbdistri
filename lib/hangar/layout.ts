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
 * Nombre maximum d'allées physiques par zone (cf. maquette v1).
 * Airtable peut contenir des allées au-delà (réserves non utilisées) ;
 * on les masque côté UI.
 */
const MAX_ALLEES: Record<Zone, number> = {
  A: 17,
  B: 20,
  C: 22,
  PREP: Number.POSITIVE_INFINITY,
};

/**
 * Tri des allées selon la convention du hangar (cf. docs/CLAUDE.md) :
 * - Zone A : décroissant (A17 → A01), max 17
 * - Zone B : décroissant (B20 → B01), max 20
 * - Zone C : croissant (C1 → C22), max 22
 * - PREP : ordre stable d'insertion, pas de filtre numérique
 */
export function sortEmplacements(
  emplacements: Emplacement[],
  zone: Zone,
): Emplacement[] {
  if (zone === "PREP") return emplacements;

  const max = MAX_ALLEES[zone];
  const filtered = emplacements.filter((e) => {
    const n = Number(e.allee);
    return Number.isFinite(n) && n >= 1 && n <= max;
  });

  const reversed = zone === "A" || zone === "B";
  return filtered.sort((a, b) => {
    const an = Number(a.allee);
    const bn = Number(b.allee);
    return reversed ? bn - an : an - bn;
  });
}
