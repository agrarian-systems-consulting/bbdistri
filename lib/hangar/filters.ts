import type { Lot, StatutTriage } from "@/lib/types/domain";

export function matchesSearch(lot: Lot, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (lot.nom.toLowerCase().includes(q)) return true;
  if (lot.produit && lot.produit.toLowerCase().includes(q)) return true;
  return false;
}

/**
 * Clé d'allotement augmentée : on combine la CléSuggestionAllotement Airtable
 * (Produit + Destination) avec le statut de triage. Deux lots ne peuvent
 * être regroupés que s'ils ont le MÊME statut de triage en plus du même
 * produit/destination (un Brut ne s'allote pas avec un Trié).
 * Les statuts "Epuisé" et "Non affecté" sont exclus côté Airtable (formula
 * renvoie chaîne vide) mais on garde la double sécurité ici.
 */
export function allotementKey(lot: Lot): string | null {
  if (!lot.cleAllotement) return null;
  if (lot.statut === "Epuisé" || lot.statut === "Non affecté") return null;
  return `${lot.cleAllotement}|${lot.statut}`;
}

/**
 * Parse une clé augmentée pour l'affichage : `cle|statut` → { cle, statut }
 */
export function parseAllotementKey(
  key: string,
): { cle: string; statut: string } {
  const sep = key.lastIndexOf("|");
  if (sep === -1) return { cle: key, statut: "" };
  return { cle: key.slice(0, sep), statut: key.slice(sep + 1) };
}

/**
 * Groupes d'allotement = clés (Produit+Destination+Statut) partagées par ≥ 2 lots.
 */
export function computeAllotementGroups(lots: Lot[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const lot of lots) {
    const key = allotementKey(lot);
    if (!key) continue;
    const arr = map.get(key);
    if (arr) arr.push(lot.id);
    else map.set(key, [lot.id]);
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
  if (allotementHoveredKey && allotementKey(lot) !== allotementHoveredKey) {
    return true;
  }
  return false;
}
