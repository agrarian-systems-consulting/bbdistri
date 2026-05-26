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

export type LotPatch = {
  statut?: StatutTriage;
  bioC2?: BioC2 | null;
  commentaire?: string | null;
  caissonIds?: string[];
  emplacementIds?: string[];
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
  onClose,
  onSave,
}: Props) {
  const [statut, setStatut] = useState<StatutTriage>("Brut");
  const [bioC2, setBioC2] = useState<BioC2Choice>("none");
  const [commentaire, setCommentaire] = useState("");
  const [caissonIds, setCaissonIds] = useState<string[]>([]);
  const [emplacementIds, setEmplacementIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lot) return;
    setStatut(lot.statut);
    setBioC2(bioC2ToChoice(lot.bioC2));
    setCommentaire(lot.commentaire ?? "");
    setCaissonIds(lot.caissonIds);
    setEmplacementIds(lot.emplacementIds);
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
  const dirty =
    statut !== lot.statut ||
    newBioC2 !== lot.bioC2 ||
    newCommentaire !== oldCommentaire ||
    caissonsDirty ||
    emplacementsDirty;

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

  const submit = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const patch: LotPatch = {};
      if (statut !== lot.statut) patch.statut = statut;
      if (newBioC2 !== lot.bioC2) patch.bioC2 = newBioC2;
      if (newCommentaire !== oldCommentaire) patch.commentaire = newCommentaire;
      if (caissonsDirty) patch.caissonIds = caissonIds;
      if (emplacementsDirty) patch.emplacementIds = emplacementIds;
      await onSave(lot, patch);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const markEpuise = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(lot, { statut: "Epuisé" });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(lot)}
      onOpenChange={(next) => {
        if (!next) onClose();
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
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={markEpuise}
            disabled={saving || lot.statut === "Epuisé"}
            className="text-stone-600 hover:text-red-700"
          >
            Marquer épuisé
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={!dirty || saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
