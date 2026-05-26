"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MoveAction, MoveContextAnalysis } from "@/lib/hangar/moveLot";

type Props = {
  analysis: MoveContextAnalysis | null;
  onConfirm: (action: MoveAction) => void;
  onCancel: () => void;
};

function actionLabel(
  action: MoveAction,
  isMulti: boolean,
): { primary: string; description: string } {
  if (action === "move-portion") {
    if (isMulti) {
      return {
        primary: "Déplacer cette portion seulement",
        description:
          "Seule la portion sélectionnée bouge. Les autres emplacements du lot restent inchangés.",
      };
    }
    return {
      primary: "Déplacer ce lot",
      description: "Le lot est déplacé vers le nouvel emplacement.",
    };
  }
  if (action === "regroup-all") {
    return {
      primary: "Regrouper tout le lot",
      description:
        "Toutes les portions du lot (tous emplacements confondus) sont consolidées dans la destination.",
    };
  }
  return {
    primary: "Fusionner avec la portion existante",
    description:
      "La destination contient déjà ce lot. On retire la portion source ; idempotent.",
  };
}

export function MoveConfirmModal({ analysis, onConfirm, onCancel }: Props) {
  const open = Boolean(analysis);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {analysis ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirmer le déplacement</DialogTitle>
              <DialogDescription>
                Lot{" "}
                <span className="font-mono font-semibold">
                  {analysis.lot.nom}
                </span>{" "}
                de{" "}
                <span className="font-mono">{analysis.sourceEmp.name}</span>{" "}
                vers <span className="font-mono">{analysis.destEmp.name}</span>
                {analysis.isMultiEmplacement
                  ? ` · lot présent sur ${analysis.lot.emplacementIds.length} emplacements`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-1">
              {analysis.availableActions.map((action) => {
                const meta = actionLabel(action, analysis.isMultiEmplacement);
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => onConfirm(action)}
                    className="w-full text-left rounded-md border border-stone-300 hover:border-amber-500 hover:bg-amber-50 p-3 transition-colors"
                  >
                    <div className="text-sm font-semibold text-stone-900">
                      {meta.primary}
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      {meta.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
