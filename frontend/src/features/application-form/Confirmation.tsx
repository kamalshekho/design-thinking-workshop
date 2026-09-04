import { FormCard } from '../../components/ui/FormCard/FormCard';
import { de } from '../../content/de';
import styles from './ApplicationForm.module.css';

interface ConfirmationProps {
  email: string;
}

export function Confirmation({ email }: ConfirmationProps) {
  return (
    <FormCard>
      <h1 className={styles.title}>{de.confirmation.title}</h1>
      <p className={styles.subtitle}>
        {de.confirmation.bodyBefore}
        <strong>{email}</strong>
        {de.confirmation.bodyAfter}
      </p>
      <p className={styles.subtitle}>{de.confirmation.closing}</p>
    </FormCard>
  );
}
