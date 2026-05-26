import type { Lot, StatutTriage } from "@/lib/types/domain";

export function matchesSearch(lot: Lot, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (lot.nom.toLowerCase().includes(q)) return true;
  if (lot.produit && lot.produit.toLowerCase().includes(q)) return true;
  return false;
}

/**
 * Groupes d'allotement = clés CléSuggestionAllotement partagées par ≥ 2 lots.
 * Un lot dont la clé est unique n'est PAS allotable (rien à regrouper avec).
 */
export function computeAllotementGroups(lots: Lot[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const lot of lots) {
    if (!lot.cleAllotement) continue;
    const arr = map.get(lot.cleAllotement);
    if (arr) arr.push(lot.id);
    else map.set(lot.cleAllotement, [lot.id]);
  }
  for (const [key, ids] of map.entries()) {
    if (ids.length < 2) map.delete(key);
  }
  return map;
}

export function isAllotable(
  lot: Lot,
  groups: Map<string, string[]>,
): boolean {
  return Boolean(lot.cleAllotement && groups.has(lot.cleAllotement));
}

/**
 * Atténuation d'un lot selon les filtres actifs combinés :
 *   - statut (set vide = pas de filtre)
 *   - recherche texte (chaîne vide = pas de filtre)
 *   - groupe d'allotement isolé (null = pas d'isolation)
 * Le mode allotement "global" (body.allotement-on) est géré en CSS, pas ici.
 */
export function shouldDimByFilter(
  lot: Lot,
  activeStatuts: Set<StatutTriage>,
  searchQuery: string,
  allotementHoveredKey: string | null,
): boolean {
  if (activeStatuts.size > 0 && !activeStatuts.has(lot.statut)) return true;
  if (!matchesSearch(lot, searchQuery)) return true;
  if (allotementHoveredKey && lot.cleAllotement !== allotementHoveredKey) {
    return true;
  }
  return false;
}
