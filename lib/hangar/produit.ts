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
 * True si le lot est un écart de tri dont le code article reste à préciser,
 * c.-à-d. rattaché à un article dont l'artcode vaut « APRECISER ».
 */
export function lotNeedsArticleCode(
  lot: Lot,
  codeByProduitId: Map<string, string>,
): boolean {
  return lot.produitIds.some((id) => {
    const code = codeByProduitId.get(id);
    return code !== undefined && isAPreciserCode(code);
  });
}
