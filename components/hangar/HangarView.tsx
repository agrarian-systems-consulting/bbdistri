"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  parseDraggableLotId,
  parseDroppableEmplacementId,
} from "@/lib/hangar/dnd-ids";
import { computeAllotementGroups } from "@/lib/hangar/filters";
import {
  groupEmplacementsByZone,
  groupLotsByEmplacement,
} from "@/lib/hangar/layout";
import {
  analyzeMove,
  computeNewEmplacementIds,
  type MoveAction,
} from "@/lib/hangar/moveLot";
import { statutClass } from "@/lib/hangar/statut";
import type {
  Emplacement,
  Lot,
  StatutTriage,
  Zone as ZoneType,
} from "@/lib/types/domain";
import { AllotementSidebar } from "./AllotementSidebar";
import { HangarPlan } from "./HangarPlan";
import { MoveConfirmModal } from "./MoveConfirmModal";
import { Topbar } from "./Topbar";

type Props = {
  lots: Lot[];
  emplacements: Emplacement[];
  caissonsById: Record<string, string>;
};

type PendingMove = {
  lot: Lot;
  sourceEmp: Emplacement;
  destEmp: Emplacement;
};

async function patchLotEmplacements(
  lotId: string,
  emplacementIds: string[],
): Promise<void> {
  const res = await fetch(`/api/lots/${lotId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emplacementIds }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH lot ${lotId} échoué (${res.status}) : ${body}`);
  }
}

export function HangarView({ lots, emplacements, caissonsById }: Props) {
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [fullscreenZone, setFullscreenZone] = useState<ZoneType | null>(null);
  const [activeStatuts, setActiveStatuts] = useState<Set<StatutTriage>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allotementMode, setAllotementMode] = useState(false);
  const [allotementHoveredKey, setAllotementHoveredKey] = useState<
    string | null
  >(null);
  const [activeDragLotId, setActiveDragLotId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [localLots, setLocalLots] = useState<Lot[]>(lots);

  useEffect(() => {
    setLocalLots(lots);
  }, [lots]);

  const lotsParEmp = useMemo(
    () => groupLotsByEmplacement(localLots),
    [localLots],
  );
  const empsParZone = useMemo(
    () => groupEmplacementsByZone(emplacements),
    [emplacements],
  );
  const empsById = useMemo(() => {
    const m = new Map<string, Emplacement>();
    for (const e of emplacements) m.set(e.id, e);
    return m;
  }, [emplacements]);
  const allotementGroups = useMemo(
    () => computeAllotementGroups(localLots),
    [localLots],
  );
  const allotableLotIds = useMemo(() => {
    const set = new Set<string>();
    for (const ids of allotementGroups.values()) {
      for (const id of ids) set.add(id);
    }
    return set;
  }, [allotementGroups]);
  const lotsById = useMemo(() => {
    const m = new Map<string, Lot>();
    for (const lot of localLots) m.set(lot.id, lot);
    return m;
  }, [localLots]);

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
    setAllotementMode((v) => {
      const next = !v;
      if (!next) setAllotementHoveredKey(null);
      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const parsed = parseDraggableLotId(String(event.active.id));
    if (parsed) setActiveDragLotId(parsed.lotId);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragLotId(null);
      const { active, over } = event;
      if (!over) return;
      const src = parseDraggableLotId(String(active.id));
      const dst = parseDroppableEmplacementId(String(over.id));
      if (!src || !dst) return;
      if (src.emplacementId === dst) return;

      const lot = lotsById.get(src.lotId);
      const sourceEmp = empsById.get(src.emplacementId);
      const destEmp = empsById.get(dst);
      if (!lot || !sourceEmp || !destEmp) return;

      setPendingMove({ lot, sourceEmp, destEmp });
    },
    [empsById, lotsById],
  );

  const applyLocalEmplacementsUpdate = useCallback(
    (lotId: string, newEmplacementIds: string[]) => {
      setLocalLots((prev) =>
        prev.map((l) =>
          l.id === lotId ? { ...l, emplacementIds: newEmplacementIds } : l,
        ),
      );
    },
    [],
  );

  const undoMove = useCallback(
    async (lot: Lot, previousIds: string[]) => {
      applyLocalEmplacementsUpdate(lot.id, previousIds);
      try {
        await patchLotEmplacements(lot.id, previousIds);
        toast.success(`Lot ${lot.nom} : déplacement annulé`);
      } catch (err) {
        toast.error("Annulation échouée", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [applyLocalEmplacementsUpdate],
  );

  const handleConfirm = useCallback(
    async (action: MoveAction) => {
      const ctx = pendingMove;
      if (!ctx) return;
      setPendingMove(null);

      const previousIds = [...ctx.lot.emplacementIds];
      const newIds = computeNewEmplacementIds(ctx, action);

      applyLocalEmplacementsUpdate(ctx.lot.id, newIds);

      try {
        await patchLotEmplacements(ctx.lot.id, newIds);
        toast(`Lot ${ctx.lot.nom} déplacé`, {
          description: `${ctx.sourceEmp.name} → ${ctx.destEmp.name}${
            action === "regroup-all"
              ? " (regroupement total)"
              : action === "merge"
                ? " (fusion)"
                : ""
          }`,
          action: {
            label: "Annuler",
            onClick: () => undoMove(ctx.lot, previousIds),
          },
          duration: 5000,
        });
      } catch (err) {
        applyLocalEmplacementsUpdate(ctx.lot.id, previousIds);
        toast.error("Déplacement échoué", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [pendingMove, applyLocalEmplacementsUpdate, undoMove],
  );

  const pendingAnalysis = useMemo(
    () => (pendingMove ? analyzeMove(pendingMove) : null),
    [pendingMove],
  );

  const activeDragLot = activeDragLotId ? lotsById.get(activeDragLotId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Topbar
        totalLots={localLots.length}
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
        allotableLotIds={allotableLotIds}
        allotementHoveredKey={allotementHoveredKey}
        fullscreenZone={fullscreenZone}
        onToggleFullscreen={toggleFullscreen}
        onHoverChange={setHoveredLotId}
      />
      <p className="footer-note">
        Vraies données Airtable. Lots <em>Epuisé</em> et dépôt ≠{" "}
        <em>Hangar</em> filtrés en amont.
      </p>
      {allotementMode ? (
        <AllotementSidebar
          groups={allotementGroups}
          lotsById={lotsById}
          hoveredKey={allotementHoveredKey}
          onHoverKey={setAllotementHoveredKey}
          onClose={toggleAllotement}
        />
      ) : null}
      <MoveConfirmModal
        analysis={pendingAnalysis}
        onConfirm={handleConfirm}
        onCancel={() => setPendingMove(null)}
      />
      <DragOverlay dropAnimation={null}>
        {activeDragLot ? (
          <div
            className={`lot ${statutClass(activeDragLot.statut)}`}
            style={{
              cursor: "grabbing",
              boxShadow: "0 8px 22px rgba(0,0,0,0.25)",
            }}
          >
            <div className="lot-num">{activeDragLot.nom}</div>
            {activeDragLot.produit ? (
              <div className="lot-produit">{activeDragLot.produit}</div>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
