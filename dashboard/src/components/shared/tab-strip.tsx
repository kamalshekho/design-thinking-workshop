/**
 * The underline tab strip over a list, each tab carrying the number of rows
 * behind it. Adapted from the clone's `application/tabs/tabs.tsx`.
 *
 * Generic over the set of views, because Anfragen's named views
 * (`ApplicationView`) and Kategorien's (`CategoryView`) are different sets
 * with the same behaviour — the two screens had a tab strip each, identical
 * down to the class strings, and a colour or spacing change had to be made
 * twice.
 */

type TabStripProps<TView extends string> = {
  /** Names the strip for a screen reader; the list the tabs filter. */
  ariaLabel: string;
  /** The views, in the order they are shown. */
  views: readonly TView[];
  labels: Record<TView, string>;
  counts: Record<TView, number>;
  current: TView;
  onChange: (view: TView) => void;
};

const TAB_CLASSNAME =
  'text-tertiary outline-focus-ring hover:text-secondary z-10 border-b-2 border-transparent px-1 pt-2 pb-3 text-sm font-semibold transition duration-150 ease-linear focus-visible:outline-2';

const SELECTED_TAB_CLASSNAME =
  'border-fuut-purple text-primary outline-focus-ring z-10 border-b-2 px-1 pt-2 pb-3 text-sm font-semibold focus-visible:outline-2';

export function TabStrip<TView extends string>({
  ariaLabel,
  views,
  labels,
  counts,
  current,
  onChange,
}: TabStripProps<TView>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="before:bg-border-secondary relative flex gap-3 before:absolute before:inset-x-0 before:bottom-0 before:h-px"
    >
      {views.map((view) => {
        const selected = view === current;

        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              onChange(view);
            }}
            className={selected ? SELECTED_TAB_CLASSNAME : TAB_CLASSNAME}
          >
            {labels[view]}
            <span className="bg-secondary text-tertiary ml-2 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums">
              {counts[view]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
