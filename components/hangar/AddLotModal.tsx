"use client";

import { useEffect, useMemo, useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { statutClass } from "@/lib/hangar/statut";
import type { Emplacement, Lot } from "@/lib/types/domain";

type Props = {
  emplacement: Emplacement | null;
  emplacementsById: Map<string, Emplacement>;
  caissonsById: Record<string, string>;
  onClose: () => void;
  onAdd: (lot: Lot, emplacement: Emplacement) => Promise<void>;
};

function StatutChip({ statut }: { statut: string }) {
  const klass = statutClass(statut as never);
  const color = {
    "statut-Trie": "var(--statut-trie)",
    "statut-Brut": "var(--statut-brut)",
    "statut-A-retrier": "var(--statut-aretrier)",
    "statut-Trie-stocke": "var(--statut-triestocke)",
    "statut-Non-affecte": "var(--statut-nonaffecte)",
    "statut-Epuise": "var(--statut-nonaffecte)",
  }[klass];
  return (
    <span
      className="text-[0.65rem] px-1.5 py-px rounded-full border bg-white"
      style={{ borderColor: color, color: color }}
    >
      {statut}
    </span>
  );
}

export function AddLotModal({
  emplacement,
  emplacementsById,
  caissonsById,
  onClose,
  onAdd,
}: Props) {
  const [allLots, setAllLots] = useState<Lot[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!emplacement) return;
    setSelectedLotId("");
    setFetchError(null);
    setAllLots(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lots/all");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { lots: Lot[] };
        if (!cancelled) setAllLots(data.lots);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [emplacement]);

  const options = useMemo<ComboboxOption[]>(() => {
    if (!allLots) return [];
    return allLots
      .slice()
      .sort((a, b) => a.nom.localeCompare(b.nom))
      .map((lot) => ({
        value: lot.id,
        label: lot.produit ? `${lot.nom} — ${lot.produit}` : lot.nom,
        right: <StatutChip statut={lot.statut} />,
      }));
  }, [allLots]);

  const selectedLot = useMemo(
    () => allLots?.find((l) => l.id === selectedLotId) ?? null,
    [allLots, selectedLotId],
  );

  if (!emplacement) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const alreadyHere =
    selectedLot && selectedLot.emplacementIds.includes(emplacement.id);
  const otherEmpNames = selectedLot
    ? selectedLot.emplacementIds
        .filter((id) => id !== emplacement.id)
        .map((id) => emplacementsById.get(id)?.name)
        .filter((n): n is string => Boolean(n))
    : [];
  const caissonNumeros = selectedLot
    ? selectedLot.caissonIds
        .map((id) => caissonsById[id])
        .filter((n): n is string => Boolean(n))
    : [];
  const isEpuise = selectedLot?.statut === "Epuisé";

  const submit = async () => {
    if (!selectedLot || alreadyHere || saving) return;
    setSaving(true);
    try {
      await onAdd(selectedLot, emplacement);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(emplacement)}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Ajouter un lot en{" "}
            <span className="font-mono text-amber-700">{emplacement.name}</span>
          </DialogTitle>
          <DialogDescription>
            Sélectionner un lot existant à ajouter à cet emplacement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>N° de lot ou produit</Label>
            <Combobox
              options={options}
              value={selectedLotId}
              onChange={setSelectedLotId}
              placeholder={
                allLots === null
                  ? fetchError
                    ? `Erreur chargement : ${fetchError}`
                    : "Chargement…"
                  : `Rechercher parmi ${allLots.length} lots…`
              }
              disabled={allLots === null}
            />
            <p className="text-xs text-stone-500">
              Les lots au statut <em>Épuisé</em> ou <em>Non affecté</em>{" "}
              n&apos;apparaissent pas dans cette liste : modifier leur statut
              dans Airtable d&apos;abord si tu dois les replacer.
            </p>
          </div>

          <div className="rounded-md border border-stone-200 bg-stone-50 p-3 min-h-[140px]">
            {selectedLot ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono font-semibold text-stone-900">
                    {selectedLot.nom}
                  </span>
                  <StatutChip statut={selectedLot.statut} />
                  {selectedLot.bioC2 ? (
                    <span className="text-xs text-stone-500">
                      {selectedLot.bioC2}
                    </span>
                  ) : null}
                </div>
                <div className="text-stone-700">
                  {selectedLot.produit ?? "Produit non défini"}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center text-xs">
                  <span className="text-stone-500">Emplacements actuels :</span>
                  {otherEmpNames.length > 0 ? (
                    otherEmpNames.map((n) => (
                      <span
                        key={n}
                        className="font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-50"
                      >
                        {n}
                      </span>
                    ))
                  ) : alreadyHere ? null : (
                    <span className="text-stone-400 italic">aucun</span>
                  )}
                  {alreadyHere ? (
                    <span className="font-mono px-2 py-0.5 rounded bg-amber-700 text-amber-50">
                      {emplacement.name} (déjà ici)
                    </span>
                  ) : null}
                </div>
                {caissonNumeros.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 items-center text-xs">
                    <span className="text-stone-500">Caissons :</span>
                    {caissonNumeros.map((n) => (
                      <span
                        key={n}
                        className="px-2 py-0.5 rounded bg-amber-700 text-amber-50"
                      >
                        Caisson {n}
                      </span>
                    ))}
                  </div>
                ) : null}

                {alreadyHere ? (
                  <p className="text-xs text-red-600 mt-2">
                    Ce lot est déjà placé en {emplacement.name}.
                  </p>
                ) : otherEmpNames.length > 0 ? (
                  <p className="text-xs text-amber-700 mt-2">
                    Attention : ce lot est déjà placé sur{" "}
                    {otherEmpNames.length} emplacement
                    {otherEmpNames.length > 1 ? "s" : ""}. L&apos;ajouter ici
                    revient à le scinder en une fraction supplémentaire.
                  </p>
                ) : null}
                {isEpuise ? (
                  <p className="text-xs text-amber-700">
                    Ce lot est marqué « Épuisé ». Pense à changer son statut si
                    tu réintroduis du stock.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-stone-400 italic">
                Sélectionne un lot pour voir ses informations.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={!selectedLot || alreadyHere || saving}
          >
            {saving ? "Ajout…" : "Ajouter ici"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
