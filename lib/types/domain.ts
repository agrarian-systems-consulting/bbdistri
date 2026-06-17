export const ZONES = ["A", "B", "C", "PREP", "TAMPON"] as const;
export type Zone = (typeof ZONES)[number];

export const STATUTS_TRIAGE = [
  "Brut",
  "En cours de triage",
  "Trié",
  "A retrier",
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
  commentaire: string | null;
};

export type Emplacement = {
  id: string;
  name: string;
  zone: Zone;
  allee: string | null;
};

/**
 * Version allégée d'un Lot pour les listes (typeahead AddLotModal).
 * Ne contient que ce qu'il faut pour la sélection : identité, statut, et
 * les emplacements actuels (pour détecter "déjà placé" / "fraction").
 */
export type LightLot = {
  id: string;
  nom: string;
  produit: string | null;
  statut: StatutTriage;
  emplacementIds: string[];
};

export type HangarSnapshot = {
  lots: Lot[];
  emplacements: Emplacement[];
};

/**
 * Entrée du journal "Log sur lots" : un changement de statut et/ou
 * d'emplacement sur un lot. Les noms (lot, emplacements) sont déjà résolus
 * côté serveur pour l'affichage. Les statuts sont les valeurs brutes Airtable.
 */
export type LotLog = {
  id: string;
  date: string;
  lotId: string | null;
  lotNom: string;
  types: string[];
  statutInitial: string | null;
  statutFinal: string | null;
  emplacementsInitiaux: string[];
  emplacementsFinaux: string[];
  modifiePar: string | null;
};
