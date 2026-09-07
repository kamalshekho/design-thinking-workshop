/**
 * Zuständigkeit as a listbox rather than a native `select`.
 *
 * The rest of the drawer's fields are native elements on purpose (see
 * `ApplicationDrawer.tsx`), and this one is the exception the content forces: a
 * Staff member is identified by their photo — or their initials when they have
 * none — the way the Zuständigkeit column already identifies them, and an
 * `option` element cannot hold an image. A native select could only ever show
 * one static glyph on the closed control and plain text in the open list.
 *
 * React Aria's `Select` keeps what the native element gave for free: the label
 * names the control, typing jumps to a name, arrow keys and Escape behave, and
 * the trigger announces the current value. Two consequences of the popover are
 * handled rather than accepted — it is portalled out of the drawer's scroll
 * container, so it needs a `z-index` above the drawer's own, and its Escape
 * must not also close the drawer (`ApplicationDrawer` ignores a handled one).
 */

import { Check, ChevronDown } from '@untitledui/icons';
import {
  Button as AriaButton,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
} from 'react-aria-components';

import { Avatar } from '@/components/base/avatar/avatar';
import { de } from '@/content/de';
import type { Owner } from '@/domain/application';
import { cx } from '@/utils/cx';
import { initialsOf } from '@/utils/initials';

import { CONTROL_CLASSNAME } from './controlStyles';

/**
 * "Nicht zugewiesen" is a row in the list like any other, so it needs a key of
 * its own — a listbox has no equivalent of the native empty `option` value.
 */
const UNASSIGNED_KEY = 'unassigned';

type OwnerSelectProps = {
  /** The Owner the Application currently carries, `null` when it has none. */
  ownerId: string | null;
  owners: readonly Owner[];
  onChange: (ownerId: string | null) => void;
};

/** What one row shows: an Owner, or the absence of one. */
type OwnerOption = {
  key: string;
  name: string;
  /** Absent for a Staff member without a photo, and for "Nicht zugewiesen". */
  avatar?: string;
  /** The empty row draws the empty-user glyph instead of initials. */
  isUnassigned: boolean;
};

/**
 * The photo when the Staff member has one, their initials when not, and the
 * empty-user glyph for "Nicht zugewiesen" — the three states the Zuständigkeit
 * column shows, in the same order, so the drawer and the row agree.
 */
function OwnerAvatar({ option }: { option: OwnerOption }) {
  return (
    <Avatar
      size="xs"
      alt=""
      src={option.avatar}
      initials={option.isUnassigned ? undefined : initialsOf(option.name)}
    />
  );
}

export function OwnerSelect({ ownerId, owners, onChange }: OwnerSelectProps) {
  const options: OwnerOption[] = [
    {
      key: UNASSIGNED_KEY,
      name: de.application.unassigned,
      isUnassigned: true,
    },
    ...owners.map((owner) => ({
      key: owner.id,
      name: owner.name,
      avatar: owner.avatar,
      isUnassigned: false,
    })),
  ];

  /**
   * An `ownerId` the Owner list does not know — a Staff member who has left,
   * until issue #16 supplies the real list — still names itself on the closed
   * control rather than reading as unassigned, the same fallback the table
   * makes.
   */
  const selected =
    options.find((option) => option.key === (ownerId ?? UNASSIGNED_KEY)) ??
    ({
      key: ownerId ?? UNASSIGNED_KEY,
      name: ownerId ?? '',
      isUnassigned: false,
    } satisfies OwnerOption);

  return (
    <AriaSelect
      className="block"
      value={selected.key}
      onChange={(key) => {
        onChange(key === UNASSIGNED_KEY ? null : String(key));
      }}
    >
      <AriaLabel className="text-secondary mb-1.5 block cursor-pointer text-[13px] font-medium">
        {de.detail.owner}
      </AriaLabel>

      <AriaButton
        className={cx(
          CONTROL_CLASSNAME,
          'h-control flex cursor-pointer items-center gap-2 px-3 text-left font-medium',
        )}
      >
        <OwnerAvatar option={selected} />
        <span
          className={cx('truncate', selected.isUnassigned && 'text-tertiary')}
        >
          {selected.name}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-fg-quaternary ml-auto size-4 shrink-0"
        />
      </AriaButton>

      {/*
        Above the drawer's own `z-30`: the popover is portalled to the document,
        where the drawer's stacking context would otherwise paint over it.
      */}
      <AriaPopover
        offset={4}
        className="border-secondary bg-primary z-40 max-h-64 w-(--trigger-width) overflow-y-auto rounded-lg border p-1 shadow-lg outline-hidden"
      >
        <AriaListBox items={options} className="outline-hidden">
          {(option: OwnerOption) => (
            <AriaListBoxItem
              id={option.key}
              textValue={option.name}
              className={({ isFocused, isSelected }) =>
                cx(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden',
                  isFocused && 'bg-secondary',
                  isSelected ? 'text-primary font-medium' : 'text-secondary',
                )
              }
            >
              {({ isSelected }) => (
                <>
                  <OwnerAvatar option={option} />
                  <span className="truncate">{option.name}</span>
                  {isSelected ? (
                    <Check
                      aria-hidden="true"
                      className="text-fuut-purple ml-auto size-4 shrink-0"
                    />
                  ) : null}
                </>
              )}
            </AriaListBoxItem>
          )}
        </AriaListBox>
      </AriaPopover>
    </AriaSelect>
  );
}
