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

  try {
    await getBase()(TABLE_IDS.Lots).update(id, fields);
    return NextResponse.json({ ok: true, dryRun: false, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Airtable";
    console.error(`[/api/lots/${id}] PATCH failed:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
