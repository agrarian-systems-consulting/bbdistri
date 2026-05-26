import type { Emplacement, Lot } from "@/lib/types/domain";

export type MoveAction = "move-portion" | "regroup-all" | "merge";

export type MoveContext = {
  lot: Lot;
  sourceEmp: Emplacement;
  destEmp: Emplacement;
};

export type MoveContextAnalysis = MoveContext & {
  isMultiEmplacement: boolean;
  destAlreadyContainsLot: boolean;
  availableActions: MoveAction[];
  defaultAction: MoveAction;
};

/**
 * Détermine les actions possibles pour un déplacement, selon la maquette :
 *   - lot mono-emplacement : déplacement simple (move-portion)
 *   - lot multi-emplacement vers une allée qui ne le contient pas :
 *     choix entre "déplacer cette portion" ou "regrouper tout le lot"
 *   - drop sur une allée qui contient déjà ce lot : fusion (merge), idempotent
 */
export function analyzeMove(ctx: MoveContext): MoveContextAnalysis {
  const isMulti = ctx.lot.emplacementIds.length > 1;
  const destAlreadyContainsLot = ctx.lot.emplacementIds.includes(
    ctx.destEmp.id,
  );

  let actions: MoveAction[];
  let defaultAction: MoveAction;
  if (destAlreadyContainsLot) {
    actions = ["merge"];
    defaultAction = "merge";
  } else if (isMulti) {
    actions = ["move-portion", "regroup-all"];
    defaultAction = "move-portion";
  } else {
    actions = ["move-portion"];
    defaultAction = "move-portion";
  }

  return {
    ...ctx,
    isMultiEmplacement: isMulti,
    destAlreadyContainsLot,
    availableActions: actions,
    defaultAction,
  };
}

/**
 * Calcule la nouvelle liste d'emplacements liés au lot après l'action choisie.
 * - move-portion : retire l'emplacement source et ajoute le destination
 * - regroup-all  : remplace toute la liste par [destination]
 * - merge        : retire juste l'emplacement source (destination déjà présent)
 */
export function computeNewEmplacementIds(
  ctx: MoveContext,
  action: MoveAction,
): string[] {
  const { lot, sourceEmp, destEmp } = ctx;
  const without = lot.emplacementIds.filter((id) => id !== sourceEmp.id);
  switch (action) {
    case "move-portion":
      return without.includes(destEmp.id) ? without : [...without, destEmp.id];
    case "regroup-all":
      return [destEmp.id];
    case "merge":
      return without;
  }
}
