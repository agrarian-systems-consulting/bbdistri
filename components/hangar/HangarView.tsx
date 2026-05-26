"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  groupEmplacementsByZone,
  groupLotsByEmplacement,
} from "@/lib/hangar/layout";
import type {
  Emplacement,
  Lot,
  StatutTriage,
  Zone as ZoneType,
} from "@/lib/types/domain";
import { HangarPlan } from "./HangarPlan";
import { Topbar } from "./Topbar";

type Props = {
  lots: Lot[];
  emplacements: Emplacement[];
  caissonsById: Record<string, string>;
};

export function HangarView({ lots, emplacements, caissonsById }: Props) {
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [fullscreenZone, setFullscreenZone] = useState<ZoneType | null>(null);
  const [activeStatuts, setActiveStatuts] = useState<Set<StatutTriage>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allotementMode, setAllotementMode] = useState(false);

  const lotsParEmp = useMemo(() => groupLotsByEmplacement(lots), [lots]);
  const empsParZone = useMemo(
    () => groupEmplacementsByZone(emplacements),
    [emplacements],
  );

  useEffect(() => {
    if (!fullscreenZone) return;
    document.body.classList.add("has-fullscreen");
    return () => document.body.classList.remove("has-fullscreen");
  }, [fullscreenZone]);

  useEffect(() => {
    if (!allotementMode) return;
    document.body.classList.add("allotement-on");
    return () => document.body.classList.remove("allotement-on");
  }, [allotementMode]);

  useEffect(() => {
    if (!fullscreenZone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenZone(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreenZone]);

  const toggleFullscreen = useCallback((zone: ZoneType) => {
    setFullscreenZone((current) => (current === zone ? null : zone));
  }, []);

  const toggleStatut = useCallback((statut: StatutTriage) => {
    setActiveStatuts((prev) => {
      const next = new Set(prev);
      if (next.has(statut)) next.delete(statut);
      else next.add(statut);
      return next;
    });
  }, []);

  const toggleAllotement = useCallback(() => {
    setAllotementMode((v) => !v);
  }, []);

  return (
    <>
      <Topbar
        totalLots={lots.length}
        totalEmplacements={emplacements.length}
        activeStatuts={activeStatuts}
        searchQuery={searchQuery}
        allotementMode={allotementMode}
        onToggleStatut={toggleStatut}
        onSearchChange={setSearchQuery}
        onToggleAllotement={toggleAllotement}
      />
      <HangarPlan
        empsParZone={empsParZone}
        lotsParEmp={lotsParEmp}
        caissonsById={caissonsById}
        hoveredLotId={hoveredLotId}
        activeStatuts={activeStatuts}
        searchQuery={searchQuery}
        fullscreenZone={fullscreenZone}
        onToggleFullscreen={toggleFullscreen}
        onHoverChange={setHoveredLotId}
      />
      <p className="footer-note">
        Vraies données Airtable. Lots <em>Epuisé</em> et dépôt ≠{" "}
        <em>Hangar</em> filtrés en amont.
      </p>
    </>
  );
}
