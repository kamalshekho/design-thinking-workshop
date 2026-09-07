import { Menu02, X as CloseIcon } from '@untitledui/icons';
import type { PropsWithChildren } from 'react';
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components';

import { AssociationWordmark } from '@/components/foundations/logo/association-wordmark';
import { de } from '@/content/de';
import { cx } from '@/utils/cx';

/**
 * Copied from the Untitled UI clone
 * (`components/application/app-navigation/base-components/mobile-header.tsx`).
 *
 * Changed: the association wordmark stands in for `UntitledLogo`, the labels
 * come from `content/de.ts`, and the overlay fades with plain Tailwind classes
 * rather than the `tailwindcss-animate` plugin, which this application does
 * not carry.
 */
export const MobileNavigationHeader = ({ children }: PropsWithChildren) => {
  return (
    <AriaDialogTrigger>
      <header className="border-secondary bg-primary flex h-14 items-center justify-between border-b p-3 pl-4 lg:hidden">
        <AssociationWordmark />

        <AriaButton
          aria-label={de.navigation.openMenu}
          className="group bg-primary text-fg-secondary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary_hover flex items-center justify-center rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Menu02 className="size-6 transition duration-200 ease-in-out group-aria-expanded:opacity-0" />
          <CloseIcon className="absolute size-6 opacity-0 transition duration-200 ease-in-out group-aria-expanded:opacity-100" />
        </AriaButton>
      </header>

      <AriaModalOverlay
        isDismissable
        className={({ isEntering, isExiting }) =>
          cx(
            'bg-overlay/70 fixed inset-0 z-50 cursor-pointer pr-16 backdrop-blur-md transition-opacity duration-300 ease-in-out lg:hidden',
            isEntering && 'opacity-0',
            isExiting && 'opacity-0 duration-200',
          )
        }
      >
        {({ state }) => (
          <>
            <AriaButton
              aria-label={de.navigation.closeMenu}
              onPress={() => {
                state.close();
              }}
              className="text-fg-white/70 outline-focus-ring hover:text-fg-white fixed top-2.5 right-3 flex cursor-pointer items-center justify-center rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <CloseIcon className="size-6" />
            </AriaButton>

            <AriaModal className="w-full max-w-74 cursor-auto will-change-transform">
              <AriaDialog
                aria-label={de.navigation.label}
                className="h-dvh outline-hidden focus:outline-hidden"
              >
                {children}
              </AriaDialog>
            </AriaModal>
          </>
        )}
      </AriaModalOverlay>
    </AriaDialogTrigger>
  );
};
