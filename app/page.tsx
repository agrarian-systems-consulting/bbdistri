import { fetchHangarLots } from "@/lib/airtable/lots";
import { fetchAllEmplacements } from "@/lib/airtable/emplacements";
import {
  groupEmplacementsByZone,
  groupLotsByEmplacement,
  sortEmplacements,
} from "@/lib/hangar/layout";
import { ZONES, type Zone } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

const ZONE_LABELS: Record<Zone, string> = {
  A: "Zone A",
  B: "Zone B",
  C: "Zone C",
  PREP: "Préparation commande",
  TAMPON: "Tampon",
};

export default async function Home() {
  let lots, emplacements;
  let error: string | null = null;
  try {
    [lots, emplacements] = await Promise.all([
      fetchHangarLots(),
      fetchAllEmplacements(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Erreur inconnue";
  }

  if (error) {
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

  if (!lots || !emplacements) return null;

  const lotsParEmp = groupLotsByEmplacement(lots);
  const empsParZone = groupEmplacementsByZone(emplacements);

  return (
    <main className="flex-1 p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Interface Hangar — SCIC Graines équitables
        </h1>
        <p className="text-sm text-muted-foreground">
          {lots.length} lots actifs · {emplacements.length} emplacements ·{" "}
          <span className="font-medium">vue brute (étape 4)</span>
        </p>
      </header>

      <div className="space-y-8">
        {ZONES.map((zone) => {
          const raw = empsParZone.get(zone);
          if (!raw || raw.length === 0) return null;
          const sorted = sortEmplacements(raw, zone);
          return (
            <section key={zone} className="space-y-2">
              <h2 className="text-lg font-semibold">{ZONE_LABELS[zone]}</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {sorted.map((emp) => {
                  const lotsHere = lotsParEmp.get(emp.id) ?? [];
                  return (
                    <div
                      key={emp.id}
                      className="rounded-md border border-border bg-card p-3 text-card-foreground"
                    >
                      <div className="text-sm font-medium">{emp.name}</div>
                      {lotsHere.length === 0 ? (
                        <div className="mt-1 text-xs text-muted-foreground italic">
                          vide
                        </div>
                      ) : (
                        <ul className="mt-2 space-y-1 text-xs">
                          {lotsHere.map((lot) => (
                            <li key={lot.id} className="flex flex-col">
                              <span className="font-medium">{lot.nom}</span>
                              <span className="text-muted-foreground">
                                {lot.produit ?? "?"} · {lot.statut}
                                {lot.bioC2 ? ` · ${lot.bioC2}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
