import "server-only";
import type { FieldSet, Record as AirtableRecord } from "airtable";
import { getBase, RECORD_IDS, TABLE_IDS } from "./client";
import type { BioC2, LightLot, Lot, StatutTriage } from "@/lib/types/domain";

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

const LIGHT_LOT_FIELDS = [
  "Lot",
  "Statut triage",
  "Produit (court)",
  "Emplacements",
] as const;

export async function fetchLightLots(): Promise<LightLot[]> {
  const records = await getBase()(TABLE_IDS.Lots)
    .select({ fields: LIGHT_LOT_FIELDS as unknown as string[] })
    .all();
  return records.map((r) => {
    const produitCourt = r.get("Produit (court)") as string[] | undefined;
    return {
      id: r.id,
      nom: (r.get("Lot") as string | undefined) ?? "",
      statut:
        (r.get("Statut triage") as StatutTriage | undefined) ?? "Non affecté",
      produit: produitCourt?.[0] ?? null,
      emplacementIds:
        (r.get("Emplacements") as string[] | undefined) ?? [],
    };
  });
}

/**
 * ID du dépôt principal. Résolu par ID de record (et non par libellé) pour
 * que le dépôt puisse être renommé librement dans Airtable sans casser l'app.
 * Cf. RECORD_IDS.DepotHangar dans client.ts.
 */
function getHangarDepotId(): string {
  return RECORD_IDS.DepotHangar;
}

/**
 * Lots pertinents pour la vue Hangar.
 *
 * On retient (hors statut Epuisé) tout lot qui est soit rattaché au dépôt
 * Hangar, soit sans aucun dépôt saisi — y compris les "Non affecté" : la
 * récolte n'est pas toujours saisie au bureau, et il faut quand même pouvoir
 * localiser/placer ces lots via l'AddLotModal.
 *
 * On exclut volontairement les lots rattachés à un AUTRE dépôt (cellules,
 * silos, caserne…) : ils sont physiquement rangés ailleurs et n'ont pas à
 * être proposés à l'ajout dans le hangar.
 *
 * NB : les "Non affecté" sont délibérément masqués de la sidebar « à placer »
 * côté HangarView (sinon ~450 lots l'inonderaient) — ils restent accessibles
 * à la recherche dans l'AddLotModal.
 */
export async function fetchHangarLots(): Promise<Lot[]> {
  const all = await fetchAllLots();
  const hangarId = getHangarDepotId();
  return all.filter((lot) => {
    if (lot.statut === "Epuisé") return false;
    return lot.depotIds.includes(hangarId) || lot.depotIds.length === 0;
  });
}
