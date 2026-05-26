import "server-only";
import { getBase, TABLE_IDS } from "./client";
import type { Emplacement, Zone } from "@/lib/types/domain";
import { ZONES } from "@/lib/types/domain";

function isZone(value: unknown): value is Zone {
  return typeof value === "string" && (ZONES as readonly string[]).includes(value);
}

export async function fetchAllEmplacements(): Promise<Emplacement[]> {
  const records = await getBase()(TABLE_IDS.Emplacements)
    .select({ fields: ["Name", "Zone", "Allée"] })
    .all();

  return records.map((r) => {
    const zoneRaw = r.get("Zone");
    const allee = r.get("Allée");
    return {
      id: r.id,
      name: (r.get("Name") as string | undefined) ?? "",
      zone: isZone(zoneRaw) ? zoneRaw : "A",
      allee: typeof allee === "string" ? allee : null,
    };
  });
}
