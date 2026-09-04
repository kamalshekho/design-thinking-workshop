import type { ReactNode } from 'react';

import styles from './FormCard.module.css';

interface FormCardProps {
  children: ReactNode;
}

/**
 * Domain-free white card matching the Figma Form Card (DESIGN.md section 14).
 *
 * It only owns the surface — width, padding, radius and shadow. Callers
 * supply the content, so the same shell can hold the initial route selector,
 * the full application form or the confirmation view.
 */
export function FormCard({ children }: FormCardProps) {
  return <div className={styles.card}>{children}</div>;
}
