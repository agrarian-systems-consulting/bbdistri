import { NextResponse } from "next/server";
import { fetchLightLots } from "@/lib/airtable/lots";

export const dynamic = "force-dynamic";

/**
 * Liste légère des lots actifs pour le typeahead AddLotModal.
 * On exclut Épuisé et Non affecté (l'utilisateur doit changer le statut dans
 * Airtable d'abord pour les replacer) et on retourne juste les champs nécessaires
 * à la sélection + au warning "déjà placé".
 */
export async function GET() {
  try {
    const lots = await fetchLightLots();
    const active = lots.filter(
      (l) => l.statut !== "Epuisé" && l.statut !== "Non affecté",
    );
    return NextResponse.json({ lots: active });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Airtable";
    console.error("[/api/lots/all] GET failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
