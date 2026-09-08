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
};

/**
 * There is no photo. `GET /api/v1/staff/me` carries no `avatar` field and
 * photo upload is not a feature of any screen (`API.md`), so the account card
 * and the Zuständigkeit column render initials — one code path rather than
 * two, and nothing to seed for the demo.
 */
