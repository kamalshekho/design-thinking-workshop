import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

import { cx } from '../../../lib/cx';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'type'
> {
  children: ReactNode;
}

/**
 * Domain-free consent-style checkbox matching the Figma Checkbox component.
 *
 * Its label is supplied as children so callers can provide their own text and
 * links without coupling this UI component to applicant-facing copy.
 */
export function Checkbox({
  children,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  ...inputProps
}: CheckboxProps) {
  const generatedId = useId();
  const labelId = useId();
  const inputId = id ?? generatedId;
  const labelledBy = cx(ariaLabelledBy, labelId);
  const classNames = cx(styles.checkbox, className);

  return (
    <div className={styles.container}>
      <input
        {...inputProps}
        aria-labelledby={labelledBy}
        className={classNames}
        id={inputId}
        type="checkbox"
      />
      <span className={styles.label} id={labelId}>
        {children}
      </span>
    </div>
  );
}
