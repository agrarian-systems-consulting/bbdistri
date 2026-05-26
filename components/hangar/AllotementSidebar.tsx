"use client";

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { parseAllotementKey } from "@/lib/hangar/filters";
import { statutClass } from "@/lib/hangar/statut";
import type { Emplacement, Lot, StatutTriage } from "@/lib/types/domain";

type Props = {
  groups: Map<string, string[]>;
  lotsById: Map<string, Lot>;
  emplacementsById: Map<string, Emplacement>;
  hoveredKey: string | null;
  onHoverKey: (key: string | null) => void;
  onClose: () => void;
};

/**
 * Parse "ART0205 - Ecart de triage protéagineux bio-Alimentation animale"
 * en { code, libelle, destination } selon le format Airtable
 *   "CODE - Libellé-Destination" (destination peut être vide).
 */
function parseLabel(cle: string): {
  code: string;
  libelle: string;
  destination: string;
} {
  const sepCode = cle.indexOf(" - ");
  if (sepCode === -1) {
    return { code: "", libelle: cle, destination: "" };
  }
  const code = cle.slice(0, sepCode).trim();
  const reste = cle.slice(sepCode + 3);
  const sepDest = reste.lastIndexOf("-");
  if (sepDest === -1) return { code, libelle: reste.trim(), destination: "" };
  return {
    code,
    libelle: reste.slice(0, sepDest).trim(),
    destination: reste.slice(sepDest + 1).trim(),
  };
}

export function AllotementSidebar({
  groups,
  lotsById,
  emplacementsById,
  hoveredKey,
  onHoverKey,
  onClose,
}: Props) {
  const sorted = useMemo(
    () =>
      Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length),
    [groups],
  );
  const totalLots = sorted.reduce((acc, [, ids]) => acc + ids.length, 0);

  return (
    <aside className="side-panel allotement-sidebar">
      <header className="side-panel-header">
        <div>
          <h2>Allotements possibles</h2>
          <p>
            {groups.size} groupe{groups.size > 1 ? "s" : ""} · {totalLots} lots
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la liste des allotements"
          className="side-panel-close"
        >
          ×
        </button>
      </header>

      {sorted.length === 0 ? (
        <p className="side-panel-empty">
          Aucun groupe d&apos;allotement parmi les lots placés.
        </p>
      ) : (
        <Accordion
          className="allotement-accordion"
          value={hoveredKey ? [hoveredKey] : []}
          onValueChange={(values: unknown) => {
            const arr = Array.isArray(values) ? (values as string[]) : [];
            onHoverKey(arr[arr.length - 1] ?? null);
          }}
        >
          {sorted.map(([key, lotIds]) => {
            const { cle, statut } = parseAllotementKey(key);
            const { code, libelle, destination } = parseLabel(cle);
            const active = hoveredKey === key;
            const statutKlass = statutClass(statut as StatutTriage);
            return (
              <AccordionItem
                key={key}
                value={key}
                className={`allotement-item ${active ? "active" : ""}`}
              >
                <AccordionTrigger className="allotement-trigger">
                  <div className="allotement-trigger-inner">
                    <div className="allotement-trigger-title">
                      {code ? (
                        <span className="allotement-trigger-code">{code}</span>
                      ) : null}
                      <span className="allotement-trigger-libelle">
                        {libelle}
                      </span>
                    </div>
                    <div className="allotement-trigger-badges">
                      <span className="badge-lots">{lotIds.length} lots</span>
                      <span className={`badge-statut ${statutKlass}`}>
                        {statut}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="allotement-content">
                  {destination ? (
                    <div className="allotement-destination">
                      Destination : <strong>{destination}</strong>
                    </div>
                  ) : null}
                  <ul className="allotement-lots-list">
                    {lotIds.map((lotId) => {
                      const lot = lotsById.get(lotId);
                      if (!lot) return null;
                      const empNames = lot.emplacementIds
                        .map((eid) => emplacementsById.get(eid)?.name)
                        .filter((n): n is string => Boolean(n));
                      return (
                        <li key={lotId} className="allotement-lot-row">
                          <span className="allotement-lot-nom">{lot.nom}</span>
                          <div className="allotement-lot-empls">
                            {empNames.length > 0 ? (
                              empNames.map((name) => (
                                <span key={name} className="emp-badge">
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="emp-badge emp-badge-empty">
                                —
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </aside>
  );
}
