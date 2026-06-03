import "server-only";
import { TABLE_IDS } from "./client";
import { fetchAllEmplacements } from "./emplacements";
import { fetchAllLots } from "./lots";
import type { LotLog } from "@/lib/types/domain";

const LOG_FIELDS = [
  "Date",
  "Lot",
  "Type événement",
  "Statut initial",
  "Statut final",
  "Emplacements initiaux",
  "Emplacements finaux",
  "Modifié par",
] as const;

export type LotLogsPage = {
  logs: LotLog[];
  nextCursor: string | null;
};

export type LotLogsWindow = {
  logs: LotLog[];
  nextUntil: string | null;
  /** Borne inférieure (exclusive) de la fenêtre couverte, ISO UTC. */
  windowStart: string;
};

type FetchOptions = {
  pageSize?: number;
  cursor?: string;
  /**
   * Nom du lot (primary field) à filtrer côté Airtable via filterByFormula.
   * Hypothèse : chaque log lie exactement 1 lot, donc {Lot} renvoie le nom du lot.
   */
  lotNom?: string;
};

type WindowOptions = {
  untilIso: string;
  daysWindow?: number;
  lotNom?: string;
};

const MAX_LOAD_MORE_DAYS = 365;

function escapeFormulaString(s: string): string {
  return s.replace(/"/g, '\\"');
}

async function fetchLotsAndEmplacementsMaps() {
  const [lots, emplacements] = await Promise.all([
    fetchAllLots(),
    fetchAllEmplacements(),
  ]);
  return {
    lotNomById: new Map(lots.map((l) => [l.id, l.nom])),
    empNameById: new Map(emplacements.map((e) => [e.id, e.name])),
  };
}

function recordToLog(
  r: { id: string; fields: Record<string, unknown> },
  lotNomById: Map<string, string>,
  empNameById: Map<string, string>,
): LotLog {
  const f = r.fields;
  const lotIds = (f["Lot"] as string[] | undefined) ?? [];
  const firstLotId = lotIds[0];
  const resolveEmps = (ids: string[]) =>
    ids.map((id) => empNameById.get(id) ?? id);
  return {
    id: r.id,
    date: (f["Date"] as string | undefined) ?? "",
    lotId: firstLotId ?? null,
    lotNom: firstLotId
      ? (lotNomById.get(firstLotId) ?? "(lot supprimé)")
      : "—",
    types: (f["Type événement"] as string[] | undefined) ?? [],
    statutInitial: (f["Statut initial"] as string | undefined) ?? null,
    statutFinal: (f["Statut final"] as string | undefined) ?? null,
    emplacementsInitiaux: resolveEmps(
      (f["Emplacements initiaux"] as string[] | undefined) ?? [],
    ),
    emplacementsFinaux: resolveEmps(
      (f["Emplacements finaux"] as string[] | undefined) ?? [],
    ),
    modifiePar: (f["Modifié par"] as string | undefined) ?? null,
  };
}

function airtableEnv() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID manquant");
  if (!pat) throw new Error("AIRTABLE_PAT manquant");
  return { baseId, pat };
}

/**
 * Une page de logs depuis Airtable via offset cursor (REST API directe).
 * Tri par Date desc. Utilisé pour l'accordéon par-lot (filtre via lotNom).
 */
export async function fetchLotLogsPage(
  opts: FetchOptions = {},
): Promise<LotLogsPage> {
  const { baseId, pat } = airtableEnv();
  const pageSize = opts.pageSize ?? 50;
  const params = new URLSearchParams();
  params.set("pageSize", String(pageSize));
  params.append("sort[0][field]", "Date");
  params.append("sort[0][direction]", "desc");
  LOG_FIELDS.forEach((f, i) => params.append(`fields[${i}]`, f));
  if (opts.cursor) params.set("offset", opts.cursor);
  if (opts.lotNom) {
    params.set(
      "filterByFormula",
      `{Lot} = "${escapeFormulaString(opts.lotNom)}"`,
    );
  }

  const url = `https://api.airtable.com/v0/${baseId}/${TABLE_IDS.LogsLots}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${pat}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status} ${res.statusText} : ${body}`);
  }
  const data = (await res.json()) as {
    records: Array<{ id: string; fields: Record<string, unknown> }>;
    offset?: string;
  };

  const { lotNomById, empNameById } = await fetchLotsAndEmplacementsMaps();
  const logs = data.records.map((r) => recordToLog(r, lotNomById, empNameById));
  return { logs, nextCursor: data.offset ?? null };
}

/**
 * Fenêtre temporelle de logs : tous les logs entre [untilIso - daysWindow, untilIso).
 * Paginé en interne (offset Airtable) pour récupérer toute la fenêtre en un appel.
 * Tri Date desc. Plafonné à MAX_LOAD_MORE_DAYS jours avant maintenant pour éviter
 * un load-more infini.
 */
export async function fetchLogsInWindow(
  opts: WindowOptions,
): Promise<LotLogsWindow> {
  const { baseId, pat } = airtableEnv();
  const until = new Date(opts.untilIso);
  if (Number.isNaN(until.getTime())) {
    throw new Error(`untilIso invalide : ${opts.untilIso}`);
  }
  const daysWindow = opts.daysWindow ?? 3;
  const startMs = until.getTime() - daysWindow * 24 * 60 * 60 * 1000;
  const start = new Date(startMs);
  const startIso = start.toISOString();

  const filterParts: string[] = [
    `IS_BEFORE({Date}, "${opts.untilIso}")`,
    `IS_AFTER({Date}, "${startIso}")`,
  ];
  if (opts.lotNom) {
    filterParts.push(`{Lot} = "${escapeFormulaString(opts.lotNom)}"`);
  }
  const filterByFormula = `AND(${filterParts.join(", ")})`;

  // Pagination interne : on récupère toute la fenêtre, peu importe la taille.
  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    params.append("sort[0][field]", "Date");
    params.append("sort[0][direction]", "desc");
    LOG_FIELDS.forEach((f, i) => params.append(`fields[${i}]`, f));
    params.set("filterByFormula", filterByFormula);
    if (offset) params.set("offset", offset);

    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_IDS.LogsLots}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${pat}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable ${res.status} ${res.statusText} : ${body}`);
    }
    const data = (await res.json()) as {
      records: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    };
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  const { lotNomById, empNameById } = await fetchLotsAndEmplacementsMaps();
  const logs = allRecords.map((r) => recordToLog(r, lotNomById, empNameById));

  // Cap à MAX_LOAD_MORE_DAYS pour éviter de défiler indéfiniment.
  const earliestAllowedMs = Date.now() - MAX_LOAD_MORE_DAYS * 24 * 60 * 60 * 1000;
  const nextUntil = startMs <= earliestAllowedMs ? null : startIso;

  return { logs, nextUntil, windowStart: startIso };
}
