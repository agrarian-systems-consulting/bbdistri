import type { StatutTriage } from "@/lib/types/domain";

/**
 * Classe CSS à appliquer sur .lot pour colorer la bordure gauche
 * selon le statut. Les classes correspondent à app/globals.css.
 */
const STATUT_CLASS: Record<StatutTriage, string> = {
  Brut: "statut-Brut",
  Trié: "statut-Trie",
  "Trié stocké": "statut-Trie-stocke",
  "A retrier": "statut-A-retrier",
  "Non affecté": "statut-Non-affecte",
  Epuisé: "statut-Epuise",
};

export function statutClass(statut: StatutTriage): string {
  return STATUT_CLASS[statut] ?? "statut-Non-affecte";
}
