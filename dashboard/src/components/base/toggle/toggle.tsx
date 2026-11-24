/**
 * Clone path: `components/base/toggle/toggle.tsx`. Two changes, both #116:
 * - the track does not shrink (`shrink-0`);
 * - the track carries `tap-target`.
 */

import type { ReactNode } from 'react';
import type { SwitchFieldProps as AriaSwitchFieldProps } from 'react-aria-components';
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  Text as AriaText,
} from 'react-aria-components';

import { cx } from '@/utils/cx';

interface ToggleBaseProps {
  size?: 'sm' | 'md';
  slim?: boolean;
  className?: string;
  isHovered?: boolean;
  isFocusVisible?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}

const ToggleBase = ({
  className,
  isHovered,
  isDisabled,
  isFocusVisible,
  isSelected,
  slim,
  size = 'sm',
}: ToggleBaseProps) => {
  const styles = {
    default: {
      sm: {
        root: 'h-5 w-9 p-0.5',
        switch: cx('size-4', isSelected && 'translate-x-4'),
      },
      md: {
        root: 'h-6 w-11 p-0.5',
        switch: cx('size-5', isSelected && 'translate-x-5'),
      },
    },
    slim: {
      sm: {
        root: 'h-4 w-8',
        switch: cx('size-4', isSelected && 'translate-x-4'),
      },
      md: {
        root: 'h-5 w-10',
        switch: cx('size-5', isSelected && 'translate-x-5'),
      },
    },
  };

  const classes = slim ? styles.slim[size] : styles.default[size];

  return (
    <div
      className={cx(
        'bg-tertiary ring-secondary outline-focus-ring tap-target ring-hairline relative shrink-0 cursor-pointer rounded-full transition duration-150 ease-linear ring-inset',
        isSelected && 'bg-brand-solid',
        isSelected && isHovered && 'bg-brand-solid_hover',
        isDisabled && 'cursor-not-allowed opacity-50',
        isFocusVisible && 'outline-2 outline-offset-2',

        slim && 'ring-1',
        slim && isSelected && 'ring-transparent',
        classes.root,
        className,
      )}
    >
      <div
        style={{
          transition:
            'transform 0.15s ease-in-out, translate 0.15s ease-in-out, border-color 0.1s linear, background-color 0.1s linear',
        }}
        className={cx(
          'bg-fg-white rounded-full shadow-sm',

          slim && 'shadow-xs',
          slim && 'border-toggle-border border',
          slim && isSelected && 'border-toggle-slim-border_pressed',
          slim &&
            isSelected &&
            isHovered &&
            'border-toggle-slim-border_pressed-hover',

          classes.switch,
        )}
      />
    </div>
  );
};

const styles = {
  sm: {
    root: 'gap-2',
    label: 'text-sm font-medium',
    hint: 'text-sm',
    hintIndent: 'pl-11',
    slimHintIndent: 'pl-10',
  },
  md: {
    root: 'gap-3',
    label: 'text-md font-medium',
    hint: 'mt-0.5 text-md',
    hintIndent: 'pl-14',
    slimHintIndent: 'pl-13',
  },
};

interface ToggleProps extends AriaSwitchFieldProps {
  size?: 'sm' | 'md';
  label?: string;
  hint?: ReactNode;
  slim?: boolean;
}

export const Toggle = ({
  label,
  hint,
  className,
  size = 'sm',
  slim,
  ...ariaSwitchProps
}: ToggleProps) => {
  return (
    <AriaSwitchField
      {...ariaSwitchProps}
      className={(state) =>
        cx(
          'relative flex w-max flex-col items-start',
          state.isDisabled && 'cursor-not-allowed',
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      <AriaSwitchButton className={cx('flex items-start', styles[size].root)}>
        {({ isSelected, isDisabled, isFocusVisible, isHovered }) => (
          <>
            <ToggleBase
              slim={slim}
              size={size}
              isHovered={isHovered}
              isDisabled={isDisabled}
              isFocusVisible={isFocusVisible}
              isSelected={isSelected}
              className={slim ? 'mt-0.5' : ''}
            />

            {label && (
              <p
                className={cx('text-secondary select-none', styles[size].label)}
              >
                {label}
              </p>
            )}
          </>
        )}
      </AriaSwitchButton>

      {hint && (
        <AriaText
          slot="description"
          className={cx(
            'text-tertiary',
            styles[size].hint,
            slim ? styles[size].slimHintIndent : styles[size].hintIndent,
          )}
        >
          {hint}
        </AriaText>
      )}
    </AriaSwitchField>
  );
};
