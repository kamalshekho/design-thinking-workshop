/**
 * Every cache key, in one module.
 *
 * The Applications key is read by its own query, by the live stream, and by
 * every write that touches the list — and a key spelled at each of those
 * places would have the stream importing a query hook for a string
 * (ADR-0006). Keys are flat and take no argument: the dashboard holds each
 * list whole, so there is no filter or page to key by (`API.md`, "Scope").
 */

export const queryKeys = {
  /** `GET /me`, or `null` while nobody is signed in. */
  signedInStaffMember: ['signedInStaffMember'] as const,
  applications: ['applications'] as const,
  /** The state history behind Übersicht's sparklines. */
  stateChanges: ['stateChanges'] as const,
  categories: ['categories'] as const,
  /** `GET /members` — the Owners an Application can be assigned to. */
  staffMembers: ['staffMembers'] as const,
};
