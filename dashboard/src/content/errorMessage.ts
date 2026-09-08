/**
 * Turns a backend error `code` into the German sentence a Staff member reads.
 *
 * Both functions are total on purpose: they take a bare `string`, not one of
 * the code unions, because the wire hands over whatever the backend sends —
 * a status the contract does not name carries the status's own name as its
 * `code` (`API.md`, "Errors"), and the list grows without the dashboard being
 * rebuilt. An unknown code falls back to the general wording, so it costs a
 * Staff member precision rather than a working screen.
 */

import { de } from './de';

const codes: Record<string, string> = de.errors.codes;
const fieldCodes: Record<string, string> = de.errors.fields;

/** The wording for a problem's top-level `code`. */
export function errorMessage(code: string | undefined): string {
  return (code === undefined ? undefined : codes[code]) ?? de.errors.general;
}

/**
 * The wording for one entry of a problem's `errors` array, read next to the
 * field it names.
 */
export function fieldErrorMessage(code: string | undefined): string {
  return (
    (code === undefined ? undefined : fieldCodes[code]) ?? de.errors.general
  );
}
