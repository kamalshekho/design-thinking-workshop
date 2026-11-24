/**
 * Clone path: `components/base/input/input.tsx`. One change: the password
 * visibility button carries `tap-target` (#116).
 *
 * Prop comments that only restate the prop name are dropped.
 */

import { Eye, EyeOff, HelpCircle, InfoCircle } from '@untitledui/icons';
import {
  type ComponentType,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useContext,
  useState,
} from 'react';
import type {
  InputProps as AriaInputProps,
  TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import {
  Button as AriaButton,
  Group as AriaGroup,
  Input as AriaInput,
  TextField as AriaTextField,
} from 'react-aria-components';

import { HintText } from '@/components/base/input/hint-text';
import { Label } from '@/components/base/input/label';
import { Tooltip, TooltipTrigger } from '@/components/base/tooltip/tooltip';
import { de } from '@/content/de';
import { cx, sortCx } from '@/utils/cx';

interface InputBaseProps extends Omit<AriaInputProps, 'size'> {
  tooltip?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  iconClassName?: string;
  inputClassName?: string;
  wrapperClassName?: string;
  tooltipClassName?: string;
  shortcut?: string | boolean;
  ref?: Ref<HTMLInputElement>;
  groupRef?: Ref<HTMLDivElement>;
  /** Icon component to display on the left side of the input. */
  icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
}

const InputBase = ({
  ref,
  tooltip,
  shortcut,
  groupRef,
  size = 'md',
  isInvalid,
  isDisabled,
  isRequired,
  icon: Icon,
  placeholder,
  wrapperClassName,
  tooltipClassName,
  inputClassName,
  iconClassName,
  type = 'text',
  ...inputProps
}: InputBaseProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Check if the input has a leading icon or tooltip
  const hasTrailingIcon = tooltip || isInvalid;
  const hasLeadingIcon = Icon;

  // If the input is inside a `TextFieldContext`, use its context to simplify applying styles
  const context = useContext(TextFieldContext);

  const inputSize = context.size || size;

  const sizes = sortCx({
    sm: {
      root: cx(
        'px-3 py-2 text-sm',
        hasLeadingIcon && 'pl-9',
        hasTrailingIcon && 'pr-9',
      ),
      iconLeading: 'left-3 size-4 stroke-icon-medium',
      iconTrailing: 'right-3',
      shortcut: 'pr-1.5',
    },
    md: {
      root: cx(
        'px-3 py-2 text-md',
        hasLeadingIcon && 'pl-10',
        hasTrailingIcon && 'pr-9',
      ),
      iconLeading: 'left-3 size-5',
      iconTrailing: 'right-3',
      shortcut: 'pr-2',
    },
    lg: {
      root: cx(
        'px-3.5 py-2.5 text-md',
        hasLeadingIcon && 'pl-10.5',
        hasTrailingIcon && 'pr-9.5',
      ),
      iconLeading: 'left-3.5 size-5',
      iconTrailing: 'right-3.5',
      shortcut: 'pr-2.5',
    },
  });

  return (
    <AriaGroup
      {...{ isDisabled, isInvalid }}
      ref={groupRef}
      className={({ isFocusWithin, isDisabled, isInvalid }) =>
        cx(
          'group/input bg-primary ring-primary relative flex w-full flex-row place-content-center place-items-center rounded-lg shadow-xs ring-1 transition-shadow duration-100 ease-linear ring-inset',

          isFocusWithin && !isDisabled && 'ring-brand ring-2',

          // Disabled state styles
          isDisabled && 'cursor-not-allowed opacity-50',
          'group-disabled:cursor-not-allowed group-disabled:opacity-50',

          // Invalid state styles
          isInvalid && 'ring-error_subtle',
          'group-invalid:ring-error_subtle',

          // Invalid state with focus-within styles
          isInvalid && isFocusWithin && 'ring-error ring-2',
          isFocusWithin && 'group-invalid:ring-error group-invalid:ring-2',

          context.wrapperClassName,
          wrapperClassName,
        )
      }
    >
      {Icon && (
        <Icon
          className={cx(
            'text-fg-quaternary pointer-events-none absolute',
            sizes[inputSize].iconLeading,
            context.iconClassName,
            iconClassName,
          )}
        />
      )}

      {/* Input field */}
      <AriaInput
        {...inputProps}
        ref={ref}
        required={isRequired}
        type={type === 'password' && isPasswordVisible ? 'text' : type}
        placeholder={placeholder}
        className={cx(
          'text-primary placeholder:text-placeholder autofill:text-primary m-0 w-full bg-transparent ring-0 outline-hidden autofill:rounded-lg disabled:cursor-not-allowed',
          sizes[inputSize].root,
          context.inputClassName,
          inputClassName,
        )}
      />

      {/* Tooltip and help icon */}
      {tooltip && type !== 'password' && (
        <Tooltip title={tooltip} placement="top">
          <TooltipTrigger
            className={cx(
              'text-fg-quaternary hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover absolute cursor-pointer transition duration-100 ease-linear group-invalid/input:hidden',
              sizes[inputSize].iconTrailing,
              context.tooltipClassName,
              tooltipClassName,
            )}
          >
            <HelpCircle className="stroke-icon-medium size-4" />
          </TooltipTrigger>
        </Tooltip>
      )}

      {/* Invalid icon */}
      {type !== 'password' && (
        <InfoCircle
          className={cx(
            'text-fg-error-secondary stroke-icon-medium pointer-events-none absolute hidden size-4 group-invalid/input:block',
            sizes[inputSize].iconTrailing,
            context.tooltipClassName,
            tooltipClassName,
          )}
        />
      )}

      {/* Password visibility toggle */}
      {type === 'password' && (
        <AriaButton
          // German, like every other label a Staff member reads (`A6`).
          aria-label={de.fields.togglePassword}
          onClick={() => {
            setIsPasswordVisible(!isPasswordVisible);
          }}
          className={cx(
            'text-fg-quaternary hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover tap-target absolute flex cursor-pointer items-center justify-center transition duration-100 ease-linear focus:outline-hidden',
            sizes[inputSize].iconTrailing,
          )}
        >
          {isPasswordVisible ? (
            <EyeOff className="stroke-icon-medium size-4" />
          ) : (
            <Eye className="stroke-icon-medium size-4" />
          )}
        </AriaButton>
      )}

      {/* Shortcut */}
      {shortcut && (
        <div
          className={cx(
            'to-bg-primary pointer-events-none absolute inset-y-0.5 right-0.5 z-10 hidden items-center rounded-r-[inherit] bg-linear-to-r from-transparent to-40% pl-8 md:flex',
            sizes[inputSize].shortcut,
          )}
        >
          <span
            aria-hidden="true"
            className="text-quaternary ring-secondary pointer-events-none rounded px-1 py-px text-xs font-medium ring-1 select-none ring-inset"
          >
            {typeof shortcut === 'string' ? shortcut : '⌘K'}
          </span>
        </div>
      )}
    </AriaGroup>
  );
};

InputBase.displayName = 'InputBase';

type TextFieldContextProps = Partial<
  Pick<
    InputBaseProps,
    | 'size'
    | 'wrapperClassName'
    | 'inputClassName'
    | 'iconClassName'
    | 'tooltipClassName'
  >
>;

const TextFieldContext = createContext<TextFieldContextProps>({});

interface TextFieldProps extends AriaTextFieldProps, TextFieldContextProps {}

const TextField = ({
  className,
  size = 'md',
  inputClassName,
  wrapperClassName,
  iconClassName,
  tooltipClassName,
  ...props
}: TextFieldProps) => {
  return (
    <TextFieldContext.Provider
      value={{
        inputClassName,
        wrapperClassName,
        iconClassName,
        tooltipClassName,
        size,
      }}
    >
      <AriaTextField
        {...props}
        data-input-wrapper
        data-input-size={size}
        className={(state) =>
          cx(
            'group flex h-max w-full flex-col items-start justify-start gap-1.5',
            typeof className === 'function' ? className(state) : className,
          )
        }
      />
    </TextFieldContext.Provider>
  );
};

TextField.displayName = 'TextField';

export interface InputProps
  extends
    AriaTextFieldProps,
    Pick<
      InputBaseProps,
      | 'ref'
      | 'placeholder'
      | 'icon'
      | 'shortcut'
      | 'tooltip'
      | 'groupRef'
      | 'size'
      | 'wrapperClassName'
      | 'inputClassName'
      | 'iconClassName'
      | 'tooltipClassName'
    > {
  /** Label text for the input */
  label?: string;
  /** Helper text displayed below the input */
  hint?: ReactNode;
  /** Whether to hide required indicator from label */
  hideRequiredIndicator?: boolean;
}

export const Input = ({
  size = 'md',
  placeholder,
  icon: Icon,
  label,
  hint,
  shortcut,
  hideRequiredIndicator,
  className,
  ref,
  groupRef,
  tooltip,
  iconClassName,
  inputClassName,
  wrapperClassName,
  tooltipClassName,
  type = 'text',
  ...props
}: InputProps) => {
  return (
    <TextField
      aria-label={!label ? placeholder : undefined}
      {...props}
      size={size}
      className={className}
    >
      {({ isRequired, isInvalid }) => (
        <>
          {label && (
            <Label
              isRequired={
                hideRequiredIndicator ? !hideRequiredIndicator : isRequired
              }
              isInvalid={isInvalid}
            >
              {label}
            </Label>
          )}

          <InputBase
            {...{
              ref,
              groupRef,
              size,
              placeholder,
              icon: Icon,
              shortcut,
              iconClassName,
              inputClassName,
              wrapperClassName,
              tooltipClassName,
              tooltip,
              type,
            }}
          />

          {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
        </>
      )}
    </TextField>
  );
};

Input.displayName = 'Input';
