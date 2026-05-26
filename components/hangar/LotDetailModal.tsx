"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lot) return;
    setStatut(lot.statut);
    setBioC2(bioC2ToChoice(lot.bioC2));
    setCommentaire(lot.commentaire ?? "");
    setCaissonIds(lot.caissonIds);
  }, [lot]);

  const availableCaissons = useMemo(() => {
    const attached = new Set(caissonIds);
    return Object.entries(caissonsById)
      .filter(([id]) => !attached.has(id))
      .map(([id, numero]) => ({ id, numero }))
      .sort((a, b) => {
        const an = Number(a.numero);
        const bn = Number(b.numero);
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
        return a.numero.localeCompare(b.numero);
      });
  }, [caissonsById, caissonIds]);

  if (!lot) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const empNames = lot.emplacementIds
    .map((id) => emplacementsById.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  const newBioC2 = choiceToBioC2(bioC2);
  const newCommentaire = commentaire.trim() === "" ? null : commentaire;
  const oldCommentaire = lot.commentaire;
  const caissonsDirty = !arraysEqual(caissonIds, lot.caissonIds);
  const dirty =
    statut !== lot.statut ||
    newBioC2 !== lot.bioC2 ||
    newCommentaire !== oldCommentaire ||
    caissonsDirty;

  const addCaisson = (id: string) => {
    if (!id || caissonIds.includes(id)) return;
    setCaissonIds([...caissonIds, id]);
  };

  const removeCaisson = (id: string) => {
    setCaissonIds(caissonIds.filter((x) => x !== id));
  };

  const submit = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const patch: LotPatch = {};
      if (statut !== lot.statut) patch.statut = statut;
      if (newBioC2 !== lot.bioC2) patch.bioC2 = newBioC2;
      if (newCommentaire !== oldCommentaire) patch.commentaire = newCommentaire;
      if (caissonsDirty) patch.caissonIds = caissonIds;
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
              <Select
                value={statut}
                onValueChange={(v) => setStatut(v as StatutTriage)}
              >
                <SelectTrigger id="lot-statut" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS_TRIAGE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lot-bioc2">Bio / C2</Label>
              <Select
                value={bioC2}
                onValueChange={(v) => setBioC2(v as BioC2Choice)}
              >
                <SelectTrigger id="lot-bioc2" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bio">Bio</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="none">— (non renseigné)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Emplacements</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem] px-2 py-1.5 border border-stone-200 rounded-md bg-stone-50">
              {empNames.length > 0 ? (
                empNames.map((n) => (
                  <span
                    key={n}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-50"
                  >
                    {n}
                  </span>
                ))
              ) : (
                <span className="text-xs text-stone-400 italic">
                  Aucun emplacement
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Caissons métalliques</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem] px-2 py-1.5 border border-stone-200 rounded-md bg-stone-50">
              {caissonIds.length > 0 ? (
                caissonIds.map((id) => {
                  const num = caissonsById[id] ?? id;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-amber-700 text-amber-50"
                    >
                      Caisson {num}
                      <button
                        type="button"
                        onClick={() => removeCaisson(id)}
                        className="hover:text-amber-100 leading-none text-sm"
                        aria-label={`Retirer caisson ${num}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-stone-400 italic">
                  Aucun caisson
                </span>
              )}
            </div>
            <Combobox
              options={availableCaissons.map(({ id, numero }) => ({
                value: id,
                label: `Caisson ${numero}`,
              }))}
              value=""
              onChange={addCaisson}
              placeholder={
                availableCaissons.length === 0
                  ? "Aucun caisson disponible"
                  : "Ajouter un caisson…"
              }
              disabled={availableCaissons.length === 0}
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
