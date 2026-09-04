import { type InputHTMLAttributes } from 'react';

import { cx } from '../../../lib/cx';
import { isAriaInvalid } from '../control';
import controlStyles from '../control.module.css';
import styles from './Input.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Domain-free single-line control matching the Figma Input component.
 *
 * Field owns its label, hint, error text and ARIA relationship; this component
 * only renders the native input and its visual control states.
 */
export function Input({ className, ...inputProps }: InputProps) {
  const isInvalid = isAriaInvalid(inputProps['aria-invalid']);
  const classNames = cx(
    controlStyles.control,
    controlStyles.singleLine,
    styles.input,
    isInvalid ? controlStyles.invalid : null,
    className,
  );

  return <input {...inputProps} className={classNames} />;
}
