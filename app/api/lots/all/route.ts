import { NextResponse } from "next/server";
import { fetchAllLots } from "@/lib/airtable/lots";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lots = await fetchAllLots();
    return NextResponse.json({ lots });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Airtable";
    console.error("[/api/lots/all] GET failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
