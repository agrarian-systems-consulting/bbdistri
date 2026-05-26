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
  UNPLACED_SOURCE,
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
import { LotDetailModal, type LotPatch } from "./LotDetailModal";
import { MoveConfirmModal } from "./MoveConfirmModal";
import { Topbar, type SidebarKind } from "./Topbar";
import { UnplacedSidebar } from "./UnplacedSidebar";

type Props = {
  lots: Lot[];
  emplacements: Emplacement[];
  caissonsById: Record<string, string>;
  destinationsById: Record<string, string>;
};

type PendingMove = {
  lot: Lot;
  sourceEmp: Emplacement;
  destEmp: Emplacement;
};

async function patchLot(
  lotId: string,
  payload: {
    emplacementIds?: string[];
    caissonIds?: string[];
    destinationIds?: string[];
    statut?: string;
    bioC2?: string | null;
    commentaire?: string | null;
  },
): Promise<void> {
  const res = await fetch(`/api/lots/${lotId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH lot ${lotId} échoué (${res.status}) : ${body}`);
  }
}

async function patchLotEmplacements(
  lotId: string,
  emplacementIds: string[],
): Promise<void> {
  return patchLot(lotId, { emplacementIds });
}

export function HangarView({
  lots,
  emplacements,
  caissonsById,
  destinationsById,
}: Props) {
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [fullscreenZone, setFullscreenZone] = useState<ZoneType | null>(null);
  const [activeStatuts, setActiveStatuts] = useState<Set<StatutTriage>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [openSidebar, setOpenSidebar] = useState<SidebarKind | null>(null);
  const [allotementHoveredKey, setAllotementHoveredKey] = useState<
    string | null
  >(null);
  const [activeDragLotId, setActiveDragLotId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [localLots, setLocalLots] = useState<Lot[]>(lots);

  useEffect(() => {
    setLocalLots(lots);
  }, [lots]);

  const placedLots = useMemo(
    () => localLots.filter((l) => l.emplacementIds.length > 0),
    [localLots],
  );
  const unplacedLots = useMemo(
    () => localLots.filter((l) => l.emplacementIds.length === 0),
    [localLots],
  );

  const lotsParEmp = useMemo(
    () => groupLotsByEmplacement(placedLots),
    [placedLots],
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
    if (openSidebar === "allotements") {
      document.body.classList.add("allotement-on");
      return () => document.body.classList.remove("allotement-on");
    }
    if (openSidebar === "unplaced") {
      document.body.classList.add("unplaced-on");
      return () => document.body.classList.remove("unplaced-on");
    }
  }, [openSidebar]);

  useEffect(() => {
    if (openSidebar !== "allotements") setAllotementHoveredKey(null);
  }, [openSidebar]);

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

  const toggleSidebar = useCallback((kind: SidebarKind) => {
    setOpenSidebar((current) => (current === kind ? null : kind));
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

  const handleLotClick = useCallback((lot: Lot) => {
    setEditingLotId(lot.id);
  }, []);

  const undoLotPatch = useCallback(
    async (lot: Lot, previous: Partial<Lot>) => {
      setLocalLots((prev) =>
        prev.map((l) => (l.id === lot.id ? { ...l, ...previous } : l)),
      );
      try {
        const payload: {
          statut?: string;
          bioC2?: string | null;
          commentaire?: string | null;
          caissonIds?: string[];
          emplacementIds?: string[];
          destinationIds?: string[];
        } = {};
        if (previous.statut !== undefined) payload.statut = previous.statut;
        if (previous.bioC2 !== undefined) payload.bioC2 = previous.bioC2;
        if (previous.commentaire !== undefined)
          payload.commentaire = previous.commentaire;
        if (previous.caissonIds !== undefined)
          payload.caissonIds = previous.caissonIds;
        if (previous.emplacementIds !== undefined)
          payload.emplacementIds = previous.emplacementIds;
        if (previous.destinationIds !== undefined)
          payload.destinationIds = previous.destinationIds;
        await patchLot(lot.id, payload);
        toast.success(`Lot ${lot.nom} : modification annulée`);
      } catch (err) {
        toast.error("Annulation échouée", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [],
  );

  const handleSaveLotPatch = useCallback(
    async (lot: Lot, patch: LotPatch) => {
      const previous: Partial<Lot> = {};
      if (patch.statut !== undefined) previous.statut = lot.statut;
      if (patch.bioC2 !== undefined) previous.bioC2 = lot.bioC2;
      if (patch.commentaire !== undefined)
        previous.commentaire = lot.commentaire;
      if (patch.caissonIds !== undefined)
        previous.caissonIds = lot.caissonIds;
      if (patch.emplacementIds !== undefined)
        previous.emplacementIds = lot.emplacementIds;
      if (patch.destinationIds !== undefined)
        previous.destinationIds = lot.destinationIds;

      setLocalLots((prev) =>
        prev.map((l) => (l.id === lot.id ? { ...l, ...patch } : l)),
      );

      try {
        await patchLot(lot.id, {
          statut: patch.statut,
          bioC2: patch.bioC2,
          commentaire: patch.commentaire,
          caissonIds: patch.caissonIds,
          emplacementIds: patch.emplacementIds,
          destinationIds: patch.destinationIds,
        });
        toast(`Lot ${lot.nom} mis à jour`, {
          description: patch.statut
            ? `Statut → ${patch.statut}`
            : "Modification enregistrée",
          action: {
            label: "Annuler",
            onClick: () => undoLotPatch(lot, previous),
          },
          duration: 5000,
        });
      } catch (err) {
        setLocalLots((prev) =>
          prev.map((l) => (l.id === lot.id ? { ...l, ...previous } : l)),
        );
        toast.error("Modification échouée", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [undoLotPatch],
  );

  const placeUnplaced = useCallback(
    async (lot: Lot, destEmp: Emplacement) => {
      const previousIds = [...lot.emplacementIds];
      const newIds = [destEmp.id];
      applyLocalEmplacementsUpdate(lot.id, newIds);
      try {
        await patchLotEmplacements(lot.id, newIds);
        toast(`Lot ${lot.nom} placé en ${destEmp.name}`, {
          action: {
            label: "Annuler",
            onClick: () => undoMove(lot, previousIds),
          },
          duration: 5000,
        });
      } catch (err) {
        applyLocalEmplacementsUpdate(lot.id, previousIds);
        toast.error("Placement échoué", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [applyLocalEmplacementsUpdate, undoMove],
  );

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
      const destEmp = empsById.get(dst);
      if (!lot || !destEmp) return;

      if (src.emplacementId === UNPLACED_SOURCE) {
        void placeUnplaced(lot, destEmp);
        return;
      }

      const sourceEmp = empsById.get(src.emplacementId);
      if (!sourceEmp) return;
      setPendingMove({ lot, sourceEmp, destEmp });
    },
    [empsById, lotsById, placeUnplaced],
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
        unplacedCount={unplacedLots.length}
        activeStatuts={activeStatuts}
        searchQuery={searchQuery}
        openSidebar={openSidebar}
        onToggleStatut={toggleStatut}
        onSearchChange={setSearchQuery}
        onToggleSidebar={toggleSidebar}
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
        onLotClick={handleLotClick}
      />
      <p className="footer-note">
        Vraies données Airtable. Lots <em>Epuisé</em> et dépôt ≠{" "}
        <em>Hangar</em> filtrés en amont.
      </p>
      {openSidebar === "allotements" ? (
        <AllotementSidebar
          groups={allotementGroups}
          lotsById={lotsById}
          emplacementsById={empsById}
          hoveredKey={allotementHoveredKey}
          onHoverKey={setAllotementHoveredKey}
          onClose={() => setOpenSidebar(null)}
        />
      ) : null}
      {openSidebar === "unplaced" ? (
        <UnplacedSidebar
          lots={unplacedLots}
          onClose={() => setOpenSidebar(null)}
          onLotClick={handleLotClick}
        />
      ) : null}
      <MoveConfirmModal
        analysis={pendingAnalysis}
        onConfirm={handleConfirm}
        onCancel={() => setPendingMove(null)}
      />
      <LotDetailModal
        lot={editingLotId ? (lotsById.get(editingLotId) ?? null) : null}
        emplacementsById={empsById}
        caissonsById={caissonsById}
        destinationsById={destinationsById}
        onClose={() => setEditingLotId(null)}
        onSave={handleSaveLotPatch}
      />
      <DragOverlay dropAnimation={null}>
        {activeDragLot ? (
          <div
            className={`lot ${statutClass(activeDragLot.statut)} ${
              fullscreenZone ? "lot-overlay-fullscreen" : ""
            }`}
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
