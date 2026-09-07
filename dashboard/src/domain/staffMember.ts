/**
 * The Staff member, as `CONTEXT.md` defines them: the person who works the
 * Applications. One is signed in at a time (`A16`).
 *
 * The type used to be `NavAccountType`, exported by the copied sidebar's
 * account card — so a domain concept was named after the component that
 * happened to render it, and `signIn`, `LoginScreen` and `App` all reached
 * into `src/components/` for it. The shape is unchanged; the card now takes
 * this type as its prop.
 */

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  /**
   * Photo of the Staff member, if there is one. Optional on purpose: one
   * without a photo falls back to initials, so the account card and the
   * Zuständigkeit column keep the same shape either way.
   */
  avatar?: string;
};
