import { NextResponse } from "next/server";
import { fetchHangarLots } from "@/lib/airtable/lots";
import { fetchAllEmplacements } from "@/lib/airtable/emplacements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [lots, emplacements] = await Promise.all([
      fetchHangarLots(),
      fetchAllEmplacements(),
    ]);
    return NextResponse.json({ lots, emplacements });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[/api/lots] échec :", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
