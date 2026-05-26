export const ZONES = ["A", "B", "C", "PREP", "TAMPON"] as const;
export type Zone = (typeof ZONES)[number];

export const STATUTS_TRIAGE = [
  "Brut",
  "Trié",
  "Trié stocké",
  "À retrier",
  "Non affecté",
  "Epuisé",
] as const;
export type StatutTriage = (typeof STATUTS_TRIAGE)[number];

export type BioC2 = "Bio" | "C2";

export type Lot = {
  id: string;
  nom: string;
  statut: StatutTriage;
  produit: string | null;
  bioC2: BioC2 | null;
  emplacementIds: string[];
  caissonIds: string[];
  destinationIds: string[];
  depotIds: string[];
  cleAllotement: string | null;
};

export type Emplacement = {
  id: string;
  name: string;
  zone: Zone;
  allee: string | null;
};

export type HangarSnapshot = {
  lots: Lot[];
  emplacements: Emplacement[];
};
