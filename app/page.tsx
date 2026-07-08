import { HangarView } from "@/components/hangar/HangarView";
import { fetchCaissonsById } from "@/lib/airtable/caissons";
import { fetchCatalogue } from "@/lib/airtable/catalogue";
import { fetchDestinationsById } from "@/lib/airtable/destinations";
import { fetchAllEmplacements } from "@/lib/airtable/emplacements";
import { fetchHangarLots } from "@/lib/airtable/lots";

export const dynamic = "force-dynamic";

export default async function Home() {
  let lots, emplacements, caissonsById, destinationsById, catalogue;
  let error: string | null = null;
  try {
    [lots, emplacements, caissonsById, destinationsById, catalogue] =
      await Promise.all([
        fetchHangarLots(),
        fetchAllEmplacements(),
        fetchCaissonsById(),
        fetchDestinationsById(),
        fetchCatalogue(),
      ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Erreur inconnue";
  }

  if (
    error ||
    !lots ||
    !emplacements ||
    !caissonsById ||
    !destinationsById ||
    !catalogue
  ) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-xl space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <h1 className="text-xl font-semibold text-destructive">
            Configuration Airtable incomplète
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            Renseigner <code>.env.local</code> puis recharger.
          </p>
        </div>
      </main>
    );
  }

  return (
    <HangarView
      lots={lots}
      emplacements={emplacements}
      caissonsById={caissonsById}
      destinationsById={destinationsById}
      catalogue={catalogue}
    />
  );
}
