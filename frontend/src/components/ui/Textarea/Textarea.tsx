import { type TextareaHTMLAttributes } from 'react';

import { cx } from '../../../lib/cx';
import { isAriaInvalid } from '../control';
import controlStyles from '../control.module.css';
import styles from './Textarea.module.css';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Domain-free multiline control matching the Figma Textarea component.
 *
 * Field owns the label, hint, error text and ARIA relationship; this component
 * only renders the native textarea and its visual control states.
 */
export function Textarea({ className, ...textareaProps }: TextareaProps) {
  const isInvalid = isAriaInvalid(textareaProps['aria-invalid']);
  const classNames = cx(
    controlStyles.control,
    styles.textarea,
    isInvalid ? controlStyles.invalid : null,
    className,
  );

  return <textarea {...textareaProps} className={classNames} />;
}
