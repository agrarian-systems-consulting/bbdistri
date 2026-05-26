import { HangarView } from "@/components/hangar/HangarView";
import { fetchCaissonsById } from "@/lib/airtable/caissons";
import { fetchAllEmplacements } from "@/lib/airtable/emplacements";
import { fetchHangarLots } from "@/lib/airtable/lots";

export const dynamic = "force-dynamic";

export default async function Home() {
  let lots, emplacements, caissonsById;
  let error: string | null = null;
  try {
    [lots, emplacements, caissonsById] = await Promise.all([
      fetchHangarLots(),
      fetchAllEmplacements(),
      fetchCaissonsById(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Erreur inconnue";
  }

  if (error || !lots || !emplacements || !caissonsById) {
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
    />
  );
}
