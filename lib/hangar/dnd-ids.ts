/**
 * Encodage/décodage des IDs draggables et droppables pour @dnd-kit.
 * Un lot multi-emplacement génère une draggable par portion → l'ID inclut l'emplacement source.
 * Les lots sans emplacement (sidebar "À placer") utilisent UNPLACED_SOURCE comme source.
 */

export const UNPLACED_SOURCE = "unplaced";

export function draggableLotId(emplacementId: string, lotId: string): string {
  return `lot|${emplacementId}|${lotId}`;
}

export function parseDraggableLotId(
  id: string,
): { emplacementId: string; lotId: string } | null {
  const parts = id.split("|");
  if (parts.length !== 3 || parts[0] !== "lot") return null;
  return { emplacementId: parts[1], lotId: parts[2] };
}

export function droppableEmplacementId(emplacementId: string): string {
  return `emp|${emplacementId}`;
}

export function parseDroppableEmplacementId(id: string): string | null {
  const parts = id.split("|");
  if (parts.length !== 2 || parts[0] !== "emp") return null;
  return parts[1];
}
