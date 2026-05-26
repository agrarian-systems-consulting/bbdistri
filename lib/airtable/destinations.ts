import "server-only";
import { getBase, TABLE_IDS } from "./client";

/**
 * Map des destinations par recordId → nom affichable.
 * Table Airtable "Segment" : 5 destinations (Déchets, Semences, Alimentation animale,
 * Engrais verts, Alimentation humaine). Primary field = "Name" (singleLineText).
 */
export async function fetchDestinationsById(): Promise<Record<string, string>> {
  const records = await getBase()(TABLE_IDS.Destinations)
    .select({ fields: ["Name"] })
    .all();
  const map: Record<string, string> = {};
  for (const r of records) {
    const name = r.get("Name");
    if (typeof name === "string" && name.length > 0) {
      map[r.id] = name;
    }
  }
  return map;
}
