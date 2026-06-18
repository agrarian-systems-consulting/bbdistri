import "server-only";
import { getBase, TABLE_IDS } from "./client";
import type { Emplacement, Zone } from "@/lib/types/domain";
import { ZONES } from "@/lib/types/domain";

function isAbcZone(value: unknown): value is "A" | "B" | "C" {
  return value === "A" || value === "B" || value === "C";
}

/**
 * Le champ Airtable "Zone" n'a que les options A / B / C.
 * La zone vrac PREP est identifiée par le nom de l'emplacement :
 *   - "Zone préparation commande" → PREP
 * (cf. data réelle base test 2026-05-26)
 * NB : l'emplacement "Zone-tampon" existe encore dans Airtable mais n'est plus
 * exposé au front — il est filtré dans fetchAllEmplacements.
 */
function detectZone(rawZone: unknown, name: string): Zone {
  if (name === "Zone préparation commande") return "PREP";
  if (isAbcZone(rawZone)) return rawZone;
  if (typeof rawZone === "string" && (ZONES as readonly string[]).includes(rawZone)) {
    return rawZone as Zone;
  }
  return "A";
}

export async function fetchAllEmplacements(): Promise<Emplacement[]> {
  const records = await getBase()(TABLE_IDS.Emplacements)
    .select({ fields: ["Name", "Zone", "Allée"] })
    .all();

  return records
    .filter((r) => (r.get("Name") as string | undefined) !== "Zone-tampon")
    .map((r) => {
    const name = (r.get("Name") as string | undefined) ?? "";
    const allee = r.get("Allée");
    return {
      id: r.id,
      name,
      zone: detectZone(r.get("Zone"), name),
      allee: typeof allee === "string" ? allee : null,
    };
  });
}
