import { NextResponse } from "next/server";
import { fetchLogsInWindow, fetchLotLogsPage } from "@/lib/airtable/logs";
import { fetchAllLots } from "@/lib/airtable/lots";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const DEFAULT_DAYS_WINDOW = 3;
const MAX_DAYS_WINDOW = 30;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lotId = url.searchParams.get("lotId") ?? undefined;
    const until = url.searchParams.get("until") ?? undefined;

    // Résolution lotId → lotNom (utilisé en filter par les 2 modes).
    let lotNom: string | undefined;
    if (lotId) {
      const lots = await fetchAllLots();
      const lot = lots.find((l) => l.id === lotId);
      if (!lot) {
        return NextResponse.json({ logs: [], nextCursor: null });
      }
      lotNom = lot.nom;
    }

    // Mode fenêtre temporelle (sidebar) : param `until` présent.
    if (until) {
      const requestedDays = Number(url.searchParams.get("daysWindow"));
      const daysWindow =
        Number.isFinite(requestedDays) && requestedDays > 0
          ? Math.min(requestedDays, MAX_DAYS_WINDOW)
          : DEFAULT_DAYS_WINDOW;
      const window = await fetchLogsInWindow({
        untilIso: until,
        daysWindow,
        lotNom,
      });
      return NextResponse.json(window);
    }

    // Mode offset cursor (accordéon par-lot).
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const requested = Number(url.searchParams.get("pageSize"));
    const pageSize =
      Number.isFinite(requested) && requested > 0
        ? Math.min(requested, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const page = await fetchLotLogsPage({ pageSize, cursor, lotNom });
    return NextResponse.json(page);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[/api/logs] échec :", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
