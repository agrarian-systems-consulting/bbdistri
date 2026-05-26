import "server-only";
import { getBase, TABLE_IDS } from "./client";

/**
 * Map des caissons par recordId → numéro affichable.
 * La table "Caissons métalliques" a "Numéro" comme primary field (singleLineText).
 */
export async function fetchCaissonsById(): Promise<Record<string, string>> {
  const records = await getBase()(TABLE_IDS.Caissons)
    .select({ fields: ["Numéro"] })
    .all();
  const map: Record<string, string> = {};
  for (const r of records) {
    const numero = r.get("Numéro");
    if (typeof numero === "string" && numero.length > 0) {
      map[r.id] = numero;
    }
  }
  return map;
}
