import styles from './App.module.css';

/**
 * Placeholder shell. It exists so `npm run dev` renders something and so the
 * token layer is exercised end to end; it holds no applicant-facing copy.
 *
 * The first screen ported from Figma replaces the card contents. See
 * ../../README.md for how a ported component is expected to look.
 */
export function App() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.content}>
          <h1 className={styles.title}>ichbinhier</h1>
          <p className={styles.note}>
            Project shell. The applicant form is ported from Figma into
            <code> src/features/application-form/</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
