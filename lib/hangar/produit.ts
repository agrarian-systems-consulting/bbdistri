import type { CatalogueItem } from "@/lib/airtable/catalogue";
import type { Lot } from "@/lib/types/domain";

/**
 * Code article marquant un écart de tri dont l'article réel reste à préciser.
 * Comparé de façon normalisée (cf. {@link normalizeCode}), donc « A préciser »,
 * « APRECISER » ou « a-préciser » sont tous reconnus.
 */
const APRECISER_NORMALIZED = "APRECISER";

/** Normalise un code article : sans accents, sans séparateurs, en majuscules. */
function normalizeCode(code: string): string {
  return code
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques combinants
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

/** True si ce code article est le marqueur « à préciser ». */
export function isAPreciserCode(code: string): boolean {
  return normalizeCode(code) === APRECISER_NORMALIZED;
}

/** Construit une map recordId d'article → code article, depuis le catalogue. */
export function buildCodeByProduitId(
  catalogue: CatalogueItem[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of catalogue) map.set(item.id, item.code);
  return map;
}

/**
 * True si le code article du lot reste à préciser, c.-à-d. :
 *  - aucun article n'est lié au lot, OU
 *  - l'article lié est le générique dont l'artcode vaut « APRECISER ».
 * Dans les deux cas on ne sait pas encore à quel article rattacher le lot.
 */
export function lotNeedsArticleCode(
  lot: Lot,
  codeByProduitId: Map<string, string>,
): boolean {
  if (lot.produitIds.length === 0) return true;
  return lot.produitIds.some((id) => {
    const code = codeByProduitId.get(id);
    return code !== undefined && isAPreciserCode(code);
  });
}
