"use client";

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { parseAllotementKey } from "@/lib/hangar/filters";
import type { Emplacement, Lot } from "@/lib/types/domain";

type Props = {
  groups: Map<string, string[]>;
  lotsById: Map<string, Lot>;
  emplacementsById: Map<string, Emplacement>;
  hoveredKey: string | null;
  onHoverKey: (key: string | null) => void;
  onClose: () => void;
};

function parseLabel(cle: string): { code: string; libelle: string } {
  const match = cle.match(/^(ART\d+)\s*-\s*(.+)$/);
  if (!match) return { code: "", libelle: cle };
  return { code: match[1], libelle: match[2].replace(/-$/, "") };
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
    <aside className="allotement-sidebar">
      <header className="allotement-sidebar-header">
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
          className="allotement-sidebar-close"
        >
          ×
        </button>
      </header>

      {sorted.length === 0 ? (
        <p className="allotement-sidebar-empty">
          Aucun groupe d&apos;allotement parmi les lots placés.
        </p>
      ) : (
        <Accordion className="allotement-accordion">
          {sorted.map(([key, lotIds]) => {
            const { cle, statut } = parseAllotementKey(key);
            const { code, libelle } = parseLabel(cle);
            const active = hoveredKey === key;
            return (
              <AccordionItem
                key={key}
                value={key}
                className={`allotement-item ${active ? "active" : ""}`}
                onMouseEnter={() => onHoverKey(key)}
                onMouseLeave={() => onHoverKey(null)}
              >
                <AccordionTrigger className="allotement-trigger">
                  <div className="allotement-trigger-inner">
                    <div className="allotement-trigger-code">
                      {code || libelle}
                    </div>
                    <div className="allotement-trigger-badges">
                      <span className="badge-lots">{lotIds.length} lots</span>
                      <span className="badge-statut">{statut}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="allotement-content">
                  {code ? (
                    <div className="allotement-libelle">{libelle}</div>
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
