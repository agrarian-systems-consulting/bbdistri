import "server-only";
import Airtable, { type Base } from "airtable";

export const TABLE_IDS = {
  Lots: "tblLYUOw0rwL5OJAT",
  Emplacements: "tblV0Kws9SasEAM3g",
  Catalogue: "tblnXQZs7n8JIejlD",
  Depots: "tblXP2p2xgQ7yRSW6",
  Caissons: "tblkilMNlWg0pQY4h",
  Destinations: "tbl9C2FJ91XMoXvDp",
  LogsLots: "tblNK5sY1zO7esi5y",
} as const;

/**
 * IDs de records de référence, stables quel que soit leur libellé.
 * Le dépôt principal peut être renommé librement dans Airtable (ex. "Hangar"
 * → "BBDistri") sans impacter le code : on le résout par cet ID, jamais par
 * son nom.
 */
export const RECORD_IDS = {
  DepotHangar: "recAcfsTxopxDiyFe",
} as const;

let cachedBase: Base | null = null;

export function getBase(): Base {
  if (cachedBase) return cachedBase;

  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!pat) {
    throw new Error(
      "AIRTABLE_PAT manquant — ajoute ton Personal Access Token dans .env.local",
    );
  }
  if (!baseId) {
    throw new Error(
      "AIRTABLE_BASE_ID manquant — ajoute l'ID de la base dans .env.local",
    );
  }

  cachedBase = new Airtable({ apiKey: pat }).base(baseId);
  return cachedBase;
}
