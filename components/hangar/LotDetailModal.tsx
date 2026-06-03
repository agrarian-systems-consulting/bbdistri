"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/Combobox";
import { MultiCombobox } from "@/components/MultiCombobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STATUTS_TRIAGE } from "@/lib/types/domain";
import type {
  BioC2,
  Emplacement,
  Lot,
  StatutTriage,
} from "@/lib/types/domain";
import { LotHistoryAccordion } from "./LotHistoryAccordion";

export type LotPatch = {
  statut?: StatutTriage;
  bioC2?: BioC2 | null;
  commentaire?: string | null;
  caissonIds?: string[];
  emplacementIds?: string[];
  destinationIds?: string[];
};

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

type Props = {
  lot: Lot | null;
  emplacementsById: Map<string, Emplacement>;
  caissonsById: Record<string, string>;
  destinationsById: Record<string, string>;
  onClose: () => void;
  onSave: (lot: Lot, patch: LotPatch) => Promise<void>;
};

const BIOC2_VALUES = ["Bio", "C2", "none"] as const;
type BioC2Choice = (typeof BIOC2_VALUES)[number];

function bioC2ToChoice(v: BioC2 | null): BioC2Choice {
  return v ?? "none";
}
function choiceToBioC2(c: BioC2Choice): BioC2 | null {
  return c === "none" ? null : c;
}

export function LotDetailModal({
  lot,
  emplacementsById,
  caissonsById,
  destinationsById,
  onClose,
  onSave,
}: Props) {
  const [statut, setStatut] = useState<StatutTriage>("Brut");
  const [bioC2, setBioC2] = useState<BioC2Choice>("none");
  const [commentaire, setCommentaire] = useState("");
  const [caissonIds, setCaissonIds] = useState<string[]>([]);
  const [emplacementIds, setEmplacementIds] = useState<string[]>([]);
  const [destinationIds, setDestinationIds] = useState<string[]>([]);
  const [confirmEpuiseOpen, setConfirmEpuiseOpen] = useState(false);

  useEffect(() => {
    if (!lot) return;
    setStatut(lot.statut);
    setBioC2(bioC2ToChoice(lot.bioC2));
    setCommentaire(lot.commentaire ?? "");
    setCaissonIds(lot.caissonIds);
    setEmplacementIds(lot.emplacementIds);
    setDestinationIds(lot.destinationIds);
  }, [lot]);

  if (!lot) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const newBioC2 = choiceToBioC2(bioC2);
  const newCommentaire = commentaire.trim() === "" ? null : commentaire;
  const oldCommentaire = lot.commentaire;
  const caissonsDirty = !arraysEqual(caissonIds, lot.caissonIds);
  const emplacementsDirty = !arraysEqual(emplacementIds, lot.emplacementIds);
  const destinationsDirty = !arraysEqual(destinationIds, lot.destinationIds);
  const dirty =
    statut !== lot.statut ||
    newBioC2 !== lot.bioC2 ||
    newCommentaire !== oldCommentaire ||
    caissonsDirty ||
    emplacementsDirty ||
    destinationsDirty;

  const destinationOptions = Object.entries(destinationsById)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const emplacementOptions = (() => {
    const ZONE_ORDER: Record<string, number> = {
      A: 0,
      PREP: 1,
      C: 2,
      TAMPON: 3,
      B: 4,
    };
    return Array.from(emplacementsById.values())
      .map((e) => ({ value: e.id, label: e.name, zone: e.zone, allee: e.allee }))
      .sort((a, b) => {
        const za = ZONE_ORDER[a.zone] ?? 99;
        const zb = ZONE_ORDER[b.zone] ?? 99;
        if (za !== zb) return za - zb;
        const an = Number(a.allee);
        const bn = Number(b.allee);
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
        return a.label.localeCompare(b.label);
      })
      .map(({ value, label }) => ({ value, label }));
  })();

  const submit = () => {
    if (!dirty) return;
    const patch: LotPatch = {};
    if (statut !== lot.statut) patch.statut = statut;
    if (newBioC2 !== lot.bioC2) patch.bioC2 = newBioC2;
    if (newCommentaire !== oldCommentaire) patch.commentaire = newCommentaire;
    if (caissonsDirty) patch.caissonIds = caissonIds;
    if (emplacementsDirty) patch.emplacementIds = emplacementIds;
    if (destinationsDirty) patch.destinationIds = destinationIds;
    // Fire-and-forget : la modale ferme immédiatement, la synchro Airtable
    // se voit dans le toast loading → success/error en bas à droite.
    void onSave(lot, patch);
    onClose();
  };

  const performEpuise = () => {
    void onSave(lot, { statut: "Epuisé" });
    setConfirmEpuiseOpen(false);
    onClose();
  };

  const markEpuise = () => {
    if (lot.emplacementIds.length > 1) {
      setConfirmEpuiseOpen(true);
      return;
    }
    performEpuise();
  };

  const empCount = lot.emplacementIds.length;
  const empNamesList = lot.emplacementIds
    .map((id) => emplacementsById.get(id)?.name ?? id)
    .filter(Boolean);

  return (
    <>
    <Dialog
      open={Boolean(lot) && !confirmEpuiseOpen}
      onOpenChange={(next) => {
        // Ignore la fermeture déclenchée par l'ouverture du sous-dialog
        // de confirmation : c'est nous qui cachons la modale, pas le user.
        if (!next && !confirmEpuiseOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Lot <span className="font-mono">{lot.nom}</span>
          </DialogTitle>
          <DialogDescription>
            {lot.produit ?? "Produit non défini"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lot-statut">Statut triage</Label>
              <Combobox
                options={STATUTS_TRIAGE.map((s) => ({ value: s, label: s }))}
                value={statut}
                onChange={(v) => {
                  if (v) setStatut(v as StatutTriage);
                }}
                placeholder="Statut…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lot-bioc2">Bio / C2</Label>
              <Combobox
                options={[
                  { value: "Bio", label: "Bio" },
                  { value: "C2", label: "C2" },
                  { value: "none", label: "— (non renseigné)" },
                ]}
                value={bioC2}
                onChange={(v) => {
                  if (v) setBioC2(v as BioC2Choice);
                  else setBioC2("none");
                }}
                placeholder="Bio / C2…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Emplacements</Label>
            <MultiCombobox
              options={emplacementOptions}
              values={emplacementIds}
              onValuesChange={setEmplacementIds}
              placeholder="Tapez une allée pour placer le lot…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Destinations</Label>
            <MultiCombobox
              options={destinationOptions}
              values={destinationIds}
              onValuesChange={setDestinationIds}
              placeholder="Ajouter une destination…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Caissons métalliques</Label>
            <MultiCombobox
              options={Object.entries(caissonsById)
                .map(([id, numero]) => ({
                  value: id,
                  label: `Caisson ${numero}`,
                }))
                .sort((a, b) => {
                  const an = Number(a.label.replace("Caisson ", ""));
                  const bn = Number(b.label.replace("Caisson ", ""));
                  if (Number.isFinite(an) && Number.isFinite(bn))
                    return an - bn;
                  return a.label.localeCompare(b.label);
                })}
              values={caissonIds}
              onValuesChange={setCaissonIds}
              placeholder="Tapez un numéro pour ajouter un caisson…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lot-commentaire">Commentaire</Label>
            <Textarea
              id="lot-commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="—"
            />
          </div>

          <LotHistoryAccordion key={lot.id} lotId={lot.id} />
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={markEpuise}
            disabled={lot.statut === "Epuisé"}
            className="text-stone-600 hover:text-red-700"
          >
            Marquer épuisé
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={!dirty}>
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      open={confirmEpuiseOpen}
      onOpenChange={(next) => {
        if (!next) setConfirmEpuiseOpen(false);
      }}
    >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer le lot comme épuisé ?</DialogTitle>
            <DialogDescription>
              Ce lot est présent sur{" "}
              <span className="font-semibold text-stone-900">
                {empCount} emplacements
              </span>
              . Es-tu sûr que <strong>tout</strong> le lot est épuisé, pas
              seulement une fraction&nbsp;?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-xs text-stone-500">
              Emplacements actuellement liés :
            </div>
            <div className="flex flex-wrap gap-1.5">
              {empNamesList.map((n) => (
                <span
                  key={n}
                  className="font-mono text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-50"
                >
                  {n}
                </span>
              ))}
            </div>
            <p className="text-xs text-amber-700 pt-2">
              Tous ces emplacements seront détachés du lot.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmEpuiseOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={performEpuise}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Oui, marquer épuisé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
