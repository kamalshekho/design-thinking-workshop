/**
 * Turns a backend error `code` into the German sentence a Staff member reads.
 *
 * Total on purpose: it takes a bare `string`, not the code union, because
 * the wire hands over whatever the backend sends — a status the contract does
 * not name carries the status's own name as its `code` (`API.md`, "Errors"),
 * and the list grows without the dashboard being rebuilt. An unknown code falls back to the general wording, so it costs a
 * Staff member precision rather than a working screen.
 */

import { de } from './de';

const codes: Record<string, string> = de.errors.codes;

/** The wording for a problem's top-level `code`. */
export function errorMessage(code: string | undefined): string {
  return (code === undefined ? undefined : codes[code]) ?? de.errors.general;
}
