/**
 * The column an open `ApplicationDrawer` occupies, kept clear of the strip
 * `AppShell` renders above the screens (issue #64).
 *
 * The drawer is an `aside` with no scrim: it blocks nothing, so it may not eat
 * a click on a control it lies over, nor cover a sentence that has to be read.
 * The strip answers that by never putting anything in the drawer's column —
 * and it does so *unconditionally*, which is the point. The strip is never
 * told that a drawer is open, so nothing in it moves when one opens or closes,
 * and the list behind it holds still. Everything in the strip reads from the
 * left, so the reserved column is invisible while no drawer is there.
 *
 * It is padding rather than a width, so a bordered box — the failure notice —
 * keeps the full width of `main` and lets its right end run under the drawer,
 * which is what issue #64 asks for: a border that stops short reads as broken
 * off, while one that continues reads as continuing.
 *
 * The widths mirror `ApplicationDrawer`'s own `sm:w-[460px] lg:w-[480px]` and
 * have to be changed with them. Below `sm` the drawer is `w-full` and no
 * reserve would help, which issue #64 records as a known hole: at that width
 * the drawer is a modal in all but the attribute.
 */
export const DRAWER_RESERVE = 'sm:pr-[460px] lg:pr-[480px]';
