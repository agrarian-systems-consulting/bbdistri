import "server-only";

export function isDryRun(): boolean {
  return process.env.AIRTABLE_DRY_RUN !== "false";
}

export function logDryRunMutation(label: string, payload: unknown): void {
  console.log(
    `[airtable:dry-run] ${label} — la mutation suivante n'a PAS été envoyée à Airtable :`,
    JSON.stringify(payload, null, 2),
  );
}
