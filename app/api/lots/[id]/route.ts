import type { FieldSet } from "airtable";
import { NextResponse } from "next/server";
import { getBase, TABLE_IDS } from "@/lib/airtable/client";
import { isDryRun, logDryRunMutation } from "@/lib/airtable/dry-run";
import { STATUTS_TRIAGE, type BioC2, type StatutTriage } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

type PatchBody = {
  emplacementIds?: string[];
  caissonIds?: string[];
  destinationIds?: string[];
  statut?: StatutTriage;
  bioC2?: BioC2 | null;
  commentaire?: string | null;
};

function isStatut(v: unknown): v is StatutTriage {
  return typeof v === "string" && (STATUTS_TRIAGE as readonly string[]).includes(v);
}

function isBioC2OrNull(v: unknown): v is BioC2 | null {
  return v === null || v === "Bio" || v === "C2";
}

function sameIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  for (const id of a) {
    if (!sb.has(id)) return false;
  }
  return true;
}

type InitialLotState = {
  statut: string | null;
  emplacements: string[];
};

async function fetchInitialState(id: string): Promise<InitialLotState | null> {
  try {
    const record = await getBase()(TABLE_IDS.Lots).find(id);
    const statut = record.get("Statut triage");
    const emplacements = record.get("Emplacements");
    return {
      statut: typeof statut === "string" ? statut : null,
      emplacements: Array.isArray(emplacements) ? (emplacements as string[]) : [],
    };
  } catch (err) {
    console.error(`[/api/lots/${id}] fetch initial state failed:`, err);
    return null;
  }
}

async function createLogEntry(params: {
  lotId: string;
  initial: InitialLotState;
  finalStatut: string | null;
  finalEmplacements: string[];
  types: string[];
}): Promise<void> {
  const fields: Partial<FieldSet> = {
    Date: new Date().toISOString(),
    Lot: [params.lotId],
    "Type événement": params.types,
    "Emplacements initiaux": params.initial.emplacements,
    "Emplacements finaux": params.finalEmplacements,
    "Modifié par": "Hangar app",
  };
  if (params.initial.statut) fields["Statut initial"] = params.initial.statut;
  if (params.finalStatut) fields["Statut final"] = params.finalStatut;
  await getBase()(TABLE_IDS.LogsLots).create(fields);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id.startsWith("rec")) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const fields: Partial<FieldSet> = {};
  if (body.emplacementIds !== undefined) {
    if (!Array.isArray(body.emplacementIds)) {
      return NextResponse.json(
        { error: "emplacementIds doit être un tableau" },
        { status: 400 },
      );
    }
    fields.Emplacements = body.emplacementIds;
  }
  if (body.caissonIds !== undefined) {
    if (!Array.isArray(body.caissonIds)) {
      return NextResponse.json(
        { error: "caissonIds doit être un tableau" },
        { status: 400 },
      );
    }
    fields.Caissons = body.caissonIds;
  }
  if (body.destinationIds !== undefined) {
    if (!Array.isArray(body.destinationIds)) {
      return NextResponse.json(
        { error: "destinationIds doit être un tableau" },
        { status: 400 },
      );
    }
    fields.Destination = body.destinationIds;
  }
  if (body.statut !== undefined) {
    if (!isStatut(body.statut)) {
      return NextResponse.json(
        { error: `statut "${body.statut}" inconnu` },
        { status: 400 },
      );
    }
    fields["Statut triage"] = body.statut;
    // Règle métier : passer un lot en Epuisé détache automatiquement tous ses
    // emplacements (un lot épuisé n'occupe plus d'allée physique).
    if (body.statut === "Epuisé") {
      fields.Emplacements = [];
    }
  }
  if (body.bioC2 !== undefined) {
    if (!isBioC2OrNull(body.bioC2)) {
      return NextResponse.json(
        { error: `bioC2 "${body.bioC2}" doit être Bio, C2 ou null` },
        { status: 400 },
      );
    }
    fields["Bio/C2"] = body.bioC2 ?? undefined;
  }
  if (body.commentaire !== undefined) {
    if (body.commentaire !== null && typeof body.commentaire !== "string") {
      return NextResponse.json(
        { error: "commentaire doit être une chaîne ou null" },
        { status: 400 },
      );
    }
    fields.Commentaire = body.commentaire ?? "";
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "aucun champ à mettre à jour" },
      { status: 400 },
    );
  }

  if (isDryRun()) {
    logDryRunMutation(`PATCH lot ${id}`, fields);
    return NextResponse.json({ ok: true, dryRun: true, id, fields });
  }

  // Capture l'état initial avant update si statut ou emplacements sont touchés
  // (les seuls champs qu'on logge pour le moment).
  const shouldLog =
    body.statut !== undefined || body.emplacementIds !== undefined;
  const initialState = shouldLog ? await fetchInitialState(id) : null;

  try {
    await getBase()(TABLE_IDS.Lots).update(id, fields);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Airtable";
    console.error(`[/api/lots/${id}] PATCH failed:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (shouldLog && initialState) {
    const finalStatut =
      typeof fields["Statut triage"] === "string"
        ? (fields["Statut triage"] as string)
        : initialState.statut;
    const finalEmplacements = Array.isArray(fields.Emplacements)
      ? (fields.Emplacements as string[])
      : initialState.emplacements;
    const statutChanged = finalStatut !== initialState.statut;
    const emplacementsChanged = !sameIdSet(
      initialState.emplacements,
      finalEmplacements,
    );
    // Première affectation (l'emplacement passe de vide à rempli) : on NE loggue
    // PAS côté app. C'est une automation Airtable qui en est la seule source
    // (déclencheur : emplacement non vide + compteur de logs emplacement = 0),
    // ce qui couvre aussi les entrées saisies directement dans Airtable et évite
    // les doublons liés à la course app↔automation. L'app ne loggue donc que les
    // déplacements (emplacement initial non vide) et les changements de statut.
    const isFirstPlacement =
      initialState.emplacements.length === 0 && emplacementsChanged;
    const logEmplacement = emplacementsChanged && !isFirstPlacement;
    if (statutChanged || logEmplacement) {
      const types: string[] = [];
      if (statutChanged) types.push("statut");
      if (logEmplacement) types.push("emplacement");
      try {
        await createLogEntry({
          lotId: id,
          initial: initialState,
          finalStatut,
          finalEmplacements,
          types,
        });
      } catch (err) {
        // On ne fait pas échouer le PATCH si le log échoue — c'est annexe.
        console.error(`[/api/lots/${id}] log create failed:`, err);
      }
    }
  }

  return NextResponse.json({ ok: true, dryRun: false, id });
}
