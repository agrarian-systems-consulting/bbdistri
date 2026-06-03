"use client";

import { ArrowRight } from "lucide-react";
import type { LotLog } from "@/lib/types/domain";

export function formatLogDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLogTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatutTransition({
  from,
  to,
}: {
  from: string | null;
  to: string | null;
}) {
  return (
    <div className="history-transition">
      <span className="history-transition-label">Statut</span>
      <span className="history-val">{from ?? "—"}</span>
      <ArrowRight className="history-arrow" />
      <span className="history-val history-val-final">{to ?? "—"}</span>
    </div>
  );
}

function EmplacementTransition({
  from,
  to,
}: {
  from: string[];
  to: string[];
}) {
  return (
    <div className="history-transition">
      <span className="history-transition-label">Emplacement</span>
      <span className="history-val">
        {from.length > 0 ? from.join(", ") : "aucun"}
      </span>
      <ArrowRight className="history-arrow" />
      <span className="history-val history-val-final">
        {to.length > 0 ? to.join(", ") : "aucun"}
      </span>
    </div>
  );
}

export function HistoryLogCard({
  log,
  showLotName = true,
  compactDate = false,
}: {
  log: LotLog;
  showLotName?: boolean;
  /** Si vrai, affiche uniquement l'heure (HH:MM) au lieu de DD/MM HH:MM. */
  compactDate?: boolean;
}) {
  const hasStatut = log.types.includes("statut");
  const hasEmplacement = log.types.includes("emplacement");
  const dateStr = compactDate ? formatLogTime(log.date) : formatLogDate(log.date);
  return (
    <li className="history-item">
      <div className="history-item-head">
        {showLotName ? (
          <span className="history-lot">{log.lotNom}</span>
        ) : (
          <span className="history-date history-date-lead">{dateStr}</span>
        )}
        {showLotName ? (
          <span className="history-date">{dateStr}</span>
        ) : null}
      </div>
      {hasStatut ? (
        <StatutTransition from={log.statutInitial} to={log.statutFinal} />
      ) : null}
      {hasEmplacement ? (
        <EmplacementTransition
          from={log.emplacementsInitiaux}
          to={log.emplacementsFinaux}
        />
      ) : null}
      {log.modifiePar ? (
        <div className="history-by">par {log.modifiePar}</div>
      ) : null}
    </li>
  );
}
