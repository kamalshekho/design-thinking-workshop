import { FormCard } from '../../components/ui/FormCard/FormCard';
import type { Content } from '../../content/types';
import styles from './ApplicationForm.module.css';

interface ConfirmationProps {
  email: string;
  content: Content;
}

export function Confirmation({ content, email }: ConfirmationProps) {
  return (
    <FormCard>
      <h1 className={styles.title}>{content.confirmation.title}</h1>
      <p className={styles.subtitle}>
        {content.confirmation.bodyBefore}
        <strong>{email}</strong>
        {content.confirmation.bodyAfter}
      </p>
      <p className={styles.subtitle}>{content.confirmation.closing}</p>
    </FormCard>
  );
}
