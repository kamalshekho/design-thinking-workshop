import { type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cx } from '../../../lib/cx';
import styles from './Button.module.css';

export type ButtonVariant =
  'primary' | 'secondary' | 'route-blue' | 'route-purple';
export type ButtonWidth = 'auto' | 'full';

const ROUTE_VARIANT_CLASS: Partial<Record<ButtonVariant, string>> = {
  'route-blue': styles.routeBlue,
  'route-purple': styles.routePurple,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  rel?: string;
  target?: string;
  variant?: ButtonVariant;
  width?: ButtonWidth;
  isLoading?: boolean;
  loadingLabel?: string;
  /** Renders a trailing arrow icon, for CTAs that lead away from the page. */
  showArrow?: boolean;
}

/**
 * Domain-free CTA matching the Figma Button component.
 *
 * Callers supply the final label and native button behaviour; the component
 * only owns its visual variants and loading affordance.
 */
export function Button({
  'aria-label': ariaLabel,
  children,
  className,
  disabled = false,
  href,
  isLoading = false,
  loadingLabel,
  rel,
  showArrow = false,
  target,
  variant = 'primary',
  width = 'auto',
  ...buttonProps
}: ButtonProps) {
  const variantClass = ROUTE_VARIANT_CLASS[variant] ?? styles[variant];
  const classNames = cx(
    styles.button,
    variantClass,
    width === 'full' ? styles.fullWidth : null,
    className,
  );

  const label = isLoading && loadingLabel ? loadingLabel : children;
  const renderArrow = showArrow && !isLoading;

  const content = (
    <>
      {isLoading ? (
        <span aria-hidden="true" className={styles.spinner} />
      ) : null}
      <span>{label}</span>
      {renderArrow ? (
        <svg
          aria-hidden="true"
          className={styles.arrow}
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M3 8h10m-4-4 4 4-4 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      ) : null}
    </>
  );

  if (href && !disabled && !isLoading) {
    return (
      <a
        aria-label={ariaLabel}
        className={classNames}
        href={href}
        rel={rel}
        target={target}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      {...buttonProps}
      aria-busy={isLoading || undefined}
      aria-label={ariaLabel}
      className={classNames}
      disabled={disabled || isLoading}
    >
      {content}
    </button>
  );
}
