import "server-only";
import { getBase, TABLE_IDS } from "./client";

/**
 * Un article du Catalogue, réduit à ce qui sert au rattachement d'un écart de
 * tri : son identité, son code article ({@link CatalogueItem.code} = artcode)
 * et un libellé affichable.
 */
export type CatalogueItem = {
  id: string;
  code: string;
  label: string;
};

/**
 * Liste des articles du Catalogue. Sert à deux choses côté hangar :
 *  - détecter les lots dont le code article reste à préciser (artcode
 *    "APRECISER") — cf. lib/hangar/produit.ts ;
 *  - proposer la liste des articles réels pour rattacher ces écarts de tri.
 *
 * Table "Catalogue" : primary field "Libellé" (formule), code dans "artcode"
 * (texte). On garde tout le catalogue : un écart peut être reclassé vers
 * n'importe quel article.
 */
export async function fetchCatalogue(): Promise<CatalogueItem[]> {
  const records = await getBase()(TABLE_IDS.Catalogue)
    .select({ fields: ["Libellé", "artcode"] })
    .all();
  return records.map((r) => {
    const label = r.get("Libellé");
    const code = r.get("artcode");
    const codeStr = typeof code === "string" ? code.trim() : "";
    return {
      id: r.id,
      code: codeStr,
      label:
        typeof label === "string" && label.length > 0
          ? label
          : codeStr || r.id,
    };
  });
}
