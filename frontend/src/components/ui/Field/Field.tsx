import { type ReactNode, useId } from 'react';

import styles from './Field.module.css';

/**
 * ARIA wiring handed to the control. Spreading this is the only supported way
 * to render a control inside a Field — it is what guarantees the label, hint
 * and error are actually announced.
 */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
  'aria-required': boolean | undefined;
}

interface FieldProps {
  label: string;
  /** Optional helper text, rendered below the control */
  hint?: string;
  /** German error text, already resolved from an error code */
  error?: string;
  required?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label, control, hint and inline error as one block.
 *
 * This component knows nothing about the domain: it receives finished strings.
 * That is what lets the same field be reused by the English staff dashboard
 * later (see README.md, "Component rules").
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null]
      .filter((value): value is string => value !== null)
      .join(' ') || undefined;

  return (
    <div className={styles.group}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      <div className={styles.control}>
        {children({
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          'aria-required': required ? true : undefined,
        })}
      </div>

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {/* The error text always states what to do; colour alone would fail
          DESIGN.md section 32. */}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
