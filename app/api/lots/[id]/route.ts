import { NextResponse } from "next/server";
import { getBase, TABLE_IDS } from "@/lib/airtable/client";
import { isDryRun, logDryRunMutation } from "@/lib/airtable/dry-run";

export const dynamic = "force-dynamic";

type PatchBody = {
  emplacementIds?: string[];
};

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

  if (!Array.isArray(body.emplacementIds)) {
    return NextResponse.json(
      { error: "emplacementIds doit être un tableau" },
      { status: 400 },
    );
  }

  const payload = { Emplacements: body.emplacementIds };

  if (isDryRun()) {
    logDryRunMutation(`PATCH lot ${id}`, payload);
    return NextResponse.json({ ok: true, dryRun: true, id, payload });
  }

  try {
    await getBase()(TABLE_IDS.Lots).update(id, payload);
    return NextResponse.json({ ok: true, dryRun: false, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Airtable";
    console.error(`[/api/lots/${id}] PATCH failed:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
