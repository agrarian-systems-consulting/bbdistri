import type { Lot } from "@/lib/types/domain";

/** Libellé du groupe rassemblant les lots sans campagne saisie. */
export const SANS_CAMPAGNE = "Sans campagne";

/**
 * Regroupe les lots par campagne et ordonne les groupes par année
 * décroissante (la plus récente en tête), les lots sans campagne en dernier.
 * Trier par ordre décroissant évite de coder en dur la campagne courante :
 * la plus récente est toujours en haut et ouverte par défaut. Les lots non
 * datés ne sont jamais perdus : ils tombent dans le groupe « Sans campagne ».
 *
 * Les campagnes sont stockées en texte ("2026") : on compare en numérique
 * pour un tri d'années fiable ; toute valeur non numérique retombe sur un
 * tri texte décroissant.
 */
export function groupByCampagne(lots: Lot[]): Array<[string, Lot[]]> {
  const groups = new Map<string, Lot[]>();
  for (const lot of lots) {
    const key = lot.campagne ?? SANS_CAMPAGNE;
    const bucket = groups.get(key);
    if (bucket) bucket.push(lot);
    else groups.set(key, [lot]);
  }

  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === SANS_CAMPAGNE) return 1;
    if (b === SANS_CAMPAGNE) return -1;
    const na = Number.parseInt(a, 10);
    const nb = Number.parseInt(b, 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return b.localeCompare(a);
    return nb - na;
  });
}
