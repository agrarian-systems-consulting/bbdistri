import type { Lot, StatutTriage } from "@/lib/types/domain";

export function matchesSearch(lot: Lot, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (lot.nom.toLowerCase().includes(q)) return true;
  if (lot.produit && lot.produit.toLowerCase().includes(q)) return true;
  return false;
}

export function isAllotable(lot: Lot): boolean {
  return Boolean(lot.cleAllotement);
}

/**
 * Combine les 3 filtres actifs en un seul booléen "ce lot doit-il être atténué".
 * - Filtre statut : Set vide = aucun filtre statut actif
 * - Recherche : chaîne vide = pas de filtre recherche
 * - Mode allotements : si activé, les lots non-allotables sont gérés par le CSS
 *   (body.allotement-on), pas via dimmed-by-filter, donc pas pris en compte ici
 */
export function shouldDimByFilter(
  lot: Lot,
  activeStatuts: Set<StatutTriage>,
  searchQuery: string,
): boolean {
  if (activeStatuts.size > 0 && !activeStatuts.has(lot.statut)) return true;
  if (!matchesSearch(lot, searchQuery)) return true;
  return false;
}
