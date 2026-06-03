"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { LotLog } from "@/lib/types/domain";
import { HistoryLogCard } from "./HistoryLogCard";

type Props = {
  lotId: string;
};

type LogsPage = {
  logs: LotLog[];
  nextCursor: string | null;
};

export function LotHistoryAccordion({ lotId }: Props) {
  const [open, setOpen] = useState(false);

  // Query séparée par lot : filtre côté serveur via filterByFormula.
  // Le préfixe ["logs", ...] permet aux invalidations globales ["logs"]
  // de la déclencher après chaque mutation.
  const { data, isFetching, isError, error } = useQuery<LogsPage, Error>({
    queryKey: ["logs", "for-lot", lotId],
    queryFn: async () => {
      const params = new URLSearchParams({ lotId, pageSize: "50" });
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as LogsPage;
    },
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const lotLogs = data?.logs ?? [];

  return (
    <div className="lot-history-accordion">
      <button
        type="button"
        className="lot-history-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="lot-history-chevron" />
        ) : (
          <ChevronRight className="lot-history-chevron" />
        )}
        <span>Historique du lot</span>
        {open && !isFetching ? (
          <span className="lot-history-count">({lotLogs.length})</span>
        ) : null}
      </button>
      {open ? (
        <div className="lot-history-body">
          {isError ? (
            <p className="lot-history-empty">
              Erreur : {error instanceof Error ? error.message : "inconnue"}
            </p>
          ) : isFetching && lotLogs.length === 0 ? (
            <p className="lot-history-empty">Chargement…</p>
          ) : lotLogs.length === 0 ? (
            <p className="lot-history-empty">
              Aucun mouvement enregistré pour ce lot.
            </p>
          ) : (
            <ul className="history-list lot-history-list">
              {lotLogs.map((log) => (
                <HistoryLogCard key={log.id} log={log} showLotName={false} />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
