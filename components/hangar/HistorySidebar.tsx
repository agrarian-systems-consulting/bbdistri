"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LotLog } from "@/lib/types/domain";
import { HistoryLogCard } from "./HistoryLogCard";

type Props = {
  onClose: () => void;
};

type LogsWindow = {
  logs: LotLog[];
  nextUntil: string | null;
  windowStart: string;
};

function dayKeyParis(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function dayLabel(dayKey: string): string {
  const todayKey = dayKeyParis(new Date().toISOString());
  if (dayKey === todayKey) return "Aujourd'hui";
  const yest = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (dayKey === dayKeyParis(yest.toISOString())) return "Hier";
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function HistorySidebar({ onClose }: Props) {
  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<LogsWindow, Error>({
    queryKey: ["logs"],
    queryFn: async ({ pageParam }) => {
      // pageParam = ISO de fin de fenêtre (exclusive). Undefined sur le 1er
      // appel → on prend maintenant.
      const untilIso =
        typeof pageParam === "string"
          ? pageParam
          : new Date().toISOString();
      const params = new URLSearchParams({
        until: untilIso,
        daysWindow: "3",
      });
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as LogsWindow;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextUntil ?? undefined,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const days = useMemo(() => {
    const allLogs = data?.pages.flatMap((p) => p.logs) ?? [];
    const map = new Map<string, LotLog[]>();
    for (const log of allLogs) {
      const key = dayKeyParis(log.date);
      const arr = map.get(key) ?? [];
      arr.push(log);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, logs]) => ({ key, logs }));
  }, [data]);

  // Auto-ouvre le jour le plus récent sur la 1re donnée chargée.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && days.length > 0) {
      initRef.current = true;
      setExpanded(new Set([days[0].key]));
    }
  }, [days]);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalLoaded = days.reduce((sum, d) => sum + d.logs.length, 0);
  const lastWindowStart =
    data?.pages[data.pages.length - 1]?.windowStart ?? null;
  const loadedUntilLabel = lastWindowStart
    ? new Date(lastWindowStart).toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
      })
    : null;

  return (
    <aside className="side-panel">
      <header className="side-panel-header">
        <div>
          <h2>Historique des mouvements</h2>
          <p>
            {totalLoaded} mouvement{totalLoaded > 1 ? "s" : ""} chargé
            {totalLoaded > 1 ? "s" : ""}
            {loadedUntilLabel ? ` jusqu'au ${loadedUntilLabel}` : ""}
          </p>
        </div>
        <div className="history-header-actions">
          <button
            type="button"
            className="sync-refresh"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
            title="Rafraîchir l'historique"
            aria-label="Rafraîchir l'historique"
          >
            <RefreshCw className={isFetching ? "spin" : ""} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'historique"
            className="side-panel-close"
          >
            ×
          </button>
        </div>
      </header>

      {isError ? (
        <p className="side-panel-empty">
          Erreur :{" "}
          {error instanceof Error ? error.message : "inconnue"}
        </p>
      ) : days.length === 0 && isFetching ? (
        <p className="side-panel-empty">Chargement…</p>
      ) : days.length === 0 ? (
        <p className="side-panel-empty">
          Aucun mouvement sur les 3 derniers jours.
        </p>
      ) : (
        <div className="history-day-list">
          {days.map((day) => {
            const isOpen = expanded.has(day.key);
            return (
              <section key={day.key} className="history-day-section">
                <button
                  type="button"
                  className="history-day-header"
                  onClick={() => toggle(day.key)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown className="history-day-chevron" />
                  ) : (
                    <ChevronRight className="history-day-chevron" />
                  )}
                  <span className="history-day-label">
                    {dayLabel(day.key)}
                  </span>
                  <span className="history-day-badge">{day.logs.length}</span>
                </button>
                {isOpen ? (
                  <ul className="history-list history-day-list-items">
                    {day.logs.map((log) => (
                      <HistoryLogCard key={log.id} log={log} compactDate />
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {hasNextPage ? (
        <button
          type="button"
          className="history-load-more"
          onClick={() => {
            void fetchNextPage();
          }}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Chargement…" : "Charger 3 jours de plus"}
        </button>
      ) : days.length > 0 ? (
        <p className="history-end-marker">— fin de l&apos;historique —</p>
      ) : null}
    </aside>
  );
}
