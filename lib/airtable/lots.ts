import "server-only";
import type { FieldSet, Record as AirtableRecord } from "airtable";
import { getBase, TABLE_IDS } from "./client";
import type { BioC2, Lot, StatutTriage } from "@/lib/types/domain";

const LOT_FIELDS = [
  "Lot",
  "Statut triage",
  "Produit (court)",
  "Bio/C2",
  "Emplacements",
  "Dépôt",
  "Caissons",
  "Destination",
  "CléSuggestionAllotement",
  "Commentaire",
] as const;

function normalizeBioC2(value: unknown): BioC2 | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase();
  if (upper === "BIO") return "Bio";
  if (upper === "C2") return "C2";
  return null;
}

function recordToLot(record: AirtableRecord<FieldSet>): Lot {
  const produitCourt = record.get("Produit (court)") as string[] | undefined;
  const cle = record.get("CléSuggestionAllotement");
  const comm = record.get("Commentaire");

  return {
    id: record.id,
    nom: (record.get("Lot") as string | undefined) ?? "",
    statut:
      (record.get("Statut triage") as StatutTriage | undefined) ??
      "Non affecté",
    produit: produitCourt?.[0] ?? null,
    bioC2: normalizeBioC2(record.get("Bio/C2")),
    emplacementIds: (record.get("Emplacements") as string[] | undefined) ?? [],
    caissonIds: (record.get("Caissons") as string[] | undefined) ?? [],
    destinationIds: (record.get("Destination") as string[] | undefined) ?? [],
    depotIds: (record.get("Dépôt") as string[] | undefined) ?? [],
    cleAllotement: typeof cle === "string" && cle.length > 0 ? cle : null,
    commentaire: typeof comm === "string" && comm.length > 0 ? comm : null,
  };
}

export async function fetchAllLots(): Promise<Lot[]> {
  const records = await getBase()(TABLE_IDS.Lots)
    .select({ fields: LOT_FIELDS as unknown as string[] })
    .all();
  return records.map(recordToLot);
}

let cachedHangarDepotId: string | null = null;

async function getHangarDepotId(): Promise<string> {
  if (cachedHangarDepotId) return cachedHangarDepotId;
  const records = await getBase()(TABLE_IDS.Depots).select().all();
  const hangar = records.find((r) => r.get("Name") === "Hangar");
  if (!hangar) {
    throw new Error(
      `Dépôt "Hangar" introuvable dans la table Dépôts (${TABLE_IDS.Depots})`,
    );
  }
  cachedHangarDepotId = hangar.id;
  return hangar.id;
}

/**
 * Lots du dépôt Hangar, hors statut Epuisé.
 * Filtres appliqués selon les décisions UX (cf. docs/CLAUDE.md).
 */
export async function fetchHangarLots(): Promise<Lot[]> {
  const [all, hangarId] = await Promise.all([
    fetchAllLots(),
    getHangarDepotId(),
  ]);
  return all.filter(
    (lot) => lot.statut !== "Epuisé" && lot.depotIds.includes(hangarId),
  );
}
