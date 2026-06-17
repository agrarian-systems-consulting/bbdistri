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
  /** Lots éligibles (périmètre Hangar : hors Épuisé, hors autre dépôt) venant du state HangarView. */
  addableLots: Lot[];
  onClose: () => void;
  onAdd: (lot: Lot, emplacement: Emplacement) => Promise<void>;
};

function StatutChip({ statut }: { statut: string }) {
  const klass = statutClass(statut as never);
  const color = {
    "statut-Trie": "var(--statut-trie)",
    "statut-Brut": "var(--statut-brut)",
    "statut-A-retrier": "var(--statut-aretrier)",
    "statut-En-cours": "var(--statut-encours)",
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
  addableLots,
  onClose,
  onAdd,
}: Props) {
  const [selectedLotId, setSelectedLotId] = useState("");

  useEffect(() => {
    if (!emplacement) return;
    setSelectedLotId("");
  }, [emplacement]);

  const options = useMemo<ComboboxOption[]>(() => {
    return addableLots
      .slice()
      .sort((a, b) => a.nom.localeCompare(b.nom))
      .map((lot) => ({
        value: lot.id,
        label: lot.produit ? `${lot.nom} — ${lot.produit}` : lot.nom,
        right: <StatutChip statut={lot.statut} />,
      }));
  }, [addableLots]);

  const selectedLot = useMemo(
    () => addableLots.find((l) => l.id === selectedLotId) ?? null,
    [addableLots, selectedLotId],
  );

  if (!emplacement) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const alreadyHere = Boolean(
    selectedLot && selectedLot.emplacementIds.includes(emplacement.id),
  );
  const otherEmpNames = selectedLot
    ? selectedLot.emplacementIds
        .filter((id) => id !== emplacement.id)
        .map((id) => emplacementsById.get(id)?.name)
        .filter((n): n is string => Boolean(n))
    : [];

  const submit = () => {
    if (!selectedLot || alreadyHere) return;
    void onAdd(selectedLot, emplacement);
    onClose();
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
              placeholder={`Rechercher parmi ${addableLots.length} lots…`}
            />
            <p className="text-xs text-stone-500">
              Les lots <em>Non affecté</em> (récolte pas encore saisie) sont
              inclus pour pouvoir les localiser. Seuls les lots <em>Épuisé</em>{" "}
              ou rattachés à un autre dépôt n&apos;apparaissent pas.
            </p>
          </div>

          <div className="rounded-md border border-stone-200 bg-stone-50 p-3 min-h-35">
            {selectedLot ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono font-semibold text-stone-900">
                    {selectedLot.nom}
                  </span>
                  <StatutChip statut={selectedLot.statut} />
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
              </div>
            ) : (
              <p className="text-sm text-stone-400 italic">
                Sélectionne un lot pour voir ses informations.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!selectedLot || alreadyHere}>
            Ajouter ici
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
